import 'package:flutter/material.dart';

import '../../app_config.dart';
import '../../ics_export.dart';
import '../../screens/open_event_screen.dart';
import '../../ui/components.dart';
import '../../ui/tokens.dart';
import '../app_shell.dart';

/// Success screen shown after a registration completes (screen 11 — DARK).
/// Renders the ticket QR (the check-in URL, matching what /api/qr/[token]
/// encodes) plus attendee and ticket details.
class ConfirmScreen extends StatelessWidget {
  final String qrToken;
  final String eventName;

  /// The event's public slug — used to open the card flow ("Make your card").
  final String slug;
  final String? attendeeName;
  final String? ticketType;
  final String? cardEventSlug;

  /// Event timing/venue, used for the "Add to calendar" export. All optional —
  /// the export defaults gracefully when a start date is missing.
  final DateTime? eventStart;
  final DateTime? eventEnd;
  final String? venue;

  const ConfirmScreen({
    super.key,
    required this.qrToken,
    required this.eventName,
    required this.slug,
    this.attendeeName,
    this.ticketType,
    this.cardEventSlug,
    this.eventStart,
    this.eventEnd,
    this.venue,
  });

  /// The web QR encodes the check-in URL, not the bare token, so scans work in
  /// any camera app. We mirror that here.
  String get _qrData {
    final slug = cardEventSlug;
    if (slug != null && slug.isNotEmpty) {
      return '${AppConfig.renderBaseUrl}/e/$slug/check-in?token=$qrToken';
    }
    return qrToken;
  }

  /// A short mono ticket id derived from the token (display only).
  String get _ticketId {
    final t = qrToken.replaceAll(RegExp(r'[^A-Za-z0-9]'), '').toUpperCase();
    if (t.isEmpty) return 'TKT';
    final a = t.length >= 4 ? t.substring(0, 4) : t;
    final b = t.length >= 8 ? t.substring(4, 8) : '';
    return b.isEmpty ? 'TKT-$a' : 'TKT-$a-$b';
  }

  Future<void> _addToCalendar(BuildContext context) async {
    try {
      await addEventToCalendar(
        title: eventName,
        start: eventStart,
        end: eventEnd,
        location: (venue != null && venue!.trim().isNotEmpty) ? venue : null,
        description: 'Your ticket for $eventName. — Eventera',
      );
    } catch (_) {
      if (context.mounted) {
        showToast(context, "Couldn't open calendar export. Please try again.");
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.forestDark,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(
              AppSpace.lg, AppSpace.sm, AppSpace.lg, AppSpace.lg),
          child: Column(
            children: [
              const SizedBox(height: 8),
              // Success check.
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: AppColors.success.withValues(alpha: 0.25),
                  shape: BoxShape.circle,
                  border:
                      Border.all(color: AppColors.gold.withValues(alpha: 0.4)),
                ),
                child: const Icon(Icons.check_rounded,
                    color: AppColors.gold, size: 30),
              ),
              const SizedBox(height: 16),
              Text("You're in.",
                  style: AppText.h1.copyWith(color: Colors.white, fontSize: 24)),
              const SizedBox(height: 6),
              Text(
                attendeeName != null && attendeeName!.isNotEmpty
                    ? '$eventName confirmed'
                    : 'Your ticket is ready',
                textAlign: TextAlign.center,
                style: AppText.bodySm
                    .copyWith(color: Colors.white.withValues(alpha: 0.72)),
              ),
              const SizedBox(height: 22),

              // White ticket card with big QR.
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(22),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: const [
                    BoxShadow(
                        color: Color(0x80000000),
                        blurRadius: 50,
                        offset: Offset(0, 24)),
                  ],
                ),
                child: Column(
                  children: [
                    if (qrToken.isNotEmpty)
                      QrBlock(data: _qrData, size: 200)
                    else
                      const Padding(
                        padding: EdgeInsets.all(24),
                        child: Text(
                          'QR code will appear here once confirmed.',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: AppColors.inkMuted),
                        ),
                      ),
                    const SizedBox(height: 16),
                    if (ticketType != null && ticketType!.isNotEmpty) ...[
                      Tag(ticketType!, kind: TagKind.forest),
                      const SizedBox(height: 10),
                    ],
                    if (attendeeName != null && attendeeName!.isNotEmpty)
                      Text(attendeeName!,
                          style: AppText.h3.copyWith(fontSize: 18)),
                    const SizedBox(height: 3),
                    Text(
                      eventName,
                      textAlign: TextAlign.center,
                      style: AppText.bodySm.copyWith(color: AppColors.inkMuted),
                    ),
                    if (qrToken.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Text(_ticketId,
                          style: AppText.numSm.copyWith(
                              color: AppColors.inkMuted,
                              fontSize: 11,
                              letterSpacing: 1.2)),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Add to calendar (dark ghost button).
              _DarkGhostButton(
                icon: Icons.calendar_today_outlined,
                label: 'Add to calendar',
                onTap: () => _addToCalendar(context),
              ),
              const SizedBox(height: 11),
              if (cardEventSlug != null && cardEventSlug!.isNotEmpty) ...[
                MButton(
                  'Make your card',
                  kind: MBtnKind.gold,
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => OpenEventScreen(slug: cardEventSlug!),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
              ],
              GestureDetector(
                onTap: () {
                  // Land on the Tickets tab (index 1), not just whatever tab was
                  // last active, so the label matches the destination.
                  mainTab.value = 1;
                  Navigator.of(context).popUntil((r) => r.isFirst);
                },
                child: Text(
                  'View my tickets',
                  style: AppText.bodyStrong.copyWith(
                      color: AppColors.gold.withValues(alpha: 0.9),
                      fontSize: 13.5),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DarkGhostButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback? onTap;
  const _DarkGhostButton(
      {required this.icon, required this.label, this.onTap});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 52,
        width: double.infinity,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.10),
          borderRadius: BorderRadius.circular(AppRadius.btn),
          border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 19, color: Colors.white),
            const SizedBox(width: 9),
            Text(label, style: AppText.btn.copyWith(color: Colors.white)),
          ],
        ),
      ),
    );
  }
}
