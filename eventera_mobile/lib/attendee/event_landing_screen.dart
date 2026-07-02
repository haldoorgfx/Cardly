import 'package:flutter/material.dart';

import '../net.dart';
import '../ui/components.dart';
import 'hub/event_hub_screen.dart';
import 'register/registration_screen.dart';

/// Entry point for one event. Resolves the event by slug, then hands off to the
/// full attendee event page (`EventHubScreen`) — hero, overview, section nav,
/// and the sticky "Get ticket" CTA which pushes the registration flow.
///
/// (Kept as a class + constructor so existing callers keep working.)
class EventLandingScreen extends StatefulWidget {
  final String slug;
  const EventLandingScreen({super.key, required this.slug});

  @override
  State<EventLandingScreen> createState() => _EventLandingScreenState();
}

class _EventLandingScreenState extends State<EventLandingScreen> {
  bool _loading = true;
  String? _error;
  String? _eventId;
  String _name = 'Event';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      String? id;
      String name = 'Event';

      // Resolve by the public event-page slug first (…/e/<custom_slug>),
      // then fall back to the card/event slug (…/c/<slug>).
      final page = await supa
          .from('event_pages')
          .select('event_id, title')
          .eq('custom_slug', widget.slug)
          .maybeSingle();
      if (page != null && page['event_id'] != null) {
        id = asString(page['event_id']);
        name = asString(page['title'], 'Event');
      }

      if (id == null || id.isEmpty) {
        final ev = await supa
            .from('events')
            .select('id, name')
            .eq('slug', widget.slug)
            .maybeSingle();
        if (ev != null && ev['id'] != null) {
          id = asString(ev['id']);
          name = asString(ev['name'], 'Event');
        }
      }

      if (id == null || id.isEmpty) throw Exception('not found');

      if (!mounted) return;
      setState(() {
        _eventId = id;
        _name = name;
        _loading = false;
      });
    } catch (_) {
      if (mounted) {
        setState(() {
          _error = "Couldn't find that event. Check the link or code.";
          _loading = false;
        });
      }
    }
  }

  void _openRegister() {
    final id = _eventId;
    if (id == null) return;
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => RegistrationScreen(
          eventId: id, slug: widget.slug, eventName: _name),
    ));
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const MScaffold(body: LoadingState());
    }
    if (_error != null) {
      return MScaffold(
        appBar: const MAppBar(),
        body: ErrorStateView(message: _error!, onRetry: _load),
      );
    }
    return EventHubScreen(
      slug: widget.slug,
      onRegister: _openRegister,
    );
  }
}
