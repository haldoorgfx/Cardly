import 'package:flutter/material.dart';

import '../../net.dart';
import '../../ui/components.dart';
import '../../ui/tokens.dart';
import '../engage/feedback_screen.dart';
import '../engage/leaderboard_screen.dart';
import '../engage/polls_screen.dart';
import '../engage/qa_screen.dart';
import '../network/people_screen.dart';
import '../reg_store.dart';
import 'event_page_model.dart';
import 'session_detail_screen.dart';
import 'speaker_detail_screen.dart';
import 'sponsor_detail_screen.dart';

/// The public event page hub — mirrors app/(public)/e/[slug]/page.tsx.
///
/// Loads the `event_pages` row by `custom_slug` (falling back to resolving via
/// `events.slug -> event_pages.event_id`), then the section data
/// (sessions / speakers / sponsors / attendee registrations).
class EventHubScreen extends StatefulWidget {
  final String slug;

  /// Optional register handler. If null, tapping "Register" shows a snackbar.
  final VoidCallback? onRegister;

  /// Optional save/bookmark handler (another module owns real saving).
  final VoidCallback? onSave;

  const EventHubScreen({
    super.key,
    required this.slug,
    this.onRegister,
    this.onSave,
  });

  @override
  State<EventHubScreen> createState() => _EventHubScreenState();
}

class _EventHubScreenState extends State<EventHubScreen> {
  bool _loading = true;
  String? _error;

  EventPageModel? _page;
  final List<SessionSummary> _sessions = [];
  final List<SpeakerSummary> _speakers = [];
  final List<SponsorSummary> _sponsors = [];
  final List<AttendeeAvatar> _attendees = [];
  String? _regId;

  int _section = 0; // SegNav index (Overview)
  bool _aboutExpanded = false;

  // Built dynamically from which sections have data / are enabled.
  late List<_Section> _navSections;

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
      final page = await _resolvePage(widget.slug);
      if (!mounted) return;
      if (page == null) {
        setState(() {
          _loading = false;
          _error = 'This event page could not be found.';
        });
        return;
      }

      _sessions.clear();
      _speakers.clear();
      _sponsors.clear();
      _attendees.clear();

      final eventId = page.eventId;
      if (eventId != null) {
        await Future.wait([
          _loadSessions(eventId),
          _loadSpeakers(eventId),
          _loadSponsors(eventId),
          _loadAttendees(eventId),
        ]);
      }

