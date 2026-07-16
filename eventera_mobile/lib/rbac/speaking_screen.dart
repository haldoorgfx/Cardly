import 'package:flutter/material.dart';

import '../attendee/event_landing_screen.dart';
import '../attendee/hub/session_detail_screen.dart';
import '../net.dart';
import '../roles/role_widgets.dart';
import '../roles/speaker/speaker_tools_screen.dart';
import '../tz.dart';
import '../ui/components.dart';
import '../ui/tokens.dart';
import 'speaker_profile_edit_screen.dart';

/// "Speaking" — the events where the signed-in account holds an ACTIVE
/// `speaker` role (resolved from `user_event_roles`, passed in as [eventIds]).
///
/// For each speaking event we resolve the account's speaker row(s) — matched by
/// the signed-in email against `speakers.email` (migration 039) — then load the
/// published `sessions` those speaker rows are on (via `session_speakers`),
/// showing title, time and room. The speaker can open a session to see full
/// details, open the public event page, edit their speaker profile, or open the
/// speaker tools ([SpeakerToolsScreen]: green room + per-session live Q&A).
///
/// All reads go through the anon client. `speakers`, `session_speakers` and
/// published `sessions` are public-readable under RLS, so this needs no special
/// policy. Everything fails SAFE: a query error yields an empty section, never
/// an error wall or a broken Account screen.
class SpeakingScreen extends StatefulWidget {
  final List<String> eventIds;
  const SpeakingScreen({super.key, required this.eventIds});

  @override
  State<SpeakingScreen> createState() => _SpeakingScreenState();
}

class _SpeakingScreenState extends State<SpeakingScreen> {
  bool _loading = true;
  List<_SpeakingEvent> _events = const [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final out = <_SpeakingEvent>[];
    try {
      final ids = widget.eventIds.where((e) => e.isNotEmpty).toList();
      if (ids.isNotEmpty) {
        // 1) Event display metadata — same source as Discover: `events` for
        //    id/name/slug, embedded `event_pages` for cover/date/venue.
        final eventRows = await supa
            .from('events')
            .select(
                'id, name, slug, status, event_pages(cover_image_url, starts_at, venue_name, city, country, is_online, timezone)')
            .inFilter('id', ids);
        final byId = <String, _SpeakingEvent>{};
        for (final r in (eventRows as List).whereType<Map>()) {
          final ev = _SpeakingEvent.fromRow(Map<String, dynamic>.from(r));
          // Skip events with no public slug — their event page can't be opened,
          // so we never render a dead-end tile for them.
          if (ev.slug.isEmpty) continue;
          byId[ev.id] = ev;
        }

        // 2) Resolve this account's speaker rows in those events by email, then
        //    load the sessions those speakers are on. Best-effort: if the
        //    speaker rows or sessions can't be read we still show the events.
        await _attachSessions(byId, ids);

        out.addAll(byId.values);
        // Newest first by event date (nulls last).
        out.sort((a, b) {
          final ad = a.startsAt, bd = b.startsAt;
          if (ad == null && bd == null) return 0;
          if (ad == null) return 1;
          if (bd == null) return -1;
          return bd.compareTo(ad);
        });
      }
    } catch (_) {
      // Fail safe — show an empty state rather than an error wall.
    }
    if (!mounted) return;
    setState(() {
      _events = out;
      _loading = false;
    });
  }

