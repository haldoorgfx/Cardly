import 'package:flutter/material.dart';

import '../../app_config.dart';
import '../../net.dart';
import '../../ui/components.dart';
import '../../ui/tokens.dart';
import '../event_context.dart';
import '../reg_store.dart';
import 'confirm_screen.dart';
import 'hosted_payment_screen.dart';
import 'needs_field.dart';
import 'waafipay_payment_screen.dart';
import 'waitlist_screen.dart';

/// Attendee registration for a single event. Loads visible ticket types and any
/// organizer-defined custom form fields, collects name/email/phone, applies a
/// promo code, and POSTs to /api/events/[id]/register.
/// Screens 8 (ticket selection), 9 (registration form), 10 (order summary).
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
  int? get remaining => quantity == null ? null : (quantity! - quantitySold);

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
  // D01 — dietary/accessibility answers, kept OFF custom_fields. Selected chips
  // per field id, plus an optional free-text note per field id. These flow into
  // the dedicated registrations.dietary / accessibility columns on submit.
  final Map<String, Set<String>> _needsValues = {};
  final Map<String, String> _needsNotes = {};

  String? _selectedTicketId;

  // Promo state
  bool _promoChecking = false;
  String? _promoError;
  double _promoDiscount = 0;
  bool _promoApplied = false;

  // Payment redirect (shown as a copyable link).

  @override
  void initState() {
    super.initState();
    if (isSignedIn) {
      _emailCtrl.text = currentUserEmail ?? '';
      _prefillName();
    }
    _load();
  }

  /// Pre-fill from the signed-in profile (parity with the web registration
  /// form) — most useful right after the sign-in-recommendation prompt, so
  /// the attendee lands here with their name already in place.
  Future<void> _prefillName() async {
    final uid = currentUserId;
    if (uid == null) return;
    try {
      final row = await supa
          .from('profiles')
          .select('full_name')
          .eq('id', uid)
          .maybeSingle();
      final name = (row?['full_name'] as String?)?.trim() ?? '';
      if (name.isNotEmpty && mounted) _nameCtrl.text = name;
    } catch (_) {
      // Non-fatal — the attendee can just type their name.
    }
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

  bool get _allSoldOut =>
      _tickets.isNotEmpty && _tickets.every((t) => t.soldOut);

  void _openWaitlist() {
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => WaitlistScreen(
        slug: widget.slug,
        eventName: widget.eventName,
        prefillName: _nameCtrl.text.trim().isEmpty
            ? null
            : _nameCtrl.text.trim(),
        prefillEmail: _emailCtrl.text.trim().isEmpty
            ? null
            : _emailCtrl.text.trim(),
      ),
    ));
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
          // Show a ticket unless it's EXPLICITLY hidden. `.eq('is_visible', true)`
          // wrongly hid tickets whose is_visible is null (the common case when
          // the web app never sets the flag), causing "No tickets available".
          .not('is_visible', 'is', false)
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
      if (!mounted) return;
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
      if (!mounted) return;
      setState(() => _promoError = e.message);
    } catch (_) {
      if (!mounted) return;
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
        if (f.fieldType == 'dietary' || f.fieldType == 'accessibility') {
          // Satisfied by at least one chip or a note.
          final chips = _needsValues[f.id] ?? const <String>{};
          final note = _needsNotes[f.id]?.trim() ?? '';
          if (chips.isEmpty && note.isEmpty) {
            setState(() => _submitError = '${f.label} is required.');
            return false;
          }
          continue;
        }
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
    setState(() => _submitting = true);

    // custom_fields keyed by field id (matches the web form). Dietary +
    // accessibility answers are NEVER put here — they go to their dedicated
    // registrations columns below.
    final customFields = <String, String>{};
    for (final f in _fields) {
      if (f.fieldType == 'section' ||
          f.fieldType == 'dietary' ||
          f.fieldType == 'accessibility') continue;
      final v = _fieldValues[f.id];
      if (v != null && v.trim().isNotEmpty) customFields[f.id] = v.trim();
    }

    // D01 — collect dietary + accessibility into their own arrays + notes.
    final dietary = <String>[];
    final accessibility = <String>[];
    String? dietaryNote;
    String? accessibilityNote;
    for (final f in _fields) {
      if (f.fieldType == 'dietary') {
        dietary.addAll(_needsValues[f.id] ?? const <String>{});
        final n = _needsNotes[f.id]?.trim();
        if (n != null && n.isNotEmpty) dietaryNote = n;
      } else if (f.fieldType == 'accessibility') {
        accessibility.addAll(_needsValues[f.id] ?? const <String>{});
        final n = _needsNotes[f.id]?.trim();
        if (n != null && n.isNotEmpty) accessibilityNote = n;
      }
    }

    final body = <String, dynamic>{
      'ticket_type_id': ticket.id,
      'attendee_name': _nameCtrl.text.trim(),
      'attendee_email': _emailCtrl.text.trim().toLowerCase(),
      if (_phoneCtrl.text.trim().isNotEmpty)
        'attendee_phone': _phoneCtrl.text.trim(),
      'custom_fields': customFields,
      if (dietary.isNotEmpty) 'dietary': dietary,
      if (dietaryNote != null) 'dietary_note': dietaryNote,
      if (accessibility.isNotEmpty) 'accessibility': accessibility,
      if (accessibilityNote != null) 'accessibility_note': accessibilityNote,
      if (ticket.isPwyw)
        'chosen_price': double.tryParse(_pwywCtrl.text.trim()) ?? 0,
      if (_promoApplied && _promoCtrl.text.trim().isNotEmpty)
        'promo_code': _promoCtrl.text.trim(),
      // Prefer mobile money (WaafiPay) when the organizer has it enabled.
      // The server falls back to its own routing if not available.
      'preferred_processor': 'waafipay',
    };

    try {
      final res =
          await apiPost('/api/events/${widget.eventId}/register', body);
      final map = res is Map ? Map<String, dynamic>.from(res) : {};

      final regId = asString(map['registration_id']);
      final qrToken = map['qr_code_token'] == null
          ? null
          : asString(map['qr_code_token']);

      // Unlock engagement features immediately for this session. The durable
      // source of truth stays RegStore (below) + the registrations table.
      if (regId.isNotEmpty) {
        EventContext.current?.registrationId = regId;
      }

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
      final awaitingApproval = asBool(map['awaiting_approval']);
      final processor = asString(map['payment_processor']);
      final redirectUrl = map['redirect_url'] == null
          ? null
          : asString(map['redirect_url']);

      if (!mounted) return;

      // Mobile money (WaafiPay) — collect the phone number and charge inline.
      if (paymentRequired && processor == 'waafipay') {
        setState(() => _submitting = false);
        final paid = await Navigator.of(context).push<bool>(
          MaterialPageRoute(
            builder: (_) => WaafiPayPaymentScreen(
              registrationId: regId,
              amount: asDouble(map['amount']),
              currency: asString(map['currency'], ticket.currency),
              ticketName: asString(map['ticket_name'], ticket.name),
              eventName: widget.eventName,
            ),
          ),
        );
        if (paid == true && mounted) _goToConfirm(qrToken, ticket.name);
        return;
      }

      // Hosted checkout in the browser (Flutterwave link, or the web pay page
      // for Stripe). We wait on a payment screen that polls until it's paid.
      final clientSecret = map['client_secret'] == null
          ? null
          : asString(map['client_secret']);
      String? payUrl;
      String? paymentIntentId;
      if (paymentRequired && redirectUrl != null && redirectUrl.isNotEmpty) {
        payUrl = redirectUrl; // Flutterwave hosted checkout
      } else if (paymentRequired &&
          clientSecret != null &&
          clientSecret.isNotEmpty &&
          (qrToken ?? '').isNotEmpty) {
        // Stripe: the web pay page renders Elements for this registration.
        payUrl = '${AppConfig.renderBaseUrl}/e/${widget.slug}/register/pay'
            '?reg=${Uri.encodeQueryComponent(qrToken!)}';
        // client_secret is "pi_xxx_secret_yyy" — the PI id is the prefix.
        paymentIntentId = clientSecret.split('_secret').first;
      }

      if (paymentRequired && payUrl != null && (qrToken ?? '').isNotEmpty) {
        setState(() => _submitting = false);
        final paid = await Navigator.of(context).push<bool>(
          MaterialPageRoute(
            builder: (_) => HostedPaymentScreen(
              payUrl: payUrl!,
              qrToken: qrToken!,
              paymentIntentId: paymentIntentId,
              amount: asDouble(map['amount'], ticket.price),
              currency: asString(map['currency'], ticket.currency),
              ticketName: asString(map['ticket_name'], ticket.name),
              eventName: widget.eventName,
            ),
          ),
        );
        if (paid == true && mounted) _goToConfirm(qrToken, ticket.name);
        return;
      }

      if (paymentRequired) {
        // No usable payment handle came back — shouldn't happen, but don't
        // strand the attendee silently.
        setState(() {
          _submitting = false;
          _submitError =
              'We couldn\'t start the payment. Please try again, or complete '
              'your registration on the event\'s web page.';
        });
        return;
      }

      _goToConfirm(qrToken, ticket.name, isPendingApproval: awaitingApproval);
      return;
    } on ApiException catch (e) {
      if (mounted) {
        setState(() {
          _submitting = false;
          _submitError = e.message;
        });
      }
      return;
    } catch (_) {
      if (mounted) {
        setState(() {
          _submitting = false;
          _submitError = 'Something went wrong. Please try again.';
        });
      }
      return;
    }
  }

  void _goToConfirm(String? qrToken, String ticketName,
      {bool isPendingApproval = false}) {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => ConfirmScreen(
          qrToken: qrToken ?? '',
          eventName: widget.eventName,
          slug: widget.slug,
          attendeeName: _nameCtrl.text.trim(),
          ticketType: ticketName,
          // The card is a graphic gated on a real registration — don't offer
          // it before the organizer has actually approved the attendee.
          cardEventSlug: isPendingApproval ? null : widget.slug,
          isPendingApproval: isPendingApproval,
        ),
      ),
    );
  }

  // ── Build ──────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    final showBar = !_loading && _loadError == null && _tickets.isNotEmpty;
    return MScaffold(
      appBar: const MAppBar(title: 'Register', hairline: true),
      bottomBar: showBar ? _stickyBar() : null,
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
        title: 'No tickets available',
        message: 'This event has no tickets open for registration right now.',
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(
          AppSpace.lg, AppSpace.base, AppSpace.lg, AppSpace.base),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(widget.eventName, style: AppText.h2),
            const SizedBox(height: 20),
            // ── Screen 8: ticket selection ────────────────────────────
            const SectionLabel('Choose a ticket'),
            const SizedBox(height: 12),
            ..._tickets.map(_ticketTile),
            if (_selectedTicket?.isPwyw ?? false) ...[
              const SizedBox(height: 4),
              MInput(
                label: 'Amount (${_selectedTicket!.currency})',
                hint: 'Min ${_selectedTicket!.minPrice}',
                controller: _pwywCtrl,
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
                onChanged: (_) => setState(() {
                  _promoApplied = false;
                  _promoDiscount = 0;
                }),
              ),
            ],
            if (_basePrice > 0) ...[
              const SizedBox(height: 12),
              _promoField(),
            ],
            const SizedBox(height: 24),
            const Divider(color: AppColors.border, height: 1),
            const SizedBox(height: 20),
            // ── Screen 9: your details ────────────────────────────────
            const SectionLabel('Your details'),
            const SizedBox(height: 14),
            _MFormField(
              label: 'Full name',
              controller: _nameCtrl,
              textCapitalization: TextCapitalization.words,
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? 'Name is required' : null,
            ),
            const SizedBox(height: 16),
            _MFormField(
              label: 'Email',
              controller: _emailCtrl,
              keyboardType: TextInputType.emailAddress,
              validator: (v) {
                final s = (v ?? '').trim();
                if (s.isEmpty) return 'Email is required';
                if (!s.contains('@') || !s.contains('.')) {
                  return 'Enter a valid email';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            _MFormField(
              label: 'Phone (optional)',
              controller: _phoneCtrl,
              keyboardType: TextInputType.phone,
            ),
            if (_fields.isNotEmpty) ...[
              const SizedBox(height: 24),
              const SectionLabel('Organizer questions'),
              const SizedBox(height: 14),
              ..._fields.map(_customField),
            ],
            // ── Screen 10: order summary ──────────────────────────────
            const SizedBox(height: 24),
            _summary(),
            if (_submitError != null) ...[
              const SizedBox(height: 16),
              _errorBox(_submitError!),
            ],
          ],
        ),
      ),
    );
  }

  Widget _stickyBar() {
    final t = _selectedTicket;
    final base = _basePrice;
    final total = (base - _promoDiscount).clamp(0, double.infinity);
    final ccy = t?.currency ?? '';
    return StickyCta(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisSize: MainAxisSize.min,
            children: [
              if (t != null && !_allSoldOut) ...[
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Flexible(
                      child: Text(
                        t.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppText.bodySm.copyWith(color: AppColors.inkMuted),
                      ),
                    ),
                    Text(
                      base <= 0 ? 'Free' : '$ccy ${total.toStringAsFixed(2)}',
                      style: AppText.numMd.copyWith(
                          fontSize: 18,
                          fontWeight: FontWeight.w500,
                          color: AppColors.forest),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
              ],
              if (_allSoldOut)
                MButton(
                  'Join the waitlist',
                  kind: MBtnKind.forest,
                  icon: Icons.notifications_active_outlined,
                  onTap: _openWaitlist,
                )
              else
                MButton(
                  base > 0 ? 'Continue' : 'Complete registration',
                  kind: MBtnKind.forest,
                  loading: _submitting,
                  onTap: _submitting ? null : _submit,
                ),
            ],
          ),
        ),
      ],
    );
  }

  // ── Screen 8 · ticket radio card ───────────────────────────────────
  Widget _ticketTile(_TicketType t) {
    final selected = t.id == _selectedTicketId;
    final priceLabel = t.isPwyw
        ? 'From ${t.currency} ${t.minPrice}'
        : (t.price <= 0 ? 'Free' : '${t.currency} ${t.price}');
    final remaining = t.remaining;

    Widget? sub;
    if (t.soldOut) {
      sub = Text.rich(TextSpan(
        style: AppText.bodySm.copyWith(color: AppColors.inkMuted),
        children: [
          const TextSpan(text: 'Sold out · '),
          TextSpan(
            text: 'Join waitlist',
            style: AppText.bodySm.copyWith(
                color: AppColors.forest, fontWeight: FontWeight.w600),
          ),
        ],
      ));
    } else {
      final desc = (t.description != null && t.description!.isNotEmpty)
          ? t.description!
          : null;
      final spans = <InlineSpan>[];
      if (desc != null) {
        spans.add(TextSpan(text: desc));
      }
      if (remaining != null) {
        if (desc != null) spans.add(const TextSpan(text: ' · '));
        spans.add(TextSpan(
          text: '$remaining left',
          style: AppText.bodySm.copyWith(
            color: remaining <= 10 ? AppColors.warning : AppColors.success,
            fontWeight: FontWeight.w600,
          ),
        ));
      }
      if (spans.isNotEmpty) {
        sub = Text.rich(TextSpan(
            style: AppText.bodySm.copyWith(color: AppColors.inkMuted),
            children: spans));
      }
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Opacity(
        opacity: t.soldOut ? 0.55 : 1,
        child: GestureDetector(
          onTap: t.soldOut
              ? _openWaitlist
              : () => setState(() {
                    _selectedTicketId = t.id;
                    _promoApplied = false;
                    _promoDiscount = 0;
                  }),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(AppRadius.card),
              border: Border.all(
                color: selected ? AppColors.forest : AppColors.border,
                width: selected ? 2 : 1,
              ),
              boxShadow: selected ? AppShadow.ring : AppShadow.soft,
            ),
            child: Row(
              children: [
                _radio(selected),
                const SizedBox(width: 13),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        t.name,
                        style: AppText.h3.copyWith(
                          fontSize: 15,
                          decoration:
                              t.soldOut ? TextDecoration.lineThrough : null,
                        ),
                      ),
                      if (sub != null) ...[
                        const SizedBox(height: 2),
                        sub,
                      ],
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  priceLabel,
                  style: AppText.numMd.copyWith(
                    color: t.soldOut ? AppColors.inkMuted : AppColors.forest,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _radio(bool on) => Container(
        width: 20,
        height: 20,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(
              color: on ? AppColors.forest : AppColors.borderStrong,
              width: 1.5),
        ),
        child: on
            ? Center(
                child: Container(
                  width: 10,
                  height: 10,
                  decoration: const BoxDecoration(
                      color: AppColors.forest, shape: BoxShape.circle),
                ),
              )
            : null,
      );

  // ── Screen 8 · dashed promo field ──────────────────────────────────
  Widget _promoField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _DottedBorder(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 4),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _promoCtrl,
                    enabled: !_promoApplied,
                    textCapitalization: TextCapitalization.characters,
                    style: AppText.numSm.copyWith(color: AppColors.ink),
                    decoration: InputDecoration(
                      isDense: true,
                      border: InputBorder.none,
                      hintText: 'Promo code',
                      hintStyle:
                          AppText.numSm.copyWith(color: AppColors.inkMuted),
                    ),
                  ),
                ),
                GestureDetector(
                  onTap: _promoApplied
                      ? () => setState(() {
                            _promoApplied = false;
                            _promoDiscount = 0;
                            _promoCtrl.clear();
                          })
                      : (_promoChecking ? null : _applyPromo),
                  child: _promoChecking
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: AppColors.forest),
                        )
                      : Text(
                          _promoApplied ? 'Remove' : 'Apply',
                          style: AppText.bodySm.copyWith(
                            color: _promoApplied
                                ? AppColors.danger
                                : AppColors.forest,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                ),
              ],
            ),
          ),
        ),
        if (_promoApplied)
          Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Text(
              'Promo applied — you save ${_selectedTicket?.currency ?? ''} $_promoDiscount',
              style: AppText.bodySm.copyWith(
                  color: AppColors.success, fontWeight: FontWeight.w600),
            ),
          ),
        if (_promoError != null)
          Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Text(_promoError!,
                style: AppText.bodySm.copyWith(color: AppColors.danger)),
          ),
      ],
    );
  }

  // ── Screen 9 · organizer custom fields ─────────────────────────────
  Widget _customField(_FormField f) {
    final val = _fieldValues[f.id] ?? '';

    Widget wrap(Widget child) => Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: child,
        );

    switch (f.fieldType) {
      case 'section':
        return wrap(
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(f.label, style: AppText.h3.copyWith(fontSize: 15)),
                const SizedBox(height: 8),
                const Divider(color: AppColors.border, height: 1),
              ],
            ),
          ),
        );
      case 'textarea':
        return wrap(
          _MFormField(
            label: _lbl(f),
            initialValue: val,
            maxLines: 3,
            onChanged: (v) => _fieldValues[f.id] = v,
          ),
        );
      case 'checkbox':
        return wrap(
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(f.label, style: AppText.label),
              const SizedBox(height: 8),
              GestureDetector(
                onTap: () => setState(
                    () => _fieldValues[f.id] = val == 'true' ? '' : 'true'),
                child: Row(
                  children: [
                    Container(
                      width: 22,
                      height: 22,
                      decoration: BoxDecoration(
                        color: val == 'true'
                            ? AppColors.forest
                            : AppColors.surface,
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(
                            color: val == 'true'
                                ? AppColors.forest
                                : AppColors.borderStrong),
                      ),
                      child: val == 'true'
                          ? const Icon(Icons.check,
                              size: 14, color: Colors.white)
                          : null,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(f.label,
                          style: AppText.body
                              .copyWith(color: AppColors.inkSoft, height: 1.3)),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      case 'select':
        return wrap(
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(_lbl(f), style: AppText.label),
              const SizedBox(height: 7),
              Container(
                height: 50,
                padding: const EdgeInsets.symmetric(horizontal: 15),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(AppRadius.input),
                  border: Border.all(color: AppColors.border),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: val.isEmpty ? null : val,
                    isExpanded: true,
                    hint: Text('Select…',
                        style: AppText.body.copyWith(color: AppColors.inkMuted)),
                    icon: const Icon(Icons.keyboard_arrow_down,
                        color: AppColors.inkMuted),
                    style: AppText.body.copyWith(color: AppColors.ink),
                    items: f.options
                        .map((o) =>
                            DropdownMenuItem(value: o, child: Text(o)))
                        .toList(),
                    onChanged: (v) =>
                        setState(() => _fieldValues[f.id] = v ?? ''),
                  ),
                ),
              ),
            ],
          ),
        );
      case 'radio':
        return wrap(
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(_lbl(f), style: AppText.label),
              const SizedBox(height: 4),
              ...f.options.map(
                (o) => GestureDetector(
                  onTap: () => setState(() => _fieldValues[f.id] = o),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    child: Row(
                      children: [
                        _radio(val == o),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(o,
                              style: AppText.body
                                  .copyWith(color: AppColors.ink, height: 1.3)),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      case 'dietary':
      case 'accessibility':
        return wrap(
          NeedsField(
            kind: f.fieldType,
            label: f.label,
            required: f.required,
            options: f.options,
            selected: _needsValues[f.id] ?? const <String>{},
            noteHint: 'Add a note (optional)',
            onToggle: (o) => setState(() {
              final set = _needsValues.putIfAbsent(f.id, () => <String>{});
              if (!set.remove(o)) set.add(o);
            }),
            onNote: (v) => _needsNotes[f.id] = v,
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
          _MFormField(
            label: _lbl(f),
            initialValue: val,
            keyboardType: keyboard,
            onChanged: (v) => _fieldValues[f.id] = v,
          ),
        );
    }
  }

  String _lbl(_FormField f) => f.required ? '${f.label} *' : f.label;

  // ── Screen 10 · order summary ──────────────────────────────────────
  Widget _summary() {
    final t = _selectedTicket;
    if (t == null) return const SizedBox.shrink();
    final base = _basePrice;
    final rows = <Widget>[
      const SectionLabel('Order summary'),
      const SizedBox(height: 12),
    ];
    if (base <= 0) {
      rows.add(_SummaryRow('Total', 'Free', bold: true));
    } else {
      final total = (base - _promoDiscount).clamp(0, double.infinity);
      rows.add(_SummaryRow(t.name, '${t.currency} $base'));
      if (_promoApplied && _promoDiscount > 0) {
        rows.add(const SizedBox(height: 9));
        rows.add(_SummaryRow(
            'Discount', '- ${t.currency} $_promoDiscount',
            color: AppColors.success));
      }
      rows.add(const SizedBox(height: 12));
      rows.add(const Divider(color: AppColors.border, height: 1));
      rows.add(const SizedBox(height: 12));
      rows.add(_SummaryRow('Total', '${t.currency} $total', bold: true));
    }
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFBFAF6),
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: rows),
    );
  }

  Widget _errorBox(String message) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.danger.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.danger.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline, color: AppColors.danger, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(message,
                style: AppText.bodySm.copyWith(color: AppColors.danger)),
          ),
        ],
      ),
    );
  }
}

