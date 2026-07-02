import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../net.dart';
import '../../theme.dart';

/// Attendee sign-in via email OTP (magic code) with a "Continue with Google"
/// fallback. Pops with `true` on a successful session.
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

  @override
  void dispose() {
    _emailCtrl.dispose();
    _codeCtrl.dispose();
    super.dispose();
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
      await supa.auth.verifyOtp(
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
    return Scaffold(
      backgroundColor: Brand.cream,
      appBar: AppBar(
        backgroundColor: Brand.cream,
        elevation: 0,
        foregroundColor: Brand.ink,
        title: Text(_step == _Step.email ? 'Sign in' : 'Enter code'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 8),
              Text(
                _step == _Step.email
                    ? 'Sign in to see your tickets'
                    : 'Check your email',
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w700,
                  color: Brand.ink,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                _step == _Step.email
                    ? 'We’ll email you a 6-digit code — no password needed.'
                    : 'We sent a 6-digit code to $_sentTo.',
                style: const TextStyle(fontSize: 14, color: Brand.muted),
              ),
              const SizedBox(height: 24),
              if (_step == _Step.email) ..._emailStep() else ..._codeStep(),
              if (_error != null) ...[
                const SizedBox(height: 16),
                _ErrorBox(_error!),
              ],
            ],
          ),
        ),
      ),
    );
  }

  List<Widget> _emailStep() {
    return [
      TextField(
        controller: _emailCtrl,
        keyboardType: TextInputType.emailAddress,
        autofillHints: const [AutofillHints.email],
        enabled: !_busy,
        decoration: const InputDecoration(
          labelText: 'Email address',
          hintText: 'you@example.com',
        ),
        onSubmitted: (_) => _busy ? null : _sendCode(),
      ),
      const SizedBox(height: 16),
      FilledButton(
        onPressed: _busy ? null : _sendCode,
        child: _busy
            ? const _Spinner()
            : const Text('Send code'),
      ),
      const SizedBox(height: 20),
      Row(
        children: const [
          Expanded(child: Divider(color: Brand.border)),
          Padding(
            padding: EdgeInsets.symmetric(horizontal: 12),
            child: Text('or', style: TextStyle(color: Brand.muted)),
          ),
          Expanded(child: Divider(color: Brand.border)),
        ],
      ),
      const SizedBox(height: 20),
      OutlinedButton.icon(
        onPressed: _busy ? null : _google,
        style: OutlinedButton.styleFrom(
          foregroundColor: Brand.ink,
          side: const BorderSide(color: Brand.border),
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        icon: const Icon(Icons.g_mobiledata, size: 26),
        label: const Text('Continue with Google'),
      ),
    ];
  }

  List<Widget> _codeStep() {
    return [
      TextField(
        controller: _codeCtrl,
        keyboardType: TextInputType.number,
        maxLength: 6,
        enabled: !_busy,
        autofocus: true,
        style: const TextStyle(fontSize: 22, letterSpacing: 8),
        textAlign: TextAlign.center,
        decoration: const InputDecoration(
          counterText: '',
          hintText: '••••••',
        ),
        onSubmitted: (_) => _busy ? null : _verifyCode(),
      ),
      const SizedBox(height: 16),
      FilledButton(
        onPressed: _busy ? null : _verifyCode,
        child: _busy ? const _Spinner() : const Text('Verify & continue'),
      ),
      const SizedBox(height: 12),
      TextButton(
        onPressed: _busy ? null : _sendCode,
        child: const Text('Resend code'),
      ),
      TextButton(
        onPressed: _busy
            ? null
            : () => setState(() {
                  _step = _Step.email;
                  _error = null;
                }),
        child: const Text('Use a different email'),
      ),
    ];
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

class _Spinner extends StatelessWidget {
  const _Spinner();
  @override
  Widget build(BuildContext context) {
    return const SizedBox(
      height: 20,
      width: 20,
      child: CircularProgressIndicator(
        strokeWidth: 2,
        valueColor: AlwaysStoppedAnimation(Colors.white),
      ),
    );
  }
}