  /// Populates `sessions` on each event in [byId] with the account's sessions.
  Future<void> _attachSessions(
      Map<String, _SpeakingEvent> byId, List<String> ids) async {
    final email = (currentUserEmail ?? '').trim().toLowerCase();
    try {
      // Speaker rows in these events. Prefer an email match (the confident link,
      // same predicate the 055 backfill uses); if the account has no email we
      // simply skip — better to show the event with no sessions than the wrong
      // person's sessions.
      var q = supa
          .from('speakers')
          .select('id, event_id, email')
          .inFilter('event_id', ids);
      if (email.isNotEmpty) {
        q = q.eq('email', email);
      }
      final speakerRows = await q;

      // speaker_id -> event_id
      final speakerToEvent = <String, String>{};
      for (final s in (speakerRows as List).whereType<Map>()) {
        final sid = asString(s['id']);
        final eid = asString(s['event_id']);
        if (sid.isNotEmpty && eid.isNotEmpty) {
          speakerToEvent[sid] = eid;
          // Remember this account's speaker row for the event (first one wins)
          // so the profile-edit entry can target the right row.
          final ev = byId[eid];
          if (ev != null && ev.speakerId.isEmpty) ev.speakerId = sid;
        }
      }
      if (speakerToEvent.isEmpty) return;

      // 3) Sessions those speakers are on (published only), with time + room.
      final links = await supa
          .from('session_speakers')
          .select(
              'speaker_id, sessions(id, title, starts_at, ends_at, room, event_id, is_published)')
          .inFilter('speaker_id', speakerToEvent.keys.toList());

      // Dedupe sessions per event (a speaker can appear on the same session once,
      // but two speaker rows in one event could both link the same session).
      final seen = <String, Set<String>>{}; // eventId -> sessionIds
      for (final l in (links as List).whereType<Map>()) {
        final s = l['sessions'];
        if (s is! Map) continue;
        if (asBool(s['is_published']) != true) continue;
        final eid = asString(s['event_id']);
        final sid = asString(s['id']);
        final ev = byId[eid];
        if (ev == null || sid.isEmpty) continue;
        final eventSeen = (seen[eid] ??= <String>{});
        if (!eventSeen.add(sid)) continue; // already added
        ev.sessions.add(_SpeakerSession.fromRow(Map<String, dynamic>.from(s)));
      }
      // Order each event's sessions by start time (nulls last).
      for (final ev in byId.values) {
        ev.sessions.sort((a, b) {
          final ad = a.startsAt, bd = b.startsAt;
          if (ad == null && bd == null) return 0;
          if (ad == null) return 1;
          if (bd == null) return -1;
          return ad.compareTo(bd);
        });
      }
    } catch (_) {
      // Non-fatal — events still render, just without the session list.
    }
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: const MAppBar(title: 'Speaking'),
      body: RefreshIndicator(
        color: AppColors.forest,
        onRefresh: _load,
        child: _loading
            ? const LoadingState()
            : _events.isEmpty
                ? ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    children: const [
                      SizedBox(height: 120),
                      EmptyState(
                        icon: Icons.mic_none_outlined,
                        title: 'No speaking events yet',
                        message:
                            'Events where you are added as a speaker will appear here.',
                      ),
                    ],
                  )
                : ListView.separated(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(20, 12, 20, 36),
                    itemCount: _events.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 20),
                    itemBuilder: (_, i) => _EventBlock(
                      event: _events[i],
                      onOpenEvent: () => _openEvent(_events[i]),
                      onOpenSession: (s) => _openSession(_events[i], s),
                      onOpenTools: () => _openTools(_events[i]),
                      onEditProfile: () => _editProfile(_events[i]),
                    ),
                  ),
      ),
    );
  }

  void _openEvent(_SpeakingEvent e) {
    // Events without a slug are pre-filtered out in _load, so every tile that
    // renders here has an openable event page.
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => EventLandingScreen(slug: e.slug)),
    );
  }

  void _openSession(_SpeakingEvent e, _SpeakerSession s) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => SessionDetailScreen(sessionId: s.id, eventId: e.id),
      ),
    );
  }

  /// Opens the speaker tools (green room + per-session live Q&A).
  /// [SpeakerToolsScreen] resolves the account's sessions itself, so we only
  /// pass the event id + name. Wrapped so a nav failure never crashes the tab.
  void _openTools(_SpeakingEvent e) {
    try {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) =>
              SpeakerToolsScreen(eventId: e.id, eventName: e.name),
        ),
      );
    } catch (_) {
      showToast(context, 'Could not open speaker tools.');
    }
  }

  /// Opens the speaker profile editor for this event. Passes the resolved
  /// speaker id when known so the editor skips the lookup; the editor also
  /// resolves by email as a fallback.
  void _editProfile(_SpeakingEvent e) {
    try {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => SpeakerProfileEditScreen(
            eventId: e.id,
            eventName: e.name,
            speakerId: e.speakerId.isEmpty ? null : e.speakerId,
          ),
        ),
      );
    } catch (_) {
      showToast(context, 'Could not open your speaker profile.');
    }
  }
}

