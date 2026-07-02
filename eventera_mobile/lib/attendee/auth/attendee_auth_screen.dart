import 'dart:async';

import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../net.dart';
import '../../ui/components.dart';
import '../../ui/tokens.dart';

/// Attendee sign-in via email OTP (magic code) with a "Continue with Google"
/// fallback. Pops with `true` on a successful session.
/// Screens 3 (email) and 3b (OTP).
class AttendeeAuthScreen extends StatefulWidget {
  const AttendeeAuthScreen({super.key});

  @override
  State<AttendeeAuthScreen> createState() => _AttendeeAuthScreenState();
}

enum _Step { email, code }

class _AttendeeAuthScreenState extends State<AttendeeAuthScreen> {
  final _emailCtrl = TextEditingController();
  final _codeCtrl = TextEditingController();

  _Step _step = _Step.email;
  bool _busy = false;
  String? _error;
  String _sentTo = '';

  int _resendIn = 0;
  Timer? _resendTimer;

  @override
  void dispose() {
    _resendTimer?.cancel();
    _emailCtrl.dispose();
    _codeCtrl.dispose();
    super.dispose();
  }

  void _startResendCountdown() {
    _resendTimer?.cancel();
    setState(() => _resendIn = 30);
    _resendTimer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) {
        t.cancel();
        return;
      }
      setState(() {
        _resendIn = _resendIn - 1;
        if (_resendIn <= 0) t.cancel();
      });
    });
  }

  bool _validEmail(String v) {
    final s = v.trim();
    return s.contains('@') && s.contains('.') && s.length > 4;
  }

  Future<void> _sendCode() async {
    final email = _emailCtrl.text.trim().toLowerCase();
    if (!_validEmail(email)) {
      setState(() => _error = 'Enter a valid email address.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await supa.auth.signInWithOtp(email: email, shouldCreateUser: true);
      if (!mounted) return;
      setState(() {
        _sentTo = email;
        _step = _Step.code;
      });
      _startResendCountdown();
    } on AuthException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (_) {
      if (mounted) {
        setState(() => _error = 'Could not send the code. Please try again.');
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _verifyCode() async {
    final code = _codeCtrl.text.trim();
    if (code.length < 6) {
      setState(() => _error = 'Enter the 6-digit code from your email.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await supa.auth.verifyOTP(
        email: _sentTo,
        token: code,
        type: OtpType.email,
      );
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } on AuthException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (_) {
      if (mounted) {
        setState(() => _error = 'That code did not work. Please try again.');
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _google() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await supa.auth.signInWithOAuth(
        OAuthProvider.google,
        redirectTo: kIsWeb ? null : 'eventera://login-callback/',
      );
      // OAuth continues in a browser; the deep link / session listener handles
      // the rest. Nothing more to do synchronously here.
    } catch (_) {
      if (mounted) {
        setState(() => _error = 'Could not start Google sign-in.');
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: const MAppBar(),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(
            AppSpace.lg, AppSpace.sm, AppSpace.lg, AppSpace.xxl),
        child: _step == _Step.email ? _emailStep() : _codeStep(),
      ),
    );
  }

  // ── Screen 3 · brand mark + Google + email ─────────────────────────
  Widget _emailStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 8),
        _BrandMark(),
        const SizedBox(height: 22),
        Text('Welcome to Eventera', style: AppText.h1),
        const SizedBox(height: 8),
        Text(
          'Sign in to hold tickets, make your card, and connect with people '
          'at the event.',
          style: AppText.body,
        ),
        const SizedBox(height: 28),
        MButton(
          'Continue with Google',
          kind: MBtnKind.forest,
          icon: Icons.g_mobiledata_rounded,
          loading: _busy,
          onTap: _busy ? null : _google,
        ),
        const SizedBox(height: 20),
        Row(
          children: [
            const Expanded(child: Divider(color: AppColors.border, height: 1)),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Text('or with email',
                  style: AppText.bodySm.copyWith(color: AppColors.inkMuted)),
            ),
            const Expanded(child: Divider(color: AppColors.border, height: 1)),
          ],
        ),
        const SizedBox(height: 20),
        MInput(
          label: 'Email address',
          hint: 'you@example.com',
          controller: _emailCtrl,
          icon: Icons.mail_outline,
          keyboardType: TextInputType.emailAddress,
          action: TextInputAction.done,
          onSubmitted: (_) => _busy ? null : _sendCode(),
        ),
        const SizedBox(height: 16),
        MButton(
          'Send me a code',
          kind: MBtnKind.sec,
          onTap: _busy ? null : _sendCode,
        ),
        if (_error != null) ...[
          const SizedBox(height: 14),
          _ErrorBox(_error!),
        ],
        const SizedBox(height: 18),
        _terms(),
      ],
    );
  }

  // ── Screen 3b · OTP boxes + resend + verify ────────────────────────
  Widget _codeStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 8),
        Text('Enter your code', style: AppText.h1),
        const SizedBox(height: 8),
        Text.rich(
          TextSpan(
            style: AppText.body,
            children: [
              const TextSpan(text: 'We sent a 6-digit code to\n'),
              TextSpan(
                text: _sentTo,
                style: AppText.bodyStrong.copyWith(color: AppColors.ink),
              ),
            ],
          ),
        ),
        const SizedBox(height: 28),
        _OtpBoxes(
          controller: _codeCtrl,
          enabled: !_busy,
          onCompleted: (_) => _busy ? null : _verifyCode(),
          onChanged: () => setState(() {}),
        ),
        const SizedBox(height: 22),
        Center(
          child: _resendIn > 0
              ? Text.rich(
                  TextSpan(
                    style:
                        AppText.bodySm.copyWith(color: AppColors.inkMuted),
                    children: [
                      const TextSpan(text: "Didn't get it? "),
                      TextSpan(
                        text:
                            'Resend in 0:${_resendIn.toString().padLeft(2, '0')}',
                        style: AppText.bodySm.copyWith(
                            color: AppColors.forest,
                            fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                )
              : GestureDetector(
                  onTap: _busy ? null : _sendCode,
                  child: Text.rich(
                    TextSpan(
                      style:
                          AppText.bodySm.copyWith(color: AppColors.inkMuted),
                      children: [
                        const TextSpan(text: "Didn't get it? "),
                        TextSpan(
                          text: 'Resend code',
                          style: AppText.bodySm.copyWith(
                              color: AppColors.forest,
                              fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  ),
                ),
        ),
        if (_error != null) ...[
          const SizedBox(height: 14),
          _ErrorBox(_error!),
        ],
        const SizedBox(height: 24),
        MButton(
          'Verify & continue',
          kind: MBtnKind.forest,
          loading: _busy,
          onTap: _busy ? null : _verifyCode,
        ),
        const SizedBox(height: 12),
        Center(
          child: MButton(
            'Use a different email',
            kind: MBtnKind.text,
            fullWidth: false,
            onTap: _busy
                ? null
                : () => setState(() {
                      _step = _Step.email;
                      _error = null;
                      _codeCtrl.clear();
                      _resendTimer?.cancel();
                    }),
          ),
        ),
      ],
    );
  }

  Widget _terms() {
    return Center(
      child: Text.rich(
        TextSpan(
          style:
              AppText.bodySm.copyWith(color: AppColors.inkMuted, height: 1.5),
          children: [
            const TextSpan(text: "By continuing you agree to Eventera's\n"),
            TextSpan(
                text: 'Terms',
                style: AppText.bodySm.copyWith(
                    color: AppColors.forest, fontWeight: FontWeight.w600)),
            const TextSpan(text: ' & '),
            TextSpan(
                text: 'Privacy Policy',
                style: AppText.bodySm.copyWith(
                    color: AppColors.forest, fontWeight: FontWeight.w600)),
            const TextSpan(text: '.'),
          ],
        ),
        textAlign: TextAlign.center,
      ),
    );
  }
}

/// Forest rounded-square brand mark with a gold calendar-check.
class _BrandMark extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 56,
      height: 56,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment(-0.7, -1),
          end: Alignment(0.7, 1),
          colors: [Color(0xFF1F4D3A), Color(0xFF2A6A50)],
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: AppShadow.soft,
      ),
      alignment: Alignment.center,
      child: const Icon(Icons.event_available_outlined,
          color: AppColors.gold, size: 28),
    );
  }
}

