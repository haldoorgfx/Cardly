import 'package:flutter/material.dart';

import 'attendee/app_shell.dart';
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

  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(milliseconds: 2300), () {
      if (mounted) setState(() => _ready = true);
    });
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 500),
      child: _ready
          ? const MainShell()
          : const _Splash(key: ValueKey('splash')),
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
    duration: const Duration(milliseconds: 2300),
  )..forward();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final logoScale = Tween<double>(begin: 0.62, end: 1.0).animate(
      CurvedAnimation(
          parent: _c,
          curve: const Interval(0.0, 0.55, curve: Curves.easeOutBack)),
    );
    final logoFade = CurvedAnimation(
        parent: _c, curve: const Interval(0.0, 0.4, curve: Curves.easeOut));
    final textFade = CurvedAnimation(
        parent: _c, curve: const Interval(0.32, 0.72, curve: Curves.easeOut));
    final textSlide = Tween<Offset>(begin: const Offset(0, 0.4), end: Offset.zero)
        .animate(CurvedAnimation(
            parent: _c,
            curve: const Interval(0.32, 0.75, curve: Curves.easeOutCubic)));
    final progress = CurvedAnimation(
        parent: _c, curve: const Interval(0.12, 1.0, curve: Curves.easeInOut));

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [AppColors.forest, AppColors.forestDark],
          ),
        ),
        child: SafeArea(
          child: Stack(
            children: [
              Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    ScaleTransition(
                      scale: logoScale,
                      child: FadeTransition(
                        opacity: logoFade,
                        child: Container(
                          width: 112,
                          height: 112,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(26),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.38),
                                blurRadius: 44,
                                offset: const Offset(0, 20),
                              ),
                            ],
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(26),
                            child: Image.asset(
                              'assets/brand/icon.png',
                              fit: BoxFit.cover,
                              filterQuality: FilterQuality.high,
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 26),
                    FadeTransition(
                      opacity: textFade,
                      child: SlideTransition(
                        position: textSlide,
                        child: Column(
                          children: [
                            Text(
                              'Eventera',
                              style: AppText.h1.copyWith(
                                color: Colors.white,
                                fontSize: 34,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            const SizedBox(height: 11),
                            Text(
                              'THE NEW ERA OF EVENTS',
                              style: AppText.caption.copyWith(
                                color: AppColors.gold,
                                fontSize: 11.5,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 2.6,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Positioned(
                left: 0,
                right: 0,
                bottom: 44,
                child: Center(
                  child: SizedBox(
                    width: 148,
                    height: 4,
                    child: AnimatedBuilder(
                      animation: progress,
                      builder: (_, __) => ClipRRect(
                        borderRadius: BorderRadius.circular(999),
                        child: LinearProgressIndicator(
                          value: progress.value,
                          minHeight: 4,
                          backgroundColor: Colors.white.withValues(alpha: 0.14),
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
      ),
    );
  }
}
