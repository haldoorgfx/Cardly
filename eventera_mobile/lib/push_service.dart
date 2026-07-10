import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

import 'net.dart';

/// Registers this device's FCM token in Supabase `user_devices` so the server
/// can deliver OS-level push. Own-row RLS means the signed-in user writes its
/// own row directly — no server round-trip needed to register.
///
/// Everything here is best-effort: push setup must never crash or block the app.
class PushService {
  PushService._();
  static final PushService instance = PushService._();

  bool _started = false;

  Future<void> init() async {
    if (_started) return;
    _started = true;
    try {
      final messaging = FirebaseMessaging.instance;
      // Prompt on iOS / Android 13+; a no-op on older Android.
      await messaging.requestPermission();

      // Save the current token (if signed in) and whenever it rotates.
      messaging.onTokenRefresh.listen(_save);
      final token = await messaging.getToken();
      if (kDebugMode) debugPrint('Push: FCM token = $token');
      if (token != null) await _save(token);

      // A token minted while signed out has no owner row — re-register on sign-in.
      supa.auth.onAuthStateChange.listen((data) async {
        if (data.session != null) {
          final t = await messaging.getToken();
          if (t != null) await _save(t);
        }
      });
    } catch (_) {
      // Never let push setup break startup.
    }
  }

  Future<void> _save(String token) async {
    final uid = currentUserId;
    if (uid == null) return; // RLS: can only write our own row
    try {
      await supa.from('user_devices').upsert(
        {
          'user_id': uid,
          'fcm_token': token,
          'platform': Platform.isIOS ? 'ios' : 'android',
          'updated_at': DateTime.now().toUtc().toIso8601String(),
        },
        onConflict: 'fcm_token',
      );
      if (kDebugMode) debugPrint('Push: registered device token for $uid');
    } catch (e) {
      // Best-effort — a failed upsert just means we retry next launch/refresh.
      if (kDebugMode) debugPrint('Push: token save failed: $e');
    }
  }
}
