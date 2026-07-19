import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../eventera_api.dart';
import '../models.dart';
import '../net.dart';
import '../ui/components.dart';
import '../ui/tokens.dart';
import 'organizer_api.dart';

/// Organize · Attendees (O07) — pick an event, then search, filter and check
/// people in. Same look as the design ref: search field, All / Checked in /
/// Pending segments with counts, avatar rows with a status dot.
class OrganizerAttendeesTab extends StatefulWidget {
  const OrganizerAttendeesTab({super.key});

  @override
  State<OrganizerAttendeesTab> createState() => _OrganizerAttendeesTabState();
}

class _Attendee {
  final String id, name, ticket;
  String status; // confirmed | checked_in | pending | pending_approval
  bool checkedIn;
  DateTime? checkedInAt;
  _Attendee(this.id, this.name, this.ticket, this.status, this.checkedIn,
      this.checkedInAt);

  bool get awaitingApproval => status == 'pending_approval';
  bool get pendingPayment => status == 'pending';
}

class _OrganizerAttendeesTabState extends State<OrganizerAttendeesTab> {
  List<OrganizerEvent>? _events;
  String? _selectedId;
  List<_Attendee> _attendees = [];
  bool _loadingEvents = true;
  bool _loadingList = false;
  String? _error;
  StatusReason _errorReason = StatusReason.generic;
  String? _listError;
  StatusReason _listErrorReason = StatusReason.generic;
  int _filter = 0; // 0 all · 1 checked-in · 2 pending
  String _q = '';
  String? _busyId;
  final _searchCtl = TextEditingController();
  final _org = const OrganizerApi();

  @override
  void initState() {
    super.initState();
    _loadEvents();
  }

  @override
  void dispose() {
    _searchCtl.dispose();
    super.dispose();
  }

  Future<void> _loadEvents() async {
    try {
      final events = await EventeraApi().myEvents();
      // Default to today's live event, else the first published, else first.
      OrganizerEvent? pick;
      for (final e in events) {
        if (e.isToday && e.isPublished) { pick = e; break; }
      }
      pick ??= events.where((e) => e.isPublished).firstOrNull ?? events.firstOrNull;
      if (mounted) {
        setState(() {
          _events = events;
          _selectedId = pick?.id;
          _loadingEvents = false;
          _error = null;
        });
      }
      if (pick != null) _loadList(pick.id);
    } catch (e) {
      if (mounted) {
        final msg = describeError(e, context: 'your events');
        setState(() {
          _loadingEvents = false;
          _error = msg;
          _errorReason = msg.toLowerCase().contains("couldn't reach the server")
              ? StatusReason.network
              : StatusReason.generic;
        });
      }
    }
  }

  Future<void> _loadList(String eventId) async {
    setState(() {
      _loadingList = true;
      _listError = null;
    });
    try {
      final rows = await supa
          .rpc('list_event_attendees', params: {'p_event_id': eventId});
      final list = (rows as List).map((r) {
        final m = Map<String, dynamic>.from(r as Map);
        return _Attendee(
          asString(m['id']),
          asString(m['attendee_name'], 'Guest'),
          asString(m['ticket'], 'Ticket'),
          asString(m['status'], 'confirmed'),
          asBool(m['checked_in']),
          asDate(m['checked_in_at']),
        );
      }).toList();
      if (mounted && _selectedId == eventId) {
        setState(() {
          _attendees = list;
          _loadingList = false;
        });
      }
    } catch (e) {
      // Never dress an error up as "no attendees" — say what happened.
      if (mounted && _selectedId == eventId) {
        final msg = describeError(e, context: 'the attendee list');
        setState(() {
          _attendees = [];
          _loadingList = false;
          _listError = msg;
          _listErrorReason = msg.toLowerCase().contains("couldn't reach the server")
              ? StatusReason.network
              : StatusReason.generic;
        });
      }
    }
  }

  Future<void> _refresh() async {
    final id = _selectedId;
    if (id != null) await _loadList(id);
  }

  void _select(OrganizerEvent e) {
    if (_selectedId == e.id) return;
    setState(() {
      _selectedId = e.id;
      _attendees = [];
      _filter = 0;
    });
    _loadList(e.id);
  }

