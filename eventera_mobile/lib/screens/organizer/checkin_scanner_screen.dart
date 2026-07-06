// Check-in scanner — organizer/staff scan attendee QR codes at the door.
// Talks to Supabase via the `checkin_registration` RPC (see supabase/058_checkin_rpc.sql).
//
// Requires the `mobile_scanner` package (add to pubspec) and camera permission
// (see docs/MOBILE_CHECKIN_SCANNER_SPEC.md for the exact manifest entries).

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../ui/tokens.dart';
import '../../ui/components.dart';

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
    if (_busy) return;
    final raw = capture.barcodes.isNotEmpty ? capture.barcodes.first.rawValue : null;
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
      final map = (res is Map) ? Map<String, dynamic>.from(res) : <String, dynamic>{};
      final result = (map['result'] ?? 'error').toString();
      if (result == 'success') _count++;
      if (mounted) {
        setState(() => _result = _Result(
              result: result,
              name: map['attendee_name']?.toString(),
              ticket: map['ticket']?.toString(),
              message: map['message']?.toString() ?? '',
            ));
      }
    } catch (e) {
      if (mounted) {
        setState(() => _result = _Result(
              result: 'error', message: 'Could not reach the server. Try again.'));
      }
    } finally {
      // Show the result for a moment, then clear so the next scan can register.
      Timer(const Duration(milliseconds: 1600), () {
        if (mounted) setState(() { _busy = false; _result = null; });
      });
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      background: AppColors.ink,
      appBar: MAppBar(
        title: 'Check-in',
        background: AppColors.ink,
        actions: [
          IconButton(
            icon: const Icon(Icons.flash_on, color: Colors.white),
            onPressed: () => _controller.toggleTorch(),
          ),
          IconButton(
            icon: const Icon(Icons.cameraswitch_outlined, color: Colors.white),
            onPressed: () => _controller.switchCamera(),
          ),
        ],
      ),
      body: Stack(
        children: [
          MobileScanner(controller: _controller, onDetect: _onDetect),

          // Framing reticle
          Center(
            child: Container(
              width: 240,
              height: 240,
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.gold, width: 3),
                borderRadius: BorderRadius.circular(20),
              ),
            ),
          ),

          // Event name + session counter
          Positioned(
            top: 16, left: 20, right: 20,
            child: Column(
              children: [
                Text(widget.eventName,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                        color: Colors.white, fontSize: 15, fontWeight: FontWeight.w600)),
                const SizedBox(height: 4),
                Text('$_count checked in this session',
                    style: const TextStyle(color: Colors.white70, fontSize: 12.5)),
              ],
            ),
          ),

          // Result banner
          if (_result != null)
            Positioned(
              left: 20, right: 20, bottom: 40,
              child: _ResultBanner(result: _result!),
            )
          else
            const Positioned(
              left: 20, right: 20, bottom: 40,
              child: Text('Point the camera at an attendee\'s QR code',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.white70, fontSize: 13)),
            ),
        ],
      ),
    );
  }
}

class _Result {
  final String result;
  final String? name;
  final String? ticket;
  final String message;
  const _Result({required this.result, this.name, this.ticket, this.message = ''});
}

class _ResultBanner extends StatelessWidget {
  final _Result result;
  const _ResultBanner({required this.result});

  @override
  Widget build(BuildContext context) {
    late final Color bg;
    late final IconData icon;
    switch (result.result) {
      case 'success':
        bg = AppColors.success; icon = Icons.check_circle; break;
      case 'already_checked_in':
        bg = AppColors.warning; icon = Icons.info; break;
      default:
        bg = AppColors.danger; icon = Icons.cancel;
    }
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(16)),
      child: Row(
        children: [
          Icon(icon, color: Colors.white, size: 26),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(result.name ?? result.message,
                    style: const TextStyle(
                        color: Colors.white, fontSize: 15, fontWeight: FontWeight.w700)),
                if (result.name != null)
                  Text(
                    [result.ticket, result.message].where((s) => s != null && s.isNotEmpty).join(' · '),
                    style: const TextStyle(color: Colors.white, fontSize: 12.5),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
