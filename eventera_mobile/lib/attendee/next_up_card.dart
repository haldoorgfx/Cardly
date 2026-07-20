import 'package:flutter/material.dart';

import '../net.dart';
import '../tz.dart';
import '../ui/components.dart';
import '../ui/tokens.dart';
import 'event_landing_screen.dart';
import 'tickets/ticket_detail_screen.dart';

/// "Next up" — the signed-in attendee's nearest upcoming ticket, surfaced at
/// the top of Discover.
///
/// WHY this exists: Discover had no awareness of the user's own tickets, so
/// someone whose event started in two hours opened the app to a generic browse
/// feed. The single most important thing at that moment — where am I going,
/// and what do I do when I arrive — was several taps away behind another tab.
///
/// The card is deliberately state-aware rather than a static "you have a
/// ticket" row: what you need from a ticket three weeks out (the details) is
/// not what you need when the doors are open (the QR code).
class NextUpCard extends StatefulWidget {
  const NextUpCard({super.key});

  @override
  State<NextUpCard> createState() => _NextUpCardState();
}

class _NextUp {
  final String registrationId;
  final String qrToken;
  final String eventName;
  final String? eventSlug;
  final DateTime? startsAt; // in the EVENT's zone, not the viewer's
  final DateTime? endsAt;
  final String? venue;
  final bool isOnline;
  final String attendeeName;
  final String ticketType;

  _NextUp({
    required this.registrationId,
    required this.qrToken,
    required this.eventName,
    required this.eventSlug,
    required this.startsAt,
    required this.endsAt,
    required this.venue,
    required this.isOnline,
    required this.attendeeName,
    required this.ticketType,
  });

}

