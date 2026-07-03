import 'package:flutter/material.dart';

import '../../app_config.dart';
import '../../ics_export.dart';
import '../../net.dart';
import '../../ui/components.dart';
import '../../ui/tokens.dart';
import '../register/waafipay_payment_screen.dart';
import 'fullscreen_qr_screen.dart';
import 'ticket_stub.dart';

/// A single ticket rendered as a tear-off stub: cover header, perforated tear,
/// framed QR (locked when payment pending, stamped when checked-in), ticket
/// code, and an info grid. Tap the QR for fullscreen scan mode.
class TicketDetailScreen extends StatefulWidget {
  final String registrationId;
  final String qrToken;
  final String eventName;
  final String? eventSlug;
  final String? coverUrl;
  final String? ticketType;
  final String? attendeeName;
  final String? status;
  final String? venue;
  final DateTime? startsAt;
  final double? amount;
  final String? currency;

  const TicketDetailScreen({
    super.key,
    required this.registrationId,
    required this.qrToken,
    required this.eventName,
    this.eventSlug,
    this.coverUrl,
    this.ticketType,
    this.attendeeName,
    this.status,
    this.venue,
    this.startsAt,
    this.amount,
    this.currency,
  });

  @override
  State<TicketDetailScreen> createState() => _TicketDetailScreenState();
}

class _TicketDetailScreenState extends State<TicketDetailScreen> {
  late String _status = widget.status ?? 'confirmed';
  bool _transferred = false;

  TicketStatus get _ts => ticketStatusFrom(_status);

  String get _qrData {
    final slug = widget.eventSlug;
    if (slug != null && slug.isNotEmpty) {
      return '${AppConfig.renderBaseUrl}/e/$slug/check-in?token=${widget.qrToken}';
    }
    return widget.qrToken;
  }

  String get _ticketCode {
    final t = widget.qrToken.replaceAll(RegExp(r'[^A-Za-z0-9]'), '').toUpperCase();
    if (t.isEmpty) return 'TKT';
    final a = t.length >= 4 ? t.substring(0, 4) : t;
    final b = t.length >= 8 ? t.substring(4, 8) : '';
    return b.isEmpty ? 'TKT-$a' : 'TKT-$a-$b';
  }

  String get _amountLabel {
    final a = widget.amount ?? 0;
    final s = a == a.roundToDouble() ? a.toStringAsFixed(0) : a.toStringAsFixed(2);
    return '${widget.currency ?? ''} $s'.trim();
  }

  Future<void> _addToCalendar() async {
    try {
      await exportEventToCalendar(
        title: widget.eventName,
        start: widget.startsAt,
        location: widget.venue,
        description:
            widget.ticketType == null ? null : 'Ticket: ${widget.ticketType}',
      );
    } catch (_) {
      if (mounted) showToast(context, 'Could not export to calendar.');
    }
  }

