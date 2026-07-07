// Speaker tools entry — opened from the event hub when the user is a speaker at this
// event. Resolves the speaker's sessions, then shows tool cards (green room + per-session
// live Q&A). DRAFT — verify via `flutter analyze`.

import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../ui/tokens.dart';
import '../../ui/components.dart';
import '../role_widgets.dart';
import 'green_room_screen.dart';
import 'session_qa_screen.dart';
import 'speaker_profile_screen.dart';

class SpeakerToolsScreen extends StatefulWidget {
  final String eventId;
  final String eventName;
  const SpeakerToolsScreen({super.key, required this.eventId, required this.eventName});

  @override
  State<SpeakerToolsScreen> createState() => _SpeakerToolsScreenState();
}

class _Sess {
  final String id, title, room;
  final DateTime? startsAt, endsAt;
  _Sess(this.id, this.title, this.room, this.startsAt, this.endsAt);
}

class _SpeakerToolsScreenState extends State<SpeakerToolsScreen> {
  late Future<List<_Sess>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<_Sess>> _load() async {
    final email =
        Supabase.instance.client.auth.currentUser?.email?.toLowerCase() ?? '';
    // Find speaker rows for this account, then their sessions.
    final sp = await Supabase.instance.client
        .from('speakers')
        .select('id')
        .eq('event_id', widget.eventId)
        .ilike('email', email);
    final ids = (sp as List).map((r) => (Map<String, dynamic>.from(r as Map)['id']).toString()).toList();
    if (ids.isEmpty) return [];
    final links = await Supabase.instance.client
        .from('session_speakers')
        .select('session_id')
        .inFilter('speaker_id', ids);
    final sessionIds = (links as List)
        .map((r) => (Map<String, dynamic>.from(r as Map)['session_id']).toString())
        .toList();
    if (sessionIds.isEmpty) return [];
    final rows = await Supabase.instance.client
        .from('sessions')
        .select('id, title, room, starts_at, ends_at')
        .inFilter('id', sessionIds)
        .order('starts_at');
    return (rows as List).map((r) {
      final m = Map<String, dynamic>.from(r as Map);
      return _Sess(
        (m['id'] ?? '').toString(),
        (m['title'] ?? 'Session').toString(),
        (m['room'] ?? '').toString(),
        m['starts_at'] != null ? DateTime.tryParse(m['starts_at'].toString()) : null,
        m['ends_at'] != null ? DateTime.tryParse(m['ends_at'].toString()) : null,
      );
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: MAppBar(title: 'Speaker tools'),
      body: FutureBuilder<List<_Sess>>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: AppColors.forest));
          }
          final sessions = snap.data ?? [];
          return ListView(
            children: [
              RoleBar(icon: Icons.mic_none, eventName: widget.eventName, roleLine: 'Speaker'),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ToolCard(
                      icon: Icons.person_outline,
                      title: 'My speaker profile',
                      summary: 'Edit headline, company, bio, links',
                      onTap: () => Navigator.of(context).push(MaterialPageRoute(
                          builder: (_) => SpeakerProfileScreen(
                              eventId: widget.eventId, eventName: widget.eventName))),
                    ),
                    const SizedBox(height: 22),
                    if (sessions.isNotEmpty) ...[
                      const SectionLabel('Your sessions'),
                      const SizedBox(height: 10),
                    ],
                    for (final s in sessions) ...[
                      ToolCard(
                        icon: Icons.meeting_room_outlined,
                        title: s.title,
                        summary: 'Green room · logistics',
                        onTap: () => Navigator.of(context).push(MaterialPageRoute(
                            builder: (_) => GreenRoomScreen(
                                eventName: widget.eventName, sessionTitle: s.title,
                                startsAt: s.startsAt, endsAt: s.endsAt, room: s.room))),
                      ),
                      const SizedBox(height: 8),
                      ToolCard(
                        icon: Icons.forum_outlined,
                        title: '${s.title} · Q&A',
                        summary: 'Read audience questions (upvote-sorted)',
                        onTap: () => Navigator.of(context).push(MaterialPageRoute(
                            builder: (_) => SessionQaScreen(
                                eventId: widget.eventId, sessionId: s.id,
                                eventName: widget.eventName, sessionTitle: s.title))),
                      ),
                      const SizedBox(height: 10),
                    ],
                    if (sessions.isEmpty)
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          color: AppColors.creamSoft,
                          borderRadius: BorderRadius.circular(AppRadius.card),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.event_note_outlined,
                                size: 26, color: AppColors.inkMuted),
                            const SizedBox(height: 10),
                            Text('No sessions yet',
                                style: AppText.h3.copyWith(fontSize: 15)),
                            const SizedBox(height: 4),
                            Text(
                              'When the organizer adds you to the schedule, your '
                              'sessions — with green room details and live audience '
                              'Q&A — will appear here.',
                              style: AppText.bodySm
                                  .copyWith(color: AppColors.inkMuted, height: 1.5),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
