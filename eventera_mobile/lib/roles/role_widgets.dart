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

/// Forest-gradient entry card. Tapping opens that role's tool section.
class ToolCard extends StatelessWidget {
  final IconData icon;
  final String title;    // 'Speaker tools'
  final String summary;  // '2 sessions · profile · audience Q&A'
  final VoidCallback onTap;
  const ToolCard({
    super.key,
    required this.icon,
    required this.title,
    required this.summary,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [AppColors.forest, AppColors.forestDark],
          ),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: AppColors.gold, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 15,
                          fontWeight: FontWeight.w700)),
                  const SizedBox(height: 2),
                  Text(summary,
                      style: TextStyle(
                          color: Colors.white.withOpacity(0.75), fontSize: 12.5)),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: Colors.white70, size: 22),
          ],
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
              color: Colors.white.withOpacity(0.12),
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
