import 'dart:math';

import 'package:supabase_flutter/supabase_flutter.dart';

import '../billing_can.dart';
import '../net.dart';

/// Thrown by [OrganizerApi.addWalkIn] for a user-facing reason the walk-in
/// couldn't be added (event ended, at capacity, plan limit) — distinct from a
/// plain network/exception so the sheet can show the real reason instead of
/// a generic "check your connection" message.
class WalkInBlockedException implements Exception {
  final String message;
  const WalkInBlockedException(this.message);
}

/// Thrown by [OrganizerApi.addGroup] for a user-facing reason the batch
/// couldn't be added (event ended, at capacity, plan limit, bad input).
class GroupRegisterBlockedException implements Exception {
  final String message;
  const GroupRegisterBlockedException(this.message);
}

/// One seat in a group/bulk registration.
class GroupSeat {
  final String ticketTypeId;
  final String name;
  final String email;
  final String? whatsapp;
  const GroupSeat({
    required this.ticketTypeId,
    required this.name,
    required this.email,
    this.whatsapp,
  });
}

/// Direct-Supabase writes for the Organize shell that the shared
/// [EventeraApi] doesn't cover. Mobile talks to Supabase under RLS
/// (owner / own-row / public-insert policies) — never the cookie-authed
/// Next.js API routes. Mirrors the web feature data shapes:
///  - `event_pages` (owner_all RLS)      → schedule + publish visibility
///  - `registrations` (public_insert RLS) → at-the-door walk-ins
class OrganizerApi {
  const OrganizerApi();

  /// Create / update the event's `event_pages` row so the event actually
  /// carries a schedule (date, venue, city) and resolves on the public side.
  ///
  /// The web `/api/events/create` always seeds a draft `event_pages` row;
  /// mobile-created events used to skip this and came out schedule-less. We
  /// upsert on `event_id` (its unique key) so it's safe to call repeatedly.
  /// `title` is always sent because the column is NOT NULL — on the insert
  /// path an omitted title would fail; on the update path Postgres only
  /// touches the columns we provide, so an existing title is preserved when
  /// we pass the current one.
  Future<void> upsertEventPage(
    String eventId, {
    required String title,
    DateTime? startsAt,
    String? venueName,
    String? city,
    bool? isPublic,
  }) async {
    final payload = <String, dynamic>{
      'event_id': eventId,
      'title': title.trim().isEmpty ? 'Untitled event' : title.trim(),
      if (startsAt != null) 'starts_at': startsAt.toUtc().toIso8601String(),
      if (venueName != null && venueName.trim().isNotEmpty)
        'venue_name': venueName.trim(),
      if (city != null && city.trim().isNotEmpty) 'city': city.trim(),
      'is_public': ?isPublic,
    };
    await supa.from('event_pages').upsert(payload, onConflict: 'event_id');
  }

  /// Keep the public event page's visibility in step with the event's
  /// published status. Publishing flips `events.status` (handled by
  /// [EventeraApi.setPublished]); this flips `event_pages.is_public` so the
  /// discovery / registration side matches. Upsert guarantees a row exists
  /// even for events created before schedule seeding shipped.
  Future<void> setEventPublic(
    String eventId,
    bool isPublic, {
    required String title,
  }) async {
    await upsertEventPage(eventId, title: title, isPublic: isPublic);
  }

