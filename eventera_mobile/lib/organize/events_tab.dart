import 'package:flutter/material.dart';

import '../eventera_api.dart';
import '../models.dart';
import '../screens/organizer/create_event_screen.dart';
import '../screens/organizer/event_detail_screen.dart';
import '../ui/components.dart';
import '../ui/tokens.dart';
import 'event_counts.dart';
import 'org_widgets.dart';

/// Organize · Events (O01) — "My events" with cover art, status pills and
/// live registered / checked-in / rate strips per card.
class OrganizerEventsTab extends StatefulWidget {
  const OrganizerEventsTab({super.key});

  @override
  State<OrganizerEventsTab> createState() => _OrganizerEventsTabState();
}

enum _Filter { upcoming, past, drafts }

class _OrganizerEventsTabState extends State<OrganizerEventsTab> {
  final _api = EventeraApi();
  List<OrganizerEvent>? _events;
  Map<String, EventCounts?> _counts = const {};
  bool _loading = true;
  bool _error = false;
  _Filter _filter = _Filter.upcoming;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final events = await _api.myEvents();
      // Show cards immediately; the count strips fill in as they arrive.
      if (mounted) {
        setState(() {
          _events = events;
          _loading = false;
          _error = false;
        });
      }
      final counts = await loadEventCounts([for (final e in events) e.id]);
      if (mounted) setState(() => _counts = counts);
    } catch (_) {
      if (mounted) {
        setState(() {
          _loading = false;
          _error = true;
        });
      }
    }
  }

  Future<void> _create() async {
    final created = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => const CreateEventScreen()),
    );
    if (created == true) _load();
  }

  Future<void> _open(OrganizerEvent e) async {
    final changed = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
          builder: (_) => EventDetailScreen(eventId: e.id, initialName: e.name)),
    );
    if (changed == true) _load();
  }

  List<OrganizerEvent> get _filtered {
    final all = _events ?? const [];
    switch (_filter) {
      case _Filter.upcoming:
        return all
            .where((e) =>
                e.isPublished && ((e.daysUntil ?? 0) >= 0 || e.isToday))
            .toList();
      case _Filter.past:
        return all
            .where((e) =>
                (e.isPublished && (e.daysUntil ?? 0) < 0 && !e.isToday) ||
                e.status == 'archived')
            .toList();
      case _Filter.drafts:
        return all.where((e) => e.status == 'draft').toList();
    }
  }

  @override
  Widget build(BuildContext context) {
    final topInset = MediaQuery.of(context).padding.top;
    return Scaffold(
      backgroundColor: AppColors.canvas,
      body: Column(children: [
        // O01 app bar: 22px bold title + round forest "+" action.
        Container(
          padding: EdgeInsets.only(top: topInset, left: 20, right: 14),
          color: AppColors.canvas,
          child: SizedBox(
            height: 58,
            child: Row(children: [
              Text('My events',
                  style: AppText.h2.copyWith(fontSize: 22)),
              const Spacer(),
              GestureDetector(
                onTap: _create,
                child: Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                      color: AppColors.forest, shape: BoxShape.circle),
                  child: const Icon(Icons.add, color: Colors.white, size: 20),
                ),
              ),
            ]),
          ),
        ),
        Expanded(
          child: RefreshIndicator(
            color: AppColors.forest,
            onRefresh: _load,
            child: _body(),
          ),
        ),
      ]),
    );
  }

  Widget _body() {
    if (_loading) {
      // O01b skeleton state.
      return ListView(
        physics: const NeverScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
        children: [
          Row(children: const [
            Skeleton(width: 110, height: 32, radius: 999),
            SizedBox(width: 8),
            Skeleton(width: 70, height: 32, radius: 999),
            SizedBox(width: 8),
            Skeleton(width: 70, height: 32, radius: 999),
          ]),
          const SizedBox(height: 16),
          const EventCardSkeleton(),
          const SizedBox(height: 14),
          const EventCardSkeleton(short: true),
        ],
      );
    }

    if (_error) {
      return ListView(children: [
        const SizedBox(height: 80),
        ErrorStateView(
          message: "We couldn't load your events right now. "
              'Check your connection and try again.',
          onRetry: () {
            setState(() => _loading = true);
            _load();
          },
        ),
      ]);
    }

    final all = _events ?? const [];
    if (all.isEmpty) {
      return ListView(children: [
        const SizedBox(height: 60),
        EmptyState(
          icon: Icons.event_note_outlined,
          title: 'No events yet — and that\'s okay',
          message:
              'This is where your events will live. Create your first one and '
              'start collecting registrations.',
          ctaLabel: 'Create your first event',
          onCta: _create,
        ),
      ]);
    }

    final visible = _filtered;
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
      children: [
        // Filter chips: Live & upcoming · Past · Drafts.
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(children: [
            MChip('Live & upcoming',
                selected: _filter == _Filter.upcoming,
                onTap: () => setState(() => _filter = _Filter.upcoming)),
            const SizedBox(width: 8),
            MChip('Past',
                selected: _filter == _Filter.past,
                onTap: () => setState(() => _filter = _Filter.past)),
            const SizedBox(width: 8),
            MChip('Drafts',
                selected: _filter == _Filter.drafts,
                onTap: () => setState(() => _filter = _Filter.drafts)),
          ]),
        ),
        const SizedBox(height: 16),
        if (visible.isEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 40),
            child: EmptyState(
              icon: Icons.event_note_outlined,
              title: switch (_filter) {
                _Filter.upcoming => 'Nothing live or upcoming',
                _Filter.past => 'No past events yet',
                _Filter.drafts => 'No drafts',
              },
              message: switch (_filter) {
                _Filter.upcoming =>
                  'Events you publish will show up here with live check-in numbers.',
                _Filter.past =>
                  'Once an event wraps up, it moves here with its final numbers.',
                _Filter.drafts =>
                  'Events you\'re still working on will wait here until you publish.',
              },
            ),
          )
        else
          for (final e in visible) ...[
            _eventCard(e),
            const SizedBox(height: 14),
          ],
      ],
    );
  }

  // O01 event card (.oev): cover + pill / name / when / stat strip.
  Widget _eventCard(OrganizerEvent e) {
    final counts = _counts[e.id];
    return GestureDetector(
      onTap: () => _open(e),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.card),
          border: Border.all(color: AppColors.border),
          boxShadow: AppShadow.soft,
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Stack(children: [
            EventCover(e),
            Positioned(top: 10, right: 10, child: CoverStatusPill(e)),
          ]),
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 13, 14, 13),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(e.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.h3.copyWith(fontSize: 16)),
                const SizedBox(height: 5),
                Text(_whenLine(e),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.caption.copyWith(
                        fontSize: 11,
                        letterSpacing: 0.3,
                        color: AppColors.inkMuted)),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.only(top: 11),
                  decoration: const BoxDecoration(
                    border: Border(top: BorderSide(color: AppColors.border)),
                  ),
                  child: IntrinsicHeight(
                    child: Row(children: [
                      _cardStat(
                          counts == null ? '—' : '${counts.registered}',
                          'Registered'),
                      _statDivider(),
                      _cardStat(
                          counts == null ? '—' : '${counts.checkedIn}',
                          'Checked in',
                          gold: true),
                      _statDivider(),
                      _cardStat(
                          counts == null
                              ? '—'
                              : (counts.registered == 0
                                  ? '—'
                                  : '${counts.rate}%'),
                          'Rate'),
                    ]),
                  ),
                ),
              ],
            ),
          ),
        ]),
      ),
    );
  }

  Widget _cardStat(String n, String label, {bool gold = false}) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(n,
              style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  letterSpacing: -0.2,
                  color: gold ? AppColors.goldHover : AppColors.forest)),
          const SizedBox(height: 2),
          Text(label,
              style: AppText.caption
                  .copyWith(fontSize: 10.5, color: AppColors.inkMuted)),
        ],
      ),
    );
  }

  Widget _statDivider() => Container(
      width: 1,
      margin: const EdgeInsets.only(right: 14),
      color: AppColors.border);

  static const _months = [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
  ];

  String _whenLine(OrganizerEvent e) {
    final s = e.startsAt;
    final parts = <String>[
      if (s != null) '${s.day.toString().padLeft(2, '0')} ${_months[s.month - 1]}',
      if (e.location != null) e.location!,
    ];
    if (parts.isEmpty) return e.isPublished ? 'Published' : 'Not scheduled yet';
    return parts.join(' · ').toUpperCase();
  }
}
