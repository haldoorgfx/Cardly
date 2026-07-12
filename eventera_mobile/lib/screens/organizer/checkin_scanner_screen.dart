// Check-in scanner (O03–O06) — organizer/staff scan attendee QR codes at the
// door. Dark camera screen with gold corner brackets and an animated scanline;
// each scan flips to a full-screen result (green success / amber already-in /
// red invalid) with a "Scan next" button, exactly per the design reference.
//
// Talks to Supabase via the `checkin_registration` RPC (supabase/058).

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../ui/components.dart';
import '../../ui/tokens.dart';

/// Extract a check-in token from scanned QR text.
/// Mirrors lib/qr/token.ts on the web: the QR encodes either the raw token or a
/// URL like `.../check-in?token=XXXX`.
String? extractCheckinToken(String? scanned) {
  final text = (scanned ?? '').trim();
  if (text.isEmpty) return null;
  final urlMatch =
      RegExp(r'[?&]token=([A-Za-z0-9_-]+)', caseSensitive: false).firstMatch(text);
  if (urlMatch != null) return urlMatch.group(1);
  if (RegExp(r'^[A-Za-z0-9_-]{6,64}$').hasMatch(text)) return text;
  return null;
}

const _camBg = Color(0xFF0A0F0C);

class CheckinScannerScreen extends StatefulWidget {
  final String eventId;
  final String eventName;
  const CheckinScannerScreen({
    super.key,
    required this.eventId,
    required this.eventName,
  });

  @override
  State<CheckinScannerScreen> createState() => _CheckinScannerScreenState();
}

class _CheckinScannerScreenState extends State<CheckinScannerScreen> {
  final MobileScannerController _controller = MobileScannerController(
    detectionSpeed: DetectionSpeed.normal,
    facing: CameraFacing.back,
  );

  bool _busy = false;
  String? _lastToken;
  DateTime _lastScan = DateTime.fromMillisecondsSinceEpoch(0);
  _Result? _result;
  int _count = 0; // checked in this session

  Future<void> _onDetect(BarcodeCapture capture) async {
    if (_busy || _result != null) return;
    final raw =
        capture.barcodes.isNotEmpty ? capture.barcodes.first.rawValue : null;
    final token = extractCheckinToken(raw);
    if (token == null) return;

    // Debounce: ignore the same code re-scanned within 3s.
    final now = DateTime.now();
    if (token == _lastToken && now.difference(_lastScan).inSeconds < 3) return;
    _lastToken = token;
    _lastScan = now;

    setState(() => _busy = true);
    try {
      final res = await Supabase.instance.client.rpc(
        'checkin_registration',
        params: {'p_event_id': widget.eventId, 'p_qr_token': token},
      );
      final map =
          (res is Map) ? Map<String, dynamic>.from(res) : <String, dynamic>{};
      final result = (map['result'] ?? 'error').toString();
      if (result == 'success') {
        _count++;
        HapticFeedback.mediumImpact();
      } else {
        HapticFeedback.heavyImpact();
      }
      if (mounted) {
        setState(() => _result = _Result(
              result: result,
              name: map['attendee_name']?.toString(),
              ticket: map['ticket']?.toString(),
              message: map['message']?.toString() ?? '',
              checkedInAt: DateTime.tryParse(
                  map['checked_in_at']?.toString() ?? ''),
              token: token,
            ));
      }
    } catch (_) {
      if (mounted) {
        setState(() => _result = _Result(
              result: 'error',
              message: "We couldn't reach the server. Check your connection "
                  'and try again.',
              token: token,
            ));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _scanNext() {
    HapticFeedback.selectionClick();
    setState(() => _result = null);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final result = _result;
    return Scaffold(
      backgroundColor: _camBg,
      body: result != null
          ? _ResultScreen(result: result, onScanNext: _scanNext)
          : _cameraView(),
    );
  }

  // ── O03 camera view ───────────────────────────────────────────────────────
  Widget _cameraView() {
    final topInset = MediaQuery.of(context).padding.top;
    return Stack(fit: StackFit.expand, children: [
      MobileScanner(
        controller: _controller,
        onDetect: _onDetect,
        errorBuilder: (context, error, child) => Container(
          color: _camBg,
          alignment: Alignment.center,
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.no_photography_outlined,
                  color: AppColors.gold, size: 44),
              const SizedBox(height: 16),
              const Text('We need the camera to scan',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 17,
                      fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              Text(
                'To check people in, allow camera access for Eventera in '
                'your phone Settings, then come back here.',
                textAlign: TextAlign.center,
                style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.75),
                    fontSize: 14,
                    height: 1.5),
              ),
            ],
          ),
        ),
      ),

      // Top bar: close · title + event · torch.
      Positioned(
        top: topInset + 8,
        left: 16,
        right: 16,
        child: Row(children: [
          _roundBtn(Icons.close, Colors.white, () => Navigator.of(context).maybePop()),
          Expanded(
            child: Column(children: [
              const Text('Check-in scanner',
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.w600)),
              const SizedBox(height: 1),
              Text(widget.eventName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.6),
                      fontSize: 10.5,
                      letterSpacing: 0.4)),
            ]),
          ),
          _roundBtn(Icons.flashlight_on_outlined, AppColors.gold,
              () => _controller.toggleTorch()),
        ]),
      ),

      // Scan frame: 4 gold corner brackets + sweeping scanline.
      const Center(child: _ScanFrame()),

      // Hint under the frame.
      Positioned(
        left: 26,
        right: 26,
        top: MediaQuery.of(context).size.height / 2 + 140,
        child: Column(children: [
          const Text('Point at attendee\'s QR code',
              textAlign: TextAlign.center,
              style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          Text('Hold steady inside the frame to check them in.',
              textAlign: TextAlign.center,
              style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.66),
                  fontSize: 13,
                  height: 1.45)),
        ]),
      ),

      // Session counter pill.
      Positioned(
        bottom: 40,
        left: 0,
        right: 0,
        child: Center(
          child: Container(
            height: 44,
            padding: const EdgeInsets.symmetric(horizontal: 18),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: Colors.white.withValues(alpha: 0.16)),
            ),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              const Icon(Icons.check, size: 16, color: Color(0xFF9FE0BB)),
              const SizedBox(width: 9),
              Text('$_count checked in',
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.w600)),
            ]),
          ),
        ),
      ),

      if (_busy)
        const Positioned(
          bottom: 100,
          left: 0,
          right: 0,
          child: Center(
            child: SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(
                    strokeWidth: 2.4, color: AppColors.gold)),
          ),
        ),
    ]);
  }

  Widget _roundBtn(IconData icon, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.12),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, size: 20, color: color),
      ),
    );
  }
}

