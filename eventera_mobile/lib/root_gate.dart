import 'dart:async';

import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'attendee/app_shell.dart';
import 'attendee/onboarding/onboarding_screen.dart';
import 'biometric_service.dart';
import 'net.dart';
import 'ui/components.dart';
import 'ui/tokens.dart';

/// Branded splash → home. The splash plays a short entrance animation (logo
/// scales/fades in, wordmark + slogan follow, a gold progress bar fills), then
/// fades into the app.
class RootGate extends StatefulWidget {
  const RootGate({super.key});

  @override
  State<RootGate> createState() => _RootGateState();
}

class _RootGateState extends State<RootGate> {
  bool _ready = false;
  StreamSubscription<AuthState>? _authSub;
  bool _onboardingChecking = false;

  // Biometric gate. If a session was restored from the keychain AND the user
  // turned biometric unlock on, we hold the app behind a lock screen until they
  // authenticate (or fall back to password by signing out here).
  bool _locked = false;
  bool _bioChecked = false;

  @override
  void initState() {
    super.initState();
    // Short branded splash only — the app is ready immediately, so keep this
    // brief (it was 2300ms, which felt like slow loading on every open).
    Future.delayed(const Duration(milliseconds: 1100), () {
      if (mounted) setState(() => _ready = true);
    });
    _evaluateBiometricGate();
    // After any sign-in (email or Google), run the onboarding wizard once if
    // the user hasn't finished it. Skipping/finishing sets onboarding_completed,
    // so it never nags again.
    _authSub = supa.auth.onAuthStateChange.listen((data) {
      if (data.session != null &&
          (data.event == AuthChangeEvent.signedIn ||
              data.event == AuthChangeEvent.initialSession)) {
        _maybeShowOnboarding();
      }
    });
  }

  /// On launch: if there's a restored session and biometric unlock is enabled,
  /// lock the app and prompt. Runs once.
  Future<void> _evaluateBiometricGate() async {
    if (_bioChecked) return;
    _bioChecked = true;
    try {
      final hasSession = supa.auth.currentSession != null;
      final enabled = await BiometricService.instance.isEnabled();
      if (hasSession && enabled) {
        if (mounted) setState(() => _locked = true);
        await _promptUnlock();
      }
    } catch (_) {
      // If anything goes wrong, don't trap the user — leave unlocked.
      if (mounted) setState(() => _locked = false);
    }
  }

  Future<void> _promptUnlock() async {
    final ok = await BiometricService.instance
        .authenticate(reason: 'Unlock Eventera to view your tickets');
    if (!mounted) return;
    if (ok) {
      setState(() => _locked = false);
    }
    // If not ok, we stay on the lock screen; the user can retry or switch to
    // password (which signs out the stored session and shows the auth screen).
  }

  Future<void> _usePasswordInstead() async {
    // Fall back to password/PIN: drop the stored session so the normal auth
    // screen is shown. The account still exists in Supabase — they just log in.
    await BiometricService.instance.setEnabled(false);
    await supa.auth.signOut();
    if (!mounted) return;
    setState(() => _locked = false);
  }

  Future<void> _maybeShowOnboarding() async {
    if (_onboardingChecking) return;
    _onboardingChecking = true;
    try {
      final uid = currentUserId;
      if (uid == null) return;
      final row = await supa
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', uid)
          .maybeSingle();
      final done = row != null && row['onboarding_completed'] == true;
      if (!done && mounted) {
        // Let any in-flight auth screen finish popping first.
        await Future.delayed(const Duration(milliseconds: 450));
        if (!mounted) return;
        await Navigator.of(context).push(MaterialPageRoute(
          builder: (_) => const OnboardingScreen(),
          fullscreenDialog: true,
        ));
      }
    } catch (_) {
      // Non-fatal — never block the app on this.
    } finally {
      _onboardingChecking = false;
    }
  }

  @override
  void dispose() {
    _authSub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final Widget child;
    if (!_ready) {
      child = const _Splash(key: ValueKey('splash'));
    } else if (_locked) {
      child = _BiometricLock(
        key: const ValueKey('lock'),
        onUnlock: _promptUnlock,
        onUsePassword: _usePasswordInstead,
      );
    } else {
      child = const MainShell(key: ValueKey('shell'));
    }
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 500),
      child: child,
    );
  }
}

/// Full-screen lock shown on launch when a session is restored and biometric
/// unlock is enabled. Offers "Unlock" (biometric prompt) and a password
/// fallback that signs the stored session out so the normal sign-in appears.
class _BiometricLock extends StatelessWidget {
  final Future<void> Function() onUnlock;
  final Future<void> Function() onUsePassword;
  const _BiometricLock({
    super.key,
    required this.onUnlock,
    required this.onUsePassword,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.canvas,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                width: 72,
                height: 72,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: AppColors.forestSoft,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Icon(Icons.fingerprint,
                    size: 38, color: AppColors.forest),
              ),
              const SizedBox(height: 22),
              Text('Welcome back', style: AppText.h1, textAlign: TextAlign.center),
              const SizedBox(height: 8),
              Text(
                'Unlock Eventera with your fingerprint or face to view your '
                'tickets and card.',
                style: AppText.body.copyWith(color: AppColors.inkMuted),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 28),
              MButton('Unlock', kind: MBtnKind.forest, onTap: onUnlock),
              const SizedBox(height: 10),
              Center(
                child: MButton(
                  'Use password instead',
                  kind: MBtnKind.text,
                  fullWidth: false,
                  onTap: onUsePassword,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Splash extends StatefulWidget {
  const _Splash({super.key});

  @override
  State<_Splash> createState() => _SplashState();
}

class _SplashState extends State<_Splash> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1100),
  )..forward();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Simple, smooth entrance: the wordmark fades + scales in gently. No heavy
    // motion — light and fast on every open.
    final logoScale = Tween<double>(begin: 0.92, end: 1.0).animate(
      CurvedAnimation(
          parent: _c,
          curve: const Interval(0.0, 0.7, curve: Curves.easeOutCubic)),
    );
    final logoFade = CurvedAnimation(
        parent: _c, curve: const Interval(0.0, 0.55, curve: Curves.easeOut));
    final progress = CurvedAnimation(
        parent: _c, curve: const Interval(0.15, 1.0, curve: Curves.easeInOut));

    return Scaffold(
      backgroundColor: AppColors.canvas,
      body: SafeArea(
        child: Stack(
          children: [
            Center(
              child: FadeTransition(
                opacity: logoFade,
                child: ScaleTransition(
                  scale: logoScale,
                  child: Image.asset(
                    'assets/brand/logo.png',
                    width: 208,
                    filterQuality: FilterQuality.high,
                  ),
                ),
              ),
            ),
            Positioned(
              left: 0,
              right: 0,
              bottom: 44,
              child: Center(
                child: SizedBox(
                  width: 132,
                  height: 3,
                  child: AnimatedBuilder(
                    animation: progress,
                    builder: (_, __) => ClipRRect(
                      borderRadius: BorderRadius.circular(999),
                      child: LinearProgressIndicator(
                        value: progress.value,
                        minHeight: 3,
                        backgroundColor: AppColors.forest.withValues(alpha: 0.10),
                        valueColor:
                            const AlwaysStoppedAnimation<Color>(AppColors.gold),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