/// A form-integrated text field styled like [MInput] (which wraps a bare
/// TextField). Used where we need [TextFormField] validation inside the Form.
class _MFormField extends StatelessWidget {
  final String label;
  final TextEditingController? controller;
  final String? initialValue;
  final TextInputType? keyboardType;
  final TextCapitalization textCapitalization;
  final int maxLines;
  final String? Function(String?)? validator;
  final ValueChanged<String>? onChanged;
  const _MFormField({
    required this.label,
    this.controller,
    this.initialValue,
    this.keyboardType,
    this.textCapitalization = TextCapitalization.none,
    this.maxLines = 1,
    this.validator,
    this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppText.label),
        const SizedBox(height: 7),
        TextFormField(
          controller: controller,
          initialValue: controller == null ? initialValue : null,
          keyboardType: keyboardType,
          textCapitalization: textCapitalization,
          maxLines: maxLines,
          validator: validator,
          onChanged: onChanged,
          style: AppText.body.copyWith(color: AppColors.ink, height: 1.3),
          decoration: InputDecoration(
            isDense: true,
            filled: true,
            fillColor: AppColors.surface,
            contentPadding: EdgeInsets.symmetric(
                horizontal: 15, vertical: maxLines > 1 ? 13 : 15),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppRadius.input),
              borderSide: const BorderSide(color: AppColors.border),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppRadius.input),
              borderSide: const BorderSide(color: AppColors.forest, width: 1.5),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppRadius.input),
              borderSide: const BorderSide(color: AppColors.danger),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppRadius.input),
              borderSide: const BorderSide(color: AppColors.danger, width: 1.5),
            ),
            errorStyle:
                AppText.caption.copyWith(color: AppColors.danger, fontSize: 12),
          ),
        ),
      ],
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
    final labelStyle = bold
        ? AppText.h3.copyWith(fontSize: 15)
        : AppText.bodySm.copyWith(
            color: color ?? AppColors.inkSoft, fontWeight: FontWeight.w500);
    final valueStyle = bold
        ? AppText.numMd.copyWith(
            fontSize: 20, fontWeight: FontWeight.w500, color: AppColors.forest)
        : AppText.numSm.copyWith(color: color ?? AppColors.ink);
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Flexible(child: Text(label, style: labelStyle)),
        Text(value, style: valueStyle),
      ],
    );
  }
}

/// A dashed-border container for the promo field (screen 8).
class _DottedBorder extends StatelessWidget {
  final Widget child;
  const _DottedBorder({required this.child});
  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _DashPainter(),
      child: Container(
        constraints: const BoxConstraints(minHeight: 50),
        decoration: BoxDecoration(
          color: const Color(0xFFFBFAF6),
          borderRadius: BorderRadius.circular(AppRadius.input),
        ),
        alignment: Alignment.center,
        child: child,
      ),
    );
  }
}

class _DashPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppColors.borderStrong
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;
    final rrect = RRect.fromRectAndRadius(
        Offset.zero & size, const Radius.circular(AppRadius.input));
    final path = Path()..addRRect(rrect);
    const dash = 5.0, gap = 4.0;
    for (final metric in path.computeMetrics()) {
      double d = 0;
      while (d < metric.length) {
        canvas.drawPath(
            metric.extractPath(d, d + dash), paint);
        d += dash + gap;
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
