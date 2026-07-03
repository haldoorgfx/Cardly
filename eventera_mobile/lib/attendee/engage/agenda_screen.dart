import 'package:flutter/material.dart';

import '../../net.dart';
import '../../ui/components.dart';
import '../../ui/tokens.dart';
import '_shared.dart';

/// AgendaScreen — lists published `sessions` for an event, grouped by day.
/// Attendees can add a session to their personal agenda (book route) and rate
/// sessions. "My agenda" filter reads `attendee_agendas` for the registration.
///
/// Contracts verified against the web app:
///  - GET sessions:  supa .from('sessions') with tracks + session_speakers→speakers,
///    is_published=true (mirrors /api/events/[id]/sessions?published=true).
///  - Book:          POST /api/events/[id]/sessions/[sessionId]/book { registrationId }.
///  - Remove:        delete attendee_agendas row (registration_id, session_id) via supa.
///  - Rate:          POST /api/sessions/[sessionId]/rate { registration_id, rating }.
///    (The rate route accepts NO comment field — see return note.)
class AgendaScreen extends StatefulWidget {
  final String eventId;
  final String slug;
  final String? registrationId;
  const AgendaScreen({
    super.key,
    required this.eventId,
    required this.slug,
    this.registrationId,
  });

  @override
  State<AgendaScreen> createState() => _AgendaScreenState();
}

class _Session {
  final String id;
  final String title;
  final String? description;
  final DateTime? startsAt;
  final DateTime? endsAt;
  final String? room;
  final String? trackName;
  final Color? trackColor;
  final List<String> speakers;
  final int? capacity;
  final int registrationsCount;

  _Session({
    required this.id,
    required this.title,
    this.description,
    this.startsAt,
    this.endsAt,
    this.room,
    this.trackName,
    this.trackColor,
    required this.speakers,
    this.capacity,
    required this.registrationsCount,
  });

  factory _Session.fromRow(Map<String, dynamic> r) {
    final track = r['tracks'];
    final ss = asMapList(r['session_speakers']);
    final speakers = <String>[];
    for (final s in ss) {
      final sp = s['speakers'];
      if (sp is Map && sp['name'] != null) speakers.add(sp['name'].toString());
    }
    Color? tc;
    final hex = (track is Map) ? asString(track['color']) : '';
    if (hex.startsWith('#') && hex.length >= 7) {
      final v = int.tryParse(hex.substring(1), radix: 16);
      if (v != null) tc = Color(0xFF000000 | v);
    }
    return _Session(
      id: asString(r['id']),
      title: asString(r['title'], 'Untitled session'),
      description: r['description'] == null ? null : asString(r['description']),
      startsAt: asDate(r['starts_at']),
      endsAt: asDate(r['ends_at']),
      room: r['room'] == null ? null : asString(r['room']),
      trackName: (track is Map && track['name'] != null)
          ? track['name'].toString()
          : null,
      trackColor: tc,
      speakers: speakers,
      capacity: r['capacity'] == null ? null : asInt(r['capacity']),
      registrationsCount: asInt(r['registrations_count']),
    );
  }
}

class _AgendaScreenState extends State<AgendaScreen> {
  bool _loading = true;
  String? _error;
  List<_Session> _sessions = [];
  final Set<String> _myAgenda = {}; // session ids
  bool _myOnly = false;
  final Set<String> _busy = {}; // session ids with in-flight action
  int _dayIndex = 0;

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
          .from('sessions')
          .select(
              '*, tracks(id, name, color), session_speakers(position, speakers(id, name))')
          .eq('event_id', widget.eventId)
          .eq('is_published', true)
          .order('starts_at', ascending: true);
      final list = (rows as List)
          .whereType<Map>()
          .map((e) => _Session.fromRow(Map<String, dynamic>.from(e)))
          .toList();

