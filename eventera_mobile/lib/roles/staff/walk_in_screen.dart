// C01 · Walk-in cash registration — the door "take money" flow for staff.
//
// One Confirm does the whole thing through a SINGLE server-authoritative RPC,
// create_walkin_registration (migration 075): it opens/reuses the staff cash
// shift (cash only), creates a PAID registration priced from the SERVER's
// ticket_types row, links it to the shift, checks the attendee in, and returns
// the receipt. The RPC lives in [WalkInSale]; this file is form + state only.
//
// Money is never a UI concern: amount_paid comes back FROM THE SERVER and is
// displayed as-is. The "Amount received" field only computes change for the
// human — it is never persisted. See MOBILE_DESIGN_LAW §1, §4, §7, §11.
//
// Write path: the create_walkin_registration RPC (NOT a direct insert, NOT the
// web /register route). A direct client insert would be unsafe — the
// registrations insert policy is `with check (true)` so the public can
// register, which means the client could forge amount_paid/payment_status. The
// RPC authorises with can_manage_event() and reads the price server-side, so
// the client never supplies money.

import 'package:flutter/material.dart';

import '../../app_config.dart';
import '../../net.dart';
import '../../ui/components.dart';
import '../../ui/tokens.dart';
import 'walk_in_sale.dart';
import 'walk_in_widgets.dart';

class WalkInScreen extends StatefulWidget {
  final String eventId;
  final String eventName;
  const WalkInScreen({super.key, required this.eventId, required this.eventName});

  @override
  State<WalkInScreen> createState() => _WalkInScreenState();
}

class _Ticket {
  final String id, name, currency;
  final double price;
  _Ticket(this.id, this.name, this.price, this.currency);
}

const _methods = ['Cash', 'Mobile money', 'Card'];
const _methodKeys = ['cash', 'mobile_money', 'card'];

class _WalkInScreenState extends State<WalkInScreen> {
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _receivedCtrl = TextEditingController();

  bool _loading = true;
  String? _loadError;
  List<_Ticket> _tickets = [];
  String? _slug; // for the issued card QR
  String? _selectedId;
  int _method = 0; // index into _methods

  // In-flight guard + the resumable transaction (idempotency — a double tap
  // must not double-charge).
  bool _submitting = false;
  WalkInSale? _sale;

