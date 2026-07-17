import 'package:flutter/material.dart';

import '../eventera_api.dart';
import '../ui/components.dart';
import '../ui/tokens.dart';
import 'personalize_screen.dart';
import 'pick_design_screen.dart';

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
  StatusReason _errorReason = StatusReason.generic;

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

      // When the event offers more than one design, let the attendee pick one
      // first (screen 14). Any failure here falls back to the default-variant
      // personalize flow below, so the attendee is never blocked.
      bool multiple = false;
      try {
        multiple = event.variants.length > 1;
      } catch (_) {
        multiple = false;
      }

      Navigator.of(context).pushReplacement(MaterialPageRoute(
        builder: (_) => multiple
            ? PickDesignScreen(event: event, initialVariant: variant)
            : PersonalizeScreen(event: event, initialVariant: variant),
      ));
    } on EventeraException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _errorReason = StatusReason.notFound;
      });
    } catch (e) {
      if (!mounted) return;
      final msg = describeError(e, context: 'this event');
      setState(() {
        _error = msg;
        _errorReason = msg.toLowerCase().contains("couldn't reach the server")
            ? StatusReason.network
            : StatusReason.generic;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      body: _error == null
          ? Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: const [
                LoadingState(),
                SizedBox(height: 18),
                Text('Opening event…',
                    style: TextStyle(color: AppColors.inkMuted, fontSize: 14)),
              ],
            )
          : Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ErrorStateView(
                    message: _error!, onRetry: _load, reason: _errorReason),
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: MButton(
                    'Enter a different event',
                    kind: MBtnKind.text,
                    fullWidth: false,
                    onTap: () =>
                        Navigator.of(context).popUntil((r) => r.isFirst),
                  ),
                ),
              ],
            ),
    );
  }
}
