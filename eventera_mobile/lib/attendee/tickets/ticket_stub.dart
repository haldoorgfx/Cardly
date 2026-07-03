import 'dart:ui' as ui;

import 'package:flutter/material.dart';

import '../../ui/components.dart';
import '../../ui/tokens.dart';

/// Ticket status → visual treatment.
enum TicketStatus { confirmed, pending, checkedIn, expired, cancelled }

TicketStatus ticketStatusFrom(String s) {
  switch (s) {
    case 'confirmed':
      return TicketStatus.confirmed;
    case 'checked_in':
      return TicketStatus.checkedIn;
    case 'pending':
    case 'pending_approval':
      return TicketStatus.pending;
    case 'expired':
      return TicketStatus.expired;
    case 'cancelled':
      return TicketStatus.cancelled;
    default:
      return TicketStatus.confirmed;
  }
}

Color statusColor(TicketStatus s) {
  switch (s) {
    case TicketStatus.confirmed:
      return AppColors.success;
    case TicketStatus.pending:
      return AppColors.warning;
    case TicketStatus.checkedIn:
      return AppColors.forest;
    case TicketStatus.expired:
    case TicketStatus.cancelled:
      return AppColors.inkMuted;
  }
}

String statusLabel(TicketStatus s) {
  switch (s) {
    case TicketStatus.confirmed:
      return 'Confirmed';
    case TicketStatus.pending:
      return 'Payment pending';
    case TicketStatus.checkedIn:
      return 'Checked in';
    case TicketStatus.expired:
      return 'Expired';
    case TicketStatus.cancelled:
      return 'Cancelled';
  }
}

/// A perforated tear line with two half-circle cut-out notches at the edges.
/// [bg] is the page background so the notches read as "bites" out of the card.
class TearLine extends StatelessWidget {
  final Color bg;
  final double notch;
  const TearLine({super.key, required this.bg, this.notch = 22});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: notch,
      child: Stack(
        clipBehavior: Clip.none,
        alignment: Alignment.center,
        children: [
          Positioned(
            left: 20,
            right: 20,
            child: CustomPaint(
              size: const Size(double.infinity, 2),
              painter: _DashPainter(AppColors.borderStrong),
            ),
          ),
          Positioned(left: -notch / 2, child: _notchCircle()),
          Positioned(right: -notch / 2, child: _notchCircle()),
        ],
      ),
    );
  }

  Widget _notchCircle() => Container(
        width: notch,
        height: notch,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: bg,
          border: Border.all(color: AppColors.border, width: 1),
        ),
      );
}

