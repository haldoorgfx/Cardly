import 'package:flutter/material.dart';

import '../../net.dart';
import '../../ui/components.dart';
import '../../ui/tokens.dart';
import '../auth/attendee_auth_screen.dart';
import '../event_landing_screen.dart';

/// Public profile for an organizer (mirrors the web `/o/[userId]`).
///
/// Shows the organizer's identity, bio, follower count, a follow/unfollow
/// button, and their upcoming + past public events. Reads:
///   profiles(id, full_name, avatar_url, bio, organization, city)
///   event_pages(... , events!inner(user_id, slug))  filtered by events.user_id
///   organizer_follows  for follower count + the viewer's follow state
class OrganizerProfileScreen extends StatefulWidget {
  final String organizerId;
  final String? initialName;
  const OrganizerProfileScreen({
    super.key,
    required this.organizerId,
    this.initialName,
  });

  @override
  State<OrganizerProfileScreen> createState() => _OrganizerProfileScreenState();
}

class _OrganizerProfileScreenState extends State<OrganizerProfileScreen> {
  bool _loading = true;
  String? _error;

  String _name = 'Organizer';
  String? _avatarUrl;
  String? _bio;
  String? _organization;
  String? _city;
  int _followers = 0;
  bool _following = false;
  bool _busyFollow = false;

  final List<_MiniEvent> _upcoming = [];
  final List<_MiniEvent> _past = [];

