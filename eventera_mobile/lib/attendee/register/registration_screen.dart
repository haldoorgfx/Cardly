import 'package:flutter/material.dart';

import '../../net.dart';
import '../../theme.dart';
import '../reg_store.dart';
import 'confirm_screen.dart';

/// Attendee registration form for a single event. Loads visible ticket types
/// and any organizer-defined custom form fields, collects name/email/phone,
/// applies a promo code, and POSTs to /api/events/[id]/register.
class RegistrationScreen extends StatefulWidget {
  final String eventId;
  final String slug;
  final String eventName;

  const RegistrationScreen({
    super.key,
    required this.eventId,
    required this.slug,
    required this.eventName,
  });

  @override
  State<RegistrationScreen> createState() => _RegistrationScreenState();
}

class _TicketType {
  final String id;
  final String name;
  final String? description;
  final double price;
  final String currency;
  final int? quantity;
  final int quantitySold;
  final double? minPrice;

  _TicketType({
    required this.id,
    required this.name,
    this.description,
    required this.price,
    required this.currency,
    this.quantity,
    required this.quantitySold,
    this.minPrice,
  });

  bool get soldOut => quantity != null && quantitySold >= quantity!;
  bool get isPwyw => minPrice != null && minPrice! > 0;

  factory _TicketType.fromJson(Map<String, dynamic> j) => _TicketType(
        id: asString(j['id']),
        name: asString(j['name'], 'Ticket'),
        description: j['description'] == null ? null : asString(j['description']),
        price: asDouble(j['price']),
        currency: asString(j['currency'], 'USD'),
        quantity: j['quantity'] == null ? null : asInt(j['quantity']),
        quantitySold: asInt(j['quantity_sold']),
        minPrice: j['min_price'] == null ? null : asDouble(j['min_price']),
      );
}

class _FormField {
  final String id;
  final String label;
  final String fieldType; // text|textarea|select|checkbox|radio|section|number|date|url|phone
  final List<String> options;
  final bool required;

  _FormField({
    required this.id,
    required this.label,
    required this.fieldType,
    required this.options,
    required this.required,
  });

  factory _FormField.fromJson(Map<String, dynamic> j) => _FormField(
        id: asString(j['id']),
        label: asString(j['label']),
        fieldType: asString(j['field_type'], 'text'),
        options: (j['options'] is List)
            ? (j['options'] as List).map((e) => e.toString()).toList()
            : const [],
        required: asBool(j['is_required']),
      );
}

