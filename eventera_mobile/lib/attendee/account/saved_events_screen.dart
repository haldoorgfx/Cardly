import 'package:flutter/material.dart';

import '../../net.dart';
import '../../theme.dart';

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
    if (isSignedIn) _load();
    else _loading = false;
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
      setState(() {
        _items = asMapList(rows).map(_Saved.fromRow).toList();
        _loading = false;
      });
    } on ApiException catch (e) {
      setState(() {
        _loading = false;
        _error = e.message;
      });
    } catch (_) {
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
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Removed from saved')));
    } catch (_) {
      if (!mounted) return;
      setState(() => _items.insert(index.clamp(0, _items.length), s));
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not remove that event')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Brand.cream,
      appBar: AppBar(
        backgroundColor: Brand.cream,
        foregroundColor: Brand.forest,
        elevation: 0,
        title:
            const Text('Saved events', style: TextStyle(color: Brand.forest)),
      ),
      body: !isSignedIn
          ? _SignInPrompt(
              message: 'Sign in to see the events you\'ve saved.',
              onSignInTap: widget.onSignInTap)
          : _loading
              ? const _CenterSpinner()
              : _error != null
                  ? _ErrorState(message: _error!, onRetry: _load)
                  : RefreshIndicator(
                      color: Brand.forest,
                      onRefresh: _load,
                      child: _buildList(),
                    ),
    );
  }

  Widget _buildList() {
    if (_items.isEmpty) {
      return ListView(
        children: const [
          SizedBox(height: 120),
          _EmptyState(
            icon: Icons.bookmark_border,
            message: 'You haven\'t saved any events yet.',
          ),
        ],
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 40),
      itemCount: _items.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, i) => _tile(_items[i]),
    );
  }

  Widget _tile(_Saved s) {
    return Container(
      decoration: BoxDecoration(
        color: Brand.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Brand.border),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (s.coverUrl != null && s.coverUrl!.isNotEmpty)
            AspectRatio(
              aspectRatio: 16 / 9,
              child: Image.network(
                s.coverUrl!,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(
                  color: Brand.forest.withValues(alpha: 0.06),
                  child: const Icon(Icons.event, color: Brand.muted),
                ),
              ),
            ),
          Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(s.title,
                          style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: Brand.ink)),
                      const SizedBox(height: 6),
                      _MetaRow(
                          icon: Icons.schedule, text: _Dates.range(s.startsAt, s.endsAt)),
                      if (s.location.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        _MetaRow(
                            icon: s.isOnline
                                ? Icons.videocam_outlined
                                : Icons.location_on_outlined,
                            text: s.location),
                      ],
                    ],
                  ),
                ),
                IconButton(
                  tooltip: 'Remove',
                  icon: const Icon(Icons.bookmark, color: Brand.forest),
                  onPressed: () => _unsave(s),
                ),
              ],
            ),
          ),
        ],
      ),
    );
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
    } else if (venue.isNotEmpty && city.isNotEmpty) {
      location = '$venue · $city';
    } else {
      location = venue.isNotEmpty ? venue : city;
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
  static String _fmt(DateTime dt) {
    final l = dt.toLocal();
    return '${_months[l.month - 1]} ${l.day}, ${l.year}';
  }

  static String range(DateTime? start, DateTime? end) {
    if (start == null) return 'Date to be announced';
    if (end == null) return _fmt(start);
    if (start.year == end.year &&
        start.month == end.month &&
        start.day == end.day) {
      return _fmt(start);
    }
    return '${_fmt(start)} – ${_fmt(end)}';
  }
}

// ─── local widgets ──────────────────────────────────────────────────────────

class _MetaRow extends StatelessWidget {
  final IconData icon;
  final String text;
  const _MetaRow({required this.icon, required this.text});
  @override
  Widget build(BuildContext context) => Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 15, color: Brand.forest),
          const SizedBox(width: 6),
          Expanded(
            child: Text(text,
                style: const TextStyle(fontSize: 13, color: Brand.inkSoft)),
          ),
        ],
      );
}

class _SignInPrompt extends StatelessWidget {
  final String message;
  final VoidCallback? onSignInTap;
  const _SignInPrompt({required this.message, this.onSignInTap});
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.lock_outline, color: Brand.forest, size: 44),
            const SizedBox(height: 14),
            const Text('Sign in required',
                style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: Brand.ink)),
            const SizedBox(height: 8),
            Text(message,
                textAlign: TextAlign.center,
                style:
                    const TextStyle(fontSize: 14, height: 1.5, color: Brand.inkSoft)),
            if (onSignInTap != null) ...[
              const SizedBox(height: 20),
              FilledButton(onPressed: onSignInTap, child: const Text('Sign in')),
            ],
          ],
        ),
      ),
    );
  }
}

class _CenterSpinner extends StatelessWidget {
  const _CenterSpinner();
  @override
  Widget build(BuildContext context) =>
      const Center(child: CircularProgressIndicator(color: Brand.forest));
}

class _ErrorState extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const _ErrorState({required this.message, required this.onRetry});
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, color: Brand.danger, size: 40),
            const SizedBox(height: 12),
            Text(message,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 15, color: Brand.inkSoft)),
            const SizedBox(height: 16),
            FilledButton(onPressed: onRetry, child: const Text('Try again')),
          ],
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final IconData icon;
  final String message;
  const _EmptyState({required this.icon, required this.message});
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: Brand.muted, size: 40),
            const SizedBox(height: 12),
            Text(message,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 15, color: Brand.inkSoft)),
          ],
        ),
      ),
    );
  }
}
