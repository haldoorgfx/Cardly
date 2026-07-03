import 'dart:async';

import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../net.dart';
import '../../ui/components.dart';
import '../../ui/tokens.dart';

/// Attendee sign-in via email OTP (magic code) with a "Continue with Google"
/// fallback. Pops with `true` on a successful session.
///
/// Redesigned flow (single screen, multiple visual steps):
///   welcome → code → (verifying) → profile (new users only) → in.
class AttendeeAuthScreen extends StatefulWidget {
  const AttendeeAuthScreen({super.key});

  @override
  State<AttendeeAuthScreen> createState() => _AttendeeAuthScreenState();
}

enum _Step { welcome, code, verifying, profile }

class _AttendeeAuthScreenState extends State<AttendeeAuthScreen> {
  final _emailCtrl = TextEditingController();
  final _codeCtrl = TextEditingController();
  final _nameCtrl = TextEditingController();
  final _cityCtrl = TextEditingController();

  _Step _step = _Step.welcome;
  bool _busy = false;
  String? _error;
  String _sentTo = '';
  bool _done = false;

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
        // If we're mid-profile-setup from an email verify, don't pop out from
        // under the user — the profile step will finish explicitly.
        if (_step == _Step.profile) return;
        _finish();
      }
    });
  }

  /// Pop back to the caller exactly once with a success result.
  void _finish() {
    if (_done || !mounted) return;
    _done = true;
    Navigator.of(context).pop(true);
  }

  @override
  void dispose() {
    _authSub?.cancel();
    _resendTimer?.cancel();
    _emailCtrl.dispose();
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
      // New-user detection: read the profiles row. If there's no full_name yet,
      // route through the one-screen profile setup; otherwise finish.
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
            : const [],
        leading: _step == _Step.profile
            ? const SizedBox(width: 8)
            : null, // hide back on profile; keep default back elsewhere
        showBack: _step != _Step.profile,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(
            AppSpace.lg, AppSpace.sm, AppSpace.lg, AppSpace.xxl),
        child: switch (_step) {
          _Step.code => _codeStep(),
          _Step.verifying => _verifyingStep(),
          _Step.profile => _profileStep(),
          _Step.welcome => const SizedBox.shrink(),
        },
      ),
    );
  }

  // ── Step 1 · Welcome — forest hero + Google + email ────────────────
  Widget _welcomeStep() {
    final emailValid = _validEmail(_emailCtrl.text);
    return Column(
      children: [
        const _AuthHero(),
        Expanded(
          child: SafeArea(
            top: false,
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(
                  AppSpace.lg, AppSpace.xl, AppSpace.lg, AppSpace.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('Welcome to Eventera', style: AppText.h1),
                  const SizedBox(height: 8),
                  Text(
                    'Hold tickets, make your attending card, and connect with '
                    'people at the event.',
                    style: AppText.body,
                  ),
                  const SizedBox(height: 22),
                  _GoogleButton(
                    onTap: _busy ? null : _google,
                    loading: _busy,
                  ),
                  const SizedBox(height: 20),
                  const _LabeledDivider('or with email'),
                  const SizedBox(height: 20),
                  MInput(
                    label: 'Email address',
                    hint: 'you@example.com',
                    controller: _emailCtrl,
                    icon: Icons.mail_outline,
                    keyboardType: TextInputType.emailAddress,
                    action: TextInputAction.done,
                    errorText: _error,
                    onChanged: (_) => setState(() {
                      if (_error != null) _error = null;
                    }),
                    onSubmitted: (_) => _busy ? null : _sendCode(),
                  ),
                  const SizedBox(height: 16),
                  MButton(
                    'Continue with email',
                    kind: MBtnKind.forest,
                    loading: _busy && _step == _Step.welcome,
                    onTap: (_busy || !emailValid) ? null : _sendCode,
                  ),
                  const SizedBox(height: 24),
                  _terms(),
                ],
              ),
            ),
          ),
        ),
      ],
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
        const Center(child: _PhotoUploadRing()),
        const SizedBox(height: 10),
        Center(
          child: Text('Add a photo',
              style: AppText.bodySm.copyWith(
                  color: AppColors.forest, fontWeight: FontWeight.w600)),
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

// ─────────────────────────────────────────── Welcome hero panel

/// Forest gradient hero with the white Eventera lockup, a stacked
/// attending-card motif, and a light social-proof line. Rounded bottom (~30).
class _AuthHero extends StatelessWidget {
  const _AuthHero();

  @override
  Widget build(BuildContext context) {
    final topInset = MediaQuery.of(context).padding.top;
    return Container(
      padding: EdgeInsets.fromLTRB(24, topInset + 24, 24, 30),
      decoration: const BoxDecoration(
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(30)),
        gradient: LinearGradient(
          begin: Alignment(-0.6, -1),
          end: Alignment(0.4, 1),
          colors: [Color(0xFF163828), Color(0xFF1F4D3A), Color(0xFF0D1F17)],
          stops: [0.0, 0.55, 1.0],
        ),
        boxShadow: AppShadow.lift,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Brand lockup: mark + wordmark. Uses the white logo asset.
          Row(
            children: [
              Image.asset('assets/brand/logo_white.png', height: 30,
                  errorBuilder: (_, __, ___) => Row(
                        children: [
                          Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                                colors: [Color(0xFF2A6A50), Color(0xFF163828)],
                              ),
                              borderRadius: BorderRadius.circular(13),
                            ),
                            alignment: Alignment.center,
                            child: const Icon(Icons.event_available_outlined,
                                color: AppColors.gold, size: 23),
                          ),
                          const SizedBox(width: 11),
                          Text('Eventera',
                              style: AppText.h2.copyWith(color: Colors.white)),
                        ],
                      )),
            ],
          ),
          const SizedBox(height: 24),
          const _CardMotif(),
          const SizedBox(height: 18),
          // Social proof line.
          Row(
            children: [
              _ProofDot('AO', 30),
              Transform.translate(
                  offset: const Offset(-8, 0), child: _ProofDot('FK', 200)),
              Transform.translate(
                  offset: const Offset(-16, 0), child: _ProofDot('LH', 265)),
              const SizedBox(width: 2),
              Expanded(
                child: Text.rich(
                  TextSpan(
                    style: AppText.bodySm
                        .copyWith(color: Colors.white.withValues(alpha: 0.82)),
                    children: [
                      TextSpan(
                          text: '12,000+ ',
                          style: AppText.bodyStrong
                              .copyWith(color: Colors.white)),
                      const TextSpan(text: 'people already in the room'),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// A single small avatar bubble in the social-proof cluster.
class _ProofDot extends StatelessWidget {
  final String initials;
  final int hue;
  const _ProofDot(this.initials, this.hue);
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 32,
      height: 32,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: HSLColor.fromAHSL(1, hue.toDouble(), 0.35, 0.4).toColor(),
        border: Border.all(color: const Color(0xFF163828), width: 2),
      ),
      alignment: Alignment.center,
      child: Text(initials,
          style: AppText.caption
              .copyWith(color: Colors.white, fontWeight: FontWeight.w700)),
    );
  }
}

/// Stacked "attending-card" motif — three rotated cards, front one labelled.
class _CardMotif extends StatelessWidget {
  const _CardMotif();
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 150,
      child: Stack(
        children: [
          // back
          Positioned(
            left: 40,
            right: 40,
            top: 8,
            child: Transform.rotate(
              angle: -0.105,
              child: Container(
                height: 120,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(16),
                  border:
                      Border.all(color: Colors.white.withValues(alpha: 0.12)),
                ),
              ),
            ),
          ),
          // mid
          Positioned(
            left: 24,
            right: 24,
            top: 4,
            child: Transform.rotate(
              angle: 0.07,
              child: Container(
                height: 128,
                decoration: BoxDecoration(
                  color: AppColors.gold.withValues(alpha: 0.16),
                  borderRadius: BorderRadius.circular(16),
                  border:
                      Border.all(color: AppColors.gold.withValues(alpha: 0.25)),
                ),
              ),
            ),
          ),
          // front
          Positioned(
            left: 30,
            right: 30,
            top: 0,
            child: Transform.rotate(
              angle: -0.026,
              child: Container(
                height: 136,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Color(0xFF1F4D3A), Color(0xFF2A6A50)],
                  ),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.14)),
                  boxShadow: const [
                    BoxShadow(
                        color: Color(0x8C000000),
                        blurRadius: 40,
                        offset: Offset(0, 20))
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('I\'M ATTENDING',
                        style: AppText.caption.copyWith(
                            color: AppColors.gold,
                            fontSize: 9,
                            letterSpacing: 1.6,
                            fontWeight: FontWeight.w700)),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Amina Osman',
                            style: AppText.h3.copyWith(
                                color: Colors.white, fontSize: 17)),
                        const SizedBox(height: 1),
                        Text('Founder · Sahel Pay',
                            style: AppText.caption.copyWith(
                                color: Colors.white.withValues(alpha: 0.75),
                                letterSpacing: 0,
                                fontWeight: FontWeight.w400)),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
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
                  Container(
                    width: 22,
                    height: 22,
                    decoration: const BoxDecoration(
                        color: Color(0xFF4285F4), shape: BoxShape.circle),
                    alignment: Alignment.center,
                    child: const Text('G',
                        style: TextStyle(
                            color: Colors.white,
                            fontSize: 15,
                            fontWeight: FontWeight.w700)),
                  ),
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
  const _PhotoUploadRing();
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 96,
      height: 96,
      child: Stack(
        children: [
          CustomPaint(
            size: const Size(96, 96),
            painter: _DashedCirclePainter(),
            child: const Center(
              child: Icon(Icons.person_outline,
                  color: AppColors.inkMuted, size: 30),
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
              child: const Icon(Icons.add, color: Colors.white, size: 16),
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
