import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../ics_export.dart';
import '../ui/components.dart';
import '../ui/tokens.dart';

/// Shared "Add to calendar" bottom sheet (G7 / K01).
///
/// One implementation used by both the registration confirmation screen and the
/// ticket detail screen. Offers Google · Outlook · Apple · .ics:
///  - Google + Outlook open the provider's compose flow in the browser
///    (`url_launcher`, already a dependency).
///  - Apple + .ics share the generated `.ics` via the system share sheet
///    (`ics_export.dart` → `share_plus`, already a dependency).
///
/// [uid] should be `eventera-<slug>@eventera` so the file matches the web output
/// for the same event. No new dependencies are introduced.
Future<void> showAddToCalendarSheet(
  BuildContext context, {
  required String title,
  DateTime? start,
  DateTime? end,
  String? location,
  String? description,
  String? url,
  String? uid,
}) {
  final details = <String>[
    if (description != null && description.trim().isNotEmpty) description.trim(),
    if (url != null && url.trim().isNotEmpty) url.trim(),
  ].join('\n\n');

  Future<void> openUri(BuildContext sheetCtx, Uri uri) async {
    Navigator.of(sheetCtx).pop();
    try {
      final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!ok && context.mounted) {
        showToast(context, 'Could not open calendar.');
      }
    } catch (_) {
      if (context.mounted) showToast(context, 'Could not open calendar.');
    }
  }

  Future<void> shareIcs(BuildContext sheetCtx) async {
    Navigator.of(sheetCtx).pop();
    try {
      await exportEventToCalendar(
        title: title,
        start: start,
        end: end,
        location: location,
        description: description,
        url: url,
        uid: uid,
      );
    } catch (_) {
      if (context.mounted) showToast(context, 'Could not export to calendar.');
    }
  }

  return showMSheet(
    context,
    Builder(
      builder: (sheetCtx) => Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Add to calendar', style: AppText.h3),
          const SizedBox(height: 8),
          _CalRow(
            icon: Icons.event_available_outlined,
            label: 'Google Calendar',
            onTap: () => openUri(
                sheetCtx, _googleUri(title, start, end, location, details)),
          ),
          _CalRow(
            icon: Icons.event_outlined,
            label: 'Outlook',
            onTap: () => openUri(
                sheetCtx, _outlookUri(title, start, end, location, details)),
          ),
          _CalRow(
            icon: Icons.apple,
            label: 'Apple Calendar',
            onTap: () => shareIcs(sheetCtx),
          ),
          _CalRow(
            icon: Icons.download_outlined,
            label: 'Download .ics file',
            onTap: () => shareIcs(sheetCtx),
          ),
        ],
      ),
    ),
  );
}

/// RFC-5545 UTC stamp: `yyyyMMddTHHmmssZ`.
String _utcStamp(DateTime d) {
  final u = d.toUtc();
  String two(int n) => n.toString().padLeft(2, '0');
  return '${u.year.toString().padLeft(4, '0')}${two(u.month)}${two(u.day)}'
      'T${two(u.hour)}${two(u.minute)}${two(u.second)}Z';
}

/// Events without an end default to a 2-hour block (matches web + ics_export).
DateTime _end(DateTime start, DateTime? end) =>
    end ?? start.add(const Duration(hours: 2));

Uri _googleUri(
    String title, DateTime? start, DateTime? end, String? location, String details) {
  final params = <String, String>{
    'action': 'TEMPLATE',
    'text': title,
    if (start != null)
      'dates': '${_utcStamp(start)}/${_utcStamp(_end(start, end))}',
    if (location != null && location.trim().isNotEmpty) 'location': location.trim(),
    if (details.isNotEmpty) 'details': details,
  };
  return Uri.https('calendar.google.com', '/calendar/render', params);
}

Uri _outlookUri(
    String title, DateTime? start, DateTime? end, String? location, String details) {
  final params = <String, String>{
    'path': '/calendar/action/compose',
    'rru': 'addevent',
    'subject': title,
    if (start != null) 'startdt': start.toUtc().toIso8601String(),
    if (start != null) 'enddt': _end(start, end).toUtc().toIso8601String(),
    if (location != null && location.trim().isNotEmpty) 'location': location.trim(),
    if (details.isNotEmpty) 'body': details,
  };
  return Uri.https(
      'outlook.live.com', '/calendar/0/deeplink/compose', params);
}

class _CalRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _CalRow({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 14),
        child: Row(
          children: [
            Icon(icon, size: 21, color: AppColors.forest),
            const SizedBox(width: 14),
            Text(label, style: AppText.bodyStrong),
          ],
        ),
      ),
    );
  }
}
