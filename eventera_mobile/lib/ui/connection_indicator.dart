// Connection indicator (G2 · O01) — the persistent scanner status pill.
//
// Sits at the top of every scanner (MOBILE_DESIGN_LAW §8). Three states, driven
// entirely by SyncController: Online · Offline · N queued · Syncing. When scans
// have come back needing attention it becomes tappable and surfaces the count.
//
// Dark-surface widget (scanner only): the accepted Colors.white* precedent
// applies; all other colours come from AppColors.

import 'package:flutter/material.dart';

import '../offline/sync_controller.dart';
import 'tokens.dart';

class ConnectionIndicator extends StatelessWidget {
  final SyncController controller;
  final VoidCallback? onTapAttention;
  const ConnectionIndicator({
    super.key,
    required this.controller,
    this.onTapAttention,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: controller,
      builder: (context, _) {
        final attention = controller.attentionCount;
        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _statusPill(),
            if (attention > 0) ...[
              const SizedBox(height: 8),
              _AttentionPill(count: attention, onTap: onTapAttention),
            ],
          ],
        );
      },
    );
  }

  Widget _statusPill() {
    if (controller.syncing) {
      return const _Pill(
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 12,
              height: 12,
              child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.gold),
            ),
            SizedBox(width: 8),
            _PillText('Syncing…'),
          ],
        ),
      );
    }
    if (!controller.online) {
      final n = controller.queued;
      return _Pill(
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const _Dot(AppColors.warning),
            const SizedBox(width: 7),
            _PillText(n > 0 ? 'Offline · $n queued' : 'Offline'),
          ],
        ),
      );
    }
    // Online. If a drain is still pending, show the remaining count honestly.
    final n = controller.queued;
    return _Pill(
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const _Dot(AppColors.success),
          const SizedBox(width: 7),
          _PillText(n > 0 ? 'Online · $n to sync' : 'Online'),
        ],
      ),
    );
  }
}

class _AttentionPill extends StatelessWidget {
  final int count;
  final VoidCallback? onTap;
  const _AttentionPill({required this.count, this.onTap});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: _Pill(
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline_rounded, size: 14, color: AppColors.danger),
            const SizedBox(width: 7),
            _PillText('$count need attention'),
            const SizedBox(width: 6),
            const Icon(Icons.chevron_right, size: 16, color: Colors.white70),
          ],
        ),
      ),
    );
  }
}

class _Pill extends StatelessWidget {
  final Widget child;
  const _Pill({required this.child});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.forestCard,
        borderRadius: BorderRadius.circular(AppRadius.pill),
        border: Border.all(color: AppColors.forestSurface),
      ),
      child: child,
    );
  }
}

class _Dot extends StatelessWidget {
  final Color color;
  const _Dot(this.color);
  @override
  Widget build(BuildContext context) => Container(
        width: 7,
        height: 7,
        decoration: BoxDecoration(color: color, shape: BoxShape.circle),
      );
}

class _PillText extends StatelessWidget {
  final String text;
  const _PillText(this.text);
  @override
  Widget build(BuildContext context) =>
      Text(text, style: AppText.caption.copyWith(color: Colors.white));
}
