import 'package:flutter/material.dart';

import '../models.dart';
import '../ui/components.dart';
import '../ui/tokens.dart';
import '../widgets/card_preview.dart';
import 'personalize_screen.dart';

/// Screen 14 · "Pick a design".
///
/// Shown before [PersonalizeScreen] when an event has more than one card
/// design. A large preview of the currently-selected variant sits above a
/// horizontal thumbnail row of every available design; tapping a thumbnail
/// updates the preview, and "Continue" carries the chosen variant into the
/// personalize flow.
///
/// Events with a single variant never reach here — [OpenEventScreen] goes
/// straight to personalize in that case.
class PickDesignScreen extends StatefulWidget {
  final EventModel event;

  /// The variant selected first (defaults to the event's default variant).
  final VariantModel initialVariant;

  const PickDesignScreen({
    super.key,
    required this.event,
    required this.initialVariant,
  });

  @override
  State<PickDesignScreen> createState() => _PickDesignScreenState();
}

class _PickDesignScreenState extends State<PickDesignScreen> {
  late VariantModel _selected;

  @override
  void initState() {
    super.initState();
    _selected = widget.initialVariant;
  }

  void _select(VariantModel v) {
    if (v.id == _selected.id) return;
    setState(() => _selected = v);
  }

  void _continue() {
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => PersonalizeScreen(
        event: widget.event,
        initialVariant: _selected,
      ),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final variants = widget.event.variants;
    final name = _selected.variantName?.trim();
    return MScaffold(
      appBar: const MAppBar(title: 'Pick a design', hairline: true),
      bottomBar: StickyCta(
        children: [
          Expanded(
            child: MButton(
              'Continue',
              kind: MBtnKind.forest,
              onTap: _continue,
            ),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(
            AppSpace.lg, AppSpace.base, AppSpace.lg, AppSpace.xxl),
        children: [
          Text(
            'Choose your card',
            style: AppText.h2,
          ),
          const SizedBox(height: 4),
          Text(
            'This event has ${variants.length} designs. Pick the one you like — '
            'you can still switch later.',
            style: AppText.bodySm,
          ),
          const SizedBox(height: 18),

          // Large preview of the selected design.
          CardPreview(variant: _selected, maxHeight: 320),
          if (name != null && name.isNotEmpty) ...[
            const SizedBox(height: 12),
            Center(
              child: Text(name, style: AppText.bodyStrong),
            ),
          ],
          const SizedBox(height: 22),

          const SectionLabel('Designs'),
          const SizedBox(height: 12),
          VariantChooser(
            variants: variants,
            selectedId: _selected.id,
            onSelected: _select,
          ),
        ],
      ),
    );
  }
}
