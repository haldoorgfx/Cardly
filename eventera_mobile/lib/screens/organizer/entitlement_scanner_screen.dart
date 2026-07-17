// Entitlement scanner — E04–E08 (Group G1 field app spine).
//
// The organizer picks WHICH entitlement they are scanning (E04), points the
// camera at an attendee QR, and the server-authoritative `redeem_entitlement`
// RPC decides the outcome (E05–E08). This screen does ZERO eligibility logic —
// it resolves the QR to a registration, calls the RPC, and renders `status`.
//
// Dark theme is permitted here only (MOBILE_DESIGN_LAW §8). The result surfaces
// live in entitlement_scan_result.dart.

import 'dart:async';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../net.dart';
import '../../offline/event_cache.dart';
import '../../offline/scan_queue.dart';
import '../../offline/sync_controller.dart';
import '../../ui/components.dart';
import '../../ui/connection_indicator.dart';
import '../../ui/tokens.dart';
import 'checkin_scanner_screen.dart' show extractCheckinToken;
import 'entitlement_scan_result.dart';
import 'offline_attention_sheet.dart';
import 'offline_prepare_screen.dart';
import 'scanner_day_selector.dart';

class EntitlementScannerScreen extends StatefulWidget {
  final String eventId;
  final String eventName;
  const EntitlementScannerScreen({
    super.key,
    required this.eventId,
    required this.eventName,
  });

  @override
  State<EntitlementScannerScreen> createState() => _EntitlementScannerScreenState();
}

