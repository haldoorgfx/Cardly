import 'package:flutter/material.dart';

import '../ui/components.dart';
import '../ui/tokens.dart';

/// Compact pill on the header band showing the current event; tap to switch.
class EventSwitchButton extends StatelessWidget {
  final String name;
  final VoidCallback onTap;
  const EventSwitchButton({super.key, required this.name, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        constraints: const BoxConstraints(minHeight: 40, maxWidth: 190),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.14),
          borderRadius: BorderRadius.circular(999),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Flexible(
              child: Text(name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.bodySm.copyWith(
                      color: Colors.white, fontWeight: FontWeight.w600)),
            ),
            const SizedBox(width: 6),
            const Icon(Icons.unfold_more, color: Colors.white, size: 17),
          ],
        ),
      ),
    );
  }
}

/// One attendee row — white card with the name, ticket and a check-in control.
class AttendeeRow extends StatelessWidget {
  final String name;
  final String ticket;
  final bool checkedIn;
  final bool busy;
  final VoidCallback onCheckIn;
  const AttendeeRow({
    super.key,
    required this.name,
    required this.ticket,
    required this.checkedIn,
    required this.busy,
    required this.onCheckIn,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 12, 12, 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: AppColors.border),
        boxShadow: AppShadow.soft,
      ),
      child: Row(
        children: [
          Avatar(name: name, size: 40),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.h3.copyWith(fontSize: 14.5)),
                const SizedBox(height: 2),
                Text(ticket,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.bodySm.copyWith(color: AppColors.inkMuted)),
              ],
            ),
          ),
          const SizedBox(width: 8),
          if (checkedIn)
            const Tag('Checked in', kind: TagKind.success, dot: true)
          else if (busy)
            const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                    strokeWidth: 2.2, color: AppColors.forest))
          else
            _CheckInButton(onTap: onCheckIn),
        ],
      ),
    );
  }
}

/// Per-row check-in is a white outline control — not a forest fill, so the
/// screen keeps a single forest surface (the header band). §1.2.
class _CheckInButton extends StatelessWidget {
  final VoidCallback onTap;
  const _CheckInButton({required this.onTap});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        constraints: const BoxConstraints(minHeight: 44),
        alignment: Alignment.center,
        padding: const EdgeInsets.symmetric(horizontal: 14),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: AppColors.forest),
        ),
        child: Text('Check in',
            style: AppText.bodySm
                .copyWith(color: AppColors.forest, fontWeight: FontWeight.w600)),
      ),
    );
  }
}

/// Skeleton for the attendee list / event load.
class AttendeesSkeleton extends StatelessWidget {
  const AttendeesSkeleton({super.key});
  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 100),
      itemCount: 6,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (_, __) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.card),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: const [
            Skeleton(width: 40, height: 40, radius: 999),
            SizedBox(width: 12),
            Expanded(child: Skeleton(width: 120, height: 14)),
          ],
        ),
      ),
    );
  }
}
