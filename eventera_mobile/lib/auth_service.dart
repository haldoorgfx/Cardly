import 'package:flutter/foundation.dart' show kIsWeb;
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

  /// Send a one-time email code. Used as the verify-once step at signup and as
  /// a fallback for legacy magic-link users who have no password yet.
  Future<void> sendEmailCode(String email) async {
    await _c.auth.signInWithOtp(
      email: email.trim().toLowerCase(),
      shouldCreateUser: true,
    );
  }

  /// Verify the emailed code and establish a session.
  Future<void> verifyEmailCode({
    required String email,
    required String token,
  }) async {
    await _c.auth.verifyOTP(
      email: email.trim().toLowerCase(),
      token: token.trim(),
      type: OtpType.email,
    );
  }

  /// Set/replace the current user's password (verify-once → password later).
  /// Flags user_metadata.has_password so we can skip the set-password prompt on
  /// future code sign-ins.
  Future<void> setPassword(String password) async {
    await _c.auth.updateUser(
      UserAttributes(password: password, data: {'has_password': true}),
    );
  }

  /// True once this account has set a password (so we don't re-prompt).
  bool get hasPassword => currentUser?.userMetadata?['has_password'] == true;

  /// Continue with Google (same provider as the web app).
  /// Web: redirects to the current page. Mobile: opens a browser and returns
  /// via the `eventera://login-callback/` deep link. The session is completed
  /// automatically by supabase_flutter once the redirect lands.
  Future<void> signInWithGoogle() async {
    await _c.auth.signInWithOAuth(
      OAuthProvider.google,
      redirectTo: kIsWeb ? null : 'eventera://login-callback/',
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
