import 'package:flutter/material.dart';

import '../../net.dart';
import '../../ui/tokens.dart';
import '../../ui/components.dart';

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
              'id, event_page_id, created_at, event_pages(id, title, cover_image_url, starts_at, ends_at, venue_name, city, is_online)')
          .eq('user_id', currentUserId as Object)
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

  Widget _tile(_Saved s) {
    return MCard(
      padding: const EdgeInsets.all(13),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: SizedBox(
              width: 64,
              height: 64,
              child: (s.coverUrl != null && s.coverUrl!.isNotEmpty)
                  ? Image.network(
                      s.coverUrl!,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) =>
                          PhotoPlaceholder(hue: hueFromString(s.title)),
                    )
                  : PhotoPlaceholder(hue: hueFromString(s.title)),
            ),
          ),
          const SizedBox(width: 13),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(s.title,
                    style: AppText.h3.copyWith(fontSize: 15),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis),
                const SizedBox(height: 4),
                Text(_metaLine(s),
                    style: AppText.numSm
                        .copyWith(fontSize: 11.5, color: AppColors.inkMuted)),
                if (s.location.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Tag(s.location, kind: TagKind.forest),
                ],
              ],
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: () => _unsave(s),
            behavior: HitTestBehavior.opaque,
            child: const Padding(
              padding: EdgeInsets.all(4),
              child: Icon(Icons.bookmark, size: 22, color: AppColors.forest),
            ),
          ),
        ],
      ),
    );
  }

  String _metaLine(_Saved s) {
    final date = _Dates.compact(s.startsAt);
    if (s.isOnline) {
      return date;
    }
    return date;
  }
}

// ─── model ──────────────────────────────────────────────────────────────────

class _Saved {
  final String id; // saved_events row id
  final String title;
  final String? coverUrl;
  final DateTime? startsAt;
  final DateTime? endsAt;
  final String location;
  final bool isOnline;

  _Saved({
    required this.id,
    required this.title,
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
    return _Saved(
      id: asString(r['id']),
      title: asString(page['title'], 'Event'),
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
