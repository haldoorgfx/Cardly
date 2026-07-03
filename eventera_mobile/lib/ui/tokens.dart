import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Eventera attendee app — design tokens (from karta.css + mobile.css).
/// Forest + cream + gold. Light theme only, mobile-first.

class AppColors {
  // Forest
  static const forest = Color(0xFF1F4D3A);
  static const forestDark = Color(0xFF0D1F17);
  static const forestCard = Color(0xFF162D22);
  static const forestSurface = Color(0xFF1E3D2D);
  static const forestSoft = Color(0xFFE8EFEB);

  // Gold
  static const gold = Color(0xFFE8C57E);
  static const goldHover = Color(0xFFC9A45E);
  static const goldSoft = Color(0xFFF5E9CC);

  // Cream
  static const canvas = Color(0xFFFAF6EE); // app background (NOT white)
  static const surface = Color(0xFFFFFFFF); // cards, inputs, sheets
  static const creamSoft = Color(0xFFF0EDE8); // subtle fills, skeleton base
  static const border = Color(0xFFE5E0D4); // warm hairline
  static const borderStrong = Color(0xFFC9C3B1);

  // Ink
  static const ink = Color(0xFF0F1F18);
  static const inkSoft = Color(0xFF3A4A42);
  static const inkMuted = Color(0xFF6B7A72);

  // Status
  static const success = Color(0xFF2D7A4F);
  static const warning = Color(0xFFC97A2D);
  static const danger = Color(0xFFB8423C);
  static const info = Color(0xFF3A6B8C);

  // Hero / premium gradient
  static const heroGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF1F4D3A), Color(0xFF2A6A50), Color(0xFFE8C57E)],
    stops: [0.0, 0.6, 1.0],
  );
}

class AppRadius {
  static const card = 15.0;
  static const btn = 12.0;
  static const input = 12.0;
  static const sheet = 20.0;
  static const pill = 999.0;
}

class AppShadow {
  static const soft = [
    BoxShadow(color: Color(0x0A0F1F18), blurRadius: 2, offset: Offset(0, 1)),
    BoxShadow(color: Color(0x0F0F1F18), blurRadius: 24, offset: Offset(0, 8)),
  ];
  static const lift = [
    BoxShadow(color: Color(0x140F1F18), blurRadius: 12, offset: Offset(0, 4)),
    BoxShadow(color: Color(0x1F1F4D3A), blurRadius: 60, offset: Offset(0, 24)),
  ];
  static const tabbar = [
    BoxShadow(color: Color(0x0D0F1F18), blurRadius: 20, offset: Offset(0, -4)),
  ];
  static List<BoxShadow> get ring => const [
        BoxShadow(color: Color(0x261F4D3A), blurRadius: 0, spreadRadius: 3),
      ];
}

class AppSpace {
  static const xs = 4.0;
  static const sm = 8.0;
  static const md = 12.0;
  static const base = 16.0;
  static const lg = 20.0; // screen padding
  static const xl = 24.0;
  static const xxl = 28.0;
  static const xxxl = 32.0;
}

/// Type scale. DM Sans (display), Inter (body), JetBrains Mono (numbers).
class AppText {
  // Headings — Plus Jakarta Sans (modern geometric sans).
  static TextStyle _dm(double size, FontWeight w,
          {double ls = -0.02, double? h, Color? c}) =>
      GoogleFonts.plusJakartaSans(
          fontSize: size,
          fontWeight: w,
          letterSpacing: size * ls,
          height: h,
          color: c ?? AppColors.ink);
  // Body — Inter.
  static TextStyle _inter(double size, FontWeight w,
          {double ls = 0, double? h, Color? c}) =>
      GoogleFonts.inter(
          fontSize: size,
          fontWeight: w,
          letterSpacing: ls,
          height: h,
          color: c ?? AppColors.ink);
  // Numbers/labels use Inter too — no monospace anywhere.
  static TextStyle _num(double size, FontWeight w, {Color? c}) =>
      GoogleFonts.inter(
          fontSize: size,
          fontWeight: w,
          letterSpacing: 0,
          color: c ?? AppColors.ink);

  // Display / headings (DM Sans) — mobile-first: larger + bolder hierarchy.
  static TextStyle get h1 => _dm(30, FontWeight.w800, h: 1.05);
  static TextStyle get h2 => _dm(23, FontWeight.w700);
  static TextStyle get h3 => _dm(18, FontWeight.w700, ls: -0.01);
  static TextStyle get title => _dm(18, FontWeight.w700); // app bar
  static TextStyle get subhead => _dm(17, FontWeight.w500, ls: 0, h: 1.4);
  static TextStyle get displayMd => _dm(26, FontWeight.w600, ls: -0.015);

  // Body (Inter) — 16px base reads native on phones (was web-sized 15).
  static TextStyle get body =>
      _inter(16, FontWeight.w400, h: 1.55, c: AppColors.inkSoft);
  static TextStyle get bodyStrong => _inter(16, FontWeight.w600);
  static TextStyle get bodySm =>
      _inter(14, FontWeight.w400, h: 1.5, c: AppColors.inkSoft);
  static TextStyle get caption =>
      _inter(12.5, FontWeight.w500, ls: 0.24, c: AppColors.inkMuted);
  static TextStyle get seclab => _inter(11.5, FontWeight.w700,
      ls: 0.4, c: AppColors.inkMuted); // section label (subtle tracking)
  static TextStyle get label =>
      _inter(13.5, FontWeight.w600, c: AppColors.inkSoft);

  // Numbers (Inter — no monospace)
  static TextStyle get numLg => _num(32, FontWeight.w700);
  static TextStyle get numMd => _num(16, FontWeight.w600);
  static TextStyle get numSm => _num(13.5, FontWeight.w500);
  static TextStyle get btn => _dm(16.5, FontWeight.w700, ls: -0.01);
}

/// App-wide ThemeData wired to the tokens.
ThemeData buildAppTheme() {
  final base = ThemeData(useMaterial3: true);
  return base.copyWith(
    scaffoldBackgroundColor: AppColors.canvas,
    colorScheme: ColorScheme.fromSeed(
      seedColor: AppColors.forest,
      primary: AppColors.forest,
      surface: AppColors.canvas,
    ),
    textTheme: GoogleFonts.interTextTheme(base.textTheme).apply(
      bodyColor: AppColors.ink,
      displayColor: AppColors.ink,
    ),
    splashFactory: InkRipple.splashFactory,
    // Native transitions: keep Flutter's platform defaults — the modern Zoom
    // transition on Android (+ system back-swipe) and Cupertino slide on iOS.
    pageTransitionsTheme: const PageTransitionsTheme(
      builders: {
        TargetPlatform.android: ZoomPageTransitionsBuilder(),
        TargetPlatform.iOS: ZoomPageTransitionsBuilder(),
      },
    ),
  );
}

/// App-wide scroll feel: momentum + rubber-band overscroll (like a real
/// native app) instead of Android's default clamped glow.
class AppScrollBehavior extends MaterialScrollBehavior {
  const AppScrollBehavior();

  @override
  ScrollPhysics getScrollPhysics(BuildContext context) =>
      const BouncingScrollPhysics(
        parent: AlwaysScrollableScrollPhysics(),
      );

  @override
  Widget buildOverscrollIndicator(
    BuildContext context,
    Widget child,
    ScrollableDetails details,
  ) =>
      child; // bounce replaces the glow indicator
}
