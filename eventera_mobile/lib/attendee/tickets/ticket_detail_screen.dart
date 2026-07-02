import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../app_config.dart';
import '../../net.dart';
import '../../theme.dart';

/// Displays a single ticket: event info, the QR (check-in URL), and a
/// "Transfer ticket" action that posts to /api/tickets/[id]/transfer.
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

  Future<void> _openTransferSheet() async {
    final ok = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Brand.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => _TransferSheet(registrationId: widget.registrationId),
    );
    if (ok == true && mounted) {
      setState(() => _transferred = true);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Transfer request sent.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final canTransfer = (widget.status == 'confirmed' ||
            widget.status == 'pending_approval') &&
        !_transferred;

    return Scaffold(
      backgroundColor: Brand.cream,
      appBar: AppBar(
        backgroundColor: Brand.cream,
        elevation: 0,
        foregroundColor: Brand.ink,
        title: const Text('Ticket'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
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
              if (widget.startsAt != null) ...[
                const SizedBox(height: 6),
                Row(
                  children: [
                    const Icon(Icons.calendar_today_outlined,
                        size: 15, color: Brand.muted),
                    const SizedBox(width: 6),
                    Text(
                      _formatDate(widget.startsAt!),
                      style: const TextStyle(fontSize: 14, color: Brand.muted),
                    ),
                  ],
                ),
              ],
              if (widget.venue != null && widget.venue!.isNotEmpty) ...[
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.place_outlined,
                        size: 15, color: Brand.muted),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        widget.venue!,
                        style:
                            const TextStyle(fontSize: 14, color: Brand.muted),
                      ),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Brand.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Brand.border),
                ),
                child: Column(
                  children: [
                    if (widget.qrToken.isNotEmpty)
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Brand.border),
                        ),
                        child: QrImageView(
                          data: _qrData,
                          size: 200,
                          backgroundColor: Colors.white,
                        ),
                      )
                    else
                      const Padding(
                        padding: EdgeInsets.all(24),
                        child: Text(
                          'QR code not available for this ticket yet.',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: Brand.muted),
                        ),
                      ),
                    const SizedBox(height: 16),
                    if (widget.attendeeName != null &&
                        widget.attendeeName!.isNotEmpty)
                      Text(
                        widget.attendeeName!,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: Brand.ink,
                        ),
                      ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      alignment: WrapAlignment.center,
                      children: [
                        if (widget.ticketType != null &&
                            widget.ticketType!.isNotEmpty)
                          _chip(widget.ticketType!, Brand.forest),
                        if (widget.status != null)
                          _chip(_statusLabel(widget.status!),
                              _statusColor(widget.status!)),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              if (canTransfer)
                OutlinedButton.icon(
                  onPressed: _openTransferSheet,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Brand.forest,
                    side: const BorderSide(color: Brand.border),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  icon: const Icon(Icons.send_outlined, size: 18),
                  label: const Text('Transfer ticket'),
                ),
              if (_transferred)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Brand.success.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Text(
                    'A transfer request is pending for this ticket.',
                    style: TextStyle(color: Brand.success, fontSize: 13),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _chip(String text, Color color) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(999),
        ),
        child: Text(
          text,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: color,
          ),
        ),
      );

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

  static Color _statusColor(String s) {
    switch (s) {
      case 'confirmed':
      case 'checked_in':
        return Brand.success;
      case 'pending':
      case 'pending_approval':
        return Brand.gold;
      default:
        return Brand.muted;
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
      if (mounted) Navigator.of(context).pop(true);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = 'Could not send the transfer. Please try again.');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 20, 20, 20 + bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'Transfer this ticket',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: Brand.ink,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'We’ll email the recipient. They accept the ticket on the web.',
            style: TextStyle(fontSize: 13, color: Brand.muted),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _nameCtrl,
            textCapitalization: TextCapitalization.words,
            enabled: !_busy,
            decoration: const InputDecoration(labelText: 'Recipient name'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _emailCtrl,
            keyboardType: TextInputType.emailAddress,
            enabled: !_busy,
            decoration: const InputDecoration(labelText: 'Recipient email'),
          ),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(
              _error!,
              style: const TextStyle(color: Brand.danger, fontSize: 13),
            ),
          ],
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _busy ? null : _submit,
            child: _busy
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation(Colors.white),
                    ),
                  )
                : const Text('Send transfer'),
          ),
        ],
      ),
    );
  }
}
