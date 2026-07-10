// C02 · End-of-shift cash reconciliation — the staff member's open cash shift.
//
// Shows what was collected (cash transactions on the shift), lets the operator
// count the drawer, states the variance plainly (over and under both neutral),
// and hands the cash over: close_cash_shift stamps counted_total, computes
// expected_total server-side, and marks the shift reconciled + read-only.
//
// Expected cash = the shift's registrations only (cash sales carry cash_shift_id;
// mobile-money/card door sales do not, so they never inflate the drawer total).
// See MOBILE_DESIGN_LAW §1, §4, §7, §11.

import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../net.dart';
import '../../offline/scan_queue.dart' show isNetworkError;
import '../../ui/components.dart';
import '../../ui/tokens.dart';
import 'cash_shift_widgets.dart';

class CashShiftScreen extends StatefulWidget {
  final String eventId;
  final String eventName;
  const CashShiftScreen(
      {super.key, required this.eventId, required this.eventName});

  @override
  State<CashShiftScreen> createState() => _CashShiftScreenState();
}

class _Txn {
  final String name, ticket, currency;
  final double amount;
  final DateTime? at;
  _Txn(this.name, this.ticket, this.amount, this.currency, this.at);
}

class _CashShiftScreenState extends State<CashShiftScreen> {
  bool _loading = true;
  String? _error;
  String? _shiftId;
  List<_Txn> _txns = [];
  String _currency = 'USD';

  final _countCtrl = TextEditingController();
  bool _handing = false;

