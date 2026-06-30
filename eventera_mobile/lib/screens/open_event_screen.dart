import 'package:flutter/material.dart';

import '../eventera_api.dart';
import '../theme.dart';
import 'personalize_screen.dart';

/// Loads an event by slug (from a deep link or the home screen), shows a
/// spinner, then replaces itself with the personalize screen. On failure it
/// shows a friendly message with a way back.
class OpenEventScreen extends StatefulWidget {
  final String slug;
  const OpenEventScreen({super.key, required this.slug});

  @override
  State<OpenEventScreen> createState() => _OpenEventScreenState();
}

class _OpenEventScreenState extends State<OpenEventScreen> {
  final _api = EventeraApi();
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _error = null);
    try {
      final event = await _api.loadEvent(widget.slug);
      final variant = event.defaultVariant;
      if (variant == null) {
        throw EventeraException('This event has no card design yet.');
      }
      if (!mounted) return;
      Navigator.of(context).pushReplacement(MaterialPageRoute(
        builder: (_) =>
            PersonalizeScreen(event: event, initialVariant: variant),
      ));
    } on EventeraException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = 'Something went wrong opening this event.');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(28),
            child: _error == null
                ? const Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      SizedBox(
                        width: 30,
                        height: 30,
                        child: CircularProgressIndicator(
                            strokeWidth: 3, color: Brand.gold),
                      ),
                      SizedBox(height: 18),
                      Text('Opening event…',
                          style: TextStyle(color: Brand.muted, fontSize: 14)),
                    ],
                  )
                : Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.error_outline,
                          color: Brand.danger, size: 34),
                      const SizedBox(height: 14),
                      Text(_error!,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                              color: Brand.inkSoft, fontSize: 15, height: 1.5)),
                      const SizedBox(height: 22),
                      FilledButton(
                        onPressed: _load,
                        child: const Text('Try again'),
                      ),
                      const SizedBox(height: 8),
                      TextButton(
                        onPressed: () => Navigator.of(context)
                            .popUntil((r) => r.isFirst),
                        child: const Text('Enter a different event',
                            style: TextStyle(color: Brand.forest)),
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}
