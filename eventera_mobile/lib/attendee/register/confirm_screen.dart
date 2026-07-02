import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../app_config.dart';
import '../../theme.dart';

/// Success screen shown after a registration completes. Renders the ticket QR
/// (the check-in URL, matching what /api/qr/[token] encodes) plus attendee and
/// ticket details.
class ConfirmScreen extends StatelessWidget {
  final String qrToken;
  final String eventName;
  final String? attendeeName;
  final String? ticketType;
  final String? cardEventSlug;

  const ConfirmScreen({
    super.key,
    required this.qrToken,
    required this.eventName,
    this.attendeeName,
    this.ticketType,
    this.cardEventSlug,
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Brand.cream,
      appBar: AppBar(
        backgroundColor: Brand.cream,
        elevation: 0,
        foregroundColor: Brand.ink,
        automaticallyImplyLeading: false,
        title: const Text('You’re in'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 8),
              Center(
                child: Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    color: Brand.success.withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.check_rounded,
                      color: Brand.success, size: 36),
                ),
              ),
              const SizedBox(height: 16),
              const Center(
                child: Text(
                  'Registration confirmed',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    color: Brand.ink,
                  ),
                ),
              ),
              const SizedBox(height: 4),
              Center(
                child: Text(
                  eventName,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 15, color: Brand.muted),
                ),
              ),
              const SizedBox(height: 24),
              _TicketCard(
                qrData: _qrData,
                attendeeName: attendeeName,
                ticketType: ticketType,
                eventName: eventName,
              ),
              const SizedBox(height: 20),
              const _InfoNote(
                'Show this QR code at the door to check in. It’s also saved '
                'to My Tickets on this account.',
              ),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: () =>
                    Navigator.of(context).popUntil((r) => r.isFirst),
                child: const Text('Done'),
              ),
              if (cardEventSlug != null && cardEventSlug!.isNotEmpty) ...[
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: () => Navigator.of(context).pop(),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Brand.forest,
                    side: const BorderSide(color: Brand.border),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  icon: const Icon(Icons.image_outlined, size: 18),
                  label: const Text('Make your event card'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _TicketCard extends StatelessWidget {
  final String qrData;
  final String? attendeeName;
  final String? ticketType;
  final String eventName;

  const _TicketCard({
    required this.qrData,
    required this.attendeeName,
    required this.ticketType,
    required this.eventName,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Brand.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Brand.border),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Brand.border),
            ),
            child: QrImageView(
              data: qrData,
              size: 200,
              backgroundColor: Colors.white,
            ),
          ),
          const SizedBox(height: 16),
          if (attendeeName != null && attendeeName!.isNotEmpty) ...[
            Text(
              attendeeName!,
              style: const TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w600,
                color: Brand.ink,
              ),
            ),
            const SizedBox(height: 4),
          ],
          if (ticketType != null && ticketType!.isNotEmpty)
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
              decoration: BoxDecoration(
                color: Brand.forest.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(
                ticketType!,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Brand.forest,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _InfoNote extends StatelessWidget {
  final String text;
  const _InfoNote(this.text);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Brand.forest.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.info_outline, size: 18, color: Brand.forest),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(fontSize: 13, color: Brand.inkSoft),
            ),
          ),
        ],
      ),
    );
  }
}
