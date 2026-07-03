import 'package:flutter/material.dart';

import '../../net.dart';
import '../../ui/components.dart';
import '../../ui/tokens.dart';

/// Join an event's waitlist when tickets are sold out.
///
/// Mirrors the web `/e/[slug]/waitlist` → POST `/api/events/[id]/waitlist`
/// `{name, email}` which upserts a `waitlist_entries` row and returns the
/// attendee's `{position}` in line.
class WaitlistScreen extends StatefulWidget {
  final String slug;
  final String eventName;
  final String? prefillName;
  final String? prefillEmail;

  const WaitlistScreen({
    super.key,
    required this.slug,
    required this.eventName,
    this.prefillName,
    this.prefillEmail,
  });

  @override
  State<WaitlistScreen> createState() => _WaitlistScreenState();
}

class _WaitlistScreenState extends State<WaitlistScreen> {
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();

  bool _submitting = false;
  String? _error;
  int? _position; // set on success
  bool _joined = false;

  @override
  void initState() {
    super.initState();
    _nameCtrl.text = widget.prefillName ?? '';
    _emailCtrl.text = widget.prefillEmail ?? (currentUserEmail ?? '');
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final name = _nameCtrl.text.trim();
    final email = _emailCtrl.text.trim().toLowerCase();
    if (name.isEmpty) {
      setState(() => _error = 'Please enter your name.');
      return;
    }
    if (!email.contains('@') || !email.contains('.')) {
      setState(() => _error = 'Enter a valid email.');
      return;
    }
    FocusScope.of(context).unfocus();
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      final res = await apiPost(
        '/api/events/${widget.slug}/waitlist',
        {'name': name, 'email': email},
      );
      final map = res is Map ? Map<String, dynamic>.from(res) : {};
      if (!mounted) return;
      setState(() {
        _position = map['position'] == null ? null : asInt(map['position']);
        _joined = true;
        _submitting = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _submitting = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = 'Something went wrong. Please try again.';
        _submitting = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: const MAppBar(title: 'Waitlist', hairline: true),
      bottomBar: _joined
          ? null
          : StickyCta(
              children: [
                Expanded(
                  child: MButton(
                    'Join the waitlist',
                    kind: MBtnKind.forest,
                    loading: _submitting,
                    onTap: _submitting ? null : _submit,
                  ),
                ),
              ],
            ),
      body: _joined ? _success() : _form(),
    );
  }

  Widget _form() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(
          AppSpace.lg, AppSpace.base, AppSpace.lg, AppSpace.base),
      children: [
        Text(widget.eventName, style: AppText.h2),
        const SizedBox(height: 8),
        Text(
          'This event is sold out. Join the waitlist and we\'ll email you if a '
          'spot opens up.',
          style: AppText.body.copyWith(color: AppColors.inkSoft, height: 1.5),
        ),
        const SizedBox(height: 24),
        MInput(
          label: 'Full name',
          hint: 'Your name',
          controller: _nameCtrl,
        ),
        const SizedBox(height: 16),
        MInput(
          label: 'Email',
          hint: 'you@email.com',
          controller: _emailCtrl,
          keyboardType: TextInputType.emailAddress,
        ),
        if (_error != null) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.danger.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(10),
              border:
                  Border.all(color: AppColors.danger.withValues(alpha: 0.3)),
            ),
            child: Row(
              children: [
                const Icon(Icons.error_outline,
                    color: AppColors.danger, size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(_error!,
                      style: AppText.bodySm.copyWith(color: AppColors.danger)),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }

  Widget _success() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 76,
              height: 76,
              decoration: BoxDecoration(
                color: AppColors.forestSoft,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.how_to_reg_outlined,
                  color: AppColors.forest, size: 38),
            ),
            const SizedBox(height: 20),
            Text('You\'re on the list',
                style: AppText.h2, textAlign: TextAlign.center),
            const SizedBox(height: 10),
            Text(
              _position != null
                  ? 'You\'re number $_position in line for ${widget.eventName}. '
                      'We\'ll email you the moment a spot opens.'
                  : 'You\'ve joined the waitlist for ${widget.eventName}. '
                      'We\'ll email you if a spot opens.',
              style: AppText.body
                  .copyWith(color: AppColors.inkSoft, height: 1.5),
              textAlign: TextAlign.center,
            ),
            if (_position != null) ...[
              const SizedBox(height: 22),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(AppRadius.card),
                  border: Border.all(color: AppColors.border),
                  boxShadow: AppShadow.soft,
                ),
                child: Column(
                  children: [
                    Text('#$_position',
                        style: AppText.numLg.copyWith(color: AppColors.forest)),
                    const SizedBox(height: 2),
                    Text('your place in line',
                        style: AppText.caption
                            .copyWith(color: AppColors.inkMuted)),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 28),
            MButton(
              'Done',
              kind: MBtnKind.forest,
              fullWidth: false,
              onTap: () => Navigator.of(context).maybePop(),
            ),
          ],
        ),
      ),
    );
  }
}
