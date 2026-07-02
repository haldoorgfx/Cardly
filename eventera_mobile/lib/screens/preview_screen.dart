import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../card_store.dart';
import '../share_card.dart';
import '../ui/components.dart';
import '../ui/tokens.dart';

/// Success state (screen 16 — DARK): shows the finished card gently floating,
/// saves it to on-device history, offers a copyable share caption, and
/// save/share.
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

class _PreviewScreenState extends State<PreviewScreen>
    with SingleTickerProviderStateMixin {
  bool _sharing = false;

  late final AnimationController _floatCtrl = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 4500),
  )..repeat(reverse: true);

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

  @override
  void dispose() {
    _floatCtrl.dispose();
    super.dispose();
  }

  Future<void> _share() async {
    setState(() => _sharing = true);
    try {
      await shareCardBytes(widget.imageBytes, widget.eventName);
    } catch (_) {
      if (mounted) {
        showToast(context, 'Could not share the card.');
      }
    } finally {
      if (mounted) setState(() => _sharing = false);
    }
  }

  void _copyCaption() {
    Clipboard.setData(ClipboardData(text: suggestedCaption(widget.eventName)));
    if (!mounted) return;
    showToast(context, 'Caption copied');
  }

  @override
  Widget build(BuildContext context) {
    final caption = suggestedCaption(widget.eventName);
    return Scaffold(
      backgroundColor: AppColors.forestDark,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.of(context).maybePop(),
        ),
        title: Text('Your card',
            style: AppText.title.copyWith(color: Colors.white)),
      ),
      body: SafeArea(
        top: false,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(
              AppSpace.lg, AppSpace.sm, AppSpace.lg, AppSpace.lg),
          children: [
            // Gently floating finished card.
            AnimatedBuilder(
              animation: _floatCtrl,
              builder: (context, child) {
                final dy = (_floatCtrl.value - 0.5) * 12;
                return Transform.translate(offset: Offset(0, dy), child: child);
              },
              child: ClipRRect(
                borderRadius: BorderRadius.circular(18),
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(18),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x99000000),
                        blurRadius: 60,
                        offset: Offset(0, 30),
                      ),
                    ],
                  ),
                  child: Image.memory(widget.imageBytes, fit: BoxFit.contain),
                ),
              ),
            ),
            const SizedBox(height: 18),

            // Suggested caption box + Copy.
            Container(
              padding: const EdgeInsets.fromLTRB(14, 13, 14, 14),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(AppRadius.input),
                border: Border.all(color: Colors.white.withValues(alpha: 0.14)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'SUGGESTED CAPTION',
                        style: AppText.caption.copyWith(
                          color: AppColors.gold.withValues(alpha: 0.85),
                          fontSize: 10,
                          letterSpacing: 1.2,
                        ),
                      ),
                      GestureDetector(
                        onTap: _copyCaption,
                        child: Text('Copy',
                            style: AppText.bodySm.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.w600)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 7),
                  Text(
                    caption,
                    style: AppText.bodySm.copyWith(
                        color: Colors.white.withValues(alpha: 0.9),
                        height: 1.5),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            Row(
              children: [
                Expanded(
                  child: _DarkGhostButton(
                    icon: Icons.download_outlined,
                    label: 'Save',
                    loading: _sharing,
                    onTap: _sharing ? null : _share,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: MButton(
                    'Share',
                    kind: MBtnKind.gold,
                    icon: Icons.ios_share,
                    onTap: _sharing ? null : _share,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Center(
              child: GestureDetector(
                onTap: () =>
                    Navigator.of(context).popUntil((r) => r.isFirst),
                child: Text('Make another',
                    style: AppText.bodyStrong.copyWith(
                        color: AppColors.gold.withValues(alpha: 0.9),
                        fontSize: 13.5)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DarkGhostButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool loading;
  final VoidCallback? onTap;
  const _DarkGhostButton(
      {required this.icon,
      required this.label,
      this.loading = false,
      this.onTap});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 52,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.10),
          borderRadius: BorderRadius.circular(AppRadius.btn),
          border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
        ),
        child: loading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                    strokeWidth: 2.4, color: Colors.white),
              )
            : Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(icon, size: 19, color: Colors.white),
                  const SizedBox(width: 9),
                  Text(label, style: AppText.btn.copyWith(color: Colors.white)),
                ],
              ),
      ),
    );
  }
}
