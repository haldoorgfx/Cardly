import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:local_auth/local_auth.dart';

/// Device-biometric unlock for a returning user's stored Supabase session.
///
/// SECURITY MODEL
/// ──────────────
/// • The session (incl. refresh token) is persisted by supabase_flutter into
///   [SecureSessionStorage] — the OS keychain / EncryptedSharedPreferences.
/// • Biometrics are a LOCAL GATE on top of that stored session. We never store
///   a password or token behind the biometric ourselves; local_auth only tells
///   us "the device owner authenticated" (true/false). It never returns the
///   fingerprint or Face data.
/// • The only thing we persist here is a single boolean flag
///   ("biometric_enabled") in secure storage, set when the user opts in.
/// • Supabase stays the source of truth: on unlock we simply reveal the already
///   restored session; on failure the user falls back to password/PIN sign-in.
class BiometricService {
  BiometricService._();
  static final BiometricService instance = BiometricService._();

  final LocalAuthentication _auth = LocalAuthentication();
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );
  static const _enabledKey = 'biometric_enabled';
  // The Supabase refresh token, stashed behind the biometric so we can restore
  // the session (supa.auth.setSession) after a fingerprint/face scan even when
  // Supabase's own session has expired/cleared and the login page would show.
  static const _tokenKey = 'biometric_refresh_token';

  /// Whether this device can do biometric / device-credential unlock at all —
  /// used to show the setup toggle and the post-login offer.
  ///
  /// We rely on isDeviceSupported() (+ canCheckBiometrics as a fallback signal)
  /// and deliberately DO NOT require getAvailableBiometrics() to be non-empty:
  /// that call is flaky on many Android devices (notably Samsung), returning an
  /// empty list even when a fingerprint/face is enrolled — which was hiding the
  /// entire feature. authenticate() still gates the real unlock, so a device
  /// with nothing enrolled simply fails/falls back gracefully at that point.
  Future<bool> isAvailable() async {
    try {
      final supported = await _auth.isDeviceSupported();
      if (supported) return true;
      // Some devices report false for isDeviceSupported but true here.
      return await _auth.canCheckBiometrics;
    } on PlatformException {
      return false;
    } catch (_) {
      return false;
    }
  }

  /// Best-effort: true if the user actually has a fingerprint/face enrolled.
  /// Used only for guidance copy — never to hide the feature.
  Future<bool> hasEnrolledBiometrics() async {
    try {
      final types = await _auth.getAvailableBiometrics();
      return types.isNotEmpty;
    } catch (_) {
      return false;
    }
  }

  /// Whether the user has turned biometric unlock on for this device.
  Future<bool> isEnabled() async {
    final v = await _storage.read(key: _enabledKey);
    return v == 'true';
  }

  Future<void> setEnabled(bool enabled) async {
    if (enabled) {
      await _storage.write(key: _enabledKey, value: 'true');
    } else {
      await _storage.delete(key: _enabledKey);
      await _storage.delete(key: _tokenKey);
    }
  }

  /// Stash the current Supabase refresh token behind the biometric. Called when
  /// the user enables unlock and whenever the token rotates, so biometric login
  /// keeps working across restarts. No-op for a null/empty token.
  Future<void> saveToken(String? refreshToken) async {
    if (refreshToken == null || refreshToken.isEmpty) {
      if (kDebugMode) debugPrint('Biometric: saveToken skipped (no token)');
      return;
    }
    await _storage.write(key: _tokenKey, value: refreshToken);
    if (kDebugMode) {
      debugPrint('Biometric: stashed refresh token (${refreshToken.length} chars)');
    }
  }

  /// The stashed refresh token, if any — used to restore the session after a
  /// successful scan on the login screen.
  Future<String?> readToken() => _storage.read(key: _tokenKey);

  /// Drop just the stashed token (e.g. it expired) while leaving biometric
  /// enabled, so the next successful sign-in re-stashes a fresh one.
  Future<void> clearToken() => _storage.delete(key: _tokenKey);

  /// Prompt the OS biometric sheet. Returns true only if the device owner
  /// authenticated. Any error (no hardware, cancelled, lockout) returns false
  /// so the caller can fall back to password/PIN.
  Future<bool> authenticate({
    String reason = 'Unlock Eventera',
  }) async {
    try {
      return await _auth.authenticate(
        localizedReason: reason,
        options: const AuthenticationOptions(
          biometricOnly: false, // allow device passcode as a fallback
          stickyAuth: true,
          useErrorDialogs: true,
        ),
      );
    } on PlatformException {
      return false;
    } catch (_) {
      return false;
    }
  }

  /// Clear the opt-in flag AND the stashed token (called on sign-out).
  Future<void> clear() async {
    await _storage.delete(key: _enabledKey);
    await _storage.delete(key: _tokenKey);
  }
}