  /// Register a walk-in / at-the-door attendee straight into `registrations`
  /// (status `checked_in` — they're standing right there), mirroring the web
  /// `/api/events/[id]/walk-in` route but via the RLS `public_insert` policy
  /// instead of the cookie-authed API.
  ///
  /// If the email is already on the list we don't create a duplicate — we
  /// report it back so the organizer can just check that person in.
  Future<WalkInResult> addWalkIn(
    String eventId, {
    required String name,
    required String email,
    String? phone,
    String? ticketTypeId,
  }) async {
    final nm = name.trim();
    final emailLc = email.toLowerCase().trim();

    // Mirrors the web walk-in route's ordering: event-ended, then capacity,
    // then the duplicate-email check, then the plan cap (which only applies
    // to a genuinely new registration, not checking an existing one in).
    final ep = await supa
        .from('event_pages')
        .select('ends_at, max_capacity')
        .eq('event_id', eventId)
        .maybeSingle();
    final endsAt = ep?['ends_at'] != null
        ? DateTime.tryParse(ep!['ends_at'].toString())
        : null;
    if (endsAt != null && endsAt.isBefore(DateTime.now())) {
      throw const WalkInBlockedException(
          'This event has already ended — walk-in registration is not available.');
    }
    final maxCapacity = ep?['max_capacity'] as int?;
    if (maxCapacity != null) {
      final count = await supa
          .from('registrations')
          .select('id')
          .eq('event_id', eventId)
          .inFilter('status', ['confirmed', 'checked_in'])
          .count(CountOption.exact);
      if (count.count >= maxCapacity) {
        throw const WalkInBlockedException(
            'This event is at full capacity — walk-in cannot be added.');
      }
    }

    // Owner RLS lets the organizer read their own event's rows, so we can
    // detect a pre-existing registration before inserting.
    final existing = await supa
        .from('registrations')
        .select('id, attendee_name, status')
        .eq('event_id', eventId)
        .eq('attendee_email', emailLc)
        .maybeSingle();

    if (existing != null) {
      return WalkInResult(
        created: false,
        name: asString(existing['attendee_name'], nm),
        alreadyCheckedIn: asString(existing['status']) == 'checked_in',
      );
    }

    // Free-tier registration cap (CLAUDE.md: Free = 50/event) — only applies
    // to a new registration, not the check-in-an-existing-one branch above.
    if (!(await canRegisterForEvent(eventId))) {
      throw const WalkInBlockedException(
          'This event has reached the registration limit for your current plan.');
    }

    await supa.from('registrations').insert({
      'event_id': eventId,
      'attendee_name': nm,
      'attendee_email': emailLc,
      if (phone != null && phone.trim().isNotEmpty)
        'attendee_phone': phone.trim(),
      if (ticketTypeId != null && ticketTypeId.isNotEmpty)
        'ticket_type_id': ticketTypeId,
      // A walk-in is by definition already at the door — check them in
      // immediately, same as the web walk-in route's fallback path, instead
      // of leaving them as merely "confirmed" pending a second manual tap.
      'status': 'checked_in',
      'qr_code_token': _token(),
      'amount_paid': 0,
      'source': 'walk_in',
      'checked_in_at': DateTime.now().toUtc().toIso8601String(),
    });

    // Decrement remaining ticket inventory, same as addGroup() and every web
    // registration route (register / group-register / registrations). Without
    // this a walk-in added from mobile never reduced quantity_sold, so a
    // capped ticket could be over-sold. Best-effort: the attendee is already
    // inserted + checked in, so a counter hiccup must not fail the door flow.
    if (ticketTypeId != null && ticketTypeId.isNotEmpty) {
      try {
        await supa.rpc('increment_ticket_quantity_sold',
            params: {'ticket_id': ticketTypeId, 'qty': 1});
      } catch (_) {/* inventory count is non-critical to the check-in */}
    }

    return WalkInResult(created: true, name: nm, alreadyCheckedIn: false);
  }

