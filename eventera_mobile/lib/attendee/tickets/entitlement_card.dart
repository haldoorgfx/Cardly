import 'package:flutter/material.dart';

import '../../ui/components.dart';
import '../../ui/tokens.dart';
import 'entitlement_state.dart';

/// One held entitlement as a white card: a type icon, the name, the redemption
/// limit + computed state in plain words, and a state tag. Never green — an
/// available card reads with full ink; redeemed / expired / not-yet are muted.
class EntitlementCard extends StatelessWidget {
  final EntComputed data;
  const EntitlementCard(this.data, {super.key});

  @override
  Widget build(BuildContext context) {
    final e = data.entitlement;
    final active = data.status == EntStatus.available;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: AppColors.border),
        boxShadow: AppShadow.soft,
      ),
      child: Row(
        children: [
          _iconChip(e.type, active),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  e.name,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.h3.copyWith(
                      fontSize: 15.5,
                      color: active ? AppColors.ink : AppColors.inkMuted),
                ),
                const SizedBox(height: 3),
                Text(
                  _supporting(data),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.bodySm.copyWith(color: AppColors.inkMuted),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          _StateTag(data.status),
        ],
      ),
    );
  }

  Widget _iconChip(String type, bool active) {
    return Container(
      width: 44,
      height: 44,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: active ? AppColors.forestSoft : AppColors.creamSoft,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Icon(iconForType(type),
          size: 21, color: active ? AppColors.forest : AppColors.inkMuted),
    );
  }
}

/// Lucide-ish material glyph per entitlement type (matches the 065 CHECK set).
IconData iconForType(String type) {
  switch (type) {
    case 'entry':
      return Icons.login_rounded;
    case 'meal':
      return Icons.restaurant_rounded;
    case 'session':
      return Icons.co_present_rounded;
    case 'merch':
      return Icons.shopping_bag_outlined;
    case 'transport':
      return Icons.directions_bus_rounded;
    case 'parking':
      return Icons.local_parking_rounded;
    case 'certificate':
      return Icons.workspace_premium_outlined;
    case 'access':
    default:
      return Icons.badge_outlined;
  }
}

/// The one supporting line: always the limit in plain words, plus the state
/// detail (time it was redeemed / expired / opens) when the entitlement isn't
/// simply available.
String _supporting(EntComputed c) {
  final limit = entLimitWords(c.entitlement.limit);
  switch (c.status) {
    case EntStatus.available:
      return limit;
    case EntStatus.redeemed:
      final at = c.redeemedAt;
      if (at == null) return '$limit · Redeemed';
      final when = _sameDayLocal(at, DateTime.now())
          ? 'today at ${_time(at)}'
          : '${_monthDay(at)} at ${_time(at)}';
      return '$limit · Redeemed $when';
    case EntStatus.expired:
      final u = c.entitlement.validUntil;
      return u == null ? '$limit · Expired' : '$limit · Expired ${_monthDay(u)}';
    case EntStatus.notYetValid:
      final f = c.entitlement.validFrom;
      return f == null
          ? '$limit · Not yet valid'
          : '$limit · Opens ${_monthDay(f)}, ${_time(f)}';
  }
}

class _StateTag extends StatelessWidget {
  final EntStatus status;
  const _StateTag(this.status);

  @override
  Widget build(BuildContext context) {
    if (status == EntStatus.available) {
      return const Tag('Available', kind: TagKind.success, dot: true);
    }
    final label = switch (status) {
      EntStatus.redeemed => 'Redeemed',
      EntStatus.expired => 'Expired',
      EntStatus.notYetValid => 'Not yet',
      EntStatus.available => 'Available',
    };
    return Container(
      height: 24,
      padding: const EdgeInsets.symmetric(horizontal: 10),
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: AppColors.creamSoft,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: AppText.caption.copyWith(
            color: AppColors.inkMuted,
            fontWeight: FontWeight.w600,
            fontSize: 11.5,
            letterSpacing: 0.1),
      ),
    );
  }
}

const _months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

String _time(DateTime d) {
  final l = d.toLocal();
  final h = l.hour % 12 == 0 ? 12 : l.hour % 12;
  final m = l.minute.toString().padLeft(2, '0');
  final ap = l.hour < 12 ? 'AM' : 'PM';
  return '$h:$m $ap';
}

String _monthDay(DateTime d) {
  final l = d.toLocal();
  final now = DateTime.now();
  final base = '${_months[l.month - 1]} ${l.day}';
  return l.year == now.year ? base : '$base, ${l.year}';
}

bool _sameDayLocal(DateTime a, DateTime b) {
  final x = a.toLocal();
  final y = b.toLocal();
  return x.year == y.year && x.month == y.month && x.day == y.day;
}
