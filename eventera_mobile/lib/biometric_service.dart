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
    }
  }

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

  /// Clear the opt-in flag (called on sign-out).
  Future<void> clear() => _storage.delete(key: _enabledKey);
}
