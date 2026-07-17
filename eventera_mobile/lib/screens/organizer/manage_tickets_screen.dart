import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../net.dart';
import '../../ui/components.dart';
import '../../ui/tokens.dart';

/// Organizer ticket management (web parity: /events/[id]/tickets).
/// Lists the event's ticket types with sold counts, lets the organizer add,
/// edit, hide/show and delete them. Writes go straight to `ticket_types`
/// under the `owner_all` RLS policy — the same direct-Supabase pattern the
/// rest of the organizer app uses (API routes are cookie-auth, web-only).
class ManageTicketsScreen extends StatefulWidget {
  final String eventId;
  final String eventName;

  const ManageTicketsScreen({
    super.key,
    required this.eventId,
    required this.eventName,
  });

  @override
  State<ManageTicketsScreen> createState() => _ManageTicketsScreenState();
}

class _TicketRow {
  final String id;
  String name;
  String? description;
  double price;
  String currency;
  int? quantity; // null = unlimited
  int quantitySold;
  bool isVisible;
  final int position;

  _TicketRow({
    required this.id,
    required this.name,
    this.description,
    required this.price,
    required this.currency,
    this.quantity,
    required this.quantitySold,
    required this.isVisible,
    required this.position,
  });

  factory _TicketRow.fromMap(Map<String, dynamic> m) => _TicketRow(
        id: asString(m['id']),
        name: asString(m['name']),
        description:
            m['description'] == null ? null : asString(m['description']),
        price: asDouble(m['price']),
        currency: asString(m['currency'], 'USD'),
        quantity: m['quantity'] == null
            ? null
            : int.tryParse('${m['quantity']}'),
        quantitySold: int.tryParse('${m['quantity_sold'] ?? 0}') ?? 0,
        isVisible: asBool(m['is_visible']),
        position: int.tryParse('${m['position'] ?? 0}') ?? 0,
      );
}