  void _openFullscreen() {
    if (widget.qrToken.isEmpty || _ts == TicketStatus.pending) return;
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => FullscreenQrScreen(
        qrData: _qrData,
        ticketCode: _ticketCode,
        attendee: widget.attendeeName ?? '',
        typeLabel: widget.ticketType ?? '',
      ),
    ));
  }

  Future<void> _pay() async {
    final paid = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => WaafiPayPaymentScreen(
          registrationId: widget.registrationId,
          amount: widget.amount ?? 0,
          currency: widget.currency ?? 'USD',
          ticketName: widget.ticketType ?? 'Ticket',
          eventName: widget.eventName,
        ),
      ),
    );
    if (paid == true && mounted) {
      setState(() => _status = 'confirmed');
      showToast(context, 'Payment confirmed — your ticket is live.');
    }
  }

  Future<void> _openTransfer() async {
    final ok = await showMSheet<bool>(
      context,
      _TransferSheet(registrationId: widget.registrationId),
    );
    if (ok == true && mounted) {
      setState(() => _transferred = true);
      showToast(context, 'Transfer request sent.');
    }
  }

  void _openReceipt() {
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => _ReceiptScreen(
        eventName: widget.eventName,
        ticketType: widget.ticketType ?? 'Ticket',
        attendee: widget.attendeeName ?? '',
        amountLabel: (widget.amount != null && widget.amount! > 0)
            ? _amountLabel
            : 'Free',
        date: widget.startsAt,
        orderRef: _ticketCode,
      ),
    ));
  }

  void _openActions() {
    final canTransfer = (_status == 'confirmed' || _status == 'pending_approval') &&
        !_transferred;
    showMSheet(
      context,
      Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Ticket actions', style: AppText.h3),
          const SizedBox(height: 8),
          _action(Icons.calendar_today_outlined, 'Add to calendar', () {
            Navigator.pop(context);
            _addToCalendar();
          }),
          if (canTransfer)
            _action(Icons.send_outlined, 'Transfer ticket', () {
              Navigator.pop(context);
              _openTransfer();
            }),
          _action(Icons.receipt_long_outlined, 'View receipt', () {
            Navigator.pop(context);
            _openReceipt();
          }),
        ],
      ),
    );
  }

  Widget _action(IconData icon, String label, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 14),
        child: Row(
          children: [
            Icon(icon, size: 21, color: AppColors.forest),
            const SizedBox(width: 14),
            Text(label, style: AppText.bodyStrong),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final info = <(String, String)>[
      if (widget.attendeeName != null && widget.attendeeName!.isNotEmpty)
        ('Attendee', widget.attendeeName!),
      if (widget.ticketType != null && widget.ticketType!.isNotEmpty)
        ('Type', widget.ticketType!),
      if (widget.startsAt != null) ('When', _formatDate(widget.startsAt!)),
      if (_ts == TicketStatus.pending && (widget.amount ?? 0) > 0)
        ('Amount due', _amountLabel)
      else if (widget.venue != null && widget.venue!.isNotEmpty)
        ('Where', widget.venue!),
    ];

    return MScaffold(
      appBar: MAppBar(
        title: 'Ticket',
        hairline: true,
        actions: [
          AppBarAction(Icons.more_horiz, onTap: _openActions),
          const SizedBox(width: 6),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(
            AppSpace.lg, AppSpace.base, AppSpace.lg, AppSpace.xxl),
        children: [
          TicketStub(
            eventTitle: widget.eventName,
            coverUrl: widget.coverUrl,
            subtitle: widget.venue ?? '',
            status: _ts,
            qr: (widget.qrToken.isNotEmpty)
                ? QrBlock(data: _qrData, size: 168)
                : const SizedBox(width: 168, height: 168),
            ticketCode: _ticketCode,
            info: info,
            bg: AppColors.canvas,
            onQrTap: _openFullscreen,
          ),
          const SizedBox(height: 18),

          if (_ts == TicketStatus.pending) ...[
            Container(
              padding: const EdgeInsets.all(13),
              decoration: BoxDecoration(
                color: AppColors.warning.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(AppRadius.input),
                border: Border.all(color: AppColors.warning.withValues(alpha: 0.3)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.timer_outlined,
                      size: 18, color: AppColors.warning),
                  const SizedBox(width: 9),
                  Expanded(
                    child: Text(
                      'Reserved for 24h. Pay to unlock your QR and confirm your seat.',
                      style: AppText.bodySm.copyWith(color: AppColors.warning),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            MButton(
              (widget.amount ?? 0) > 0 ? 'Pay $_amountLabel now' : 'Complete payment',
              kind: MBtnKind.forest,
              icon: Icons.lock_open_outlined,
              onTap: _pay,
            ),
          ] else ...[
            Row(
              children: [
                Expanded(
                  child: MButton('Add to calendar',
                      kind: MBtnKind.sec,
                      icon: Icons.calendar_today_outlined,
                      onTap: _addToCalendar),
                ),
                if ((_status == 'confirmed') && !_transferred) ...[
                  const SizedBox(width: 10),
                  Expanded(
                    child: MButton('Transfer',
                        kind: MBtnKind.sec,
                        icon: Icons.send_outlined,
                        onTap: _openTransfer),
                  ),
                ],
              ],
            ),
          ],

          if (_transferred) ...[
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.success.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text('A transfer request is pending for this ticket.',
                  style: AppText.bodySm.copyWith(color: AppColors.success)),
            ),
          ],
        ],
      ),
    );
  }

  static String _formatDate(DateTime d) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    final l = d.toLocal();
    final h = l.hour % 12 == 0 ? 12 : l.hour % 12;
    final m = l.minute.toString().padLeft(2, '0');
    final ap = l.hour < 12 ? 'AM' : 'PM';
    return '${months[l.month - 1]} ${l.day}, ${l.year} · $h:$m $ap';
  }
}

// ─────────────────────────────────────────── Receipt

class _ReceiptScreen extends StatelessWidget {
  final String eventName;
  final String ticketType;
  final String attendee;
  final String amountLabel;
  final DateTime? date;
  final String orderRef;
  const _ReceiptScreen({
    required this.eventName,
    required this.ticketType,
    required this.attendee,
    required this.amountLabel,
    required this.date,
    required this.orderRef,
  });

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: const MAppBar(title: 'Receipt', hairline: true),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(
            AppSpace.lg, AppSpace.lg, AppSpace.lg, AppSpace.xxl),
        children: [
          Center(
            child: Container(
              width: 60,
              height: 60,
              decoration: const BoxDecoration(
                  color: AppColors.forestSoft, shape: BoxShape.circle),
              child: const Icon(Icons.check_rounded,
                  color: AppColors.forest, size: 30),
            ),
          ),
          const SizedBox(height: 14),
          Center(
              child: Text('Order confirmed',
                  style: AppText.h2, textAlign: TextAlign.center)),
          const SizedBox(height: 4),
          Center(
              child: Text('Order $orderRef',
                  style: AppText.numSm.copyWith(color: AppColors.inkMuted))),
          const SizedBox(height: 22),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(AppRadius.card),
              border: Border.all(color: AppColors.border),
              boxShadow: AppShadow.soft,
            ),
            child: Column(
              children: [
                _row('Event', eventName),
                _div(),
                _row('Ticket', ticketType),
                _div(),
                _row('Attendee', attendee),
                if (date != null) ...[_div(), _row('Date', _fmt(date!))],
                _div(),
                _row('Total', amountLabel, bold: true),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _div() => const Divider(height: 20, color: AppColors.border);

  Widget _row(String k, String v, {bool bold = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(k, style: AppText.bodySm.copyWith(color: AppColors.inkMuted)),
        Flexible(
          child: Text(v,
              textAlign: TextAlign.right,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: bold
                  ? AppText.h3.copyWith(fontSize: 16, color: AppColors.forest)
                  : AppText.bodyStrong),
        ),
      ],
    );
  }

  static String _fmt(DateTime d) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    final l = d.toLocal();
    return '${months[l.month - 1]} ${l.day}, ${l.year}';
  }
}

// ─────────────────────────────────────────── Transfer sheet

class _TransferSheet extends StatefulWidget {
  final String registrationId;
  const _TransferSheet({required this.registrationId});

  @override
  State<_TransferSheet> createState() => _TransferSheetState();
}

class _TransferSheetState extends State<_TransferSheet> {
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final name = _nameCtrl.text.trim();
    final email = _emailCtrl.text.trim().toLowerCase();
    if (name.isEmpty || !email.contains('@') || !email.contains('.')) {
      setState(() => _error = 'Enter the recipient’s name and a valid email.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await apiPost('/api/tickets/${widget.registrationId}/transfer', {
        'recipientEmail': email,
        'recipientName': name,
      });
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _error = e.message);
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = 'Could not send the transfer. Please try again.');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text('Transfer this ticket', style: AppText.h3),
        const SizedBox(height: 6),
        Text(
          'We\'ll email the recipient. Transfers are irreversible once accepted.',
          style: AppText.bodySm,
        ),
        const SizedBox(height: 16),
        MInput(label: 'Recipient name', controller: _nameCtrl),
        const SizedBox(height: 12),
        MInput(
          label: 'Recipient email',
          controller: _emailCtrl,
          keyboardType: TextInputType.emailAddress,
        ),
        if (_error != null) ...[
          const SizedBox(height: 12),
          Text(_error!, style: AppText.bodySm.copyWith(color: AppColors.danger)),
        ],
        const SizedBox(height: 16),
        MButton('Send transfer',
            kind: MBtnKind.forest, loading: _busy, onTap: _busy ? null : _submit),
      ],
    );
  }
}
