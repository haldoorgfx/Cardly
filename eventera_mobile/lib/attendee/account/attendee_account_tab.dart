import 'package:flutter/material.dart';

import '../../net.dart';
import '../../screens/my_cards_screen.dart';
import '../../ui/components.dart';
import '../../ui/tokens.dart';
import '../auth/attendee_auth_screen.dart';
import '../tickets/my_tickets_screen.dart';
import 'attendee_profile_screen.dart';
import 'following_screen.dart';
import 'notifications_screen.dart';
import 'saved_events_screen.dart';

/// Account tab (root, no back). Profile header + navigation rows.
class AttendeeAccountTab extends StatefulWidget {
  const AttendeeAccountTab({super.key});
  @override
  State<AttendeeAccountTab> createState() => _AttendeeAccountTabState();
}

class _AttendeeAccountTabState extends State<AttendeeAccountTab> {
  void _auth() => Navigator.of(context)
      .push(MaterialPageRoute(builder: (_) => const AttendeeAuthScreen()))
      .then((_) => setState(() {}));

  void _push(Widget w) =>
      Navigator.of(context).push(MaterialPageRoute(builder: (_) => w));

  @override
  Widget build(BuildContext context) {
    final signedIn = isSignedIn;
    final email = currentUserEmail ?? '';
    return MScaffold(
      appBar: const MAppBar(title: 'Account', showBack: false),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
        children: [
          // Header
          Row(
            children: [
              Avatar(name: signedIn ? email : null, size: 56),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(signedIn ? 'Signed in' : 'Guest',
                        style: AppText.h3),
                    const SizedBox(height: 2),
                    Text(signedIn ? email : 'Sign in to sync your tickets & cards',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppText.bodySm),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (!signedIn)
            MButton('Sign in', icon: Icons.login, onTap: _auth)
          else
            MButton('Sign out',
                kind: MBtnKind.sec,
                icon: Icons.logout,
                onTap: () async {
                  await supa.auth.signOut();
                  if (mounted) setState(() {});
                }),
          const SizedBox(height: 24),

          MCard(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                _row(Icons.confirmation_number_outlined, 'My tickets',
                    () => _push(const MyTicketsScreen())),
                _div(),
                _row(Icons.style_outlined, 'My cards',
                    () => _push(const MyCardsScreen())),
                _div(),
                _row(Icons.bookmark_border, 'Saved events',
                    () => _push(SavedEventsScreen(onSignInTap: _auth))),
                _div(),
                _row(Icons.favorite_border, 'Following',
                    () => _push(FollowingScreen(onSignInTap: _auth))),
                _div(),
                _row(Icons.notifications_none, 'Notifications',
                    () => _push(NotificationsScreen(onSignInTap: _auth))),
                _div(),
                _row(Icons.settings_outlined, 'Profile & settings',
                    () => _push(AttendeeProfileScreen(onSignInTap: _auth))),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _div() => const Divider(height: 1, color: AppColors.border, indent: 52);

  Widget _row(IconData icon, String label, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
        child: Row(
          children: [
            Icon(icon, color: AppColors.forest, size: 22),
            const SizedBox(width: 14),
            Expanded(
                child: Text(label,
                    style: AppText.h3.copyWith(fontSize: 15.5))),
            const Icon(Icons.chevron_right, color: AppColors.inkMuted, size: 18),
          ],
        ),
      ),
    );
  }
}