  // Reconciled result (set after close_cash_shift succeeds).
  bool _reconciled = false;
  double _expected = 0;
  double _counted = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _countCtrl.dispose();
    super.dispose();
  }

  double get _collected => _txns.fold(0.0, (s, t) => s + t.amount);
  double? get _countInput => double.tryParse(_countCtrl.text.trim());

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    final uid = currentUserId;
    if (uid == null) {
      setState(() {
        _loading = false;
        _error = 'Please sign in first.';
      });
      return;
    }
    try {
      final shiftRows = await supa
          .from('cash_shifts')
          .select('id')
          .eq('event_id', widget.eventId)
          .eq('staff_user_id', uid)
          .eq('status', 'open')
          .order('started_at', ascending: false)
          .limit(1);
      final shifts = asMapList(shiftRows);
      if (shifts.isEmpty) {
        if (!mounted) return;
        setState(() {
          _shiftId = null;
          _txns = [];
          _loading = false;
        });
        return;
      }
      final shiftId = asString(shifts.first['id']);
      // Read the shift's transactions via the SECURITY DEFINER RPC (077).
      // A direct `registrations` read would return zero rows for a non-owner
      // staff member — there is no staff SELECT policy on registrations.
      final txnRows = await supa.rpc(
        'cash_shift_transactions',
        params: {'p_shift_id': shiftId},
      );
      final txns = asMapList(txnRows).map((m) {
        return _Txn(
          asString(m['attendee_name'], 'Guest'),
          asString(m['ticket_name'], 'Ticket'),
          asDouble(m['amount_paid']),
          asString(m['currency'], 'USD'),
          asDate(m['created_at']),
        );
      }).toList();
      if (!mounted) return;
      setState(() {
        _shiftId = shiftId;
        _txns = txns;
        _currency = txns.isNotEmpty ? txns.first.currency : 'USD';
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = isNetworkError(e)
            ? 'Could not reach the server. Check your connection.'
            : "Couldn't load your cash shift.";
      });
    }
  }

  bool _isNotAuthorised(Object e) =>
      e is PostgrestException && e.message.contains('NOT_AUTHORISED');

  Future<void> _handOver() async {
    final counted = _countInput;
    if (_shiftId == null || counted == null || _handing) return;
    final ok = await _confirmHandOver(counted);
    if (ok != true || !mounted) return;
    setState(() => _handing = true);
    try {
      final res = await supa.rpc('close_cash_shift', params: {
        'p_shift_id': _shiftId,
        'p_counted_total': counted,
      });
      final m = (res is Map) ? Map<String, dynamic>.from(res) : const {};
      if (!mounted) return;
      setState(() {
        _handing = false;
        _reconciled = true;
        _expected = asDouble(m['expected_total']);
        _counted = asDouble(m['counted_total']);
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _handing = false);
      showToast(
          context,
          _isNotAuthorised(e)
              ? "You're not authorised to reconcile this event."
              : isNetworkError(e)
                  ? 'Could not reach the server. Try again.'
                  : 'Could not hand over. Try again.');
    }
  }

  Future<bool?> _confirmHandOver(double counted) {
    return showMSheet<bool>(
      context,
      Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text('Hand over cash', style: AppText.h3),
          const SizedBox(height: 8),
          Text(
              'You counted ${shiftMoney(counted, _currency)}. This closes your '
              'shift and can’t be undone.',
              style: AppText.bodySm),
          const SizedBox(height: 18),
          MButton('Hand over',
              icon: Icons.check_rounded,
              onTap: () => Navigator.pop(context, true)),
          const SizedBox(height: 8),
          MButton('Cancel',
              kind: MBtnKind.sec, onTap: () => Navigator.pop(context, false)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: const MAppBar(title: 'Cash drawer', hairline: true),
      body: _body(),
    );
  }

  Widget _body() {
    if (_loading) return const LoadingState();
    if (_error != null) {
      return ErrorStateView(message: _error!, onRetry: _load);
    }
    if (_reconciled) return _reconciledView();
    if (_shiftId == null) {
      return const EmptyState(
        icon: Icons.payments_outlined,
        title: 'No cash taken yet',
        message: 'Your open shift appears here after your first cash sale.',
      );
    }
    return RefreshIndicator(
      color: AppColors.forest,
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(
            AppSpace.lg, AppSpace.base, AppSpace.lg, AppSpace.xxl),
        children: [
          ShiftTotalCard(
              collected: _collected, count: _txns.length, currency: _currency),
          const SizedBox(height: 20),
          const SectionLabel('Count your cash'),
          const SizedBox(height: 12),
          MInput(
            label: 'Counted total',
            hint: _currency,
            controller: _countCtrl,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            onChanged: (_) => setState(() {}),
          ),
          if (_countInput != null) ...[
            const SizedBox(height: 12),
            VarianceCard(
                expected: _collected,
                counted: _countInput!,
                currency: _currency),
          ],
          const SizedBox(height: 20),
          MButton(
            _handing ? 'Handing over…' : 'Hand over cash',
            kind: MBtnKind.forest,
            loading: _handing,
            onTap: (_handing || _countInput == null) ? null : _handOver,
          ),
          const SizedBox(height: 24),
          const SectionLabel('Transactions'),
          const SizedBox(height: 12),
          if (_txns.isEmpty)
            Text('No cash transactions on this shift yet.',
                style: AppText.bodySm)
          else
            for (final t in _txns)
              ShiftTxnRow(
                name: t.name,
                ticket: t.ticket,
                timeLabel: _time(t.at),
                amount: t.amount,
                currency: t.currency,
              ),
        ],
      ),
    );
  }

  String _time(DateTime? d) {
    if (d == null) return '';
    final l = d.toLocal();
    final h = l.hour % 12 == 0 ? 12 : l.hour % 12;
    final m = l.minute.toString().padLeft(2, '0');
    return '$h:$m ${l.hour < 12 ? "AM" : "PM"}';
  }

  Widget _reconciledView() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(
          AppSpace.lg, AppSpace.xl, AppSpace.lg, AppSpace.xxl),
      children: [
        Center(
          child: Container(
            width: 60,
            height: 60,
            alignment: Alignment.center,
            decoration: const BoxDecoration(
                color: AppColors.forestSoft, shape: BoxShape.circle),
            child: const Icon(Icons.check_rounded,
                color: AppColors.forest, size: 30),
          ),
        ),
        const SizedBox(height: 16),
        Text('Shift handed over',
            textAlign: TextAlign.center, style: AppText.h2),
        const SizedBox(height: 6),
        Text('This shift is reconciled and closed.',
            textAlign: TextAlign.center, style: AppText.bodySm),
        const SizedBox(height: 24),
        VarianceCard(
            expected: _expected, counted: _counted, currency: _currency),
        const SizedBox(height: 20),
        MButton('Done',
            kind: MBtnKind.forest,
            onTap: () => Navigator.of(context).maybePop()),
      ],
    );
  }
}