class _EntitlementScannerScreenState extends State<EntitlementScannerScreen> {
  static const _secure = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );
  static final _rand = Random.secure();

  final MobileScannerController _controller = MobileScannerController(
    detectionSpeed: DetectionSpeed.normal,
    facing: CameraFacing.back,
  );

  // Entitlement definitions (E04 modes).
  bool _loading = true;
  String? _loadError;
  List<EntitlementDef> _entitlements = const [];
  final Map<String, int> _counts = {}; // entitlement_id -> net active redemptions
  EntitlementDef? _selected;

  // Multi-day (G5 · M02). Empty for single-day events — the selector then
  // renders nothing and `p_day_index` stays null.
  List<EventDay> _days = const [];
  Map<String, Set<String>> _dayLinks = const {}; // day.id -> linked entitlement ids
  final Map<int, int> _dayCounts = {}; // day_index -> net redemptions for _selected
  int? _selectedDayIndex;

  // Stable-per-install device id (persisted in the OS keychain).
  String? _deviceId;

  // Offline (G2 · O01–O03). The cache is loaded once; the sync controller owns
  // connectivity + the durable replay queue and is shared across the app.
  CachedEvent? _cache;
  SyncController get _sync => SyncController.instance;

  // Scan state.
  bool _busy = false;
  String? _lastToken;
  DateTime _lastScan = DateTime.fromMillisecondsSinceEpoch(0);
  EntitlementScanResult? _result;
  Timer? _dismissTimer;

  @override
  void initState() {
    super.initState();
    _sync.ensureStarted(); // load queue, probe connectivity, drain on reconnect
    _bootstrap();
  }

  @override
  void dispose() {
    _dismissTimer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  // ── Identity helpers ──────────────────────────────────────────────────────

  Future<String> _ensureDeviceId() async {
    var id = await _secure.read(key: 'entitlement_device_id');
    if (id == null || id.isEmpty) {
      id = 'dev-${_hex(8)}';
      await _secure.write(key: 'entitlement_device_id', value: id);
    }
    return id;
  }

  String _hex(int bytes) =>
      List<int>.generate(bytes, (_) => _rand.nextInt(256))
          .map((b) => b.toRadixString(16).padLeft(2, '0'))
          .join();

  /// v4-shaped idempotency key. `uuid` is not a dependency, so this is built from
  /// Random.secure() folded with the current microsecond clock.
  String _clientUuid() {
    final b = List<int>.generate(16, (_) => _rand.nextInt(256));
    var micros = DateTime.now().microsecondsSinceEpoch;
    for (var i = 8; i < 16; i++) {
      b[i] ^= micros & 0xff;
      micros >>= 8;
    }
    b[6] = (b[6] & 0x0f) | 0x40; // version 4
    b[8] = (b[8] & 0x3f) | 0x80; // variant
    String h(int n) => n.toRadixString(16).padLeft(2, '0');
    final s = b.map(h).join();
    return '${s.substring(0, 8)}-${s.substring(8, 12)}-${s.substring(12, 16)}-'
        '${s.substring(16, 20)}-${s.substring(20)}';
  }

  // ── Loading ───────────────────────────────────────────────────────────────

  Future<void> _bootstrap() async {
    setState(() {
      _loading = true;
      _loadError = null;
    });
    // Device id + the offline cache are local (no network) — always available.
    _deviceId = await _ensureDeviceId();
    _cache = await EventCache.load(widget.eventId);
    try {
      final rows = await supa
          .from('entitlements')
          .select('id, name, type, redemption_limit, valid_from, valid_until')
          .eq('event_id', widget.eventId)
          .order('type');
      final list = asMapList(rows).map(EntitlementDef.fromMap).toList();

      // Restore the last-used mode for this event.
      final storedId = await _secure.read(key: 'entitlement_mode_${widget.eventId}');
      EntitlementDef? selected;
      if (list.isNotEmpty) {
        selected = list.firstWhere((e) => e.id == storedId, orElse: () => list.first);
      }

      // Per-day structure (best-effort — a failure falls back to single-day).
      await _loadDays();

      if (!mounted) return;
      setState(() {
        _entitlements = list;
        _selected = selected;
        _loading = false;
      });
      if (list.isNotEmpty) {
        _loadCounts();
        _loadDayCounts();
      }
    } catch (e) {
      // Offline (or the load failed): keep scanning from the downloaded cache if
      // one exists, otherwise show a load error that points at O02.
      if (!mounted) return;
      if (isNetworkError(e)) _sync.markOffline();
      final cache = _cache;
      if (cache != null && cache.entitlementMaps.isNotEmpty) {
        await _buildFromCache(cache);
      } else {
        final msg = describeError(e, context: 'entitlements');
        setState(() {
          _loading = false;
          _loadError = '$msg Download offline data while you have signal.';
        });
      }
    }
  }

  /// Rebuild the scanner's mode list + day structure from the offline cache so
  /// the field app keeps working with no signal.
  Future<void> _buildFromCache(CachedEvent cache) async {
    final list = cache.entitlementMaps.map(EntitlementDef.fromMap).toList();
    final storedId = await _secure.read(key: 'entitlement_mode_${widget.eventId}');
    EntitlementDef? selected;
    if (list.isNotEmpty) {
      selected = list.firstWhere((e) => e.id == storedId, orElse: () => list.first);
    }
    final days = cache.dayMaps.map(EventDay.fromMap).toList();
    final storedDay = await _secure.read(key: 'entitlement_day_${widget.eventId}');
    _days = days;
    _dayLinks = cache.dayLinks;
    _selectedDayIndex = _computeDefaultDay(days, storedDay);
    if (!mounted) return;
    setState(() {
      _entitlements = list;
      _selected = selected;
      _loading = false;
    });
  }

  Future<void> _loadCounts() async {
    try {
      final entries = await Future.wait(
        _entitlements.map((e) async => MapEntry(e.id, await _netRedemptions(e.id))),
      );
      if (!mounted) return;
      setState(() {
        for (final e in entries) {
          _counts[e.key] = e.value;
        }
      });
    } catch (_) {
      // Counters are best-effort; a failed refresh leaves the last known value.
    }
  }

  /// Net active redemptions across the event:
  /// (action='redeemed' AND status='redeemed') minus (action='un_redeemed').
  Future<int> _netRedemptions(String entitlementId) async {
    final redeemed = await supa
        .from('entitlement_redemptions')
        .select('id')
        .eq('event_id', widget.eventId)
        .eq('entitlement_id', entitlementId)
        .eq('action', 'redeemed')
        .eq('status', 'redeemed')
        .count(CountOption.exact);
    final undone = await supa
        .from('entitlement_redemptions')
        .select('id')
        .eq('event_id', widget.eventId)
        .eq('entitlement_id', entitlementId)
        .eq('action', 'un_redeemed')
        .count(CountOption.exact);
    return (redeemed.count) - (undone.count);
  }

  // ── Multi-day (G5 · M02) ────────────────────────────────────────────────────

  /// Load `event_days` + their `event_day_entitlements` links, then resolve the
  /// default selected day. Any failure leaves single-day behaviour intact.
  Future<void> _loadDays() async {
    try {
      final dayRows = await supa
          .from('event_days')
          .select('id, day_index, date, checkin_enabled, capacity')
          .eq('event_id', widget.eventId)
          .order('day_index');
      final days = asMapList(dayRows).map(EventDay.fromMap).toList();

      final links = <String, Set<String>>{};
      if (days.isNotEmpty) {
        final dayIds = days.map((d) => d.id).toList();
        final linkRows = await supa
            .from('event_day_entitlements')
            .select('event_day_id, entitlement_id')
            .inFilter('event_day_id', dayIds);
        for (final r in asMapList(linkRows)) {
          final dId = (r['event_day_id'] ?? '').toString();
          final eId = (r['entitlement_id'] ?? '').toString();
          if (dId.isEmpty || eId.isEmpty) continue;
          (links[dId] ??= <String>{}).add(eId);
        }
      }

      final stored = await _secure.read(key: 'entitlement_day_${widget.eventId}');
      _days = days;
      _dayLinks = links;
      _selectedDayIndex = _computeDefaultDay(days, stored);
    } catch (_) {
      _days = const [];
      _dayLinks = const {};
      _selectedDayIndex = null;
    }
  }

  /// Prefer a persisted (and still-enabled) day, else today's day, else the
  /// first day open for check-in. Null when no day is open.
  int? _computeDefaultDay(List<EventDay> days, String? stored) {
    final storedIdx = int.tryParse(stored ?? '');
    if (storedIdx != null &&
        days.any((d) => d.dayIndex == storedIdx && d.checkinEnabled)) {
      return storedIdx;
    }
    final now = DateTime.now();
    for (final d in days) {
      if (d.checkinEnabled && d.date != null && _sameDate(d.date!, now)) {
        return d.dayIndex;
      }
    }
    for (final d in days) {
      if (d.checkinEnabled) return d.dayIndex;
    }
    return null;
  }

  bool _sameDate(DateTime a, DateTime b) =>
      a.year == b.year && a.month == b.month && a.day == b.day;

  /// The day whose `date` is today (emphasised in the selector), if any.
  int? get _todayDayIndex {
    final now = DateTime.now();
    for (final d in _days) {
      if (d.date != null && _sameDate(d.date!, now)) return d.dayIndex;
    }
    return null;
  }

  EventDay? get _selectedDay {
    final idx = _selectedDayIndex;
    if (idx == null) return null;
    for (final d in _days) {
      if (d.dayIndex == idx) return d;
    }
    return null;
  }

  /// UI affordance only — the RPC stays the source of truth. Blocks scanning
  /// when no day is open, the selected day is disabled, or the selected mode is
  /// not linked to the selected day (only when that day has any links).
  bool get _dayScanBlocked {
    if (_days.isEmpty) return false;
    final day = _selectedDay;
    if (day == null || !day.checkinEnabled) return true;
    final links = _dayLinks[day.id];
    if (links == null || links.isEmpty) return false; // no restriction configured
    final ent = _selected;
    if (ent == null) return true;
    return !links.contains(ent.id);
  }

  /// One terse line explaining why scanning is blocked, or null when it isn't.
  String? get _dayGateMessage {
    if (_days.isEmpty) return null;
    final day = _selectedDay;
    if (day == null) return 'No day open for check-in';
    final links = _dayLinks[day.id];
    final ent = _selected;
    if (links != null && links.isNotEmpty && ent != null && !links.contains(ent.id)) {
      // day_index is stored 0-based; always displayed 1-based (matches web).
      return '${ent.name} not valid on Day ${day.dayIndex + 1}';
    }
    return null;
  }

  Future<void> _selectDay(int dayIndex) async {
    if (dayIndex == _selectedDayIndex) return;
    setState(() => _selectedDayIndex = dayIndex);
    await _secure.write(
        key: 'entitlement_day_${widget.eventId}', value: '$dayIndex');
  }

  /// Per-day net redemptions for the currently selected mode.
  Future<void> _loadDayCounts() async {
    final ent = _selected;
    if (ent == null || _days.isEmpty) return;
    try {
      final entries = await Future.wait(
        _days.map((d) async =>
            MapEntry(d.dayIndex, await _dayNetRedemptions(ent.id, d.dayIndex))),
      );
      if (!mounted) return;
      setState(() {
        _dayCounts.clear();
        for (final e in entries) {
          _dayCounts[e.key] = e.value;
        }
      });
    } catch (_) {
      // Counters are best-effort; a failed refresh keeps the last known values.
    }
  }

  /// Net active redemptions for one entitlement on one day_index:
  /// (action='redeemed' AND status='redeemed') minus (action='un_redeemed').
  Future<int> _dayNetRedemptions(String entitlementId, int dayIndex) async {
    final redeemed = await supa
        .from('entitlement_redemptions')
        .select('id')
        .eq('event_id', widget.eventId)
        .eq('entitlement_id', entitlementId)
        .eq('day_index', dayIndex)
        .eq('action', 'redeemed')
        .eq('status', 'redeemed')
        .count(CountOption.exact);
    final undone = await supa
        .from('entitlement_redemptions')
        .select('id')
        .eq('event_id', widget.eventId)
        .eq('entitlement_id', entitlementId)
        .eq('day_index', dayIndex)
        .eq('action', 'un_redeemed')
        .count(CountOption.exact);
    return (redeemed.count) - (undone.count);
  }

  // ── Scanning ────────────────────────────────────────────────────────────────

  Future<void> _onDetect(BarcodeCapture capture) async {
    if (_busy || _result != null || _selected == null || _dayScanBlocked) return;
    final raw = capture.barcodes.isNotEmpty ? capture.barcodes.first.rawValue : null;
    final token = extractCheckinToken(raw);
    if (token == null) return;

    final now = DateTime.now();
    if (token == _lastToken && now.difference(_lastScan).inSeconds < 3) return;
    _lastToken = token;
    _lastScan = now;

    setState(() => _busy = true);
    final entitlement = _selected!;

    // ONE client_uuid per scan, generated here and reused on every replay. If
    // the online RPC below reaches the server but the response is lost to a
    // dropped connection, the same client_uuid on the offline replay makes the
    // server return the prior result instead of double-inserting (065's unique
    // index + idempotency branch). Never regenerate it on retry.
    final clientUuid = _clientUuid();
    final scannedAt = DateTime.now().toUtc().toIso8601String();
    try {
      // Resolve QR -> registration for this event (same path as check-in).
      final regRows = await supa
          .from('registrations')
          .select('id')
          .eq('qr_code_token', token)
          .eq('event_id', widget.eventId)
          .limit(1);
      final regList = asMapList(regRows);
      if (regList.isEmpty) {
        _show(EntitlementScanResult.error('QR not recognised for this event'));
        return;
      }
      final registrationId = regList.first['id'].toString();

      final res = await supa.rpc('redeem_entitlement', params: {
        'p_entitlement_id': entitlement.id,
        'p_registration_id': registrationId,
        'p_day_index': _selectedDayIndex,
        'p_client_uuid': clientUuid,
        'p_device_id': _deviceId,
        'p_source': 'online',
        'p_scanned_at': scannedAt,
      });
      _sync.markOnline();
      _show(EntitlementScanResult.fromRpc(res));
      _loadCounts();
      _loadDayCounts();
    } catch (e) {
      if (isNetworkError(e)) {
        // No signal: resolve from cache + queue with the SAME client_uuid.
        _sync.markOffline();
        await _handleOffline(token, entitlement, clientUuid, scannedAt);
      } else {
        _show(EntitlementScanResult.error(describeError(e, context: 'that scan')));
      }
    }
  }

  /// Offline scan path (O03). Resolves the QR against the local cache and writes
  /// a durable queue entry. Results are PROVISIONAL — never server-confirmed.
  Future<void> _handleOffline(
    String token,
    EntitlementDef entitlement,
    String clientUuid,
    String scannedAt,
  ) async {
    final cache = _cache;
    // No cache, or token not in it: we cannot verify anything — say so, do NOT
    // queue (we have no registration id to redeem against).
    if (cache == null) {
      _show(EntitlementScanResult.notInCache());
      return;
    }
    final reg = cache.registrationByToken(token);
    if (reg == null) {
      _show(EntitlementScanResult.notInCache());
      return;
    }

    // Local duplicate guard: for once / once_per_day, block a second offline
    // scan of the same slot on THIS device before any sync.
    final limited = entitlement.redemptionLimit != 'unlimited';
    if (limited &&
        ScanQueue.instance
            .hasPendingFor(reg.id, entitlement.id, _selectedDayIndex)) {
      _show(EntitlementScanResult.offlineAlready(
          name: reg.name, ticket: reg.ticketName));
      return;
    }

    final covered = cache.ticketIncludes(reg, entitlement.id);

    // D04 — dietary rides along on MEAL scans ONLY. `entitlement.type == 'meal'`
    // is the SAME privacy guard the result view enforces via entitlement.isMeal:
    // the caterer needs this, nobody else. Entry / transport / merch / session /
    // parking / certificate offline scans carry no dietary at all.
    var offlineDietary = const <String>[];
    String? offlineDietaryNote;
    if (entitlement.type == 'meal') {
      offlineDietary = reg.dietary;
      offlineDietaryNote = reg.dietaryNote;
    }

    // Queue regardless of coverage — the server is the source of truth and will
    // decide on replay. We only differ in how honestly we label the result.
    await ScanQueue.instance.enqueue(QueuedScan(
      clientUuid: clientUuid,
      entitlementId: entitlement.id,
      registrationId: reg.id,
      dayIndex: _selectedDayIndex,
      deviceId: _deviceId ?? 'unknown',
      scannedAt: scannedAt,
      attendeeName: reg.name,
      entitlementName: entitlement.name,
      ticketName: reg.ticketName,
    ));

    if (covered) {
      _show(EntitlementScanResult.offlineCheckedIn(
          name: reg.name,
          ticket: reg.ticketName,
          dietary: offlineDietary,
          dietaryNote: offlineDietaryNote));
    } else {
      _show(EntitlementScanResult.offlineUnverified(
          name: reg.name,
          ticket: reg.ticketName,
          dietary: offlineDietary,
          dietaryNote: offlineDietaryNote));
    }
  }

  Future<void> _openPrepare() async {
    await Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => OfflinePrepareScreen(
          eventId: widget.eventId, eventName: widget.eventName),
    ));
    final c = await EventCache.load(widget.eventId);
    if (mounted) setState(() => _cache = c);
  }

  Future<void> _showAttention() async {
    await showMSheet(
      context,
      OfflineAttentionSheet(
        items: ScanQueue.instance.attention,
        onClear: () async {
          await ScanQueue.instance.clearAttention();
          if (mounted) Navigator.of(context).pop();
        },
      ),
    );
  }

  void _show(EntitlementScanResult result) {
    _haptic(result.status);
    if (!mounted) return;
    setState(() => _result = result);
    _dismissTimer?.cancel();
    final ms = result.status == 'redeemed' ? 1800 : 2800;
    _dismissTimer = Timer(Duration(milliseconds: ms), _dismissResult);
  }

  void _dismissResult() {
    _dismissTimer?.cancel();
    if (!mounted) return;
    setState(() {
      _result = null;
      _busy = false;
    });
  }

  void _haptic(String status) {
    switch (status) {
      case 'redeemed':
        HapticFeedback.mediumImpact();
        break;
      case 'already':
        HapticFeedback.lightImpact();
        break;
      default:
        HapticFeedback.heavyImpact();
    }
  }

  // ── Mode selector (E04) ──────────────────────────────────────────────────────

  Future<void> _openModeSheet() async {
    _loadCounts();
    final picked = await showModalBottomSheet<EntitlementDef>(
      context: context,
      backgroundColor: AppColors.surface,
      isScrollControlled: true,
      useSafeArea: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.sheet)),
      ),
      builder: (ctx) => _ModeSheet(
        entitlements: _entitlements,
        counts: _counts,
        selectedId: _selected?.id,
      ),
    );
    if (picked != null) {
      setState(() => _selected = picked);
      await _secure.write(
          key: 'entitlement_mode_${widget.eventId}', value: picked.id);
      _loadDayCounts(); // per-day counts + the day gate track the selected mode
    }
  }

  // ── Build ─────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    if (_loading) return _darkShell(const _InitFrame(label: 'Loading entitlements'));
    if (_loadError != null) {
      return _darkShell(_DarkError(message: _loadError!, onRetry: _bootstrap));
    }
    if (_entitlements.isEmpty) return _darkShell(const _NoEntitlements());
    return _scanner();
  }

  Widget _darkShell(Widget body, {List<Widget> actions = const []}) => MScaffold(
        background: AppColors.forestDark,
        appBar: _ScannerAppBar(title: widget.eventName, actions: actions),
        body: body,
      );

  Widget _scanner() {
    final selected = _selected!;
    return _darkShell(
      Stack(
        children: [
          Positioned.fill(
            child: MobileScanner(
              controller: _controller,
              onDetect: _onDetect,
              placeholderBuilder: (_, __) => const _InitFrame(label: 'Starting camera'),
              errorBuilder: (_, error, __) => _CameraError(
                error: error,
                onRetry: () => _controller.start(),
              ),
            ),
          ),

          // Framing reticle.
          Center(
            child: Container(
              width: 236,
              height: 236,
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.gold, width: 3),
                borderRadius: BorderRadius.circular(20),
              ),
            ),
          ),

          // Persistent connection indicator (O01): online / offline+queued /
          // syncing, plus a tap-through to any scans that need attention.
          Positioned(
            top: 12,
            left: 0,
            right: 0,
            child: Center(
              child: ConnectionIndicator(
                controller: _sync,
                onTapAttention: _showAttention,
              ),
            ),
          ),

          // Day selector (G5 · M02) — renders nothing for single-day events.
          if (_days.isNotEmpty)
            Positioned(
              top: 52,
              left: 0,
              right: 0,
              child: ScannerDaySelector(
                days: _days,
                selectedDayIndex: _selectedDayIndex,
                todayDayIndex: _todayDayIndex,
                counts: _dayCounts,
                gateMessage: _dayGateMessage,
                onSelect: _selectDay,
              ),
            ),

          // Mode bar (E04): what every scan redeems + its live counter.
          Positioned(
            left: 20,
            right: 20,
            bottom: 20,
            child: _ModeBar(
              entitlement: selected,
              count: _counts[selected.id],
              onTap: _openModeSheet,
            ),
          ),

          // Result surface (E05–E08 / error).
          if (_result != null)
            Positioned.fill(
              child: EntitlementScanResultView(
                result: _result!,
                entitlement: selected,
                onDismiss: _dismissResult,
              ),
            ),
        ],
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.cloud_download_outlined, color: Colors.white),
          onPressed: _openPrepare,
        ),
        IconButton(
          icon: const Icon(Icons.flash_on, color: Colors.white),
          onPressed: () => _controller.toggleTorch(),
        ),
        IconButton(
          icon: const Icon(Icons.cameraswitch_outlined, color: Colors.white),
          onPressed: () => _controller.switchCamera(),
        ),
      ],
    );
  }
}

