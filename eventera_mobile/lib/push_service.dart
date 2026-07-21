import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

import 'attendee/app_shell.dart';
import 'main.dart';
import 'net.dart';
import 'screens/open_event_screen.dart';

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

      // Tapping a push should open the relevant screen — handle both a cold
      // start (app launched by the tap) and a background tap.
      final opened = await messaging.getInitialMessage();
      if (opened != null) {
        WidgetsBinding.instance.addPostFrameCallback((_) => _handleTap(opened));
      }
      FirebaseMessaging.onMessageOpenedApp.listen(_handleTap);

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

  /// Release this device's push token from the signed-out account.
  ///
  /// `user_devices` rows are keyed on `fcm_token` and only ever overwritten on
  /// the NEXT sign-in. Without this, a device that signs out and stays signed
  /// out keeps receiving the previous account's notifications indefinitely.
  /// Must be called BEFORE `supa.auth.signOut()` — RLS only lets us delete our
  /// own row, so once the session is gone the delete is rejected.
  Future<void> unregisterDevice() async {
    final uid = currentUserId;
    if (uid == null) return;
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token == null) return;
      await supa
          .from('user_devices')
          .delete()
          .eq('fcm_token', token)
          .eq('user_id', uid);
      if (kDebugMode) debugPrint('Push: released device token for $uid');
    } catch (e) {
      // Best-effort — a failed delete just means the old row lingers until the
      // next sign-in re-claims it.
      if (kDebugMode) debugPrint('Push: token release failed: $e');
    }
  }

  /// Routes a tapped push to the screen its `data.url` points at (the same
  /// action_url the in-app notification carries). Events open their page;
  /// anything else lands on the Tickets tab.
  void _handleTap(RemoteMessage message) {
    final url = message.data['url'];
    if (url is! String || url.isEmpty) return;
    final nav = appNavigatorKey.currentState;
    if (nav == null) return;

    for (final marker in const ['/e/', '/c/']) {
      if (url.contains(marker)) {
        final slug = _slugAfter(url, marker);
        if (slug.isNotEmpty) {
          nav.push(
              MaterialPageRoute(builder: (_) => OpenEventScreen(slug: slug)));
          return;
        }
      }
    }
    // Tickets / reminders / anything else → the Tickets tab.
    mainTab.value = 1;
  }

  String _slugAfter(String url, String marker) {
    final i = url.indexOf(marker);
    if (i < 0) return '';
    var rest = url.substring(i + marker.length);
    for (final sep in const ['/', '?', '#']) {
      final s = rest.indexOf(sep);
      if (s >= 0) rest = rest.substring(0, s);
    }
    return rest.trim();
  }
}
