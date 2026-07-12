import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../eventera_api.dart';
import '../models.dart';
import '../net.dart';
import '../ui/components.dart';
import '../ui/tokens.dart';
import 'org_widgets.dart';

/// Organize · Stats (O10) — live check-in dashboard for one event: registered
/// / checked-in cards, the check-in-rate ring, check-ins over time, and the
/// most recent scans. Auto-refreshes via a realtime subscription.
class OrganizerStatsTab extends StatefulWidget {
  const OrganizerStatsTab({super.key});

  @override
  State<OrganizerStatsTab> createState() => _OrganizerStatsTabState();
}

class _Entry {
  final String id, name;
  final bool checkedIn;
  final DateTime? checkedInAt;
  _Entry(this.id, this.name, this.checkedIn, this.checkedInAt);
}

class _OrganizerStatsTabState extends State<OrganizerStatsTab> {
  List<OrganizerEvent>? _events;
  String? _selectedId;
  List<_Entry> _entries = [];
  bool _loadingEvents = true;
  bool _loadingList = false;
  bool _error = false;
  bool _listError = false;
  RealtimeChannel? _channel;

  @override
  void initState() {
    super.initState();
    _loadEvents();
  }

  @override
  void dispose() {
    final c = _channel;
    if (c != null) supa.removeChannel(c);
    super.dispose();
  }

