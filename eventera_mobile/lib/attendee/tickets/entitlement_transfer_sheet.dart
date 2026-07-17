import 'dart:async';

import 'package:flutter/material.dart';

import '../../net.dart';
import '../../ui/components.dart';
import '../../ui/tokens.dart';
import 'entitlement_card.dart';
import 'entitlement_state.dart';

/// G04 (mobile) — transfer one HELD, not-yet-redeemed entitlement from this
/// registration to another attendee of the same event.
///
/// Calls the `transfer_entitlement` RPC (065_entitlements.sql). That RPC is
/// owner/staff-only (`can_manage_event`) and REFUSES a transfer whose source has
/// already been redeemed, returning `{status:'already_redeemed'}` — surfaced here
/// as a clear refusal, not a generic error. This sheet is only reachable from a
/// manager-gated entry, so a plain attendee never sees organizer tooling.
class EntitlementTransferSheet extends StatefulWidget {
  final String registrationId;
  final String fromName;

  const EntitlementTransferSheet({
    super.key,
    required this.registrationId,
    required this.fromName,
  });

  @override
  State<EntitlementTransferSheet> createState() =>
      _EntitlementTransferSheetState();
}

class _Attendee {
  final String id;
  final String name;
  final String? email;
  final String? ticket;
  const _Attendee(this.id, this.name, this.email, this.ticket);
}

class _EntitlementTransferSheetState extends State<EntitlementTransferSheet> {
  bool _loading = true;
  String? _loadError;
  StatusReason _loadErrorReason = StatusReason.generic;
  String _eventId = '';
  List<EntComputed> _candidates = [];

  Entitlement? _selectedEnt;

  final _searchCtrl = TextEditingController();
  Timer? _debounce;
  bool _searching = false;
  List<_Attendee> _results = [];
  _Attendee? _target;

