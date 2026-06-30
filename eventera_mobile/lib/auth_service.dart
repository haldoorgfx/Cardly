import 'package:supabase_flutter/supabase_flutter.dart';

/// Thin wrapper over Supabase auth. Sessions persist automatically across
/// app launches (supabase_flutter handles token storage).
class AuthService {
  AuthService._();
  static final AuthService instance = AuthService._();

  SupabaseClient get _c => Supabase.instance.client;

  User? get currentUser => _c.auth.currentUser;
  bool get isSignedIn => currentUser != null;
  String? get email => currentUser?.email;

  /// Emits on sign-in / sign-out so the UI can react.
  Stream<AuthState> get authChanges => _c.auth.onAuthStateChange;

  Future<void> signIn({required String email, required String password}) async {
    await _c.auth.signInWithPassword(
      email: email.trim(),
      password: password,
    );
  }

  Future<void> signUp({
    required String email,
    required String password,
    String? fullName,
  }) async {
    await _c.auth.signUp(
      email: email.trim(),
      password: password,
      data: (fullName != null && fullName.trim().isNotEmpty)
          ? {'full_name': fullName.trim()}
          : null,
    );
  }

  Future<void> signOut() => _c.auth.signOut();

  /// Maps Supabase errors to friendly copy.
  static String friendlyError(Object e) {
    if (e is AuthException) {
      final m = e.message.toLowerCase();
      if (m.contains('invalid login')) {
        return 'Email or password is incorrect.';
      }
      if (m.contains('already registered') || m.contains('already exists')) {
        return 'That email is already registered. Try signing in.';
      }
      if (m.contains('password')) {
        return 'Password must be at least 6 characters.';
      }
      return e.message;
    }
    return 'Something went wrong. Please try again.';
  }
}
