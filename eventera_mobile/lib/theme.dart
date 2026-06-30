import 'package:flutter/material.dart';

/// Eventera brand palette (from BRAND.md). Forest + cream.
class Brand {
  static const forest = Color(0xFF1F4D3A);
  static const forestDark = Color(0xFF163828);
  static const cream = Color(0xFFFAF6EE);
  static const surface = Color(0xFFFFFFFF);
  static const gold = Color(0xFFE8C57E);
  static const ink = Color(0xFF0F1F18);
  static const inkSoft = Color(0xFF3A4A42);
  static const muted = Color(0xFF6B7A72);
  static const border = Color(0xFFE5E0D4);
  static const success = Color(0xFF2D7A4F);
  static const danger = Color(0xFFB8423C);
}

ThemeData buildEventeraTheme() {
  return ThemeData(
    useMaterial3: true,
    scaffoldBackgroundColor: Brand.cream,
    colorScheme: ColorScheme.fromSeed(
      seedColor: Brand.forest,
      primary: Brand.forest,
      surface: Brand.cream,
    ),
    fontFamily: 'Roboto',
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Brand.surface,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Brand.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Brand.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Brand.forest, width: 2),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: Brand.forest,
        padding: const EdgeInsets.symmetric(vertical: 16),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
      ),
    ),
  );
}
