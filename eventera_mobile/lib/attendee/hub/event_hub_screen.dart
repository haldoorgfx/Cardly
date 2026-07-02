import 'package:flutter/material.dart';

import '../../net.dart';
import '../../theme.dart';
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

      setState(() {
        _page = page;
        _loading = false;
      });
    } on ApiException catch (e) {
      setState(() {
        _loading = false;
        _error = e.message;
      });
    } catch (e) {
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

  void _handleRegister() {
    if (widget.onRegister != null) {
      widget.onRegister!();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Registration is not available here yet.')),
      );
    }
  }

  void _handleSave() {
    if (!isSignedIn) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Sign in to save this event.')),
      );
      return;
    }
    if (widget.onSave != null) {
      widget.onSave!();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Saved.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Brand.cream,
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Brand.forest))
          : _error != null
              ? _errorState()
              : _buildContent(),
    );
  }

  Widget _errorState() {
    return SafeArea(
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, color: Brand.danger, size: 44),
              const SizedBox(height: 12),
              Text(
                _error!,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 15, color: Brand.inkSoft),
              ),
              const SizedBox(height: 16),
              FilledButton(onPressed: _load, child: const Text('Try again')),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildContent() {
    final page = _page!;
    return Stack(
      children: [
        CustomScrollView(
          slivers: [
            _HeroSliver(
              page: page,
              onBack: () => Navigator.of(context).maybePop(),
              onSave: _handleSave,
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 120),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: _sections(page),
                ),
              ),
            ),
          ],
        ),
        Positioned(
          left: 0,
          right: 0,
          bottom: 0,
          child: _RegisterBar(onRegister: _handleRegister),
        ),
      ],
    );
  }

  List<Widget> _sections(EventPageModel page) {
    final widgets = <Widget>[];

    // Title + meta block
    if ((page.category ?? '').isNotEmpty) {
      widgets.add(_Pill(text: page.category!));
      widgets.add(const SizedBox(height: 12));
    }
    widgets.add(Text(
      page.title,
      style: const TextStyle(
        fontSize: 28,
        height: 1.15,
        fontWeight: FontWeight.w700,
        color: Brand.ink,
      ),
    ));
    if ((page.tagline ?? '').isNotEmpty) {
      widgets.add(const SizedBox(height: 8));
      widgets.add(Text(
        page.tagline!,
        style: const TextStyle(fontSize: 16, color: Brand.inkSoft, height: 1.4),
      ));
    }
    widgets.add(const SizedBox(height: 18));
    widgets.add(_MetaRow(
      icon: Icons.calendar_today_outlined,
      text: HubDates.range(page.startsAt, page.endsAt),
    ));
    if ((page.timezone ?? '').isNotEmpty) {
      widgets.add(const SizedBox(height: 8));
      widgets.add(_MetaRow(icon: Icons.public, text: page.timezone!));
    }
    widgets.add(const SizedBox(height: 8));
    if (page.isOnline) {
      widgets.add(_MetaRow(
        icon: Icons.videocam_outlined,
        text: (page.onlineUrl ?? '').isNotEmpty
            ? 'Online · ${page.onlineUrl}'
            : 'Online event',
      ));
    } else {
      widgets.add(_MetaRow(
        icon: Icons.location_on_outlined,
        text: page.locationLine,
      ));
    }

    // Organizer
    if ((page.organizerName ?? '').isNotEmpty) {
      widgets.add(const SizedBox(height: 18));
      widgets.add(_OrganizerRow(
        name: page.organizerName!,
        avatarUrl: page.organizerAvatarUrl,
      ));
    }

    // About
    if (page.featureOn('about') && (page.description ?? '').isNotEmpty) {
      widgets.add(const _SectionGap());
      widgets.add(const _SectionLabel('About'));
      widgets.add(const SizedBox(height: 10));
      widgets.add(Text(
        page.description!,
        style: const TextStyle(fontSize: 15, height: 1.6, color: Brand.inkSoft),
      ));
    }

    // Attendees strip
    if (_attendees.isNotEmpty) {
      widgets.add(const _SectionGap());
      widgets.add(_SectionLabel('${_attendees.length} attending'));
      widgets.add(const SizedBox(height: 12));
      widgets.add(_AttendeeStrip(attendees: _attendees));
    }

    // Schedule
    if (page.featureOn('schedule') && _sessions.isNotEmpty) {
      widgets.add(const _SectionGap());
      widgets.add(const _SectionLabel('Schedule'));
      widgets.add(const SizedBox(height: 12));
      for (final s in _sessions) {
        widgets.add(Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: _SessionCard(
            session: s,
            onTap: () => _openSession(s.id, page.eventId),
          ),
        ));
      }
    }

    // Speakers
    if (page.featureOn('speakers') && _speakers.isNotEmpty) {
      widgets.add(const _SectionGap());
      widgets.add(const _SectionLabel('Speakers'));
      widgets.add(const SizedBox(height: 12));
      widgets.add(_SpeakerGrid(
        speakers: _speakers,
        onTap: (id) => _openSpeaker(id, page.eventId),
      ));
    }

    // Sponsors
    if (page.featureOn('sponsors') && _sponsors.isNotEmpty) {
      widgets.add(const _SectionGap());
      widgets.add(const _SectionLabel('Sponsors'));
      widgets.add(const SizedBox(height: 12));
      for (final sp in _sponsors) {
        widgets.add(Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: _SponsorCard(
            sponsor: sp,
            onTap: () => _openSponsor(sp.id, page.eventId),
          ),
        ));
      }
    }

    return widgets;
  }

  void _openSession(String id, String? eventId) {
    if (eventId == null) return;
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => SessionDetailScreen(sessionId: id, eventId: eventId),
    ));
  }

  void _openSpeaker(String id, String? eventId) {
    if (eventId == null) return;
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => SpeakerDetailScreen(speakerId: id, eventId: eventId),
    ));
  }

  void _openSponsor(String id, String? eventId) {
    if (eventId == null) return;
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => SponsorDetailScreen(sponsorId: id, eventId: eventId),
    ));
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
      expandedHeight: 260,
      pinned: true,
      backgroundColor: Brand.forest,
      foregroundColor: Colors.white,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back),
        onPressed: onBack,
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.bookmark_border),
          tooltip: 'Save',
          onPressed: onSave,
        ),
        const SizedBox(width: 4),
      ],
      flexibleSpace: FlexibleSpaceBar(
        background: Stack(
          fit: StackFit.expand,
          children: [
            if (cover != null && cover.isNotEmpty)
              Image.network(
                cover,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => const _HeroGradient(),
                loadingBuilder: (ctx, child, prog) =>
                    prog == null ? child : const _HeroGradient(),
              )
            else
              const _HeroGradient(),
            DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withValues(alpha: 0.15),
                    Colors.black.withValues(alpha: 0.35),
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

class _HeroGradient extends StatelessWidget {
  const _HeroGradient();
  @override
  Widget build(BuildContext context) => const DecoratedBox(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Brand.forest, Color(0xFF2A6A50), Brand.gold],
          ),
        ),
      );
}