  /// Bulk-confirm a list of attendees in one go — mirrors the web
  /// `/api/events/[id]/group-register` route (organizer-only tool for
  /// registering a company/group at once, not a public attendee checkout —
  /// the caller has already collected payment out-of-band; every seat is
  /// inserted `confirmed` with no payment processing here). Ticket types are
  /// trusted to belong to this event (the sheet only offers ones it fetched
  /// for this event). Returns how many seats were created.
  Future<int> addGroup(String eventId, {required List<GroupSeat> seats}) async {
    if (seats.isEmpty) {
      throw const GroupRegisterBlockedException('Add at least one seat.');
    }
    if (seats.length > 50) {
      throw const GroupRegisterBlockedException('Max 50 seats at a time.');
    }

    final ep = await supa
        .from('event_pages')
        .select('ends_at, max_capacity')
        .eq('event_id', eventId)
        .maybeSingle();
    final endsAt = ep?['ends_at'] != null
        ? DateTime.tryParse(ep!['ends_at'].toString())
        : null;
    if (endsAt != null && endsAt.isBefore(DateTime.now())) {
      throw const GroupRegisterBlockedException(
          'This event has already ended — group registration is not available.');
    }

    final maxCapacity = ep?['max_capacity'] as int?;
    if (maxCapacity != null) {
      final count = await supa
          .from('registrations')
          .select('id')
          .eq('event_id', eventId)
          .inFilter('status', ['confirmed', 'checked_in'])
          .count(CountOption.exact);
      final remaining = maxCapacity - count.count;
      if (seats.length > remaining) {
        throw GroupRegisterBlockedException(
            'Not enough capacity. Registering ${seats.length} people but only '
            '$remaining spot${remaining == 1 ? '' : 's'} remain${remaining == 1 ? 's' : ''}.');
      }
    }

    // Free-tier plan cap (CLAUDE.md: Free = 50 registrations/event) — batch
    // version of the single-seat check in [canRegisterForEvent].
    final plan = await myPlan();
    if (plan == 'free') {
      final planCount = await supa
          .from('registrations')
          .select('id')
          .eq('event_id', eventId)
          .inFilter('status', ['confirmed', 'checked_in'])
          .count(CountOption.exact);
      final planRemaining = kFreeRegistrationLimit - planCount.count;
      if (seats.length > planRemaining) {
        throw GroupRegisterBlockedException(planRemaining <= 0
            ? 'This event has reached the registration limit for your current plan. Upgrade to add more attendees.'
            : 'Your plan allows $planRemaining more registration${planRemaining == 1 ? '' : 's'} for this event. Upgrade to add more.');
      }
    }

    // `registrations` has a case-insensitive unique index on
    // (event_id, lower(attendee_email)) (047). A single duplicate anywhere in
    // the batch — either two seats sharing an email, or an email already on the
    // list — aborts the whole insert with a 23505 the organizer can't decode.
    // Walk-in already guards its one email; do the same for the batch so the
    // common "someone's already registered" case fails with a clear message
    // instead of a generic "didn't go through".
    final emails = seats.map((s) => s.email.toLowerCase().trim()).toList();

    final dupeInBatch = <String>{};
    final seen = <String>{};
    for (final e in emails) {
      if (!seen.add(e)) dupeInBatch.add(e);
    }
    if (dupeInBatch.isNotEmpty) {
      throw GroupRegisterBlockedException(
          'The same email is used more than once: ${dupeInBatch.join(', ')}. '
          'Each seat needs a different email.');
    }

    final existingRows = await supa
        .from('registrations')
        .select('attendee_email')
        .eq('event_id', eventId)
        .inFilter('attendee_email', emails);
    final already = asMapList(existingRows)
        .map((r) => asString(r['attendee_email']).toLowerCase())
        .toSet();
    if (already.isNotEmpty) {
      throw GroupRegisterBlockedException(already.length == 1
          ? '${already.first} is already registered for this event.'
          : '${already.length} of these people are already registered: '
              '${already.join(', ')}.');
    }

    final rows = seats
        .map((s) => {
              'event_id': eventId,
              'ticket_type_id': s.ticketTypeId,
              'attendee_name': s.name.trim(),
              'attendee_email': s.email.toLowerCase().trim(),
              'attendee_data':
                  (s.whatsapp != null && s.whatsapp!.trim().isNotEmpty)
                      ? {'whatsapp': s.whatsapp!.trim()}
                      : {},
              'status': 'confirmed',
              'source': 'group_registration',
            })
        .toList();

    try {
      await supa.from('registrations').insert(rows);
    } on PostgrestException catch (e) {
      // Surface the real reason (unique clash lost to a race, a missing
      // column, an FK on ticket_type_id, …) instead of a blank failure, so
      // it's diagnosable in the field where release-build logs are stripped.
      if (e.code == '23505') {
        throw const GroupRegisterBlockedException(
            'One of these people was just registered by someone else. '
            'Refresh the list and try the remaining seats.');
      }
      throw GroupRegisterBlockedException('Could not register the group: ${e.message}');
    }

    // Increment quantity_sold per ticket type (same RPC the web route uses).
    // Best-effort: the seats are already inserted, so a counter hiccup must not
    // report the whole group as failed — the count self-corrects on next load.
    final qtyCounts = <String, int>{};
    for (final s in seats) {
      qtyCounts[s.ticketTypeId] = (qtyCounts[s.ticketTypeId] ?? 0) + 1;
    }
    try {
      await Future.wait(qtyCounts.entries.map((e) => supa.rpc(
            'increment_ticket_quantity_sold',
            params: {'ticket_id': e.key, 'qty': e.value},
          )));
    } catch (_) {
      // Non-fatal — registrations succeeded; quantity_sold is a derived counter.
    }

    return seats.length;
  }

