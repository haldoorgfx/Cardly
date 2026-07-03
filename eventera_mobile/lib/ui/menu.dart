import 'package:flutter/material.dart';

import 'tokens.dart';

/// Account-area primitives: colored icon tiles, grouped menu cards, section
/// labels, and the profile stat strip. Port of mobile.css `.itile` / `.menu` /
/// `.mrow` / `.grouplab` / `.stat`. Numbers use Inter (no monospace anywhere).

enum ITone { forest, gold, info, success, danger, muted }

class _ToneStyle {
  final Color bg;
  final Color fg;
  const _ToneStyle(this.bg, this.fg);
}

_ToneStyle _toneStyle(ITone t) {
  switch (t) {
    case ITone.forest:
      return const _ToneStyle(AppColors.forestSoft, AppColors.forest);
    case ITone.gold:
      return const _ToneStyle(AppColors.goldSoft, AppColors.goldHover);
    case ITone.info:
      return const _ToneStyle(Color(0x1F3A6B8C), AppColors.info);
    case ITone.success:
      return const _ToneStyle(Color(0x1F2D7A4F), AppColors.success);
    case ITone.danger:
      return const _ToneStyle(Color(0x1AB8423C), AppColors.danger);
    case ITone.muted:
      return const _ToneStyle(AppColors.creamSoft, AppColors.inkSoft);
  }
}

/// A 40px rounded, soft-tinted icon tile used in menu and notification rows.
class IconTile extends StatelessWidget {
  final IconData icon;
  final ITone tone;
  final double size;
  const IconTile(this.icon, {super.key, this.tone = ITone.forest, this.size = 40});

  @override
  Widget build(BuildContext context) {
    final s = _toneStyle(tone);
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: s.bg,
        borderRadius: BorderRadius.circular(11),
      ),
      alignment: Alignment.center,
      child: Icon(icon, size: size * 0.5, color: s.fg),
    );
  }
}

/// Uppercase section label above a menu/card.
class GroupLabel extends StatelessWidget {
  final String text;
  final EdgeInsets padding;
  const GroupLabel(this.text,
      {super.key, this.padding = const EdgeInsets.fromLTRB(4, 0, 4, 10)});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: padding,
      child: Text(
        text.toUpperCase(),
        style: AppText.seclab.copyWith(letterSpacing: 1.0),
      ),
    );
  }
}

/// A grouped card of rows with hairline dividers between them.
class MenuGroup extends StatelessWidget {
  final List<Widget> children;
  const MenuGroup({super.key, required this.children});

  @override
  Widget build(BuildContext context) {
    final rows = <Widget>[];
    for (var i = 0; i < children.length; i++) {
      if (i > 0) {
        rows.add(const Divider(
            height: 1, thickness: 1, color: AppColors.border, indent: 14 + 40 + 13));
      }
      rows.add(children[i]);
    }
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: AppColors.border),
        boxShadow: AppShadow.soft,
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(children: rows),
    );
  }
}

/// A single menu row: colored icon tile + title (+ subtitle) + optional
/// trailing widget (count / tag / badge) + chevron.
class MenuRow extends StatelessWidget {
  final IconData icon;
  final ITone tone;
  final String title;
  final String? subtitle;
  final Widget? trailing;
  final bool chevron;
  final VoidCallback? onTap;
  const MenuRow({
    super.key,
    required this.icon,
    required this.title,
    this.tone = ITone.forest,
    this.subtitle,
    this.trailing,
    this.chevron = true,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Row(
          children: [
            IconTile(icon, tone: tone),
            const SizedBox(width: 13),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.h3.copyWith(fontSize: 15)),
                  if (subtitle != null && subtitle!.isNotEmpty) ...[
                    const SizedBox(height: 1),
                    Text(subtitle!,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppText.caption
                            .copyWith(fontSize: 12, color: AppColors.inkMuted)),
                  ],
                ],
              ),
            ),
            if (trailing != null) ...[
              const SizedBox(width: 8),
              trailing!,
            ],
            if (chevron) ...[
              const SizedBox(width: 6),
              const Icon(Icons.chevron_right,
                  size: 18, color: AppColors.inkMuted),
            ],
          ],
        ),
      ),
    );
  }
}

/// A small mono-free count label used as a MenuRow trailing.
class CountLabel extends StatelessWidget {
  final int value;
  const CountLabel(this.value, {super.key});
  @override
  Widget build(BuildContext context) {
    return Text('$value',
        style: AppText.numSm.copyWith(color: AppColors.inkMuted));
  }
}

/// A red unread badge used as a MenuRow trailing.
class UnreadBadge extends StatelessWidget {
  final int count;
  const UnreadBadge(this.count, {super.key});
  @override
  Widget build(BuildContext context) {
    if (count <= 0) return const SizedBox.shrink();
    return Container(
      constraints: const BoxConstraints(minWidth: 20),
      height: 20,
      padding: const EdgeInsets.symmetric(horizontal: 6),
      decoration: BoxDecoration(
        color: AppColors.danger,
        borderRadius: BorderRadius.circular(999),
      ),
      alignment: Alignment.center,
      child: Text(count > 99 ? '99+' : '$count',
          style: AppText.caption.copyWith(
              color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700)),
    );
  }
}

/// Three equal stat cells divided by hairlines (used in the profile header).
class StatStrip extends StatelessWidget {
  final List<(String value, String label)> stats;
  final Color background;
  const StatStrip({
    super.key,
    required this.stats,
    this.background = AppColors.surface,
  });

  @override
  Widget build(BuildContext context) {
    final cells = <Widget>[];
    for (var i = 0; i < stats.length; i++) {
      if (i > 0) {
        cells.add(Container(width: 1, height: 34, color: AppColors.border));
      }
      cells.add(Expanded(child: _cell(stats[i].$1, stats[i].$2)));
    }
    return Container(
      color: background,
      padding: const EdgeInsets.symmetric(vertical: 14),
      child: Row(children: cells),
    );
  }

  Widget _cell(String value, String label) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(value,
            style: AppText.h2.copyWith(
                color: AppColors.forest,
                fontSize: 20,
                fontWeight: FontWeight.w700)),
        const SizedBox(height: 2),
        Text(label,
            style: AppText.caption
                .copyWith(fontSize: 11, color: AppColors.inkMuted)),
      ],
    );
  }
}
