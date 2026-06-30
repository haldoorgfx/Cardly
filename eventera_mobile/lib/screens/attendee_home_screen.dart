import 'package:flutter/material.dart';

import '../eventera_api.dart';
import '../links.dart';
import '../theme.dart';
import 'my_cards_screen.dart';
import 'organizer/auth_gate.dart';
import 'personalize_screen.dart';

/// Entry point of the attendee flow: paste an event link or type its code,
/// then open it. Accepts a full URL (.../c/<slug>) or just the slug.
class AttendeeHomeScreen extends StatefulWidget {
  const AttendeeHomeScreen({super.key});

  @override
  State<AttendeeHomeScreen> createState() => _AttendeeHomeScreenState();
}

class _AttendeeHomeScreenState extends State<AttendeeHomeScreen> {
  final _controller = TextEditingController();
  final _api = EventeraApi();
  bool _loading = false;
  String? _error;

  Future<void> _open() async {
    FocusScope.of(context).unfocus();
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final slug = slugFromText(_controller.text) ?? '';
      final event = await _api.loadEvent(slug);
      final variant = event.defaultVariant;
      if (variant == null) {
        throw EventeraException('This event has no card design yet.');
      }
      if (!mounted) return;
      Navigator.of(context).push(MaterialPageRoute(
        builder: (_) =>
            PersonalizeScreen(event: event, initialVariant: variant),
      ));
    } on EventeraException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = 'Something went wrong. Please try again.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
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
            tooltip: 'Organizer',
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const OrganizerGate()),
            ),
            icon: const Icon(Icons.account_circle_outlined, color: Brand.ink),
          ),
          TextButton.icon(
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const MyCardsScreen()),
            ),
            icon: const Icon(Icons.style_outlined, color: Brand.forest, size: 18),
            label: const Text('My cards',
                style: TextStyle(
                    color: Brand.forest,
                    fontSize: 14,
                    fontWeight: FontWeight.w600)),
          ),
          const SizedBox(width: 8),
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
                const Text('Make your card',
                    style: TextStyle(
                        color: Brand.ink,
                        fontSize: 22,
                        fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                const Text(
                  'Paste the event link you received, or type the event code.',
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
                    onPressed: _loading ? null : _open,
                    child: _loading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                                strokeWidth: 2.5, color: Colors.white),
                          )
                        : const Text('Open event'),
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
