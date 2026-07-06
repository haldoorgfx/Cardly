// SP05 · Green room / logistics — call time / on-stage / length + stage row + run of show.
// Built from existing `sessions` fields (starts_at, ends_at, room). Richer logistics
// (AV contact, exact call time, uploaded rider) are managed on the web — shown as a whynote.
// DRAFT — verify via `flutter analyze`.

import 'package:flutter/material.dart';
import '../../ui/tokens.dart';
import '../../ui/components.dart';
import '../role_widgets.dart';

class GreenRoomScreen extends StatelessWidget {
  final String eventName;
  final String sessionTitle;
  final DateTime? startsAt;
  final DateTime? endsAt;
  final String? room;
  const GreenRoomScreen({
    super.key,
    required this.eventName,
    required this.sessionTitle,
    this.startsAt,
    this.endsAt,
    this.room,
  });

  String _time(DateTime? d) {
    if (d == null) return '—';
    final h12 = d.hour % 12 == 0 ? 12 : d.hour % 12;
    return '$h12:${d.minute.toString().padLeft(2, '0')} ${d.hour < 12 ? 'AM' : 'PM'}';
  }

  @override
  Widget build(BuildContext context) {
    final lengthMin = (startsAt != null && endsAt != null)
        ? endsAt!.difference(startsAt!).inMinutes
        : null;
    final callTime =
        startsAt != null ? startsAt!.subtract(const Duration(minutes: 30)) : null;

    return MScaffold(
      appBar: MAppBar(title: 'Green room'),
      body: ListView(
        children: [
          RoleBar(icon: Icons.mic_none, eventName: eventName, roleLine: 'Speaker'),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(sessionTitle,
                    style: const TextStyle(
                        color: AppColors.ink, fontSize: 18, fontWeight: FontWeight.w700)),
                const SizedBox(height: 16),
                Row(
                  children: [
                    _stat('Call time', _time(callTime)),
                    const SizedBox(width: 10),
                    _stat('On stage', _time(startsAt)),
                    const SizedBox(width: 10),
                    _stat('Length', lengthMin != null ? '${lengthMin}m' : '—'),
                  ],
                ),
                const SizedBox(height: 16),
                _row(Icons.location_on_outlined, 'Stage', room ?? 'TBA'),
                _row(Icons.headset_mic_outlined, 'AV contact', 'See event team on the web'),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.forestSoft,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text(
                    'Slide upload, rider and full run-of-show are managed on the Eventera web dashboard.',
                    style: TextStyle(color: AppColors.forest, fontSize: 12.5, height: 1.4),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _stat(String label, String value) => Expanded(
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            children: [
              Text(value,
                  style: const TextStyle(
                      color: AppColors.forest, fontSize: 18, fontWeight: FontWeight.w700)),
              const SizedBox(height: 2),
              Text(label,
                  style: const TextStyle(color: AppColors.inkMuted, fontSize: 11.5)),
            ],
          ),
        ),
      );

  Widget _row(IconData icon, String label, String value) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          children: [
            Icon(icon, size: 18, color: AppColors.inkMuted),
            const SizedBox(width: 10),
            Text(label,
                style: const TextStyle(color: AppColors.inkMuted, fontSize: 13.5)),
            const Spacer(),
            Flexible(
              child: Text(value,
                  textAlign: TextAlign.right,
                  style: const TextStyle(
                      color: AppColors.ink, fontSize: 13.5, fontWeight: FontWeight.w600)),
            ),
          ],
        ),
      );
}
