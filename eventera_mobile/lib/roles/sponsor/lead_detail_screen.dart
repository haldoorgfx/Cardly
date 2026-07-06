// SPO06 · Lead detail — full contact, rating, note, capture stamp.
// Fed the captured lead + refetches the registration for phone (if available).
// DRAFT — verify via `flutter analyze`.

import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../ui/tokens.dart';
import '../../ui/components.dart';

class LeadDetailScreen extends StatelessWidget {
  final String name, email, rating, note;
  final DateTime? capturedAt;
  final String boothName;
  const LeadDetailScreen({
    super.key,
    required this.name,
    required this.email,
    required this.rating,
    required this.note,
    required this.boothName,
    this.capturedAt,
  });

  Color get _rc => rating == 'hot'
      ? AppColors.danger
      : rating == 'warm'
          ? AppColors.warning
          : AppColors.forest;

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: MAppBar(title: 'Lead'),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            children: [
              Expanded(
                child: Text(name,
                    style: const TextStyle(
                        color: AppColors.ink, fontSize: 22, fontWeight: FontWeight.w700)),
              ),
              if (rating.isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                      color: _rc.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(999)),
                  child: Text(rating,
                      style: TextStyle(color: _rc, fontSize: 12, fontWeight: FontWeight.w700)),
                ),
            ],
          ),
          const SizedBox(height: 20),
          if (email.isNotEmpty)
            _row(Icons.mail_outline, email, () => launchUrl(Uri.parse('mailto:$email'))),
          if (note.isNotEmpty) ...[
            const SizedBox(height: 8),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                  color: AppColors.creamSoft, borderRadius: BorderRadius.circular(12)),
              child: Text(note,
                  style: const TextStyle(color: AppColors.inkSoft, fontSize: 14, height: 1.5)),
            ),
          ],
          const SizedBox(height: 20),
          Text(
            'Captured at $boothName${capturedAt != null ? ' · ${capturedAt!.month}/${capturedAt!.day} ${capturedAt!.hour}:${capturedAt!.minute.toString().padLeft(2, '0')}' : ''}',
            style: const TextStyle(color: AppColors.inkMuted, fontSize: 12.5),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
                color: AppColors.forestSoft, borderRadius: BorderRadius.circular(12)),
            child: const Text('Full contact export & CRM sync are on the Eventera web dashboard.',
                style: TextStyle(color: AppColors.forest, fontSize: 12.5, height: 1.4)),
          ),
        ],
      ),
    );
  }

  Widget _row(IconData icon, String value, VoidCallback onTap) => InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 10),
          child: Row(children: [
            Icon(icon, size: 18, color: AppColors.forest),
            const SizedBox(width: 12),
            Expanded(
              child: Text(value,
                  style: const TextStyle(color: AppColors.ink, fontSize: 14.5)),
            ),
            const Icon(Icons.chevron_right, size: 18, color: AppColors.inkMuted),
          ]),
        ),
      );
}
