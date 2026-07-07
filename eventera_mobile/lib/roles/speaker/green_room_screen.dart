// SP05 · Green room / logistics for one session.
// Call time / on-stage / length + stage + the session brief and the co-speakers
// sharing the stage — all real data. Timing/room are passed in from the tools
// screen for an instant render; the description and co-speakers are fetched
// live from Supabase (both are public SELECT). Fails SAFE: a fetch error just
// hides the enriched blocks, the core logistics still show.

import 'package:flutter/material.dart';

import '../../net.dart';
import '../../ui/tokens.dart';
import '../../ui/components.dart';
import '../role_widgets.dart';
import 'speaker_api.dart';

class GreenRoomScreen extends StatefulWidget {
  final String eventId;
  final String sessionId;
  final String eventName;
  final String sessionTitle;
  final DateTime? startsAt;
  final DateTime? endsAt;
  final String? room;
  const GreenRoomScreen({
    super.key,
    required this.eventId,
    required this.sessionId,
    required this.eventName,
    required this.sessionTitle,
    this.startsAt,
    this.endsAt,
    this.room,
  });

  @override
  State<GreenRoomScreen> createState() => _GreenRoomScreenState();
}

class _GreenRoomScreenState extends State<GreenRoomScreen> {
  String _description = '';
  List<Map<String, dynamic>> _coSpeakers = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final results = await Future.wait([
        SpeakerApi.session(widget.sessionId),
        SpeakerApi.sessionSpeakers(widget.sessionId),
      ]);
      if (!mounted) return;
      final session = results[0] as Map<String, dynamic>?;
      final speakers = results[1] as List<Map<String, dynamic>>;
      setState(() {
        _description = asString(session?['description']).trim();
        _coSpeakers = speakers;
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _time(DateTime? d) {
    if (d == null) return '—';
    final h12 = d.hour % 12 == 0 ? 12 : d.hour % 12;
    return '$h12:${d.minute.toString().padLeft(2, '0')} ${d.hour < 12 ? 'AM' : 'PM'}';
  }

  @override
  Widget build(BuildContext context) {
    final lengthMin = (widget.startsAt != null && widget.endsAt != null)
        ? widget.endsAt!.difference(widget.startsAt!).inMinutes
        : null;
    final callTime =
        widget.startsAt?.subtract(const Duration(minutes: 30));

    return MScaffold(
      appBar: const MAppBar(title: 'Green room'),
      body: ListView(
        children: [
          RoleBar(
              icon: Icons.mic_none,
              eventName: widget.eventName,
              roleLine: 'Speaker'),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(widget.sessionTitle,
                    style: const TextStyle(
                        color: AppColors.ink,
                        fontSize: 18,
                        fontWeight: FontWeight.w700)),
                const SizedBox(height: 16),
                Row(
                  children: [
                    _stat('Call time', _time(callTime)),
                    const SizedBox(width: 10),
                    _stat('On stage', _time(widget.startsAt)),
                    const SizedBox(width: 10),
                    _stat('Length', lengthMin != null ? '${lengthMin}m' : '—'),
                  ],
                ),
                const SizedBox(height: 16),
                _row(Icons.location_on_outlined, 'Stage',
                    (widget.room ?? '').isEmpty ? 'TBA' : widget.room!),
                const SizedBox(height: 20),

                // ── Session brief (real description) ─────────────────────────
                const SectionLabel('Session brief'),
                const SizedBox(height: 8),
                if (_loading)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 8),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Skeleton(height: 12),
                        SizedBox(height: 8),
                        Skeleton(height: 12, width: 220),
                      ],
                    ),
                  )
                else
                  Text(
                    _description.isEmpty
                        ? 'No brief has been added for this session yet.'
                        : _description,
                    style: AppText.body.copyWith(
                        color: _description.isEmpty
                            ? AppColors.inkMuted
                            : AppColors.inkSoft,
                        height: 1.55),
                  ),
                const SizedBox(height: 22),

                // ── Sharing the stage (co-speakers) ──────────────────────────
                const SectionLabel('Sharing the stage'),
                const SizedBox(height: 10),
                if (_loading)
                  const Skeleton(height: 44)
                else if (_coSpeakers.isEmpty)
                  Text('You are the only speaker on this session.',
                      style: AppText.bodySm.copyWith(color: AppColors.inkMuted))
                else
                  ..._coSpeakers.map(_speakerRow),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _speakerRow(Map<String, dynamic> s) {
    final name = asString(s['name'], 'Speaker');
    final headline = asString(s['headline']).trim();
    final role = asString(s['role']).trim();
    final company = asString(s['company']).trim();
    final subtitleParts = <String>[
      if (headline.isNotEmpty) headline else if (role.isNotEmpty) role,
      if (company.isNotEmpty) company,
    ];
    final subtitle = subtitleParts.join(' · ');
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Avatar(name: name, imageUrl: asString(s['photo_url']), size: 40),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        color: AppColors.ink,
                        fontSize: 14.5,
                        fontWeight: FontWeight.w600)),
                if (subtitle.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(subtitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                          color: AppColors.inkMuted, fontSize: 12.5)),
                ],
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
                      color: AppColors.forest,
                      fontSize: 18,
                      fontWeight: FontWeight.w700)),
              const SizedBox(height: 2),
              Text(label,
                  style: const TextStyle(
                      color: AppColors.inkMuted, fontSize: 11.5)),
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
                style: const TextStyle(
                    color: AppColors.inkSoft, fontSize: 13.5)),
            const Spacer(),
            Flexible(
              child: Text(value,
                  textAlign: TextAlign.right,
                  style: const TextStyle(
                      color: AppColors.ink,
                      fontSize: 13.5,
                      fontWeight: FontWeight.w600)),
            ),
          ],
        ),
      );
}
