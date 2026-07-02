import 'package:flutter/material.dart';

import '../../net.dart';
import '../../theme.dart';
import '_shared.dart';

/// PollsScreen — live polls for an event. Reads `polls` + `poll_options`
/// directly via supa (RLS: public read). Voting posts the web route.
///
/// Contracts verified:
///  - Read:   polls select('*, poll_options(id, text, votes_count, position)')
///            .eq('event_id', ...). (mirrors GET /api/events/[id]/polls)
///  - Vote:   apiPut('/api/events/[id]/polls', {poll_id, option_id, registration_id})
///            → returns { voted, options:[{id, votes_count}] }.
///  - Own votes: poll_votes where registration_id (columns poll_id, option_id).
class PollsScreen extends StatefulWidget {
  final String eventId;
  final String? registrationId;
  const PollsScreen({
    super.key,
    required this.eventId,
    this.registrationId,
  });

  @override
  State<PollsScreen> createState() => _PollsScreenState();
}

class _Poll {
  final String id;
  final String question;
  final bool isClosed;
  final List<_Option> options;
  _Poll({
    required this.id,
    required this.question,
    required this.isClosed,
    required this.options,
  });

  int get totalVotes => options.fold(0, (sum, o) => sum + o.votes);
}

class _Option {
  final String id;
  final String text;
  int votes;
  _Option({required this.id, required this.text, required this.votes});
}

class _PollsScreenState extends State<PollsScreen> {
  bool _loading = true;
  String? _error;
  List<_Poll> _polls = [];
  final Map<String, String> _myVotes = {}; // pollId -> optionId
  final Set<String> _busy = {}; // pollIds voting

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final rows = await supa
          .from('polls')
          .select('*, poll_options(id, text, votes_count, position)')
          .eq('event_id', widget.eventId)
          .order('created_at', ascending: false);

      final polls = <_Poll>[];
      for (final r in (rows as List).whereType<Map>()) {
        final map = Map<String, dynamic>.from(r);
        final opts = asMapList(map['poll_options'])
          ..sort((a, b) => asInt(a['position']).compareTo(asInt(b['position'])));
        polls.add(_Poll(
          id: asString(map['id']),
          question: asString(map['question'], 'Poll'),
          isClosed: asBool(map['is_closed']),
          options: opts
              .map((o) => _Option(
                    id: asString(o['id']),
                    text: asString(o['text']),
                    votes: asInt(o['votes_count']),
                  ))
              .toList(),
        ));
      }

      _myVotes.clear();
      final rid = widget.registrationId;
      if (rid != null) {
        final votes = await supa
            .from('poll_votes')
            .select('poll_id, option_id')
            .eq('registration_id', rid);
        for (final v in (votes as List).whereType<Map>()) {
          _myVotes[asString(v['poll_id'])] = asString(v['option_id']);
        }
      }
      if (!mounted) return;
      setState(() {
        _polls = polls;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e is ApiException ? e.message : e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _vote(_Poll poll, _Option option) async {
    final rid = widget.registrationId;
    if (rid == null) {
      showEngageSnack(context, 'Register for this event to vote', error: true);
      return;
    }
    if (poll.isClosed || _myVotes.containsKey(poll.id) || _busy.contains(poll.id)) {
      return;
    }
    setState(() => _busy.add(poll.id));
    try {
      final res = await apiPut('/api/events/${widget.eventId}/polls', {
        'poll_id': poll.id,
        'option_id': option.id,
        'registration_id': rid,
      });
      _myVotes[poll.id] = option.id;
      // Reflect updated counts if the route returned them.
      if (res is Map && res['options'] is List) {
        final counts = <String, int>{};
        for (final o in (res['options'] as List).whereType<Map>()) {
          counts[asString(o['id'])] = asInt(o['votes_count']);
        }
        for (final o in poll.options) {
          if (counts.containsKey(o.id)) o.votes = counts[o.id]!;
        }
      } else {
        option.votes += 1;
      }
      if (mounted) setState(() {});
    } catch (e) {
      if (mounted) {
        showEngageSnack(context,
            e is ApiException ? e.message : 'Could not record your vote',
            error: true);
      }
    } finally {
      if (mounted) setState(() => _busy.remove(poll.id));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Polls'),
        backgroundColor: Brand.cream,
        surfaceTintColor: Colors.transparent,
      ),
      body: _body(),
    );
  }

  Widget _body() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator(color: Brand.forest));
    }
    if (_error != null) {
      return EngageState(
        icon: Icons.error_outline,
        title: 'Couldn\'t load polls',
        subtitle: _error,
        action: FilledButton(onPressed: _load, child: const Text('Retry')),
      );
    }
    return RefreshIndicator(
      color: Brand.forest,
      onRefresh: _load,
      child: _polls.isEmpty
          ? ListView(children: [
              SizedBox(height: MediaQuery.of(context).size.height * 0.25),
              const EngageState(
                icon: Icons.bar_chart_outlined,
                title: 'No polls yet',
                subtitle: 'When the organizer opens a poll, it appears here.',
              ),
            ])
          : ListView.builder(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
              itemCount: _polls.length,
              itemBuilder: (_, i) => _pollCard(_polls[i]),
            ),
    );
  }

  Widget _pollCard(_Poll poll) {
    final votedOption = _myVotes[poll.id];
    final showResults = votedOption != null || poll.isClosed;
    final total = poll.totalVotes;
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: engageCard(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  poll.question,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: Brand.ink,
                  ),
                ),
              ),
              if (poll.isClosed)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: Brand.muted.withValues(alpha: 0.14),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Text('Closed',
                      style: TextStyle(fontSize: 11, color: Brand.muted)),
                ),
            ],
          ),
          const SizedBox(height: 12),
          ...poll.options.map((o) => _optionRow(poll, o, showResults, total)),
          const SizedBox(height: 4),
          Text(
            total == 1 ? '1 vote' : '$total votes',
            style: const TextStyle(fontSize: 12, color: Brand.muted),
          ),
        ],
      ),
    );
  }

  Widget _optionRow(_Poll poll, _Option o, bool showResults, int total) {
    final pct = total == 0 ? 0.0 : o.votes / total;
    final isMine = _myVotes[poll.id] == o.id;
    final busy = _busy.contains(poll.id);
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        borderRadius: BorderRadius.circular(10),
        onTap: showResults || busy ? null : () => _vote(poll, o),
        child: Stack(
          children: [
            // Bar background
            Container(
              height: 46,
              decoration: BoxDecoration(
                color: Brand.cream,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                    color: isMine ? Brand.forest : Brand.border,
                    width: isMine ? 1.5 : 1),
              ),
            ),
            // Fill
            if (showResults)
              FractionallySizedBox(
                widthFactor: pct.clamp(0.0, 1.0),
                child: Container(
                  height: 46,
                  decoration: BoxDecoration(
                    color: (isMine ? Brand.forest : Brand.forest)
                        .withValues(alpha: isMine ? 0.22 : 0.10),
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
            // Label
            Positioned.fill(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 14),
                child: Row(
                  children: [
                    if (isMine)
                      const Padding(
                        padding: EdgeInsets.only(right: 6),
                        child: Icon(Icons.check_circle,
                            size: 18, color: Brand.forest),
                      ),
                    Expanded(
                      child: Text(
                        o.text,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight:
                              isMine ? FontWeight.w700 : FontWeight.w500,
                          color: Brand.ink,
                        ),
                      ),
                    ),
                    if (showResults)
                      Text(
                        '${(pct * 100).round()}%',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: Brand.inkSoft,
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
