import 'package:flutter/material.dart';

import '../../net.dart';
import '../../screens/my_cards_screen.dart';
import '../../ui/components.dart';
import '../../ui/menu.dart';
import '../../ui/tokens.dart';
import '../auth/attendee_auth_screen.dart';
import '../tickets/my_tickets_screen.dart';
import 'attendee_profile_screen.dart';
import 'following_screen.dart';
import 'notifications_screen.dart';
import 'saved_events_screen.dart';

/// Account tab (root, no back). Redesigned: profile header with a stat strip,
/// grouped icon-tile menus, and a guest invite state.
class AttendeeAccountTab extends StatefulWidget {
  const AttendeeAccountTab({super.key});
  @override
  State<AttendeeAccountTab> createState() => _AttendeeAccountTabState();
}

class _AttendeeAccountTabState extends State<AttendeeAccountTab> {
  int _unread = 0;
  int _tickets = 0;
  int _saved = 0;
  int _following = 0;

  @override
  void initState() {
    super.initState();
    _loadCounts();
  }

  Future<void> _loadCounts() async {
    if (!isSignedIn) {
      if (mounted) {
        setState(() {
          _unread = 0;
          _tickets = 0;
          _saved = 0;
          _following = 0;
        });
      }
      return;
    }
    final uid = currentUserId!;
    final email = (currentUserEmail ?? '').toLowerCase();

    Future<int> count(Future<dynamic> Function() q) async {
      try {
        final rows = await q();
        return (rows as List).length;
      } catch (_) {
        return 0;
      }
    }

    final results = await Future.wait([
      count(() => supa
          .from('notifications')
          .select('id')
          .eq('user_id', uid)
          .isFilter('read_at', null)),
      count(() {
        final orParts = <String>['user_id.eq.$uid'];
        if (email.isNotEmpty) orParts.add('attendee_email.eq.$email');
        return supa.from('registrations').select('id').or(orParts.join(',')).inFilter(
            'status', ['confirmed', 'checked_in', 'pending', 'pending_approval']);
      }),
      count(() => supa.from('saved_events').select('id').eq('user_id', uid)),
      count(() =>
          supa.from('organizer_follows').select('id').eq('follower_id', uid)),
    ]);
    if (!mounted) return;
    setState(() {
      _unread = results[0];
      _tickets = results[1];
      _saved = results[2];
      _following = results[3];
    });
  }

  void _auth() => Navigator.of(context)
          .push(MaterialPageRoute(builder: (_) => const AttendeeAuthScreen()))
          .then((_) {
        setState(() {});
        _loadCounts();
      });

  void _push(Widget w) => Navigator.of(context)
      .push(MaterialPageRoute(builder: (_) => w))
      .then((_) => _loadCounts());

  Future<void> _signOut() async {
    await supa.auth.signOut();
    if (mounted) {
      setState(() {});
      _loadCounts();
    }
  }