      final reg = await RegStore.instance.get(widget.slug);
      if (!mounted) return;
      setState(() {
        _page = page;
        _regId = reg?.registrationId;
        _navSections = _buildNav(page);
        _loading = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.message;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Something went wrong loading this event.';
      });
    }
  }

  Future<EventPageModel?> _resolvePage(String slug) async {
    // 1) direct match on custom_slug
    final byCustom = await supa
        .from('event_pages')
        .select('*')
        .eq('custom_slug', slug)
        .eq('is_public', true)
        .maybeSingle();
    if (byCustom != null) {
      return EventPageModel.fromRow(Map<String, dynamic>.from(byCustom));
    }

    // 2) resolve via events.slug -> event_pages.event_id
    final event = await supa
        .from('events')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
    if (event == null) return null;
    final eventId = asString(event['id']);
    if (eventId.isEmpty) return null;

    final byEvent = await supa
        .from('event_pages')
        .select('*')
        .eq('event_id', eventId)
        .eq('is_public', true)
        .maybeSingle();
    if (byEvent == null) return null;
    return EventPageModel.fromRow(Map<String, dynamic>.from(byEvent));
  }

  Future<void> _loadSessions(String eventId) async {
    final rows = await supa
        .from('sessions')
        .select('id, title, starts_at, ends_at, room, session_type, description')
        .eq('event_id', eventId)
        .eq('is_published', true)
        .order('starts_at');
    for (final r in _asRows(rows)) {
      _sessions.add(SessionSummary.fromRow(r));
    }
  }

  Future<void> _loadSpeakers(String eventId) async {
    final rows = await supa
        .from('speakers')
        .select('id, name, role, company, headline, photo_url')
        .eq('event_id', eventId)
        .order('position');
    for (final r in _asRows(rows)) {
      _speakers.add(SpeakerSummary.fromRow(r));
    }
  }

  Future<void> _loadSponsors(String eventId) async {
    final rows = await supa
        .from('sponsors')
        .select('id, company_name, tagline, logo_url, tier, position')
        .eq('event_id', eventId)
        .eq('is_visible', true)
        .order('position');
    for (final r in _asRows(rows)) {
      _sponsors.add(SponsorSummary.fromRow(r));
    }
  }

  Future<void> _loadAttendees(String eventId) async {
    final rows = await supa
        .from('registrations')
        .select('attendee_name, user_id')
        .eq('event_id', eventId)
        .inFilter('status', ['confirmed', 'checked_in'])
        .order('created_at', ascending: false)
        .limit(100);
    final regs = _asRows(rows);

    // join profiles for avatars
    final userIds = regs
        .map((r) => asString(r['user_id']))
        .where((s) => s.isNotEmpty)
        .toList();
    final avatarByUser = <String, String>{};
    if (userIds.isNotEmpty) {
      final profiles = await supa
          .from('profiles')
          .select('id, avatar_url')
          .inFilter('id', userIds);
      for (final p in _asRows(profiles)) {
        final url = asString(p['avatar_url']);
        if (url.isNotEmpty) avatarByUser[asString(p['id'])] = url;
      }
    }
    for (final r in regs) {
      final uid = asString(r['user_id']);
      _attendees.add(AttendeeAvatar(
        name: asString(r['attendee_name'], 'Attendee'),
        avatarUrl: uid.isEmpty ? null : avatarByUser[uid],
      ));
    }
  }

  List<Map<String, dynamic>> _asRows(dynamic v) {
    if (v is List) {
      return v
          .whereType<Map>()
          .map((e) => Map<String, dynamic>.from(e))
          .toList();
    }
    return const [];
  }

  // ── SegNav model ─────────────────────────────────────────────────

  List<_Section> _buildNav(EventPageModel page) {
    final s = <_Section>[_Section.overview];
    if (page.featureOn('schedule') && _sessions.isNotEmpty) {
      s.add(_Section.schedule);
    }
    if (page.featureOn('speakers') && _speakers.isNotEmpty) {
      s.add(_Section.speakers);
    }
    if (page.featureOn('sponsors') && _sponsors.isNotEmpty) {
      s.add(_Section.sponsors);
    }
    s.add(_Section.network);
    s.add(_Section.more);
    return s;
  }

  // ── actions ──────────────────────────────────────────────────────

  void _handleRegister() {
    if (widget.onRegister != null) {
      widget.onRegister!();
    } else {
      showToast(context, 'Registration is not available here yet.');
    }
  }

  void _handleSave() {
    if (!isSignedIn) {
      showToast(context, 'Sign in to save this event.');
      return;
    }
    if (widget.onSave != null) {
      widget.onSave!();
    } else {
      showToast(context, 'Saved.');
    }
  }

  void _push(Widget screen) {
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => screen));
  }

  void _onSectionTap(int index) {
    final section = _navSections[index];
    switch (section) {
      case _Section.network:
        final id = _page?.eventId;
        if (id == null) return;
        _push(PeopleScreen(
            eventId: id, slug: widget.slug, registrationId: _regId));
        return;
      case _Section.more:
        _openMoreSheet();
        return;
      default:
        setState(() => _section = index);
    }
  }

  Future<void> _openMoreSheet() async {
    final id = _page?.eventId;
    if (id == null) return;
    await showMSheet<void>(
      context,
      Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 4),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Align(
              alignment: Alignment.centerLeft,
              child: Text('More sections', style: AppText.h3),
            ),
            const SizedBox(height: 4),
            _moreRow(Icons.forum_outlined, 'Live Q&A',
                () => QaScreen(eventId: id, registrationId: _regId)),
            _moreRow(Icons.bar_chart_rounded, 'Polls & results',
                () => PollsScreen(eventId: id, registrationId: _regId)),
            _moreRow(Icons.emoji_events_outlined, 'Leaderboard',
                () => LeaderboardScreen(eventId: id)),
            _moreRow(Icons.rate_review_outlined, 'Feedback',
                () => FeedbackScreen(eventId: id, registrationId: _regId)),
          ],
        ),
      ),
    );
  }

  Widget _moreRow(IconData icon, String label, Widget Function() build) {
    return ListRow(
      leading: Icon(icon, color: AppColors.forest, size: 22),
      title: Text(label),
      chevron: true,
      onTap: () {
        Navigator.of(context).pop();
        _push(build());
      },
    );
  }

  void _openSession(String id, String? eventId) {
    if (eventId == null) return;
    _push(SessionDetailScreen(sessionId: id, eventId: eventId));
  }

  void _openSpeaker(String id, String? eventId) {
    if (eventId == null) return;
    _push(SpeakerDetailScreen(speakerId: id, eventId: eventId));
  }

  void _openSponsor(String id, String? eventId) {
    if (eventId == null) return;
    _push(SponsorDetailScreen(sponsorId: id, eventId: eventId));
  }

  // ── build ────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const MScaffold(body: LoadingState());
    }
    if (_error != null) {
      return MScaffold(
        appBar: const MAppBar(),
        body: ErrorStateView(message: _error!, onRetry: _load),
      );
    }
    return _buildContent();
  }

  Widget _buildContent() {
    final page = _page!;
    final section = _navSections[_section];
    final showHero = section == _Section.overview;

    return Scaffold(
      backgroundColor: AppColors.canvas,
      body: Stack(
        children: [
          CustomScrollView(
            slivers: [
              if (showHero)
                _HeroSliver(
                  page: page,
                  onBack: () => Navigator.of(context).maybePop(),
                  onSave: _handleSave,
                )
              else
                SliverAppBar(
                  pinned: true,
                  backgroundColor: AppColors.canvas,
                  surfaceTintColor: AppColors.canvas,
                  elevation: 0,
                  scrolledUnderElevation: 0,
                  leading: IconButton(
                    icon: const Icon(Icons.arrow_back, color: AppColors.ink),
                    onPressed: () => Navigator.of(context).maybePop(),
                  ),
                  title: Text(page.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.title.copyWith(fontSize: 15)),
                  centerTitle: false,
                  bottom: PreferredSize(
                    preferredSize: const Size.fromHeight(1),
                    child: Container(height: 1, color: AppColors.border),
                  ),
                ),
              // Sticky segmented section nav
              SliverPersistentHeader(
                pinned: true,
                delegate: _SegNavHeader(
                  child: SegNav(
                    items: _navSections.map((s) => s.label).toList(),
                    index: _section,
                    onChanged: _onSectionTap,
                  ),
                ),
              ),
              SliverToBoxAdapter(child: _sectionBody(page, section)),
            ],
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: _registerBar(page),
          ),
        ],
      ),
    );
  }

  Widget _sectionBody(EventPageModel page, _Section section) {
    switch (section) {
      case _Section.schedule:
        return _paddedList(_scheduleWidgets(page));
      case _Section.speakers:
        return _paddedList(_speakerWidgets(page));
      case _Section.sponsors:
        return _paddedList(_sponsorWidgets(page));
      default:
        return _paddedList(_overviewWidgets(page));
    }
  }

  Widget _paddedList(List<Widget> children) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 110),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: children,
      ),
    );
  }

  // ── Overview ─────────────────────────────────────────────────────

  List<Widget> _overviewWidgets(EventPageModel page) {
    final w = <Widget>[];

    // Date row (with timezone)
    w.add(_InfoRow(
      icon: Icons.calendar_today_outlined,
      title: HubDates.longDate(page.startsAt),
      subtitle: _timeLine(page),
    ));
    w.add(const SizedBox(height: 12));

    // Venue row
    if (page.isOnline) {
      w.add(_InfoRow(
        icon: Icons.videocam_outlined,
        title: 'Online event',
        subtitle: (page.onlineUrl ?? '').isNotEmpty ? page.onlineUrl : null,
      ));
    } else {
      w.add(_InfoRow(
        icon: Icons.location_on_outlined,
        title: (page.venueName ?? '').isNotEmpty ? page.venueName! : 'Venue TBA',
        subtitle: _venueSub(page),
      ));
    }

    // Organizer card
    if ((page.organizerName ?? '').isNotEmpty) {
      w.add(const SizedBox(height: 16));
      w.add(_OrganizerCard(
        name: page.organizerName!,
        avatarUrl: page.organizerAvatarUrl,
        onFollow: () => showToast(context, 'Following ${page.organizerName}'),
      ));
    }

    // About (with read more)
    if (page.featureOn('about') && (page.description ?? '').isNotEmpty) {
      w.add(const SizedBox(height: 22));
      w.add(const SectionLabel('About'));
      w.add(const SizedBox(height: 8));
      w.add(_AboutBlock(
        text: page.description!,
        expanded: _aboutExpanded,
        onToggle: () => setState(() => _aboutExpanded = !_aboutExpanded),
      ));
    }

    // Who's attending
    if (_attendees.isNotEmpty) {
      w.add(const SizedBox(height: 22));
      w.add(const SectionLabel("Who's attending"));
      w.add(const SizedBox(height: 12));
      w.add(_AttendeeCluster(attendees: _attendees));
    }

    // Schedule preview (mini rows)
    if (page.featureOn('schedule') && _sessions.isNotEmpty) {
      w.add(const SizedBox(height: 22));
      w.add(_SectionHeader(
        label: 'Schedule',
        action: 'Full agenda',
        onAction: () => _jumpTo(_Section.schedule),
      ));
      w.add(const SizedBox(height: 10));
      w.add(_SchedulePreview(
        sessions: _sessions.take(3).toList(),
        onTap: (s) => _openSession(s.id, page.eventId),
      ));
    }

    // Speakers rail
    if (page.featureOn('speakers') && _speakers.isNotEmpty) {
      w.add(const SizedBox(height: 22));
      w.add(_SectionHeader(
        label: 'Speakers',
        action: 'All ${_speakers.length}',
        onAction: () => _jumpTo(_Section.speakers),
      ));
      w.add(const SizedBox(height: 12));
      w.add(_SpeakerRail(
        speakers: _speakers.take(10).toList(),
        onTap: (id) => _openSpeaker(id, page.eventId),
      ));
    }

    // Sponsors strip
    if (page.featureOn('sponsors') && _sponsors.isNotEmpty) {
      w.add(const SizedBox(height: 22));
      w.add(_SectionHeader(
        label: 'Sponsors',
        action: 'View all',
        onAction: () => _jumpTo(_Section.sponsors),
      ));
      w.add(const SizedBox(height: 12));
      w.add(_SponsorStrip(sponsors: _sponsors.take(6).toList()));
    }

    // Secondary "Make your card"
    w.add(const SizedBox(height: 22));
    w.add(MButton(
      'Make your card',
      kind: MBtnKind.sec,
      icon: Icons.badge_outlined,
      onTap: _handleRegister,
    ));

    return w;
  }

  void _jumpTo(_Section target) {
    final idx = _navSections.indexOf(target);
    if (idx >= 0) setState(() => _section = idx);
  }

  String? _timeLine(EventPageModel page) {
    final t = HubDates.range(page.startsAt, page.endsAt);
    final tz = (page.timezone ?? '').trim();
    // Prefer just the time portion + timezone if we can split it.
    final start = HubDates.time(page.startsAt);
    final end = HubDates.time(page.endsAt);
    String base;
    if (start.isEmpty) {
      base = '';
    } else if (end.isEmpty) {
      base = start;
    } else {
      base = '$start – $end';
    }
    if (base.isEmpty) return tz.isEmpty ? null : tz;
    return tz.isEmpty ? base : '$base · $tz';
  }

  String? _venueSub(EventPageModel page) {
    final parts = <String>[
      if ((page.city ?? '').isNotEmpty) page.city!,
      if ((page.country ?? '').isNotEmpty) page.country!,
    ];
    final geo = parts.join(', ');
    if (geo.isEmpty) return 'In person';
    return '$geo · In person';
  }

  // ── Schedule (full) ──────────────────────────────────────────────

  List<Widget> _scheduleWidgets(EventPageModel page) {
    final w = <Widget>[];
    w.add(SectionLabel('${_sessions.length} sessions'));
    w.add(const SizedBox(height: 12));
    for (var i = 0; i < _sessions.length; i++) {
      final s = _sessions[i];
      w.add(_ScheduleCard(
        session: s,
        accentGold: i.isEven,
        onTap: () => _openSession(s.id, page.eventId),
      ));
      if (i != _sessions.length - 1) w.add(const SizedBox(height: 12));
    }
    return w;
  }

  // ── Speakers (full grid) ─────────────────────────────────────────

  List<Widget> _speakerWidgets(EventPageModel page) {
    return [
      SectionLabel('${_speakers.length} speakers'),
      const SizedBox(height: 14),
      _SpeakerGrid(
        speakers: _speakers,
        onTap: (id) => _openSpeaker(id, page.eventId),
      ),
    ];
  }

  // ── Sponsors (full, grouped by tier) ─────────────────────────────

  List<Widget> _sponsorWidgets(EventPageModel page) {
    final groups = <String, List<SponsorSummary>>{};
    for (final s in _sponsors) {
      final tier = (s.tier ?? '').trim().isEmpty ? 'Sponsors' : s.tier!.trim();
      groups.putIfAbsent(tier, () => []).add(s);
    }
    final w = <Widget>[];
    var first = true;
    groups.forEach((tier, list) {
      if (!first) w.add(const SizedBox(height: 20));
      first = false;
      w.add(Tag(_titleCase(tier), kind: TagKind.gold));
      w.add(const SizedBox(height: 12));
      for (var i = 0; i < list.length; i++) {
        w.add(_SponsorCard(
          sponsor: list[i],
          onTap: () => _openSponsor(list[i].id, page.eventId),
        ));
        if (i != list.length - 1) w.add(const SizedBox(height: 10));
      }
    });
    return w;
  }

  String _titleCase(String s) => s.isEmpty
      ? s
      : s[0].toUpperCase() + s.substring(1).toLowerCase();

  // ── Register bar ─────────────────────────────────────────────────

  Widget _registerBar(EventPageModel page) {
    final registered = _regId != null;
    return StickyCta(children: [
      MButton(
        '',
        kind: MBtnKind.sec,
        icon: Icons.bookmark_border,
        fullWidth: false,
        onTap: _handleSave,
      ),
      const SizedBox(width: 10),
      Expanded(
        child: MButton(
          registered ? 'Registered' : 'Get ticket',
          icon: registered ? Icons.check : null,
          onTap: _handleRegister,
        ),
      ),
    ]);
  }
}