  // ── Multi-day events ───────────────────────────────────────────────────
  // Direct-Supabase equivalent of the web server actions in
  // app/(app)/events/[id]/settings/days/page.tsx — same tables
  // (event_days, event_day_entitlements), same owner-gated RLS
  // (can_manage_event()), just called from the authenticated client instead
  // of a server action running under the service role.

  Future<List<Map<String, dynamic>>> loadEventDays(String eventId) async {
    final rows = await supa
        .from('event_days')
        .select('id, day_index, date, checkin_enabled, capacity')
        .eq('event_id', eventId)
        .order('day_index');
    return asMapList(rows);
  }

  Future<List<Map<String, dynamic>>> loadEventEntitlements(String eventId) async {
    final rows = await supa
        .from('entitlements')
        .select('id, name, type')
        .eq('event_id', eventId)
        .order('type')
        .order('name');
    return asMapList(rows);
  }

  Future<Map<String, List<String>>> loadDayEntitlementLinks(
      List<String> dayIds) async {
    if (dayIds.isEmpty) return {};
    final rows = await supa
        .from('event_day_entitlements')
        .select('event_day_id, entitlement_id')
        .inFilter('event_day_id', dayIds);
    final map = <String, List<String>>{};
    for (final r in asMapList(rows)) {
      final dayId = asString(r['event_day_id']);
      map.putIfAbsent(dayId, () => []).add(asString(r['entitlement_id']));
    }
    return map;
  }

  /// Insert a new day at the next index. Mirrors web's addDay() — bare row,
  /// the organizer fills in date/capacity/entitlements after.
  Future<String> addEventDay(String eventId) async {
    final existing = await supa
        .from('event_days')
        .select('day_index')
        .eq('event_id', eventId)
        .order('day_index', ascending: false)
        .limit(1);
    final list = asMapList(existing);
    final nextIndex = list.isEmpty ? 0 : asInt(list.first['day_index']) + 1;
    final row = await supa
        .from('event_days')
        .insert({
          'event_id': eventId,
          'day_index': nextIndex,
          'checkin_enabled': true,
        })
        .select('id')
        .single();
    return asString(row['id']);
  }

  /// Save a day's fields and re-sync its entitlement links (drop all,
  /// re-insert the selected set — same approach web's saveDay() uses).
  Future<void> saveEventDay(
    String dayId, {
    required String? date,
    required bool checkinEnabled,
    required int? capacity,
    required List<String> entitlementIds,
  }) async {
    await supa.from('event_days').update({
      'date': date,
      'checkin_enabled': checkinEnabled,
      'capacity': capacity,
    }).eq('id', dayId);

    await supa.from('event_day_entitlements').delete().eq('event_day_id', dayId);
    if (entitlementIds.isNotEmpty) {
      await supa.from('event_day_entitlements').insert(
            entitlementIds
                .map((entitlementId) => {
                      'event_day_id': dayId,
                      'entitlement_id': entitlementId,
                    })
                .toList(),
          );
    }
  }

  Future<void> deleteEventDay(String dayId) async {
    await supa.from('event_days').delete().eq('id', dayId);
  }

  // ── Entitlements management ────────────────────────────────────────────
  // Direct-Supabase equivalent of the web server actions in
  // app/(app)/events/[id]/entitlements/page.tsx (entitlements +
  // ticket_type_entitlements, same owner-gated RLS as everything else here).

  Future<List<Map<String, dynamic>>> loadEntitlements(String eventId) async {
    final rows = await supa
        .from('entitlements')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at');
    return asMapList(rows);
  }

  Future<List<Map<String, dynamic>>> loadTicketTypesLite(String eventId) async {
    final rows = await supa
        .from('ticket_types')
        .select('id, name')
        .eq('event_id', eventId)
        .order('position');
    return asMapList(rows);
  }