// ── Dark app bar ─────────────────────────────────────────────────────────────

class _ScannerAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final List<Widget> actions;
  const _ScannerAppBar({required this.title, this.actions = const []});

  @override
  Size get preferredSize => const Size.fromHeight(52);

  @override
  Widget build(BuildContext context) {
    final topInset = MediaQuery.of(context).padding.top;
    return Container(
      color: AppColors.forestDark,
      padding: EdgeInsets.only(top: topInset, left: 4, right: 8),
      child: SizedBox(
        height: 52,
        child: Row(
          children: [
            IconButton(
              icon: const Icon(Icons.arrow_back, color: Colors.white),
              onPressed: () => Navigator.of(context).maybePop(),
            ),
            Expanded(
              child: Text(title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.title.copyWith(color: Colors.white)),
            ),
            ...actions,
          ],
        ),
      ),
    );
  }
}

// ── Mode bar + selector sheet ────────────────────────────────────────────────

class _ModeBar extends StatelessWidget {
  final EntitlementDef entitlement;
  final int? count;
  final VoidCallback onTap;
  const _ModeBar({required this.entitlement, required this.count, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: AppColors.forestCard,
          borderRadius: BorderRadius.circular(AppRadius.card),
          border: Border.all(color: AppColors.forestSurface),
        ),
        child: Row(
          children: [
            Icon(entitlement.icon, color: AppColors.gold, size: 22),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(entitlement.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.h3.copyWith(color: Colors.white)),
                  const SizedBox(height: 2),
                  Text(
                    count == null ? 'Tap to change' : '$count redeemed  ·  tap to change',
                    style: AppText.caption.copyWith(color: Colors.white70),
                  ),
                ],
              ),
            ),
            const Icon(Icons.unfold_more, color: Colors.white70, size: 20),
          ],
        ),
      ),
    );
  }
}