  @override
  void initState() {
    super.initState();
    _name = widget.initialName ?? 'Organizer';
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final id = widget.organizerId;

      final prof = await supa
          .from('profiles')
          .select('id, full_name, avatar_url, bio, organization, city')
          .eq('id', id)
          .maybeSingle();

      final eventRows = await supa
          .from('event_pages')
          .select(
              'id, title, cover_image_url, starts_at, ends_at, custom_slug, is_online, venue_name, city, events!inner(user_id, slug)')
          .eq('events.user_id', id)
          .eq('is_public', true)
          .order('starts_at', ascending: true);

      final followerRows = await supa
          .from('organizer_follows')
          .select('id')
          .eq('organizer_id', id);

      final events = asMapList(eventRows);

      // Whether the signed-in viewer already follows this organizer.
      var following = false;
      if (isSignedIn) {
        final mine = await supa
            .from('organizer_follows')
            .select('id')
            .eq('follower_id', currentUserId as Object)
            .eq('organizer_id', id);
        following = (mine as List).isNotEmpty;
      }

      final now = DateTime.now();
      _upcoming.clear();
      _past.clear();
      for (final row in events) {
        final e = _MiniEvent.fromRow(row);
        final ended = e.endsAt != null && e.endsAt!.isBefore(now);
        (ended ? _past : _upcoming).add(e);
      }
      // Past events read most-recent-first.
      _past.sort((a, b) => (b.startsAt ?? DateTime(0))
          .compareTo(a.startsAt ?? DateTime(0)));

      if (!mounted) return;
      setState(() {
        if (prof != null) {
          final n = asString(prof['full_name']).trim();
          if (n.isNotEmpty) _name = n;
          _avatarUrl = prof['avatar_url'] == null
              ? null
              : asString(prof['avatar_url']);
          _bio = asString(prof['bio']).trim().isEmpty
              ? null
              : asString(prof['bio']);
          _organization = asString(prof['organization']).trim().isEmpty
              ? null
              : asString(prof['organization']);
          _city = asString(prof['city']).trim().isEmpty
              ? null
              : asString(prof['city']);
        }
        _followers = followerRows.length;
        _following = following;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Could not load this organizer.';
      });
    }
  }

  Future<void> _toggleFollow() async {
    if (!isSignedIn) {
      final ok = await Navigator.of(context).push<bool>(
        MaterialPageRoute(builder: (_) => const AttendeeAuthScreen()),
      );
      if (ok != true) return;
      if (!mounted) return;
    }
    if (_busyFollow) return;
    setState(() => _busyFollow = true);
    final want = !_following;
    // Optimistic.
    setState(() {
      _following = want;
      _followers += want ? 1 : -1;
      if (_followers < 0) _followers = 0;
    });
    try {
      if (want) {
        await supa.from('organizer_follows').insert({
          'follower_id': currentUserId as Object,
          'organizer_id': widget.organizerId,
          'notify_new_events': true,
        });
      } else {
        await supa
            .from('organizer_follows')
            .delete()
            .eq('follower_id', currentUserId as Object)
            .eq('organizer_id', widget.organizerId);
      }
      if (mounted) showToast(context, want ? 'Following $_name' : 'Unfollowed');
    } catch (_) {
      // Revert.
      if (!mounted) return;
      setState(() {
        _following = !want;
        _followers += want ? -1 : 1;
        if (_followers < 0) _followers = 0;
      });
      showToast(context, 'Could not update follow.');
    } finally {
      if (mounted) setState(() => _busyFollow = false);
    }
  }

  void _openEvent(_MiniEvent e) {
    final slug = e.slug;
    if (slug.isEmpty) return;
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => EventLandingScreen(slug: slug)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: const MAppBar(title: 'Organizer', hairline: true),
      body: _loading
          ? const LoadingState()
          : _error != null
              ? ErrorStateView(message: _error!, onRetry: _load)
              : RefreshIndicator(
                  color: AppColors.forest,
                  onRefresh: _load,
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(
                        AppSpace.lg, AppSpace.base, AppSpace.lg, 40),
                    children: [
                      _header(),
                      const SizedBox(height: 22),
                      if (_upcoming.isNotEmpty) ...[
                        const SectionLabel('Upcoming events'),
                        const SizedBox(height: 12),
                        ..._upcoming.map(_eventCard),
                        const SizedBox(height: 10),
                      ],
                      if (_past.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        const SectionLabel('Past events'),
                        const SizedBox(height: 12),
                        ..._past.map(_eventCard),
                      ],
                      if (_upcoming.isEmpty && _past.isEmpty)
                        const Padding(
                          padding: EdgeInsets.only(top: 40),
                          child: EmptyState(
                            icon: Icons.event_busy_outlined,
                            title: 'No public events',
                            message:
                                'This organizer hasn\'t published any events yet.',
                          ),
                        ),
                    ],
                  ),
                ),
    );
  }

  Widget _header() {
    final subtitleParts = <String>[
      if (_organization != null) _organization!,
      if (_city != null) _city!,
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Avatar(name: _name, imageUrl: _avatarUrl, size: 68),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(_name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.h2),
                  if (subtitleParts.isNotEmpty) ...[
                    const SizedBox(height: 3),
                    Text(subtitleParts.join(' · '),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppText.bodySm
                            .copyWith(color: AppColors.inkMuted)),
                  ],
                  const SizedBox(height: 4),
                  Text(
                    '$_followers ${_followers == 1 ? 'follower' : 'followers'}',
                    style: AppText.numSm.copyWith(
                        color: AppColors.inkMuted, fontSize: 12),
                  ),
                ],
              ),
            ),
          ],
        ),
        if (_bio != null) ...[
          const SizedBox(height: 14),
          Text(_bio!, style: AppText.body.copyWith(height: 1.5)),
        ],
        const SizedBox(height: 16),
        MButton(
          _following ? 'Following' : 'Follow',
          kind: _following ? MBtnKind.sec : MBtnKind.forest,
          icon: _following ? Icons.check : Icons.add,
          loading: _busyFollow,
          onTap: _busyFollow ? null : _toggleFollow,
        ),
      ],
    );
  }

  Widget _eventCard(_MiniEvent e) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: GestureDetector(
        onTap: () => _openEvent(e),
        child: Container(
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(AppRadius.card),
            border: Border.all(color: AppColors.border),
            boxShadow: AppShadow.soft,
          ),
          clipBehavior: Clip.antiAlias,
          child: Row(
            children: [
              SizedBox(
                width: 84,
                height: 84,
                child: (e.coverUrl != null && e.coverUrl!.isNotEmpty)
                    ? Image.network(
                        e.coverUrl!,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) =>
                            PhotoPlaceholder(hue: hueFromString(e.id)),
                      )
                    : PhotoPlaceholder(hue: hueFromString(e.id)),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 13, vertical: 11),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(e.title,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: AppText.h3.copyWith(fontSize: 14.5)),
                      const SizedBox(height: 4),
                      if (e.startsAt != null)
                        Text(_formatDate(e.startsAt!),
                            style: AppText.numSm.copyWith(
                                color: AppColors.inkMuted, fontSize: 11.5)),
                      if (e.location != null) ...[
                        const SizedBox(height: 2),
                        Text(e.location!,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: AppText.bodySm.copyWith(
                                color: AppColors.inkMuted, fontSize: 11.5)),
                      ],
                    ],
                  ),
                ),
              ),
              const Padding(
                padding: EdgeInsets.only(right: 8),
                child: Icon(Icons.chevron_right,
                    color: AppColors.inkMuted, size: 18),
              ),
            ],
          ),
        ),
      ),
    );
  }

  static String _formatDate(DateTime d) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    final l = d.toLocal();
    return '${months[l.month - 1]} ${l.day}, ${l.year}';
  }
}

class _MiniEvent {
  final String id;
  final String title;
  final String? coverUrl;
  final DateTime? startsAt;
  final DateTime? endsAt;
  final String slug;
  final String? location;

  _MiniEvent({
    required this.id,
    required this.title,
    required this.coverUrl,
    required this.startsAt,
    required this.endsAt,
    required this.slug,
    required this.location,
  });

  factory _MiniEvent.fromRow(Map<String, dynamic> r) {
    final ev = r['events'];
    final Map<String, dynamic> event =
        ev is Map ? Map<String, dynamic>.from(ev) : {};
    final custom = asString(r['custom_slug']).trim();
    final evSlug = asString(event['slug']).trim();

    String? loc;
    if (asBool(r['is_online'])) {
      loc = 'Online';
    } else {
      final venue = asString(r['venue_name']).trim();
      final city = asString(r['city']).trim();
      loc = venue.isNotEmpty ? venue : (city.isNotEmpty ? city : null);
    }

    return _MiniEvent(
      id: asString(r['id']),
      title: asString(r['title'], 'Event'),
      coverUrl: r['cover_image_url'] == null
          ? null
          : asString(r['cover_image_url']),
      startsAt: asDate(r['starts_at']),
      endsAt: asDate(r['ends_at']),
      slug: custom.isNotEmpty ? custom : evSlug,
      location: loc,
    );
  }
}
