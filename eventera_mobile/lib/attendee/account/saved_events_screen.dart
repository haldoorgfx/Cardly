import 'dart:ui' as ui;

import 'package:flutter/material.dart';

import '../../net.dart';
import '../../ui/tokens.dart';
import '../../ui/components.dart';
import '../event_landing_screen.dart';

/// The signed-in attendee's saved / bookmarked events.
///
/// Reads `saved_events` (own-row RLS: auth.uid() = user_id) joined with
/// `event_pages` for display. Verified against migration 010_attendee_accounts
/// and app/api/account/saved/route.ts:
///   saved_events(id, user_id, event_page_id, created_at)
///   event_pages(id, title, cover_image_url, starts_at, ends_at, venue_name,
///               city, is_online)
/// Un-save deletes the row.
class SavedEventsScreen extends StatefulWidget {
  final VoidCallback? onSignInTap;
  const SavedEventsScreen({super.key, this.onSignInTap});

  @override
  State<SavedEventsScreen> createState() => _SavedEventsScreenState();
}

class _SavedEventsScreenState extends State<SavedEventsScreen> {
  bool _loading = true;
  String? _error;
  List<_Saved> _items = [];

  @override
  void initState() {
    super.initState();
    if (isSignedIn) {
      _load();
    } else {
      _loading = false;
    }
  }

  Future<void> _load() async {
    if (!isSignedIn) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final rows = await supa
          .from('saved_events')
          .select(
              'id, event_page_id, created_at, event_pages(id, title, custom_slug, cover_image_url, starts_at, ends_at, venue_name, city, is_online, events(slug))')
          .eq('user_id', currentUserId ?? '')
          .order('created_at', ascending: false);
      if (!mounted) return;
      setState(() {
        _items = asMapList(rows).map(_Saved.fromRow).toList();
        _loading = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.message;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Something went wrong loading your saved events.';
      });
    }
  }

  Future<void> _unsave(_Saved s) async {
    // Optimistic remove.
    final index = _items.indexOf(s);
    setState(() => _items.remove(s));
    try {
      await supa.from('saved_events').delete().eq('id', s.id);
      if (!mounted) return;
      showToast(context, 'Removed from saved');
    } catch (_) {
      if (!mounted) return;
      setState(() => _items.insert(index.clamp(0, _items.length), s));
      showToast(context, 'Could not remove that event');
    }
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: const MAppBar(title: 'Saved events', hairline: true),
      body: !isSignedIn
          ? _SignInPrompt(
              message: 'Sign in to see the events you\'ve saved.',
              onSignInTap: widget.onSignInTap)
          : _loading
              ? const LoadingState()
              : _error != null
                  ? ErrorStateView(message: _error!, onRetry: _load)
                  : RefreshIndicator(
                      color: AppColors.forest,
                      onRefresh: _load,
                      child: _buildList(),
                    ),
    );
  }

  Widget _buildList() {
    if (_items.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: const [
          SizedBox(height: 100),
          EmptyState(
            icon: Icons.bookmark_border,
            title: 'Nothing saved yet',
            message: 'You haven\'t saved any events yet.',
          ),
        ],
      );
    }
    return ListView.separated(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(AppSpace.lg, AppSpace.base, AppSpace.lg, 40),
      itemCount: _items.length,
      separatorBuilder: (_, __) => const SizedBox(height: 14),
      itemBuilder: (context, i) => _tile(_items[i]),
    );
  }

  void _open(_Saved s) {
    final slug = s.slug;
    if (slug.isEmpty) return;
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => EventLandingScreen(slug: slug)),
    );
  }

  Widget _tile(_Saved s) {
    final hasCover = s.coverUrl != null && s.coverUrl!.isNotEmpty;
    return MCard(
      onTap: s.slug.isEmpty ? null : () => _open(s),
      padding: EdgeInsets.zero,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(AppRadius.card),
        child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Cover image with scrim, location tag + bookmark ──
          SizedBox(
            height: 120,
            width: double.infinity,
            child: Stack(
              fit: StackFit.expand,
              children: [
                hasCover
                    ? Image.network(
                        s.coverUrl!,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) =>
                            PhotoPlaceholder(hue: hueFromString(s.title)),
                      )
                    : PhotoPlaceholder(hue: hueFromString(s.title)),
                // Bottom scrim gradient.
                const Positioned.fill(
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.transparent,
                          Color(0xB80D1F17), // forestDark @ ~72%
                        ],
                        stops: [0.45, 1.0],
                      ),
                    ),
                  ),
                ),
                // Location / category tag, top-left.
                if (s.location.isNotEmpty)
                  Positioned(
                    top: 10,
                    left: 10,
                    child: Tag(s.location, kind: TagKind.forest),
                  ),
                // Filled bookmark in a translucent blurred circle, top-right.
                Positioned(
                  top: 10,
                  right: 10,
                  child: _BookmarkButton(onTap: () => _unsave(s)),
                ),
              ],
            ),
          ),
          // ── Title + date below the cover ──
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(s.title,
                    style: AppText.h3,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis),
                const SizedBox(height: 6),
                Row(
                  children: [
                    const Icon(Icons.calendar_today_outlined,
                        size: 14, color: AppColors.inkMuted),
                    const SizedBox(width: 6),
                    Text(
                      _Dates.compact(s.startsAt),
                      style: AppText.numSm.copyWith(color: AppColors.inkMuted),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
        ),
      ),
    );
  }
}

