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
import '../../ui/tokens.dart';
import '../../ui/components.dart';
import '../../screens/organizer/checkin_scanner_screen.dart';
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
            // Live stat bar
            Container(
              padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 14),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [AppColors.forest, AppColors.forestDark],
                ),
                borderRadius: BorderRadius.circular(AppRadius.card),
                boxShadow: AppShadow.soft,
              ),
              child: Row(
                children: [
                  _stat('$_total', 'Registered'),
                  _divider(),
                  _stat('$_checkedIn', 'Checked in'),
                  _divider(),
                  _stat('$rate%', 'Rate'),
                ],
              ),
            ),
            if (_error) ...[
              const SizedBox(height: 10),
              Text('Live counts unavailable — pull to refresh.',
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

  Widget _stat(String value, String label) {
    return Expanded(
      child: Column(
        children: [
          Text(_loading ? '—' : value,
              style: const TextStyle(
                  color: Colors.white, fontSize: 24, fontWeight: FontWeight.w700)),
          const SizedBox(height: 3),
          Text(label,
              style: const TextStyle(color: Colors.white70, fontSize: 12)),
        ],
      ),
    );
  }

  Widget _divider() => Container(
      width: 1, height: 34, color: Colors.white.withValues(alpha: 0.18));

  Widget _action({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    bool gold = false,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppRadius.card),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.card),
          border: Border.all(color: AppColors.border),
          boxShadow: AppShadow.soft,
        ),
        child: Row(
          children: [
            Container(
              width: 46,
              height: 46,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: gold ? AppColors.goldSoft : AppColors.forestSoft,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon,
                  color: gold ? AppColors.goldHover : AppColors.forest, size: 24),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: AppText.h3.copyWith(fontSize: 15.5)),
                  const SizedBox(height: 2),
                  Text(subtitle, style: AppText.bodySm),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: AppColors.inkMuted),
          ],
        ),
      ),
    );
  }
}
