import 'package:flutter/material.dart';

import '../../net.dart';
import '../../ui/components.dart';
import '../../ui/tokens.dart';
import '_shared.dart';

/// LeaderboardScreen — ranked attendees by engagement points.
///
/// Contract verified:
///  - GET /api/events/[id]/leaderboard
///    → { leaderboard: [{ rank, registration_id, attendee_name, total_points }] }.
/// If a row carries an `is_you` / `is_current` flag it is highlighted as "You";
/// this is optional and ignored when absent, so the contract is unchanged.
class LeaderboardScreen extends StatefulWidget {
  final String eventId;
  const LeaderboardScreen({super.key, required this.eventId});

  @override
  State<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _Entry {
  final int rank;
  final String name;
  final int points;
  final bool isYou;
  _Entry(
      {required this.rank,
      required this.name,
      required this.points,
      this.isYou = false});
}

class _LeaderboardScreenState extends State<LeaderboardScreen> {
  bool _loading = true;
  String? _error;
  List<_Entry> _entries = [];

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
      final res = await apiGet('/api/events/${widget.eventId}/leaderboard');
      final list =
          (res is Map) ? asMapList(res['leaderboard']) : <Map<String, dynamic>>[];
      final entries = list
          .map((e) => _Entry(
                rank: asInt(e['rank']),
                name: asString(e['attendee_name'], 'Attendee'),
                points: asInt(e['total_points']),
                isYou: asBool(e['is_you']) || asBool(e['is_current']),
              ))
          .toList();
      if (!mounted) return;
      setState(() {
        _entries = entries;
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

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: const MAppBar(title: 'Leaderboard', hairline: true),
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
      child: _entries.isEmpty
          ? ListView(children: [
              SizedBox(height: MediaQuery.of(context).size.height * 0.22),
              const EngageState(
                icon: Icons.leaderboard_outlined,
                title: 'No points yet',
                subtitle:
                    'Vote in polls, ask questions and connect to climb the board.',
              ),
            ])
          : ListView(
              padding: const EdgeInsets.fromLTRB(
                  AppSpace.lg, AppSpace.base, AppSpace.lg, AppSpace.xxxl),
              children: [
                if (_entries.length >= 3) _podium(),
                ..._entries
                    .where((e) => _entries.length < 3 || e.rank > 3)
                    .map(_row),
              ],
            ),
    );
  }

  Widget _podium() {
    final top3 = _entries.take(3).toList();
    final second = top3.length > 1 ? top3[1] : null;
    final first = top3[0];
    final third = top3.length > 2 ? top3[2] : null;
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpace.xl),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(child: _podiumSpot(second, 2, 38)),
          const SizedBox(width: 14),
          Expanded(child: _podiumSpot(first, 1, 56)),
          const SizedBox(width: 14),
          Expanded(child: _podiumSpot(third, 3, 28)),
        ],
      ),
    );
  }

  Widget _podiumSpot(_Entry? e, int place, double plinth) {
    if (e == null) return const SizedBox.shrink();
    final isFirst = place == 1;
    final plinthColor = isFirst ? AppColors.forestSoft : AppColors.creamSoft;
    final plinthText = isFirst ? AppColors.forest : AppColors.inkMuted;
    final pointsColor = isFirst ? AppColors.forest : AppColors.inkMuted;
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (isFirst)
          const Padding(
            padding: EdgeInsets.only(bottom: 2),
            child: Icon(Icons.emoji_events, size: 22, color: AppColors.gold),
          ),
        Container(
          padding: EdgeInsets.all(isFirst ? 3 : 0),
          decoration: isFirst
              ? const BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.fromBorderSide(
                      BorderSide(color: AppColors.gold, width: 3)))
              : null,
          child: Avatar(name: e.name, size: isFirst ? 60 : 48),
        ),
        const SizedBox(height: 7),
        Text(e.name.split(' ').first,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: AppText.h3.copyWith(fontSize: isFirst ? 13 : 12)),
        Text('${e.points}',
            style: AppText.numSm.copyWith(fontSize: 11, color: pointsColor)),
        const SizedBox(height: 6),
        Container(
          height: plinth,
          width: isFirst ? 60 : 56,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: plinthColor,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(8)),
          ),
          child: Text('$place',
              style: AppText.h2.copyWith(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: plinthText)),
        ),
      ],
    );
  }

  Widget _row(_Entry e) {
    final you = e.isYou;
    return Container(
      margin: const EdgeInsets.only(bottom: 2),
      padding: const EdgeInsets.symmetric(
          horizontal: AppSpace.md, vertical: AppSpace.md),
      decoration: BoxDecoration(
        color: you ? AppColors.forestSoft : Colors.transparent,
        borderRadius: BorderRadius.circular(AppRadius.btn),
        border: you
            ? null
            : const Border(bottom: BorderSide(color: AppColors.border)),
      ),
      child: Row(
        children: [
          SizedBox(
            width: 24,
            child: Text('${e.rank}',
                style: AppText.numSm.copyWith(
                    color: you ? AppColors.forest : AppColors.inkMuted)),
          ),
          const SizedBox(width: 8),
          Avatar(name: e.name, size: 40),
          const SizedBox(width: 12),
          Expanded(
            child: Text(you ? 'You' : e.name,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppText.h3.copyWith(
                    fontSize: 14,
                    fontWeight: you ? FontWeight.w700 : FontWeight.w600,
                    color: you ? AppColors.forest : AppColors.ink)),
          ),
          Text('${e.points}',
              style: AppText.numSm.copyWith(
                  color: you ? AppColors.forest : AppColors.inkSoft)),
        ],
      ),
    );
  }
}
