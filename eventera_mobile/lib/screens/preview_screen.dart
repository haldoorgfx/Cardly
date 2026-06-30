import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../card_store.dart';
import '../share_card.dart';
import '../theme.dart';

/// Success state: shows the finished card, saves it to the on-device history,
/// offers a copyable share caption, and save/share.
class PreviewScreen extends StatefulWidget {
  final Uint8List imageBytes;
  final String eventName;
  const PreviewScreen({
    super.key,
    required this.imageBytes,
    required this.eventName,
  });

  @override
  State<PreviewScreen> createState() => _PreviewScreenState();
}

class _PreviewScreenState extends State<PreviewScreen> {
  bool _sharing = false;

  @override
  void initState() {
    super.initState();
    // Save to local history (best-effort; not supported on web — ignore there).
    CardStore.instance
        .save(bytes: widget.imageBytes, eventName: widget.eventName)
        .catchError((_) => SavedCard(
              id: '',
              eventName: widget.eventName,
              createdAt: DateTime.now(),
              fileName: '',
            ));
  }

  Future<void> _share() async {
    setState(() => _sharing = true);
    try {
      await shareCardBytes(widget.imageBytes, widget.eventName);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not share the card.')),
        );
      }
    } finally {
      if (mounted) setState(() => _sharing = false);
    }
  }

  void _copyCaption() {
    Clipboard.setData(ClipboardData(text: suggestedCaption(widget.eventName)));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Caption copied'),
        duration: Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final caption = suggestedCaption(widget.eventName);
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Brand.cream,
        surfaceTintColor: Brand.cream,
        elevation: 0,
        title: const Text('Your card is ready',
            style: TextStyle(
                color: Brand.ink, fontSize: 17, fontWeight: FontWeight.w600)),
        iconTheme: const IconThemeData(color: Brand.ink),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
          children: [
            // The card
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x1F1F4D3A),
                      blurRadius: 40,
                      offset: Offset(0, 16),
                    ),
                  ],
                ),
                child: Image.memory(widget.imageBytes, fit: BoxFit.contain),
              ),
            ),
            const SizedBox(height: 22),

            // Suggested caption
            const Text('Suggested caption',
                style: TextStyle(
                    color: Brand.inkSoft,
                    fontSize: 13.5,
                    fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Brand.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Brand.border),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(caption,
                        style: const TextStyle(
                            color: Brand.ink, fontSize: 14, height: 1.5)),
                  ),
                  const SizedBox(width: 8),
                  InkWell(
                    onTap: _copyCaption,
                    borderRadius: BorderRadius.circular(8),
                    child: const Padding(
                      padding: EdgeInsets.all(4),
                      child: Icon(Icons.copy, color: Brand.forest, size: 20),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 22),

            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: _sharing ? null : _share,
                icon: _sharing
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                            strokeWidth: 2.4, color: Colors.white),
                      )
                    : const Icon(Icons.ios_share, size: 20),
                label: Text(_sharing ? 'Preparing…' : 'Save / Share card'),
              ),
            ),
            const SizedBox(height: 8),
            Center(
              child: TextButton(
                onPressed: () =>
                    Navigator.of(context).popUntil((r) => r.isFirst),
                child: const Text('Make another',
                    style: TextStyle(color: Brand.forest)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
