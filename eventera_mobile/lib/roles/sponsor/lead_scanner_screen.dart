// Sponsor/Exhibitor lead retrieval (SPO02 scanner + SPO03 capture sheet).
// Dark full-screen QR scanner; on detect, a bottom sheet rates the lead
// hot/warm/cold + note, then calls the `capture_lead` RPC (059_sponsor_lead_capture.sql).
//
// DRAFT — not build-tested. Requires the `mobile_scanner` package + camera permission
// (see docs/MOBILE_CHECKIN_SCANNER_SPEC.md). Token extraction shared with the check-in scanner.

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../ui/tokens.dart';
import '../../ui/components.dart';
import '../../screens/organizer/checkin_scanner_screen.dart' show extractCheckinToken;

class LeadScannerScreen extends StatefulWidget {
  final String sponsorId;
  final String boothName;
  const LeadScannerScreen({super.key, required this.sponsorId, required this.boothName});

  @override
  State<LeadScannerScreen> createState() => _LeadScannerScreenState();
}

class _LeadScannerScreenState extends State<LeadScannerScreen> {
  final MobileScannerController _controller = MobileScannerController();
  bool _sheetOpen = false;
  int _count = 0;

  Future<void> _onDetect(BarcodeCapture capture) async {
    if (_sheetOpen) return;
    final raw = capture.barcodes.isNotEmpty ? capture.barcodes.first.rawValue : null;
    final token = extractCheckinToken(raw);
    if (token == null) return;
    _sheetOpen = true;
    final saved = await _showCaptureSheet(token);
    if (saved == true) setState(() => _count++);
    _sheetOpen = false;
  }

  Future<bool?> _showCaptureSheet(String token) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => _CaptureSheet(sponsorId: widget.sponsorId, token: token),
    );
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
      appBar: MAppBar(title: 'Lead retrieval', background: AppColors.ink),
      body: Stack(
        children: [
          MobileScanner(controller: _controller, onDetect: _onDetect),
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
          Positioned(
            top: 16, left: 0, right: 0,
            child: Column(children: [
              Text(widget.boothName,
                  style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600)),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                decoration: BoxDecoration(
                    color: Colors.black45, borderRadius: BorderRadius.circular(999)),
                child: Text('$_count leads today',
                    style: const TextStyle(color: Colors.white, fontSize: 12.5)),
              ),
            ]),
          ),
          const Positioned(
            left: 20, right: 20, bottom: 40,
            child: Text('Scan an attendee\'s ticket QR to capture a lead',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white70, fontSize: 13)),
          ),
        ],
      ),
    );
  }
}

/// SPO03 — rate the captured lead + note, then save via `capture_lead`.
class _CaptureSheet extends StatefulWidget {
  final String sponsorId;
  final String token;
  const _CaptureSheet({required this.sponsorId, required this.token});

  @override
  State<_CaptureSheet> createState() => _CaptureSheetState();
}

class _CaptureSheetState extends State<_CaptureSheet> {
  String _rating = 'warm';
  final _note = TextEditingController();
  bool _saving = false;
  String? _error;

  static const _ratings = [
    ('hot', 'Hot', AppColors.danger),
    ('warm', 'Warm', AppColors.warning),
    ('cold', 'Cold', AppColors.forest),
  ];

  Future<void> _save() async {
    setState(() { _saving = true; _error = null; });
    try {
      final res = await Supabase.instance.client.rpc('capture_lead', params: {
        'p_sponsor_id': widget.sponsorId,
        'p_qr_token': widget.token,
        'p_rating': _rating,
        'p_note': _note.text.trim().isEmpty ? null : _note.text.trim(),
      });
      final map = (res is Map) ? Map<String, dynamic>.from(res) : {};
      if (map['result'] == 'success') {
        if (mounted) Navigator.pop(context, true);
      } else {
        setState(() => _error = (map['message'] ?? 'Could not capture').toString());
      }
    } catch (_) {
      setState(() => _error = 'Could not reach the server.');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.only(left: 20, right: 20, top: 20, bottom: 20 + bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Rate this lead',
              style: TextStyle(color: AppColors.ink, fontSize: 17, fontWeight: FontWeight.w700)),
          const SizedBox(height: 14),
          Row(
            children: _ratings.map((r) {
              final sel = _rating == r.$1;
              return Expanded(
                child: GestureDetector(
                  onTap: () => setState(() => _rating = r.$1),
                  child: Container(
                    margin: const EdgeInsets.only(right: 8),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    decoration: BoxDecoration(
                      color: sel ? r.$3.withOpacity(0.12) : AppColors.creamSoft,
                      border: Border.all(color: sel ? r.$3 : AppColors.border, width: sel ? 2 : 1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Center(
                      child: Text(r.$2,
                          style: TextStyle(
                              color: sel ? r.$3 : AppColors.inkMuted,
                              fontWeight: FontWeight.w700,
                              fontSize: 13.5)),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 14),
          TextField(
            controller: _note,
            maxLines: 2,
            decoration: InputDecoration(
              hintText: 'Add a note (optional)',
              filled: true,
              fillColor: AppColors.creamSoft,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
            ),
          ),
          if (_error != null) ...[
            const SizedBox(height: 8),
            Text(_error!, style: const TextStyle(color: AppColors.danger, fontSize: 12.5)),
          ],
          const SizedBox(height: 16),
          MButton('Save lead', loading: _saving, onTap: _saving ? null : _save),
        ],
      ),
    );
  }
}
