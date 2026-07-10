import 'package:flutter/material.dart';

import 'tokens.dart';

/// The one, shared mode switcher. Identical layout wherever it appears — the
/// attendee profile and the organizer profile both render this exact widget.
/// A white card on cream (never a forest fill): a soft icon tile, the target
/// mode, a one-line explainer, and a chevron.
///
/// [inOrganizerMode] is the CURRENT mode, so the row always offers the *other*
/// side: in organizer mode it reads "Switch to attending"; otherwise "Switch to
/// organizing".
class ModeSwitcher extends StatelessWidget {
  final bool inOrganizerMode;
  final VoidCallback onSwitch;
  const ModeSwitcher({
    super.key,
    required this.inOrganizerMode,
    required this.onSwitch,
  });

  @override
  Widget build(BuildContext context) {
    final toAttending = inOrganizerMode;
    final title = toAttending ? 'Switch to attending' : 'Switch to organizing';
    final subtitle = toAttending
        ? 'Browse and collect event cards'
        : 'Manage your events and tools';
    final icon = toAttending
        ? Icons.confirmation_number_outlined
        : Icons.dashboard_customize_outlined;

    return InkWell(
      onTap: onSwitch,
      borderRadius: BorderRadius.circular(AppRadius.card),
      child: Container(
        constraints: const BoxConstraints(minHeight: 44),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.card),
          border: Border.all(color: AppColors.border),
          boxShadow: AppShadow.soft,
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: AppColors.forestSoft,
                borderRadius: BorderRadius.circular(11),
              ),
              child: Icon(icon, size: 20, color: AppColors.forest),
            ),
            const SizedBox(width: 13),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(title, style: AppText.h3.copyWith(fontSize: 15)),
                  const SizedBox(height: 1),
                  Text(subtitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.caption
                          .copyWith(fontSize: 12, color: AppColors.inkMuted)),
                ],
              ),
            ),
            const SizedBox(width: 6),
            const Icon(Icons.swap_horiz, size: 18, color: AppColors.inkMuted),
          ],
        ),
      ),
    );
  }
}

/// Compact role chip used under a username, on cream (white/forest-soft, never a
/// forest fill). Same treatment on every role surface.
class RoleChip extends StatelessWidget {
  final String label;
  const RoleChip(this.label, {super.key});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.forestSoft,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: AppText.caption.copyWith(
          color: AppColors.forest,
          fontWeight: FontWeight.w600,
          fontSize: 11.5,
          letterSpacing: 0.1,
        ),
      ),
    );
  }
}
