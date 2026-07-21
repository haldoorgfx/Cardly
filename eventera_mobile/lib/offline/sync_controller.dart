// Sync controller (G2 · O01/O03) — connectivity + replay orchestration.
//
// This is the ONE thing the connection indicator listens to. It owns:
//   • the online/offline flag (no connectivity_plus dependency — detected by a
//     lightweight HTTP reachability probe against the Supabase health endpoint,
//     and by the network errors surfaced from live scan RPCs)
//   • the syncing flag
//   • the pending + attention counts (forwarded from ScanQueue)
//
// On reconnect it replays the durable queue through `redeem_entitlement`,
// passing each scan's stored clientUuid, p_source:'offline' and p_scanned_at, so
// replays are idempotent and provisional offline scans become server-confirmed.

import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';

import '../supabase_config.dart';
import 'scan_queue.dart';

class SyncController extends ChangeNotifier {
  SyncController._() {
    _queue.addListener(_onQueueChanged);
  }
  static final SyncController instance = SyncController._();

  final ScanQueue _queue = ScanQueue.instance;

  bool _online = true; // optimistic until the first probe says otherwise
  bool _syncing = false;
  bool _started = false;
  Timer? _timer;

  bool get online => _online;
  bool get syncing => _syncing;
  int get queued => _queue.pendingCount;
  int get attentionCount => _queue.attentionCount;
  ScanQueue get queue => _queue;

  void _onQueueChanged() => notifyListeners();

  /// Idempotent boot: load the persisted queue, run one probe, and start the
  /// periodic reachability poll. Safe to call from every scanner open.
  Future<void> ensureStarted() async {
    if (_started) return;
    _started = true;
    await _queue.ensureLoaded();
    _timer ??= Timer.periodic(const Duration(seconds: 25), (_) => _tick());
    // Fire one immediately so the indicator settles and any queue drains.
    unawaited(_tick());
  }

  Future<void> _tick() async {
    final reachable = await probe();
    if (reachable && _queue.pendingCount > 0 && !_syncing) {
      await _runReplay();
    }
  }

  /// Lightweight reachability check. A 2xx/4xx/anything-back means the network
  /// is up; a thrown/timed-out request means we are offline.
  Future<bool> probe() async {
    var reachable = false;
    try {
      final uri = Uri.parse('${SupabaseConfig.url}/auth/v1/health');
      final res = await http
          .get(uri, headers: {'apikey': SupabaseConfig.anonKey})
          .timeout(const Duration(seconds: 5));
      reachable = res.statusCode > 0; // any HTTP reply = reachable
    } catch (_) {
      reachable = false;
    }
    _setOnline(reachable);
    return reachable;
  }

  void _setOnline(bool value) {
    if (_online == value) return;
    _online = value;
    notifyListeners();
  }

  /// Called by the scanner when a live scan RPC failed with a network error —
  /// flips us to offline immediately, before the next poll.
  void markOffline() => _setOnline(false);

  /// Called by the scanner after a successful online scan — we are clearly
  /// online, so settle the flag and drain anything queued from earlier.
  void markOnline() {
    _setOnline(true);
    if (_queue.pendingCount > 0 && !_syncing) {
      unawaited(_runReplay());
    }
  }

  /// Manual "sync now" (e.g. from the indicator) — probe then replay.
  Future<void> syncNow() async {
    final reachable = await probe();
    if (reachable && !_syncing) await _runReplay();
  }

  Future<void> _runReplay() async {
    if (_syncing) return;
    _syncing = true;
    notifyListeners();
    try {
      final summary = await _queue.replay(_redeem);
      if (summary.stoppedOffline) {
        _online = false;
      } else if (summary.synced > 0 || summary.flagged > 0) {
        _online = true;
      }
    } finally {
      _syncing = false;
      notifyListeners();
    }
  }

  /// The real redeem call. Reuses the SAME clientUuid the scan was recorded with
  /// so the server dedupes replays; returns the RPC `status` string.
  Future<String> _redeem(QueuedScan q) async {
    final res = await Supabase.instance.client.rpc('redeem_entitlement', params: {
      'p_entitlement_id': q.entitlementId,
      'p_registration_id': q.registrationId,
      'p_day_index': q.dayIndex,
      'p_client_uuid': q.clientUuid,
      'p_device_id': q.deviceId,
      'p_source': 'offline',
      'p_scanned_at': q.scannedAt,
    });
    final m = (res is Map) ? Map<String, dynamic>.from(res) : const <String, dynamic>{};
    return (m['status'] ?? 'error').toString();
  }

  /// Stop the reachability poll and allow a later [ensureStarted] to restart
  /// it. Used on sign-out: the 25s timer otherwise keeps probing and replaying
  /// across accounts, and `_started` would block a clean restart for the next
  /// user. Unlike [dispose] this keeps the singleton usable.
  void stop() {
    _timer?.cancel();
    _timer = null;
    _started = false;
    _syncing = false;
  }

  @override
  void dispose() {
    _timer?.cancel();
    _queue.removeListener(_onQueueChanged);
    super.dispose();
  }
}
