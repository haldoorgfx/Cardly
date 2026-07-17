import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../net.dart';
import '../../ui/components.dart';
import '../../ui/tokens.dart';

/// Organizer communications (web parity: /events/[id]/communications).
/// Compose a custom email blast to every confirmed/checked-in attendee.
/// Posts to the existing /api/events/[id]/communicate route — the same
/// Resend-backed sender web uses, now reachable from mobile because that
/// route accepts a Bearer-token session as a fallback when there's no
/// Next.js cookie (mobile has no cookie session; apiPost already attaches
/// the Supabase JWT as Authorization: Bearer — see lib/net.dart).
///
/// Skips web's ERA-drafted campaign assist (a separate Studio-gated AI
/// feature) and the placeholder open/click-rate stats (no real data behind
/// them yet on either platform) — this covers the actual parity gap: mobile
/// organizers had no way to email their attendees at all.
class CommunicationsScreen extends StatefulWidget {
  final String eventId;
  final String eventName;

  const CommunicationsScreen({
    super.key,
    required this.eventId,
    required this.eventName,
  });

  @override
  State<CommunicationsScreen> createState() => _CommunicationsScreenState();
}

class _CommunicationsScreenState extends State<CommunicationsScreen> {
  bool _loading = true;
  String? _error;
  StatusReason _errorReason = StatusReason.generic;
  int _registrantCount = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final count = await supa
          .from('registrations')
          .select('id')
          .eq('event_id', widget.eventId)
          .inFilter('status', ['confirmed', 'checked_in'])
          .count(CountOption.exact);
      if (!mounted) return;
      setState(() {
        _registrantCount = count.count;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      final msg = describeError(e, context: 'your attendee count');
      setState(() {
        _error = msg;
        _errorReason = msg.toLowerCase().contains("couldn't reach the server")
            ? StatusReason.network
            : StatusReason.generic;
        _loading = false;
      });
    }
  }

