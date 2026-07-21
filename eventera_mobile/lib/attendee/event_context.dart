/// Lightweight in-memory context for the event the attendee is currently
/// viewing.
///
/// Set by [EventHubScreen] when an event loads, and updated by the registration
/// flow the moment a registration completes. Detail and engagement screens read
/// `EventContext.current?.registrationId` instead of threading the id through
/// every constructor — this keeps navigation simple and avoids wide refactors.
///
/// It is intentionally ephemeral (cleared when the app restarts); the durable
/// source of truth remains [RegStore] on disk and the `registrations` table.
class EventContext {
  static EventContext? current;

  final String eventId;
  final String slug;
  final String eventName;

  /// The attendee's registration id for this event, if they've registered.
  /// Unlocks engagement features (agenda, polls, Q&A, networking, feedback).
  String? registrationId;

  EventContext({
    required this.eventId,
    required this.slug,
    required this.eventName,
    this.registrationId,
  });

  /// Convenience: the registration id for [eventId] if it matches the current
  /// context, else null.
  static String? regIdFor(String eventId) {
    final c = current;
    if (c != null && c.eventId == eventId) return c.registrationId;
    return null;
  }

  /// Forget the current event context.
  ///
  /// [current] is a mutable static holding a `registrationId`. It survives a
  /// sign-out unless explicitly dropped, which would let the next account on
  /// this device act on the previous account's registration. Called from
  /// [clearLocalUserState].
  static void clear() {
    current = null;
  }
}
