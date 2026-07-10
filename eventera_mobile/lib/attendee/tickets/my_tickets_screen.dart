import 'package:flutter/material.dart';

import '../../net.dart';
import '../../ui/components.dart';
import '../../ui/tokens.dart';
import '../app_shell.dart';
import '../auth/attendee_auth_screen.dart';
import 'ticket_detail_screen.dart';
import 'ticket_stub.dart';

/// Wallet — the signed-in attendee's tickets (registrations matched by email or
/// user_id), as tear-off wallet stubs. Upcoming / Past segmented. Tab root.
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
  final double? amount;
  final String? currency;

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
    required this.amount,
    required this.currency,
  });
}

class _MyTicketsScreenState extends State<MyTicketsScreen> {
  bool _loading = true;
  String? _error;
  List<_Ticket> _tickets = [];
  int _seg = 0; // 0 = Upcoming, 1 = Past

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

      final orParts = <String>[];
      // ilike (no wildcards) = case-insensitive exact match, so a ticket bought
      // with a differently-cased email still matches.
      if (email.isNotEmpty) orParts.add('attendee_email.ilike.$email');
      if (uid.isNotEmpty) orParts.add('user_id.eq.$uid');
      final orFilter =
          orParts.isEmpty ? 'attendee_email.eq.__none__' : orParts.join(',');

      final rows = await supa
          .from('registrations')
          .select('''
            id, attendee_name, attendee_email, status, qr_code_token, created_at,
            amount_paid, currency,
            ticket_types(name, price),
            events(id, name, slug, event_pages(title, cover_image_url, starts_at, ends_at, venue_name, city, is_online))
          ''')
          .or(orFilter)
          // Show every ticket the user owns except clearly-dead ones, instead of
          // a narrow whitelist that hid bought tickets with other statuses.
          .not('status', 'in', '("cancelled","refunded","failed")')
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
      attendeeName:
          j['attendee_name'] == null ? null : asString(j['attendee_name']),
      status: asString(j['status'], 'confirmed'),
      ticketTypeName: ticket is Map
          ? asString(Map<String, dynamic>.from(ticket)['name'], 'Ticket')
          : null,
      eventName: ev == null ? 'Event' : asString(ev['name'], 'Event'),
      eventSlug: ev == null ? null : asString(ev['slug']),
      startsAt: page == null ? null : asDate(page['starts_at']),
      venue: venue,
      coverUrl: page?['cover_image_url'] == null
          ? null
          : asString(page!['cover_image_url']),
      amount: j['amount_paid'] == null ? null : asDouble(j['amount_paid']),
      currency: j['currency'] == null ? null : asString(j['currency']),
    );
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: MAppBar(
        title: 'My tickets',
        showBack: false,
        actions: const [],
      ),
      body: _body(),
    );
  }

  Widget _body() {
    if (!isSignedIn) {
      return EmptyState(
        icon: Icons.lock_outline,
        title: 'Sign in to see your tickets',
        message:
            'Your registrations are tied to your email — sign in to view and '
            'manage them.',
        ctaLabel: 'Sign in',
        onCta: _promptSignIn,
      );
    }
    if (_loading) return const LoadingState();
    if (_error != null) return ErrorStateView(message: _error!, onRetry: _load);
    if (_tickets.isEmpty) return _emptyWallet();

    final now = DateTime.now();
    final upcoming = _tickets
        .where((t) => t.startsAt == null || !t.startsAt!.isBefore(now))
        .toList();
    final past = _tickets
        .where((t) => t.startsAt != null && t.startsAt!.isBefore(now))
        .toList();
    final shown = _seg == 0 ? upcoming : past;

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(AppSpace.lg, 10, AppSpace.lg, 10),
          child: SegControl(
            segments: const ['Upcoming', 'Past'],
            index: _seg,
            onChanged: (i) => setState(() => _seg = i),
          ),
        ),
        Expanded(
          child: RefreshIndicator(
            color: AppColors.forest,
            onRefresh: _load,
            child: shown.isEmpty
          ? ListView(
              children: [
                SizedBox(height: MediaQuery.of(context).size.height * 0.2),
                EmptyState(
                  icon: Icons.confirmation_number_outlined,
                  title: _seg == 0 ? 'Nothing upcoming' : 'No past tickets',
                  message: _seg == 0
                      ? 'Tickets for future events will show up here.'
                      : 'Events you attended will show up here.',
                ),
              ],
            )
          : ListView(
              padding: const EdgeInsets.fromLTRB(
                  AppSpace.lg, AppSpace.base, AppSpace.lg, AppSpace.xxl),
              children: [
                for (final t in shown) ...[
                  _stub(t),
                  const SizedBox(height: 14),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _emptyWallet() {
    return EmptyState(
      icon: Icons.confirmation_number_outlined,
      title: 'No tickets yet',
      message: 'Register for an event and your ticket will appear here.',
      ctaLabel: 'Discover events',
      // Take the user straight to the Discover tab instead of just telling
      // them where to go.
      onCta: () => mainTab.value = 0,
    );
  }

  Widget _stub(_Ticket t) {
    final past = _seg == 1;
    final when = t.startsAt != null ? _formatDate(t.startsAt!) : 'Date TBA';
    return WalletTicketStub(
      title: t.eventName,
      coverUrl: t.coverUrl,
      whenLine: when,
      status: ticketStatusFrom(t.status),
      typeLabel: (t.ticketTypeName != null && t.ticketTypeName!.isNotEmpty)
          ? t.ticketTypeName!
          : 'Ticket',
      action: past ? 'Receipt' : 'Show QR',
      past: past,
      bg: AppColors.canvas,
      onTap: () => Navigator.of(context).push(MaterialPageRoute(
        builder: (_) => TicketDetailScreen(
          registrationId: t.id,
          qrToken: t.qrToken,
          eventName: t.eventName,
          eventSlug: t.eventSlug,
          coverUrl: t.coverUrl,
          ticketType: t.ticketTypeName,
          attendeeName: t.attendeeName,
          status: t.status,
          venue: t.venue,
          startsAt: t.startsAt,
          amount: t.amount,
          currency: t.currency,
        ),
      )),
    );
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