  Future<void> _loadEvents() async {
    try {
      final events = await EventeraApi().myEvents();
      OrganizerEvent? pick;
      for (final e in events) {
        if (e.isToday && e.isPublished) { pick = e; break; }
      }
      pick ??=
          events.where((e) => e.isPublished).firstOrNull ?? events.firstOrNull;
      if (mounted) {
        setState(() {
          _events = events;
          _selectedId = pick?.id;
          _loadingEvents = false;
          _error = false;
        });
      }
      if (pick != null) {
        _loadList(pick.id);
        _subscribe(pick.id);
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _loadingEvents = false;
          _error = true;
        });
      }
    }
  }

  void _subscribe(String eventId) {
    final old = _channel;
    if (old != null) supa.removeChannel(old);
    _channel = supa
        .channel('stats:$eventId')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'registrations',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'event_id',
            value: eventId,
          ),
          callback: (_) => _loadList(eventId),
        )
        .subscribe();
  }

  Future<void> _loadList(String eventId) async {
    if (_entries.isEmpty) {
      setState(() {
        _loadingList = true;
        _listError = false;
      });
    }
    try {
      final rows =
          await supa.rpc('list_event_attendees', params: {'p_event_id': eventId});
      final list = (rows as List).map((r) {
        final m = Map<String, dynamic>.from(r as Map);
        return _Entry(
          asString(m['id']),
          asString(m['attendee_name'], 'Guest'),
          asBool(m['checked_in']),
          asDate(m['checked_in_at']),
        );
      }).toList();
      if (mounted && _selectedId == eventId) {
        setState(() {
          _entries = list;
          _loadingList = false;
          _listError = false;
        });
      }
    } catch (_) {
      // Never show zeros pretending to be real numbers — flag the failure.
      if (mounted && _selectedId == eventId) {
        setState(() {
          _loadingList = false;
          if (_entries.isEmpty) _listError = true;
        });
      }
    }
  }

  Future<void> _refresh() async {
    final id = _selectedId;
    if (id != null) await _loadList(id);
  }

  void _select(OrganizerEvent e) {
    if (_selectedId == e.id) return;
    setState(() {
      _selectedId = e.id;
      _entries = [];
    });
    _loadList(e.id);
    _subscribe(e.id);
  }

  OrganizerEvent? get _selected {
    final id = _selectedId;
    if (id == null) return null;
    for (final e in _events ?? const <OrganizerEvent>[]) {
      if (e.id == id) return e;
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final live = _selected?.isToday == true;
    return MScaffold(
      appBar: MAppBar(
        title: 'Live stats',
        showBack: false,
        hairline: true,
        actions: [
          if (live)
            const Padding(
                padding: EdgeInsets.only(right: 12), child: LivePulse()),
        ],
      ),
      body: RefreshIndicator(
        color: AppColors.forest,
        onRefresh: _refresh,
        child: _body(),
      ),
    );
  }

  Widget _body() {
    if (_loadingEvents) return const LoadingState();

    if (_error) {
      return ListView(children: [
        const SizedBox(height: 80),
        ErrorStateView(
          message: "We couldn't load your stats right now. "
              'Check your connection and try again.',
          onRetry: () {
            setState(() {
              _loadingEvents = true;
              _error = false;
            });
            _loadEvents();
          },
        ),
      ]);
    }

    final events = _events ?? const [];
    if (events.isEmpty) {
      return ListView(children: const [
        SizedBox(height: 60),
        EmptyState(
          icon: Icons.bar_chart_outlined,
          title: 'Your numbers start here',
          message: 'Registrations, check-ins and the live rate will appear '
              'as soon as your first event is up.',
        ),
      ]);
    }

    final registered = _entries.length;
    final checked = _entries.where((e) => e.checkedIn).length;
    final rate = registered == 0 ? 0 : ((checked / registered) * 100).round();

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
      children: [
        if (events.length > 1) ...[
          SizedBox(
            height: 34,
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: [
                for (final e in events) ...[
                  MChip(e.name,
                      selected: e.id == _selectedId, onTap: () => _select(e)),
                  const SizedBox(width: 8),
                ],
              ],
            ),
          ),
          const SizedBox(height: 14),
        ],
        if (_loadingList)
          const Padding(
              padding: EdgeInsets.only(top: 80), child: LoadingState())
        else if (_listError)
          Padding(
            padding: const EdgeInsets.only(top: 40),
            child: ErrorStateView(
              message: "We couldn't load the numbers for this event. "
                  'Check your connection and try again.',
              onRetry: () {
                final id = _selectedId;
                if (id != null) _loadList(id);
              },
            ),
          )
        else ...[
          // Two stat cards.
          Row(children: [
            Expanded(child: _statCard('Registered', '$registered')),
            const SizedBox(width: 10),
            Expanded(
                child: _statCard('Checked in', '$checked', gold: true)),
          ]),
          const SizedBox(height: 12),
          // Check-in rate ring.
          MCard(
            child: Center(
              child: SizedBox(
                width: 120,
                height: 120,
                child: Stack(fit: StackFit.expand, children: [
                  CustomPaint(
                      painter: _RingPainter(
                          registered == 0 ? 0 : checked / registered)),
                  Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('$rate%',
                          style: const TextStyle(
                              fontSize: 26,
                              fontWeight: FontWeight.w600,
                              color: AppColors.forest,
                              letterSpacing: -0.3)),
                      Text('Check-in rate',
                          style: AppText.caption.copyWith(
                              fontSize: 10, color: AppColors.inkMuted)),
                    ],
                  ),
                ]),
              ),
            ),
          ),
          const SizedBox(height: 12),
          // Check-ins over time.
          _chartCard(),
          const SizedBox(height: 20),
          if (registered == 0)
            const EmptyState(
              icon: Icons.schedule,
              title: 'Nothing to count yet',
              message: 'The moment people start registering and checking in, '
                  'this dashboard comes alive.',
            )
          else ...[
            const SectionLabel('Recent check-ins'),
            const SizedBox(height: 6),
            ..._recentRows(),
          ],
        ],
      ],
    );
  }

  Widget _statCard(String label, String value, {bool gold = false}) {
    return MCard(
      padding: const EdgeInsets.all(14),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label,
            style: AppText.caption
                .copyWith(fontSize: 11, color: AppColors.inkMuted)),
        const SizedBox(height: 6),
        Text(value,
            style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w600,
                letterSpacing: -0.3,
                color: gold ? AppColors.goldHover : AppColors.forest)),
      ]),
    );
  }

  // "Check-ins over time" — hourly buckets from actual checked_in_at stamps.
  Widget _chartCard() {
    final times = _entries
        .where((e) => e.checkedIn && e.checkedInAt != null)
        .map((e) => e.checkedInAt!.toLocal())
        .toList();

    if (times.isEmpty) {
      return MCard(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const SectionLabel('Check-ins over time'),
          const SizedBox(height: 12),
          Text('The timeline draws itself as people arrive.',
              style: AppText.bodySm.copyWith(color: AppColors.inkMuted)),
        ]),
      );
    }

    times.sort();
    final firstHour = times.first.hour;
    final lastHour = times.last.hour;
    // At least 4 buckets so a quiet event still reads as a chart.
    final span = math.max(3, lastHour - firstHour) + 1;
    final buckets = List<int>.filled(span, 0);
    for (final t in times) {
      final i = (t.hour - firstHour).clamp(0, span - 1);
      buckets[i]++;
    }
    final peak = buckets.reduce(math.max);
    final peakIndex = buckets.indexOf(peak);

    return MCard(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          const Expanded(child: SectionLabel('Check-ins over time')),
          Text(
              '${firstHour.toString().padLeft(2, '0')}:00–${(lastHour + 1).toString().padLeft(2, '0')}:00',
              style: AppText.caption
                  .copyWith(fontSize: 11, color: AppColors.forest)),
        ]),
        const SizedBox(height: 8),
        SizedBox(
          height: 96,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              for (var i = 0; i < buckets.length; i++) ...[
                if (i > 0) const SizedBox(width: 6),
                Expanded(
                  child: Container(
                    height: peak == 0 ? 4 : math.max(4, 96 * buckets[i] / peak),
                    decoration: BoxDecoration(
                      gradient: i == peakIndex
                          ? const LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [AppColors.gold, AppColors.goldHover])
                          : const LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [Color(0xFF2A6A50), AppColors.forest]),
                      borderRadius: const BorderRadius.vertical(
                          top: Radius.circular(4)),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 7),
        Row(children: [
          for (var i = 0; i < buckets.length; i++) ...[
            if (i > 0) const SizedBox(width: 6),
            Expanded(
              child: Text('${(firstHour + i) % 24}',
                  textAlign: TextAlign.center,
                  style: AppText.caption
                      .copyWith(fontSize: 9, color: AppColors.inkMuted)),
            ),
          ],
        ]),
      ]),
    );
  }

  List<Widget> _recentRows() {
    final recent = _entries
        .where((e) => e.checkedIn && e.checkedInAt != null)
        .toList()
      ..sort((a, b) => b.checkedInAt!.compareTo(a.checkedInAt!));
    if (recent.isEmpty) {
      return [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 10),
          child: Text('No check-ins yet — they\'ll stream in here live.',
              style: AppText.bodySm.copyWith(color: AppColors.inkMuted)),
        ),
      ];
    }
    return [
      for (final e in recent.take(6))
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Row(children: [
            SizedBox(
              width: 32,
              height: 32,
              child: ClipOval(
                child: PhotoPlaceholder(
                  hue: hueFromString(e.id),
                  child: Text(e.name.isEmpty ? '?' : e.name[0].toUpperCase(),
                      style: AppText.h3
                          .copyWith(color: Colors.white, fontSize: 12)),
                ),
              ),
            ),
            const SizedBox(width: 11),
            Expanded(
              child: Text(e.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.h3.copyWith(fontSize: 13.5)),
            ),
            Text(_ago(e.checkedInAt!),
                style: AppText.caption
                    .copyWith(fontSize: 11, color: AppColors.inkMuted)),
          ]),
        ),
    ];
  }

  static String _ago(DateTime t) {
    final d = DateTime.now().difference(t);
    if (d.inSeconds < 60) return 'just now';
    if (d.inMinutes < 60) return '${d.inMinutes}m ago';
    if (d.inHours < 24) return '${d.inHours}h ago';
    return '${d.inDays}d ago';
  }
}

/// Check-in rate ring — 12px stroke, forest on cream track, rounded cap.
class _RingPainter extends CustomPainter {
  final double fraction; // 0..1
  _RingPainter(this.fraction);

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (math.min(size.width, size.height) - 12) / 2;

    final track = Paint()
      ..color = AppColors.creamSoft
      ..style = PaintingStyle.stroke
      ..strokeWidth = 12;
    canvas.drawCircle(center, radius, track);

    if (fraction > 0) {
      final arc = Paint()
        ..color = AppColors.forest
        ..style = PaintingStyle.stroke
        ..strokeWidth = 12
        ..strokeCap = StrokeCap.round;
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        -math.pi / 2,
        2 * math.pi * fraction.clamp(0.0, 1.0),
        false,
        arc,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _RingPainter old) => old.fraction != fraction;
}

extension<T> on Iterable<T> {
  T? get firstOrNull => isEmpty ? null : first;
}