class _DashPainter extends CustomPainter {
  final Color color;
  _DashPainter(this.color);
  @override
  void paint(Canvas canvas, Size size) {
    final p = Paint()
      ..color = color
      ..strokeWidth = 2
      ..strokeCap = StrokeCap.round;
    const dash = 5.0, gap = 5.0;
    double x = 0;
    final y = size.height / 2;
    while (x < size.width) {
      canvas.drawLine(Offset(x, y), Offset(x + dash, y), p);
      x += dash + gap;
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// The full tear-off ticket (detail hero).
class TicketStub extends StatelessWidget {
  final String eventTitle;
  final String? coverUrl;
  final String subtitle;
  final TicketStatus status;
  final Widget qr; // pre-sized QR widget
  final String ticketCode;
  final List<(String, String)> info; // key/value grid
  final Color bg;
  final String? checkedInLine; // e.g. "Checked in 9:02 AM · Gate A"
  final VoidCallback? onQrTap;

  const TicketStub({
    super.key,
    required this.eventTitle,
    required this.coverUrl,
    required this.subtitle,
    required this.status,
    required this.qr,
    required this.ticketCode,
    required this.info,
    required this.bg,
    this.checkedInLine,
    this.onQrTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border),
        boxShadow: AppShadow.lift,
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          _cover(),
          TearLine(bg: bg),
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 20, 18, 18),
            child: Column(
              children: [
                GestureDetector(onTap: onQrTap, child: _qrFrame()),
                const SizedBox(height: 12),
                Text('TICKET CODE',
                    style: AppText.caption.copyWith(
                        color: AppColors.inkMuted,
                        fontSize: 10,
                        letterSpacing: 1.4)),
                const SizedBox(height: 5),
                Text(ticketCode,
                    style: AppText.numSm.copyWith(
                        color: AppColors.inkSoft,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 2.4)),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 0, 18, 20),
            child: _grid(),
          ),
        ],
      ),
    );
  }

  Widget _cover() {
    return SizedBox(
      height: 132,
      width: double.infinity,
      child: Stack(
        fit: StackFit.expand,
        children: [
          (coverUrl != null && coverUrl!.isNotEmpty)
              ? Image.network(coverUrl!,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) =>
                      PhotoPlaceholder(hue: hueFromString(eventTitle)))
              : PhotoPlaceholder(hue: hueFromString(eventTitle)),
          const DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Color(0x000D1F17), Color(0xB80D1F17)],
                stops: [0.3, 1.0],
              ),
            ),
          ),
          Positioned(top: 14, left: 14, child: _ribbon()),
          Positioned(
            left: 18,
            right: 18,
            bottom: 14,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(eventTitle,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.h3.copyWith(color: Colors.white, fontSize: 19)),
                if (subtitle.isNotEmpty) ...[
                  const SizedBox(height: 3),
                  Text(subtitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.bodySm.copyWith(
                          color: Colors.white.withValues(alpha: 0.85),
                          fontSize: 12.5)),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _ribbon() {
    final c = statusColor(status);
    final onCheck = status == TicketStatus.checkedIn;
    return ClipRRect(
      borderRadius: BorderRadius.circular(999),
      child: BackdropFilter(
        filter: ui.ImageFilter.blur(sigmaX: 6, sigmaY: 6),
        child: Container(
          height: 26,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: c.withValues(alpha: 0.92),
            borderRadius: BorderRadius.circular(999),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 6,
                height: 6,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: onCheck ? AppColors.gold : Colors.white,
                ),
              ),
              const SizedBox(width: 6),
              Text(statusLabel(status),
                  style: AppText.caption.copyWith(
                      color: onCheck ? AppColors.gold : Colors.white,
                      fontSize: 11.5,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _qrFrame() {
    Widget frame(Widget child) => Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.border),
            boxShadow: AppShadow.soft,
          ),
          child: child,
        );

    switch (status) {
      case TicketStatus.pending:
        return frame(
          Stack(
            alignment: Alignment.center,
            children: [
              ImageFiltered(
                imageFilter: ui.ImageFilter.blur(sigmaX: 7, sigmaY: 7),
                child: Opacity(opacity: 0.5, child: qr),
              ),
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: AppColors.warning.withValues(alpha: 0.14),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.lock_outline,
                        color: AppColors.warning, size: 22),
                  ),
                  const SizedBox(height: 8),
                  Text('QR unlocks after payment',
                      textAlign: TextAlign.center,
                      style: AppText.bodySm.copyWith(
                          color: AppColors.inkSoft,
                          fontWeight: FontWeight.w600)),
                ],
              ),
            ],
          ),
        );
      case TicketStatus.checkedIn:
        return frame(
          Stack(
            alignment: Alignment.center,
            children: [
              qr,
              Transform.rotate(
                angle: -0.28,
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppColors.forest.withValues(alpha: 0.92),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.gold, width: 2),
                  ),
                  child: Text('ADMITTED',
                      style: AppText.h3.copyWith(
                          color: AppColors.gold,
                          fontSize: 18,
                          letterSpacing: 2)),
                ),
              ),
            ],
          ),
        );
      case TicketStatus.expired:
      case TicketStatus.cancelled:
        return frame(Opacity(
            opacity: 0.35, child: ColorFiltered(
                colorFilter: const ColorFilter.mode(
                    Colors.grey, BlendMode.saturation),
                child: qr)));
      case TicketStatus.confirmed:
        return frame(qr);
    }
  }

  Widget _grid() {
    final rows = <Widget>[];
    for (var i = 0; i < info.length; i += 2) {
      final a = info[i];
      final b = (i + 1 < info.length) ? info[i + 1] : null;
      rows.add(Padding(
        padding: EdgeInsets.only(top: i == 0 ? 0 : 16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(child: _cell(a.$1, a.$2)),
            const SizedBox(width: 12),
            Expanded(child: b == null ? const SizedBox() : _cell(b.$1, b.$2)),
          ],
        ),
      ));
    }
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: rows);
  }

  Widget _cell(String k, String v) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(k.toUpperCase(),
            style: AppText.caption.copyWith(
                color: AppColors.inkMuted,
                fontSize: 10,
                letterSpacing: 0.8,
                fontWeight: FontWeight.w600)),
        const SizedBox(height: 3),
        Text(v,
            style: AppText.h3.copyWith(fontSize: 14),
            maxLines: 2,
            overflow: TextOverflow.ellipsis),
      ],
    );
  }
}

