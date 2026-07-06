import 'dart:math' as math;
import 'dart:typed_data';

import 'package:flutter/material.dart';

import '../ui/tokens.dart';
import 'preview_screen.dart';

/// The signature "Card reveal moment". Shown right after a card renders, before
/// the existing [PreviewScreen]. Presents the REAL rendered card image inside a
/// celebratory beat: a gold radial glow, a confetti burst, and a gentle
/// "breathing" scale/glow on the card. Fully skippable (tap anywhere to settle)
/// and non-blocking — any animation issue still lets the attendee reach their
/// card. Respects the OS "reduce motion" accessibility setting.
class CardRevealScreen extends StatefulWidget {
  final Uint8List imageBytes;
  final String eventName;
  const CardRevealScreen({
    super.key,
    required this.imageBytes,
    required this.eventName,
  });

  @override
  State<CardRevealScreen> createState() => _CardRevealScreenState();
}

class _CardRevealScreenState extends State<CardRevealScreen>
    with TickerProviderStateMixin {
  // Drives the one-shot entrance: glow bloom, card scale-in, confetti fall.
  late final AnimationController _entrance = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1500),
  );
  // Continuous, gentle "breathing" once settled.
  late final AnimationController _breathe = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 4200),
  );

  final math.Random _rng = math.Random();
  late final List<_Confetto> _confetti;

  bool _reduceMotion = false;
  bool _readAccessibility = false;

  @override
  void initState() {
    super.initState();
    _confetti = List.generate(28, (i) => _Confetto.random(_rng, i));
    _breathe.repeat(reverse: true);
    // Start the entrance; if anything goes sideways it's caught below so the
    // reveal can never trap the attendee.
    _entrance.forward().catchError((_) {});
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_readAccessibility) return;
    _readAccessibility = true;
    // Honour the platform "reduce motion" flag: settle immediately, no confetti.
    _reduceMotion = MediaQuery.maybeOf(context)?.disableAnimations ?? false;
    if (_reduceMotion) {
      _entrance.value = 1.0;
      _breathe.stop();
      _breathe.value = 0.5;
    }
  }

  @override
  void dispose() {
    _entrance.dispose();
    _breathe.dispose();
    super.dispose();
  }

  /// Tap anywhere to settle the burst instantly (skip to the calm state).
  void _settle() {
    if (_entrance.isAnimating) _entrance.forward(from: _entrance.value);
    _entrance.value = 1.0;
  }

  /// Continue into the existing preview/share screen. Replaces this route so
  /// Back from the preview doesn't return to the reveal.
  void _continue() {
    Navigator.of(context).pushReplacement(MaterialPageRoute(
      builder: (_) => PreviewScreen(
        imageBytes: widget.imageBytes,
        eventName: widget.eventName,
      ),
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.forestDark,
      body: GestureDetector(
        onTap: _settle,
        behavior: HitTestBehavior.opaque,
        child: SafeArea(
          child: Stack(
            children: [
              // Gold radial glow behind everything.
              Positioned.fill(
                child: AnimatedBuilder(
                  animation: _entrance,
                  builder: (context, _) {
                    final t = Curves.easeOut.transform(_entrance.value);
                    return CustomPaint(
                      painter: _GlowPainter(intensity: t),
                    );
                  },
                ),
              ),
              // Confetti burst (skipped entirely under reduce-motion).
              if (!_reduceMotion)
                Positioned.fill(
                  child: IgnorePointer(
                    child: AnimatedBuilder(
                      animation: _entrance,
                      builder: (context, _) => CustomPaint(
                        painter: _ConfettiPainter(
                          confetti: _confetti,
                          progress: _entrance.value,
                        ),
                      ),
                    ),
                  ),
                ),
              // Foreground: label, breathing card, actions.
              Positioned.fill(
                child: Column(
                  children: [
                    const Spacer(flex: 2),
                    _readyLabel(),
                    const SizedBox(height: 22),
                    Expanded(flex: 12, child: _breathingCard(context)),
                    const SizedBox(height: 24),
                    _actions(),
                    const Spacer(flex: 2),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _readyLabel() {
    return AnimatedBuilder(
      animation: _entrance,
      builder: (context, child) {
        final t = Curves.easeOut.transform(
          ((_entrance.value - 0.15) / 0.85).clamp(0.0, 1.0),
        );
        return Opacity(
          opacity: t,
          child: Transform.translate(offset: Offset(0, (1 - t) * 8), child: child),
        );
      },
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              color: AppColors.gold,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: AppColors.gold.withValues(alpha: 0.4),
                  blurRadius: 6,
                  spreadRadius: 3,
                ),
              ],
            ),
          ),
          const SizedBox(width: 9),
          Text(
            'YOUR CARD · READY',
            style: AppText.caption.copyWith(
              color: AppColors.gold,
              fontSize: 11,
              letterSpacing: 1.8,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }

  Widget _breathingCard(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 40),
        child: AnimatedBuilder(
          animation: Listenable.merge([_entrance, _breathe]),
          builder: (context, child) {
            // Entrance: scale + fade in.
            final e = Curves.easeOutBack.transform(_entrance.value);
            final fade = Curves.easeOut.transform(
              (_entrance.value / 0.6).clamp(0.0, 1.0),
            );
            // Breathing: subtle scale once settled.
            final breath = _reduceMotion
                ? 0.0
                : math.sin(_breathe.value * math.pi * 2);
            final settled = _entrance.value; // 0..1 blends breathing in
            final scale = (0.86 + 0.14 * e) + breath * 0.012 * settled;
            final glow = 0.22 + (breath * 0.5 + 0.5) * 0.20 * settled;
            return Opacity(
              opacity: fade,
              child: Transform.scale(
                scale: scale,
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(18),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.gold.withValues(alpha: glow),
                        blurRadius: 50,
                        spreadRadius: 2,
                      ),
                      const BoxShadow(
                        color: Color(0x99000000),
                        blurRadius: 50,
                        offset: Offset(0, 26),
                      ),
                    ],
                  ),
                  child: child,
                ),
              ),
            );
          },
          child: ClipRRect(
            borderRadius: BorderRadius.circular(18),
            // The REAL rendered card image — same bytes the preview shows.
            child: Image.memory(widget.imageBytes, fit: BoxFit.contain),
          ),
        ),
      ),
    );
  }

  Widget _actions() {
    return AnimatedBuilder(
      animation: _entrance,
      builder: (context, child) {
        final t = Curves.easeOut.transform(
          ((_entrance.value - 0.4) / 0.6).clamp(0.0, 1.0),
        );
        return Opacity(
          opacity: t,
          child: Transform.translate(offset: Offset(0, (1 - t) * 12), child: child),
        );
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 40),
        child: GestureDetector(
          onTap: _continue,
          child: Container(
            height: 54,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: AppColors.gold,
              borderRadius: BorderRadius.circular(AppRadius.btn),
              boxShadow: [
                BoxShadow(
                  color: AppColors.gold.withValues(alpha: 0.3),
                  blurRadius: 20,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Reveal my card',
                  style: AppText.btn.copyWith(color: AppColors.forestDark),
                ),
                const SizedBox(width: 8),
                const Icon(Icons.arrow_forward,
                    size: 18, color: AppColors.forestDark),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// A single confetti piece with its own trajectory + spin.
class _Confetto {
  final double startX; // 0..1 across the width
  final double drift; // horizontal travel (px)
  final double delay; // 0..0.5 of the progress
  final double rotations;
  final double size;
  final bool round;
  final Color color;

  _Confetto({
    required this.startX,
    required this.drift,
    required this.delay,
    required this.rotations,
    required this.size,
    required this.round,
    required this.color,
  });

  static const _palette = [
    AppColors.gold,
    AppColors.goldHover,
    AppColors.forest,
    AppColors.success,
    AppColors.goldSoft,
  ];

  factory _Confetto.random(math.Random r, int i) {
    return _Confetto(
      startX: 0.12 + r.nextDouble() * 0.76,
      drift: (r.nextDouble() * 2 - 1) * 130,
      delay: r.nextDouble() * 0.4,
      rotations: r.nextDouble() * 3 + 1,
      size: 6 + r.nextDouble() * 5,
      round: r.nextBool(),
      color: _palette[i % _palette.length],
    );
  }
}

/// Paints the falling confetti burst based on the entrance progress (0..1).
class _ConfettiPainter extends CustomPainter {
  final List<_Confetto> confetti;
  final double progress;
  _ConfettiPainter({required this.confetti, required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    if (progress <= 0) return;
    final paint = Paint()..style = PaintingStyle.fill;
    for (final c in confetti) {
      // Each piece has its own local timeline after its delay.
      final span = 1 - c.delay;
      if (span <= 0) continue;
      final local = ((progress - c.delay) / span).clamp(0.0, 1.0);
      if (local <= 0) continue;

      final eased = Curves.easeIn.transform(local);
      final x = size.width * c.startX + c.drift * eased;
      final y = -16 + (size.height * 0.82) * eased;
      // Fade out over the last third of the fall.
      final opacity = (1 - ((local - 0.6) / 0.4)).clamp(0.0, 1.0);
      paint.color = c.color.withValues(alpha: opacity);

      canvas.save();
      canvas.translate(x, y);
      canvas.rotate(c.rotations * eased * math.pi * 2);
      if (c.round) {
        canvas.drawCircle(Offset.zero, c.size / 2, paint);
      } else {
        canvas.drawRRect(
          RRect.fromRectAndRadius(
            Rect.fromCenter(
                center: Offset.zero, width: c.size, height: c.size * 0.6),
            const Radius.circular(1),
          ),
          paint,
        );
      }
      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(covariant _ConfettiPainter old) =>
      old.progress != progress;
}

/// Paints the gold radial glow that blooms behind the card.
class _GlowPainter extends CustomPainter {
  final double intensity; // 0..1
  _GlowPainter({required this.intensity});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width * 0.5, size.height * 0.42);
    final radius = size.shortestSide * (0.5 + 0.35 * intensity);
    final rect = Rect.fromCircle(center: center, radius: radius);
    final glow = Paint()
      ..shader = RadialGradient(
        colors: [
          AppColors.gold.withValues(alpha: 0.30 * intensity),
          AppColors.forest.withValues(alpha: 0.10 * intensity),
          Colors.transparent,
        ],
        stops: const [0.0, 0.55, 1.0],
      ).createShader(rect);
    canvas.drawRect(rect, glow);
  }

  @override
  bool shouldRepaint(covariant _GlowPainter old) =>
      old.intensity != intensity;
}
