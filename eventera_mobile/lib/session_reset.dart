import 'attendee/event_context.dart';
import 'attendee/reg_store.dart';
import 'offline/event_cache.dart';
import 'offline/scan_queue.dart';
import 'offline/sync_controller.dart';

/// Wipe every piece of per-user state this app keeps outside Supabase.
///
/// Signing out only clears the Supabase session. Everything below is a
/// device-global singleton or an unscoped file on disk keyed by event — not by
/// user — so before this existed all of it survived a sign-out and was handed
/// straight to the next account on the device:
///
///  * [RegStore] / [EventContext] — the previous user's `registrationId` and
///    `qrToken`. Every engagement feature (agenda, polls, Q&A, networking,
///    feedback) keys off that id, so the new user acted *as the old one* and
///    could display their check-in QR.
///  * [ScanQueue] / [SyncController] — unsynced offline scans, which replay
///    through whatever session is live at reconnect. Staff A's scans would be
///    submitted under staff B's account.
///  * [EventCache] — downloaded attendee rosters (names, emails, QR tokens,
///    dietary notes) for an organizer's event.
///
/// Wired to `AuthChangeEvent.signedOut` in `root_gate.dart` so it covers every
/// sign-out path — the account menus, the biometric password fallback, and
/// account deletion — rather than needing a call at each site.
///
/// Best-effort and never throws: a cleanup failure must not strand the user in
/// a half-signed-out state.
///
/// NOT cleared here, deliberately — see the audit notes:
///  * `CardStore` (`card_store.dart`) — locally generated Eventera Cards are
///    device-global with no user id on `SavedCard`, so the next user sees the
///    previous user's cards. Wiping them on sign-out would permanently destroy
///    cards the owner may not be able to regenerate, so the correct fix is to
///    scope the store by user id, which changes the on-disk index format.
///    Flagged for a product decision rather than silently deleting user data.
Future<void> clearLocalUserState() async {
  EventContext.clear();

  // Stop the 25s reachability/replay poll before dropping the queue it drains,
  // so an in-flight tick can't re-persist what we just deleted.
  try {
    SyncController.instance.stop();
  } catch (_) {}

  for (final step in <Future<void> Function()>[
    RegStore.instance.clearAll,
    ScanQueue.instance.clearAll,
    EventCache.clearAll,
  ]) {
    try {
      await step();
    } catch (_) {
      // Keep going: one failing store must not skip the others.
    }
  }
}
