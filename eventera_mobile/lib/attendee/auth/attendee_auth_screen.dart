import 'dart:async';

import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../auth_service.dart';
import '../../biometric_service.dart';
import '../../net.dart';
import '../../ui/components.dart';
import '../../ui/tokens.dart';

/// Attendee sign-in. Verify-once-then-password model:
///   • Returning users sign in with EMAIL + PASSWORD (no fresh code each time).
///   • New users: send ONE email code, verify, then set a password.
///   • Legacy magic-link users (no password) are never locked out — they use
///     "Email me a code instead", then set a password after verifying.
///   • Optional biometric unlock is offered after the first password sign-in.
///
/// Visual steps:
///   welcome (email+password) → code → verifying → setPassword → profile → in.
class AttendeeAuthScreen extends StatefulWidget {
  const AttendeeAuthScreen({super.key});

  @override
  State<AttendeeAuthScreen> createState() => _AttendeeAuthScreenState();
}

enum _Step { welcome, code, verifying, setPassword, profile }

class _AttendeeAuthScreenState extends State<AttendeeAuthScreen> {
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _newPasswordCtrl = TextEditingController();
  final _codeCtrl = TextEditingController();
  final _nameCtrl = TextEditingController();
  final _cityCtrl = TextEditingController();

  _Step _step = _Step.welcome;
  bool _busy = false;
  String? _error;
  String _sentTo = '';
  bool _done = false;
  bool _obscurePassword = true;

  String? _avatarUrl;
  bool _uploadingAvatar = false;

  int _resendIn = 0;
  Timer? _resendTimer;
  StreamSubscription<AuthState>? _authSub;

  @override
  void initState() {
    super.initState();
    // A session can appear from either the email OTP verify OR the Google OAuth
    // deep-link returning. When Google (or a restored session) lands we finish
    // straight away; the email flow routes through profile completion first, so
    // there we let `_verifyCode` decide when to finish.
    _authSub = supa.auth.onAuthStateChange.listen((data) {
      if (data.session != null &&
          (data.event == AuthChangeEvent.signedIn ||
              data.event == AuthChangeEvent.initialSession)) {
        // Don't pop out from under the user while they're finishing an explicit
        // step (set-password or profile). Those steps finish on their own.
        if (_step == _Step.profile || _step == _Step.setPassword) return;
        _finish();
      }
    });
  }

  /// Pop back to the caller exactly once with a success result. Before leaving,
  /// offer to enable biometric unlock if the device supports it.
  Future<void> _finish() async {
    if (_done || !mounted) return;
    _done = true;
    await _maybeOfferBiometrics();
    if (!mounted) return;
    Navigator.of(context).pop(true);
  }

