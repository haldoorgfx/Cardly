import 'package:flutter/material.dart';

import '../../app_config.dart';
import '../../net.dart';
import '../../ui/components.dart';
import '../../ui/tokens.dart';

/// Displays a single ticket: framed QR (check-in URL), status, Event / Attendee
/// / When rows, and Calendar + Transfer actions (transfer posts to
/// /api/tickets/[id]/transfer). Screen 13.
class TicketDetailScreen extends StatefulWidget {
  final String registrationId;
  final String qrToken;
  final String eventName;
  final String? eventSlug;
  final String? ticketType;
  final String? attendeeName;
  final String? status;
  final String? venue;
  final DateTime? startsAt;

  const TicketDetailScreen({
    super.key,
    required this.registrationId,
    required this.qrToken,
    required this.eventName,
    this.eventSlug,
    this.ticketType,
    this.attendeeName,
    this.status,
    this.venue,
    this.startsAt,
  });

  @override
  State<TicketDetailScreen> createState() => _TicketDetailScreenState();
}

class _TicketDetailScreenState extends State<TicketDetailScreen> {
  bool _transferred = false;

  String get _qrData {
    final slug = widget.eventSlug;
    if (slug != null && slug.isNotEmpty) {
      return '${AppConfig.renderBaseUrl}/e/$slug/check-in?token=${widget.qrToken}';
    }
    return widget.qrToken;
  }

  String get _ticketId {
    final t =
        widget.qrToken.replaceAll(RegExp(r'[^A-Za-z0-9]'), '').toUpperCase();
    if (t.isEmpty) return 'TKT';
    final a = t.length >= 4 ? t.substring(0, 4) : t;
    final b = t.length >= 8 ? t.substring(4, 8) : '';
    return b.isEmpty ? 'TKT-$a' : 'TKT-$a-$b';
  }

  Future<void> _openTransferSheet() async {
    final ok = await showMSheet<bool>(
      context,
      _TransferSheet(registrationId: widget.registrationId),
    );
    if (ok == true && mounted) {
      setState(() => _transferred = true);
      showToast(context, 'Transfer request sent.');
    }
  }

  @override
  Widget build(BuildContext context) {
    final canTransfer = (widget.status == 'confirmed' ||
            widget.status == 'pending_approval') &&
        !_transferred;

    return MScaffold(
      appBar: const MAppBar(title: 'Ticket', hairline: true),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(
            AppSpace.lg, AppSpace.base, AppSpace.lg, AppSpace.base),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Framed QR card.
            Container(
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: AppColors.border),
                boxShadow: AppShadow.soft,
              ),
              child: Column(
                children: [
                  if (widget.status != null) ...[
                    Tag(_statusLabel(widget.status!),
                        kind: _statusKind(widget.status!), dot: true),
                    const SizedBox(height: 16),
                  ],
                  if (widget.qrToken.isNotEmpty)
                    QrBlock(data: _qrData, size: 200)
                  else
                    const Padding(
                      padding: EdgeInsets.all(24),
                      child: Text(
                        'QR code not available for this ticket yet.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: AppColors.inkMuted),
                      ),
                    ),
                  if (widget.qrToken.isNotEmpty) ...[
                    const SizedBox(height: 14),
                    Text(_ticketId,
                        style: AppText.numSm.copyWith(
                            color: AppColors.inkMuted,
                            fontSize: 11,
                            letterSpacing: 1.2)),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 18),

            // Info rows.
            _InfoRow(label: 'Event', value: widget.eventName),
            if (widget.attendeeName != null &&
                widget.attendeeName!.isNotEmpty)
              _InfoRow(
                label: 'Attendee',
                value: widget.ticketType != null &&
                        widget.ticketType!.isNotEmpty
                    ? '${widget.attendeeName} · ${widget.ticketType}'
                    : widget.attendeeName!,
              ),
            if (widget.startsAt != null)
              _InfoRow(
                  label: 'When',
                  value: _formatDate(widget.startsAt!),
                  mono: true),
            if (widget.venue != null && widget.venue!.isNotEmpty)
              _InfoRow(label: 'Where', value: widget.venue!),
            const SizedBox(height: 12),

            // Actions.
            Row(
              children: [
                Expanded(
                  child: MButton(
                    'Calendar',
                    kind: MBtnKind.sec,
                    small: true,
                    icon: Icons.calendar_today_outlined,
                    onTap: () =>
                        showToast(context, 'Calendar export coming soon.'),
                  ),
                ),
                if (canTransfer) ...[
                  const SizedBox(width: 10),
                  Expanded(
                    child: MButton(
                      'Transfer',
                      kind: MBtnKind.sec,
                      small: true,
                      icon: Icons.send_outlined,
                      onTap: _openTransferSheet,
                    ),
                  ),
                ],
              ],
            ),
            if (_transferred) ...[
              const SizedBox(height: 14),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.success.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  'A transfer request is pending for this ticket.',
                  style: AppText.bodySm.copyWith(color: AppColors.success),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  static String _statusLabel(String s) {
    switch (s) {
      case 'confirmed':
        return 'Confirmed';
      case 'checked_in':
        return 'Checked in';
      case 'pending':
        return 'Payment pending';
      case 'pending_approval':
        return 'Awaiting approval';
      default:
        return s;
    }
  }

  static TagKind _statusKind(String s) {
    switch (s) {
      case 'confirmed':
        return TagKind.success;
      case 'checked_in':
        return TagKind.forest;
      case 'pending':
      case 'pending_approval':
        return TagKind.warning;
      default:
        return TagKind.info;
    }
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

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  final bool mono;
  const _InfoRow(
      {required this.label, required this.value, this.mono = false});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: AppColors.border)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SectionLabel(label),
          const SizedBox(height: 3),
          Text(value,
              style: mono
                  ? AppText.bodyStrong.copyWith(fontSize: 14)
                  : AppText.h3.copyWith(fontSize: 15)),
        ],
      ),
    );
  }
}

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
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpace.lg),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Transfer this ticket', style: AppText.h3),
          const SizedBox(height: 6),
          Text(
            'We’ll email the recipient. They accept the ticket on the web.',
            style: AppText.bodySm,
          ),
          const SizedBox(height: 16),
          MInput(
            label: 'Recipient name',
            controller: _nameCtrl,
          ),
          const SizedBox(height: 12),
          MInput(
            label: 'Recipient email',
            controller: _emailCtrl,
            keyboardType: TextInputType.emailAddress,
          ),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!,
                style: AppText.bodySm.copyWith(color: AppColors.danger)),
          ],
          const SizedBox(height: 16),
          MButton(
            'Send transfer',
            kind: MBtnKind.forest,
            loading: _busy,
            onTap: _busy ? null : _submit,
          ),
        ],
      ),
    );
  }
}