  List<_Attendee> get _visible {
    var list = _attendees;
    if (_filter == 1) list = list.where((a) => a.checkedIn).toList();
    if (_filter == 2) list = list.where((a) => !a.checkedIn).toList();
    if (_q.isNotEmpty) {
      final q = _q.toLowerCase();
      list = list.where((a) => a.name.toLowerCase().contains(q)).toList();
    }
    return list;
  }

  int get _checkedCount => _attendees.where((a) => a.checkedIn).length;

  // Entry point for the AppBar's add icon — a small choice between adding
  // one walk-in or a whole group at once, instead of crowding the toolbar
  // with a second icon.
  Future<void> _openAddMenu() async {
    final id = _selectedId;
    if (id == null) return;
    HapticFeedback.selectionClick();
    final choice = await showMSheet<String>(
      context,
      Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Add attendees', style: AppText.h3),
          const SizedBox(height: 6),
          Text('Register one person at the door, or confirm a whole group at once.',
              style: AppText.bodySm),
          const SizedBox(height: 16),
          MButton('Add a walk-in',
              icon: Icons.person_add_alt_1,
              onTap: () => Navigator.of(context).pop('walk_in')),
          const SizedBox(height: 10),
          MButton('Add a group',
              kind: MBtnKind.sec,
              icon: Icons.groups_outlined,
              onTap: () => Navigator.of(context).pop('group')),
          const SizedBox(height: 4),
          MButton('Cancel',
              kind: MBtnKind.text, onTap: () => Navigator.of(context).pop()),
        ],
      ),
    );
    if (!mounted || choice == null) return;
    if (choice == 'walk_in') {
      await _openWalkIn(id);
    } else if (choice == 'group') {
      await _openGroupAdd(id);
    }
  }

  // Walk-in / at-the-door registration — direct Supabase insert (status
  // confirmed), then refresh the list so the new person is checkable.
  Future<void> _openWalkIn(String id) async {
    final res = await showMSheet<WalkInResult>(
      context,
      _WalkInSheet(eventId: id, org: _org),
    );
    if (res == null || !mounted) return;
    if (res.created) {
      showToast(context, '${res.name} added to the list ✓');
    } else if (res.checkedInNow) {
      showToast(context, '${res.name} was on the list — checked in ✓');
    } else if (res.alreadyCheckedIn) {
      showToast(context, '${res.name} is already checked in.');
    } else {
      showToast(context, '${res.name} is already on the list.');
    }
    await _loadList(id);
  }

  // Group/bulk registration — mirrors web's group-register tool for
  // confirming a whole company/party at once (payment already collected
  // out-of-band; this just creates the confirmed registrations).
  Future<void> _openGroupAdd(String id) async {
    final count = await showMSheet<int>(
      context,
      _GroupAddSheet(eventId: id, org: _org),
    );
    if (count == null || !mounted) return;
    showToast(context, '$count ${count == 1 ? 'seat' : 'seats'} registered ✓');
    await _loadList(id);
  }

  // Manual check-in (O08) — confirm sheet, then the by-id RPC.
  // Approve / decline an approval-gated registration via the RPC (075).
  Future<void> _decide(_Attendee a, bool approve) async {
    final eventId = _selectedId;
    if (eventId == null) return;
    HapticFeedback.selectionClick();
    setState(() => _busyId = a.id);
    try {
      final res = await supa.rpc('approve_registration', params: {
        'p_event_id': eventId,
        'p_registration_id': a.id,
        'p_action': approve ? 'approve' : 'reject',
      });
      final m =
          (res is Map) ? Map<String, dynamic>.from(res) : <String, dynamic>{};
      final result = asString(m['result'], 'error');
      if (result == 'approved') {
        setState(() => a.status = 'confirmed');
        if (mounted) showToast(context, '${a.name} approved ✓');
      } else if (result == 'rejected') {
        // Drop declined rows from the visible list.
        setState(() => _attendees.removeWhere((x) => x.id == a.id));
        if (mounted) showToast(context, '${a.name} declined');
      } else if (result == 'full') {
        if (mounted) {
          showToast(context, 'Your event is at full capacity — can\'t approve.');
        }
      } else if (mounted) {
        showToast(context,
            asString(m['message'], "That didn't go through. Try again."),
            type: ToastType.error);
      }
    } catch (e) {
      if (mounted) {
        showToast(context, describeError(e, context: 'that approval'),
            type: ToastType.error);
      }
    } finally {
      if (mounted) setState(() => _busyId = null);
    }
  }

  Future<void> _tapAttendee(_Attendee a) async {
    final eventId = _selectedId;
    if (eventId == null) return;
    HapticFeedback.selectionClick();
    // Approval-gated rows get an approve/decline sheet, not check-in.
    if (a.awaitingApproval) {
      final choice = await showMSheet<String>(context, _ApprovalSheet(attendee: a));
      if (choice == 'approve') _decide(a, true);
      if (choice == 'reject') _decide(a, false);
      return;
    }
    if (a.checkedIn) {
      showToast(context,
          '${a.name} is already in — checked in at ${_time(a.checkedInAt)}.');
      return;
    }
    final ok = await showMSheet<bool>(context, _CheckinSheet(attendee: a));
    if (ok != true || !mounted) return;

    setState(() => _busyId = a.id);
    try {
      final res = await supa.rpc('checkin_registration_by_id', params: {
        'p_event_id': eventId,
        'p_registration_id': a.id,
      });
      final m =
          (res is Map) ? Map<String, dynamic>.from(res) : <String, dynamic>{};
      final result = asString(m['result'], 'error');
      if (result == 'success' || result == 'already_checked_in') {
        setState(() {
          a.checkedIn = true;
          a.checkedInAt = asDate(m['checked_in_at']) ?? DateTime.now();
        });
        if (mounted) {
          showToast(
              context,
              result == 'success'
                  ? '${a.name} checked in ✓'
                  : '${a.name} was already in');
        }
      } else if (mounted) {
        showToast(context,
            asString(m['message'], "That didn't go through. Try again."),
            type: ToastType.error);
      }
    } catch (e) {
      if (mounted) {
        showToast(context, describeError(e, context: 'that check-in'),
            type: ToastType.error);
      }
    } finally {
      if (mounted) setState(() => _busyId = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final canWalkIn = _selectedId != null && !_loadingEvents && _error == null;
    return MScaffold(
      appBar: MAppBar(
        title: 'Attendees',
        showBack: false,
        hairline: true,
        actions: [
          if (canWalkIn)
            AppBarAction(Icons.person_add_alt_1,
                color: AppColors.forest, onTap: _openAddMenu),
        ],
      ),
      body: _body(),
    );
  }

  Widget _body() {
    if (_loadingEvents) return const LoadingState();

    if (_error != null) {
      return ErrorStateView(
        message: _error!,
        reason: _errorReason,
        onRetry: () {
          setState(() {
            _loadingEvents = true;
            _error = null;
          });
          _loadEvents();
        },
      );
    }

    final events = _events ?? const [];
    if (events.isEmpty) {
      return const EmptyState(
        icon: Icons.people_alt_outlined,
        title: 'No attendees yet',
        message: 'When people register for your events, '
            "they'll show up here — searchable and ready to check in.",
      );
    }

    final total = _attendees.length;
    final checked = _checkedCount;
    final pending = total - checked;

    return Column(children: [
      // Event picker chips (only when there's more than one event).
      if (events.length > 1)
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 10, 0, 0),
          child: SizedBox(
            height: 34,
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: [
                for (final e in events) ...[
                  MChip(e.name,
                      selected: e.id == _selectedId, onTap: () => _select(e)),
                  const SizedBox(width: 8),
                ],
              ],
            ),
          ),
        ),
      // Search field.
      Padding(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 10),
        child: Container(
          height: 44,
          padding: const EdgeInsets.symmetric(horizontal: 15),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(AppRadius.input),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(children: [
            const Icon(Icons.search, size: 18, color: AppColors.inkMuted),
            const SizedBox(width: 10),
            Expanded(
              child: TextField(
                controller: _searchCtl,
                onChanged: (v) => setState(() => _q = v.trim()),
                style: AppText.body.copyWith(fontSize: 15, height: 1.2),
                decoration: InputDecoration(
                  isDense: true,
                  border: InputBorder.none,
                  hintText: 'Search by name',
                  hintStyle: AppText.body
                      .copyWith(fontSize: 15, color: AppColors.inkMuted),
                ),
              ),
            ),
            if (_q.isNotEmpty)
              GestureDetector(
                onTap: () {
                  _searchCtl.clear();
                  setState(() => _q = '');
                },
                child: const Icon(Icons.close,
                    size: 17, color: AppColors.inkMuted),
              ),
          ]),
        ),
      ),
      // Segmented filter with counts (.segnav).
      Container(
        height: 42,
        decoration: const BoxDecoration(
          border: Border(bottom: BorderSide(color: AppColors.border)),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12),
        child: Row(children: [
          _seg(0, 'All', total),
          _seg(1, 'Checked in', checked),
          _seg(2, 'Pending', pending),
        ]),
      ),
      Expanded(
        child: RefreshIndicator(
          color: AppColors.forest,
          onRefresh: _refresh,
          child: _list(),
        ),
      ),
    ]);
  }

  Widget _seg(int i, String label, int count) {
    final on = _filter == i;
    return GestureDetector(
      onTap: () => setState(() => _filter = i),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12),
        decoration: BoxDecoration(
          border: Border(
              bottom: BorderSide(
                  color: on ? AppColors.forest : Colors.transparent, width: 2)),
        ),
        alignment: Alignment.center,
        child: Text.rich(TextSpan(children: [
          TextSpan(text: '$label · '),
          TextSpan(
              text: '$count',
              style: TextStyle(
                  fontWeight: FontWeight.w600,
                  color: on ? AppColors.forest : AppColors.inkMuted)),
        ]),
            style: AppText.subhead.copyWith(
                fontSize: 14,
                fontWeight: on ? FontWeight.w600 : FontWeight.w500,
                color: on ? AppColors.forest : AppColors.inkMuted)),
      ),
    );
  }

  Widget _list() {
    if (_loadingList) return const LoadingState();

    if (_listError != null) {
      return ListView(children: [
        const SizedBox(height: 60),
        ErrorStateView(
          message: _listError!,
          reason: _listErrorReason,
          onRetry: () {
            final id = _selectedId;
            if (id != null) _loadList(id);
          },
        ),
      ]);
    }

    final visible = _visible;
    if (visible.isEmpty) {
      // O07b empty search / empty list.
      if (_q.isNotEmpty) {
        return ListView(children: [
          const SizedBox(height: 60),
          EmptyState(
            icon: Icons.search,
            title: 'No matches',
            message:
                'No attendee matches “$_q”. Try a different name — or pull '
                'down to refresh the list.',
          ),
        ]);
      }
      if (_attendees.isEmpty) {
        return ListView(children: const [
          SizedBox(height: 60),
          EmptyState(
            icon: Icons.people_alt_outlined,
            title: 'No one has registered yet',
            message: 'As soon as someone registers for this event, '
                "they'll appear here.",
          ),
        ]);
      }
      return ListView(children: [
        const SizedBox(height: 60),
        EmptyState(
          icon: _filter == 1 ? Icons.how_to_reg_outlined : Icons.schedule,
          title: _filter == 1 ? 'No one checked in yet' : 'No one pending',
          message: _filter == 1
              ? 'Scanned or manually checked-in attendees will show here.'
              : 'Everyone who registered is already in. Nice.',
        ),
      ]);
    }

    return ListView.separated(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 20),
      itemCount: visible.length,
      separatorBuilder: (_, __) =>
          const Divider(height: 1, color: AppColors.border),
      itemBuilder: (_, i) => _row(visible[i]),
    );
  }

  // Attendee row (.arow): hue avatar · name + ticket · status dot.
  Widget _row(_Attendee a) {
    final busy = _busyId == a.id;
    return InkWell(
      onTap: busy ? null : () => _tapAttendee(a),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Row(children: [
          SizedBox(
            width: 40,
            height: 40,
            child: ClipOval(
              child: PhotoPlaceholder(
                hue: hueFromString(a.id),
                child: Text(_initials(a.name),
                    style: AppText.h3
                        .copyWith(color: Colors.white, fontSize: 14)),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(a.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.h3.copyWith(fontSize: 14.5)),
                const SizedBox(height: 2),
                Text(
                  a.awaitingApproval
                      ? '${a.ticket} · awaiting approval'
                      : a.pendingPayment
                          ? '${a.ticket} · payment pending'
                          : a.checkedIn
                              ? '${a.ticket} · in at ${_time(a.checkedInAt)}'
                              : a.ticket,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.bodySm
                      .copyWith(fontSize: 12, color: AppColors.inkMuted),
                ),
              ],
            ),
          ),
          if (busy)
            const SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(
                    strokeWidth: 2, color: AppColors.forest))
          else if (a.awaitingApproval)
            // Quick approve/decline right in the row.
            Row(mainAxisSize: MainAxisSize.min, children: [
              _pillBtn(Icons.check, AppColors.success, () => _decide(a, true)),
              const SizedBox(width: 8),
              _pillBtn(Icons.close, AppColors.danger, () => _decide(a, false)),
            ])
          else
            Container(
              width: 9,
              height: 9,
              decoration: BoxDecoration(
                color: a.checkedIn
                    ? AppColors.success
                    : a.pendingPayment
                        ? AppColors.warning
                        : AppColors.borderStrong,
                shape: BoxShape.circle,
                boxShadow: a.checkedIn
                    ? [
                        BoxShadow(
                            color: AppColors.success.withValues(alpha: 0.16),
                            spreadRadius: 3),
                      ]
                    : null,
              ),
            ),
        ]),
      ),
    );
  }

  Widget _pillBtn(IconData icon, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 34,
        height: 34,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.10),
          shape: BoxShape.circle,
          border: Border.all(color: color.withValues(alpha: 0.30)),
        ),
        child: Icon(icon, size: 18, color: color),
      ),
    );
  }

  static String _initials(String name) {
    final parts =
        name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts.first[0].toUpperCase();
    return (parts.first[0] + parts.last[0]).toUpperCase();
  }

  static String _time(DateTime? t) {
    if (t == null) return '—';
    final local = t.toLocal();
    return '${local.hour.toString().padLeft(2, '0')}:${local.minute.toString().padLeft(2, '0')}';
  }
}

