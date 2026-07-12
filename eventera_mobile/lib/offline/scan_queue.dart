// Durable offline scan queue (G2 · O03) — the idempotency spine.
//
// PURE service, no UI imports and no direct Supabase import. Every offline scan
// becomes a [QueuedScan] carrying a `clientUuid` GENERATED ONCE on the device.
// That same clientUuid is replayed on every attempt: the server's unique index
// on `entitlement_redemptions.client_uuid` + `redeem_entitlement`'s own
// idempotency branch mean a replay (even a duplicated one, even after a crash
// mid-replay) can NEVER double-insert. A replayed scan is removed from the queue
// ONLY after the server acknowledges it.
//
// The queue persists to a JSON file in the app documents directory, so it
// survives app restarts. Replay is sequential and driven by SyncController,
// which injects the actual redeem call — keeping this file testable in isolation.

import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';

/// One queued offline scan. Immutable except for the replay outcome fields that
/// are set when it moves to the "needs attention" list.
class QueuedScan {
  final String clientUuid; // idempotency key — generated ONCE, reused on replay
  final String entitlementId;
  final String registrationId;
  final int? dayIndex;
  final String deviceId;
  final String scannedAt; // device-clock ISO-8601 (UTC)
  final String source; // always 'offline'
  // Display context so the attention list can name the attendee without a fetch.
  final String attendeeName;
  final String entitlementName;
  final String ticketName;
  // Set only once resolved server-side to a non-success outcome.
  final String? attentionStatus; // already | not_entitled | outside_window

  const QueuedScan({
    required this.clientUuid,
    required this.entitlementId,
    required this.registrationId,
    required this.dayIndex,
    required this.deviceId,
    required this.scannedAt,
    this.source = 'offline',
    this.attendeeName = '',
    this.entitlementName = '',
    this.ticketName = '',
    this.attentionStatus,
  });

  QueuedScan withAttention(String status) => QueuedScan(
        clientUuid: clientUuid,
        entitlementId: entitlementId,
        registrationId: registrationId,
        dayIndex: dayIndex,
        deviceId: deviceId,
        scannedAt: scannedAt,
        source: source,
        attendeeName: attendeeName,
        entitlementName: entitlementName,
        ticketName: ticketName,
        attentionStatus: status,
      );

  Map<String, dynamic> toJson() => {
        'client_uuid': clientUuid,
        'entitlement_id': entitlementId,
        'registration_id': registrationId,
        'day_index': dayIndex,
        'device_id': deviceId,
        'scanned_at': scannedAt,
        'source': source,
        'attendee_name': attendeeName,
        'entitlement_name': entitlementName,
        'ticket_name': ticketName,
        if (attentionStatus != null) 'attention_status': attentionStatus,
      };

  factory QueuedScan.fromJson(Map<String, dynamic> m) => QueuedScan(
        clientUuid: (m['client_uuid'] ?? '').toString(),
        entitlementId: (m['entitlement_id'] ?? '').toString(),
        registrationId: (m['registration_id'] ?? '').toString(),
        dayIndex: (m['day_index'] is num)
            ? (m['day_index'] as num).toInt()
            : int.tryParse('${m['day_index']}'),
        deviceId: (m['device_id'] ?? '').toString(),
        scannedAt: (m['scanned_at'] ?? '').toString(),
        source: (m['source'] ?? 'offline').toString(),
        attendeeName: (m['attendee_name'] ?? '').toString(),
        entitlementName: (m['entitlement_name'] ?? '').toString(),
        ticketName: (m['ticket_name'] ?? '').toString(),
        attentionStatus: m['attention_status']?.toString(),
      );
}

/// Result of a replay pass, so the caller can update the online flag.
class ReplaySummary {
  final int synced;
  final int flagged; // moved to attention
  final bool stoppedOffline; // a network error halted replay
  const ReplaySummary(this.synced, this.flagged, this.stoppedOffline);
}

/// Is this error a "we're offline / can't reach the server" signal (vs a real
/// server-side rejection)? Used both to fall back to the queue and to stop a
/// replay pass without dropping items.
bool isNetworkError(Object e) {
  if (e is SocketException || e is TimeoutException || e is HttpException) {
    return true;
  }
  final s = e.toString().toLowerCase();
  return s.contains('socketexception') ||
      s.contains('failed host lookup') ||
      s.contains('network is unreachable') ||
      s.contains('connection closed') ||
      s.contains('connection refused') ||
      s.contains('connection reset') ||
      s.contains('timed out') ||
      s.contains('timeout') ||
      s.contains('clientexception') ||
      s.contains('handshakeexception') ||
      s.contains('xmlhttprequest');
}