  bool _busy = false;
  bool _blocked = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _loadError = null;
    });
    try {
      final reg = await supa
          .from('registrations')
          .select('event_id, ticket_type_id')
          .eq('id', widget.registrationId)
          .maybeSingle();
      if (reg == null) throw Exception('registration not found');
      final eventId = asString(reg['event_id']);
      final ticketTypeId = reg['ticket_type_id'] == null
          ? null
          : asString(reg['ticket_type_id']);

      final results = await Future.wait([
        supa
            .from('entitlements')
            .select('id, name, type, redemption_limit, valid_from, valid_until')
            .eq('event_id', eventId),
        supa
            .from('entitlement_redemptions')
            .select('entitlement_id, action, status, redeemed_at, day_index')
            .eq('registration_id', widget.registrationId),
        if (ticketTypeId != null)
          supa
              .from('ticket_type_entitlements')
              .select('entitlement_id')
              .eq('ticket_type_id', ticketTypeId),
      ]);

      final all = asMapList(results[0]).map(Entitlement.fromMap).toList();
      final ledger = asMapList(results[1]).map(LedgerRow.fromMap).toList();
      final included = ticketTypeId == null
          ? <String>{}
          : asMapList(results[2])
              .map((r) => asString(r['entitlement_id']))
              .toSet();

      final held = computeHeldEntitlements(
        all: all,
        includedEntitlementIds: included,
        ledger: ledger,
        now: DateTime.now(),
      );
      // Only entitlements that are NOT already redeemed can be transferred.
      final candidates =
          held.where((c) => c.status != EntStatus.redeemed).toList();

      if (!mounted) return;
      setState(() {
        _eventId = eventId;
        _candidates = candidates;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      final msg = describeError(e, context: 'these passes');
      setState(() {
        _loadError = msg;
        _loadErrorReason = msg.toLowerCase().contains("couldn't reach the server")
            ? StatusReason.network
            : StatusReason.generic;
        _loading = false;
      });
    }
  }

  void _onQueryChanged(String v) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 280), _search);
  }

  Future<void> _search() async {
    final q = _searchCtrl.text.trim();
    setState(() => _searching = true);
    try {
      var query = supa
          .from('registrations')
          .select('id, attendee_name, attendee_email, ticket_types(name)')
          .eq('event_id', _eventId)
          .neq('id', widget.registrationId)
          .inFilter('status', ['confirmed', 'checked_in', 'pending']);
      if (q.isNotEmpty) {
        query = query.or('attendee_name.ilike.%$q%,attendee_email.ilike.%$q%');
      }
      final rows = await query.limit(8);
      final list = asMapList(rows).map((r) {
        final tt = r['ticket_types'];
        final ticket = tt is Map ? asString(tt['name']) : null;
        return _Attendee(
          asString(r['id']),
          asString(r['attendee_name'], 'Attendee'),
          r['attendee_email'] == null ? null : asString(r['attendee_email']),
          ticket,
        );
      }).toList();
      if (!mounted) return;
      setState(() {
        _results = list;
        _searching = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _searching = false);
      showToast(context, describeError(e, context: 'attendees'),
          type: ToastType.error);
    }
  }

  Future<void> _transfer() async {
    final ent = _selectedEnt;
    final target = _target;
    if (ent == null || target == null) return;
    setState(() {
      _busy = true;
      _blocked = false;
      _error = null;
    });
    try {
      final res = await supa.rpc('transfer_entitlement', params: {
        'p_entitlement_id': ent.id,
        'p_from_registration': widget.registrationId,
        'p_to_registration': target.id,
      });
      final map = res is Map ? res : <String, dynamic>{};
      final status = asString(map['status']);
      if (status == 'already_redeemed') {
        setState(() {
          _blocked = true;
          _busy = false;
        });
        return;
      }
      if (status == 'error') {
        setState(() {
          _error = asString(map['message'], 'Transfer failed.');
          _busy = false;
        });
        return;
      }
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = describeError(e, context: 'this transfer');
        _busy = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(_selectedEnt == null ? 'Transfer a pass' : 'Transfer to',
            style: AppText.h3),
        const SizedBox(height: 6),
        Text(
          _selectedEnt == null
              ? 'Move one pass from ${widget.fromName} to another attendee.'
              : _selectedEnt!.name,
          style: AppText.bodySm,
        ),
        const SizedBox(height: 16),
        _content(),
      ],
    );
  }

  Widget _content() {
    if (_loading) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 8),
        child: Column(children: [
          Skeleton(height: 56, radius: 12),
          SizedBox(height: 10),
          Skeleton(height: 56, radius: 12),
        ]),
      );
    }
    if (_loadError != null) {
      return ErrorStateView(
          message: _loadError!, onRetry: _load, reason: _loadErrorReason);
    }
    if (_candidates.isEmpty) {
      return const EmptyState(
        icon: Icons.swap_horiz,
        title: 'Nothing to transfer',
        message: 'Every pass here is either already redeemed or not held.',
      );
    }
    return _selectedEnt == null ? _entPicker() : _attendeeStep();
  }

  Widget _entPicker() {
    return ConstrainedBox(
      constraints: const BoxConstraints(maxHeight: 320),
      child: ListView.separated(
        shrinkWrap: true,
        itemCount: _candidates.length,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (_, i) {
          final e = _candidates[i].entitlement;
          return _rowCard(
            icon: iconForType(e.type),
            title: e.name,
            subtitle: e.type,
            onTap: () => setState(() => _selectedEnt = e),
          );
        },
      ),
    );
  }

  Widget _attendeeStep() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (_blocked)
          _notice(
            AppColors.warning,
            Icons.block,
            'This pass was already redeemed, so it can\'t be transferred. Un-redeem it first if this was a mistake.',
          ),
        if (_target == null) ...[
          MInput(
            hint: 'Search attendees by name or email',
            controller: _searchCtrl,
            icon: Icons.search,
            onChanged: _onQueryChanged,
          ),
          const SizedBox(height: 12),
          ConstrainedBox(
            constraints: const BoxConstraints(maxHeight: 260),
            child: _searching
                ? const Padding(
                    padding: EdgeInsets.symmetric(vertical: 16),
                    child: Center(
                        child: SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: AppColors.forest))))
                : _results.isEmpty
                    ? Padding(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        child: Text('No matching attendees.',
                            style: AppText.bodySm,
                            textAlign: TextAlign.center))
                    : ListView.separated(
                        shrinkWrap: true,
                        itemCount: _results.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (_, i) {
                          final a = _results[i];
                          return _rowCard(
                            icon: Icons.person_outline,
                            title: a.name,
                            subtitle: a.email ?? a.ticket ?? '—',
                            onTap: () => setState(() => _target = a),
                          );
                        },
                      ),
          ),
        ] else ...[
          _rowCard(
            icon: Icons.person,
            title: _target!.name,
            subtitle: _target!.email ?? _target!.ticket ?? '—',
            onTap: () => setState(() => _target = null),
            trailing: Text('Change',
                style: AppText.label.copyWith(color: AppColors.forest)),
          ),
        ],
        if (_error != null) ...[
          const SizedBox(height: 12),
          Text(_error!,
              style: AppText.bodySm.copyWith(color: AppColors.danger)),
        ],
        const SizedBox(height: 16),
        MButton(
          'Transfer',
          kind: MBtnKind.forest,
          icon: Icons.swap_horiz,
          loading: _busy,
          onTap: (_target == null || _busy) ? null : _transfer,
        ),
      ],
    );
  }

  Widget _rowCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    Widget? trailing,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppRadius.card),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.card),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            Container(
              width: 38,
              height: 38,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: AppColors.forestSoft,
                borderRadius: BorderRadius.circular(11),
              ),
              child: Icon(icon, size: 19, color: AppColors.forest),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: AppText.bodyStrong,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 2),
                  Text(subtitle,
                      style: AppText.caption,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis),
                ],
              ),
            ),
            if (trailing != null) trailing,
          ],
        ),
      ),
    );
  }

  Widget _notice(Color color, IconData icon, String text) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(AppRadius.input),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Icon(icon, size: 18, color: color),
          const SizedBox(width: 9),
          Expanded(
            child: Text(text, style: AppText.bodySm.copyWith(color: color)),
          ),
        ],
      ),
    );
  }
}