/// Manual check-in confirm sheet (O08-lite).
class _CheckinSheet extends StatelessWidget {
  final _Attendee attendee;
  const _CheckinSheet({required this.attendee});

  @override
  Widget build(BuildContext context) {
    return Column(mainAxisSize: MainAxisSize.min, children: [
      SizedBox(
        width: 64,
        height: 64,
        child: ClipOval(
          child: PhotoPlaceholder(
            hue: hueFromString(attendee.id),
            child: Text(
                attendee.name.isEmpty ? '?' : attendee.name[0].toUpperCase(),
                style: AppText.h2.copyWith(color: Colors.white, fontSize: 22)),
          ),
        ),
      ),
      const SizedBox(height: 14),
      Text(attendee.name, style: AppText.h3.copyWith(fontSize: 18)),
      const SizedBox(height: 4),
      Text(attendee.ticket, style: AppText.bodySm),
      const SizedBox(height: 14),
      Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.goldSoft,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(children: [
          const Icon(Icons.info_outline,
              size: 17, color: AppColors.goldHover),
          const SizedBox(width: 9),
          Expanded(
            child: Text(
              "Use manual check-in only when the QR won't scan.",
              style: AppText.bodySm
                  .copyWith(fontSize: 12, color: AppColors.inkSoft),
            ),
          ),
        ]),
      ),
      const SizedBox(height: 16),
      MButton('Check in manually',
          icon: Icons.check,
          onTap: () => Navigator.of(context).pop(true)),
      const SizedBox(height: 4),
      MButton('Cancel',
          kind: MBtnKind.text,
          onTap: () => Navigator.of(context).pop(false)),
    ]);
  }
}