  /// If the device has biometrics and the user hasn't enabled them yet, ask
  /// once whether they want fingerprint/Face unlock next time.
  Future<void> _maybeOfferBiometrics() async {
    try {
      final available = await BiometricService.instance.isAvailable();
      if (!available) return;
      final already = await BiometricService.instance.isEnabled();
      if (already) return;
      if (!mounted) return;
      final enable = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          backgroundColor: AppColors.surface,
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppRadius.card)),
          title: Text('Faster sign-in', style: AppText.h3),
          content: Text(
            'Unlock Eventera with your fingerprint or face next time, instead of '
            'typing your password.',
            style: AppText.bodySm,
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(false),
              child: Text('Not now',
                  style: AppText.label.copyWith(color: AppColors.inkMuted)),
            ),
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(true),
              child: Text('Enable',
                  style: AppText.label.copyWith(color: AppColors.forest)),
            ),
          ],
        ),
      );
      if (enable == true) {
        // Confirm with a live biometric check before turning it on.
        final ok = await BiometricService.instance
            .authenticate(reason: 'Confirm to enable biometric unlock');
        if (ok) await BiometricService.instance.setEnabled(true);
      }
    } catch (_) {
      // Never block sign-in on the biometric offer.
    }
  }

  @override
  void dispose() {
    _authSub?.cancel();
    _resendTimer?.cancel();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _newPasswordCtrl.dispose();
    _codeCtrl.dispose();
    _nameCtrl.dispose();
    _cityCtrl.dispose();
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

  /// Returning-user path: email + password sign-in. On failure (wrong password
  /// or a legacy magic-link account that has no password), surface the code
  /// fallback rather than a dead end.
  Future<void> _passwordSignIn() async {
    final email = _emailCtrl.text.trim().toLowerCase();
    final password = _passwordCtrl.text;
    if (!_validEmail(email)) {
      setState(() => _error = 'That doesn\'t look like a valid email.');
      return;
    }
    if (password.isEmpty) {
      setState(() => _error = 'Enter your password, or use a code instead.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await AuthService.instance.signIn(email: email, password: password);
      // The auth listener fires _finish() on success.
    } on AuthException catch (_) {
      if (mounted) {
        setState(() => _error =
            'That password didn\'t work. If you\'ve never set one, tap "Email me a code instead".');
      }
    } catch (_) {
      if (mounted) {
        setState(() => _error = 'Could not sign in. Please try again.');
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _sendCode() async {
    final email = _emailCtrl.text.trim().toLowerCase();
    if (!_validEmail(email)) {
      setState(() => _error = 'That doesn\'t look like a valid email.');
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
        _codeCtrl.clear();
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
      _step = _Step.verifying;
    });
    try {
      await supa.auth.verifyOTP(
        email: _sentTo,
        token: code,
        type: OtpType.email,
      );
      if (!mounted) return;
      // Verified. If this account has no password yet (new signup or legacy
      // magic-link user), invite them to set one so next time is a normal
      // email+password sign-in. Existing password users skip straight through.
      if (!AuthService.instance.hasPassword) {
        setState(() {
          _step = _Step.setPassword;
          _busy = false;
        });
        return;
      }
      // Otherwise, new-user detection for the profile step.
      final isNew = await _isNewUser();
      if (!mounted) return;
      if (isNew) {
        setState(() {
          _step = _Step.profile;
          _busy = false;
        });
      } else {
        _finish();
      }
    } on AuthException catch (e) {
      if (mounted) {
        setState(() {
          _error = e.message;
          _step = _Step.code;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _error = 'That code isn\'t right. Try again or resend.';
          _step = _Step.code;
        });
      }
    } finally {
      if (mounted && _step == _Step.verifying) {
        setState(() => _busy = false);
      }
    }
  }

  /// Save a password after verifying (verify-once → password henceforth), then
  /// continue to profile setup for new users or finish for returning ones.
  Future<void> _savePasswordAndContinue({required bool skip}) async {
    if (!skip) {
      final pw = _newPasswordCtrl.text;
      if (pw.length < 8) {
        setState(() => _error = 'Use at least 8 characters.');
        return;
      }
      setState(() {
        _busy = true;
        _error = null;
      });
      try {
        await AuthService.instance.setPassword(pw);
      } on AuthException catch (e) {
        if (mounted) setState(() => _error = e.message);
        if (mounted) setState(() => _busy = false);
        return;
      } catch (_) {
        if (mounted) {
          setState(() {
            _error = 'Could not save your password. You can set it later.';
            _busy = false;
          });
        }
        return;
      }
    }
    if (!mounted) return;
    final isNew = await _isNewUser();
    if (!mounted) return;
    if (isNew) {
      setState(() {
        _step = _Step.profile;
        _busy = false;
      });
    } else {
      setState(() => _busy = false);
      _finish();
    }
  }

  /// True when the signed-in user has no `full_name` on their profiles row
  /// (i.e. this is a brand-new signup). Defaults to false on any read error so
  /// we never trap an existing user in the profile step.
  Future<bool> _isNewUser() async {
    final uid = currentUserId;
    if (uid == null) return false;
    try {
      final row = await supa
          .from('profiles')
          .select('full_name, onboarding_completed')
          .eq('id', uid)
          .maybeSingle();
      if (row == null) return true;
      final name = (row['full_name'] as String?)?.trim() ?? '';
      return name.isEmpty;
    } catch (_) {
      return false;
    }
  }

  Future<void> _saveProfileAndFinish({required bool skip}) async {
    final name = _nameCtrl.text.trim();
    if (!skip && name.isEmpty) {
      setState(() => _error = 'Please enter your name.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    final uid = currentUserId;
    try {
      if (uid != null) {
        // Note: we deliberately do NOT set onboarding_completed here — that flag
        // is owned by the onboarding wizard, which runs right after this. We
        // only capture the quick name/city if given.
        final payload = <String, dynamic>{};
        if (!skip && name.isNotEmpty) payload['full_name'] = name;
        final city = _cityCtrl.text.trim();
        if (!skip && city.isNotEmpty) payload['city'] = city;
        // A photo can be added even when the rest is skipped.
        if (_avatarUrl != null && _avatarUrl!.isNotEmpty) {
          payload['avatar_url'] = _avatarUrl;
        }
        if (payload.isNotEmpty) {
          await supa.from('profiles').update(payload).eq('id', uid);
        }
      }
    } catch (_) {
      // A failed profile write shouldn't block sign-in — the user is
      // authenticated regardless. Proceed to finish.
    } finally {
      if (mounted) setState(() => _busy = false);
    }
    _finish();
  }

  /// Pick a photo from the gallery, upload it to Supabase storage, and remember
  /// the public URL so it's saved with the profile. Skips gracefully if the
  /// user isn't signed in yet (shouldn't happen at this step, but safe).
  Future<void> _changeAvatar() async {
    if (_uploadingAvatar) return;
    final uid = currentUserId;
    if (uid == null) return;
    try {
      final picked = await ImagePicker().pickImage(
        source: ImageSource.gallery,
        maxWidth: 800,
        maxHeight: 800,
        imageQuality: 85,
      );
      if (picked == null) return;
      final bytes = await picked.readAsBytes();
      if (!mounted) return;
      setState(() => _uploadingAvatar = true);

      final path = 'avatars/$uid.jpg';
      await supa.storage.from('uploads').uploadBinary(
            path,
            bytes,
            fileOptions:
                const FileOptions(upsert: true, contentType: 'image/jpeg'),
          );
      final url = supa.storage.from('uploads').getPublicUrl(path);
      if (!mounted) return;
      setState(() {
        _avatarUrl = '$url?t=${DateTime.now().millisecondsSinceEpoch}';
        _uploadingAvatar = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _uploadingAvatar = false);
      showToast(context, 'Could not upload your photo');
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
    // The welcome step owns a forest hero panel that must reach the very top,
    // so it uses a bare Scaffold with no app bar. Later steps use MScaffold +
    // MAppBar for the back affordance.
    if (_step == _Step.welcome) {
      return Scaffold(
        backgroundColor: AppColors.canvas,
        body: _welcomeStep(),
      );
    }
    final hideBack = _step == _Step.profile || _step == _Step.setPassword;
    return MScaffold(
      appBar: MAppBar(
        actions: _step == _Step.profile
            ? [
                _TextAction(
                  'Skip',
                  onTap: _busy ? null : () => _saveProfileAndFinish(skip: true),
                ),
                const SizedBox(width: 6),
              ]
            : _step == _Step.setPassword
                ? [
                    _TextAction(
                      'Skip',
                      onTap: _busy
                          ? null
                          : () => _savePasswordAndContinue(skip: true),
                    ),
                    const SizedBox(width: 6),
                  ]
                : const [],
        leading: hideBack ? const SizedBox(width: 8) : null,
        showBack: !hideBack,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(
            AppSpace.lg, AppSpace.sm, AppSpace.lg, AppSpace.xxl),
        child: switch (_step) {
          _Step.code => _codeStep(),
          _Step.verifying => _verifyingStep(),
          _Step.setPassword => _setPasswordStep(),
          _Step.profile => _profileStep(),
          _Step.welcome => const SizedBox.shrink(),
        },
      ),
    );
  }

  // ── Step 1 · Welcome — email/password first, Google second ─────────
  Widget _welcomeStep() {
    final emailValid = _validEmail(_emailCtrl.text);
    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(
            AppSpace.lg, AppSpace.lg, AppSpace.lg, AppSpace.xxl),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 6),
            Align(
              alignment: Alignment.centerLeft,
              child: Image.asset(
                'assets/brand/logo.png',
                height: 30,
                errorBuilder: (_, __, ___) =>
                    Text('Eventera', style: AppText.h2),
              ),
            ),
            const SizedBox(height: 30),
            Text('Welcome to Eventera', style: AppText.h1),
            const SizedBox(height: 8),
            Text(
              'Hold tickets, make your attending card, and connect with people '
              'at the event.',
              style: AppText.body.copyWith(color: AppColors.inkMuted),
            ),
            const SizedBox(height: 28),
            MInput(
              label: 'Email address',
              hint: 'you@example.com',
              controller: _emailCtrl,
              icon: Icons.mail_outline,
              keyboardType: TextInputType.emailAddress,
              action: TextInputAction.next,
              onChanged: (_) => setState(() {
                if (_error != null) _error = null;
              }),
            ),
            const SizedBox(height: 14),
            MInput(
              label: 'Password',
              hint: 'Your password',
              controller: _passwordCtrl,
              icon: Icons.lock_outline,
              obscure: _obscurePassword,
              action: TextInputAction.done,
              errorText: _error,
              onChanged: (_) => setState(() {
                if (_error != null) _error = null;
              }),
              onSubmitted: (_) => _busy ? null : _passwordSignIn(),
            ),
            const SizedBox(height: 18),
            MButton(
              'Sign in',
              kind: MBtnKind.forest,
              loading: _busy && _step == _Step.welcome,
              onTap: (_busy || !emailValid) ? null : _passwordSignIn,
            ),
            const SizedBox(height: 10),
            MButton(
              'Email me a code instead',
              kind: MBtnKind.sec,
              onTap: (_busy || !emailValid) ? null : _sendCode,
            ),
            const SizedBox(height: 14),
            Center(
              child: Text(
                'New here or forgot your password? Get a code — you can set a '
                'password after.',
                textAlign: TextAlign.center,
                style: AppText.bodySm.copyWith(color: AppColors.inkMuted),
              ),
            ),
            const SizedBox(height: 24),
            const _LabeledDivider('or'),
            const SizedBox(height: 18),
            _GoogleButton(
              onTap: _busy ? null : _google,
              loading: _busy,
            ),
            const SizedBox(height: 24),
            _terms(),
          ],
        ),
      ),
    );
  }

  // ── Step 2 · Verify code — OTP boxes + resend + verify ─────────────
  Widget _codeStep() {
    final hasError = _error != null;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 8),
        Container(
          width: 52,
          height: 52,
          decoration: BoxDecoration(
            color: AppColors.forestSoft,
            borderRadius: BorderRadius.circular(15),
          ),
          alignment: Alignment.center,
          child: const Icon(Icons.mail_outline,
              color: AppColors.forest, size: 26),
        ),
        const SizedBox(height: 22),
        Text('Enter your code', style: AppText.h1),
        const SizedBox(height: 8),
        Text.rich(
          TextSpan(
            style: AppText.body,
            children: [
              const TextSpan(text: 'Sent to '),
              TextSpan(
                text: _sentTo,
                style: AppText.bodyStrong.copyWith(color: AppColors.ink),
              ),
              const TextSpan(text: '  ·  '),
              WidgetSpan(
                alignment: PlaceholderAlignment.middle,
                child: GestureDetector(
                  onTap: _busy ? null : _changeEmail,
                  child: Text('Change',
                      style: AppText.bodyStrong
                          .copyWith(color: AppColors.forest)),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 26),
        _OtpBoxes(
          controller: _codeCtrl,
          enabled: !_busy,
          error: hasError,
          onCompleted: (_) => _busy ? null : _verifyCode(),
          onChanged: () => setState(() {
            if (_error != null) _error = null;
          }),
        ),
        if (hasError) ...[
          const SizedBox(height: 14),
          Text(_error!,
              textAlign: TextAlign.center,
              style: AppText.bodySm.copyWith(color: AppColors.danger)),
        ],
        const SizedBox(height: 20),
        Center(child: _resendLine()),
        const SizedBox(height: 24),
        MButton(
          'Verify & continue',
          kind: MBtnKind.forest,
          loading: _busy,
          onTap: (_busy || _codeCtrl.text.trim().length < 6) ? null : _verifyCode,
        ),
      ],
    );
  }

  Widget _resendLine() {
    if (_resendIn > 0) {
      return Text.rich(
        TextSpan(
          style: AppText.bodySm.copyWith(color: AppColors.inkMuted),
          children: [
            const TextSpan(text: "Didn't get it? Resend in "),
            TextSpan(
              text: '0:${_resendIn.toString().padLeft(2, '0')}',
              style: AppText.bodySm.copyWith(
                  color: AppColors.forest, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      );
    }
    return GestureDetector(
      onTap: _busy ? null : _sendCode,
      child: Text.rich(
        TextSpan(
          style: AppText.bodySm.copyWith(color: AppColors.inkMuted),
          children: [
            const TextSpan(text: "Didn't get it? "),
            TextSpan(
              text: 'Resend code',
              style: AppText.bodySm.copyWith(
                  color: AppColors.forest, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }

  void _changeEmail() {
    setState(() {
      _step = _Step.welcome;
      _error = null;
      _codeCtrl.clear();
    });
    _resendTimer?.cancel();
  }

  // ── Step 3 · Verifying — brief spinner ─────────────────────────────
  Widget _verifyingStep() {
    return Padding(
      padding: const EdgeInsets.only(top: 120),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(
            width: 44,
            height: 44,
            child: CircularProgressIndicator(
                strokeWidth: 3, color: AppColors.forest),
          ),
          const SizedBox(height: 20),
          Text('Verifying your code…', style: AppText.h3),
          const SizedBox(height: 6),
          Text('One moment.', style: AppText.bodySm),
        ],
      ),
    );
  }

  // ── Step · Set a password (after verifying a code) ─────────────────
  Widget _setPasswordStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 8),
        Container(
          width: 52,
          height: 52,
          decoration: BoxDecoration(
            color: AppColors.forestSoft,
            borderRadius: BorderRadius.circular(15),
          ),
          alignment: Alignment.center,
          child: const Icon(Icons.lock_outline,
              color: AppColors.forest, size: 26),
        ),
        const SizedBox(height: 22),
        Text('Set a password', style: AppText.h1),
        const SizedBox(height: 8),
        Text(
          'You\'re verified. Add a password so next time you can sign in straight '
          'away — no code needed.',
          style: AppText.body,
        ),
        const SizedBox(height: 24),
        MInput(
          label: 'New password',
          hint: 'At least 8 characters',
          controller: _newPasswordCtrl,
          icon: Icons.lock_outline,
          obscure: _obscurePassword,
          action: TextInputAction.done,
          errorText: _error,
          onChanged: (_) => setState(() {
            if (_error != null) _error = null;
          }),
          onSubmitted: (_) =>
              _busy ? null : _savePasswordAndContinue(skip: false),
        ),
        const SizedBox(height: 22),
        MButton(
          'Save password & continue',
          kind: MBtnKind.forest,
          loading: _busy,
          onTap: _busy ? null : () => _savePasswordAndContinue(skip: false),
        ),
        const SizedBox(height: 10),
        Center(
          child: MButton(
            'Skip for now',
            kind: MBtnKind.text,
            fullWidth: false,
            onTap: _busy ? null : () => _savePasswordAndContinue(skip: true),
          ),
        ),
      ],
    );
  }

  // ── Step 4 · New user — complete profile ───────────────────────────
  Widget _profileStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 8),
        const Align(
          alignment: Alignment.centerLeft,
          child: Tag('New here', kind: TagKind.gold),
        ),
        const SizedBox(height: 14),
        Text('Set up your profile', style: AppText.h1),
        const SizedBox(height: 8),
        Text(
          'This is how you\'ll appear on your attending card and to people you '
          'connect with.',
          style: AppText.body,
        ),
        const SizedBox(height: 26),
        Center(
          child: GestureDetector(
            onTap: _uploadingAvatar ? null : _changeAvatar,
            behavior: HitTestBehavior.opaque,
            child: _PhotoUploadRing(
              imageUrl: _avatarUrl,
              uploading: _uploadingAvatar,
            ),
          ),
        ),
        const SizedBox(height: 10),
        Center(
          child: GestureDetector(
            onTap: _uploadingAvatar ? null : _changeAvatar,
            behavior: HitTestBehavior.opaque,
            child: Text(
                (_avatarUrl != null && _avatarUrl!.isNotEmpty)
                    ? 'Change photo'
                    : 'Add a photo',
                style: AppText.bodySm.copyWith(
                    color: AppColors.forest, fontWeight: FontWeight.w600)),
          ),
        ),
        const SizedBox(height: 22),
        MInput(
          label: 'Full name',
          hint: 'Your name',
          controller: _nameCtrl,
          action: TextInputAction.next,
          errorText: _error,
          onChanged: (_) => setState(() {
            if (_error != null) _error = null;
          }),
        ),
        const SizedBox(height: 16),
        MInput(
          label: 'City (optional)',
          hint: 'Where are you based?',
          controller: _cityCtrl,
          icon: Icons.location_on_outlined,
          action: TextInputAction.done,
        ),
        const SizedBox(height: 26),
        MButton(
          'Create my account',
          kind: MBtnKind.forest,
          loading: _busy,
          onTap: _busy ? null : () => _saveProfileAndFinish(skip: false),
        ),
        const SizedBox(height: 12),
        Center(
          child: MButton(
            'Skip for now',
            kind: MBtnKind.text,
            fullWidth: false,
            onTap: _busy ? null : () => _saveProfileAndFinish(skip: true),
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

// ─────────────────────────────────────────── Google button (white surface)

class _GoogleButton extends StatelessWidget {
  final VoidCallback? onTap;
  final bool loading;
  const _GoogleButton({this.onTap, this.loading = false});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 54,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
          boxShadow: AppShadow.soft,
        ),
        alignment: Alignment.center,
        child: loading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                    strokeWidth: 2.4, color: AppColors.forest),
              )
            : Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const _GoogleGLogo(size: 20),
                  const SizedBox(width: 11),
                  Text('Continue with Google',
                      style: AppText.btn.copyWith(
                          color: AppColors.ink, fontSize: 15.5)),
                ],
              ),
      ),
    );
  }
}

/// The official 4-colour Google "G" mark, rendered from Google's own SVG so it
/// is always crisp and correct at any size.
class _GoogleGLogo extends StatelessWidget {
  final double size;
  const _GoogleGLogo({this.size = 20});
  @override
  Widget build(BuildContext context) {
    return SvgPicture.string(_kGoogleGSvg, width: size, height: size);
  }
}

const String _kGoogleGSvg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">'
    '<path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>'
    '<path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>'
    '<path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>'
    '<path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>'
    '</svg>';

// ─────────────────────────────────────────── Labeled divider ("or …")

class _LabeledDivider extends StatelessWidget {
  final String label;
  const _LabeledDivider(this.label);
  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Expanded(child: Divider(color: AppColors.border, height: 1)),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Text(label,
              style: AppText.bodySm.copyWith(color: AppColors.inkMuted)),
        ),
        const Expanded(child: Divider(color: AppColors.border, height: 1)),
      ],
    );
  }
}

