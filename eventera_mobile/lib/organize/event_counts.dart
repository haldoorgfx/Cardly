import '../net.dart';

/// Registered / checked-in counts for one event, or null when the numbers
/// couldn't be loaded (the UI shows a calm placeholder, never an exception).
class EventCounts {
  final int registered;
  final int checkedIn;
  const EventCounts(this.registered, this.checkedIn);

  int get rate =>
      registered == 0 ? 0 : ((checkedIn / registered) * 100).round();
}

/// Loads counts for many events in parallel via the `list_event_attendees`
/// RPC (the same source the door scanner uses, so numbers always agree).
/// Per-event failures resolve to null instead of throwing.
Future<Map<String, EventCounts?>> loadEventCounts(List<String> eventIds) async {
  final entries = await Future.wait(eventIds.map((id) async {
    try {
      final rows = await supa
          .rpc('list_event_attendees', params: {'p_event_id': id});
      final list = (rows as List);
      final checked = list.where((r) => asBool((r as Map)['checked_in'])).length;
      return MapEntry<String, EventCounts?>(
          id, EventCounts(list.length, checked));
    } catch (_) {
      return MapEntry<String, EventCounts?>(id, null);
    }
  }));
  return Map.fromEntries(entries);
}
