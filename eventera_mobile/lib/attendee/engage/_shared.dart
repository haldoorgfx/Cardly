import 'package:flutter/material.dart';

import '../../theme.dart';

/// Small shared bits used across the engagement screens. New file, no shared
/// edits. Keeps each screen focused.

/// Manual month/day/time formatting (no intl package).
const _months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const _weekdays = [
  'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun',
];

/// "Mon, Jun 12" — local time.
String fmtDayLabel(DateTime dt) {
  final d = dt.toLocal();
  return '${_weekdays[d.weekday - 1]}, ${_months[d.month - 1]} ${d.day}';
}

/// "9:05 AM" — local time.
String fmtTime(DateTime dt) {
  final d = dt.toLocal();
  final h24 = d.hour;
  final ampm = h24 < 12 ? 'AM' : 'PM';
  var h = h24 % 12;
  if (h == 0) h = 12;
  final m = d.minute.toString().padLeft(2, '0');
  return '$h:$m $ampm';
}

/// "9:05 AM – 9:45 AM"
String fmtTimeRange(DateTime? start, DateTime? end) {
  if (start == null) return '';
  if (end == null) return fmtTime(start);
  return '${fmtTime(start)} – ${fmtTime(end)}';
}

/// A generic centered state for loading / empty / error.
class EngageState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget? action;
  const EngageState({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.action,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 44, color: Brand.muted),
            const SizedBox(height: 16),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w600,
                color: Brand.ink,
              ),
            ),
            if (subtitle != null) ...[
              const SizedBox(height: 8),
              Text(
                subtitle!,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 14, color: Brand.muted),
              ),
            ],
            if (action != null) ...[
              const SizedBox(height: 20),
              action!,
            ],
          ],
        ),
      ),
    );
  }
}

/// A "register to join" prompt shown when registrationId is null.
class RegisterPrompt extends StatelessWidget {
  final String message;
  const RegisterPrompt({super.key, this.message = 'Register for this event to join in'});

  @override
  Widget build(BuildContext context) {
    return EngageState(
      icon: Icons.how_to_reg_outlined,
      title: message,
      subtitle: 'Once you register, you can take part in this.',
    );
  }
}

/// Card surface used everywhere.
BoxDecoration engageCard() => BoxDecoration(
      color: Brand.surface,
      borderRadius: BorderRadius.circular(14),
      border: Border.all(color: Brand.border),
    );

void showEngageSnack(BuildContext context, String msg, {bool error = false}) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(msg),
      backgroundColor: error ? Brand.danger : Brand.forest,
      behavior: SnackBarBehavior.floating,
    ),
  );
}
