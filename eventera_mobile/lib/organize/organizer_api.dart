import 'dart:math';

import '../net.dart';

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
  /// (status `confirmed`), mirroring the web `/api/events/[id]/walk-in` route
  /// but via the RLS `public_insert` policy instead of the cookie-authed API.
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

    await supa.from('registrations').insert({
      'event_id': eventId,
      'attendee_name': nm,
      'attendee_email': emailLc,
      if (phone != null && phone.trim().isNotEmpty)
        'attendee_phone': phone.trim(),
      if (ticketTypeId != null && ticketTypeId.isNotEmpty)
        'ticket_type_id': ticketTypeId,
      'status': 'confirmed',
      'qr_code_token': _token(),
      'amount_paid': 0,
      'source': 'walk_in',
    });

    return WalkInResult(created: true, name: nm, alreadyCheckedIn: false);
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
