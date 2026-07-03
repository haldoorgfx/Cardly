import 'package:flutter/material.dart';

import '../../ui/components.dart';
import '../../ui/tokens.dart';

/// Fullscreen scan mode — dark screen, large bright QR, attendee + code header.
/// (White QR card maximises contrast for the scanner.)
class FullscreenQrScreen extends StatelessWidget {
  final String qrData;
  final String ticketCode;
  final String attendee;
  final String typeLabel;

  const FullscreenQrScreen({
    super.key,
    required this.qrData,
    required this.ticketCode,
    required this.attendee,
    required this.typeLabel,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.forestDark,
      body: SafeArea(
        child: Column(
          children: [
            Align(
              alignment: Alignment.centerLeft,
              child: IconButton(
                icon: const Icon(Icons.close, color: Colors.white, size: 26),
                onPressed: () => Navigator.of(context).maybePop(),
              ),
            ),
            const Spacer(),
            Text(attendee,
                style: AppText.h3.copyWith(color: Colors.white, fontSize: 18)),
            if (typeLabel.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(typeLabel,
                  style: AppText.bodySm.copyWith(
                      color: Colors.white.withValues(alpha: 0.7))),
            ],
            const SizedBox(height: 28),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
              ),
              child: QrBlock(data: qrData, size: 250),
            ),
            const SizedBox(height: 20),
            Text(ticketCode,
                style: AppText.numSm.copyWith(
                    color: AppColors.gold,
                    letterSpacing: 3,
                    fontWeight: FontWeight.w600)),
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.wb_sunny_outlined,
                    size: 15, color: Colors.white.withValues(alpha: 0.6)),
                const SizedBox(width: 7),
                Text('Hold steady for the scanner',
                    style: AppText.bodySm.copyWith(
                        color: Colors.white.withValues(alpha: 0.6))),
              ],
            ),
            const Spacer(flex: 2),
          ],
        ),
      ),
    );
  }
}