  bool _done = false; // registration + payment committed
  bool _checkinFailed = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _emailCtrl.dispose();
    _receivedCtrl.dispose();
    super.dispose();
  }

  _Ticket? get _ticket {
    for (final t in _tickets) {
      if (t.id == _selectedId) return t;
    }
    return null;
  }

  String get _methodKey => _methodKeys[_method];
  bool get _isCash => _methodKey == 'cash';

  double? get _received => double.tryParse(_receivedCtrl.text.trim());
  double get _change {
    final t = _ticket, r = _received;
    if (t == null || r == null) return 0;
    return (r - t.price).clamp(0, double.infinity);
  }

  bool get _canConfirm {
    final t = _ticket;
    if (t == null || _nameCtrl.text.trim().isEmpty) return false;
    if (_isCash) {
      final r = _received;
      if (r == null || r < t.price) return false;
    }
    return true;
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _loadError = null;
    });
    try {
      final rows = await supa
          .from('ticket_types')
          .select('id, name, price, currency, is_visible')
          .eq('event_id', widget.eventId)
          .not('is_visible', 'is', false)
          .order('price', ascending: true);
      final tickets = asMapList(rows)
          .map((m) => _Ticket(asString(m['id']), asString(m['name'], 'Ticket'),
              asDouble(m['price']), asString(m['currency'], 'USD')))
          .toList();
      String? slug;
      try {
        final ev = await supa
            .from('events')
            .select('slug')
            .eq('id', widget.eventId)
            .maybeSingle();
        slug = ev == null ? null : asString(ev['slug']);
      } catch (_) {/* slug is optional — the QR falls back to the bare token */}
      if (!mounted) return;
      setState(() {
        _tickets = tickets;
        _slug = slug;
        _selectedId = tickets.isNotEmpty ? tickets.first.id : null;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loadError = 'Could not load tickets. Try again.';
        _loading = false;
      });
    }
  }

  Future<void> _confirm() async {
    // Idempotency guard: never run two sales at once. Combined with the disabled
    // button and WalkInSale's resume state, a double tap cannot double-charge.
    if (_submitting) return;
    final t = _ticket;
    if (t == null) {
      setState(() => _error = 'Choose a ticket.');
      return;
    }
    final name = _nameCtrl.text.trim();
    if (name.isEmpty) {
      setState(() => _error = 'Enter the attendee name.');
      return;
    }
    if (_isCash) {
      final r = _received;
      if (r == null || r < t.price) {
        setState(() => _error =
            'Amount received must cover the ${money(t.price, t.currency)} price.');
        return;
      }
    }

    setState(() {
      _submitting = true;
      _error = null;
    });

    // One WalkInSale per attempt: created once, reused on retry so its
    // client_uuid stays the same and a replay returns the original receipt.
    final sale = _sale ??= WalkInSale(widget.eventId);
    try {
      await sale.run(
        ticketId: t.id,
        name: name,
        phone: _phoneCtrl.text.trim().isEmpty ? null : _phoneCtrl.text.trim(),
        email: _emailCtrl.text.trim().toLowerCase(),
        methodKey: _methodKey,
      );
      // status 'ok' or 'already' both land here — a replay shows the SAME
      // receipt, never a second charge.
      if (!mounted) return;
      setState(() {
        _submitting = false;
        _done = true;
        _checkinFailed = false;
      });
    } on WalkInSaleException catch (e) {
      if (!mounted) return;
      if (sale.committed) {
        // The RPC is atomic, so this is defensive: if a receipt exists the sale
        // succeeded (and check-in with it). Show the card, never re-charge.
        setState(() {
          _submitting = false;
          _done = true;
          _checkinFailed = !sale.checkedIn;
        });
      } else {
        setState(() {
          _submitting = false;
          _error = _messageFor(e);
        });
      }
    }
  }

  String _messageFor(WalkInSaleException e) {
    switch (e.kind) {
      case WalkInFailure.notAuthorised:
        return "You're not authorised to take payments for this event.";
      case WalkInFailure.network:
        return 'Cash sales need a connection. Reconnect and try again.';
      case WalkInFailure.generic:
        // Show the server's own message when it sent one (e.g. duplicate email).
        return e.message ?? 'Could not complete the sale. Try again.';
    }
  }

  void _newSale() {
    setState(() {
      _nameCtrl.clear();
      _phoneCtrl.clear();
      _emailCtrl.clear();
      _receivedCtrl.clear();
      _sale = null;
      _done = false;
      _checkinFailed = false;
      _error = null;
      _selectedId = _tickets.isNotEmpty ? _tickets.first.id : null;
      _method = 0;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_done) return _success();
    final showBar = !_loading && _loadError == null && _tickets.isNotEmpty;
    return MScaffold(
      appBar: const MAppBar(title: 'Cash walk-in', hairline: true),
      bottomBar: showBar
          ? StickyCta(children: [
              Expanded(
                child: MButton(
                  _submitting ? 'Taking payment…' : 'Confirm sale',
                  kind: MBtnKind.forest,
                  loading: _submitting,
                  onTap: (_submitting || !_canConfirm) ? null : _confirm,
                ),
              ),
            ])
          : null,
      body: _body(),
    );
  }

  Widget _body() {
    if (_loading) return const LoadingState();
    if (_loadError != null) {
      return ErrorStateView(message: _loadError!, onRetry: _load);
    }
    if (_tickets.isEmpty) {
      return const EmptyState(
        icon: Icons.confirmation_number_outlined,
        title: 'No tickets',
        message: 'This event has no tickets to sell at the door.',
      );
    }
    final t = _ticket;
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(
          AppSpace.lg, AppSpace.base, AppSpace.lg, AppSpace.base),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SectionLabel('Attendee'),
          const SizedBox(height: 12),
          MInput(
              label: 'Full name',
              controller: _nameCtrl,
              onChanged: (_) => setState(() {})),
          const SizedBox(height: 14),
          MInput(
              label: 'Phone (optional)',
              controller: _phoneCtrl,
              keyboardType: TextInputType.phone),
          const SizedBox(height: 14),
          MInput(
              label: 'Email (optional)',
              controller: _emailCtrl,
              keyboardType: TextInputType.emailAddress,
              onChanged: (_) => setState(() {})),
          if (_emailCtrl.text.trim().isEmpty) ...[
            const SizedBox(height: 6),
            Text('No email — the attendee won’t get the ticket by email.',
                style: AppText.caption.copyWith(color: AppColors.warning)),
          ],
          const SizedBox(height: 24),
          const SectionLabel('Ticket'),
          const SizedBox(height: 12),
          for (final tk in _tickets)
            WalkInTicketTile(
              name: tk.name,
              price: tk.price,
              currency: tk.currency,
              selected: tk.id == _selectedId,
              onTap: () => setState(() => _selectedId = tk.id),
            ),
          const SizedBox(height: 14),
          const SectionLabel('Payment'),
          const SizedBox(height: 12),
          SegControl(
              segments: _methods,
              index: _method,
              onChanged: (i) => setState(() => _method = i)),
          if (_isCash && t != null) ...[
            const SizedBox(height: 16),
            MInput(
              label: 'Amount received',
              hint: t.currency,
              controller: _receivedCtrl,
              keyboardType:
                  const TextInputType.numberWithOptions(decimal: true),
              onChanged: (_) => setState(() {}),
            ),
            const SizedBox(height: 16),
            ChangeDueCard(
                currency: t.currency,
                change: _received == null ? null : _change),
          ],
          if (_error != null) ...[
            const SizedBox(height: 16),
            SaleErrorBox(_error!),
          ],
        ],
      ),
    );
  }

  Widget _success() {
    final t = _ticket;
    final r = _sale?.receipt;
    final qr = r?.qrToken ?? '';
    // amount_paid is the SERVER's — display it, not the locally fetched price.
    final paid = r?.amountPaid ?? t?.price ?? 0;
    final currency = t?.currency ?? 'USD';
    // Change is a purely local aid: received − the server-displayed price.
    final received = _received;
    final change = received == null
        ? 0.0
        : (received - paid).clamp(0, double.infinity).toDouble();
    final qrData = (_slug != null && _slug!.isNotEmpty && qr.isNotEmpty)
        ? '${AppConfig.renderBaseUrl}/e/${_slug!}/check-in?token=$qr'
        : qr;
    return WalkInSuccessView(
      attendeeName: r?.attendeeName ?? _nameCtrl.text.trim(),
      ticketName: r?.ticketName ?? t?.name,
      currency: currency,
      price: paid, // SERVER amount_paid
      methodLabel: _methods[_method],
      isCash: _isCash,
      received: received,
      change: change,
      checkedIn: r?.checkedIn ?? false,
      checkinFailed: _checkinFailed,
      retrying: _submitting,
      qrToken: qr,
      qrData: qrData,
      onNewSale: _newSale,
      onRetryCheckin: _confirm,
    );
  }
}
