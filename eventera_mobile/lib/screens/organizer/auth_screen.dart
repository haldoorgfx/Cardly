import 'package:flutter/material.dart';

import '../../auth_service.dart';
import '../../theme.dart';

/// Organizer sign in / sign up. Toggles between the two modes.
class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _name = TextEditingController();

  bool _signUp = false;
  bool _busy = false;
  bool _googleBusy = false;
  String? _error;
  String? _notice;

  Future<void> _google() async {
    setState(() {
      _googleBusy = true;
      _error = null;
      _notice = null;
    });
    try {
      await AuthService.instance.signInWithGoogle();
      // On web this navigates away and back; on mobile the browser opens and
      // the session completes via the deep-link redirect (AuthGate reacts).
    } catch (e) {
      setState(() => _error = AuthService.friendlyError(e));
    } finally {
      if (mounted) setState(() => _googleBusy = false);
    }
  }

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    _name.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    final email = _email.text.trim();
    final pass = _password.text;
    if (email.isEmpty || !email.contains('@')) {
      setState(() => _error = 'Enter a valid email.');
      return;
    }
    if (pass.length < 6) {
      setState(() => _error = 'Password must be at least 6 characters.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
      _notice = null;
    });
    try {
      if (_signUp) {
        await AuthService.instance
            .signUp(email: email, password: pass, fullName: _name.text);
        // Some projects require email confirmation; if so there's no session yet.
        if (!AuthService.instance.isSignedIn && mounted) {
          setState(() {
            _signUp = false;
            _notice = 'Account created. Check your email to confirm, then sign in.';
          });
        }
      } else {
        await AuthService.instance.signIn(email: email, password: pass);
      }
      // On success the AuthGate (listening to auth changes) swaps to the dashboard.
    } catch (e) {
      setState(() => _error = AuthService.friendlyError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Brand.cream,
        surfaceTintColor: Brand.cream,
        elevation: 0,
        iconTheme: const IconThemeData(color: Brand.ink),
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(28),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(_signUp ? 'Create your account' : 'Organizer sign in',
                    style: const TextStyle(
                        color: Brand.ink,
                        fontSize: 24,
                        fontWeight: FontWeight.w700)),
                const SizedBox(height: 6),
                const Text('Manage your events and card designs.',
                    style: TextStyle(color: Brand.muted, fontSize: 14)),
                const SizedBox(height: 24),
                // Continue with Google — same provider as the web app.
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Brand.ink,
                      backgroundColor: Brand.surface,
                      side: const BorderSide(color: Brand.border),
                      padding: const EdgeInsets.symmetric(vertical: 15),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: _googleBusy ? null : _google,
                    icon: _googleBusy
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                                strokeWidth: 2.3, color: Brand.forest))
                        : Container(
                            width: 20,
                            height: 20,
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: Brand.cream,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Text('G',
                                style: TextStyle(
                                    color: Brand.forest,
                                    fontSize: 14,
                                    fontWeight: FontWeight.w800)),
                          ),
                    label: const Text('Continue with Google',
                        style: TextStyle(
                            fontSize: 15, fontWeight: FontWeight.w600)),
                  ),
                ),
                const SizedBox(height: 18),
                Row(
                  children: const [
                    Expanded(child: Divider(color: Brand.border)),
                    Padding(
                      padding: EdgeInsets.symmetric(horizontal: 10),
                      child: Text('or',
                          style: TextStyle(color: Brand.muted, fontSize: 13)),
                    ),
                    Expanded(child: Divider(color: Brand.border)),
                  ],
                ),
                const SizedBox(height: 18),
                if (_signUp) ...[
                  _label('Name'),
                  TextField(
                    controller: _name,
                    textCapitalization: TextCapitalization.words,
                    decoration: const InputDecoration(hintText: 'Your name'),
                  ),
                  const SizedBox(height: 16),
                ],
                _label('Email'),
                TextField(
                  controller: _email,
                  keyboardType: TextInputType.emailAddress,
                  autocorrect: false,
                  decoration: const InputDecoration(hintText: 'you@email.com'),
                ),
                const SizedBox(height: 16),
                _label('Password'),
                TextField(
                  controller: _password,
                  obscureText: true,
                  decoration: const InputDecoration(hintText: 'At least 6 characters'),
                  onSubmitted: (_) => _submit(),
                ),
                if (_notice != null) ...[
                  const SizedBox(height: 14),
                  _banner(_notice!, Brand.success, Icons.check_circle_outline),
                ],
                if (_error != null) ...[
                  const SizedBox(height: 14),
                  _banner(_error!, Brand.danger, Icons.error_outline),
                ],
                const SizedBox(height: 22),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: _busy ? null : _submit,
                    child: _busy
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                                strokeWidth: 2.5, color: Colors.white),
                          )
                        : Text(_signUp ? 'Create account' : 'Sign in'),
                  ),
                ),
                const SizedBox(height: 12),
                Center(
                  child: TextButton(
                    onPressed: _busy
                        ? null
                        : () => setState(() {
                              _signUp = !_signUp;
                              _error = null;
                              _notice = null;
                            }),
                    child: Text(
                      _signUp
                          ? 'Already have an account? Sign in'
                          : "New here? Create an account",
                      style: const TextStyle(color: Brand.forest),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _label(String t) => Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Text(t,
            style: const TextStyle(
                color: Brand.inkSoft,
                fontSize: 13.5,
                fontWeight: FontWeight.w600)),
      );

  Widget _banner(String text, Color color, IconData icon) => Container(
        padding: const EdgeInsets.all(13),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.10),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 18),
            const SizedBox(width: 8),
            Expanded(
              child: Text(text,
                  style: TextStyle(color: color, fontSize: 13.5, height: 1.4)),
            ),
          ],
        ),
      );
}