/// Approve / decline sheet for an approval-gated registration.
class _ApprovalSheet extends StatelessWidget {
  final _Attendee attendee;
  const _ApprovalSheet({required this.attendee});

  @override
  Widget build(BuildContext context) {
    return Column(mainAxisSize: MainAxisSize.min, children: [
      SizedBox(
        width: 64,
        height: 64,
        child: ClipOval(
          child: PhotoPlaceholder(
            hue: hueFromString(attendee.id),
            child: Text(
                attendee.name.isEmpty ? '?' : attendee.name[0].toUpperCase(),
                style: AppText.h2.copyWith(color: Colors.white, fontSize: 22)),
          ),
        ),
      ),
      const SizedBox(height: 14),
      Text(attendee.name, style: AppText.h3.copyWith(fontSize: 18)),
      const SizedBox(height: 4),
      Text('${attendee.ticket} · awaiting your approval', style: AppText.bodySm),
      const SizedBox(height: 18),
      MButton('Approve',
          icon: Icons.check,
          onTap: () => Navigator.of(context).pop('approve')),
      const SizedBox(height: 8),
      GestureDetector(
        onTap: () => Navigator.of(context).pop('reject'),
        behavior: HitTestBehavior.opaque,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 10),
          child: Text('Decline',
              style: AppText.bodyStrong.copyWith(color: AppColors.danger)),
        ),
      ),
    ]);
  }
}