  Future<void> _compose() async {
    if (_registrantCount == 0) return;
    HapticFeedback.selectionClick();
    final sent = await showMSheet<int>(
      context,
      _ComposeSheet(
        eventId: widget.eventId,
        eventName: widget.eventName,
        registrantCount: _registrantCount,
      ),
    );
    if (sent != null && mounted) {
      showToast(context, 'Sent to $sent ${sent == 1 ? 'attendee' : 'attendees'} ✓');
    }
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: const MAppBar(title: 'Communications', hairline: true),
      body: _body(),
      bottomBar: (!_loading && _error == null)
          ? StickyCta(children: [
              Expanded(
                child: MButton('New email',
                    icon: Icons.mail_outline,
                    onTap: _registrantCount == 0 ? null : _compose),
              ),
            ])
          : null,
    );
  }

  Widget _body() {
    if (_loading) return const LoadingState();
    if (_error != null) {
      return ErrorStateView(
          message: _error!, onRetry: _load, reason: _errorReason);
    }

    return RefreshIndicator(
      color: AppColors.forest,
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(
            AppSpace.lg, AppSpace.base, AppSpace.lg, AppSpace.xxxl),
        children: [
          Text('Email your attendees and send updates.', style: AppText.bodySm),
          const SizedBox(height: AppSpace.lg),
          Container(
            padding: const EdgeInsets.all(AppSpace.base),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(AppRadius.card),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: AppColors.forestSoft,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.groups_outlined, size: 19, color: AppColors.forest),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(_registrantCount > 0 ? '$_registrantCount' : '—',
                          style: AppText.h1.copyWith(fontSize: 22)),
                      Text('Confirmed attendees', style: AppText.bodySm.copyWith(color: AppColors.inkMuted)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpace.lg),
          if (_registrantCount == 0)
            Container(
              padding: const EdgeInsets.all(AppSpace.base),
              decoration: BoxDecoration(
                color: AppColors.canvas,
                borderRadius: BorderRadius.circular(AppRadius.card),
                border: Border.all(color: AppColors.border),
              ),
              child: Text(
                'No registrants yet. You\'ll be able to email attendees once people register.',
                style: AppText.bodySm.copyWith(color: AppColors.inkMuted),
              ),
            ),
          const SizedBox(height: AppSpace.base),
          Container(
            padding: const EdgeInsets.all(AppSpace.base),
            decoration: BoxDecoration(
              color: AppColors.forestSoft,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.forest.withValues(alpha: 0.16)),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.check_circle_outline, size: 16, color: AppColors.forest),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Confirmation and reminder emails are sent automatically. '
                    'Use New email to send a custom update to all confirmed attendees.',
                    style: AppText.bodySm,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Compose sheet — subject + message, sent to every confirmed attendee.
class _ComposeSheet extends StatefulWidget {
  final String eventId;
  final String eventName;
  final int registrantCount;
  const _ComposeSheet({
    required this.eventId,
    required this.eventName,
    required this.registrantCount,
  });

  @override
  State<_ComposeSheet> createState() => _ComposeSheetState();
}

class _ComposeSheetState extends State<_ComposeSheet> {
  final _subject = TextEditingController();
  final _message = TextEditingController();
  bool _sending = false;
  bool _sent = false;
  int _sentCount = 0;
  String? _error;

  @override
  void dispose() {
    _subject.dispose();
    _message.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final subject = _subject.text.trim();
    final message = _message.text.trim();
    if (subject.isEmpty) {
      setState(() => _error = 'Subject is required.');
      return;
    }
    if (message.isEmpty) {
      setState(() => _error = 'Message body is required.');
      return;
    }
    setState(() {
      _sending = true;
      _error = null;
    });
    try {
      final res = await apiPost('/api/events/${widget.eventId}/communicate', {
        'subject': subject,
        'message': message,
      });
      final sent = res is Map ? asInt(res['sent']) : widget.registrantCount;
      if (mounted) {
        setState(() {
          _sent = true;
          _sentCount = sent;
          _sending = false;
        });
      }
    } on ApiException catch (e) {
      if (mounted) setState(() { _sending = false; _error = e.message; });
    } catch (e) {
      if (mounted) {
        setState(() {
          _sending = false;
          _error = describeError(e, context: 'that email');
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_sent) {
      return Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 56,
            height: 56,
            alignment: Alignment.center,
            decoration: const BoxDecoration(color: AppColors.forestSoft, shape: BoxShape.circle),
            child: const Icon(Icons.check_rounded, size: 26, color: AppColors.forest),
          ),
          const SizedBox(height: 16),
          Text('Email sent!', style: AppText.h3),
          const SizedBox(height: 6),
          Text(
            'Your message was delivered to $_sentCount ${_sentCount == 1 ? 'attendee' : 'attendees'}.',
            style: AppText.bodySm.copyWith(color: AppColors.inkMuted),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 18),
          MButton('Done', onTap: () => Navigator.of(context).pop(_sentCount)),
        ],
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text('New email', style: AppText.h3),
        const SizedBox(height: 4),
        Text('Send to all confirmed attendees of ${widget.eventName}', style: AppText.bodySm),
        const SizedBox(height: 14),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            color: AppColors.canvas,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            children: [
              const Icon(Icons.info_outline, size: 14, color: AppColors.inkMuted),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'To: ${widget.registrantCount} confirmed attendee${widget.registrantCount == 1 ? '' : 's'}',
                  style: AppText.bodySm,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        MInput(label: 'Subject', hint: 'Important update about your registration', controller: _subject),
        const SizedBox(height: 14),
        MInput(
          label: 'Message',
          hint: 'Hi [name],\n\nWe wanted to share an update…',
          controller: _message,
          minLines: 5,
          maxLines: 10,
        ),
        const SizedBox(height: 4),
        Text('Plain text — line breaks are preserved in the email.',
            style: AppText.caption.copyWith(color: AppColors.inkMuted)),
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
        MButton('Send to ${widget.registrantCount}',
            icon: Icons.send_outlined, loading: _sending, onTap: _sending ? null : _send),
        const SizedBox(height: 4),
        MButton('Cancel',
            kind: MBtnKind.text, onTap: _sending ? null : () => Navigator.of(context).pop()),
      ],
    );
  }
}