// ============================ Register bar ============================

class _RegisterBar extends StatelessWidget {
  final VoidCallback onRegister;
  const _RegisterBar({required this.onRegister});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(
          20, 12, 20, 12 + MediaQuery.of(context).padding.bottom),
      decoration: const BoxDecoration(
        color: Brand.surface,
        border: Border(top: BorderSide(color: Brand.border)),
      ),
      child: SizedBox(
        width: double.infinity,
        child: FilledButton(
          onPressed: onRegister,
          child: const Text('Register'),
        ),
      ),
    );
  }
}

// ============================ Attendee strip ============================

class _AttendeeStrip extends StatelessWidget {
  final List<AttendeeAvatar> attendees;
  const _AttendeeStrip({required this.attendees});

  @override
  Widget build(BuildContext context) {
    final shown = attendees.take(24).toList();
    return SizedBox(
      height: 44,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: shown.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (_, i) => _CircleAvatar(
          url: shown[i].avatarUrl,
          name: shown[i].name,
          size: 40,
        ),
      ),
    );
  }
}

// ============================ Session card ============================

class _SessionCard extends StatelessWidget {
  final SessionSummary session;
  final VoidCallback onTap;
  const _SessionCard({required this.session, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final when = HubDates.time(session.startsAt);
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Brand.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Brand.border),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      if (when.isNotEmpty) ...[
                        Text(
                          when,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: Brand.forest,
                          ),
                        ),
                        const SizedBox(width: 8),
                      ],
                      if ((session.track ?? '').isNotEmpty)
                        Flexible(
                          child: Text(
                            session.track!,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 12,
                              color: Brand.muted,
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    session.title,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: Brand.ink,
                    ),
                  ),
                  if ((session.room ?? '').isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      session.room!,
                      style: const TextStyle(fontSize: 13, color: Brand.muted),
                    ),
                  ],
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: Brand.muted),
          ],
        ),
      ),
    );
  }
}

