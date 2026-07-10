// Offline "needs attention" list (G2 · O03).
//
// When a replayed offline scan comes back `already` / `not_entitled` /
// `outside_window`, it is NOT dropped — it lands here so an organizer can see
// which attendees to re-check. A white unified modal (MOBILE_DESIGN_LAW §12),
// opened from the scanner's connection indicator.

import 'package:flutter/material.dart';

import '../../offline/scan_queue.dart';
import '../../ui/components.dart';
import '../../ui/tokens.dart';

class OfflineAttentionSheet extends StatelessWidget {
  final List<QueuedScan> items;
  final VoidCallback onClear;
  const OfflineAttentionSheet({
    super.key,
    required this.items,
    required this.onClear,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text('Needs attention', style: AppText.h3),
            const Spacer(),
            if (items.isNotEmpty)
              GestureDetector(
                onTap: onClear,
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 4),
                  child: Text('Clear',
                      style: AppText.bodySm.copyWith(
                          color: AppColors.forest, fontWeight: FontWeight.w600)),
                ),
              ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          'Scans the server could not confirm after syncing.',
          style: AppText.bodySm,
        ),
        const SizedBox(height: 12),
        if (items.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 20),
            child: EmptyState(
              icon: Icons.verified_outlined,
              title: 'All clear',
              message: 'No offline scans need review.',
            ),
          )
        else
          for (final q in items) ...[
            _AttentionRow(scan: q),
            const SizedBox(height: 8),
          ],
      ],
    );
  }
}

class _AttentionRow extends StatelessWidget {
  final QueuedScan scan;
  const _AttentionRow({required this.scan});

  ({String label, TagKind kind}) get _tag {
    switch (scan.attentionStatus) {
      case 'already':
        return (label: 'Already redeemed', kind: TagKind.warning);
      case 'not_entitled':
        return (label: 'Not entitled', kind: TagKind.danger);
      case 'outside_window':
        return (label: 'Outside window', kind: TagKind.danger);
      default:
        return (label: 'Needs review', kind: TagKind.warning);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = _tag;
    final title = scan.attendeeName.isEmpty ? 'Attendee' : scan.attendeeName;
    final sub = [
      if (scan.entitlementName.isNotEmpty) scan.entitlementName,
      if (scan.ticketName.isNotEmpty) scan.ticketName,
    ].join('  ·  ');
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.h3.copyWith(fontSize: 15)),
                if (sub.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(sub,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.bodySm),
                ],
              ],
            ),
          ),
          const SizedBox(width: 10),
          Tag(t.label, kind: t.kind),
        ],
      ),
    );
  }
}