  Future<Map<String, List<String>>> loadEntitlementTicketTypeLinks(
      List<String> entitlementIds) async {
    if (entitlementIds.isEmpty) return {};
    final rows = await supa
        .from('ticket_type_entitlements')
        .select('ticket_type_id, entitlement_id')
        .inFilter('entitlement_id', entitlementIds);
    final map = <String, List<String>>{};
    for (final r in asMapList(rows)) {
      final entId = asString(r['entitlement_id']);
      map.putIfAbsent(entId, () => []).add(asString(r['ticket_type_id']));
    }
    return map;
  }

  Future<String> createEntitlement(
    String eventId, {
    required String name,
    required String type,
    int? quantity,
    DateTime? validFrom,
    DateTime? validUntil,
    required String redemptionLimit,
    required List<String> ticketTypeIds,
  }) async {
    final row = await supa
        .from('entitlements')
        .insert({
          'event_id': eventId,
          'name': name,
          'type': type,
          'quantity': quantity,
          'valid_from': validFrom?.toUtc().toIso8601String(),
          'valid_until': validUntil?.toUtc().toIso8601String(),
          'redemption_limit': redemptionLimit,
        })
        .select('id')
        .single();
    final entId = asString(row['id']);
    if (ticketTypeIds.isNotEmpty) {
      await supa.from('ticket_type_entitlements').insert(
            ticketTypeIds
                .map((ticketTypeId) => {
                      'ticket_type_id': ticketTypeId,
                      'entitlement_id': entId,
                    })
                .toList(),
          );
    }
    return entId;
  }

  Future<void> updateEntitlement(
    String entitlementId, {
    required String name,
    required String type,
    int? quantity,
    DateTime? validFrom,
    DateTime? validUntil,
    required String redemptionLimit,
    required List<String> ticketTypeIds,
  }) async {
    await supa.from('entitlements').update({
      'name': name,
      'type': type,
      'quantity': quantity,
      'valid_from': validFrom?.toUtc().toIso8601String(),
      'valid_until': validUntil?.toUtc().toIso8601String(),
      'redemption_limit': redemptionLimit,
    }).eq('id', entitlementId);

    await supa
        .from('ticket_type_entitlements')
        .delete()
        .eq('entitlement_id', entitlementId);
    if (ticketTypeIds.isNotEmpty) {
      await supa.from('ticket_type_entitlements').insert(
            ticketTypeIds
                .map((ticketTypeId) => {
                      'ticket_type_id': ticketTypeId,
                      'entitlement_id': entitlementId,
                    })
                .toList(),
          );
    }
  }

  Future<void> deleteEntitlement(String entitlementId) async {
    await supa.from('entitlements').delete().eq('id', entitlementId);
  }

  // ── Catering + accessibility ───────────────────────────────────────────
  // Both are read-only aggregate RPCs (catering_counts, accessibility_summary)
  // that authorise on auth.uid() internally (SECURITY DEFINER) — call them
  // straight from the authenticated client, same as web's server component
  // does with its session client (not the admin client).

  /// Returns the raw `{ meals: [...] }` map from `catering_counts`, or throws
  /// on a genuine failure. A `PostgrestException` with code P0001 and a
  /// NOT_AUTHORISED message means the caller isn't this event's owner/staff.
  Future<Map<String, dynamic>> loadCateringCounts(String eventId) async {
    final data = await supa.rpc('catering_counts', params: {'p_event_id': eventId});
    return data is Map ? Map<String, dynamic>.from(data) : {};
  }

  Future<Map<String, dynamic>> loadAccessibilitySummary(String eventId) async {
    final data =
        await supa.rpc('accessibility_summary', params: {'p_event_id': eventId});
    return data is Map ? Map<String, dynamic>.from(data) : {};
  }

  static String _token() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    final r = Random.secure();
    return List.generate(8, (_) => chars[r.nextInt(chars.length)]).join();
  }
}

/// Outcome of a walk-in attempt, so the UI can speak plainly to the organizer.
class WalkInResult {
  /// True when a brand-new registration was created.
  final bool created;

  /// Attendee display name (from the new row, or the existing one).
  final String name;

  /// True when the matched existing registration is already checked in.
  final bool alreadyCheckedIn;

  const WalkInResult({
    required this.created,
    required this.name,
    required this.alreadyCheckedIn,
  });

  bool get alreadyRegistered => !created;
}
