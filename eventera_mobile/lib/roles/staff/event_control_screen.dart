// O02 · On-site event control — the "door" command center for organizers/staff.
// A live stat bar (registered / checked-in / rate) sits above big-action tiles:
// Scan check-in and Attendee list. Counts come from `list_event_attendees` (062)
// so both the owner and the limited staff view work from the same source. A
// realtime subscription on `registrations` (publication added in 061) refreshes
// the counts as people are scanned in from any device; the count also refreshes
// whenever the scanner or attendee list is popped.

import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../net.dart';
import '../../organize/org_widgets.dart';
import '../../screens/organizer/checkin_scanner_screen.dart';
import '../../ui/components.dart';
import '../../ui/tokens.dart';
import 'attendee_list_screen.dart';

class EventControlScreen extends StatefulWidget {
  final String eventId;
  final String eventName;
  /// Whether the caller is the event owner (vs. a limited staff member). Staff
  /// still get scanner + attendee list; owner-only extras can gate on this later.
  final bool isOwner;
  const EventControlScreen({
    super.key,
    required this.eventId,
    required this.eventName,
    this.isOwner = false,
  });

  @override
  State<EventControlScreen> createState() => _EventControlScreenState();
}

class _EventControlScreenState extends State<EventControlScreen> {
  int _total = 0;
  int _checkedIn = 0;
  bool _loading = true;
  bool _error = false;
  RealtimeChannel? _channel;

  @override
  void initState() {
    super.initState();
    _loadCounts();
    _channel = supa
        .channel('checkin:${widget.eventId}')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'registrations',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'event_id',
            value: widget.eventId,
          ),
          callback: (_) => _loadCounts(),
        )
        .subscribe();
  }

  @override
  void dispose() {
    final c = _channel;
    if (c != null) supa.removeChannel(c);
    super.dispose();
  }

  Future<void> _loadCounts() async {
    try {
      final rows = await supa.rpc(
        'list_event_attendees',
        params: {'p_event_id': widget.eventId},
      );
      final list = (rows as List);
      final checked =
          list.where((r) => asBool((r as Map)['checked_in'])).length;
      if (mounted) {
        setState(() {
          _total = list.length;
          _checkedIn = checked;
          _loading = false;
          _error = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() { _loading = false; _error = true; });
    }
  }

  void _openScanner() async {
    await Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => CheckinScannerScreen(
          eventId: widget.eventId, eventName: widget.eventName),
    ));
    _loadCounts(); // refresh after the door session
  }

  void _openList() async {
    await Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => AttendeeListScreen(
          eventId: widget.eventId, eventName: widget.eventName),
    ));
    _loadCounts();
  }

  @override
  Widget build(BuildContext context) {
    final rate = _total == 0 ? 0 : ((_checkedIn / _total) * 100).round();
    return MScaffold(
      appBar: MAppBar(title: widget.eventName),
      body: RefreshIndicator(
        color: AppColors.forest,
        onRefresh: _loadCounts,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
          children: [
            // Live stat bar (O02 .statbar — checked-in count in gold)
            StatBar(cells: [
              (_loading ? '—' : '$_total', 'Registered', false),
              (_loading ? '—' : '$_checkedIn', 'Checked in', true),
              (_loading ? '—' : '$rate%', 'Check-in rate', false),
            ]),
            if (_error) ...[
              const SizedBox(height: 10),
              Text(
                  "We couldn't refresh the live numbers. "
                  'Pull down to try again.',
                  style: AppText.caption.copyWith(color: AppColors.inkMuted)),
            ],
            const SizedBox(height: 20),
            _action(
              icon: Icons.qr_code_scanner,
              title: 'Scan check-in',
              subtitle: 'Open the camera and scan attendee QR codes',
              gold: true,
              onTap: _openScanner,
            ),
            const SizedBox(height: 12),
            _action(
              icon: Icons.people_alt_outlined,
              title: 'Attendee list',
              subtitle: 'Search, filter and check people in manually',
              onTap: _openList,
            ),
            const SizedBox(height: 24),
            Text(
              widget.isOwner
                  ? 'Ticket types, agenda and payouts are managed on eventera.so.'
                  : 'You have on-site check-in access for this event.',
              style: AppText.caption.copyWith(color: AppColors.inkMuted, height: 1.4),
            ),
          ],
        ),
      ),
    );
  }

  // O02 `.bigact` action rows — primary = forest gradient with gold icon.
  Widget _action({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    bool gold = false,
  }) {
    final primary = gold;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppRadius.card),
      child: Container(
        padding: EdgeInsets.all(primary ? 20 : 16),
        decoration: BoxDecoration(
          color: primary ? null : AppColors.surface,
          gradient: primary
              ? const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xFF2A6A50), AppColors.forest],
                  stops: [0.0, 0.75],
                )
              : null,
          borderRadius: BorderRadius.circular(AppRadius.card),
          border: primary ? null : Border.all(color: AppColors.border),
          boxShadow: primary
              ? const [
                  BoxShadow(
                      color: Color(0x8C1F4D3A),
                      blurRadius: 28,
                      offset: Offset(0, 12)),
                ]
              : AppShadow.soft,
        ),
        child: Row(
          children: [
            Container(
              width: 46,
              height: 46,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: primary
                    ? AppColors.gold.withValues(alpha: 0.16)
                    : AppColors.forestSoft,
                borderRadius: BorderRadius.circular(12),
                border: primary
                    ? Border.all(
                        color: AppColors.gold.withValues(alpha: 0.3))
                    : null,
              ),
              child: Icon(icon,
                  color: primary ? AppColors.gold : AppColors.forest,
                  size: primary ? 26 : 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: AppText.h3.copyWith(
                          fontSize: primary ? 18 : 15.5,
                          color: primary ? Colors.white : AppColors.ink)),
                  const SizedBox(height: 2),
                  Text(subtitle,
                      style: AppText.bodySm.copyWith(
                          color: primary
                              ? Colors.white.withValues(alpha: 0.75)
                              : AppColors.inkSoft)),
                ],
              ),
            ),
            Icon(Icons.chevron_right,
                color: primary
                    ? Colors.white.withValues(alpha: 0.6)
                    : AppColors.inkMuted),
          ],
        ),
      ),
    );
  }
}