// ============================ SegNav header ============================

class _SegNavHeader extends SliverPersistentHeaderDelegate {
  final Widget child;
  _SegNavHeader({required this.child});

  @override
  double get minExtent => 46;
  @override
  double get maxExtent => 46;

  @override
  Widget build(
          BuildContext context, double shrinkOffset, bool overlapsContent) =>
      child;

  @override
  bool shouldRebuild(covariant _SegNavHeader oldDelegate) =>
      oldDelegate.child != child;
}

// ============================ Section enum ============================

enum _Section { overview, schedule, speakers, sponsors, network, more }

extension _SectionLabelX on _Section {
  String get label {
    switch (this) {
      case _Section.overview:
        return 'Overview';
      case _Section.schedule:
        return 'Schedule';
      case _Section.speakers:
        return 'Speakers';
      case _Section.sponsors:
        return 'Sponsors';
      case _Section.network:
        return 'Network';
      case _Section.more:
        return 'More';
    }
  }
}

// ============================ Hero ============================

class _HeroSliver extends StatelessWidget {
  final EventPageModel page;
  final VoidCallback onBack;
  final VoidCallback onSave;
  const _HeroSliver({
    required this.page,
    required this.onBack,
    required this.onSave,
  });

  @override
  Widget build(BuildContext context) {
    final cover = page.coverImageUrl;
    return SliverAppBar(
      expandedHeight: 230,
      pinned: false,
      backgroundColor: AppColors.forest,
      automaticallyImplyLeading: false,
      flexibleSpace: FlexibleSpaceBar(
        background: Stack(
          fit: StackFit.expand,
          children: [
            if (cover != null && cover.isNotEmpty)
              Image.network(
                cover,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) =>
                    PhotoPlaceholder(hue: hueFromString(page.id)),
                loadingBuilder: (ctx, child, prog) => prog == null
                    ? child
                    : PhotoPlaceholder(hue: hueFromString(page.id)),
              )
            else
              PhotoPlaceholder(hue: hueFromString(page.id)),
            const ScrimBottom(),
            // Floating translucent actions
            Positioned(
              top: MediaQuery.of(context).padding.top + 8,
              left: 12,
              right: 12,
              child: Row(
                children: [
                  _GlassAction(icon: Icons.arrow_back, onTap: onBack),
                  const Spacer(),
                  _GlassAction(icon: Icons.bookmark_border, onTap: onSave),
                  const SizedBox(width: 8),
                  _GlassAction(
                      icon: Icons.ios_share,
                      onTap: () => showToast(context, 'Share link copied')),
                ],
              ),
            ),
            // Title block
            Positioned(
              left: 20,
              right: 20,
              bottom: 16,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if ((page.category ?? '').isNotEmpty) ...[
                    Tag(page.category!, kind: TagKind.gold),
                    const SizedBox(height: 10),
                  ],
                  Text(
                    page.title,
                    style: AppText.h1.copyWith(color: Colors.white, fontSize: 26),
                  ),
                  if ((page.tagline ?? '').isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(
                      page.tagline!,
                      style: AppText.bodySm.copyWith(
                          color: Colors.white.withValues(alpha: 0.82)),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _GlassAction extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  const _GlassAction({required this.icon, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          color: const Color(0xFF08120C).withValues(alpha: 0.42),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, size: 19, color: Colors.white),
      ),
    );
  }
}

// ============================ Info row ============================

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  const _InfoRow({required this.icon, required this.title, this.subtitle});
  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 1),
          child: Icon(icon, size: 17, color: AppColors.forest),
        ),
        const SizedBox(width: 9),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: AppText.bodyStrong.copyWith(fontSize: 14)),
              if (subtitle != null && subtitle!.isNotEmpty) ...[
                const SizedBox(height: 1),
                Text(subtitle!,
                    style: AppText.caption.copyWith(fontSize: 11.5)),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

// ============================ Organizer ============================

class _OrganizerCard extends StatelessWidget {
  final String name;
  final String? avatarUrl;
  final VoidCallback onFollow;
  const _OrganizerCard(
      {required this.name, required this.avatarUrl, required this.onFollow});
  @override
  Widget build(BuildContext context) {
    return MCard(
      padding: const EdgeInsets.all(12),
      child: Row(
        children: [
          Avatar(name: name, imageUrl: avatarUrl, size: 40),
          const SizedBox(width: 11),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: AppText.h3.copyWith(fontSize: 14)),
                const SizedBox(height: 1),
                Text('Organizer', style: AppText.caption.copyWith(fontSize: 11.5)),
              ],
            ),
          ),
          MButton('Follow',
              kind: MBtnKind.sec, small: true, fullWidth: false, onTap: onFollow),
        ],
      ),
    );
  }
}

