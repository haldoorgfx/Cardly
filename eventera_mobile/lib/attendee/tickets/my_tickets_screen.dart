import 'package:flutter/material.dart';

import '../../net.dart';
import '../../theme.dart';
import '../auth/attendee_auth_screen.dart';
import 'ticket_detail_screen.dart';

/// Lists the signed-in attendee's tickets (registrations matched by email or
/// user_id). Requires sign-in; prompts otherwise.
class MyTicketsScreen extends StatefulWidget {
  const MyTicketsScreen({super.key});

  @override
  State<MyTicketsScreen> createState() => _MyTicketsScreenState();
}

class _Ticket {
  final String id;
  final String qrToken;
  final String? attendeeName;
  final String status;
  final String? ticketTypeName;
  final String eventName;
  final String? eventSlug;
  final DateTime? startsAt;
  final String? venue;
  final String? coverUrl;

  _Ticket({
    required this.id,
    required this.qrToken,
    required this.attendeeName,
    required this.status,
    required this.ticketTypeName,
    required this.eventName,
    required this.eventSlug,
    required this.startsAt,
    required this.venue,
    required this.coverUrl,
  });
}

class _MyTicketsScreenState extends State<MyTicketsScreen> {
  bool _loading = true;
  String? _error;
  List<_Ticket> _tickets = [];

  @override
  void initState() {
    super.initState();
    if (isSignedIn) {
      _load();
    } else {
      _loading = false;
    }
  }

