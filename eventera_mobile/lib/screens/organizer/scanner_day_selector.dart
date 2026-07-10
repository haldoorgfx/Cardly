// Multi-day scanner — day selector (G5 · M02).
//
// A horizontally scrollable row of day pills that sits on the scanner chrome
// (the only dark surface, MOBILE_DESIGN_LAW §8). It is PRESENTATIONAL only:
// the owning scanner loads `event_days`, resolves the per-day counts and the
// entitlement×day gate, and passes the selected `day_index` into the
// server-authoritative `redeem_entitlement` RPC. This file renders what it is
// given and reports taps back — it does ZERO eligibility logic of its own.
//
// If an event has no `event_days` rows the scanner renders none of this — a
// single-day event looks exactly as it did before this file existed.

import 'package:flutter/material.dart';

import '../../ui/tokens.dart';

/// One row of `public.event_days` (066_multi_day.sql).
class EventDay {
  final String id;
  final int dayIndex;
  final DateTime? date;
  final bool checkinEnabled;
  final int? capacity;

  const EventDay({
    required this.id,
    required this.dayIndex,
    required this.date,
    required this.checkinEnabled,
    this.capacity,
  });

  factory EventDay.fromMap(Map<String, dynamic> m) => EventDay(
        id: (m['id'] ?? '').toString(),
        dayIndex: (m['day_index'] is num)
            ? (m['day_index'] as num).toInt()
            : int.tryParse('${m['day_index']}') ?? 0,
        date: DateTime.tryParse((m['date'] ?? '').toString()),
        checkinEnabled: m['checkin_enabled'] != false,
        capacity: (m['capacity'] is num) ? (m['capacity'] as num).toInt() : null,
      );
}

const _months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

String _shortDate(DateTime? d) =>
    d == null ? '' : '${_months[d.month - 1]} ${d.day}';

/// The day selector: pill row + an optional one-line gate explainer beneath it.
class ScannerDaySelector extends StatelessWidget {
  final List<EventDay> days;
  final int? selectedDayIndex;
  final int? todayDayIndex;
  final Map<int, int> counts; // day_index -> net redemptions for selected mode
  final String? gateMessage; // set when the selected mode can't scan this day
  final ValueChanged<int> onSelect;

  const ScannerDaySelector({
    super.key,
    required this.days,
    required this.selectedDayIndex,
    required this.todayDayIndex,
    required this.counts,
    required this.gateMessage,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    if (days.isEmpty) return const SizedBox.shrink();
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SizedBox(
          height: 68,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: days.length,
            separatorBuilder: (_, __) => const SizedBox(width: 10),
            itemBuilder: (_, i) {
              final d = days[i];
              return _DayPill(
                day: d,
                selected: d.dayIndex == selectedDayIndex,
                isToday: d.dayIndex == todayDayIndex,
                count: counts[d.dayIndex],
                onTap: d.checkinEnabled ? () => onSelect(d.dayIndex) : null,
              );
            },
          ),
        ),
        if (gateMessage != null)
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 10, 20, 0),
            child: Row(
              children: [
                const Icon(Icons.block_rounded, size: 15, color: Colors.white70),
                const SizedBox(width: 7),
                Expanded(
                  child: Text(
                    gateMessage!,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.caption.copyWith(color: Colors.white70),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

class _DayPill extends StatelessWidget {
  final EventDay day;
  final bool selected;
  final bool isToday;
  final int? count;
  final VoidCallback? onTap; // null => check-in off for this day (disabled)

  const _DayPill({
    required this.day,
    required this.selected,
    required this.isToday,
    required this.count,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final disabled = onTap == null;

    final Color titleColor = disabled
        ? Colors.white54
        : selected
            ? Colors.white
            : Colors.white70;
    final Color subColor = disabled ? Colors.white54 : Colors.white70;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        constraints: const BoxConstraints(minWidth: 78),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
        decoration: BoxDecoration(
          color: selected ? AppColors.forestSurface : AppColors.forestCard,
          borderRadius: BorderRadius.circular(AppRadius.btn),
          border: Border.all(
            color: selected ? AppColors.gold : AppColors.forestSurface,
            width: selected ? 1.5 : 1,
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                // day_index is stored 0-based (web writes 0,1,2…) but is always
                // shown 1-based, matching the web day setup + attendance grid.
                Text('Day ${day.dayIndex + 1}',
                    style: AppText.bodyStrong.copyWith(color: titleColor, fontSize: 14)),
                if (isToday) ...[
                  const SizedBox(width: 6),
                  Container(
                    width: 6,
                    height: 6,
                    decoration:
                        const BoxDecoration(color: AppColors.gold, shape: BoxShape.circle),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 3),
            if (disabled)
              Text('Check-in off',
                  style: AppText.caption.copyWith(color: subColor))
            else
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (_shortDate(day.date).isNotEmpty) ...[
                    Text(_shortDate(day.date),
                        style: AppText.caption.copyWith(color: subColor)),
                    const SizedBox(width: 8),
                  ],
                  const Icon(Icons.check_rounded, size: 12, color: Colors.white70),
                  const SizedBox(width: 3),
                  Text('${count ?? 0}',
                      style: AppText.numSm.copyWith(
                          color: selected ? Colors.white : Colors.white70)),
                ],
              ),
          ],
        ),
      ),
    );
  }
}
