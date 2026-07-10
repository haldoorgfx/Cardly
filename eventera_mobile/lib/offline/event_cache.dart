// Offline event cache (G2 · O02) — pre-event data download.
//
// PURE service, no UI imports. It caches, to a durable JSON file in the app
// documents directory, everything the scanner needs to resolve a QR and make a
// best-effort eligibility guess while offline:
//   • the attendee list      (registration id, qr_code_token, name, ticket name)
//   • the entitlement defs    (id, name, type, limit, validity window)
//   • event_days + links      (for the multi-day day selector + day gate)
//   • ticket → entitlement    (which tickets INCLUDE which entitlements, so an
//                              offline scan can say whether the ticket covers it)
//
// The server stays the source of truth. Nothing here decides a final outcome —
// it only lets the scanner resolve the QR and label a PROVISIONAL result that is
// reconciled by `redeem_entitlement` on replay (see scan_queue.dart).

import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:path_provider/path_provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// One cached attendee row (a slice of `public.registrations`).
class CachedRegistration {
  final String id;
  final String qrToken;
  final String name;
  final String ticketName;
  final String ticketTypeId;

  const CachedRegistration({
    required this.id,
    required this.qrToken,
    required this.name,
    required this.ticketName,
    required this.ticketTypeId,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'qr': qrToken,
        'name': name,
        'ticket': ticketName,
        'ticket_type_id': ticketTypeId,
      };

  factory CachedRegistration.fromJson(Map<String, dynamic> m) =>
      CachedRegistration(
        id: (m['id'] ?? '').toString(),
        qrToken: (m['qr'] ?? '').toString(),
        name: (m['name'] ?? '').toString(),
        ticketName: (m['ticket'] ?? '').toString(),
        ticketTypeId: (m['ticket_type_id'] ?? '').toString(),
      );
}

/// The full cached bundle for one event. `entitlementMaps` and `dayMaps` are
/// kept as raw maps so the scanner can feed them straight into its existing
/// `EntitlementDef.fromMap` / `EventDay.fromMap` parsers (keeps this file free
/// of any UI/material import).
class CachedEvent {
  final String eventId;
  final DateTime? lastSyncedAt;
  final List<Map<String, dynamic>> entitlementMaps;
  final List<Map<String, dynamic>> dayMaps;
  final Map<String, Set<String>> dayLinks; // day_id -> entitlement ids
  final Map<String, Set<String>> ticketEntitlements; // ticket_type_id -> ent ids
  final Map<String, CachedRegistration> _byToken;

  CachedEvent({
    required this.eventId,
    required this.lastSyncedAt,
    required this.entitlementMaps,
    required this.dayMaps,
    required this.dayLinks,
    required this.ticketEntitlements,
    required Map<String, CachedRegistration> byToken,
  }) : _byToken = byToken;

  int get registrationCount => _byToken.length;

  /// Resolve a scanned QR token to its cached registration, or null if this
  /// event's cache does not contain it ("not in cache — reconnect to verify").
  CachedRegistration? registrationByToken(String token) => _byToken[token];

  /// Best-effort: does this registration's ticket INCLUDE this entitlement?
  /// Mirrors the server's base +1 (ticket inclusion). Grants/revokes made after
  /// the cache was taken are unknown offline, so a `false` here is NOT proof of
  /// "not entitled" — the scanner labels such scans as unverified, never denied.
  bool ticketIncludes(CachedRegistration reg, String entitlementId) {
    final set = ticketEntitlements[reg.ticketTypeId];
    return set != null && set.contains(entitlementId);
  }

  Map<String, dynamic> toJson() => {
        'event_id': eventId,
        'synced_at': lastSyncedAt?.toIso8601String(),
        'entitlements': entitlementMaps,
        'days': dayMaps,
        'day_links': {
          for (final e in dayLinks.entries) e.key: e.value.toList(),
        },
        'ticket_entitlements': {
          for (final e in ticketEntitlements.entries) e.key: e.value.toList(),
        },
        'registrations': [for (final r in _byToken.values) r.toJson()],
      };

  factory CachedEvent.fromJson(Map<String, dynamic> m) {
    List<Map<String, dynamic>> maps(dynamic v) => (v is List)
        ? v.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
        : <Map<String, dynamic>>[];
    Map<String, Set<String>> links(dynamic v) {
      final out = <String, Set<String>>{};
      if (v is Map) {
        v.forEach((k, val) {
          if (val is List) {
            out['$k'] = val.map((e) => e.toString()).toSet();
          }
        });
      }
      return out;
    }

    final regs = <String, CachedRegistration>{};
    if (m['registrations'] is List) {
      for (final r in (m['registrations'] as List).whereType<Map>()) {
        final cr = CachedRegistration.fromJson(Map<String, dynamic>.from(r));
        if (cr.qrToken.isNotEmpty) regs[cr.qrToken] = cr;
      }
    }

    return CachedEvent(
      eventId: (m['event_id'] ?? '').toString(),
      lastSyncedAt: DateTime.tryParse((m['synced_at'] ?? '').toString()),
      entitlementMaps: maps(m['entitlements']),
      dayMaps: maps(m['days']),
      dayLinks: links(m['day_links']),
      ticketEntitlements: links(m['ticket_entitlements']),
      byToken: regs,
    );
  }
}

/// Progress signal for the O02 download UI. `fraction` is 0..1; `label` is a
/// terse step name.
class CacheProgress {
  final double fraction;
  final String label;
  const CacheProgress(this.fraction, this.label);
}

/// Loads/saves the per-event cache and performs the pre-event download.
class EventCache {
  const EventCache();

