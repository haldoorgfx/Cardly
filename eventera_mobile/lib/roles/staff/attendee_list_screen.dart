// O07 / O08 · Staff attendee list — search, filter by status, manual check-in.
// Reads the `list_event_attendees` RPC (062) which returns name / ticket /
// check-in status ONLY (revenue + email are excluded server-side). Manual
// check-in calls `checkin_registration_by_id` (064). Both RPCs enforce
// owner-or-active-staff access, so this screen is safe for the limited staff view.

import 'package:flutter/material.dart';

import '../../net.dart';
import '../../ui/tokens.dart';
import '../../ui/components.dart';

class AttendeeListScreen extends StatefulWidget {
  final String eventId;
  final String eventName;
  const AttendeeListScreen({super.key, required this.eventId, required this.eventName});

  @override
  State<AttendeeListScreen> createState() => _AttendeeListScreenState();
}

class _Attendee {
  final String id, name, ticket;
  bool checkedIn;
  DateTime? checkedInAt;
  _Attendee(this.id, this.name, this.ticket, this.checkedIn, this.checkedInAt);
}

class _AttendeeListScreenState extends State<AttendeeListScreen> {
  late Future<List<_Attendee>> _future;
  List<_Attendee> _all = [];
  int _filter = 0; // 0 all · 1 checked-in · 2 pending
  String _q = '';
  String? _busyId; // registration currently being checked in
  // Owned here so "Show all attendees" can empty the search box, not just the
  // _q that filters on it.
  final TextEditingController _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<List<_Attendee>> _load() async {
    final rows = await supa.rpc(
      'list_event_attendees',
      params: {'p_event_id': widget.eventId},
    );
    final list = (rows as List).map((r) {
      final m = Map<String, dynamic>.from(r as Map);
      return _Attendee(
        asString(m['id']),
        asString(m['attendee_name'], 'Guest'),
        asString(m['ticket'], 'Ticket'),
        asBool(m['checked_in']),
        asDate(m['checked_in_at']),
      );
    }).toList();
    _all = list;
    return list;
  }

  Future<void> _refresh() async {
    final list = await _load();
    if (mounted) setState(() => _future = Future.value(list));
  }

  List<_Attendee> get _visible {
    var list = _all;
    if (_filter == 1) list = list.where((a) => a.checkedIn).toList();
    if (_filter == 2) list = list.where((a) => !a.checkedIn).toList();
    if (_q.isNotEmpty) {
      final q = _q.toLowerCase();
      list = list.where((a) => a.name.toLowerCase().contains(q)).toList();
    }
    return list;
  }

  Future<void> _checkIn(_Attendee a) async {
    setState(() => _busyId = a.id);
    try {
      final res = await supa.rpc('checkin_registration_by_id', params: {
        'p_event_id': widget.eventId,
        'p_registration_id': a.id,
      });
      final m = (res is Map) ? Map<String, dynamic>.from(res) : <String, dynamic>{};
      final result = asString(m['result'], 'error');
      if (result == 'success' || result == 'already_checked_in') {
        a.checkedIn = true;
        a.checkedInAt = asDate(m['checked_in_at']) ?? DateTime.now();
        if (mounted) {
          showToast(context,
              result == 'success' ? '${a.name} checked in' : '${a.name} was already in');
        }
      } else if (mounted) {
        showToast(context, asString(m['message'], 'Could not check in'));
      }
    } catch (e) {
      if (mounted) {
        showToast(context, describeError(e, context: 'that check-in'));
      }
    } finally {
      if (mounted) setState(() => _busyId = null);
    }
  }

  Future<void> _confirmCheckIn(_Attendee a) async {
    final ok = await showModalBottomSheet<bool>(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.sheet))),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 18, 20, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(a.name, style: AppText.h3),
              const SizedBox(height: 4),
              Text(a.ticket, style: AppText.bodySm),
              const SizedBox(height: 18),
              MButton('Check in', icon: Icons.check_rounded,
                  onTap: () => Navigator.pop(ctx, true)),
              const SizedBox(height: 8),
              MButton('Cancel', kind: MBtnKind.sec, onTap: () => Navigator.pop(ctx, false)),
            ],
          ),
        ),
      ),
    );
    if (ok == true) await _checkIn(a);
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: MAppBar(title: 'Attendees'),
      body: FutureBuilder<List<_Attendee>>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const LoadingState();
          }
          if (snap.hasError) {
            final msg = describeError(snap.error, context: 'the attendee list');
            return ErrorStateView(
              message: msg,
              onRetry: _refresh,
              reason: msg.toLowerCase().contains("couldn't reach the server")
                  ? StatusReason.network
                  : msg.toLowerCase().contains('permission')
                      ? StatusReason.permission
                      : StatusReason.generic,
            );
          }
          if (_all.isEmpty) {
            return const EmptyState(
              icon: Icons.people_outline,
              title: 'No attendees yet',
              message: 'Confirmed registrations will appear here as people sign up.',
            );
          }

          final checkedIn = _all.where((a) => a.checkedIn).length;
          final visible = _visible;

          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 6),
                child: MInput(
                  hint: 'Search attendees by name',
                  icon: Icons.search,
                  controller: _searchCtrl,
                  onChanged: (v) => setState(() => _q = v),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
                child: SegControl(
                  segments: ['All ${_all.length}', 'In $checkedIn', 'Pending ${_all.length - checkedIn}'],
                  index: _filter,
                  onChanged: (i) => setState(() => _filter = i),
                ),
              ),
              Expanded(
                child: RefreshIndicator(
                  color: AppColors.forest,
                  onRefresh: _refresh,
                  child: visible.isEmpty
                      ? ListView(children: [
                          const SizedBox(height: 80),
                          EmptyState(
                            icon: Icons.search_off,
                            title: 'No attendees match',
                            message: _q.isNotEmpty
                                ? 'No attendee name contains "$_q" '
                                    'in this filter.'
                                : _filter == 1
                                    ? 'Nobody has checked in yet.'
                                    : 'Everyone here has already checked in.',
                            ctaLabel: 'Show all attendees',
                            onCta: () => setState(() {
                              _q = '';
                              _filter = 0;
                              _searchCtrl.clear();
                            }),
                          ),
                        ])
                      : ListView.separated(
                          padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                          itemCount: visible.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 8),
                          itemBuilder: (_, i) => _row(visible[i]),
                        ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _row(_Attendee a) {
    final busy = _busyId == a.id;
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 12, 12, 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Avatar(name: a.name, size: 40),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(a.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        color: AppColors.ink, fontSize: 14.5, fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text(a.ticket,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(color: AppColors.inkMuted, fontSize: 12.5)),
              ],
            ),
          ),
          const SizedBox(width: 8),
          if (a.checkedIn)
            const Tag('Checked in', kind: TagKind.success, dot: true)
          else if (busy)
            const SizedBox(
                width: 20, height: 20,
                child: CircularProgressIndicator(strokeWidth: 2.2, color: AppColors.forest))
          else
            GestureDetector(
              onTap: () => _confirmCheckIn(a),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: AppColors.forest,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: const Text('Check in',
                    style: TextStyle(color: Colors.white, fontSize: 12.5, fontWeight: FontWeight.w600)),
              ),
            ),
        ],
      ),
    );
  }
}
