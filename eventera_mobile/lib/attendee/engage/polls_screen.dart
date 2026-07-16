import 'dart:async';

import 'package:flutter/material.dart';

import '../../net.dart';
import '../../ui/components.dart';
import '../../ui/tokens.dart';
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
  String? _rid;
  Timer? _refreshTimer;

  @override
  void initState() {
    super.initState();
    _rid = widget.registrationId;
    _resolveRegThenLoad();
    // Live results while a session is active — mirrors the web PollsClient's
    // 10s poll-results refresh so mobile attendees see other votes land too,
    // not just their own.
    _refreshTimer =
        Timer.periodic(const Duration(seconds: 10), (_) => _silentRefresh());
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  Future<void> _resolveRegThenLoad() async {
    _rid = await effectiveRegId(widget.registrationId, widget.eventId);
    if (!mounted) return;
    _load();
  }

  /// Re-fetches vote counts in place, without the full-screen loading state
  /// or disturbing an in-flight vote — a background tick, not a user action.
  Future<void> _silentRefresh() async {
    if (!mounted || _loading || _busy.isNotEmpty) return;
    try {
      final rows = await supa
          .from('polls')
          .select('id, poll_options(id, votes_count)')
          .eq('event_id', widget.eventId);
      final counts = <String, Map<String, int>>{};
      for (final r in (rows as List).whereType<Map>()) {
        final map = Map<String, dynamic>.from(r);
        final pollId = asString(map['id']);
        final byOption = <String, int>{};
        for (final o in asMapList(map['poll_options'])) {
          byOption[asString(o['id'])] = asInt(o['votes_count']);
        }
        counts[pollId] = byOption;
      }
      if (!mounted) return;
      setState(() {
        for (final poll in _polls) {
          final byOption = counts[poll.id];
          if (byOption == null) continue;
          for (final o in poll.options) {
            if (byOption.containsKey(o.id)) o.votes = byOption[o.id]!;
          }
        }
      });
    } catch (_) {
      // Silent by design — a missed background refresh isn't worth surfacing.
    }
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
        // Attendees only see polls the organizer has opened (active) or
        // resolved (closed). Pure drafts stay hidden.
        final isActive = asBool(map['is_active']);
        final isClosed = asBool(map['is_closed']);
        if (!isActive && !isClosed) continue;
        final opts = asMapList(map['poll_options'])
          ..sort((a, b) => asInt(a['position']).compareTo(asInt(b['position'])));
        polls.add(_Poll(
          id: asString(map['id']),
          question: asString(map['question'], 'Poll'),
          isClosed: isClosed,
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
      final rid = _rid;
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
    final rid = _rid;
    if (rid == null) {
      showEngageSnack(context, 'Register for this event to vote', error: true);
      return;
    }
    if (poll.isClosed || _myVotes.containsKey(poll.id) || _busy.contains(poll.id)) {
      return;
    }
    // Optimistic: record the vote and bump the count immediately, remembering
    // the prior state so we can roll back if the server rejects it.
    final prevVote = _myVotes[poll.id];
    final prevVotes = option.votes;
    setState(() {
      _busy.add(poll.id);
      _myVotes[poll.id] = option.id;
      option.votes = prevVotes + 1;
    });
    try {
      final res = await apiPut('/api/events/${widget.eventId}/polls', {
        'poll_id': poll.id,
        'option_id': option.id,
        'registration_id': rid,
      });
      // Reconcile with authoritative counts if the route returned them.
      if (res is Map && res['options'] is List) {
        final counts = <String, int>{};
        for (final o in (res['options'] as List).whereType<Map>()) {
          counts[asString(o['id'])] = asInt(o['votes_count']);
        }
        for (final o in poll.options) {
          if (counts.containsKey(o.id)) o.votes = counts[o.id]!;
        }
      }
      if (!mounted) return;
      showToast(context, 'Your vote was counted');
      setState(() {});
    } catch (e) {
      if (mounted) {
        // Roll the optimistic vote back.
        setState(() {
          if (prevVote == null) {
            _myVotes.remove(poll.id);
          } else {
            _myVotes[poll.id] = prevVote;
          }
          option.votes = prevVotes;
        });
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
    return MScaffold(
      appBar: const MAppBar(title: 'Polls', hairline: true),
      body: _body(),
    );
  }

  Widget _body() {
    if (_loading) return const LoadingState();
    if (_error != null) {
      return ErrorStateView(message: _error!, onRetry: _load);
    }
    return RefreshIndicator(
      color: AppColors.forest,
      onRefresh: _load,
      child: _polls.isEmpty
          ? ListView(children: [
              SizedBox(height: MediaQuery.of(context).size.height * 0.22),
              const EngageState(
                icon: Icons.bar_chart_outlined,
                title: 'No polls yet',
                subtitle: 'When the organizer opens a poll, it appears here.',
              ),
            ])
          : ListView.builder(
              padding: const EdgeInsets.fromLTRB(
                  AppSpace.lg, AppSpace.base, AppSpace.lg, AppSpace.xxxl),
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
      margin: const EdgeInsets.only(bottom: AppSpace.base),
      padding: const EdgeInsets.all(AppSpace.base),
      decoration: engageCard(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              if (poll.isClosed)
                _StatusPill(label: 'Closed', muted: true)
              else
                const Tag('Live now', kind: TagKind.danger, dot: true),
              const Spacer(),
              Text(
                votedOption != null
                    ? 'You voted'
                    : (total == 1 ? '1 vote' : '$total votes'),
                style: AppText.numSm.copyWith(
                    fontSize: 11, color: AppColors.inkMuted),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Text(poll.question, style: AppText.h3.copyWith(fontSize: 16)),
          const SizedBox(height: 14),
          if (showResults)
            for (int i = 0; i < poll.options.length; i++) ...[
              _resultBar(poll, poll.options[i], total, i),
              if (i != poll.options.length - 1) const SizedBox(height: 12),
            ]
          else
            for (int i = 0; i < poll.options.length; i++) ...[
              _voteButton(poll, poll.options[i]),
              if (i != poll.options.length - 1) const SizedBox(height: 9),
            ],
        ],
      ),
    );
  }

  Widget _voteButton(_Poll poll, _Option o) {
    final busy = _busy.contains(poll.id);
    return GestureDetector(
      onTap: busy ? null : () => _vote(poll, o),
      child: Container(
        height: 52,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        alignment: Alignment.centerLeft,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.btn),
          border: Border.all(color: AppColors.border),
          boxShadow: AppShadow.soft,
        ),
        child: Text(o.text,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: AppText.btn.copyWith(color: AppColors.ink)),
      ),
    );
  }

  Widget _resultBar(_Poll poll, _Option o, int total, int index) {
    final pct = total == 0 ? 0.0 : o.votes / total;
    final isMine = _myVotes[poll.id] == o.id;
    // "mine" fills forest; others alternate to gold (matches screen 24).
    final fill = isMine ? AppColors.forest : AppColors.gold;
    final labelColor = isMine ? AppColors.forest : AppColors.inkSoft;
    final pctColor = isMine ? AppColors.forest : AppColors.inkMuted;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            if (isMine) ...[
              const Icon(Icons.check, size: 14, color: AppColors.forest),
              const SizedBox(width: 6),
            ],
            Expanded(
              child: Text(o.text,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.bodySm.copyWith(
                      fontWeight: isMine ? FontWeight.w600 : FontWeight.w400,
                      color: labelColor)),
            ),
            const SizedBox(width: 8),
            Text('${(pct * 100).round()}%',
                style: AppText.numSm.copyWith(color: pctColor)),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(999),
          child: Container(
            height: 9,
            color: AppColors.creamSoft,
            child: FractionallySizedBox(
              alignment: Alignment.centerLeft,
              widthFactor: pct.clamp(0.0, 1.0),
              child: Container(color: fill),
            ),
          ),
        ),
      ],
    );
  }
}

class _StatusPill extends StatelessWidget {
  final String label;
  final bool muted;
  const _StatusPill({required this.label, this.muted = false});
  @override
  Widget build(BuildContext context) {
    return Container(
      height: 24,
      padding: const EdgeInsets.symmetric(horizontal: 10),
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: AppColors.creamSoft,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(label,
          style: AppText.caption.copyWith(
              fontSize: 11.5,
              letterSpacing: 0.1,
              fontWeight: FontWeight.w600,
              color: AppColors.inkSoft)),
    );
  }
}
