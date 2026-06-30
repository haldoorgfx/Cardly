import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'deep_link_handler.dart';
import 'root_gate.dart';
import 'supabase_config.dart';
import 'theme.dart';

final GlobalKey<NavigatorState> appNavigatorKey = GlobalKey<NavigatorState>();

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Connect to the existing Eventera backend (same DB/auth/storage as the web).
  await Supabase.initialize(
    url: SupabaseConfig.url,
    anonKey: SupabaseConfig.anonKey,
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
      theme: buildEventeraTheme(),
      home: DeepLinkHandler(
        navigatorKey: appNavigatorKey,
        child: const RootGate(),
      ),
    );
  }
}
