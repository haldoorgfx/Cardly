import 'package:flutter/material.dart';

import 'screens/attendee_home_screen.dart';
import 'theme.dart';

/// Shows a branded splash for a beat, then fades into the home screen.
/// Implemented as an in-tree swap (not a route) so the deep-link handler that
/// wraps this stays mounted.
class RootGate extends StatefulWidget {
  const RootGate({super.key});

  @override
  State<RootGate> createState() => _RootGateState();
}

class _RootGateState extends State<RootGate> {
  bool _ready = false;

  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(milliseconds: 1400), () {
      if (mounted) setState(() => _ready = true);
    });
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 450),
      child: _ready
          ? const AttendeeHomeScreen()
          : const _Splash(key: ValueKey('splash')),
    );
  }
}

class _Splash extends StatelessWidget {
  const _Splash({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Brand.cream,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 76,
              height: 76,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Brand.forest, Brand.forestDark],
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x331F4D3A),
                    blurRadius: 30,
                    offset: Offset(0, 12),
                  ),
                ],
              ),
              child: const Icon(Icons.event_available, color: Brand.gold, size: 40),
            ),
            const SizedBox(height: 18),
            const Text('Eventera',
                style: TextStyle(
                  color: Brand.ink,
                  fontSize: 24,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -0.5,
                )),
            const SizedBox(height: 6),
            const Text('Make your card',
                style: TextStyle(color: Brand.muted, fontSize: 14)),
          ],
        ),
      ),
    );
  }
}
