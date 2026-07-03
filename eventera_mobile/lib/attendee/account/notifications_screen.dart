import 'package:flutter/material.dart';

import '../../net.dart';
import '../../ui/tokens.dart';
import '../../ui/components.dart';
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
  List<_Notif> _items = [];

  bool get _hasUnread => _items.any((n) => !n.read);

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
          .from('notifications')
          .select(
              'id, type, title, body, action_url, icon, read_at, created_at')
          .eq('user_id', currentUserId as Object)
          .order('created_at', ascending: false)
          .limit(60);
      if (!mounted) return;
      setState(() {
        _items = asMapList(rows).map(_Notif.fromRow).toList();
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
            icon: Icons.notifications_none,
            title: 'You\'re all caught up',
            message: 'No notifications yet.',
          ),
        ],
      );
    }
    return ListView.separated(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(AppSpace.lg, AppSpace.xs, AppSpace.lg, 40),
      itemCount: _items.length,
      separatorBuilder: (_, __) =>
          const Divider(height: 1, thickness: 1, color: AppColors.border),
      itemBuilder: (context, i) => _tile(_items[i]),
    );
  }

  Widget _tile(_Notif n) {
    final style = _styleFor(n.type);
    return InkWell(
      onTap: () => _onTap(n),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 38,
              height: 38,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: style.tileBg,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(style.icon, size: 19, color: style.iconColor),
            ),
            const SizedBox(width: 13),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(n.title,
                      style: AppText.h3.copyWith(
                          fontSize: 14.5,
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
                            fontSize: 10.5, color: AppColors.inkMuted)),
                  ],
                ],
              ),
            ),
            if (!n.read) ...[
              const SizedBox(width: 8),
              Container(
                margin: const EdgeInsets.only(top: 4),
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

  _NotifStyle _styleFor(String type) {
    switch (type) {
      case 'connection':
      case 'connection_request':
      case 'connection_accepted':
        return const _NotifStyle(
            icon: Icons.person_add_alt,
            tileBg: AppColors.goldSoft,
            iconColor: AppColors.goldHover);
      case 'message':
        return const _NotifStyle(
            icon: Icons.chat_bubble_outline,
            tileBg: AppColors.forestSoft,
            iconColor: AppColors.forest);
      case 'ticket':
      case 'registration':
        return const _NotifStyle(
            icon: Icons.confirmation_number_outlined,
            tileBg: AppColors.forestSoft,
            iconColor: AppColors.forest);
      case 'reminder':
        return const _NotifStyle(
            icon: Icons.alarm,
            tileBg: AppColors.creamSoft,
            iconColor: AppColors.info);
      case 'event':
      case 'new_event':
        return const _NotifStyle(
            icon: Icons.event_available_outlined,
            tileBg: AppColors.forestSoft,
            iconColor: AppColors.forest);
      case 'waitlist':
        return const _NotifStyle(
            icon: Icons.hourglass_bottom,
            tileBg: AppColors.creamSoft,
            iconColor: AppColors.warning);
      default:
        return const _NotifStyle(
            icon: Icons.notifications_outlined,
            tileBg: AppColors.creamSoft,
            iconColor: AppColors.inkSoft);
    }
  }
}

class _NotifStyle {
  final IconData icon;
  final Color tileBg;
  final Color iconColor;
  const _NotifStyle(
      {required this.icon, required this.tileBg, required this.iconColor});
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