// ─────────────────────────────────────────────── scan frame + scanline

class _ScanFrame extends StatefulWidget {
  const _ScanFrame();
  @override
  State<_ScanFrame> createState() => _ScanFrameState();
}

class _ScanFrameState extends State<_ScanFrame>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
      vsync: this, duration: const Duration(milliseconds: 2400))
    ..repeat();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    const size = 230.0;
    return SizedBox(
      width: size,
      height: size,
      child: Stack(children: [
        // Four corner brackets.
        for (final corner in const [
          Alignment.topLeft,
          Alignment.topRight,
          Alignment.bottomLeft,
          Alignment.bottomRight,
        ])
          Align(
            alignment: corner,
            child: _CornerBracket(alignment: corner),
          ),
        // Sweeping scanline.
        AnimatedBuilder(
          animation: _c,
          builder: (_, __) {
            // Ease down then up, like the CSS keyframes.
            final t = _c.value;
            final eased = t < .5
                ? Curves.easeInOut.transform(t * 2)
                : Curves.easeInOut.transform((1 - t) * 2);
            return Positioned(
              left: 8,
              right: 8,
              top: 12 + eased * (size - 28),
              child: Container(
                height: 2,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(2),
                  gradient: const LinearGradient(colors: [
                    Colors.transparent,
                    AppColors.gold,
                    Colors.transparent,
                  ]),
                  boxShadow: [
                    BoxShadow(
                        color: AppColors.gold.withValues(alpha: 0.6),
                        blurRadius: 12,
                        spreadRadius: 2),
                  ],
                ),
              ),
            );
          },
        ),
      ]),
    );
  }
}

class _CornerBracket extends StatelessWidget {
  final Alignment alignment;
  const _CornerBracket({required this.alignment});