class _BookmarkButton extends StatelessWidget {
  final VoidCallback onTap;
  const _BookmarkButton({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: ClipOval(
        child: BackdropFilter(
          filter: ui.ImageFilter.blur(sigmaX: 8, sigmaY: 8),
          child: Container(
            width: 36,
            height: 36,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.22),
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white.withValues(alpha: 0.35)),
            ),
            child: const Icon(Icons.bookmark, size: 18, color: Colors.white),
          ),
        ),
      ),
    );
  }
}

// ─── model ──────────────────────────────────────────────────────────────────

class _Saved {
  final String id; // saved_events row id
  final String title;
  final String slug; // custom_slug ?? events.slug (for opening the page)
  final String? coverUrl;
  final DateTime? startsAt;
  final DateTime? endsAt;
  final String location;
  final bool isOnline;

  _Saved({
    required this.id,
    required this.title,
    required this.slug,
    required this.coverUrl,
    required this.startsAt,
    required this.endsAt,
    required this.location,
    required this.isOnline,
  });

  factory _Saved.fromRow(Map<String, dynamic> r) {
    final ep = r['event_pages'];
    final page = (ep is Map) ? Map<String, dynamic>.from(ep) : <String, dynamic>{};
    final online = asBool(page['is_online']);
    final venue = asString(page['venue_name']).trim();
    final city = asString(page['city']).trim();
    String location;
    if (online) {
      location = 'Online event';
    } else if (city.isNotEmpty) {
      location = city;
    } else {
      location = venue;
    }
    // Prefer the page's custom_slug; fall back to the linked event's slug.
    final custom = asString(page['custom_slug']).trim();
    final ev = page['events'];
    final evMap =
        (ev is Map) ? Map<String, dynamic>.from(ev) : <String, dynamic>{};
    final eventSlug = asString(evMap['slug']).trim();
    return _Saved(
      id: asString(r['id']),
      title: asString(page['title'], 'Event'),
      slug: custom.isNotEmpty ? custom : eventSlug,
      coverUrl: page['cover_image_url'] == null
          ? null
          : asString(page['cover_image_url']),
      startsAt: asDate(page['starts_at']),
      endsAt: asDate(page['ends_at']),
      location: location,
      isOnline: online,
    );
  }
}

class _Dates {
  static const _months = [
    'Jan','Feb','Mar','Apr','May','Jun',
    'Jul','Aug','Sep','Oct','Nov','Dec'
  ];

  static String compact(DateTime? start) {
    if (start == null) return 'Date TBA';
    final l = start.toLocal();
    return '${l.day} ${_months[l.month - 1]}';
  }
}

// ─── local widgets ──────────────────────────────────────────────────────────

class _SignInPrompt extends StatelessWidget {
  final String message;
  final VoidCallback? onSignInTap;
  const _SignInPrompt({required this.message, this.onSignInTap});
  @override
  Widget build(BuildContext context) {
    return EmptyState(
      icon: Icons.lock_outline,
      title: 'Sign in required',
      message: message,
      ctaLabel: onSignInTap != null ? 'Sign in' : null,
      onCta: onSignInTap,
    );
  }
}