// ============================ Speaker grid ============================

class _SpeakerGrid extends StatelessWidget {
  final List<SpeakerSummary> speakers;
  final void Function(String id) onTap;
  const _SpeakerGrid({required this.speakers, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 12,
      runSpacing: 16,
      children: speakers.map((sp) {
        return SizedBox(
          width: 86,
          child: InkWell(
            onTap: () => onTap(sp.id),
            borderRadius: BorderRadius.circular(12),
            child: Column(
              children: [
                _CircleAvatar(url: sp.photoUrl, name: sp.name, size: 64),
                const SizedBox(height: 8),
                Text(
                  sp.name,
                  maxLines: 2,
                  textAlign: TextAlign.center,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Brand.ink,
                  ),
                ),
                if (sp.roleLine.isNotEmpty)
                  Text(
                    sp.roleLine,
                    maxLines: 1,
                    textAlign: TextAlign.center,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 11, color: Brand.muted),
                  ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}

// ============================ Sponsor card ============================

class _SponsorCard extends StatelessWidget {
  final SponsorSummary sponsor;
  final VoidCallback onTap;
  const _SponsorCard({required this.sponsor, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final logo = sponsor.logoUrl;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Brand.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Brand.border),
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: Brand.cream,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Brand.border),
              ),
              clipBehavior: Clip.antiAlias,
              child: (logo != null && logo.isNotEmpty)
                  ? Image.network(
                      logo,
                      fit: BoxFit.contain,
                      errorBuilder: (_, __, ___) => const Icon(
                          Icons.business, color: Brand.muted, size: 22),
                      loadingBuilder: (ctx, child, prog) => prog == null
                          ? child
                          : const Icon(Icons.business,
                              color: Brand.muted, size: 22),
                    )
                  : const Icon(Icons.business, color: Brand.muted, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          sponsor.companyName,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: Brand.ink,
                          ),
                        ),
                      ),
                      if ((sponsor.tier ?? '').isNotEmpty) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: Brand.gold.withValues(alpha: 0.35),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text(
                            sponsor.tier!.toUpperCase(),
                            style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: Brand.ink,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  if ((sponsor.tagline ?? '').isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(
                      sponsor.tagline!,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 13, color: Brand.muted),
                    ),
                  ],
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: Brand.muted),
          ],
        ),
      ),
    );
  }
}

// ============================ Organizer ============================

class _OrganizerRow extends StatelessWidget {
  final String name;
  final String? avatarUrl;
  const _OrganizerRow({required this.name, required this.avatarUrl});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _CircleAvatar(url: avatarUrl, name: name, size: 40),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Organized by',
                style: TextStyle(fontSize: 12, color: Brand.muted)),
            const SizedBox(height: 2),
            Text(
              name,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Brand.ink,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

// ============================ Small shared widgets ============================

class _SectionGap extends StatelessWidget {
  const _SectionGap();
  @override
  Widget build(BuildContext context) => const SizedBox(height: 28);
}

class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel(this.text);
  @override
  Widget build(BuildContext context) => Text(
        text,
        style: const TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: Brand.forest,
        ),
      );
}

class _MetaRow extends StatelessWidget {
  final IconData icon;
  final String text;
  const _MetaRow({required this.icon, required this.text});
  @override
  Widget build(BuildContext context) => Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: Brand.forest),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(fontSize: 14, color: Brand.inkSoft),
            ),
          ),
        ],
      );
}

class _Pill extends StatelessWidget {
  final String text;
  const _Pill({required this.text});
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: Brand.forest.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(999),
        ),
        child: Text(
          text,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: Brand.forest,
          ),
        ),
      );
}

class _CircleAvatar extends StatelessWidget {
  final String? url;
  final String name;
  final double size;
  const _CircleAvatar({
    required this.url,
    required this.name,
    this.size = 40,
  });

  String get _initials {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts.first.isEmpty) return '?';
    if (parts.length == 1) return parts.first[0].toUpperCase();
    return (parts.first[0] + parts.last[0]).toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    final fallback = Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: const BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Brand.forest, Color(0xFF2A6A50)],
        ),
      ),
      child: Text(
        _initials,
        style: TextStyle(
          color: Colors.white,
          fontSize: size * 0.34,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
    if (url == null || url!.isEmpty) return fallback;
    return ClipOval(
      child: Image.network(
        url!,
        width: size,
        height: size,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => fallback,
        loadingBuilder: (ctx, child, prog) => prog == null ? child : fallback,
      ),
    );
  }
}
