import 'package:flutter/material.dart';

import '../net.dart';
import '../screens/my_cards_screen.dart';
import '../theme.dart';
import 'account/attendee_profile_screen.dart';
import 'account/following_screen.dart';
import 'account/notifications_screen.dart';
import 'account/saved_events_screen.dart';
import 'auth/attendee_auth_screen.dart';
import 'tickets/my_tickets_screen.dart';

/// Attendee account hub: tickets, cards, saved events, follows, notifications,
/// profile. Works signed-out (prompts to sign in for account-bound features).
class AttendeeAccountScreen extends StatefulWidget {
  const AttendeeAccountScreen({super.key});

  @override
  State<AttendeeAccountScreen> createState() => _AttendeeAccountScreenState();
}

class _AttendeeAccountScreenState extends State<AttendeeAccountScreen> {
  void _openAuth() {
    Navigator.of(context)
        .push(MaterialPageRoute(builder: (_) => const AttendeeAuthScreen()))
        .then((_) => setState(() {}));
  }

  @override
  Widget build(BuildContext context) {
    final signedIn = isSignedIn;
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Brand.cream,
        surfaceTintColor: Brand.cream,
        elevation: 0,
        title: const Text('Account',
            style: TextStyle(
                color: Brand.ink, fontSize: 17, fontWeight: FontWeight.w600)),
        iconTheme: const IconThemeData(color: Brand.ink),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Brand.surface,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Brand.border),
              ),
              child: Row(
                children: [
                  const CircleAvatar(
                    radius: 22,
                    backgroundColor: Brand.forest,
                    child: Icon(Icons.person, color: Brand.gold),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Text(
                      signedIn ? (currentUserEmail ?? 'Signed in') : 'Not signed in',
                      style: const TextStyle(
                          color: Brand.ink,
                          fontSize: 15,
                          fontWeight: FontWeight.w600),
                    ),
                  ),
                  if (signedIn)
                    TextButton(
                      onPressed: () async {
                        await supa.auth.signOut();
                        if (mounted) setState(() {});
                      },
                      child: const Text('Sign out',
                          style: TextStyle(color: Brand.danger)),
                    )
                  else
                    FilledButton(
                        onPressed: _openAuth, child: const Text('Sign in')),
                ],
              ),
            ),
            const SizedBox(height: 16),
            _tile(Icons.confirmation_number_outlined, 'My tickets',
                () => _push(const MyTicketsScreen())),
            _tile(Icons.style_outlined, 'My cards',
                () => _push(const MyCardsScreen())),
            _tile(Icons.bookmark_border, 'Saved events',
                () => _push(SavedEventsScreen(onSignInTap: _openAuth))),
            _tile(Icons.favorite_border, 'Following',
                () => _push(FollowingScreen(onSignInTap: _openAuth))),
            _tile(Icons.notifications_none, 'Notifications',
                () => _push(NotificationsScreen(onSignInTap: _openAuth))),
            _tile(Icons.settings_outlined, 'Profile',
                () => _push(AttendeeProfileScreen(onSignInTap: _openAuth))),
          ],
        ),
      ),
    );
  }

  void _push(Widget s) =>
      Navigator.of(context).push(MaterialPageRoute(builder: (_) => s));

  Widget _tile(IconData icon, String title, VoidCallback onTap) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Brand.surface,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Brand.border),
          ),
          child: Row(
            children: [
              Icon(icon, color: Brand.forest, size: 22),
              const SizedBox(width: 14),
              Expanded(
                child: Text(title,
                    style: const TextStyle(
                        color: Brand.ink,
                        fontSize: 15,
                        fontWeight: FontWeight.w600)),
              ),
              const Icon(Icons.chevron_right, color: Brand.muted),
            ],
          ),
        ),
      ),
    );
  }
}
