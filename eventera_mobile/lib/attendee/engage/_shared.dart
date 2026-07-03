import 'package:flutter/material.dart';

import '../../ui/tokens.dart';
import '../../ui/components.dart';
import '../event_context.dart';
import '../reg_store.dart';

/// Resolves the registration id an engagement/networking screen should use.
///
/// The id passed down from the hub lives in memory (via [EventContext]) and is
/// null after an app restart. This falls back to the durable local [RegStore]
/// (keyed by event slug) so a guest who already registered isn't wrongly told
/// to "Register to participate". Returns null only when there is genuinely no
/// registration on this device.
Future<String?> effectiveRegId(String? passed, String eventId) async {
  if (passed != null && passed.isNotEmpty) return passed;
  final ctx = EventContext.current;
  if (ctx != null && ctx.eventId == eventId) {
    final inMem = ctx.registrationId;
    if (inMem != null && inMem.isNotEmpty) return inMem;
    if (ctx.slug.isNotEmpty) {
      final reg = await RegStore.instance.get(ctx.slug);
      final id = reg?.registrationId;
      if (id != null && id.isNotEmpty) return id;
    }
  }
  return null;
}

/// Small shared bits used across the engagement screens. Re-skinned to the
/// forest + cream design system (tokens.dart / components.dart). Exported
/// symbols are unchanged so the sibling screens keep compiling:
///   fmtDayLabel, fmtTime, fmtTimeRange, EngageState, RegisterPrompt,
///   engageCard, showEngageSnack.

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

/// A generic centered state for loading / empty / error. Now built on the
/// design-system [EmptyState] for a consistent forest-cream look.
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
        padding: const EdgeInsets.all(AppSpace.xxxl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 64,
              height: 64,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: AppColors.creamSoft,
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 28, color: AppColors.inkMuted),
            ),
            const SizedBox(height: AppSpace.base),
            Text(title, textAlign: TextAlign.center, style: AppText.h3),
            if (subtitle != null) ...[
              const SizedBox(height: 6),
              Text(subtitle!, textAlign: TextAlign.center, style: AppText.bodySm),
            ],
            if (action != null) ...[
              const SizedBox(height: AppSpace.lg),
              action!,
            ],
          ],
        ),
      ),
    );
  }
}

/// A "register to join" prompt shown when registrationId is null. Restyled,
/// not removed — the gating behaviour is preserved.
class RegisterPrompt extends StatelessWidget {
  final String message;
  const RegisterPrompt(
      {super.key, this.message = 'Register for this event to join in'});

  @override
  Widget build(BuildContext context) {
    return EngageState(
      icon: Icons.how_to_reg_outlined,
      title: message,
      subtitle: 'Once you register, you can take part in this.',
    );
  }
}

/// Card surface used everywhere. Now matches the design-system MCard look.
BoxDecoration engageCard() => BoxDecoration(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(AppRadius.card),
      border: Border.all(color: AppColors.border),
      boxShadow: AppShadow.soft,
    );

/// Toast — forest-dark surface, gold check, matching the design language.
void showEngageSnack(BuildContext context, String msg, {bool error = false}) {
  if (error) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: AppColors.danger,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        content: Row(children: [
          const Icon(Icons.error_outline, color: Colors.white, size: 18),
          const SizedBox(width: 10),
          Expanded(
              child: Text(msg,
                  style: AppText.bodySm.copyWith(color: Colors.white))),
        ]),
      ),
    );
    return;
  }
  showToast(context, msg);
}
