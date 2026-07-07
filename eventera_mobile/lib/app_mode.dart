import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// App-level mode: the one switch that decides which bottom-nav shell the app
/// shows. Attend = Discover · Tickets · Cards · Account. Organize = Events ·
/// Attendees · Scan · Stats · Profile. Flipped from the Profile/Account tab
/// (O12 mode switch) and persisted so the app reopens on the side you use.
enum AppMode { attend, organize }

/// Single source of truth. RootGate listens and swaps the whole shell.
final ValueNotifier<AppMode> appMode = ValueNotifier<AppMode>(AppMode.attend);

const _storage = FlutterSecureStorage();
const _kModeKey = 'eventera_app_mode';

/// Restore the last-used mode at startup. Never throws — any problem just
/// leaves the app in Attend mode.
Future<void> restoreAppMode({required bool signedIn}) async {
  try {
    final raw = await _storage.read(key: _kModeKey);
    // Organize mode only makes sense signed-in; guests always land on Attend.
    if (raw == 'organize' && signedIn) {
      appMode.value = AppMode.organize;
    }
  } catch (_) {/* stay on attend */}
}

/// Flip the mode and remember it for next launch.
Future<void> setAppMode(AppMode mode) async {
  appMode.value = mode;
  try {
    await _storage.write(
        key: _kModeKey, value: mode == AppMode.organize ? 'organize' : 'attend');
  } catch (_) {/* persistence is best-effort */}
}
