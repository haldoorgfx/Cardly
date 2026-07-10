import 'package:flutter/material.dart';

import '../ui/components.dart';
import '../ui/tokens.dart';

/// A resolved staff event (id + display name) for the picker.
class StaffPick {
  final String id;
  final String name;
  StaffPick(this.id, this.name);
}

/// A white role row — every tools entry after the first (forest) card.
class ToolRow extends StatelessWidget {
  final IconData icon;
  final String title;
  final String summary;
  final VoidCallback onTap;
  const ToolRow({
    super.key,
    required this.icon,
    required this.title,
    required this.summary,
    required this.onTap,
  });
  @override
  Widget build(BuildContext context) {
    return MCard(
      onTap: onTap,
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: AppColors.forestSoft,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: AppColors.forest, size: 22),
          ),
          const SizedBox(width: 13),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(title, style: AppText.h3.copyWith(fontSize: 15.5)),
                const SizedBox(height: 2),
                Text(summary,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.bodySm),
              ],
            ),
          ),
          const Icon(Icons.chevron_right, size: 18, color: AppColors.inkMuted),
        ],
      ),
    );
  }
}

/// Picker body shown when the account is staff at more than one event.
class StaffPickerBody extends StatelessWidget {
  final List<StaffPick> events;
  const StaffPickerBody({super.key, required this.events});
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Staff access for', style: AppText.h3),
        const SizedBox(height: 12),
        for (final e in events)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: InkWell(
              onTap: () => Navigator.of(context).pop(e),
              borderRadius: BorderRadius.circular(AppRadius.card),
              child: Container(
                constraints: const BoxConstraints(minHeight: 44),
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(AppRadius.card),
                  border: Border.all(color: AppColors.border),
                ),
                child: Text(e.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.h3.copyWith(fontSize: 15)),
              ),
            ),
          ),
      ],
    );
  }
}

class ToolsSkeleton extends StatelessWidget {
  const ToolsSkeleton({super.key});
  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 100),
      children: [
        Container(
          height: 76,
          decoration: BoxDecoration(
            color: AppColors.creamSoft,
            borderRadius: BorderRadius.circular(16),
          ),
        ),
        const SizedBox(height: 10),
        for (var i = 0; i < 2; i++) ...[
          Container(
            height: 72,
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(AppRadius.card),
              border: Border.all(color: AppColors.border),
            ),
            padding: const EdgeInsets.all(16),
            child: Row(
              children: const [
                Skeleton(width: 44, height: 44, radius: 12),
                SizedBox(width: 13),
                Expanded(child: Skeleton(width: 120, height: 14)),
              ],
            ),
          ),
          const SizedBox(height: 10),
        ],
      ],
    );
  }
}
