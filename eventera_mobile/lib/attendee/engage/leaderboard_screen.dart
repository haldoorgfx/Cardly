import 'package:flutter/material.dart';

import '../../net.dart';
import '../../theme.dart';
import '_shared.dart';

/// LeaderboardScreen — ranked attendees by engagement points.
///
/// Contract verified:
///  - GET /api/events/[id]/leaderboard
///    → { leaderboard: [{ rank, registration_id, attendee_name, total_points }] }.
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
  _Entry({required this.rank, required this.name, required this.points});
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
      final list = (res is Map) ? asMapList(res['leaderboard']) : <Map<String, dynamic>>[];
      final entries = list
          .map((e) => _Entry(
                rank: asInt(e['rank']),
                name: asString(e['attendee_name'], 'Attendee'),
                points: asInt(e['total_points']),
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
    return Scaffold(
      appBar: AppBar(
        title: const Text('Leaderboard'),
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
        title: 'Couldn\'t load the leaderboard',
        subtitle: _error,
        action: FilledButton(onPressed: _load, child: const Text('Retry')),
      );
    }
    return RefreshIndicator(
      color: Brand.forest,
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
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
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
    // order for display: 2nd, 1st, 3rd
    final second = top3.length > 1 ? top3[1] : null;
    final first = top3[0];
    final third = top3.length > 2 ? top3[2] : null;
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 12),
      decoration: BoxDecoration(
        color: Brand.forest,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(child: _podiumSpot(second, 2, 92)),
          Expanded(child: _podiumSpot(first, 1, 118)),
          Expanded(child: _podiumSpot(third, 3, 76)),
        ],
      ),
    );
  }

  Widget _podiumSpot(_Entry? e, int place, double height) {
    if (e == null) return const SizedBox.shrink();
    final medal = place == 1
        ? Brand.gold
        : place == 2
            ? const Color(0xFFC9C3B1)
            : const Color(0xFFC9A45E);
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        CircleAvatar(
          radius: place == 1 ? 30 : 24,
          backgroundColor: medal,
          child: Text(
            _initials(e.name),
            style: TextStyle(
              color: Brand.forestDark,
              fontWeight: FontWeight.w700,
              fontSize: place == 1 ? 18 : 15,
            ),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          e.name,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          textAlign: TextAlign.center,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w600,
            fontSize: 13,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          '${e.points} pts',
          style: TextStyle(color: medal, fontSize: 12, fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 8),
        Container(
          height: height,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.10),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(8)),
          ),
          alignment: Alignment.topCenter,
          padding: const EdgeInsets.only(top: 8),
          child: Text(
            '$place',
            style: TextStyle(
              color: medal,
              fontWeight: FontWeight.w800,
              fontSize: 22,
            ),
          ),
        ),
      ],
    );
  }

  Widget _row(_Entry e) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: engageCard(),
      child: Row(
        children: [
          SizedBox(
            width: 30,
            child: Text(
              '${e.rank}',
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: Brand.muted,
              ),
            ),
          ),
          CircleAvatar(
            radius: 18,
            backgroundColor: Brand.forest.withValues(alpha: 0.12),
            child: Text(
              _initials(e.name),
              style: const TextStyle(
                color: Brand.forest,
                fontWeight: FontWeight.w700,
                fontSize: 13,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              e.name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: Brand.ink,
              ),
            ),
          ),
          Text(
            '${e.points} pts',
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: Brand.forest,
            ),
          ),
        ],
      ),
    );
  }

  String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts[0].substring(0, 1).toUpperCase();
    return (parts[0].substring(0, 1) + parts[1].substring(0, 1)).toUpperCase();
  }
}