class _ManageTicketsScreenState extends State<ManageTicketsScreen> {
  final _db = Supabase.instance.client;
  List<_TicketRow>? _tickets;
  bool _loading = true;
  String? _error;
  StatusReason _errorReason = StatusReason.generic;
  bool _changed = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final rows = await _db
          .from('ticket_types')
          .select(
              'id, name, description, price, currency, quantity, quantity_sold, is_visible, position')
          .eq('event_id', widget.eventId)
          .order('position', ascending: true)
          .order('created_at', ascending: true);
      if (!mounted) return;
      setState(() {
        _tickets = [
          for (final r in rows) _TicketRow.fromMap(Map<String, dynamic>.from(r))
        ];
        _loading = false;
        _error = null;
      });
    } catch (e) {
      if (!mounted) return;
      final msg = describeError(e, context: 'the tickets');
      setState(() {
        _loading = false;
        _error = msg;
        _errorReason = msg.toLowerCase().contains("couldn't reach the server")
            ? StatusReason.network
            : StatusReason.generic;
      });
    }
  }

  Future<void> _openEditor([_TicketRow? existing]) async {
    final saved = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => _TicketEditorScreen(
          eventId: widget.eventId,
          existing: existing,
          defaultCurrency: (_tickets?.isNotEmpty ?? false)
              ? _tickets!.first.currency
              : 'USD',
          nextPosition: _tickets?.length ?? 0,
        ),
      ),
    );
    if (saved == true) {
      _changed = true;
      _load();
    }
  }

  Future<void> _toggleVisible(_TicketRow t) async {
    final next = !t.isVisible;
    setState(() => t.isVisible = next); // optimistic
    try {
      await _db
          .from('ticket_types')
          .update({'is_visible': next}).eq('id', t.id);
      _changed = true;
    } catch (e) {
      if (!mounted) return;
      setState(() => t.isVisible = !next);
      showToast(context, describeError(e, context: 'that change'),
          type: ToastType.error);
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) Navigator.of(context).pop(_changed);
      },
      child: MScaffold(
        appBar: const MAppBar(title: 'Tickets', hairline: true),
        bottomBar: StickyCta(children: [
          Expanded(
            child: MButton('Add ticket type',
                kind: MBtnKind.forest, onTap: () => _openEditor()),
          ),
        ]),
        body: _body(),
      ),
    );
  }

  Widget _body() {
    if (_loading) return const LoadingState();
    if (_error != null) {
      return ErrorStateView(
        message: _error!,
        reason: _errorReason,
        onRetry: () {
          setState(() => _loading = true);
          _load();
        },
      );
    }
    final tickets = _tickets ?? const [];
    if (tickets.isEmpty) {
      return EmptyState(
        icon: Icons.confirmation_number_outlined,
        title: 'No ticket types yet',
        message:
            'Add your first ticket type — free or paid — so people can register.',
        ctaLabel: 'Add ticket type',
        onCta: () => _openEditor(),
      );
    }

    return RefreshIndicator(
      color: AppColors.forest,
      onRefresh: _load,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(
            AppSpace.lg, AppSpace.sm, AppSpace.lg, AppSpace.base),
        children: [
          for (final t in tickets) ...[
            _ticketCard(t),
            const SizedBox(height: 12),
          ],
        ],
      ),
    );
  }

  Widget _ticketCard(_TicketRow t) {
    final priceLabel = t.price <= 0
        ? 'Free'
        : '${t.currency} ${t.price == t.price.roundToDouble() ? t.price.toStringAsFixed(0) : t.price.toStringAsFixed(2)}';
    final soldLabel = t.quantity == null
        ? '${t.quantitySold} sold · unlimited'
        : '${t.quantitySold} / ${t.quantity} sold';
    final soldOut = t.quantity != null && t.quantitySold >= t.quantity!;

    return InkWell(
      borderRadius: BorderRadius.circular(AppRadius.card),
      onTap: () => _openEditor(t),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.card),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(t.name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppText.bodyStrong),
                      const SizedBox(height: 3),
                      Text(priceLabel,
                          style: AppText.numMd.copyWith(
                              color: AppColors.forest,
                              fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                if (soldOut)
                  const Tag('Sold out', kind: TagKind.warning)
                else if (!t.isVisible)
                  const Tag('Hidden', kind: TagKind.info),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: Text(soldLabel,
                      style:
                          AppText.bodySm.copyWith(color: AppColors.inkMuted)),
                ),
                Text(t.isVisible ? 'Visible' : 'Hidden',
                    style: AppText.bodySm.copyWith(color: AppColors.inkSoft)),
                const SizedBox(width: 8),
                MToggle(value: t.isVisible, onChanged: (_) => _toggleVisible(t)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ── Editor ────────────────────────────────────────────────────────────────

class _TicketEditorScreen extends StatefulWidget {
  final String eventId;
  final _TicketRow? existing;
  final String defaultCurrency;
  final int nextPosition;

  const _TicketEditorScreen({
    required this.eventId,
    this.existing,
    required this.defaultCurrency,
    required this.nextPosition,
  });

  @override
  State<_TicketEditorScreen> createState() => _TicketEditorScreenState();
}

class _TicketEditorScreenState extends State<_TicketEditorScreen> {
  final _db = Supabase.instance.client;
  late final TextEditingController _nameCtrl;
  late final TextEditingController _descCtrl;
  late final TextEditingController _priceCtrl;
  late final TextEditingController _qtyCtrl;
  late String _currency;
  late bool _visible;
  bool _saving = false;
  String? _error;

  bool get _isEdit => widget.existing != null;

  static const _currencies = ['USD', 'EUR', 'KES', 'ETB', 'DJF', 'AED', 'SOS'];

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    _nameCtrl = TextEditingController(text: e?.name ?? '');
    _descCtrl = TextEditingController(text: e?.description ?? '');
    _priceCtrl = TextEditingController(
        text: e == null || e.price <= 0
            ? ''
            : (e.price == e.price.roundToDouble()
                ? e.price.toStringAsFixed(0)
                : e.price.toStringAsFixed(2)));
    _qtyCtrl = TextEditingController(text: e?.quantity?.toString() ?? '');
    _currency = e?.currency ?? widget.defaultCurrency;
    _visible = e?.isVisible ?? true;
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _descCtrl.dispose();
    _priceCtrl.dispose();
    _qtyCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final name = _nameCtrl.text.trim();
    if (name.isEmpty) {
      setState(() => _error = 'Give the ticket a name.');
      return;
    }
    final priceText = _priceCtrl.text.trim();
    final price = priceText.isEmpty ? 0.0 : double.tryParse(priceText);
    if (price == null || price < 0) {
      setState(() => _error = 'Enter a valid price (or leave it empty for free).');
      return;
    }
    final qtyText = _qtyCtrl.text.trim();
    final qty = qtyText.isEmpty ? null : int.tryParse(qtyText);
    if (qtyText.isNotEmpty && (qty == null || qty < 1)) {
      setState(() => _error = 'Quantity must be at least 1, or empty for unlimited.');
      return;
    }
    final sold = widget.existing?.quantitySold ?? 0;
    if (qty != null && qty < sold) {
      setState(() => _error =
          'Quantity can\'t be below the $sold already sold. Hide the ticket to stop sales instead.');
      return;
    }

    // Mirrors the web ticket-editor's capacity check (app/api/events/[id]/
    // tickets/route.ts) — without it, mobile could allocate ticket types
    // whose combined quantity oversells the event's stated max_capacity.
    // Best-effort: a lookup failure doesn't block saving (fail open, same as
    // the rest of this screen's error handling), it just skips the check.
    if (qty != null) {
      try {
        final page = await _db
            .from('event_pages')
            .select('max_capacity')
            .eq('event_id', widget.eventId)
            .maybeSingle();
        final maxCapacity = (page == null || page['max_capacity'] == null)
            ? null
            : asInt(page['max_capacity']);
        if (maxCapacity != null) {
          final others = await _db
              .from('ticket_types')
              .select('id, quantity')
              .eq('event_id', widget.eventId);
          final otherTotal = (others as List)
              .whereType<Map>()
              .where((t) => asString(t['id']) != widget.existing?.id)
              .fold<int>(
                  0,
                  (sum, t) =>
                      sum + (t['quantity'] == null ? 0 : asInt(t['quantity'])));
          final available = maxCapacity - otherTotal;
          if (qty > available) {
            setState(() => _error = available <= 0
                ? 'Event capacity ($maxCapacity) is already fully allocated across other ticket types.'
                : 'Quantity ($qty) exceeds available capacity. You can allocate at most $available more tickets.');
            return;
          }
        }
      } catch (_) {
        // Non-fatal — see comment above.
      }
    }

    setState(() {
      _saving = true;
      _error = null;
    });

    final values = <String, dynamic>{
      'name': name,
      'description':
          _descCtrl.text.trim().isEmpty ? null : _descCtrl.text.trim(),
      'price': price,
      'currency': _currency,
      'quantity': qty,
      'is_visible': _visible,
    };

    try {
      if (_isEdit) {
        await _db
            .from('ticket_types')
            .update(values)
            .eq('id', widget.existing!.id);
      } else {
        await _db.from('ticket_types').insert({
          ...values,
          'event_id': widget.eventId,
          'position': widget.nextPosition,
        });
      }
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _saving = false;
        _error = describeError(e, context: 'this ticket');
      });
    }
  }

  Future<void> _delete() async {
    final sold = widget.existing?.quantitySold ?? 0;
    if (sold > 0) {
      setState(() => _error =
          'This ticket has $sold registrations, so it can\'t be deleted. Hide it to stop new sales.');
      return;
    }
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Delete ticket type?'),
        content: const Text('This removes the ticket type permanently.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel',
                style: TextStyle(color: AppColors.inkMuted)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child:
                const Text('Delete', style: TextStyle(color: AppColors.danger)),
          ),
        ],
      ),
    );
    if (ok != true) return;

    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await _db
          .from('ticket_types')
          .delete()
          .eq('id', widget.existing!.id);
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _saving = false;
        _error = describeError(e, context: 'this ticket');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: MAppBar(
          title: _isEdit ? 'Edit ticket' : 'New ticket', hairline: true),
      bottomBar: StickyCta(children: [
        Expanded(
          child: MButton(
            _isEdit ? 'Save changes' : 'Create ticket',
            kind: MBtnKind.forest,
            loading: _saving,
            onTap: _saving ? null : _save,
          ),
        ),
      ]),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(
            AppSpace.lg, AppSpace.base, AppSpace.lg, AppSpace.base),
        children: [
          MInput(
            label: 'Name',
            hint: 'e.g. General Admission',
            controller: _nameCtrl,
          ),
          const SizedBox(height: 16),
          MInput(
            label: 'Description (optional)',
            hint: 'What does this ticket include?',
            controller: _descCtrl,
            minLines: 2,
            maxLines: 4,
          ),
          const SizedBox(height: 16),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(
                child: MInput(
                  label: 'Price (empty = free)',
                  hint: '0',
                  controller: _priceCtrl,
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                ),
              ),
              const SizedBox(width: 10),
              _currencyPicker(),
            ],
          ),
          const SizedBox(height: 16),
          MInput(
            label: 'Quantity (empty = unlimited)',
            hint: 'Unlimited',
            controller: _qtyCtrl,
            keyboardType: TextInputType.number,
          ),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(AppRadius.card),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Visible on the event page',
                          style: AppText.bodyStrong),
                      const SizedBox(height: 2),
                      Text('Hidden tickets stop new sales immediately.',
                          style: AppText.bodySm
                              .copyWith(color: AppColors.inkMuted)),
                    ],
                  ),
                ),
                MToggle(
                    value: _visible,
                    onChanged: (v) => setState(() => _visible = v)),
              ],
            ),
          ),
          if (_isEdit) ...[
            const SizedBox(height: 20),
            // Destructive action reads in danger red, not brand green.
            Center(
              child: TextButton(
                onPressed: _saving ? null : _delete,
                style: TextButton.styleFrom(
                  foregroundColor: AppColors.danger,
                  minimumSize: const Size(0, 48),
                ),
                child: const Text('Delete ticket type',
                    style: TextStyle(fontWeight: FontWeight.w600)),
              ),
            ),
          ],
          if (_error != null) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.danger.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                    color: AppColors.danger.withValues(alpha: 0.3)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.error_outline,
                      color: AppColors.danger, size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(_error!,
                        style:
                            AppText.bodySm.copyWith(color: AppColors.danger)),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _currencyPicker() {
    return GestureDetector(
      onTap: _saving
          ? null
          : () {
              HapticFeedback.selectionClick();
              showModalBottomSheet(
                context: context,
                backgroundColor: AppColors.surface,
                shape: const RoundedRectangleBorder(
                  borderRadius:
                      BorderRadius.vertical(top: Radius.circular(18)),
                ),
                builder: (ctx) => SafeArea(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      for (final c in _currencies)
                        ListTile(
                          title: Text(c, style: AppText.bodyStrong),
                          trailing: c == _currency
                              ? const Icon(Icons.check,
                                  color: AppColors.forest, size: 20)
                              : null,
                          onTap: () {
                            Navigator.pop(ctx);
                            setState(() => _currency = c);
                          },
                        ),
                    ],
                  ),
                ),
              );
            },
      child: Container(
        height: 50,
        padding: const EdgeInsets.symmetric(horizontal: 14),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.input),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            Text(_currency,
                style: AppText.numMd.copyWith(color: AppColors.ink)),
            const Icon(Icons.keyboard_arrow_down,
                size: 18, color: AppColors.inkMuted),
          ],
        ),
      ),
    );
  }
}