/// The one durable queue. A [ChangeNotifier] so SyncController/UI can react to
/// count changes.
class ScanQueue extends ChangeNotifier {
  ScanQueue._();
  static final ScanQueue instance = ScanQueue._();

  final List<QueuedScan> _pending = [];
  final List<QueuedScan> _attention = [];
  bool _loaded = false;
  bool _replaying = false;

  int get pendingCount => _pending.length;
  int get attentionCount => _attention.length;
  List<QueuedScan> get attention => List.unmodifiable(_attention);
  bool get isReplaying => _replaying;

  static Future<File> _file() async {
    final dir = await getApplicationDocumentsDirectory();
    return File('${dir.path}/offline_scan_queue.json');
  }

  /// Load the persisted queue once. Never throws.
  Future<void> ensureLoaded() async {
    if (_loaded) return;
    _loaded = true;
    try {
      final f = await _file();
      if (!await f.exists()) return;
      final text = await f.readAsString();
      if (text.trim().isEmpty) return;
      final decoded = jsonDecode(text);
      if (decoded is! Map) return;
      void fill(String key, List<QueuedScan> into) {
        final list = decoded[key];
        if (list is List) {
          for (final r in list.whereType<Map>()) {
            final q = QueuedScan.fromJson(Map<String, dynamic>.from(r));
            if (q.clientUuid.isNotEmpty) into.add(q);
          }
        }
      }

      fill('pending', _pending);
      fill('attention', _attention);
      if (_pending.isNotEmpty || _attention.isNotEmpty) notifyListeners();
    } catch (_) {
      // A corrupt queue file must not brick the scanner.
    }
  }

  Future<void> _save() async {
    try {
      final f = await _file();
      final tmp = File('${f.path}.tmp');
      await tmp.writeAsString(
        jsonEncode({
          'pending': [for (final q in _pending) q.toJson()],
          'attention': [for (final q in _attention) q.toJson()],
        }),
        flush: true,
      );
      if (await f.exists()) await f.delete();
      await tmp.rename(f.path);
    } catch (_) {
      // Best-effort durability; an unwritable disk is surfaced elsewhere.
    }
  }

  /// Is there already an unsynced offline redeem for this exact slot on THIS
  /// device? Guards against the same attendee being scanned twice offline for a
  /// `once` / `once_per_day` entitlement before any sync — the strongest local
  /// defence against a double redemption.
  bool hasPendingFor(String registrationId, String entitlementId, int? dayIndex) {
    return _pending.any((q) =>
        q.registrationId == registrationId &&
        q.entitlementId == entitlementId &&
        q.dayIndex == dayIndex);
  }

  Future<void> enqueue(QueuedScan scan) async {
    _pending.add(scan);
    await _save();
    notifyListeners();
  }

  Future<void> clearAttention() async {
    if (_attention.isEmpty) return;
    _attention.clear();
    await _save();
    notifyListeners();
  }

  /// Replay every pending scan sequentially through [redeem], which must return
  /// the RPC's `status`. Removes a scan only after the server acknowledges it.
  /// Stops (keeping remaining items) on the first network error.
  Future<ReplaySummary> replay(
    Future<String> Function(QueuedScan) redeem,
  ) async {
    if (_replaying) return const ReplaySummary(0, 0, false);
    _replaying = true;
    notifyListeners();
    var synced = 0;
    var flagged = 0;
    var stoppedOffline = false;
    try {
      // Iterate over a snapshot; mutate the live list as we go.
      final items = List<QueuedScan>.from(_pending);
      for (final item in items) {
        String status;
        try {
          status = await redeem(item);
        } catch (e) {
          if (isNetworkError(e)) {
            stoppedOffline = true;
            break; // still offline — keep this and all later items
          }
          // A non-network error (e.g. transient server 500): stop this pass but
          // keep the item so it is retried later. Do not drop it.
          break;
        }

        if (status == 'redeemed' || status == 'ok') {
          _pending.remove(item);
          synced++;
          await _save();
          notifyListeners();
        } else if (status == 'already' ||
            status == 'not_entitled' ||
            status == 'outside_window') {
          _pending.remove(item);
          _attention.add(item.withAttention(status));
          flagged++;
          await _save();
          notifyListeners();
        } else {
          // 'error' or an unknown status — keep the item, stop the pass.
          break;
        }
      }
    } finally {
      _replaying = false;
      notifyListeners();
    }
    return ReplaySummary(synced, flagged, stoppedOffline);
  }
}
