import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// A Supabase [LocalStorage] backed by [FlutterSecureStorage] (OS keychain on
/// iOS, EncryptedSharedPreferences / Keystore on Android).
///
/// This is what makes the persisted Supabase session — including the refresh
/// token — live in secure, OS-encrypted storage instead of plain
/// SharedPreferences. Supabase remains the source of truth: it reads/writes the
/// session here automatically, and a returning user's session is restored from
/// the keychain on launch (then gated behind biometrics, see BiometricGate).
class SecureSessionStorage extends LocalStorage {
  SecureSessionStorage();

  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  @override
  Future<void> initialize() async {}

  @override
  Future<String?> accessToken() => _storage.read(key: supabasePersistSessionKey);

  @override
  Future<bool> hasAccessToken() async {
    final v = await _storage.read(key: supabasePersistSessionKey);
    return v != null;
  }

  @override
  Future<void> persistSession(String persistSessionString) =>
      _storage.write(key: supabasePersistSessionKey, value: persistSessionString);

  @override
  Future<void> removePersistedSession() =>
      _storage.delete(key: supabasePersistSessionKey);
}
