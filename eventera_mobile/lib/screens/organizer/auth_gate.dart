import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../auth_service.dart';
import 'auth_screen.dart';
import 'dashboard_screen.dart';

/// Shows the dashboard when an organizer is signed in, otherwise the auth
/// screen. Rebuilds automatically on sign-in / sign-out.
class OrganizerGate extends StatelessWidget {
  const OrganizerGate({super.key});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<AuthState>(
      stream: AuthService.instance.authChanges,
      builder: (ctx, _) {
        return AuthService.instance.isSignedIn
            ? const DashboardScreen()
            : const AuthScreen();
      },
    );
  }
}
