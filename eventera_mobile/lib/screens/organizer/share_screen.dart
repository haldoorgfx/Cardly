import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:share_plus/share_plus.dart';

import '../../app_config.dart';
import '../../theme.dart';

/// Shows the public attendee link for an event, with a QR code, copy, and share.
class ShareScreen extends StatelessWidget {
  final String slug;
  final String eventName;
  const ShareScreen({super.key, required this.slug, required this.eventName});

  String get _link => '${AppConfig.renderBaseUrl}/c/$slug';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Brand.cream,
        surfaceTintColor: Brand.cream,
        elevation: 0,
        title: const Text('Share',
            style: TextStyle(
                color: Brand.ink, fontSize: 17, fontWeight: FontWeight.w600)),
        iconTheme: const IconThemeData(color: Brand.ink),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            const SizedBox(height: 8),
            Text(eventName,
                textAlign: TextAlign.center,
                style: const TextStyle(
                    color: Brand.ink,
                    fontSize: 20,
                    fontWeight: FontWeight.w700)),
            const SizedBox(height: 4),
            const Text('Attendees scan or open this to make their card.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Brand.muted, fontSize: 14)),
            const SizedBox(height: 28),

            // QR
            Center(
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Brand.surface,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Brand.border),
                  boxShadow: const [
                    BoxShadow(
                        color: Color(0x141F4D3A),
                        blurRadius: 24,
                        offset: Offset(0, 8)),
                  ],
                ),
                child: QrImageView(
                  data: _link,
                  version: QrVersions.auto,
                  size: 220,
                  eyeStyle: const QrEyeStyle(
                    eyeShape: QrEyeShape.square,
                    color: Brand.forest,
                  ),
                  dataModuleStyle: const QrDataModuleStyle(
                    dataModuleShape: QrDataModuleShape.square,
                    color: Brand.ink,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 28),

            // Link box
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
              decoration: BoxDecoration(
                color: Brand.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Brand.border),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(_link,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                            color: Brand.ink, fontSize: 14)),
                  ),
                  const SizedBox(width: 8),
                  InkWell(
                    borderRadius: BorderRadius.circular(8),
                    onTap: () {
                      Clipboard.setData(ClipboardData(text: _link));
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                            content: Text('Link copied'),
                            duration: Duration(seconds: 2)),
                      );
                    },
                    child: const Padding(
                      padding: EdgeInsets.all(4),
                      child: Icon(Icons.copy, color: Brand.forest, size: 20),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                icon: const Icon(Icons.ios_share, size: 20),
                label: const Text('Share link'),
                onPressed: () => Share.share(
                  'Make your card for $eventName: $_link',
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
