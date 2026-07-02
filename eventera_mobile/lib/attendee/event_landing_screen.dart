import 'package:flutter/material.dart';

import '../net.dart';
import '../screens/open_event_screen.dart';
import '../theme.dart';
import 'engage/agenda_screen.dart';
import 'engage/feedback_screen.dart';
import 'engage/leaderboard_screen.dart';
import 'engage/polls_screen.dart';
import 'engage/qa_screen.dart';
import 'hub/event_hub_screen.dart';
import 'network/messages_screen.dart';
import 'network/people_screen.dart';
import 'reg_store.dart';
import 'register/registration_screen.dart';

/// One event, all attendee actions. Resolves the event by slug, then shows a
/// grid of everything an attendee can do: browse the page, register, make a
/// card, and (once registered) engage — agenda, Q&A, polls, people, etc.
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
  bool _hasPage = false;
  String? _regId;

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
      final ev = await supa
          .from('events')
          .select('id, name, slug, status')
          .eq('slug', widget.slug)
          .maybeSingle();
      if (ev == null) {
        throw Exception('not found');
      }
      final id = ev['id'] as String;
      bool hasPage = false;
      try {
        final page = await supa
            .from('event_pages')
            .select('id')
            .eq('event_id', id)
            .maybeSingle();
        hasPage = page != null;
      } catch (_) {}
      final reg = await RegStore.instance.get(widget.slug);
      if (!mounted) return;
      setState(() {
        _eventId = id;
        _name = (ev['name'] as String?) ?? 'Event';
        _hasPage = hasPage;
        _regId = reg?.registrationId;
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

  Future<void> _refreshReg() async {
    final reg = await RegStore.instance.get(widget.slug);
    if (mounted) setState(() => _regId = reg?.registrationId);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Brand.cream,
        surfaceTintColor: Brand.cream,
        elevation: 0,
        title: Text(_name,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
                color: Brand.ink, fontSize: 17, fontWeight: FontWeight.w600)),
        iconTheme: const IconThemeData(color: Brand.ink),
      ),
      body: SafeArea(child: _body()),
    );
  }

  Widget _body() {
    if (_loading) {
      return const Center(
        child: SizedBox(
          width: 26,
          height: 26,
          child:
              CircularProgressIndicator(strokeWidth: 2.5, color: Brand.gold),
        ),
      );
    }
    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, color: Brand.danger, size: 34),
              const SizedBox(height: 12),
              Text(_error!,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Brand.inkSoft, fontSize: 15)),
              const SizedBox(height: 16),
              FilledButton(onPressed: _load, child: const Text('Try again')),
            ],
          ),
        ),
      );
    }

    final id = _eventId!;
    final registered = _regId != null;

    final tiles = <Widget>[
      if (_hasPage)
        _tile(Icons.article_outlined, 'Event page',
            'About, schedule, speakers, sponsors', () {
          Navigator.of(context).push(MaterialPageRoute(
            builder: (_) => EventHubScreen(
              slug: widget.slug,
              onRegister: () => _openRegister(id),
            ),
          ));
        }),
      _tile(Icons.confirmation_number_outlined,
          registered ? 'Registered ✓' : 'Register / get ticket',
          registered ? 'You’re on the list' : 'RSVP or buy a ticket',
          () => _openRegister(id)),
      _tile(Icons.badge_outlined, 'Make your card',
          'Personalize your attendee card', () {
        Navigator.of(context).push(MaterialPageRoute(
          builder: (_) => OpenEventScreen(slug: widget.slug),
        ));
      }),
      _tile(Icons.event_note_outlined, 'Agenda', 'Sessions & your schedule',
          () => _push(AgendaScreen(eventId: id, slug: widget.slug, registrationId: _regId))),
      _tile(Icons.forum_outlined, 'Q & A', 'Ask and upvote questions',
          () => _push(QaScreen(eventId: id, registrationId: _regId))),
      _tile(Icons.poll_outlined, 'Polls', 'Vote in live polls',
          () => _push(PollsScreen(eventId: id, registrationId: _regId))),
      _tile(Icons.people_alt_outlined, 'People', 'Attendees & connections',
          () => _push(PeopleScreen(eventId: id, slug: widget.slug, registrationId: _regId))),
      _tile(Icons.chat_bubble_outline, 'Messages', 'Your 1:1 chats',
          () => _push(MessagesScreen(eventId: id, registrationId: _regId))),
      _tile(Icons.emoji_events_outlined, 'Leaderboard', 'Top attendees',
          () => _push(LeaderboardScreen(eventId: id))),
      _tile(Icons.rate_review_outlined, 'Feedback', 'Rate the event',
          () => _push(FeedbackScreen(eventId: id, registrationId: _regId))),
    ];

    return RefreshIndicator(
      color: Brand.forest,
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (!registered)
            Container(
              margin: const EdgeInsets.only(bottom: 14),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Brand.gold.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Text(
                'Register for the event to unlock agenda booking, Q&A, polls, and networking.',
                style: TextStyle(color: Brand.inkSoft, fontSize: 13, height: 1.4),
              ),
            ),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.15,
            children: tiles,
          ),
        ],
      ),
    );
  }

  Future<void> _openRegister(String id) async {
    await Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => RegistrationScreen(
          eventId: id, slug: widget.slug, eventName: _name),
    ));
    _refreshReg();
  }

  void _push(Widget screen) {
    Navigator.of(context)
        .push(MaterialPageRoute(builder: (_) => screen))
        .then((_) => _refreshReg());
  }

  Widget _tile(
      IconData icon, String title, String subtitle, VoidCallback onTap) {
    return InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Brand.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Brand.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Icon(icon, color: Brand.forest, size: 24),
            const Spacer(),
            Text(title,
                style: const TextStyle(
                    color: Brand.ink,
                    fontSize: 14.5,
                    fontWeight: FontWeight.w600)),
            const SizedBox(height: 2),
            Text(subtitle,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(color: Brand.muted, fontSize: 12)),
          ],
        ),
      ),
    );
  }
}