      _myAgenda.clear();
      final rid = widget.registrationId;
      if (rid != null) {
        final agenda = await supa
            .from('attendee_agendas')
            .select('session_id')
            .eq('registration_id', rid);
        for (final a in (agenda as List).whereType<Map>()) {
          _myAgenda.add(asString(a['session_id']));
        }
      }
      if (!mounted) return;
      setState(() {
        _sessions = list;
        _loading = false;
        if (_dayIndex >= _days.length) _dayIndex = 0;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e is ApiException ? e.message : e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _toggleAgenda(_Session s) async {
    final rid = widget.registrationId;
    if (rid == null) {
      showEngageSnack(context, 'Register for this event to build your agenda',
          error: true);
      return;
    }
    if (_busy.contains(s.id)) return;
    final wasIn = _myAgenda.contains(s.id);
    setState(() => _busy.add(s.id));
    try {
      if (wasIn) {
        await supa
            .from('attendee_agendas')
            .delete()
            .eq('registration_id', rid)
            .eq('session_id', s.id);
        _myAgenda.remove(s.id);
      } else {
        final res = await apiPost(
          '/api/events/${widget.eventId}/sessions/${s.id}/book',
          {'registrationId': rid},
        );
        _myAgenda.add(s.id);
        if (!mounted) return;
        if (res is Map && res['waitlisted'] == true) {
          showEngageSnack(context, 'Session is full — you\'re on the waitlist');
        } else {
          showToast(context, 'Added to your agenda');
        }
      }
      if (mounted) setState(() {});
    } catch (e) {
      if (mounted) {
        showEngageSnack(context,
            e is ApiException ? e.message : 'Could not update agenda',
            error: true);
      }
    } finally {
      if (mounted) setState(() => _busy.remove(s.id));
    }
  }

  Future<void> _rate(_Session s) async {
    final rid = widget.registrationId;
    if (rid == null) {
      showEngageSnack(context, 'Register for this event to rate sessions',
          error: true);
      return;
    }
    final rating = await showMSheet<int>(context, _RateSheet(title: s.title));
    if (rating == null) return;
    try {
      await apiPost('/api/sessions/${s.id}/rate', {
        'registration_id': rid,
        'rating': rating,
      });
      if (!mounted) return;
      showToast(context, 'Thanks for rating "${s.title}"');
    } catch (e) {
      if (mounted) {
        showEngageSnack(context,
            e is ApiException ? e.message : 'Could not submit rating',
            error: true);
      }
    }
  }

  // Distinct day labels, in order.
  List<String> get _days {
    final seen = <String>[];
    for (final s in _sessions) {
      final key = s.startsAt == null ? 'TBA' : fmtDayLabel(s.startsAt!);
      if (!seen.contains(key)) seen.add(key);
    }
    return seen;
  }

  List<_Session> get _visible {
    final days = _days;
    final day = (days.isEmpty || _dayIndex >= days.length)
        ? null
        : days[_dayIndex];
    return _sessions.where((s) {
      final key = s.startsAt == null ? 'TBA' : fmtDayLabel(s.startsAt!);
      final dayMatch = day == null || key == day;
      final agendaMatch = !_myOnly || _myAgenda.contains(s.id);
      return dayMatch && agendaMatch;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: const MAppBar(title: 'Schedule', hairline: true),
      body: _loading || _error != null
          ? _body()
          : Column(
              children: [
                if (_days.length > 1)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(
                        AppSpace.lg, AppSpace.md, AppSpace.lg, 0),
                    child: SegControl(
                      segments: _days,
                      index: _dayIndex.clamp(0, _days.length - 1),
                      onChanged: (i) => setState(() => _dayIndex = i),
                    ),
                  ),
                if (widget.registrationId != null) _filterBar(),
                Expanded(child: _body()),
              ],
            ),
    );
  }

  Widget _filterBar() {
    final dayCount = _visibleDayCount();
    return Padding(
      padding: const EdgeInsets.fromLTRB(
          AppSpace.lg, AppSpace.md, AppSpace.lg, AppSpace.sm),
      child: Row(
        children: [
          Text(
            _myOnly
                ? 'My agenda'
                : (dayCount == 1 ? '1 session' : '$dayCount sessions'),
            style: AppText.seclab,
          ),
          const Spacer(),
          Text('My agenda',
              style: AppText.bodySm.copyWith(
                  fontWeight: FontWeight.w600,
                  color: _myOnly ? AppColors.forest : AppColors.inkSoft)),
          const SizedBox(width: 8),
          MToggle(value: _myOnly, onChanged: (v) => setState(() => _myOnly = v)),
        ],
      ),
    );
  }

  int _visibleDayCount() {
    final days = _days;
    final day = (days.isEmpty || _dayIndex >= days.length)
        ? null
        : days[_dayIndex];
    return _sessions.where((s) {
      final key = s.startsAt == null ? 'TBA' : fmtDayLabel(s.startsAt!);
      return day == null || key == day;
    }).length;
  }

  Widget _body() {
    if (_loading) return const LoadingState();
    if (_error != null) {
      return ErrorStateView(message: _error!, onRetry: _load);
    }
    final visible = _visible;
    if (visible.isEmpty) {
      return RefreshIndicator(
        color: AppColors.forest,
        onRefresh: _load,
        child: ListView(
          children: [
            SizedBox(height: MediaQuery.of(context).size.height * 0.16),
            EngageState(
              icon: _myOnly
                  ? Icons.event_available_outlined
                  : Icons.event_note_outlined,
              title: _myOnly ? 'Nothing saved yet' : 'No sessions yet',
              subtitle: _myOnly
                  ? 'Tap + on any session to build your plan.'
                  : 'The organizer hasn\'t published the schedule.',
              action: _myOnly
                  ? MButton('Browse all sessions',
                      kind: MBtnKind.sec,
                      small: true,
                      fullWidth: false,
                      onTap: () => setState(() => _myOnly = false))
                  : null,
            ),
          ],
        ),
      );
    }
    return RefreshIndicator(
      color: AppColors.forest,
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(
            AppSpace.lg, AppSpace.md, AppSpace.lg, AppSpace.xxxl),
        itemCount: visible.length,
        itemBuilder: (_, i) => _sessionCard(visible[i]),
      ),
    );
  }

  Widget _sessionCard(_Session s) {
    final inAgenda = _myAgenda.contains(s.id);
    final busy = _busy.contains(s.id);
    final accent = s.trackColor ?? AppColors.forest;
    final subtitle = [
      if (s.speakers.isNotEmpty) s.speakers.join(', '),
      if ((s.room ?? '').isNotEmpty) s.room,
    ].whereType<String>().join(' · ');

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpace.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(bottom: AppSpace.sm),
            child: Text(fmtTimeRange(s.startsAt, s.endsAt),
                style: AppText.numSm.copyWith(color: AppColors.inkMuted)),
          ),
          Container(
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(AppRadius.card),
              border: Border.all(color: AppColors.border),
              boxShadow: AppShadow.soft,
            ),
            child: IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Track-colored left border
                  Container(
                    width: 3,
                    decoration: BoxDecoration(
                      color: accent,
                      borderRadius: const BorderRadius.horizontal(
                          left: Radius.circular(AppRadius.card)),
                    ),
                  ),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    if (s.trackName != null) ...[
                                      _trackPill(s),
                                      const SizedBox(width: 8),
                                    ],
                                    if (s.capacity != null)
                                      Text(
                                        '${s.registrationsCount}/${s.capacity}',
                                        style: AppText.numSm.copyWith(
                                            fontSize: 11,
                                            color: AppColors.inkMuted),
                                      ),
                                  ],
                                ),
                                if (s.trackName != null || s.capacity != null)
                                  const SizedBox(height: 8),
                                Text(s.title,
                                    style: AppText.h3.copyWith(fontSize: 15)),
                                if (subtitle.isNotEmpty) ...[
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      if (s.speakers.isNotEmpty) ...[
                                        _AvatarCluster(names: s.speakers),
                                        const SizedBox(width: 8),
                                      ],
                                      Expanded(
                                        child: Text(subtitle,
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: AppText.bodySm.copyWith(
                                                color: AppColors.inkMuted)),
                                      ),
                                    ],
                                  ),
                                ],
                                if ((s.description ?? '').isNotEmpty) ...[
                                  const SizedBox(height: 8),
                                  Text(s.description!,
                                      maxLines: 3,
                                      overflow: TextOverflow.ellipsis,
                                      style: AppText.bodySm),
                                ],
                                const SizedBox(height: 10),
                                GestureDetector(
                                  onTap: () => _rate(s),
                                  behavior: HitTestBehavior.opaque,
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.star_outline_rounded,
                                          size: 16, color: AppColors.gold),
                                      const SizedBox(width: 5),
                                      Text('Rate this session',
                                          style: AppText.bodySm.copyWith(
                                              fontWeight: FontWeight.w600,
                                              color: AppColors.forest)),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),
                          _AddButton(
                            inAgenda: inAgenda,
                            busy: busy,
                            onTap: () => _toggleAgenda(s),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _trackPill(_Session s) {
    final c = s.trackColor ?? AppColors.forest;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: c.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(s.trackName!,
          style: AppText.caption.copyWith(
              color: c, fontWeight: FontWeight.w600, fontSize: 11, letterSpacing: 0.1)),
    );
  }
}