class _RegistrationScreenState extends State<RegistrationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _promoCtrl = TextEditingController();
  final _pwywCtrl = TextEditingController();

  bool _loading = true;
  String? _loadError;
  bool _submitting = false;
  String? _submitError;

  List<_TicketType> _tickets = [];
  List<_FormField> _fields = [];
  final Map<String, String> _fieldValues = {};

  String? _selectedTicketId;

  // Promo state
  bool _promoChecking = false;
  String? _promoError;
  double _promoDiscount = 0;
  bool _promoApplied = false;

  // Payment redirect (shown as a copyable link).
  String? _paymentUrl;

  @override
  void initState() {
    super.initState();
    if (isSignedIn) {
      _emailCtrl.text = currentUserEmail ?? '';
    }
    _load();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _promoCtrl.dispose();
    _pwywCtrl.dispose();
    super.dispose();
  }

  _TicketType? get _selectedTicket {
    for (final t in _tickets) {
      if (t.id == _selectedTicketId) return t;
    }
    return null;
  }

  double get _basePrice {
    final t = _selectedTicket;
    if (t == null) return 0;
    if (t.isPwyw) return double.tryParse(_pwywCtrl.text.trim()) ?? 0;
    return t.price;
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _loadError = null;
    });
    try {
      final ticketRows = await supa
          .from('ticket_types')
          .select(
              'id, name, description, price, currency, quantity, quantity_sold, is_visible, min_price')
          .eq('event_id', widget.eventId)
          .eq('is_visible', true)
          .order('price', ascending: true);

      final fieldRows = await supa
          .from('registration_form_fields')
          .select('id, label, field_type, options, is_required, position')
          .eq('event_id', widget.eventId)
          .order('position', ascending: true);

      final tickets = asMapList(ticketRows).map(_TicketType.fromJson).toList();

      // Dedupe fields by label (mirrors the web form).
      final seen = <String>{};
      final fields = <_FormField>[];
      for (final f in asMapList(fieldRows).map(_FormField.fromJson)) {
        final key = f.label.trim().toLowerCase();
        if (key.isEmpty || seen.contains(key)) continue;
        seen.add(key);
        fields.add(f);
      }

      if (!mounted) return;
      setState(() {
        _tickets = tickets;
        _fields = fields;
        _selectedTicketId = tickets.isNotEmpty ? tickets.first.id : null;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loadError = 'Could not load tickets. Please try again.';
        _loading = false;
      });
    }
  }

  Future<void> _applyPromo() async {
    final code = _promoCtrl.text.trim();
    final ticket = _selectedTicket;
    if (code.isEmpty || ticket == null) return;
    setState(() {
      _promoChecking = true;
      _promoError = null;
      _promoApplied = false;
      _promoDiscount = 0;
    });
    try {
      final res = await apiPost(
        '/api/events/${widget.eventId}/promo/validate',
        {
          'code': code,
          'ticket_type_id': ticket.id,
          'amount': _basePrice,
        },
      );
      final map = res is Map ? Map<String, dynamic>.from(res) : {};
      if (asBool(map['valid'])) {
        setState(() {
          _promoDiscount = asDouble(map['discount_amount']);
          _promoApplied = true;
        });
      } else {
        setState(() =>
            _promoError = asString(map['error'], 'That code isn’t valid.'));
      }
    } on ApiException catch (e) {
      setState(() => _promoError = e.message);
    } catch (_) {
      setState(() => _promoError = 'Could not check that code.');
    } finally {
      if (mounted) setState(() => _promoChecking = false);
    }
  }

  bool _validateFields() {
    if (!(_formKey.currentState?.validate() ?? false)) return false;
    if (_selectedTicket == null) {
      setState(() => _submitError = 'Please choose a ticket.');
      return false;
    }
    for (final f in _fields) {
      if (f.fieldType == 'section') continue;
      if (f.required) {
        final v = _fieldValues[f.id]?.trim() ?? '';
        final ok = f.fieldType == 'checkbox' ? v == 'true' : v.isNotEmpty;
        if (!ok) {
          setState(() => _submitError = '${f.label} is required.');
          return false;
        }
      }
    }
    final t = _selectedTicket!;
    if (t.isPwyw) {
      final amt = double.tryParse(_pwywCtrl.text.trim());
      if (amt == null) {
        setState(() => _submitError = 'Please enter an amount.');
        return false;
      }
      if (amt < (t.minPrice ?? 0)) {
        setState(() =>
            _submitError = 'Minimum amount is ${t.currency} ${t.minPrice}.');
        return false;
      }
    }
    return true;
  }

  Future<void> _submit() async {
    setState(() => _submitError = null);
    if (!_validateFields()) return;

    final ticket = _selectedTicket!;
    setState(() {
      _submitting = true;
      _paymentUrl = null;
    });

    // custom_fields keyed by field id (matches the web form).
    final customFields = <String, String>{};
    for (final f in _fields) {
      if (f.fieldType == 'section') continue;
      final v = _fieldValues[f.id];
      if (v != null && v.trim().isNotEmpty) customFields[f.id] = v.trim();
    }

    final body = <String, dynamic>{
      'ticket_type_id': ticket.id,
      'attendee_name': _nameCtrl.text.trim(),
      'attendee_email': _emailCtrl.text.trim().toLowerCase(),
      if (_phoneCtrl.text.trim().isNotEmpty)
        'attendee_phone': _phoneCtrl.text.trim(),
      'custom_fields': customFields,
      if (ticket.isPwyw)
        'chosen_price': double.tryParse(_pwywCtrl.text.trim()) ?? 0,
      if (_promoApplied && _promoCtrl.text.trim().isNotEmpty)
        'promo_code': _promoCtrl.text.trim(),
    };

    try {
      final res =
          await apiPost('/api/events/${widget.eventId}/register', body);
      final map = res is Map ? Map<String, dynamic>.from(res) : {};

      final regId = asString(map['registration_id']);
      final qrToken = map['qr_code_token'] == null
          ? null
          : asString(map['qr_code_token']);

      // Save the registration for engagement features keyed by slug.
      if (regId.isNotEmpty) {
        await RegStore.instance.set(
          widget.slug,
          RegInfo(
            registrationId: regId,
            qrToken: qrToken,
            attendeeName: _nameCtrl.text.trim(),
            attendeeEmail: _emailCtrl.text.trim().toLowerCase(),
          ),
        );
      }

      final paymentRequired = asBool(map['payment_required']);
      final redirectUrl = map['redirect_url'] == null
          ? null
          : asString(map['redirect_url']);

      if (!mounted) return;

      if (paymentRequired && redirectUrl != null && redirectUrl.isNotEmpty) {
        // Card-based redirect flow (Flutterwave). We don't bundle url_launcher,
        // so surface the link for the attendee to open/copy.
        setState(() {
          _submitting = false;
          _paymentUrl = redirectUrl;
        });
        return;
      }

      if (paymentRequired) {
        // Stripe / WaafiPay in-app payment isn't implemented in this module.
        setState(() {
          _submitting = false;
          _submitError =
              'This ticket needs payment, which isn’t available in the app '
              'yet. Please complete registration on the web.';
        });
        return;
      }

      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => ConfirmScreen(
            qrToken: qrToken ?? '',
            eventName: widget.eventName,
            attendeeName: _nameCtrl.text.trim(),
            ticketType: ticket.name,
            cardEventSlug: widget.slug,
          ),
        ),
      );
    } on ApiException catch (e) {
      if (mounted) {
        setState(() {
          _submitting = false;
          _submitError = e.message;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _submitting = false;
          _submitError = 'Something went wrong. Please try again.';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Brand.cream,
      appBar: AppBar(
        backgroundColor: Brand.cream,
        elevation: 0,
        foregroundColor: Brand.ink,
        title: const Text('Register'),
      ),
      body: SafeArea(child: _body()),
    );
  }

  Widget _body() {
    if (_loading) {
      return const Center(
        child: CircularProgressIndicator(color: Brand.forest),
      );
    }
    if (_loadError != null) {
      return _CenterMessage(
        icon: Icons.error_outline,
        title: 'Couldn’t load',
        message: _loadError!,
        actionLabel: 'Retry',
        onAction: _load,
      );
    }
    if (_tickets.isEmpty) {
      return const _CenterMessage(
        icon: Icons.confirmation_number_outlined,
        title: 'No tickets available',
        message: 'This event has no tickets open for registration right now.',
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              widget.eventName,
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                color: Brand.ink,
              ),
            ),
            const SizedBox(height: 20),
            _sectionLabel('Choose a ticket'),
            const SizedBox(height: 8),
            ..._tickets.map(_ticketTile),
            if (_selectedTicket?.isPwyw ?? false) ...[
              const SizedBox(height: 8),
              TextFormField(
                controller: _pwywCtrl,
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
                decoration: InputDecoration(
                  labelText: 'Amount (${_selectedTicket!.currency})',
                  hintText: 'Min ${_selectedTicket!.minPrice}',
                ),
                onChanged: (_) => setState(() {
                  _promoApplied = false;
                  _promoDiscount = 0;
                }),
              ),
            ],
            const SizedBox(height: 24),
            _sectionLabel('Your details'),
            const SizedBox(height: 8),
            TextFormField(
              controller: _nameCtrl,
              textCapitalization: TextCapitalization.words,
              decoration: const InputDecoration(labelText: 'Full name'),
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? 'Name is required' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _emailCtrl,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(labelText: 'Email'),
              validator: (v) {
                final s = (v ?? '').trim();
                if (s.isEmpty) return 'Email is required';
                if (!s.contains('@') || !s.contains('.')) {
                  return 'Enter a valid email';
                }
                return null;
              },
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _phoneCtrl,
              keyboardType: TextInputType.phone,
              decoration:
                  const InputDecoration(labelText: 'Phone (optional)'),
            ),
            if (_fields.isNotEmpty) ...[
              const SizedBox(height: 24),
              ..._fields.map(_customField),
            ],
            if (_basePrice > 0) ...[
              const SizedBox(height: 24),
              _sectionLabel('Promo code'),
              const SizedBox(height: 8),
              _promoRow(),
            ],
            const SizedBox(height: 24),
            _summary(),
            if (_paymentUrl != null) ...[
              const SizedBox(height: 16),
              _paymentBox(_paymentUrl!),
            ],
            if (_submitError != null) ...[
              const SizedBox(height: 16),
              _ErrorBox(_submitError!),
            ],
            const SizedBox(height: 20),
            FilledButton(
              onPressed: _submitting ? null : _submit,
              child: _submitting
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation(Colors.white),
                      ),
                    )
                  : Text(_basePrice > 0
                      ? 'Continue'
                      : 'Complete registration'),
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  Widget _sectionLabel(String text) => Text(
        text,
        style: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w700,
          color: Brand.muted,
          letterSpacing: 0.2,
        ),
      );

  Widget _ticketTile(_TicketType t) {
    final selected = t.id == _selectedTicketId;
    final priceLabel = t.isPwyw
        ? 'From ${t.currency} ${t.minPrice}'
        : (t.price <= 0 ? 'Free' : '${t.currency} ${t.price}');
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: t.soldOut
            ? null
            : () => setState(() {
                  _selectedTicketId = t.id;
                  _promoApplied = false;
                  _promoDiscount = 0;
                }),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Brand.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: selected ? Brand.forest : Brand.border,
              width: selected ? 2 : 1,
            ),
          ),
          child: Row(
            children: [
              Icon(
                selected
                    ? Icons.radio_button_checked
                    : Icons.radio_button_off,
                color: selected ? Brand.forest : Brand.muted,
                size: 20,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      t.name,
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: t.soldOut ? Brand.muted : Brand.ink,
                      ),
                    ),
                    if (t.description != null &&
                        t.description!.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(
                        t.description!,
                        style:
                            const TextStyle(fontSize: 12, color: Brand.muted),
                      ),
                    ],
                    if (t.soldOut) ...[
                      const SizedBox(height: 2),
                      const Text(
                        'Sold out',
                        style: TextStyle(
                          fontSize: 12,
                          color: Brand.danger,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Text(
                priceLabel,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: Brand.forest,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _customField(_FormField f) {
    // Inline validation is handled at submit time in _validateFields().
    final val = _fieldValues[f.id] ?? '';

    Widget wrap(Widget child) => Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: child,
        );

    switch (f.fieldType) {
      case 'section':
        return wrap(
          Padding(
            padding: const EdgeInsets.only(top: 8, bottom: 4),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  f.label,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: Brand.ink,
                  ),
                ),
                const SizedBox(height: 6),
                const Divider(color: Brand.border, height: 1),
              ],
            ),
          ),
        );
      case 'textarea':
        return wrap(
          TextFormField(
            initialValue: val,
            maxLines: 3,
            decoration: InputDecoration(labelText: _lbl(f)),
            onChanged: (v) => _fieldValues[f.id] = v,
          ),
        );
      case 'checkbox':
        return wrap(
          CheckboxListTile(
            contentPadding: EdgeInsets.zero,
            controlAffinity: ListTileControlAffinity.leading,
            activeColor: Brand.forest,
            value: val == 'true',
            title: Text(_lbl(f),
                style: const TextStyle(fontSize: 14, color: Brand.ink)),
            onChanged: (v) =>
                setState(() => _fieldValues[f.id] = v == true ? 'true' : ''),
          ),
        );
      case 'select':
        return wrap(
          DropdownButtonFormField<String>(
            initialValue: val.isEmpty ? null : val,
            isExpanded: true,
            decoration: InputDecoration(labelText: _lbl(f)),
            items: f.options
                .map((o) => DropdownMenuItem(value: o, child: Text(o)))
                .toList(),
            onChanged: (v) => setState(() => _fieldValues[f.id] = v ?? ''),
          ),
        );
      case 'radio':
        return wrap(
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Text(_lbl(f),
                    style: const TextStyle(
                        fontSize: 12, color: Brand.muted)),
              ),
              ...f.options.map(
                (o) => InkWell(
                  onTap: () => setState(() => _fieldValues[f.id] = o),
                  borderRadius: BorderRadius.circular(8),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    child: Row(
                      children: [
                        Icon(
                          val == o
                              ? Icons.radio_button_checked
                              : Icons.radio_button_off,
                          size: 20,
                          color: val == o ? Brand.forest : Brand.muted,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            o,
                            style: const TextStyle(
                                fontSize: 14, color: Brand.ink),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      default:
        final keyboard = f.fieldType == 'number'
            ? TextInputType.number
            : f.fieldType == 'phone'
                ? TextInputType.phone
                : f.fieldType == 'url'
                    ? TextInputType.url
                    : TextInputType.text;
        return wrap(
          TextFormField(
            initialValue: val,
            keyboardType: keyboard,
            decoration: InputDecoration(labelText: _lbl(f)),
            onChanged: (v) => _fieldValues[f.id] = v,
          ),
        );
    }
  }

  String _lbl(_FormField f) => f.required ? '${f.label} *' : f.label;

  Widget _promoRow() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _promoCtrl,
                textCapitalization: TextCapitalization.characters,
                enabled: !_promoApplied,
                decoration: const InputDecoration(hintText: 'Enter code'),
              ),
            ),
            const SizedBox(width: 8),
            SizedBox(
              height: 52,
              child: _promoApplied
                  ? OutlinedButton(
                      onPressed: () => setState(() {
                        _promoApplied = false;
                        _promoDiscount = 0;
                        _promoCtrl.clear();
                      }),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Brand.danger,
                        side: const BorderSide(color: Brand.border),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text('Remove'),
                    )
                  : OutlinedButton(
                      onPressed: _promoChecking ? null : _applyPromo,
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Brand.forest,
                        side: const BorderSide(color: Brand.border),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: _promoChecking
                          ? const SizedBox(
                              height: 16,
                              width: 16,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Brand.forest,
                              ),
                            )
                          : const Text('Apply'),
                    ),
            ),
          ],
        ),
        if (_promoApplied)
          Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Text(
              'Promo applied — you save ${_selectedTicket?.currency ?? ''} $_promoDiscount',
              style: const TextStyle(
                fontSize: 12,
                color: Brand.success,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        if (_promoError != null)
          Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Text(
              _promoError!,
              style: const TextStyle(fontSize: 12, color: Brand.danger),
            ),
          ),
      ],
    );
  }

  Widget _summary() {
    final t = _selectedTicket;
    if (t == null) return const SizedBox.shrink();
    final base = _basePrice;
    if (base <= 0) {
      return _summaryBox([_SummaryRow('Total', 'Free', bold: true)]);
    }
    final total = (base - _promoDiscount).clamp(0, double.infinity);
    return _summaryBox([
      _SummaryRow('${t.name}', '${t.currency} $base'),
      if (_promoApplied && _promoDiscount > 0)
        _SummaryRow('Discount', '- ${t.currency} $_promoDiscount',
            color: Brand.success),
      _SummaryRow('Total', '${t.currency} $total', bold: true),
    ]);
  }

  Widget _summaryBox(List<Widget> rows) => Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Brand.forest.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(children: rows),
      );

  Widget _paymentBox(String url) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Brand.gold.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Brand.gold.withValues(alpha: 0.5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Complete your payment',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: Brand.ink,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Open this secure link in your browser to pay. Your ticket is '
            'reserved and will confirm once payment completes.',
            style: TextStyle(fontSize: 13, color: Brand.inkSoft),
          ),
          const SizedBox(height: 10),
          SelectableText(
            url,
            style: const TextStyle(
              fontSize: 12,
              color: Brand.forest,
              decoration: TextDecoration.underline,
            ),
          ),
        ],
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  final String label;
  final String value;
  final bool bold;
  final Color? color;
  const _SummaryRow(this.label, this.value, {this.bold = false, this.color});

  @override
  Widget build(BuildContext context) {
    final style = TextStyle(
      fontSize: bold ? 15 : 14,
      fontWeight: bold ? FontWeight.w700 : FontWeight.w500,
      color: color ?? (bold ? Brand.ink : Brand.inkSoft),
    );
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: style),
          Text(value, style: style),
        ],
      ),
    );
  }
}

class _ErrorBox extends StatelessWidget {
  final String message;
  const _ErrorBox(this.message);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Brand.danger.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Brand.danger.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline, color: Brand.danger, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(color: Brand.danger, fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }
}

class _CenterMessage extends StatelessWidget {
  final IconData icon;
  final String title;
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;

  const _CenterMessage({
    required this.icon,
    required this.title,
    required this.message,
    this.actionLabel,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 40, color: Brand.muted),
            const SizedBox(height: 16),
            Text(
              title,
              style: const TextStyle(
                fontSi