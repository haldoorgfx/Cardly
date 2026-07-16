// Converts a UTC instant (as stored on event_pages.starts_at etc.) into the
// event's own IANA zone, e.g. Africa/Djibouti or Europe/London. Without this,
// clock digits are read straight off the UTC DateTime — wrong for every event
// outside UTC, and silently WRONG (not just unlabeled) for zones that observe
// daylight saving (London, Paris, New York, Los Angeles — all present in the
// web event editor's timezone dropdown, lib/events/format.ts's TIMEZONES).
import 'package:timezone/timezone.dart' as tzdb;

/// Returns [utc] shifted into [zoneName]'s local wall-clock time. Falls back
/// to [utc] unchanged if [zoneName] is empty/unknown (keeps callers crash-free
/// on bad/legacy data instead of throwing). Null in, null out, so this can
/// drop straight into existing `HubDates.xxx(page.startsAt)` call sites.
DateTime? toEventZone(DateTime? utc, String? zoneName) {
  if (utc == null) return null;
  if (zoneName == null || zoneName.isEmpty) return utc;
  try {
    final loc = tzdb.getLocation(zoneName);
    return tzdb.TZDateTime.from(utc, loc);
  } catch (_) {
    return utc;
  }
}