class _AddButton extends StatelessWidget {
  final bool inAgenda;
  final bool busy;
  final VoidCallback onTap;
  const _AddButton(
      {required this.inAgenda, required this.busy, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: busy ? null : onTap,
      child: Container(
        width: 34,
        height: 34,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: inAgenda ? AppColors.forest : AppColors.surface,
          borderRadius: BorderRadius.circular(9),
          border: inAgenda ? null : Border.all(color: AppColors.border),
        ),
        child: busy
            ? const SizedBox(
                width: 15,
                height: 15,
                child: CircularProgressIndicator(
                    strokeWidth: 2, color: AppColors.forest))
            : Icon(inAgenda ? Icons.check : Icons.add,
                size: 18,
                color: inAgenda ? Colors.white : AppColors.forest),
      ),
    );
  }
}

class _AvatarCluster extends StatelessWidget {
  final List<String> names;
  const _AvatarCluster({required this.names});

  @override
  Widget build(BuildContext context) {
    final shown = names.take(3).toList();
    return SizedBox(
      width: 20.0 + (shown.length - 1) * 13,
      height: 26,
      child: Stack(
        children: [
          for (int i = 0; i < shown.length; i++)
            Positioned(
              left: i * 13.0,
              child: Container(
                padding: const EdgeInsets.all(1.5),
                decoration: const BoxDecoration(
                    color: AppColors.surface, shape: BoxShape.circle),
                child: Avatar(name: shown[i], size: 23),
              ),
            ),
        ],
      ),
    );
  }
}

class _RateSheet extends StatefulWidget {
  final String title;
  const _RateSheet({required this.title});

  @override
  State<_RateSheet> createState() => _RateSheetState();
}

class _RateSheetState extends State<_RateSheet> {
  int _rating = 0;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(0, 4, 0, 4),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Rate this session', style: AppText.h3),
          const SizedBox(height: 4),
          Text(widget.title, style: AppText.bodySm),
          const SizedBox(height: AppSpace.lg),
          Center(
            child: StarRating(
              value: _rating,
              size: 40,
              onChanged: (v) => setState(() => _rating = v),
            ),
          ),
          const SizedBox(height: AppSpace.lg),
          MButton('Submit rating',
              onTap: _rating == 0
                  ? null
                  : () => Navigator.of(context).pop(_rating)),
        ],
      ),
    );
  }
}
