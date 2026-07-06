// SP02 · Session live Q&A (read-only for speakers).
// Reads `qa_questions` for a session, sorted by upvotes; speakers READ, they don't moderate.
// DRAFT — verify via `flutter analyze`.

import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../ui/tokens.dart';
import '../../ui/components.dart';
import '../role_widgets.dart';

class SessionQaScreen extends StatefulWidget {
  final String eventId;
  final String sessionId;
  final String eventName;
  final String sessionTitle;
  const SessionQaScreen({
    super.key,
    required this.eventId,
    required this.sessionId,
    required this.eventName,
    required this.sessionTitle,
  });

  @override
  State<SessionQaScreen> createState() => _SessionQaScreenState();
}

class _Q {
  final String id, text;
  final int votes;
  final bool featured;
  _Q(this.id, this.text, this.votes, this.featured);
}

class _SessionQaScreenState extends State<SessionQaScreen> {
  late Future<List<_Q>> _future;

  RealtimeChannel? _channel;

  @override
  void initState() {
    super.initState();
    _future = _load();
    _channel = Supabase.instance.client
        .channel('qa:${widget.sessionId}')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'qa_questions',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'session_id',
            value: widget.sessionId,
          ),
          callback: (_) { if (mounted) setState(() => _future = _load()); },
        )
        .subscribe();
  }

  @override
  void dispose() {
    final c = _channel;
    if (c != null) Supabase.instance.client.removeChannel(c);
    super.dispose();
  }

  Future<List<_Q>> _load() async {
    final rows = await Supabase.instance.client
        .from('qa_questions')
        .select('id, question, upvotes_count, is_featured, status')
        .eq('session_id', widget.sessionId)
        .neq('status', 'hidden')
        .order('upvotes_count', ascending: false);
    return (rows as List).map((r) {
      final m = Map<String, dynamic>.from(r as Map);
      return _Q(
        (m['id'] ?? '').toString(),
        (m['question'] ?? '').toString(),
        (m['upvotes_count'] ?? 0) is int ? m['upvotes_count'] as int : 0,
        m['is_featured'] == true,
      );
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: MAppBar(title: 'Audience Q&A'),
      body: Column(
        children: [
          RoleBar(
            icon: Icons.mic_none,
            eventName: widget.sessionTitle,
            roleLine: 'Speaker · read-only',
          ),
          Expanded(
            child: FutureBuilder<List<_Q>>(
              future: _future,
              builder: (context, snap) {
                if (snap.connectionState == ConnectionState.waiting) {
                  return const Center(
                      child: CircularProgressIndicator(color: AppColors.forest));
                }
                final qs = snap.data ?? [];
                if (qs.isEmpty) {
                  return const EmptyState(
                    icon: Icons.forum_outlined,
                    title: 'No questions yet',
                    message: 'Audience questions will appear here, sorted by upvotes.',
                  );
                }
                return ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: qs.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (_, i) {
                    final q = qs[i];
                    final top = i == 0 || q.featured;
                    return Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                            color: top ? AppColors.gold : AppColors.border,
                            width: top ? 2 : 1),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Column(
                            children: [
                              Icon(Icons.keyboard_arrow_up,
                                  size: 20,
                                  color: top ? AppColors.gold : AppColors.inkMuted),
                              Text('${q.votes}',
                                  style: TextStyle(
                                      color: top ? AppColors.gold : AppColors.inkSoft,
                                      fontWeight: FontWeight.w700,
                                      fontSize: 13)),
                            ],
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(q.text,
                                style: const TextStyle(
                                    color: AppColors.ink, fontSize: 14, height: 1.4)),
                          ),
                        ],
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
