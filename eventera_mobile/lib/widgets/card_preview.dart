import 'package:flutter/material.dart';

import '../models.dart';
import '../theme.dart';

/// Shows a variant's background design at its true aspect ratio, with a soft
/// frame. Used as the hero on the personalize screen so the attendee sees the
/// card they're filling in.
class CardPreview extends StatelessWidget {
  final VariantModel variant;
  final double maxHeight;
  const CardPreview({super.key, required this.variant, this.maxHeight = 260});

  @override
  Widget build(BuildContext context) {
    final ratio = variant.backgroundWidth > 0 && variant.backgroundHeight > 0
        ? variant.backgroundWidth / variant.backgroundHeight
        : 1080 / 1350;
    final url = variant.backgroundUrl;

    return Center(
      child: ConstrainedBox(
        constraints: BoxConstraints(maxHeight: maxHeight),
        child: AspectRatio(
          aspectRatio: ratio,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(14),
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: Brand.surface,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Brand.border),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x141F4D3A),
                    blurRadius: 24,
                    offset: Offset(0, 8),
                  ),
                ],
              ),
              child: url == null
                  ? _placeholder('No design uploaded yet')
                  : Image.network(
                      url,
                      fit: BoxFit.cover,
                      loadingBuilder: (ctx, child, progress) {
                        if (progress == null) return child;
                        return _placeholder(null, loading: true);
                      },
                      errorBuilder: (ctx, _, __) =>
                          _placeholder("Couldn't load the design"),
                    ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _placeholder(String? text, {bool loading = false}) {
    return ColoredBox(
      color: Brand.cream,
      child: Center(
        child: loading
            ? const SizedBox(
                width: 26,
                height: 26,
                child:
                    CircularProgressIndicator(strokeWidth: 2.5, color: Brand.gold),
              )
            : Padding(
                padding: const EdgeInsets.all(16),
                child: Text(
                  text ?? '',
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Brand.muted, fontSize: 13),
                ),
              ),
      ),
    );
  }
}

/// A horizontal strip of variant thumbnails. Shown only when an event has more
/// than one card design, so the attendee can pick which one to personalize.
class VariantChooser extends StatelessWidget {
  final List<VariantModel> variants;
  final String selectedId;
  final ValueChanged<VariantModel> onSelected;
  const VariantChooser({
    super.key,
    required this.variants,
    required this.selectedId,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 92,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: variants.length,
        separatorBuilder: (_, __) => const SizedBox(width: 10),
        itemBuilder: (ctx, i) {
          final v = variants[i];
          final selected = v.id == selectedId;
          return GestureDetector(
            onTap: () => onSelected(v),
            child: Container(
              width: 66,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: selected ? Brand.forest : Brand.border,
                  width: selected ? 2.5 : 1,
                ),
              ),
              clipBehavior: Clip.antiAlias,
              child: v.backgroundUrl == null
                  ? const ColoredBox(color: Brand.cream)
                  : Image.network(v.backgroundUrl!, fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) =>
                          const ColoredBox(color: Brand.cream)),
            ),
          );
        },
      ),
    );
  }
}