  Future<void> _promptSignIn() async {
    final ok = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => const AttendeeAuthScreen()),
    );
    if (ok == true && mounted) {
      setState(() => _loading = true);
      _load();
    }
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final email = (currentUserEmail ?? '').toLowerCase();
      final uid = currentUserId ?? '';

      // Match the web query: by attendee_email OR user_id.
      final orParts = <String>[];
      if (email.isNotEmpty) orParts.add('attendee_email.eq.$email');
      if (uid.isNotEmpty) orParts.add('user_id.eq.$uid');
      // A signed-in user always has at least one of these; fall back defensively.
      final orFilter = orParts.isEmpty
          ? 'attendee_email.eq.__none__'
          : orParts.join(',');

      final rows = await supa
          .from('registrations')
          .select('''
            id, attendee_name, attendee_email, status, qr_code_token, created_at,
            ticket_types(name, price),
            events(id, name, slug, event_pages(title, cover_image_url, starts_at, ends_at, venue_name, city, is_online))
          ''')
          .or(orFilter)
          .inFilter('status',
              ['confirmed', 'checked_in', 'pending', 'pending_approval'])
          .order('created_at', ascending: false);

      final tickets = asMapList(rows).map(_parse).toList();

      if (!mounted) return;
      setState(() {
        _tickets = tickets;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = 'Could not load your tickets. Please try again.';
        _loading = false;
      });
    }
  }

  _Ticket _parse(Map<String, dynamic> j) {
    final ticket = j['ticket_types'];
    final event = j['events'];
    final Map<String, dynamic>? ev =
        event is Map ? Map<String, dynamic>.from(event) : null;

    // event_pages may come back as a list (to-many join) or a single map.
    Map<String, dynamic>? page;
    final pages = ev?['event_pages'];
    if (pages is List && pages.isNotEmpty) {
      page = Map<String, dynamic>.from(pages.first as Map);
    } else if (pages is Map) {
      page = Map<String, dynamic>.from(pages);
    }

    String? venue;
    if (page != null) {
      if (asBool(page['is_online'])) {
        venue = 'Online';
      } else {
        venue = (page['venue_name'] != null &&
                asString(page['venue_name']).isNotEmpty)
            ? asString(page['venue_name'])
            : (page['city'] != null ? asString(page['city']) : null);
      }
    }

    return _Ticket(
      id: asString(j['id']),
      qrToken: asString(j['qr_code_token']),
      attendeeName: j['attendee_name'] == null
          ? null
          : asString(j['attendee_name']),
      status: asString(j['status'], 'confirmed'),
      ticketTypeName: ticket is Map
          ? asString(Map<String, dynamic>.from(ticket)['name'], 'Ticket')
          : null,
      eventName: ev == null ? 'Event' : asString(ev['name'], 'Event'),
      eventSlug: ev?['slug'] == null ? null : asString(ev['slug']),
      startsAt: page == null ? null : asDate(page['starts_at']),
      venue: venue,
      coverUrl: page?['cover_image_url'] == null
          ? null
          : asString(page!['cover_image_url']),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Brand.cream,
      appBar: AppBar(
        backgroundColor: Brand.cream,
        elevation: 0,
        foregroundColor: Brand.ink,
        title: const Text('My tickets'),
      ),
      body: SafeArea(child: _body()),
    );
  }

  Widget _body() {
    if (!isSignedIn) {
      return _SignInPrompt(onSignIn: _promptSignIn);
    }
    if (_loading) {
      return const Center(
        child: CircularProgressIndicator(color: Brand.forest),
      );
    }
    if (_error != null) {
      return _CenterMessage(
        icon: Icons.error_outline,
        title: 'Couldn’t load',
        message: _error!,
        actionLabel: 'Retry',
        onAction: _load,
      );
    }
    if (_tickets.isEmpty) {
      return const _CenterMessage(
        icon: Icons.confirmation_number_outlined,
        title: 'No tickets yet',
        message: 'Tickets you register for will appear here.',
      );
    }

    final now = DateTime.now();
    final upcoming = _tickets
        .where((t) => t.startsAt == null || !t.startsAt!.isBefore(now))
        .toList();
    final past = _tickets
        .where((t) => t.startsAt != null && t.startsAt!.isBefore(now))
        .toList();

    return RefreshIndicator(
      color: Brand.forest,
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (upcoming.isNotEmpty) ...[
            _sectionHeader('Upcoming'),
            ...upcoming.map(_ticketCard),
          ],
          if (past.isNotEmpty) ...[
            const SizedBox(height: 8),
            _sectionHeader('Past'),
            ...past.map(_ticketCard),
          ],
        ],
      ),
    );
  }

  Widget _sectionHeader(String text) => Padding(
        padding: const EdgeInsets.only(bottom: 8, top: 4),
        child: Text(
          text,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: Brand.muted,
            letterSpacing: 0.3,
          ),
        ),
      );

  Widget _ticketCard(_Ticket t) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => TicketDetailScreen(
              registrationId: t.id,
              qrToken: t.qrToken,
              eventName: t.eventName,
              eventSlug: t.eventSlug,
              ticketType: t.ticketTypeName,
              attendeeName: t.attendeeName,
              status: t.status,
              venue: t.venue,
              startsAt: t.startsAt,
            ),
          ),
        ),
        child: Container(
          decoration: BoxDecoration(
            color: Brand.surface,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Brand.border),
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (t.coverUrl != null && t.coverUrl!.isNotEmpty)
                Image.network(
                  t.coverUrl!,
                  height: 120,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                ),
              Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      t.eventName,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: Brand.ink,
                      ),
                    ),
                    if (t.startsAt != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        _formatDate(t.startsAt!),
                        style:
                            const TextStyle(fontSize: 13, color: Brand.muted),
                      ),
                    ],
                    if (t.venue != null && t.venue!.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(
                        t.venue!,
                        style:
                            const TextStyle(fontSize: 13, color: Brand.muted),
                      ),
                    ],
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        if (t.ticketTypeName != null)
                          _chip(t.ticketTypeName!, Brand.forest),
                        const SizedBox(width: 6),
                        _chip(_statusLabel(t.status), _statusColor(t.status)),
                        const Spacer(),
                        const Icon(Icons.chevron_right,
                            color: Brand.muted, size: 20),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _chip(String text, Color color) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(999),
        ),
        child: Text(
          text,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: color,
          ),
        ),
      );

  static String _statusLabel(String s) {
    switch (s) {
      case 'confirmed':
        return 'Confirmed';
      case 'checked_in':
        return 'Checked in';
      case 'pending':
        return 'Payment pending';
      case 'pending_approval':
        return 'Awaiting approval';
      default:
        return s;
    }
  }

  static Color _statusColor(String s) {
    switch (s) {
      case 'confirmed':
      case 'checked_in':
        return Brand.success;
      case 'pending':
      case 'pending_approval':
        return Brand.gold;
      default:
        return Brand.muted;
    }
  }

  static String _formatDate(DateTime d) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    final l = d.toLocal();
    final h = l.hour % 12 == 0 ? 12 : l.hour % 12;
    final m = l.minute.toString().padLeft(2, '0');
    final ap = l.hour < 12 ? 'AM' : 'PM';
    return '${months[l.month - 1]} ${l.day}, ${l.year} · $h:$m $ap';
  }
}

class _SignInPrompt extends StatelessWidget {
  final VoidCallback onSignIn;
  const _SignInPrompt({required this.onSignIn});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.lock_outline, size: 40, color: Brand.muted),
            const SizedBox(height: 16),
            const Text(
              'Sign in to see your tickets',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: Brand.ink,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Your registrations are tied to your email — sign in to view '
              'and manage them.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, color: Brand.muted),
            ),
            const SizedBox(height: 20),
            FilledButton(onPressed: onSignIn, child: const Text('Sign in')),
          ],
        ),
      ),
    );
  }
}

class _CenterMessage extends StatelessWidget {
  final IconData icon;
  final String title;
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;

  const _CenterMessage({
    required this.icon,
    required this.title,
    required this.message,
    this.actionLabel,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 40, color: Brand.muted),
            const SizedBox(height: 16),
            Text(
              title,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: Brand.ink,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 14, color: Brand.muted),
            ),
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: 20),
         