class _NextUpCardState extends State<NextUpCard> {
  _NextUp? _next;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    if (!isSignedIn) {
      if (mounted) setState(() => _loading = false);
      return;
    }
    try {
      final email = (currentUserEmail ?? '').toLowerCase();
      final uid = currentUserId ?? '';
      final orParts = <String>[];
      if (email.isNotEmpty) orParts.add('attendee_email.ilike.$email');
      if (uid.isNotEmpty) orParts.add('user_id.eq.$uid');
      if (orParts.isEmpty) {
        if (mounted) setState(() => _loading = false);
        return;
      }

      final rows = await supa
          .from('registrations')
          .select('''
            id, qr_code_token, status, attendee_name,
            ticket_types(name),
            events(name, slug, event_pages(title, starts_at, ends_at, venue_name, city, is_online, timezone))
          ''')
          .or(orParts.join(','))
          .not('status', 'in', '("cancelled","refunded","failed")')
          .order('created_at', ascending: false)
          .limit(40);

      // starts_at lives on the nested event_pages row, so PostgREST can't
      // order by it — pick the nearest future event in memory instead.
      final now = DateTime.now();
      _NextUp? best;
      DateTime? bestStart;
      for (final r in asMapList(rows)) {
        final ev = r['events'];
        if (ev is! Map) continue;
        final pages = ev['event_pages'];
        final page = (pages is List && pages.isNotEmpty)
            ? pages.first
            : (pages is Map ? pages : null);
        if (page is! Map) continue;

        final zone = page['timezone'] as String?;
        final starts = toEventZone(
            DateTime.tryParse('${page['starts_at'] ?? ''}')?.toLocal(), zone);
        final ends = toEventZone(
            DateTime.tryParse('${page['ends_at'] ?? ''}')?.toLocal(), zone);
        if (starts == null) continue;

        // Still relevant while it's running, not just before it starts.
        final over = (ends ?? starts.add(const Duration(hours: 3))).isBefore(now);
        if (over) continue;
        if (bestStart != null && !starts.isBefore(bestStart)) continue;

        bestStart = starts;
        final venue = (page['is_online'] == true)
            ? 'Online'
            : (page['venue_name'] as String?)?.trim().isNotEmpty == true
                ? page['venue_name'] as String
                : (page['city'] as String?);
        final tt = r['ticket_types'];
        best = _NextUp(
          registrationId: '${r['id'] ?? ''}',
          qrToken: '${r['qr_code_token'] ?? ''}',
          eventName: '${page['title'] ?? ev['name'] ?? 'Your event'}',
          eventSlug: ev['slug'] as String?,
          startsAt: starts,
          endsAt: ends,
          venue: venue,
          isOnline: page['is_online'] == true,
          attendeeName: '${r['attendee_name'] ?? ''}',
          ticketType: tt is Map ? '${tt['name'] ?? ''}' : '',
        );
      }

      if (!mounted) return;
      setState(() {
        _next = best;
        _loading = false;
      });
    } catch (_) {
      // Never let this block Discover — it's an enhancement on top of the feed.
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final n = _next;
    if (_loading || n == null) return const SizedBox.shrink();

    final now = DateTime.now();
    final start = n.startsAt!;
    final live = start.isBefore(now);
    final until = start.difference(now);
    final soon = !live && until.inHours < 24;

    // The label answers "when", in the words someone actually uses out loud.
    final String when;
    if (live) {
      when = 'Happening now';
    } else if (until.inMinutes < 60) {
      when = 'Starts in ${until.inMinutes} min';
    } else if (until.inHours < 24) {
      when = 'Today at ${_time(start)}';
    } else if (until.inDays == 1) {
      when = 'Tomorrow at ${_time(start)}';
    } else if (until.inDays < 7) {
      when = 'In ${until.inDays} days · ${_time(start)}';
    } else {
      when = '${_date(start)} · ${_time(start)}';
    }

    // Doors-open window: the QR is what you need in your hand, so it gets the
    // primary button. Before that, opening the event is the useful action.
    final qrFirst = live || soon;

    // No horizontal padding — the host list already provides it.
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpace.base),
      child: MCard(
        padding: const EdgeInsets.all(AppSpace.base),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Tag(live ? 'Happening now' : 'Next up',
                    kind: live ? TagKind.gold : TagKind.forest, dot: live),
                const Spacer(),
                if (!live)
                  Text(when,
                      style: AppText.caption
                          .copyWith(color: AppColors.inkMuted)),
              ],
            ),
            const SizedBox(height: AppSpace.md),
            Text(n.eventName,
                style: AppText.h3, maxLines: 2, overflow: TextOverflow.ellipsis),
            if (n.venue != null && n.venue!.isNotEmpty) ...[
              const SizedBox(height: AppSpace.xs),
              Row(
                children: [
                  Icon(n.isOnline ? Icons.videocam_outlined : Icons.place_outlined,
                      size: 15, color: AppColors.inkMuted),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(n.venue!,
                        style: AppText.bodySm
                            .copyWith(color: AppColors.inkMuted),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis),
                  ),
                ],
              ),
            ],
            const SizedBox(height: AppSpace.base),
            Row(
              children: [
                Expanded(
                  child: MButton(
                    qrFirst ? 'Show my ticket' : 'Open event',
                    kind: MBtnKind.forest,
                    onTap: qrFirst ? _openTicket : _openEvent,
                  ),
                ),
                const SizedBox(width: AppSpace.sm),
                Expanded(
                  child: MButton(
                    qrFirst ? 'Open event' : 'My ticket',
                    kind: MBtnKind.sec,
                    onTap: qrFirst ? _openEvent : _openTicket,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _openEvent() {
    final slug = _next?.eventSlug;
    if (slug == null || slug.isEmpty) return;
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => EventLandingScreen(slug: slug)),
    );
  }

  /// Routes to the ticket screen rather than pushing a QR directly: it already
  /// owns the exact qrData the scanner expects and the ticket-code format, and
  /// duplicating either here would silently drift out of sync with check-in.
  void _openTicket() {
    final n = _next;
    if (n == null || n.registrationId.isEmpty) return;
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => TicketDetailScreen(
          registrationId: n.registrationId,
          qrToken: n.qrToken,
          eventName: n.eventName,
          eventSlug: n.eventSlug,
          ticketType: n.ticketType,
          attendeeName: n.attendeeName,
          venue: n.venue,
          startsAt: n.startsAt,
        ),
      ),
    );
  }

  static String _time(DateTime d) {
    final h = d.hour % 12 == 0 ? 12 : d.hour % 12;
    final m = d.minute.toString().padLeft(2, '0');
    return '$h:$m ${d.hour < 12 ? 'AM' : 'PM'}';
  }

  static const _months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  static String _date(DateTime d) => '${_months[d.month - 1]} ${d.day}';
}
