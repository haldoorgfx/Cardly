import 'package:flutter/material.dart';

import '../ui/components.dart';
import '../ui/tokens.dart';

/// The Profile tab's own taller forest band: avatar, name, email and the compact
/// role chips under the username.
class OrgProfileHeader extends StatelessWidget {
  final String name;
  final String email;
  final List<String> hats;
  const OrgProfileHeader(
      {super.key, required this.name, required this.email, required this.hats});

  @override
  Widget build(BuildContext context) {
    final topInset = MediaQuery.of(context).padding.top;
    return Container(
      width: double.infinity,
      color: AppColors.forest,
      padding: EdgeInsets.fromLTRB(20, topInset + 20, 20, 22),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(2.5),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.gold, width: 2),
                ),
                child: Avatar(name: name, size: 54),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppText.h2
                            .copyWith(color: Colors.white, fontSize: 20)),
                    if (email.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(email,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppText.bodySm.copyWith(
                              color: Colors.white.withValues(alpha: 0.82))),
                    ],
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 7,
            runSpacing: 7,
            children: [for (final h in hats) _HatPill(h)],
          ),
        ],
      ),
    );
  }
}

/// Compact role chip under the username — translucent white on the forest band,
/// matching the attendee profile treatment.
class _HatPill extends StatelessWidget {
  final String label;
  const _HatPill(this.label);
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.13),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: Colors.white.withValues(alpha: 0.16)),
      ),
      child: Text(
        label,
        style: AppText.caption.copyWith(
          color: Colors.white.withValues(alpha: 0.92),
          fontWeight: FontWeight.w600,
          fontSize: 11.5,
          letterSpacing: 0.1,
        ),
      ),
    );
  }
}

/// A white account row (icon tile, title, chevron).
class OrgAccountRow extends StatelessWidget {
  final IconData icon;
  final String title;
  final VoidCallback onTap;
  const OrgAccountRow(
      {super.key, required this.icon, required this.title, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return MCard(
      onTap: onTap,
      padding: const EdgeInsets.all(14),
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
            child: Text(title, style: AppText.h3.copyWith(fontSize: 15)),
          ),
          const Icon(Icons.chevron_right, size: 18, color: AppColors.inkMuted),
        ],
      ),
    );
  }
}

/// Quiet, low-emphasis sign-out affordance.
class OrgSignOutButton extends StatelessWidget {
  final VoidCallback onTap;
  const OrgSignOutButton({super.key, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        constraints: const BoxConstraints(minHeight: 44),
        alignment: Alignment.center,
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
        decoration: BoxDecoration(
          color: AppColors.danger.withValues(alpha: 0.07),
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: AppColors.danger.withValues(alpha: 0.22)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.logout, size: 15, color: AppColors.danger),
            const SizedBox(width: 7),
            Text('Sign out',
                style: AppText.bodySm.copyWith(
                    color: AppColors.danger, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }
}
