import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:timezone/data/latest_all.dart' as tz_data;

import 'deep_link_handler.dart';
import 'push_service.dart';
import 'root_gate.dart';
import 'secure_session_storage.dart';
import 'supabase_config.dart';
import 'ui/tokens.dart';

final GlobalKey<NavigatorState> appNavigatorKey = GlobalKey<NavigatorState>();

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // IANA timezone database — event times are converted from their stored UTC
  // instant into the event's own zone (e.g. Africa/Djibouti) via lib/tz.dart.
  tz_data.initializeTimeZones();

  // Firebase — needed for FCM push. On Android it auto-reads
  // android/app/google-services.json. Guarded so a missing/half config (e.g.
  // iOS without APNs yet) never blocks app startup.
  try {
    await Firebase.initializeApp();
  } catch (_) {}

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

  // Register this device for push (best-effort, non-blocking — shows the OS
  // permission prompt and upserts the FCM token into user_devices).
  PushService.instance.init();
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