// ─────────────────────────────────────────── App-bar text action ("Skip")

class _TextAction extends StatelessWidget {
  final String label;
  final VoidCallback? onTap;
  const _TextAction(this.label, {this.onTap});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
        child: Text(label,
            style: AppText.label.copyWith(
                color: AppColors.inkMuted, fontWeight: FontWeight.w600)),
      ),
    );
  }
}

// ─────────────────────────────────────────── Photo-upload ring (dashed)

class _PhotoUploadRing extends StatelessWidget {
  final String? imageUrl;
  final bool uploading;
  const _PhotoUploadRing({this.imageUrl, this.uploading = false});
  @override
  Widget build(BuildContext context) {
    final hasImage = imageUrl != null && imageUrl!.isNotEmpty;
    return SizedBox(
      width: 96,
      height: 96,
      child: Stack(
        children: [
          if (hasImage)
            ClipOval(
              child: SizedBox(
                width: 96,
                height: 96,
                child: Image.network(
                  imageUrl!,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => const Center(
                    child: Icon(Icons.person_outline,
                        color: AppColors.inkMuted, size: 30),
                  ),
                ),
              ),
            )
          else
            CustomPaint(
              size: const Size(96, 96),
              painter: _DashedCirclePainter(),
              child: const Center(
                child: Icon(Icons.person_outline,
                    color: AppColors.inkMuted, size: 30),
              ),
            ),
          if (uploading)
            const Positioned.fill(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: Color(0x66000000),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                        strokeWidth: 2.5, color: Colors.white),
                  ),
                ),
              ),
            ),
          Positioned(
            right: 0,
            bottom: 0,
            child: Container(
              width: 30,
              height: 30,
              decoration: BoxDecoration(
                color: AppColors.forest,
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.canvas, width: 3),
              ),
              alignment: Alignment.center,
              child: Icon(hasImage ? Icons.edit : Icons.add,
                  color: Colors.white, size: 16),
            ),
          ),
        ],
      ),
    );
  }
}