class _SpeakingEvent {
  final String id;
  final String name;
  final String slug;
  final DateTime? startsAt;
  final String location;
  final String coverUrl;
  final String? timezone;
  final List<_SpeakerSession> sessions = [];
  // The account's speaker row id at this event, resolved by email in
  // _attachSessions. Empty until resolved (or if no match). Used to target the
  // speaker profile edit at the correct row.
  String speakerId = '';
  _SpeakingEvent({
    required this.id,
    required this.name,
    required this.slug,
    required this.startsAt,
    required this.location,
    required this.coverUrl,
    required this.timezone,
  });

  factory _SpeakingEvent.fromRow(Map<String, dynamic> r) {
    // event_pages may come back as a Map (1:1) or a List; normalize to a map.
    final pagesRaw = r['event_pages'];
    Map<String, dynamic> page = const {};
    if (pagesRaw is Map) {
      page = Map<String, dynamic>.from(pagesRaw);
    } else if (pagesRaw is List && pagesRaw.isNotEmpty && pagesRaw.first is Map) {
      page = Map<String, dynamic>.from(pagesRaw.first as Map);
    }
    String location() {
      if (asBool(page['is_online'])) return 'Online';
      final venue = asString(page['venue_name']).trim();
      if (venue.isNotEmpty) return venue;
      return [asString(page['city']).trim(), asString(page['country']).trim()]
          .where((e) => e.isNotEmpty)
          .join(', ');
    }

    return _SpeakingEvent(
      id: asString(r['id']),
      name: asString(r['name'], 'Event'),
      slug: asString(r['slug']),
      startsAt: asDate(page['starts_at']),
      location: location(),
      coverUrl: asString(page['cover_image_url']).trim(),
      timezone: asString(page['timezone']).trim(),
    );
  }
}

class _SpeakerSession {
  final String id;
  final String title;
  final DateTime? startsAt;
  final DateTime? endsAt;
  final String room;
  const _SpeakerSession({
    required this.id,
    required this.title,
    required this.startsAt,
    required this.endsAt,
    required this.room,
  });

  factory _SpeakerSession.fromRow(Map<String, dynamic> s) => _SpeakerSession(
        id: asString(s['id']),
        title: asString(s['title'], 'Untitled session'),
        startsAt: asDate(s['starts_at']),
        endsAt: asDate(s['ends_at']),
        room: asString(s['room']).trim(),
      );
}

/// One event: a header tile (cover, name, date, "Open event" chevron) followed
/// by the account's sessions at that event, or a quiet "no sessions yet" line.
class _EventBlock extends StatelessWidget {
  final _SpeakingEvent event;
  final VoidCallback onOpenEvent;
  final ValueChanged<_SpeakerSession> onOpenSession;
  final VoidCallback onOpenTools;
  final VoidCallback onEditProfile;
  const _EventBlock({
    required this.event,
    required this.onOpenEvent,
    required this.onOpenSession,
    required this.onOpenTools,
    required this.onEditProfile,
  });