  @override
  Widget build(BuildContext context) {
    final signedIn = isSignedIn;
    return MScaffold(
      appBar: const MAppBar(title: 'Account', showBack: false),
      body: RefreshIndicator(
        color: AppColors.forest,
        onRefresh: _loadCounts,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 36),
          children:
              signedIn ? _signedIn() : _guest(),
        ),
      ),
    );
  }

  // ── Signed-in ──────────────────────────────────────────────────────────
  List<Widget> _signedIn() {
    final email = currentUserEmail ?? '';
    final name = _displayName(email);
    return [
      _ProfileHeader(
        name: name,
        email: email,
        tickets: _tickets,
        saved: _saved,
        following: _following,
        onEdit: () => _push(AttendeeProfileScreen(onSignInTap: _auth)),
      ),
      const SizedBox(height: 24),

      const GroupLabel('My stuff'),
      MenuGroup(children: [
        MenuRow(
          icon: Icons.confirmation_number_outlined,
          tone: ITone.forest,
          title: 'My tickets',
          trailing: _tickets > 0 ? CountLabel(_tickets) : null,
          onTap: () => _push(const MyTicketsScreen()),
        ),
        MenuRow(
          icon: Icons.style_outlined,
          tone: ITone.gold,
          title: 'My cards',
          onTap: () => _push(const MyCardsScreen()),
        ),
        MenuRow(
          icon: Icons.bookmark_border,
          tone: ITone.info,
          title: 'Saved events',
          trailing: _saved > 0 ? CountLabel(_saved) : null,
          onTap: () => _push(SavedEventsScreen(onSignInTap: _auth)),
        ),
        MenuRow(
          icon: Icons.favorite_border,
          tone: ITone.danger,
          title: 'Following',
          trailing: _following > 0 ? CountLabel(_following) : null,
          onTap: () => _push(FollowingScreen(onSignInTap: _auth)),
        ),
      ]),
      const SizedBox(height: 22),

      const GroupLabel('Preferences'),
      MenuGroup(children: [
        MenuRow(
          icon: Icons.notifications_none,
          tone: ITone.forest,
          title: 'Notifications',
          trailing: _unread > 0 ? UnreadBadge(_unread) : null,
          onTap: () => _push(NotificationsScreen(onSignInTap: _auth)),
        ),
        MenuRow(
          icon: Icons.settings_outlined,
          tone: ITone.muted,
          title: 'Profile & settings',
          onTap: () => _push(AttendeeProfileScreen(onSignInTap: _auth)),
        ),
        MenuRow(
          icon: Icons.help_outline,
          tone: ITone.muted,
          title: 'Help & support',
          onTap: () => showToast(context, 'Support is coming soon.'),
        ),
      ]),
      const SizedBox(height: 24),

      Center(child: _SignOutButton(onTap: _confirmSignOut)),
      const SizedBox(height: 16),
      Center(
        child: Text('Eventera · v1.0.0',
            style: AppText.caption.copyWith(color: AppColors.inkMuted)),
      ),
    ];
  }

  Future<void> _confirmSignOut() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.card)),
        title: Text('Sign out?', style: AppText.h3),
        content: Text(
          'You can always sign back in with your email or Google.',
          style: AppText.bodySm,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: Text('Stay signed in',
                style: AppText.label.copyWith(color: AppColors.forest)),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: Text('Sign out',
                style: AppText.label.copyWith(color: AppColors.danger)),
          ),
        ],
      ),
    );
    if (ok == true) _signOut();
  }

  // ── Guest ──────────────────────────────────────────────────────────────
  List<Widget> _guest() {
    return [
      Container(
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF163828), AppColors.forest, Color(0xFF2A6A50)],
            stops: [0.0, 0.55, 1.0],
          ),
          borderRadius: BorderRadius.circular(18),
          boxShadow: AppShadow.lift,
        ),
        padding: const EdgeInsets.all(22),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 46,
              height: 46,
              decoration: BoxDecoration(
                color: AppColors.gold.withValues(alpha: 0.18),
                borderRadius: BorderRadius.circular(13),
              ),
              child: const Icon(Icons.person_outline,
                  color: AppColors.gold, size: 24),
            ),
            const SizedBox(height: 16),
            Text('Browsing as a guest',
                style: AppText.h2.copyWith(color: Colors.white, fontSize: 21)),
            const SizedBox(height: 6),
            Text(
              'Sign in to sync your tickets and cards, save events, and follow organizers.',
              style: AppText.bodySm
                  .copyWith(color: Colors.white.withValues(alpha: 0.85)),
            ),
            const SizedBox(height: 18),
            MButton('Sign in or create account',
                kind: MBtnKind.gold, icon: Icons.login, onTap: _auth),
          ],
        ),
      ),
      const SizedBox(height: 24),
      const GroupLabel('Explore'),
      MenuGroup(children: [
        MenuRow(
          icon: Icons.confirmation_number_outlined,
          tone: ITone.forest,
          title: 'My tickets',
          subtitle: 'Sign in to view',
          chevron: false,
          onTap: _auth,
        ),
        MenuRow(
          icon: Icons.bookmark_border,
          tone: ITone.info,
          title: 'Saved events',
          subtitle: 'Sign in to view',
          chevron: false,
          onTap: _auth,
        ),
        MenuRow(
          icon: Icons.favorite_border,
          tone: ITone.danger,
          title: 'Following',
          subtitle: 'Sign in to view',
          chevron: false,
          onTap: _auth,
        ),
      ]),
      const SizedBox(height: 24),
      Center(
        child: Text('Eventera · v1.0.0',
            style: AppText.caption.copyWith(color: AppColors.inkMuted)),
      ),
    ];
  }

  static String _displayName(String email) {
    final at = email.indexOf('@');
    if (at <= 0) return 'Your account';
    final local = email.substring(0, at).replaceAll(RegExp(r'[._]+'), ' ').trim();
    if (local.isEmpty) return 'Your account';
    return local
        .split(' ')
        .where((w) => w.isNotEmpty)
        .map((w) => w[0].toUpperCase() + w.substring(1))
        .join(' ');
  }
}

/// Profile header card: forest-gradient top (avatar + name + email + edit) over
/// a white stat strip.
class _ProfileHeader extends StatelessWidget {
  final String name;
  final String email;
  final int tickets;
  final int saved;
  final int following;
  final VoidCallback onEdit;
  const _ProfileHeader({
    required this.name,
    required this.email,
    required this.tickets,
    required this.saved,
    required this.following,
    required this.onEdit,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border),
        boxShadow: AppShadow.soft,
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Color(0xFF163828), AppColors.forest],
              ),
            ),
            padding: const EdgeInsets.all(18),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(2.5),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.gold, width: 2),
                  ),
                  child: Avatar(name: name, size: 54),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppText.h2
                              .copyWith(color: Colors.white, fontSize: 20)),
                      const SizedBox(height: 2),
                      Text(email,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppText.bodySm.copyWith(
                              color: Colors.white.withValues(alpha: 0.82))),
                    ],
                  ),
                ),
                GestureDetector(
                  onTap: onEdit,
                  behavior: HitTestBehavior.opaque,
                  child: Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.14),
                      borderRadius: BorderRadius.circular(11),
                    ),
                    child: const Icon(Icons.edit_outlined,
                        color: Colors.white, size: 18),
                  ),
                ),
              ],
            ),
          ),
          StatStrip(stats: [
            ('$tickets', 'Tickets'),
            ('$saved', 'Saved'),
            ('$following', 'Following'),
          ]),
        ],
      ),
    );
  }
}

/// Small, quiet, danger-tinted sign-out affordance — intentionally low-emphasis
/// so users don't sign out by accident.
class _SignOutButton extends StatelessWidget {
  final VoidCallback onTap;
  const _SignOutButton({required this.onTap});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
        decoration: BoxDecoration(
          color: AppColors.danger.withValues(alpha: 0.07),
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: AppColors.danger.withValues(alpha: 0.22)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.logout, size: 15, color: AppColors.danger),
            const SizedBox(width: 7),
            Text('Sign out',
                style: AppText.bodySm.copyWith(
                    color: AppColors.danger, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }
}
