import 'package:flutter/material.dart';

import '../../net.dart';
import '../../theme.dart';
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
        if (mounted && res is Map && res['waitlisted'] == true) {
          showEngageSnack(context, 'Session is full — you\'re on the waitlist');
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
    final rating = await showModalBottomSheet<int>(
      context: context,
      backgroundColor: Brand.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => _RateSheet(title: s.title),
    );
    if (rating == null) return;
    try {
      await apiPost('/api/sessions/${s.id}/rate', {
        'registration_id': rid,
        'rating': rating,
      });
      if (mounted) showEngageSnack(context, 'Thanks for rating "${s.title}"');
    } catch (e) {
      if (mounted) {
        showEngageSnack(context,
            e is ApiException ? e.message : 'Could not submit rating',
            error: true);
      }
    }
  }

  List<_Session> get _visible =>
      _myOnly ? _sessions.where((s) => _myAgenda.contains(s.id)).toList() : _sessions;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Agenda'),
        backgroundColor: Brand.cream,
        surfaceTintColor: Colors.transparent,
      ),
      body: Column(
        children: [
          if (widget.registrationId != null) _filterBar(),
          Expanded(child: _body()),
        ],
      ),
    );
  }

  Widget _filterBar() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      child: Row(
        children: [
          _chip('All sessions', !_myOnly, () => setState(() => _myOnly = false)),
          const SizedBox(width: 8),
          _chip('My agenda (${_myAgenda.length})', _myOnly,
              () => setState(() => _myOnly = true)),
        ],
      ),
    );
  }

  Widget _chip(String label, bool active, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: active ? Brand.forest : Brand.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: active ? Brand.forest : Brand.border),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: active ? Colors.white : Brand.inkSoft,
          ),
        ),
      ),
    );
  }

  Widget _body() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator(color: Brand.forest));
    }
    if (_error != null) {
      return EngageState(
        icon: Icons.error_outline,
        title: 'Couldn\'t load the agenda',
        subtitle: _error,
        action: FilledButton(onPressed: _load, child: const Text('Retry')),
      );
    }
    final visible = _visible;
    if (visible.isEmpty) {
      return RefreshIndicator(
        color: Brand.forest,
        onRefresh: _load,
        child: ListView(
          children: [
            SizedBox(height: MediaQuery.of(context).size.height * 0.25),
            EngageState(
              icon: _myOnly ? Icons.event_available_outlined : Icons.event_note_outlined,
              title: _myOnly ? 'Nothing on your agenda yet' : 'No sessions yet',
              subtitle: _myOnly
                  ? 'Add sessions to build your personal schedule.'
                  : 'The organizer hasn\'t published the schedule.',
            ),
          ],
        ),
      );
    }
    return RefreshIndicator(
      color: Brand.forest,
      onRefresh: _load,
      child: _grouped(visible),
    );
  }

  Widget _grouped(List<_Session> list) {
    // Group by day label.
    final groups = <String, List<_Session>>{};
    for (final s in list) {
      final key = s.startsAt == null ? 'TBA' : fmtDayLabel(s.startsAt!);
      groups.putIfAbsent(key, () => []).add(s);
    }
    final children = <Widget>[];
    groups.forEach((day, sessions) {
      children.add(Padding(
        padding: const EdgeInsets.fromLTRB(16, 18, 16, 8),
        child: Text(
          day,
          style: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w700,
            color: Brand.forest,
          ),
        ),
      ));
      for (final s in sessions) {
        children.add(_sessionCard(s));
      }
    });
    return ListView(
      padding: const EdgeInsets.only(bottom: 32),
      children: children,
    );
  }

  Widget _sessionCard(_Session s) {
    final inAgenda = _myAgenda.contains(s.id);
    final busy = _busy.contains(s.id);
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      padding: const EdgeInsets.all(14),
      decoration: engageCard(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                fmtTimeRange(s.startsAt, s.endsAt),
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Brand.inkSoft,
                ),
              ),
              if (s.trackName != null) ...[
                const SizedBox(width: 8),
                _trackPill(s),
              ],
              const Spacer(),
              if (s.capacity != null)
                Text(
                  '${s.registrationsCount}/${s.capacity}',
                  style: const TextStyle(fontSize: 12, color: Brand.muted),
                ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            s.title,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: Brand.ink,
            ),
          ),
          if (s.room != null && s.room!.isNotEmpty) ...[
            const SizedBox(height: 4),
            Row(
              children: [
                const Icon(Icons.place_outlined, size: 14, color: Brand.muted),
                const SizedBox(width: 4),
                Text(s.room!,
                    style: const TextStyle(fontSize: 13, color: Brand.muted)),
              ],
            ),
          ],
          if (s.speakers.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              s.speakers.join(', '),
              style: const TextStyle(fontSize: 13, color: Brand.inkSoft),
            ),
          ],
          if (s.description != null && s.description!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              s.description!,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 13, color: Brand.inkSoft, height: 1.4),
            ),
          ],
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: busy ? null : () => _toggleAgenda(s),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: inAgenda ? Brand.success : Brand.forest,
                    side: BorderSide(
                        color: inAgenda ? Brand.success : Brand.forest),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10)),
                  ),
                  icon: busy
                      ? const SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Brand.forest))
                      : Icon(inAgenda ? Icons.check : Icons.add, size: 18),
                  label: Text(inAgenda ? 'On my agenda' : 'Add to my agenda'),
                ),
              ),
              const SizedBox(width: 10),
              IconButton(
                onPressed: () => _rate(s),
                tooltip: 'Rate this session',
                icon: const Icon(Icons.star_outline, color: Brand.gold),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _trackPill(_Session s) {
    final c = s.trackColor ?? Brand.forest;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: c.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        s.trackName!,
        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: c),
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
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Rate this session',
            style: const TextStyle(
                fontSize: 18, fontWeight: FontWeight.w700, color: Brand.ink),
          ),
          const SizedBox(height: 4),
          Text(widget.title,
              style: const TextStyle(fontSize: 14, color: Brand.muted)),
          const SizedBox(height: 18),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(5, (i) {
              final v = i + 1;
              return IconButton(
                iconSize: 38,
                onPressed: () => setState(() => _rating = v),
                icon: Icon(
                  v <= _rating ? Icons.star : Icons.star_border,
                  color: Brand.gold,
                ),
              );
            }),
          ),
          const SizedBox(height: 18),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed:
                  _rating == 0 ? null : () => Navigator.of(context).pop(_rating),
              child: const Text('Submit rating'),
            ),
          ),
        ],
      ),
    );
  }
}
