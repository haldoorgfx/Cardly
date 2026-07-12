import 'dart:io';

import 'package:add_2_calendar/add_2_calendar.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

/// Adds an event to the device's calendar directly — no chooser, no browser, no
/// .ics prompt. Uses the native "add event" intent (Android CalendarContract /
/// iOS EventKit), which opens whatever calendar app the device uses (Samsung
/// Calendar, Google Calendar, Apple Calendar…) pre-filled. Only if that isn't
/// available do we fall back to handing off the .ics via the share sheet.
///
/// Callers should wrap this in try/catch and surface a toast on failure.
Future<void> addEventToCalendar({
  required String title,
  DateTime? start,
  DateTime? end,
  String? location,
  String? description,
  String? url,
}) async {
  final startDate = start ?? DateTime.now();
  final endDate = end ?? startDate.add(const Duration(hours: 2));
  final desc = <String>[
    if (description != null && description.trim().isNotEmpty) description.trim(),
    if (url != null && url.trim().isNotEmpty) url.trim(),
  ].join('\n\n');

  try {
    final ok = await Add2Calendar.addEvent2Cal(Event(
      title: title,
      description: desc,
      location:
          (location != null && location.trim().isNotEmpty) ? location.trim() : '',
      startDate: startDate,
      endDate: endDate,
    ));
    if (ok) return;
  } catch (_) {
    // Fall through to the .ics hand-off below.
  }
  await exportEventToCalendar(
    title: title,
    start: start,
    end: end,
    location: location,
    description: description,
    url: url,
  );
}

/// Builds a VCALENDAR/VEVENT .ics string and opens the OS share sheet so the
/// user can add the event to their calendar app ("Add to Calendar" appears in
/// the iOS/Android share sheet for .ics files).
///
/// If [start] is null, DTSTART defaults to now and DTEND is omitted.
/// If [end] is null (but [start] is set), DTEND defaults to start + 2 hours.
///
/// Callers should wrap this in try/catch and surface a toast on failure.
Future<void> exportEventToCalendar({
  required String title,
  DateTime? start,
  DateTime? end,
  String? location,
  String? description,
  String? url,
}) async {
  final now = DateTime.now().toUtc();
  final dtStamp = _formatUtc(now);

  final DateTime startUtc = (start ?? DateTime.now()).toUtc();
  // Only emit DTEND when we have a real start, or when an explicit end exists.
  DateTime? endUtc;
  if (start != null) {
    endUtc = (end ?? start.add(const Duration(hours: 2))).toUtc();
  } else if (end != null) {
    endUtc = end.toUtc();
  }

  final uid = 'eventera-${now.millisecondsSinceEpoch}@eventera.so';

  // Fold the event URL into the description so calendar apps that ignore the
  // URL property still surface the link.
  final descParts = <String>[
    if (description != null && description.trim().isNotEmpty) description.trim(),
    if (url != null && url.trim().isNotEmpty) url.trim(),
  ];
  final fullDescription = descParts.join('\n\n');

  final lines = <String>[
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Eventera//Eventera Mobile//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    'UID:$uid',
    'DTSTAMP:$dtStamp',
    'DTSTART:${_formatUtc(startUtc)}',
    if (endUtc != null) 'DTEND:${_formatUtc(endUtc)}',
    'SUMMARY:${_escape(title)}',
    if (location != null && location.trim().isNotEmpty)
      'LOCATION:${_escape(location)}',
    if (fullDescription.isNotEmpty)
      'DESCRIPTION:${_escape(fullDescription)}',
    if (url != null && url.trim().isNotEmpty) 'URL:${_escape(url.trim())}',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  // RFC 5545 requires CRLF line endings.
  final ics = '${lines.join('\r\n')}\r\n';

  final dir = await getTemporaryDirectory();
  final file = File('${dir.path}/event.ics');
  await file.writeAsString(ics);

  await Share.shareXFiles(
    [XFile(file.path, mimeType: 'text/calendar')],
    subject: title,
  );
}

/// Formats a [DateTime] as an RFC 5545 UTC timestamp: yyyyMMddTHHmmssZ.
String _formatUtc(DateTime d) {
  final u = d.toUtc();
  String two(int n) => n.toString().padLeft(2, '0');
  return '${u.year.toString().padLeft(4, '0')}'
      '${two(u.month)}${two(u.day)}'
      'T'
      '${two(u.hour)}${two(u.minute)}${two(u.second)}'
      'Z';
}

/// Escapes text per RFC 5545: backslash, comma, semicolon, and newlines.
String _escape(String input) {
  return input
      .replaceAll('\\', '\\\\')
      .replaceAll(';', '\\;')
      .replaceAll(',', '\\,')
      .replaceAll('\r\n', '\\n')
      .replaceAll('\n', '\\n')
      .replaceAll('\r', '\\n');
}
