import 'package:flutter/material.dart';

import '../../ui/components.dart';
import '../../ui/tokens.dart';

/// D01 — dietary + accessibility on registration.
///
/// A calm multi-select chip group plus an optional free-text note. Accessibility
/// needs are things an organizer PREPARES for, never problems — so this widget
/// carries no warning/danger colours, no alarm icons, and reads the same for
/// dietary and accessibility. A selected chip is a soft `forestSoft` fill with
/// forest text (never a solid forest fill); an unselected chip is white with a
/// hairline border. Fully controlled: the parent owns [selected] + [note].
class NeedsField extends StatelessWidget {
  /// 'dietary' or 'accessibility' — picks the default option set + note hint.
  final String kind;
  final String label;
  final bool required;

  /// Organizer-defined options; when empty the sensible defaults below are used.
  final List<String> options;

  final Set<String> selected;
  final ValueChanged<String> onToggle;

  final String noteHint;
  final ValueChanged<String> onNote;

  const NeedsField({
    super.key,
    required this.kind,
    required this.label,
    required this.required,
    required this.options,
    required this.selected,
    required this.onToggle,
    required this.noteHint,
    required this.onNote,
  });

  static const dietaryDefaults = <String>[
    'Halal',
    'Vegetarian',
    'Vegan',
    'Gluten-free',
    'Nut allergy',
    'Dairy-free',
    'Kosher',
    'No restrictions',
  ];

  static const accessibilityDefaults = <String>[
    'Wheelchair access',
    'Step-free route',
    'Sign language',
    'Hearing loop',
    'Large print',
    'Quiet space',
    'Assistance animal',
    'Other',
  ];

  List<String> get _resolvedOptions {
    if (options.isNotEmpty) return options;
    return kind == 'accessibility' ? accessibilityDefaults : dietaryDefaults;
  }

  String get _resolvedLabel {
    if (label.trim().isNotEmpty) return label;
    return kind == 'accessibility' ? 'Accessibility needs' : 'Dietary needs';
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(required ? '$_resolvedLabel *' : _resolvedLabel,
            style: AppText.label),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final o in _resolvedOptions)
              _NeedsChip(
                label: o,
                selected: selected.contains(o),
                onTap: () => onToggle(o),
              ),
          ],
        ),
        const SizedBox(height: 12),
        MInput(
          hint: noteHint,
          minLines: 1,
          maxLines: 3,
          onChanged: onNote,
        ),
      ],
    );
  }
}

/// One calm selectable chip. Selected → soft forest fill + forest text with a
/// small check. Unselected → white with a warm hairline. No status colours.
class _NeedsChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _NeedsChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final fg = selected ? AppColors.forest : AppColors.inkSoft;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        constraints: const BoxConstraints(minHeight: 44),
        padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 10),
        decoration: BoxDecoration(
          color: selected ? AppColors.forestSoft : AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.pill),
          border: Border.all(
            color: selected ? AppColors.forest : AppColors.border,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (selected) ...[
              const Icon(Icons.check, size: 15, color: AppColors.forest),
              const SizedBox(width: 6),
            ],
            Text(
              label,
              style: AppText.bodySm.copyWith(
                color: fg,
                fontWeight: FontWeight.w600,
                height: 1.0,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