/// Wallet list-item ticket stub: accent strip + cover/title/when/status +
/// mini perforated footer with type and a trailing action.
class WalletTicketStub extends StatelessWidget {
  final String title;
  final String? coverUrl;
  final String whenLine;
  final TicketStatus status;
  final String typeLabel;
  final String action; // 'Show QR' | 'Receipt'
  final bool past;
  final Color bg;
  final VoidCallback onTap;

  const WalletTicketStub({
    super.key,
    required this.title,
    required this.coverUrl,
    required this.whenLine,
    required this.status,
    required this.typeLabel,
    required this.onTap,
    required this.bg,
    this.action = 'Show QR',
    this.past = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Opacity(
        opacity: past ? 0.74 : 1,
        child: Container(
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(AppRadius.card),
            border: Border.all(color: AppColors.border),
            boxShadow: AppShadow.soft,
          ),
          clipBehavior: Clip.antiAlias,
          child: IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Container(width: 5, color: statusColor(status)),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Padding(
                        padding: const EdgeInsets.all(13),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(11),
                              child: ColorFiltered(
                                colorFilter: past
                                    ? const ColorFilter.matrix(<double>[
                                        0.4, 0.4, 0.2, 0, 0,
                                        0.4, 0.4, 0.2, 0, 0,
                                        0.4, 0.4, 0.2, 0, 0,
                                        0, 0, 0, 1, 0,
                                      ])
                                    : const ColorFilter.mode(
                                        Colors.transparent, BlendMode.dst),
                                child: SizedBox(
                                  width: 60,
                                  height: 60,
                                  child: (coverUrl != null &&
                                          coverUrl!.isNotEmpty)
                                      ? Image.network(coverUrl!,
                                          fit: BoxFit.cover,
                                          errorBuilder: (_, __, ___) =>
                                              PhotoPlaceholder(
                                                  hue: hueFromString(title)))
                                      : PhotoPlaceholder(
                                          hue: hueFromString(title)),
                                ),
                              ),
                            ),
                            const SizedBox(width: 13),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(title,
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                      style: AppText.h3.copyWith(fontSize: 15)),
                                  const SizedBox(height: 5),
                                  Text(whenLine,
                                      style: AppText.numSm.copyWith(
                                          color: AppColors.inkMuted,
                                          fontSize: 11.5)),
                                  const SizedBox(height: 9),
                                  _statusTag(),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      // mini perforated footer
                      Stack(
                        clipBehavior: Clip.none,
                        alignment: Alignment.center,
                        children: [
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 13),
                            child: CustomPaint(
                              size: const Size(double.infinity, 2),
                              painter: _DashPainter(AppColors.border),
                            ),
                          ),
                          Positioned(left: -6, child: _miniNotch()),
                          Positioned(right: -6, child: _miniNotch()),
                        ],
                      ),
                      Padding(
                        padding:
                            const EdgeInsets.fromLTRB(13, 11, 13, 12),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Flexible(
                              child: Text(typeLabel,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: AppText.numSm.copyWith(
                                      color: AppColors.inkMuted, fontSize: 11)),
                            ),
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(action,
                                    style: AppText.bodySm.copyWith(
                                        color: AppColors.forest,
                                        fontWeight: FontWeight.w600)),
                                const SizedBox(width: 4),
                                const Icon(Icons.chevron_right,
                                    size: 15, color: AppColors.forest),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _miniNotch() => Container(
        width: 12,
        height: 12,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: bg,
          border: Border.all(color: AppColors.border, width: 1),
        ),
      );

  Widget _statusTag() {
    final c = statusColor(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: c.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(shape: BoxShape.circle, color: c),
          ),
          const SizedBox(width: 6),
          Text(statusLabel(status),
              style: AppText.bodySm.copyWith(
                  color: c, fontWeight: FontWeight.w600, fontSize: 12)),
        ],
      ),
    );
  }
}