/// Paints a dashed circular border (the photo-upload ring outline).
class _DashedCirclePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppColors.borderStrong
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;
    final radius = (size.width / 2) - 1;
    final center = Offset(size.width / 2, size.height / 2);
    const dash = 5.0;
    const gap = 5.0;
    final circumference = 2 * 3.1415926535 * radius;
    final count = (circumference / (dash + gap)).floor();
    final sweep = (dash / radius);
    final gapAngle = (gap / radius);
    var start = -1.5708; // start at top
    for (var i = 0; i < count; i++) {
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        start,
        sweep,
        false,
        paint,
      );
      start += sweep + gapAngle;
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

// ─────────────────────────────────────────── OTP boxes

/// 6 OTP boxes bound to a single controller. The active (next-to-fill) box
/// carries a forest ring + caret; filled boxes show their digit; on [error]
/// every box turns danger.
class _OtpBoxes extends StatelessWidget {
  final TextEditingController controller;
  final bool enabled;
  final bool error;
  final ValueChanged<String>? onCompleted;
  final VoidCallback onChanged;
  const _OtpBoxes({
    required this.controller,
    required this.enabled,
    required this.onChanged,
    this.error = false,
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
    final active = !error && i == code.length && code.length < 6;
    Color borderColor;
    double borderWidth;
    if (error) {
      borderColor = AppColors.danger;
      borderWidth = 1.5;
    } else if (active) {
      borderColor = AppColors.forest;
      borderWidth = 2;
    } else if (filled) {
      borderColor = AppColors.borderStrong;
      borderWidth = 1;
    } else {
      borderColor = AppColors.border;
      borderWidth = 1;
    }
    return Container(
      height: 62,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: error
            ? AppColors.danger.withValues(alpha: 0.04)
            : AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: borderColor, width: borderWidth),
        boxShadow: active ? AppShadow.ring : AppShadow.soft,
      ),
      child: filled
          ? Text(
              code[i],
              style: AppText.numLg.copyWith(
                  fontSize: 26,
                  color: error ? AppColors.danger : AppColors.ink),
            )
          : active
              ? const _Caret()
              : const SizedBox.shrink(),
    );
  }
}

/// Blinking caret in the active OTP cell.
class _Caret extends StatefulWidget {
  const _Caret();
  @override
  State<_Caret> createState() => _CaretState();
}

class _CaretState extends State<_Caret> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
      vsync: this, duration: const Duration(milliseconds: 1100))
    ..repeat();
  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _c,
      builder: (_, __) => Opacity(
        opacity: _c.value < 0.5 ? 1 : 0,
        child: Container(
          width: 2,
          height: 26,
          color: AppColors.forest,
        ),
      ),
    );
  }
}
