import 'package:flutter/material.dart';

import '../../net.dart';
import '../../ui/components.dart';
import '../../ui/tokens.dart';
import '../auth/attendee_auth_screen.dart';
import 'ticket_detail_screen.dart';

/// Lists the signed-in attendee's tickets (registrations matched by email or
/// user_id). Requires sign-in; prompts otherwise. Tab root — no back button.
/// Screen 12 (wallet).
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
      eventSlug: ev == null ? null : asString(ev['slug']),
      startsAt: page == null ? null : asDate(page['starts_at']),
      venue: venue,
      coverUrl: page?['cover_image_url'] == null
          ? null
          : asString(page!['cover_image_url']),
    );
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: MAppBar(
        title: 'My tickets',
        showBack: false,
        actions: isSignedIn && !_loading && _error == null && _tickets.isNotEmpty
            ? [
                SizedBox(
                  width: 150,
                  child: SegControl(
                    segments: const ['Upcoming', 'Past'],
                    index: _seg,
                    onChanged: (i) => setState(() => _seg = i),
                  ),
                ),
                const SizedBox(width: 4),
              ]
            : const [],
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
    if (_error != null) {
      return ErrorStateView(message: _error!, onRetry: _load);
    }
    if (_tickets.isEmpty) {
      return const EmptyState(
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
    final shown = _seg == 0 ? upcoming : past;

    return RefreshIndicator(
      color: AppColors.forest,
      onRefresh: _load,
      child: shown.isEmpty
          ? ListView(
              children: [
                SizedBox(height: MediaQuery.of(context).size.height * 0.22),
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
                  AppSpace.lg, AppSpace.base, AppSpace.lg, AppSpace.base),
              children: shown.map(_ticketCard).toList(),
            ),
    );
  }

  Widget _ticketCard(_Ticket t) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: GestureDetector(
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
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(AppRadius.card),
            border: Border.all(color: AppColors.border),
            boxShadow: AppShadow.soft,
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Row: cover + info.
              Padding(
                padding: const EdgeInsets.all(13),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: SizedBox(
                        width: 64,
                        height: 64,
                        child: (t.coverUrl != null && t.coverUrl!.isNotEmpty)
                            ? Image.network(
                                t.coverUrl!,
                                fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) => PhotoPlaceholder(
                                    hue: hueFromString(t.id)),
                              )
                            : PhotoPlaceholder(hue: hueFromString(t.id)),
                      ),
                    ),
                    const SizedBox(width: 13),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(t.eventName,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: AppText.h3.copyWith(fontSize: 15)),
                          if (t.startsAt != null) ...[
                            const SizedBox(height: 4),
                            Text(_formatDate(t.startsAt!),
                                style: AppText.numSm.copyWith(
                                    color: AppColors.inkMuted, fontSize: 11.5)),
                          ],
                          const SizedBox(height: 8),
                          Tag(_statusLabel(t.status),
                              kind: _statusKind(t.status), dot: true),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              // Tear-off footer: "Show QR".
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 11),
                decoration: const BoxDecoration(
                  color: Color(0xFFFBFAF6),
                  border:
                      Border(top: BorderSide(color: AppColors.border)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      t.ticketTypeName != null && t.ticketTypeName!.isNotEmpty
                          ? t.ticketTypeName!
                          : 'Ticket',
                      style: AppText.numSm.copyWith(
                          color: AppColors.inkMuted, fontSize: 11),
                    ),
                    Row(
                      children: [
                        Text('Show QR',
                            style: AppText.bodySm.copyWith(
                                color: AppColors.forest,
                                fontWeight: FontWeight.w600)),
                        const SizedBox(width: 5),
                        const Icon(Icons.chevron_right,
                            size: 14, color: AppColors.forest),
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

  static TagKind _statusKind(String s) {
    switch (s) {
      case 'confirmed':
        return TagKind.success;
      case 'checked_in':
        return TagKind.forest;
      case 'pending':
      case 'pending_approval':
        return TagKind.warning;
      default:
        return TagKind.info;
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