/// Walk-in / at-the-door registration sheet — adds an already-checked-in
/// registration straight to the list (or reports a duplicate). Mirrors the
/// web walk-in flow.
class _WalkInSheet extends StatefulWidget {
  final String eventId;
  final OrganizerApi org;
  const _WalkInSheet({required this.eventId, required this.org});

  @override
  State<_WalkInSheet> createState() => _WalkInSheetState();
}

class _WalkInSheetState extends State<_WalkInSheet> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  bool _busy = false;
  String? _error;

  // Ticket selection — a paid ticket routes the sale through the server RPC
  // (real price + cash shift, server-authoritative amount); null = "Free entry"
  // keeps the $0 general-admission path.
  List<Map<String, dynamic>> _tickets = [];
  String? _ticketId;
  String _payment = 'cash';
  bool _loadingTickets = true;
  // Stable per sheet so a double-tapped Confirm is idempotent (RPC keys on it).
  late final String _clientUuid =
      'mwalkin-${DateTime.now().microsecondsSinceEpoch}';

  @override
  void initState() {
    super.initState();
    _loadTickets();
  }

  Future<void> _loadTickets() async {
    try {
      final rows = await supa
          .from('ticket_types')
          .select('id, name, price, currency')
          .eq('event_id', widget.eventId)
          .order('position');
      if (!mounted) return;
      setState(() {
        _tickets = asMapList(rows);
        _loadingTickets = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loadingTickets = false);
    }
  }

  String _ticketLabel(Map<String, dynamic> t) {
    final name = asString(t['name'], 'Ticket');
    final price = (t['price'] as num?)?.toDouble() ?? 0;
    if (price <= 0) return '$name · Free';
    final cur = asString(t['currency'], 'USD');
    final p = price == price.roundToDouble()
        ? price.toStringAsFixed(0)
        : price.toStringAsFixed(2);
    return '$name · $cur $p';
  }

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _phone.dispose();
    super.dispose();
  }

  bool get _validEmail {
    final e = _email.text.trim();
    return e.contains('@') && e.contains('.') && e.length >= 5;
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    if (_name.text.trim().isEmpty) {
      setState(() => _error = 'Enter the attendee\'s name.');
      return;
    }
    if (!_validEmail) {
      setState(() => _error = 'Enter a valid email address.');
      return;
    }
    HapticFeedback.lightImpact();
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final res = await widget.org.addWalkIn(
        widget.eventId,
        name: _name.text,
        email: _email.text,
        phone: _phone.text,
        ticketTypeId: _ticketId,
        paymentMethod: _payment,
        clientUuid: _clientUuid,
      );
      if (mounted) Navigator.of(context).pop(res);
    } on WalkInBlockedException catch (e) {
      if (mounted) {
        setState(() {
          _busy = false;
          _error = e.message;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _busy = false;
          _error = describeError(e, context: 'that walk-in');
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text('Add a walk-in', style: AppText.h3),
        const SizedBox(height: 6),
        Text(
          'Register someone at the door. They\'re added and checked in '
          'right away.',
          style: AppText.bodySm,
        ),
        const SizedBox(height: 16),
        MInput(
          label: 'Full name',
          hint: 'e.g. Amina Farah',
          controller: _name,
          action: TextInputAction.next,
        ),
        const SizedBox(height: 14),
        MInput(
          label: 'Email',
          hint: 'name@email.com',
          controller: _email,
          keyboardType: TextInputType.emailAddress,
          action: TextInputAction.next,
        ),
        const SizedBox(height: 14),
        MInput(
          label: 'Phone (optional)',
          hint: '+253 …',
          controller: _phone,
          keyboardType: TextInputType.phone,
          action: TextInputAction.done,
          onSubmitted: (_) => _submit(),
        ),
        // Ticket picker — a paid ticket records the real price + cash shift via
        // the server RPC; "Free entry" keeps the $0 general-admission path.
        if (!_loadingTickets && _tickets.isNotEmpty) ...[
          const SizedBox(height: 16),
          Text('Ticket', style: AppText.bodySm.copyWith(color: AppColors.inkMuted)),
          const SizedBox(height: 8),
          Wrap(spacing: 8, runSpacing: 8, children: [
            MChip('Free entry',
                selected: _ticketId == null,
                onTap: () => setState(() => _ticketId = null)),
            for (final t in _tickets)
              MChip(_ticketLabel(t),
                  selected: _ticketId == asString(t['id']),
                  onTap: () => setState(() => _ticketId = asString(t['id']))),
          ]),
          if (_ticketId != null) ...[
            const SizedBox(height: 12),
            Text('Payment',
                style: AppText.bodySm.copyWith(color: AppColors.inkMuted)),
            const SizedBox(height: 8),
            Wrap(spacing: 8, children: [
              MChip('Cash',
                  selected: _payment == 'cash',
                  onTap: () => setState(() => _payment = 'cash')),
              MChip('Card',
                  selected: _payment == 'card',
                  onTap: () => setState(() => _payment = 'card')),
            ]),
          ],
        ],
        if (_error != null) ...[
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.error_outline, color: AppColors.danger, size: 18),
              const SizedBox(width: 8),
              Expanded(
                child: Text(_error!,
                    style: AppText.bodySm.copyWith(color: AppColors.danger)),
              ),
            ],
          ),
        ],
        const SizedBox(height: 18),
        MButton('Add attendee',
            icon: Icons.person_add_alt_1, loading: _busy, onTap: _busy ? null : _submit),
        const SizedBox(height: 4),
        MButton('Cancel',
            kind: MBtnKind.text,
            onTap: _busy ? null : () => Navigator.of(context).pop()),
      ],
    );
  }
}