  @override
  Widget build(BuildContext context) {
    final sub = [
      if (event.startsAt != null)
        _fmtDate(toEventZone(event.startsAt, event.timezone)!),
      if (event.location.isNotEmpty) event.location,
    ].join(' · ');
    final count = event.sessions.length;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Event header — tappable to open the public event page.
        MCard(
          onTap: onOpenEvent,
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(11),
                child: SizedBox(
                  width: 52,
                  height: 52,
                  child: event.coverUrl.isNotEmpty
                      ? Image.network(
                          event.coverUrl,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) =>
                              PhotoPlaceholder(hue: hueFromString(event.id)),
                        )
                      : PhotoPlaceholder(hue: hueFromString(event.id)),
                ),
              ),
              const SizedBox(width: 13),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(event.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppText.h3.copyWith(fontSize: 15.5)),
                    if (sub.isNotEmpty) ...[
                      const SizedBox(height: 3),
                      Text(sub,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppText.bodySm),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 6),
              const Icon(Icons.chevron_right,
                  size: 18, color: AppColors.inkMuted),
            ],
          ),
        ),
        const SizedBox(height: 10),
        Padding(
          padding: const EdgeInsets.only(left: 2, bottom: 6),
          child: Text(
            count == 0
                ? 'YOUR SESSIONS'
                : (count == 1 ? '1 SESSION' : '$count SESSIONS'),
            style: AppText.seclab,
          ),
        ),
        if (count == 0)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.creamSoft,
              borderRadius: BorderRadius.circular(AppRadius.card),
            ),
            child: Text(
              'No sessions are assigned to you here yet. The organizer adds '
              'you to sessions on the schedule.',
              style: AppText.bodySm.copyWith(color: AppColors.inkMuted),
            ),
          )
        else
          for (final s in event.sessions) ...[
            _SessionRow(
                session: s,
                timezone: event.timezone,
                onTap: () => onOpenSession(s)),
            const SizedBox(height: 8),
          ],
        // ── Speaker tools + profile ───────────────────────────────────────
        const SizedBox(height: 6),
        ToolCard(
          icon: Icons.mic_none,
          title: 'Speaker tools',
          summary: 'Green room · logistics · live audience Q&A',
          onTap: onOpenTools,
        ),
        const SizedBox(height: 8),
        ToolCard(
          icon: Icons.person_outline,
          title: 'Edit speaker profile',
          summary: 'Name, title, company, bio and links',
          onTap: onEditProfile,
        ),
      ],
    );
  }

  // Reads the fields straight off [d] — caller must pass an already
  // event-zone-converted DateTime (see toEventZone in lib/tz.dart).
  static String _fmtDate(DateTime d) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return '${months[d.month - 1]} ${d.day}, ${d.year}';
  }
}

/// A single session the speaker is on — time + title + room, tappable.
class _SessionRow extends StatelessWidget {
  final _SpeakerSession session;
  final String? timezone;
  final VoidCallback onTap;
  const _SessionRow(
      {required this.session, required this.timezone, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final time = _fmtTimeRange(
        toEventZone(session.startsAt, timezone),
        toEventZone(session.endsAt, timezone));
    final meta = [
      if (time.isNotEmpty) time,
      if (session.room.isNotEmpty) session.room,
    ].join(' · ');
    return MCard(
      onTap: onTap,
      padding: const EdgeInsets.all(13),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            width: 3,
            height: 34,
            decoration: BoxDecoration(
              color: AppColors.gold,
              borderRadius: BorderRadius.circular(999),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(session.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.h3.copyWith(fontSize: 14.5)),
                if (meta.isNotEmpty) ...[
                  const SizedBox(height: 3),
                  Text(meta,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.bodySm.copyWith(color: AppColors.inkMuted)),
                ],
              ],
            ),
          ),
          const SizedBox(width: 6),
          const Icon(Icons.chevron_right, size: 18, color: AppColors.inkMuted),
        ],
      ),
    );
  }

  // start/end must already be event-zone-converted (see toEventZone).
  static String _fmtTimeRange(DateTime? start, DateTime? end) {
    if (start == null) return '';
    String t(DateTime d) {
      final ampm = d.hour < 12 ? 'AM' : 'PM';
      var h = d.hour % 12;
      if (h == 0) h = 12;
      final m = d.minute.toString().padLeft(2, '0');
      return '$h:$m $ampm';
    }

    if (end == null) return t(start);
    return '${t(start)} – ${t(end)}';
  }
}
