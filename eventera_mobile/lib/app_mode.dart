import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// One account, two experiences. The Airbnb model: no role choice at login, a
/// "Switch to organizing / attending" row in the profile, bidirectional and
/// persisted. `AppMode.current()` resolves the saved mode; [notifier] lets the
/// root gate re-root the app the instant the mode flips.
///
/// Fail-safe by design: any storage error resolves to [attendee]. The app is
/// attendee-first, so a broken read can never trap the user in organizer mode.
class AppMode {
  AppMode._();

  static const attendee = 'attendee';
  static const organizer = 'organizer';

  static const _key = 'app_mode';
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  /// Live mode. The root gate listens to this to pick the shell; writing here
  /// (via [setOrganizer] / [setAttendee]) re-roots the app immediately.
  static final ValueNotifier<String> notifier = ValueNotifier<String>(attendee);

  static bool get isOrganizer => notifier.value == organizer;

  /// Read the persisted mode. Also syncs [notifier]. Never throws — any error
  /// resolves to [attendee].
  static Future<String> current() async {
    try {
      final v = await _storage.read(key: _key);
      final mode = v == organizer ? organizer : attendee;
      notifier.value = mode;
      return mode;
    } catch (_) {
      notifier.value = attendee;
      return attendee;
    }
  }

  static Future<void> setOrganizer() => _set(organizer);
  static Future<void> setAttendee() => _set(attendee);

  static Future<void> _set(String mode) async {
    notifier.value = mode; // flip the UI first — persistence is best-effort.
    try {
      await _storage.write(key: _key, value: mode);
    } catch (_) {
      // Non-fatal: the mode still applies for this session.
    }
  }
}
