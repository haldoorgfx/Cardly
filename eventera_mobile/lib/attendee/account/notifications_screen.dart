import 'package:flutter/material.dart';

import '../../net.dart';
import '../../theme.dart';

/// The signed-in attendee's notification inbox.
///
/// Reads `notifications` (own rows: user_id = auth.uid()) ordered by
/// created_at desc. Verified against app/api/notifications/route.ts and
/// app/(public)/account/notifications/page.tsx:
///   notifications(id, user_id, type, title, body, action_url, icon,
///                 read_at, created_at)
/// Unread == read_at IS NULL. Marking read stamps read_at = now().
class NotificationsScreen extends StatefulWidget {
  final VoidCallback? onSignInTap;
  const NotificationsScreen({super.key, this.onSignInTap});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  bool _loading = true;
  String? _error;
  List<_Notif> _items = [];

  bool get _hasUnread => _items.any((n) => !n.read);

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
          .from('notifications')
          .select(
              'id, type, title, body, action_url, icon, read_at, created_at')
          .eq('user_id', currentUserId as Object)
          .order('created_at', ascending: false)
          .limit(60);
      setState(() {
        _items = asMapList(rows).map(_Notif.fromRow).toList();
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
        _error = 'Something went wrong loading your notifications.';
      });
    }
  }

  Future<void> _markRead(_Notif n) async {
    if (n.read) return;
    setState(() => n.read = true);
    try {
      await supa
          .from('notifications')
          .update({'read_at': DateTime.now().toUtc().toIso8601String()})
          .eq('id', n.id);
    } catch (_) {
      if (!mounted) return;
      setState(() => n.read = false);
    }
  }

  Future<void> _markAllRead() async {
    final unread = _items.where((n) => !n.read).toList();
    if (unread.isEmpty) return;
    setState(() {
      for (final n in unread) {
        n.read = true;
      }
    });
    try {
      await supa
          .from('notifications')
          .update({'read_at': DateTime.now().toUtc().toIso8601String()})
          .eq('user_id', currentUserId as Object)
          .isFilter('read_at', null);
    } catch (_) {
      if (!mounted) return;
      // Best-effort: reload to reflect true server state.
      _load();
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
            const Text('Notifications', style: TextStyle(color: Brand.forest)),
        actions: [
          if (isSignedIn && _hasUnread)
            TextButton(
              onPressed: _markAllRead,
              child: const Text('Mark all read',
                  style: TextStyle(color: Brand.forest, fontSize: 13)),
            ),
        ],
      ),
      body: !isSignedIn
          ? _SignInPrompt(
              message: 'Sign in to see your notifications.',
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
            icon: Icons.notifications_none,
            message: 'You\'re all caught up.\nNo notifications yet.',
          ),
        ],
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 40),
      itemCount: _items.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, i) => _tile(_items[i]),
    );
  }

  Widget _tile(_Notif n) {
    return InkWell(
      onTap: () => _markRead(n),
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: n.read
              ? Brand.surface
              : Brand.forest.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
              color: n.read
                  ? Brand.border
                  : Brand.forest.withValues(alpha: 0.25)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 38,
              height: 38,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: Brand.forest.withValues(alpha: 0.10),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(_iconFor(n), size: 20, color: Brand.forest),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(n.title,
                            style: TextStyle(
                                fontSize: 15,
                                fontWeight: n.read
                                    ? FontWeight.w600
                                    : FontWeight.w700,
                                color: Brand.ink)),
                      ),
                      if (!n.read) ...[
                        const SizedBox(width: 8),
                        Container(
                          margin: const EdgeInsets.only(top: 6),
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                              color: Brand.forest, shape: BoxShape.circle),
                        ),
                      ],
                    ],
                  ),
                  if (n.body.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(n.body,
                        style: const TextStyle(
                            fontSize: 13, height: 1.4, color: Brand.inkSoft)),
                  ],
                  if (n.time.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(n.time,
                        style: const TextStyle(
                            fontSize: 12, color: Brand.muted)),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  IconData _iconFor(_Notif n) {
    switch (n.type) {
      case 'connection':
      case 'connection_request':
      case 'connection_accepted':
        return Icons.person_add_alt;
      case 'message':
        return Icons.chat_bubble_outline;
      case 'ticket':
      case 'registration':
        return Icons.confirmation_number_outlined;
      case 'reminder':
        return Icons.alarm;
      case 'event':
      case 'new_event':
        return Icons.event_available_outlined;
      case 'waitlist':
        return Icons.hourglass_bottom;
      default:
        return Icons.notifications_outlined;
    }
  }
}

// ─── model ──────────────────────────────────────────────────────────────────

class _Notif {
  final String id;
  final String type;
  final String title;
  final String body;
  final String time;
  bool read;

  _Notif({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    required this.time,
    required this.read,
  });

  factory _Notif.fromRow(Map<String, dynamic> r) {
    return _Notif(
      id: asString(r['id']),
      type: asString(r['type']),
      title: asString(r['title'], 'Notification'),
      body: asString(r['body']).trim(),
      time: _RelTime.format(asDate(r['created_at'])),
      read: r['read_at'] != null,
    );
  }
}

class _RelTime {
  static const _months = [
    'Jan','Feb','Mar','Apr','May','Jun',
    'Jul','Aug','Sep','Oct','Nov','Dec'
  ];
  static String format(DateTime? dt) {
    if (dt == null) return '';
    final now = DateTime.now();
    final local = dt.toLocal();
    final diff = now.difference(local);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${_months[local.month - 1]} ${local.day}, ${local.year}';
  }
}

// ─── local widgets ──────────────────────────────────────────────────────────

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
