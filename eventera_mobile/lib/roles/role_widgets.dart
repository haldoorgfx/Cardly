// Shared role-mode building blocks (design_handoff_role_modes).
// RolePill  -> gold pill on the event-hub card cover (.rolepill)
// ToolCard  -> forest-gradient "<Role> tools" entry card (.toolcard)
// RoleBar   -> forest context strip pinned atop every role tool screen (.rolebar)
//
// DRAFT — not build-tested (no Dart toolchain in authoring env). Reuses ui/tokens.dart.

import 'package:flutter/material.dart';
import '../ui/tokens.dart';

/// Gold pill shown on an event hub card when the user holds a role at that event.
/// Multiple pills stack.
class RolePill extends StatelessWidget {
  final IconData icon;
  final String label; // 'Speaker' | 'Sponsor' | 'Exhibitor'
  const RolePill({super.key, required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: AppColors.gold,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: AppColors.forestDark),
          const SizedBox(width: 5),
          Text(label,
              style: const TextStyle(
                  color: AppColors.forestDark,
                  fontSize: 11.5,
                  fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}

/// A role's tool-section entry — reads as a real, pressable button: solid
/// (not gradient — the gradient card this replaced looked identical to a
/// static status card, gave no press feedback, and buried the point under a
/// long dotted subtitle), with a Material ripple on tap and a distinct
/// "go" chip standing in for the old bare chevron.
class ToolCard extends StatelessWidget {
  final IconData icon;
  final String title; // 'Speaker tools'
  final String? summary; // short — one phrase, not a dotted list
  final VoidCallback onTap;
  const ToolCard({
    super.key,
    required this.icon,
    required this.title,
    this.summary,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.forestCard,
      borderRadius: BorderRadius.circular(16),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        splashColor: AppColors.gold.withValues(alpha: 0.18),
        highlightColor: Colors.white.withValues(alpha: 0.06),
        child: Container(
          constraints: const BoxConstraints(minHeight: 64),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: AppColors.gold, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title,
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 15,
                            fontWeight: FontWeight.w700)),
                    if (summary != null && summary!.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(summary!,
                          style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.7),
                              fontSize: 12.5)),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Container(
                width: 30,
                height: 30,
                decoration: BoxDecoration(
                  color: AppColors.gold,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.arrow_forward,
                    color: AppColors.forestDark, size: 16),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Forest context strip at the top of every role tool screen.
class RoleBar extends StatelessWidget {
  final IconData icon;
  final String eventName;
  final String roleLine; // 'Speaker' or 'Sponsor · Headline tier'
  const RoleBar({
    super.key,
    required this.icon,
    required this.eventName,
    required this.roleLine,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
          colors: [AppColors.forest, AppColors.forestDark],
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: AppColors.gold, size: 18),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(eventName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w600)),
                Text(roleLine,
                    style: TextStyle(
                        color: AppColors.gold, fontSize: 12, fontWeight: FontWeight.w600)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