class _ModeSheet extends StatelessWidget {
  final List<EntitlementDef> entitlements;
  final Map<String, int> counts;
  final String? selectedId;
  const _ModeSheet({
    required this.entitlements,
    required this.counts,
    required this.selectedId,
  });

  @override
  Widget build(BuildContext context) {
    final media = MediaQuery.of(context);
    return ConstrainedBox(
      constraints: BoxConstraints(maxHeight: media.size.height * 0.75),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            width: 38,
            height: 5,
            margin: const EdgeInsets.only(top: 8, bottom: 4),
            decoration: BoxDecoration(
                color: AppColors.borderStrong,
                borderRadius: BorderRadius.circular(3)),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(AppSpace.lg, 12, AppSpace.lg, 4),
            child: Text('Scan mode', style: AppText.h3),
          ),
          Flexible(
            child: ListView.separated(
              shrinkWrap: true,
              padding: EdgeInsets.fromLTRB(
                  AppSpace.lg, 4, AppSpace.lg, media.padding.bottom + AppSpace.lg),
              itemCount: entitlements.length,
              separatorBuilder: (_, __) =>
                  const Divider(height: 1, color: AppColors.border),
              itemBuilder: (_, i) {
                final e = entitlements[i];
                final on = e.id == selectedId;
                final count = counts[e.id];
                return InkWell(
                  onTap: () => Navigator.of(context).pop(e),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    child: Row(
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: AppColors.forestSoft,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(e.icon, color: AppColors.forest, size: 20),
                        ),
                        const SizedBox(width: 13),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(e.name,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: AppText.h3.copyWith(fontSize: 15.5)),
                              const SizedBox(height: 2),
                              Text(
                                count == null
                                    ? e.limitLabel
                                    : '${e.limitLabel}  ·  $count redeemed',
                                style: AppText.bodySm,
                              ),
                            ],
                          ),
                        ),
                        if (on)
                          const Icon(Icons.check_circle,
                              color: AppColors.forest, size: 22)
                        else
                          const Icon(Icons.radio_button_unchecked,
                              color: AppColors.borderStrong, size: 22),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

// ── Dark states ──────────────────────────────────────────────────────────────

class _InitFrame extends StatelessWidget {
  final String label;
  const _InitFrame({required this.label});
  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.forestDark,
      alignment: Alignment.center,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(
            width: 26,
            height: 26,
            child: CircularProgressIndicator(strokeWidth: 2.5, color: AppColors.gold),
          ),
          const SizedBox(height: 16),
          Text(label, style: AppText.bodySm.copyWith(color: Colors.white70)),
        ],
      ),
    );
  }
}