  @override
  Widget build(BuildContext context) {
    final top = alignment.y < 0;
    final left = alignment.x < 0;
    return Container(
      width: 38,
      height: 38,
      decoration: BoxDecoration(
        border: Border(
          top: top
              ? const BorderSide(color: AppColors.gold, width: 3)
              : BorderSide.none,
          bottom: !top
              ? const BorderSide(color: AppColors.gold, width: 3)
              : BorderSide.none,
          left: left
              ? const BorderSide(color: AppColors.gold, width: 3)
              : BorderSide.none,
          right: !left
              ? const BorderSide(color: AppColors.gold, width: 3)
              : BorderSide.none,
        ),
        borderRadius: BorderRadius.only(
          topLeft: top && left ? const Radius.circular(6) : Radius.zero,
          topRight: top && !left ? const Radius.circular(6) : Radius.zero,
          bottomLeft: !top && left ? const Radius.circular(6) : Radius.zero,
          bottomRight: !top && !left ? const Radius.circular(6) : Radius.zero,
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────── scan results (O04–O06)

class _Result {
  final String result; // success | already_checked_in | error/...
  final String? name;
  final String? ticket;
  final String message;
  final DateTime? checkedInAt;
  final String token;
  const _Result({
    required this.result,
    this.name,
    this.ticket,
    this.message = '',
    this.checkedInAt,
    this.token = '',
  });
}

class _ResultScreen extends StatelessWidget {
  final _Result result;
  final VoidCallback onScanNext;
  const _ResultScreen({required this.result, required this.onScanNext});

  @override
  Widget build(BuildContext context) {
    switch (result.result) {
      case 'success':
        return _shell(
          context,
          glow: AppColors.success,
          badgeIcon: Icons.check,
          badgeColor: const Color(0xFF9FE0BB),
          status: 'CHECKED IN ✓',
          statusColor: const Color(0xFF9FE0BB),
          name: result.name ?? 'Attendee',
          sub: result.ticket ?? 'Ticket',
          showAvatar: true,
          nextLabel: 'Scan next',
        );
      case 'already_checked_in':
        return _shell(
          context,
          glow: AppColors.warning,
          badgeIcon: Icons.error_outline,
          badgeColor: const Color(0xFFFFD9A8),
          status: 'ALREADY CHECKED IN',
          statusColor: const Color(0xFFFFD9A8),
          name: result.name ?? 'Attendee',
          sub: result.ticket ?? 'Ticket',
          showAvatar: true,
          extra: result.checkedInAt != null
              ? _checkedAtBox(result.checkedInAt!)
              : null,
          nextLabel: 'Scan next',
        );
      default:
        return _shell(
          context,
          glow: AppColors.danger,
          badgeIcon: Icons.close,
          badgeColor: const Color(0xFFFFB4B0),
          status: 'INVALID CODE',
          statusColor: const Color(0xFFFFB4B0),
          name: 'Ticket not found',
          sub: result.message.isNotEmpty
              ? result.message
              : "This QR isn't a valid ticket for this event. Check they're "
                  'at the right event, or find them in the attendee list.',
          showAvatar: false,
          nextLabel: 'Try again',
        );
    }
  }

  Widget _shell(
    BuildContext context, {
    required Color glow,
    required IconData badgeIcon,
    required Color badgeColor,
    required String status,
    required Color statusColor,
    required String name,
    required String sub,
    required bool showAvatar,
    required String nextLabel,
    Widget? extra,
  }) {
    final topInset = MediaQuery.of(context).padding.top;
    return Container(
      decoration: BoxDecoration(
        gradient: RadialGradient(
          center: const Alignment(0, -0.85),
          radius: 1.2,
          colors: [glow.withValues(alpha: 0.32), _camBg],
          stops: const [0.0, 0.65],
        ),
      ),
      child: SafeArea(
        child: Column(children: [
          SizedBox(height: topInset > 0 ? 20 : 40),
          // Badge.
          Container(
            width: 84,
            height: 84,
            decoration: BoxDecoration(
              color: glow.withValues(alpha: 0.2),
              shape: BoxShape.circle,
              border: Border.all(color: badgeColor.withValues(alpha: 0.4)),
            ),
            child: Icon(badgeIcon, size: 42, color: badgeColor),
          ),
          const SizedBox(height: 16),
          Text(status,
              style: TextStyle(
                  color: statusColor,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 1.4)),
          if (showAvatar) ...[
            const SizedBox(height: 18),
            Container(
              width: 96,
              height: 96,
              padding: const EdgeInsets.all(3),
              decoration: const BoxDecoration(
                  color: AppColors.gold, shape: BoxShape.circle),
              child: ClipOval(
                child: PhotoPlaceholder(
                  hue: hueFromString(name),
                  child: Text(_initials(name),
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 32,
                          fontWeight: FontWeight.w600)),
                ),
              ),
            ),
          ],
          const SizedBox(height: 12),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Text(name,
                textAlign: TextAlign.center,
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 26,
                    fontWeight: FontWeight.w700,
                    letterSpacing: -0.5)),
          ),
          const SizedBox(height: 6),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 40),
            child: Text(sub,
                textAlign: TextAlign.center,
                style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.72),
                    fontSize: 13.5,
                    height: 1.5)),
          ),
          if (extra != null) ...[const SizedBox(height: 20), extra],
          const Spacer(),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
            child: MButton(nextLabel,
                kind: MBtnKind.gold,
                icon: Icons.qr_code_scanner,
                onTap: onScanNext),
          ),
        ]),
      ),
    );
  }

  Widget _checkedAtBox(DateTime at) {
    final local = at.toLocal();
    final hh =
        '${local.hour.toString().padLeft(2, '0')}:${local.minute.toString().padLeft(2, '0')}';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.warning.withValues(alpha: 0.18),
        borderRadius: BorderRadius.circular(12),
        border:
            Border.all(color: const Color(0xFFFFD9A8).withValues(alpha: 0.3)),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        const Icon(Icons.schedule, size: 18, color: Color(0xFFFFD9A8)),
        const SizedBox(width: 9),
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Checked in at',
              style: TextStyle(
                  fontSize: 11,
                  color: const Color(0xFFFFD9A8).withValues(alpha: 0.8))),
          Text(hh,
              style: const TextStyle(
                  fontSize: 15,
                  color: Colors.white,
                  fontWeight: FontWeight.w500)),
        ]),
      ]),
    );
  }

  static String _initials(String name) {
    final parts =
        name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts.first[0].toUpperCase();
    return (parts.first[0] + parts.last[0]).toUpperCase();
  }
}