/// Group/bulk registration sheet — confirm a whole company/party at once.
/// Mirrors web's GroupRegistrationClient, simplified to one ticket type per
/// batch (run it again for a second ticket type) since this is an organizer
/// admin tool, not the full public checkout web offers.
class _GroupAddSheet extends StatefulWidget {
  final String eventId;
  final OrganizerApi org;
  const _GroupAddSheet({required this.eventId, required this.org});

  @override
  State<_GroupAddSheet> createState() => _GroupAddSheetState();
}

class _SeatFields {
  final name = TextEditingController();
  final email = TextEditingController();
  void dispose() {
    name.dispose();
    email.dispose();
  }
}

class _GroupAddSheetState extends State<_GroupAddSheet> {
  bool _loadingTypes = true;
  List<Map<String, dynamic>> _ticketTypes = [];
  String? _ticketTypeId;
  final List<_SeatFields> _seats = [];
  bool _busy = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadTicketTypes();
  }

  @override
  void dispose() {
    for (final s in _seats) {
      s.dispose();
    }
    super.dispose();
  }

  Future<void> _loadTicketTypes() async {
    try {
      final rows = await supa
          .from('ticket_types')
          .select('id, name, price, currency')
          .eq('event_id', widget.eventId)
          .order('position');
      final types = asMapList(rows);
      if (!mounted) return;
      setState(() {
        _ticketTypes = types;
        _ticketTypeId = types.isNotEmpty ? asString(types.first['id']) : null;
        _loadingTypes = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = describeError(e, context: 'ticket types');
        _loadingTypes = false;
      });
    }
  }

  void _setSeatCount(int next) {
    setState(() {
      while (_seats.length < next) {
        _seats.add(_SeatFields());
      }
      while (_seats.length > next) {
        _seats.removeLast().dispose();
      }
    });
  }

  bool _validEmail(String e) => e.contains('@') && e.contains('.') && e.length >= 5;

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    final ticketTypeId = _ticketTypeId;
    if (ticketTypeId == null) {
      setState(() => _error = 'This event has no ticket types to register against.');
      return;
    }
    if (_seats.isEmpty) {
      setState(() => _error = 'Add at least one seat.');
      return;
    }
    final seats = <GroupSeat>[];
    for (var i = 0; i < _seats.length; i++) {
      final name = _seats[i].name.text.trim();
      final email = _seats[i].email.text.trim();
      if (name.isEmpty || !_validEmail(email)) {
        setState(() => _error = 'Seat ${i + 1} needs a name and a valid email.');
        return;
      }
      seats.add(GroupSeat(ticketTypeId: ticketTypeId, name: name, email: email));
    }

    HapticFeedback.lightImpact();
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final count = await widget.org.addGroup(widget.eventId, seats: seats);
      if (mounted) Navigator.of(context).pop(count);
    } on GroupRegisterBlockedException catch (e) {
      if (mounted) setState(() { _busy = false; _error = e.message; });
    } catch (e) {
      if (mounted) {
        setState(() {
          _busy = false;
          _error = describeError(e, context: 'that group');
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text('Add a group', style: AppText.h3),
        const SizedBox(height: 6),
        Text(
          'Confirm a company or party at once — each seat gets its own QR '
          'ticket by email. Payment is assumed already collected.',
          style: AppText.bodySm,
        ),
        const SizedBox(height: 16),
        if (_loadingTypes)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 24),
            child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
          )
        else if (_ticketTypes.isEmpty)
          Text('This event has no ticket types yet.',
              style: AppText.bodySm.copyWith(color: AppColors.danger))
        else ...[
          Text('Ticket type', style: AppText.bodyStrong.copyWith(fontSize: 13)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _ticketTypes.map((t) {
              final id = asString(t['id']);
              return MChip(asString(t['name'], 'Ticket'),
                  selected: _ticketTypeId == id,
                  onTap: () => setState(() => _ticketTypeId = id));
            }).toList(),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Text('Seats', style: AppText.bodyStrong.copyWith(fontSize: 13)),
              const Spacer(),
              _StepperButton(
                icon: Icons.remove,
                onTap: _seats.isEmpty ? null : () => _setSeatCount(_seats.length - 1),
              ),
              SizedBox(
                width: 32,
                child: Text('${_seats.length}',
                    textAlign: TextAlign.center, style: AppText.h3.copyWith(fontSize: 16)),
              ),
              _StepperButton(
                icon: Icons.add,
                onTap: _seats.length >= 50 ? null : () => _setSeatCount(_seats.length + 1),
              ),
            ],
          ),
          if (_seats.isNotEmpty) ...[
            const SizedBox(height: 12),
            ConstrainedBox(
              constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.35),
              child: SingleChildScrollView(
                child: Column(
                  children: [
                    for (var i = 0; i < _seats.length; i++) ...[
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          SizedBox(
                            width: 20,
                            child: Padding(
                              padding: const EdgeInsets.only(top: 14),
                              child: Text('${i + 1}',
                                  style: AppText.caption.copyWith(color: AppColors.inkMuted)),
                            ),
                          ),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Column(
                              children: [
                                MInput(hint: 'Full name', controller: _seats[i].name),
                                const SizedBox(height: 8),
                                MInput(
                                  hint: 'Email address',
                                  controller: _seats[i].email,
                                  keyboardType: TextInputType.emailAddress,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      if (i != _seats.length - 1) const SizedBox(height: 12),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ],
        if (_error != null) ...[
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.error_outline, color: AppColors.danger, size: 18),
              const SizedBox(width: 8),
              Expanded(
                child: Text(_error!, style: AppText.bodySm.copyWith(color: AppColors.danger)),
              ),
            ],
          ),
        ],
        const SizedBox(height: 18),
        MButton('Register ${_seats.length} seat${_seats.length == 1 ? '' : 's'}',
            icon: Icons.groups_outlined,
            loading: _busy,
            onTap: (_busy || _seats.isEmpty) ? null : _submit),
        const SizedBox(height: 4),
        MButton('Cancel',
            kind: MBtnKind.text, onTap: _busy ? null : () => Navigator.of(context).pop()),
      ],
    );
  }
}

class _StepperButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onTap;
  const _StepperButton({required this.icon, this.onTap});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 32,
        height: 32,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: onTap == null ? AppColors.creamSoft : AppColors.forestSoft,
          shape: BoxShape.circle,
        ),
        child: Icon(icon, size: 16, color: onTap == null ? AppColors.inkMuted : AppColors.forest),
      ),
    );
  }
}

extension<T> on Iterable<T> {
  T? get firstOrNull => isEmpty ? null : first;
}
