import 'package:flutter/material.dart';

import '../attendee/attendee_account_screen.dart';
import '../attendee/discovery/discover_screen.dart';
import '../attendee/event_landing_screen.dart';
import '../links.dart';
import '../theme.dart';
import 'organizer/auth_gate.dart';

/// Attendee entry point: open an event by link/code (→ full event hub),
/// discover events, or open your account. Organizers have a subtle entry too.
class AttendeeHomeScreen extends StatefulWidget {
  const AttendeeHomeScreen({super.key});

  @override
  State<AttendeeHomeScreen> createState() => _AttendeeHomeScreenState();
}

class _AttendeeHomeScreenState extends State<AttendeeHomeScreen> {
  final _controller = TextEditingController();
  String? _error;

  void _open() {
    FocusScope.of(context).unfocus();
    final slug = slugFromText(_controller.text) ?? '';
    if (slug.isEmpty) {
      setState(() => _error = 'Enter an event link or code.');
      return;
    }
    setState(() => _error = null);
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => EventLandingScreen(slug: slug)),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Brand.cream,
        surfaceTintColor: Brand.cream,
        elevation: 0,
        actions: [
          IconButton(
            tooltip: 'Account',
            onPressed: () => Navigator.of(context).push(MaterialPageRoute(
                builder: (_) => const AttendeeAccountScreen())),
            icon: const Icon(Icons.account_circle_outlined, color: Brand.ink),
          ),
          const SizedBox(width: 6),
        ],
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(28),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [Brand.forest, Brand.forestDark],
                        ),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.event_available,
                          color: Brand.gold, size: 26),
                    ),
                    const SizedBox(width: 12),
                    const Text('Eventera',
                        style: TextStyle(
                          color: Brand.ink,
                          fontSize: 26,
                          fontWeight: FontWeight.w700,
                          letterSpacing: -0.5,
                        )),
                  ],
                ),
                const SizedBox(height: 28),
                const Text('Open an event',
                    style: TextStyle(
                        color: Brand.ink,
                        fontSize: 22,
                        fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                const Text(
                  'Paste the event link you received, or type the event code. From there you can register, make your card, and join in.',
                  style:
                      TextStyle(color: Brand.muted, fontSize: 14, height: 1.5),
                ),
                const SizedBox(height: 24),
                TextField(
                  controller: _controller,
                  textInputAction: TextInputAction.go,
                  onSubmitted: (_) => _open(),
                  decoration: const InputDecoration(
                    hintText: 'eventera.app/c/your-event  or  your-event',
                    prefixIcon: Icon(Icons.link, color: Brand.muted),
                  ),
                ),
                if (_error != null) ...[
                  const SizedBox(height: 12),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.error_outline,
                          color: Brand.danger, size: 18),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(_error!,
                            style: const TextStyle(
                                color: Brand.danger, fontSize: 13.5)),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: _open,
                    child: const Text('Open event'),
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Brand.forest,
                      side: const BorderSide(color: Brand.border),
                      padding: const EdgeInsets.symmetric(vertical: 15),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: () => Navigator.of(context).push(
                        MaterialPageRoute(
                            builder: (_) => const DiscoverScreen())),
                    icon: const Icon(Icons.explore_outlined, size: 20),
                    label: const Text('Discover events'),
                  ),
                ),
                const SizedBox(height: 20),
                Center(
                  child: TextButton(
                    onPressed: () => Navigator.of(context).push(
                        MaterialPageRoute(
                            builder: (_) => const OrganizerGate())),
                    child: const Text('For organizers →',
                        style: TextStyle(color: Brand.muted, fontSize: 13.5)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
