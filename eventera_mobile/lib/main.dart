import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'deep_link_handler.dart';
import 'root_gate.dart';
import 'secure_session_storage.dart';
import 'supabase_config.dart';
import 'ui/tokens.dart';

final GlobalKey<NavigatorState> appNavigatorKey = GlobalKey<NavigatorState>();

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Connect to the existing Eventera backend (same DB/auth/storage as the web).
  // The persisted session (including the refresh token) is stored in the OS
  // keychain via SecureSessionStorage — never in plain SharedPreferences.
  await Supabase.initialize(
    url: SupabaseConfig.url,
    anonKey: SupabaseConfig.anonKey,
    authOptions: FlutterAuthClientOptions(
      localStorage: SecureSessionStorage(),
      autoRefreshToken: true,
    ),
  );

  runApp(const EventeraApp());
}

class EventeraApp extends StatelessWidget {
  const EventeraApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Eventera',
      debugShowCheckedModeBanner: false,
      navigatorKey: appNavigatorKey,
      theme: buildAppTheme(),
      scrollBehavior: const AppScrollBehavior(),
      // Respect the system font-size setting but cap it: past ~1.15× the
      // layouts drift far from the design (giant pills, wrapped labels,
      // overflowing bars). Accessibility still gets a bump; chrome stays true.
      builder: (context, child) {
        final media = MediaQuery.of(context);
        final scale = media.textScaler.scale(1.0).clamp(0.9, 1.15);
        return MediaQuery(
          data: media.copyWith(textScaler: TextScaler.linear(scale)),
          child: child ?? const SizedBox.shrink(),
        );
      },
      home: DeepLinkHandler(
        navigatorKey: appNavigatorKey,
        child: const RootGate(),
      ),
    );
  }
}