// ============================ About ============================

class _AboutBlock extends StatelessWidget {
  final String text;
  final bool expanded;
  final VoidCallback onToggle;
  const _AboutBlock(
      {required this.text, required this.expanded, required this.onToggle});
  @override
  Widget build(BuildContext context) {
    final isLong = text.length > 220;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          text,
          maxLines: expanded ? null : 4,
          overflow: expanded ? TextOverflow.visible : TextOverflow.ellipsis,
          style: AppText.body,
        ),
        if (isLong)
          GestureDetector(
            onTap: onToggle,
            child: Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Text(expanded ? 'Read less' : 'Read more',
                  style: AppText.bodyStrong.copyWith(color: AppColors.forest)),
            ),
          ),
      ],
    );
  }
}

// ============================ Attendee cluster ============================

class _AttendeeCluster extends StatelessWidget {
  final List<AttendeeAvatar> attendees;
  const _AttendeeCluster({required this.attendees});
  @override
  Widget build(BuildContext context) {
    final shown = attendees.take(3).toList();
    final overflow = attendees.length - shown.length;
    const overlap = 26.0;
    final avatars = <Widget>[];
    for (var i = 0; i < shown.length; i++) {
      avatars.add(Positioned(
        left: i * overlap,
        child: Container(
          decoration: const BoxDecoration(
            shape: BoxShape.circle,
            border: Border.fromBorderSide(
                BorderSide(color: AppColors.canvas, width: 2)),
          ),
          child: Avatar(
              name: shown[i].name, imageUrl: shown[i].avatarUrl, size: 40),
        ),
      ));
    }
    avatars.add(Positioned(
      left: shown.length * overlap,
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: AppColors.forestSoft,
          shape: BoxShape.circle,
          border: Border.all(color: AppColors.canvas, width: 2),
        ),
        alignment: Alignment.center,
        child: Text(overflow > 0 ? '+$overflow' : '+',
            style: AppText.bodySm.copyWith(
                color: AppColors.forest, fontWeight: FontWeight.w600)),
      ),
    ));

    final clusterWidth = shown.length * overlap + 40;
    return Row(
      children: [
        SizedBox(
          width: clusterWidth,
          height: 44,
          child: Stack(children: avatars),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: RichText(
            text: TextSpan(
              style: AppText.bodySm,
              children: [
                TextSpan(
                    text: '${attendees.length} ',
                    style: AppText.numSm.copyWith(
                        color: AppColors.ink, fontWeight: FontWeight.w500)),
                const TextSpan(text: 'people going'),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

// ============================ Section header w/ action ============================

class _SectionHeader extends StatelessWidget {
  final String label;
  final String action;
  final VoidCallback onAction;
  const _SectionHeader(
      {required this.label, required this.action, required this.onAction});
  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Expanded(child: SectionLabel(label)),
        GestureDetector(
          onTap: onAction,
          child: Text('$action →',
              style: AppText.bodySm.copyWith(
                  color: AppColors.forest, fontWeight: FontWeight.w600)),
        ),
      ],
    );
  }
}

// ============================ Schedule preview (mini rows) ============================

class _SchedulePreview extends StatelessWidget {
  final List<SessionSummary> sessions;
  final void Function(SessionSummary) onTap;
  const _SchedulePreview({required this.sessions, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: AppColors.border),
        boxShadow: AppShadow.soft,
      ),
      child: Column(
        children: [
          for (var i = 0; i < sessions.length; i++)
            InkWell(
              onTap: () => onTap(sessions[i]),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 13),
                decoration: BoxDecoration(
                  border: i == 0
                      ? null
                      : const Border(
                          top: BorderSide(color: AppColors.border)),
                ),
                child: Row(
                  children: [
                    SizedBox(
                      width: 44,
                      child: Text(
                        HubDates.time(sessions[i].startsAt),
                        style: AppText.numSm.copyWith(
                            color: AppColors.inkMuted, fontSize: 12),
                      ),
                    ),
                    Container(
                      width: 7,
                      height: 7,
                      margin: const EdgeInsets.only(right: 12),
                      decoration: BoxDecoration(
                        color: i.isEven ? AppColors.gold : AppColors.forest,
                        shape: BoxShape.circle,
                      ),
                    ),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(sessions[i].title,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: AppText.subhead.copyWith(fontSize: 13.5)),
                          if ((sessions[i].room ?? '').isNotEmpty) ...[
                            const SizedBox(height: 1),
                            Text(sessions[i].room!,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: AppText.caption.copyWith(fontSize: 11)),
                          ],
                        ],
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
}

// ============================ Schedule card (full) ============================

class _ScheduleCard extends StatelessWidget {
  final SessionSummary session;
  final bool accentGold;
  final VoidCallback onTap;
  const _ScheduleCard(
      {required this.session, required this.accentGold, required this.onTap});
  @override
  Widget build(BuildContext context) {
    final when = HubDates.time(session.startsAt);
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppRadius.card),
      child: Container(
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
              Container(
                width: 3,
                decoration: BoxDecoration(
                  color: accentGold ? AppColors.gold : AppColors.forest,
                  borderRadius: const BorderRadius.horizontal(
                      left: Radius.circular(AppRadius.card)),
                ),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(15),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (when.isNotEmpty)
                        Text(when,
                            style: AppText.numSm.copyWith(
                                color: AppColors.inkMuted, fontSize: 11)),
                      if (when.isNotEmpty) const SizedBox(height: 4),
                      Text(session.title,
                          style: AppText.h3.copyWith(fontSize: 15)),
                      if ((session.room ?? '').isNotEmpty ||
                          (session.track ?? '').isNotEmpty) ...[
                        const SizedBox(height: 6),
                        Text(
                          [session.track, session.room]
                              .where((e) => (e ?? '').isNotEmpty)
                              .join(' · '),
                          style: AppText.caption,
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ============================ Speaker rail (overview) ============================

class _SpeakerRail extends StatelessWidget {
  final List<SpeakerSummary> speakers;
  final void Function(String id) onTap;
  const _SpeakerRail({required this.speakers, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 118,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: speakers.length,
        separatorBuilder: (_, __) => const SizedBox(width: 14),
        itemBuilder: (_, i) {
          final sp = speakers[i];
          return GestureDetector(
            onTap: () => onTap(sp.id),
            child: SizedBox(
              width: 72,
              child: Column(
                children: [
                  _speakerAvatar(sp, 72),
                  const SizedBox(height: 7),
                  Text(sp.name,
                      maxLines: 1,
                      textAlign: TextAlign.center,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.subhead.copyWith(fontSize: 12)),
                  if ((sp.company ?? '').isNotEmpty)
                    Text(sp.company!,
                        maxLines: 1,
                        textAlign: TextAlign.center,
                        overflow: TextOverflow.ellipsis,
                        style: AppText.caption.copyWith(fontSize: 10)),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

// ============================ Speaker grid (full) ============================

class _SpeakerGrid extends StatelessWidget {
  final List<SpeakerSummary> speakers;
  final void Function(String id) onTap;
  const _SpeakerGrid({required this.speakers, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: EdgeInsets.zero,
      itemCount: speakers.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 14,
        childAspectRatio: 0.82,
      ),
      itemBuilder: (_, i) {
        final sp = speakers[i];
        return GestureDetector(
          onTap: () => onTap(sp.id),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              AspectRatio(
                aspectRatio: 1,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: _speakerSquare(sp),
                ),
              ),
              const SizedBox(height: 9),
              Text(sp.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.h3.copyWith(fontSize: 14)),
              if (sp.roleLine.isNotEmpty) ...[
                const SizedBox(height: 1),
                Text(sp.roleLine,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.caption.copyWith(fontSize: 11.5)),
              ],
            ],
          ),
        );
      },
    );
  }
}

Widget _speakerAvatar(SpeakerSummary sp, double size) {
  final url = sp.photoUrl;
  if (url != null && url.isNotEmpty) {
    return ClipOval(
      child: SizedBox(
        width: size,
        height: size,
        child: Image.network(
          url,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) =>
              Avatar(name: sp.name, size: size),
        ),
      ),
    );
  }
  return Avatar(name: sp.name, size: size);
}

Widget _speakerSquare(SpeakerSummary sp) {
  final url = sp.photoUrl;
  if (url != null && url.isNotEmpty) {
    return Image.network(
      url,
      fit: BoxFit.cover,
      errorBuilder: (_, __, ___) => PhotoPlaceholder(hue: hueFromString(sp.id)),
      loadingBuilder: (ctx, child, prog) =>
          prog == null ? child : PhotoPlaceholder(hue: hueFromString(sp.id)),
    );
  }
  return PhotoPlaceholder(hue: hueFromString(sp.id));
}

// ============================ Sponsor strip (overview) ============================

class _SponsorStrip extends StatelessWidget {
  final List<SponsorSummary> sponsors;
  const _SponsorStrip({required this.sponsors});
  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: sponsors.map((s) {
        return Container(
          constraints: const BoxConstraints(minWidth: 88),
          height: 56,
          padding: const EdgeInsets.symmetric(horizontal: 14),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.border),
          ),
          child: (s.logoUrl != null && s.logoUrl!.isNotEmpty)
              ? Image.network(
                  s.logoUrl!,
                  height: 28,
                  fit: BoxFit.contain,
                  errorBuilder: (_, __, ___) => _sponsorName(s),
                )
              : _sponsorName(s),
        );
      }).toList(),
    );
  }

  Widget _sponsorName(SponsorSummary s) => Text(
        s.companyName,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: AppText.h3.copyWith(color: AppColors.inkSoft, fontSize: 14),
      );
}

// ============================ Sponsor card (full) ============================

class _SponsorCard extends StatelessWidget {
  final SponsorSummary sponsor;
  final VoidCallback onTap;
  const _SponsorCard({required this.sponsor, required this.onTap});
  @override
  Widget build(BuildContext context) {
    final logo = sponsor.logoUrl;
    return MCard(
      onTap: onTap,
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppColors.forestSoft,
              borderRadius: BorderRadius.circular(10),
            ),
            clipBehavior: Clip.antiAlias,
            alignment: Alignment.center,
            child: (logo != null && logo.isNotEmpty)
                ? Image.network(
                    logo,
                    fit: BoxFit.contain,
                    errorBuilder: (_, __, ___) => _initial(),
                    loadingBuilder: (ctx, child, prog) =>
                        prog == null ? child : _initial(),
                  )
                : _initial(),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(sponsor.companyName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.h3.copyWith(fontSize: 16)),
                if ((sponsor.tagline ?? '').isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(sponsor.tagline!,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.caption.copyWith(fontSize: 12)),
                ],
              ],
            ),
          ),
          const Icon(Icons.chevron_right, color: AppColors.inkMuted, size: 20),
        ],
      ),
    );
  }

  Widget _initial() => Text(
        sponsor.companyName.isNotEmpty
            ? sponsor.companyName[0].toUpperCase()
            : '?',
        style: AppText.h3.copyWith(color: AppColors.forest, fontSize: 20),
      );
}