  static Future<File> _fileFor(String eventId) async {
    final dir = await getApplicationDocumentsDirectory();
    return File('${dir.path}/offline_event_$eventId.json');
  }

  /// Read a previously-downloaded cache for [eventId], or null if none exists
  /// (or the file is unreadable). Never throws.
  static Future<CachedEvent?> load(String eventId) async {
    try {
      final f = await _fileFor(eventId);
      if (!await f.exists()) return null;
      final text = await f.readAsString();
      if (text.trim().isEmpty) return null;
      final decoded = jsonDecode(text);
      if (decoded is! Map) return null;
      return CachedEvent.fromJson(Map<String, dynamic>.from(decoded));
    } catch (_) {
      return null;
    }
  }

  /// Download the event's data from Supabase and persist it. Emits progress via
  /// [onProgress]. Throws on network/permission failure so the UI can show a
  /// Retry state — the previous cache (if any) is left untouched on failure.
  static Future<CachedEvent> download(
    String eventId, {
    void Function(CacheProgress)? onProgress,
  }) async {
    final supa = Supabase.instance.client;
    void report(double f, String label) => onProgress?.call(CacheProgress(f, label));

    report(0.05, 'Starting');

    // 1. Entitlement definitions.
    final entRows = await supa
        .from('entitlements')
        .select('id, name, type, redemption_limit, valid_from, valid_until')
        .eq('event_id', eventId)
        .order('type');
    final entitlementMaps = _asMapList(entRows);
    final entIds = [
      for (final e in entitlementMaps) (e['id'] ?? '').toString(),
    ].where((s) => s.isNotEmpty).toList();
    report(0.25, 'Entitlements');

    // 2. Ticket types (id -> name), for the attendee ticket label.
    final ticketRows = await supa
        .from('ticket_types')
        .select('id, name')
        .eq('event_id', eventId);
    final ticketNames = <String, String>{};
    for (final t in _asMapList(ticketRows)) {
      ticketNames[(t['id'] ?? '').toString()] = (t['name'] ?? '').toString();
    }
    report(0.4, 'Tickets');

    // 3. Which tickets include which entitlements (offline held check).
    final ticketEntitlements = <String, Set<String>>{};
    if (entIds.isNotEmpty) {
      final tteRows = await supa
          .from('ticket_type_entitlements')
          .select('ticket_type_id, entitlement_id')
          .inFilter('entitlement_id', entIds);
      for (final r in _asMapList(tteRows)) {
        final tt = (r['ticket_type_id'] ?? '').toString();
        final en = (r['entitlement_id'] ?? '').toString();
        if (tt.isEmpty || en.isEmpty) continue;
        (ticketEntitlements[tt] ??= <String>{}).add(en);
      }
    }
    report(0.55, 'Coverage');

    // 4. The attendee list.
    final regRows = await supa
        .from('registrations')
        .select('id, qr_code_token, attendee_name, ticket_type_id')
        .eq('event_id', eventId);
    final byToken = <String, CachedRegistration>{};
    for (final r in _asMapList(regRows)) {
      final token = (r['qr_code_token'] ?? '').toString();
      if (token.isEmpty) continue;
      final ttId = (r['ticket_type_id'] ?? '').toString();
      byToken[token] = CachedRegistration(
        id: (r['id'] ?? '').toString(),
        qrToken: token,
        name: (r['attendee_name'] ?? '').toString(),
        ticketName: ticketNames[ttId] ?? '',
        ticketTypeId: ttId,
      );
    }
    report(0.8, 'Attendees');

    // 5. Multi-day structure (best-effort — missing days is fine).
    var dayMaps = <Map<String, dynamic>>[];
    final dayLinks = <String, Set<String>>{};
    try {
      final dayRows = await supa
          .from('event_days')
          .select('id, day_index, date, checkin_enabled, capacity')
          .eq('event_id', eventId)
          .order('day_index');
      dayMaps = _asMapList(dayRows);
      final dayIds =
          [for (final d in dayMaps) (d['id'] ?? '').toString()].where((s) => s.isNotEmpty).toList();
      if (dayIds.isNotEmpty) {
        final linkRows = await supa
            .from('event_day_entitlements')
            .select('event_day_id, entitlement_id')
            .inFilter('event_day_id', dayIds);
        for (final r in _asMapList(linkRows)) {
          final d = (r['event_day_id'] ?? '').toString();
          final en = (r['entitlement_id'] ?? '').toString();
          if (d.isEmpty || en.isEmpty) continue;
          (dayLinks[d] ??= <String>{}).add(en);
        }
      }
    } catch (_) {
      dayMaps = <Map<String, dynamic>>[];
      dayLinks.clear();
    }
    report(0.95, 'Days');

    final cache = CachedEvent(
      eventId: eventId,
      lastSyncedAt: DateTime.now().toUtc(),
      entitlementMaps: entitlementMaps,
      dayMaps: dayMaps,
      dayLinks: dayLinks,
      ticketEntitlements: ticketEntitlements,
      byToken: byToken,
    );

    // Persist atomically: write a temp file then rename over the target.
    final f = await _fileFor(eventId);
    final tmp = File('${f.path}.tmp');
    await tmp.writeAsString(jsonEncode(cache.toJson()), flush: true);
    if (await f.exists()) await f.delete();
    await tmp.rename(f.path);

    report(1.0, 'Ready');
    return cache;
  }

  static List<Map<String, dynamic>> _asMapList(dynamic v) => (v is List)
      ? v.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
      : <Map<String, dynamic>>[];
}
