import 'package:flutter/material.dart';

import '../ui/components.dart';
import '../ui/tokens.dart';
import 'auth/attendee_auth_screen.dart';

/// Shown when a guest taps "Get ticket". Registering itself never requires an
/// account (guest checkout — name + email is enough, same as the web app), but
/// signing in first means the ticket, QR, and Eventera Card are tied to an
/// account instead of just this device, so they're recoverable later and on
/// other devices.
///
/// Returns:
///  - `true`  — the attendee signed in; the caller should proceed straight
///    into registration (pre-filled from their profile).
///  - `false` — "Continue as guest"; proceed with the existing anonymous flow.
///  - `null`  — dismissed without choosing; the caller should not proceed.
Future<bool?> showSignInPromptSheet(BuildContext context) async {
  final choice = await showModalBottomSheet<String>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => const _SignInPromptSheet(),
  );
  if (choice == 'guest') return false;
  if (choice == 'signin') {
    if (!context.mounted) return null;
    final signedIn = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => const AttendeeAuthScreen()),
    );
    // Only a completed sign-in continues automatically. Backing out of the
    // auth screen without finishing is a change of mind, not "continue as
    // guest" — don't silently fall through to registration either way.
    return signedIn == true ? true : null;
  }
  return null;
}

class _SignInPromptSheet extends StatelessWidget {
  const _SignInPromptSheet();

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Container(
        margin: const EdgeInsets.fromLTRB(12, 0, 12, 12),
        padding: const EdgeInsets.fromLTRB(22, 14, 22, 22),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.sheet),
          boxShadow: AppShadow.lift,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Container(
              width: 46,
              height: 46,
              decoration: BoxDecoration(
                color: AppColors.forestSoft,
                borderRadius: BorderRadius.circular(13),
              ),
              child: const Icon(Icons.confirmation_number_outlined,
                  color: AppColors.forest, size: 24),
            ),
            const SizedBox(height: 16),
            Text('Sign in to get your ticket', style: AppText.h2),
            const SizedBox(height: 6),
            Text(
              'Your ticket, QR code, and Eventera Card stay with your account — '
              'so they\'re there whenever and wherever you check.',
              style: AppText.bodySm.copyWith(color: AppColors.inkMuted, height: 1.45),
            ),
            const SizedBox(height: 22),
            MButton(
              'Sign in or create account',
              kind: MBtnKind.forest,
              icon: Icons.login,
              onTap: () => Navigator.of(context).pop('signin'),
            ),
            const SizedBox(height: 10),
            MButton(
              'Continue as guest',
              kind: MBtnKind.text,
              onTap: () => Navigator.of(context).pop('guest'),
            ),
          ],
        ),
      ),
    );
  }
}
