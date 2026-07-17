import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../net.dart';
import '../../ui/tokens.dart';
import '../../ui/components.dart';
import '../../ui/menu.dart';
import '../../screens/open_event_screen.dart';
import '../event_landing_screen.dart';
import '../tickets/my_tickets_screen.dart';

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
  StatusReason _errorReason = StatusReason.generic;
  List<_Notif> _items = [];
  RealtimeChannel? _channel;

  bool get _hasUnread => _items.any((n) => !n.read);

  @override
  void initState() {
    super.initState();
    if (isSignedIn) {
      _load();
      _subscribeRealtime();
    } else {
      _loading = false;
    }
  }

  /// Live updates: reload whenever a notification row for this user is inserted
  /// or changed. (Requires the `notifications` table to be in the
  /// `supabase_realtime` publication — see the notifications setup guide.)
  void _subscribeRealtime() {
    final uid = currentUserId;
    if (uid == null) return;
    _channel = supa
        .channel('notif:$uid')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'notifications',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'user_id',
            value: uid,
          ),
          callback: (_) {
            if (mounted) _load();
          },
        )
        .subscribe();
  }

  @override
  void dispose() {
    if (_channel != null) supa.removeChannel(_channel!);
    super.dispose();
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
          .eq('user_id', currentUserId ?? '')
          .order('created_at', ascending: false)
          .limit(60);
      if (!mounted) return;
      setState(() {
        _items = asMapList(rows).map(_Notif.fromRow).toList();
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      final msg = describeError(e, context: 'your notifications');
      setState(() {
        _loading = false;
        _error = msg;
        _errorReason = msg.toLowerCase().contains("couldn't reach the server")
            ? StatusReason.network
            : StatusReason.generic;
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
    } catch (e) {
      if (!mounted) return;
      setState(() => n.read = false);
      showToast(context, describeError(e, context: 'this notification'),
          type: ToastType.error);
    }
  }

  Future<void> _onTap(_Notif n) async {
    await _markRead(n);
    if (!mounted) return;
    final url = n.actionUrl.trim();
    if (url.isEmpty) return;

    Widget? dest;
    if (url.contains('/e/')) {
      final slug = _slugAfter(url, '/e/');
      if (slug.isNotEmpty) dest = EventLandingScreen(slug: slug);
    } else if (url.contains('/c/')) {
      final slug = _slugAfter(url, '/c/');
      if (slug.isNotEmpty) dest = OpenEventScreen(slug: slug);
    } else if (url.contains('my-tickets')) {
      dest = const MyTicketsScreen();
    }

    if (dest != null) {
      Navigator.of(context).push(MaterialPageRoute(builder: (_) => dest!));
    }
  }

  // Returns the path segment right after [marker], stripped of any query
  // string, trailing slash, or further path.
  String _slugAfter(String url, String marker) {
    final idx = url.indexOf(marker);
    if (idx < 0) return '';
    var rest = url.substring(idx + marker.length);
    for (final sep in ['/', '?', '#']) {
      final s = rest.indexOf(sep);
      if (s >= 0) rest = rest.substring(0, s);
    }
    return rest.trim();
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
          .eq('user_id', currentUserId ?? '')
          .isFilter('read_at', null);
    } catch (e) {
      if (!mounted) return;
      showToast(context, describeError(e, context: 'your notifications'),
          type: ToastType.error);
      // Best-effort: reload to reflect true server state.
      _load();
    }
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: MAppBar(
        title: 'Notifications',
        hairline: true,
        actions: [
          if (isSignedIn && _hasUnread)
            Padding(
              padding: const EdgeInsets.only(right: 6),
              child: GestureDetector(
                onTap: _markAllRead,
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
                  child: Text('Mark all',
                      style: AppText.label.copyWith(color: AppColors.forest)),
                ),
              ),
            ),
        ],
      ),
      body: !isSignedIn
          ? _SignInPrompt(
              message: 'Sign in to see your notifications.',
              onSignInTap: widget.onSignInTap)
          : _loading
              ? const LoadingState()
              : _error != null
                  ? ErrorStateView(
                      message: _error!, onRetry: _load, reason: _errorReason)
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
            icon: Icons.notifications_none,
            title: 'You\'re all caught up',
            message: 'No notifications yet.',
          ),
        ],
      );
    }

    final unread = _items.where((n) => !n.read).toList();
    final read = _items.where((n) => n.read).toList();

    final children = <Widget>[];
    if (unread.isNotEmpty) {
      children.add(const GroupLabel('New'));
      children.add(_group(unread));
    }
    if (read.isNotEmpty) {
      if (children.isNotEmpty) children.add(const SizedBox(height: AppSpace.lg));
      children.add(const GroupLabel('Earlier'));
      children.add(_group(read));
    }

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding:
          const EdgeInsets.fromLTRB(AppSpace.lg, AppSpace.lg, AppSpace.lg, 40),
      children: children,
    );
  }

  // A rounded card containing a set of notification rows with hairline
  // dividers between them.
  Widget _group(List<_Notif> notifs) {
    final rows = <Widget>[];
    for (var i = 0; i < notifs.length; i++) {
      if (i > 0) {
        rows.add(const Divider(
            height: 1, thickness: 1, color: AppColors.border));
      }
      rows.add(_tile(notifs[i]));
    }
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: AppColors.border),
        boxShadow: AppShadow.soft,
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(children: rows),
    );
  }

  Widget _tile(_Notif n) {
    final tone = _toneFor(n);
    final icon = _iconFor(n);
    return InkWell(
      onTap: () => _onTap(n),
      child: Container(
        color: n.read ? Colors.transparent : AppColors.forestSoft,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            IconTile(icon, tone: tone),
            const SizedBox(width: 13),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(n.title,
                      style: AppText.h3.copyWith(
                          fontSize: 15,
                          fontWeight:
                              n.read ? FontWeight.w600 : FontWeight.w700)),
                  if (n.body.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(n.body,
                        style: AppText.bodySm
                            .copyWith(color: AppColors.inkMuted, height: 1.4)),
                  ],
                  if (n.time.isNotEmpty) ...[
                    const SizedBox(height: 5),
                    Text(n.time,
                        style: AppText.numSm.copyWith(
                            fontSize: 11, color: AppColors.inkMuted)),
                  ],
                ],
              ),
            ),
            if (!n.read) ...[
              const SizedBox(width: 8),
              Container(
                margin: const EdgeInsets.only(top: 6),
                width: 9,
                height: 9,
                decoration: const BoxDecoration(
                    color: AppColors.forest, shape: BoxShape.circle),
              ),
            ],
          ],
        ),
      ),
    );
  }

  // Picks the icon-tile tone from the notification's type/title.
  ITone _toneFor(_Notif n) {
    final t = n.type.toLowerCase();
    final title = n.title.toLowerCase();
    if (t == 'registration' ||
        title.contains('registration') ||
        title.contains('confirmed') ||
        title.contains('confirm')) {
      return ITone.success;
    }
    if (t == 'ticket' ||
        title.contains('ticket') ||
        title.contains('import') ||
        title.contains('duplicate')) {
      return ITone.forest;
    }
    return ITone.info;
  }

  // Picks the icon from the notification's type/title.
  IconData _iconFor(_Notif n) {
    final t = n.type.toLowerCase();
    final title = n.title.toLowerCase();
    if (t == 'registration' ||
        title.contains('registration') ||
        title.contains('confirmed') ||
        title.contains('confirm')) {
      return Icons.person_outline;
    }
    if (t == 'ticket' ||
        title.contains('ticket') ||
        title.contains('import') ||
        title.contains('duplicate')) {
      return Icons.confirmation_number_outlined;
    }
    return Icons.notifications_none;
  }
}

// ─── model ──────────────────────────────────────────────────────────────────

class _Notif {
  final String id;
  final String type;
  final String title;
  final String body;
  final String time;
  final String actionUrl;
  bool read;

  _Notif({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    required this.time,
    required this.actionUrl,
    required this.read,
  });

  factory _Notif.fromRow(Map<String, dynamic> r) {
    return _Notif(
      id: asString(r['id']),
      type: asString(r['type']),
      title: asString(r['title'], 'Notification'),
      body: asString(r['body']).trim(),
      time: _RelTime.format(asDate(r['created_at'])),
      actionUrl: asString(r['action_url']),
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
    return EmptyState(
      icon: Icons.lock_outline,
      title: 'Sign in required',
      message: message,
      ctaLabel: onSignInTap != null ? 'Sign in' : null,
      onCta: onSignInTap,
    );
  }
}