/// 6 OTP boxes bound to a single controller. The active (next-to-fill) box
/// carries a forest ring; filled boxes show their digit.
class _OtpBoxes extends StatelessWidget {
  final TextEditingController controller;
  final bool enabled;
  final ValueChanged<String>? onCompleted;
  final VoidCallback onChanged;
  const _OtpBoxes({
    required this.controller,
    required this.enabled,
    required this.onChanged,
    this.onCompleted,
  });

  @override
  Widget build(BuildContext context) {
    final code = controller.text;
    return Stack(
      children: [
        Row(
          children: [
            for (int i = 0; i < 6; i++) ...[
              if (i > 0) const SizedBox(width: 9),
              Expanded(child: _box(i, code)),
            ],
          ],
        ),
        // Invisible field capturing the actual input.
        Positioned.fill(
          child: Opacity(
            opacity: 0,
            child: TextField(
              controller: controller,
              enabled: enabled,
              autofocus: true,
              keyboardType: TextInputType.number,
              maxLength: 6,
              showCursor: false,
              style: const TextStyle(color: Colors.transparent),
              cursorColor: Colors.transparent,
              decoration: const InputDecoration(
                counterText: '',
                border: InputBorder.none,
              ),
              onChanged: (v) {
                onChanged();
                if (v.length >= 6) onCompleted?.call(v);
              },
            ),
          ),
        ),
      ],
    );
  }

  Widget _box(int i, String code) {
    final filled = i < code.length;
    final active = i == code.length && code.length < 6;
    return Container(
      height: 60,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: active ? AppColors.forest : AppColors.border,
          width: active ? 2 : 1,
        ),
        boxShadow: active ? AppShadow.ring : AppShadow.soft,
      ),
      child: Text(
        filled ? code[i] : '',
        style: AppText.numLg.copyWith(fontSize: 24),
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
        color: AppColors.danger.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.danger.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline, color: AppColors.danger, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: AppText.bodySm.copyWith(color: AppColors.danger),
            ),
          ),
        ],
      ),
    );
  }
}