class _DarkError extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const _DarkError({required this.message, required this.onRetry});
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, color: AppColors.danger, size: 40),
            const SizedBox(height: 14),
            Text(message,
                textAlign: TextAlign.center,
                style: AppText.body.copyWith(color: Colors.white)),
            const SizedBox(height: 18),
            MButton('Try again', kind: MBtnKind.gold, fullWidth: false, onTap: onRetry),
          ],
        ),
      ),
    );
  }
}

class _NoEntitlements extends StatelessWidget {
  const _NoEntitlements();
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 64,
              height: 64,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                  color: AppColors.forestCard, shape: BoxShape.circle),
              child: const Icon(Icons.confirmation_number_outlined,
                  color: AppColors.gold, size: 30),
            ),
            const SizedBox(height: 16),
            Text('No entitlements', style: AppText.h3.copyWith(color: Colors.white)),
            const SizedBox(height: 6),
            Text('Create entitlements for this event on the web, then scan here.',
                textAlign: TextAlign.center,
                style: AppText.bodySm.copyWith(color: Colors.white70)),
          ],
        ),
      ),
    );
  }
}

class _CameraError extends StatelessWidget {
  final MobileScannerException error;
  final VoidCallback onRetry;
  const _CameraError({required this.error, required this.onRetry});

  bool get _denied => error.errorCode == MobileScannerErrorCode.permissionDenied;

  Future<void> _openSettings(BuildContext context) async {
    // iOS: opens this app's settings. Android has no such URL — guide the user.
    final uri = Uri.parse('app-settings:');
    try {
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri);
        return;
      }
    } catch (_) {/* fall through to guidance */}
    if (context.mounted) {
      showToast(context, 'Settings > Apps > Eventera > Permissions > Camera');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.forestDark,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(_denied ? Icons.no_photography_outlined : Icons.videocam_off_outlined,
                  color: AppColors.gold, size: 40),
              const SizedBox(height: 14),
              Text(
                _denied
                    ? 'Camera access is off — allow it to scan entitlements.'
                    : 'The camera could not start.',
                textAlign: TextAlign.center,
                style: AppText.body.copyWith(color: Colors.white),
              ),
              const SizedBox(height: 18),
              MButton(
                _denied ? 'Open settings' : 'Try again',
                kind: MBtnKind.gold,
                fullWidth: false,
                onTap: _denied ? () => _openSettings(context) : onRetry,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
