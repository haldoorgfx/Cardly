import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../models.dart';
import '../ui/components.dart';
import '../ui/tokens.dart';

/// Shared Organize-side design primitives — direct ports of the design ref
/// (`Eventera Organize.html` + mobile.css): status pills, event cover art,
/// the big stat bar, and skeleton cards.

// ─────────────────────────────────────────────── status pill (.stpill)

enum PillKind { live, soon, done, draft }

class StatusPill extends StatelessWidget {
  final PillKind kind;
  final String label;
  const StatusPill(this.kind, this.label, {super.key});

  /// Derives the pill from an event's status + date, matching the mockup:
  /// "Live today" · "In N days" · "Done" · "Draft".
  factory StatusPill.forEvent(OrganizerEvent e, {Key? key}) {
    if (!e.isPublished) {
      return StatusPill(
          e.status == 'archived' ? PillKind.done : PillKind.draft,
          e.status == 'archived' ? 'Archived' : 'Draft',
          key: key);
    }
    if (e.isToday) return StatusPill(PillKind.live, 'Live today', key: key);
    final d = e.daysUntil;
    if (d == null) return StatusPill(PillKind.live, 'Live', key: key);
    if (d < 0) return StatusPill(PillKind.done, 'Done', key: key);
    if (d == 1) return StatusPill(PillKind.soon, 'Tomorrow', key: key);
    return StatusPill(PillKind.soon, 'In $d days', key: key);
  }

  @override
  Widget build(BuildContext context) {
    late final Color bg, fg;
    switch (kind) {
      case PillKind.live:
        bg = const Color(0xFF2D7A4F).withValues(alpha: 0.13);
        fg = AppColors.success;
        break;
      case PillKind.soon:
        bg = const Color(0xFFC97A2D).withValues(alpha: 0.14);
        fg = AppColors.warning;
        break;
      case PillKind.done:
        bg = AppColors.creamSoft;
        fg = AppColors.inkMuted;
        break;
      case PillKind.draft:
        bg = AppColors.creamSoft;
        fg = AppColors.inkMuted;
        break;
    }
    return Container(
      height: 22,
      padding: const EdgeInsets.symmetric(horizontal: 9),
      decoration:
          BoxDecoration(color: bg, borderRadius: BorderRadius.circular(999)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(color: fg, shape: BoxShape.circle)),
        const SizedBox(width: 5),
        Text(label,
            style: AppText.caption.copyWith(
                color: fg,
                fontSize: 10.5,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.2)),
      ]),
    );
  }
}

/// Pill on a solid surface (cover images) — same look, opaque background so
/// it stays readable over photos.
class CoverStatusPill extends StatelessWidget {
  final OrganizerEvent event;
  const CoverStatusPill(this.event, {super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(999),
        boxShadow: const [
          BoxShadow(color: Color(0x330F1F18), blurRadius: 8, offset: Offset(0, 2)),
        ],
      ),
      child: StatusPill.forEvent(event),
    );
  }
}

// ─────────────────────────────────────────────── event cover art

/// 96px cover: real cover image when the event page has one, otherwise the
/// deterministic hue-mesh placeholder — always with the bottom scrim.
class EventCover extends StatelessWidget {
  final OrganizerEvent event;
  final double height;
  const EventCover(this.event, {super.key, this.height = 96});

  @override
  Widget build(BuildContext context) {
    final cover = event.coverUrl;
    return SizedBox(
      height: height,
      width: double.infinity,
      child: Stack(fit: StackFit.expand, children: [
        if (cover != null && cover.isNotEmpty)
          CachedNetworkImage(
            imageUrl: cover,
            fit: BoxFit.cover,
            errorWidget: (_, __, ___) =>
                PhotoPlaceholder(hue: hueFromString(event.id)),
            placeholder: (_, __) =>
                PhotoPlaceholder(hue: hueFromString(event.id)),
          )
        else
          PhotoPlaceholder(hue: hueFromString(event.id)),
        const ScrimBottom(),
      ]),
    );
  }
}

// ─────────────────────────────────────────────── big stat bar (.statbar)

class StatBar extends StatelessWidget {
  /// (value, label, gold?) triplets.
  final List<(String, String, bool)> cells;
  const StatBar({super.key, required this.cells});

  @override
  Widget build(BuildContext context) {
    final children = <Widget>[];
    for (var i = 0; i < cells.length; i++) {
      if (i > 0) {
        children.add(Container(
            width: 1,
            margin: const EdgeInsets.symmetric(vertical: 8),
            color: Colors.white.withValues(alpha: 0.14)));
      }
      children.add(Expanded(
        child: Column(children: [
          Text(cells[i].$1,
              style: TextStyle(
                  color: cells[i].$3 ? AppColors.gold : Colors.white,
                  fontSize: 23,
                  fontWeight: FontWeight.w600,
                  letterSpacing: -0.2)),
          const SizedBox(height: 3),
          Text(cells[i].$2,
              style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.7), fontSize: 10.5)),
        ]),
      ));
    }
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 4),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF163828), AppColors.forest],
          stops: [0.0, 0.7],
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: AppShadow.lift,
      ),
      child: IntrinsicHeight(child: Row(children: children)),
    );
  }
}

// ─────────────────────────────────────────────── live pulse (.live)

class LivePulse extends StatefulWidget {
  const LivePulse({super.key});
  @override
  State<LivePulse> createState() => _LivePulseState();
}

class _LivePulseState extends State<LivePulse>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
      vsync: this, duration: const Duration(milliseconds: 1600))
    ..repeat();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Row(mainAxisSize: MainAxisSize.min, children: [
      AnimatedBuilder(
        animation: _c,
        builder: (_, __) {
          final t = _c.value; // 0→1
          final spread = t < .5 ? t * 10 : (1 - t) * 10;
          return Container(
            width: 7,
            height: 7,
            decoration: BoxDecoration(
              color: AppColors.success
                  .withValues(alpha: t < .5 ? 1 - t * 0.8 : 0.6 + (t - .5) * 0.8),
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                    color: AppColors.success.withValues(alpha: 0.35 * (1 - t)),
                    spreadRadius: spread * 0.5),
              ],
            ),
          );
        },
      ),
      const SizedBox(width: 6),
      Text('LIVE',
          style: AppText.caption.copyWith(
              color: AppColors.success,
              fontSize: 11,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.8)),
    ]);
  }
}

// ─────────────────────────────────────────────── event card skeleton (O01b)

class EventCardSkeleton extends StatelessWidget {
  final bool short;
  const EventCardSkeleton({super.key, this.short = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: AppColors.border),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Skeleton(height: 96, radius: 0),
        Padding(
          padding: const EdgeInsets.fromLTRB(14, 13, 14, 14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const FractionallySizedBox(
                  widthFactor: 0.7, child: Skeleton(height: 18)),
              const SizedBox(height: 9),
              const FractionallySizedBox(
                  widthFactor: 0.5, child: Skeleton(height: 12)),
              if (!short) ...[
                const SizedBox(height: 16),
                Row(children: const [
                  Expanded(child: Skeleton(height: 34)),
                  SizedBox(width: 10),
                  Expanded(child: Skeleton(height: 34)),
                  SizedBox(width: 10),
                  Expanded(child: Skeleton(height: 34)),
                ]),
              ],
            ],
          ),
        ),
      ]),
    );
  }
}
