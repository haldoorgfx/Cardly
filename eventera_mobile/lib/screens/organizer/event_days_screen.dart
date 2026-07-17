import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../net.dart';
import '../../ui/components.dart';
import '../../ui/tokens.dart';
import '../../organize/organizer_api.dart';

/// Organizer multi-day setup (web parity: /events/[id]/settings/days).
/// Turn an event into a multi-day one: give each day its own date, check-in
/// toggle, capacity, and which entitlements are valid that day. Leave empty
/// for a single-day event. Writes go straight to `event_days` /
/// `event_day_entitlements` under `can_manage_event()` RLS — same
/// direct-Supabase pattern the rest of the organizer app uses.
class EventDaysScreen extends StatefulWidget {
  final String eventId;
  final String eventName;

  const EventDaysScreen({
    super.key,
    required this.eventId,
    required this.eventName,
  });

  @override
  State<EventDaysScreen> createState() => _EventDaysScreenState();
}

class _EventDay {
  final String id;
  final int dayIndex;
  DateTime? date;
  bool checkinEnabled;
  int? capacity;
  List<String> entitlementIds;

  _EventDay({
    required this.id,
    required this.dayIndex,
    required this.date,
    required this.checkinEnabled,
    required this.capacity,
    required this.entitlementIds,
  });
}

class _Entitlement {
  final String id;
  final String name;
  final String type;
  _Entitlement({required this.id, required this.name, required this.type});
}

class _EventDaysScreenState extends State<EventDaysScreen> {
  final _org = const OrganizerApi();
  bool _loading = true;
  String? _error;
  StatusReason _errorReason = StatusReason.generic;
  List<_EventDay> _days = [];
  List<_Entitlement> _entitlements = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final dayRows = await _org.loadEventDays(widget.eventId);
      final entRows = await _org.loadEventEntitlements(widget.eventId);
      final dayIds = dayRows.map((d) => asString(d['id'])).toList();
      final links = await _org.loadDayEntitlementLinks(dayIds);

      if (!mounted) return;
      setState(() {
        _entitlements = entRows
            .map((e) => _Entitlement(
                  id: asString(e['id']),
                  name: asString(e['name'], 'Entitlement'),
                  type: asString(e['type']),
                ))
            .toList();
        _days = dayRows
            .map((d) => _EventDay(
                  id: asString(d['id']),
                  dayIndex: asInt(d['day_index']),
                  date: asDate(d['date']),
                  checkinEnabled: asBool(d['checkin_enabled']),
                  capacity: d['capacity'] == null ? null : asInt(d['capacity']),
                  entitlementIds: links[asString(d['id'])] ?? [],
                ))
            .toList();
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      final msg = describeError(e, context: 'this event\'s days');
      setState(() {
        _error = msg;
        _errorReason = msg.toLowerCase().contains("couldn't reach the server")
            ? StatusReason.network
            : StatusReason.generic;
        _loading = false;
      });
    }
  }

  Future<void> _addDay() async {
    HapticFeedback.selectionClick();
    try {
      await _org.addEventDay(widget.eventId);
      await _load();
    } catch (e) {
      if (mounted) {
        showToast(context, describeError(e, context: 'the new day'),
            type: ToastType.error);
      }
    }
  }

  Future<void> _editDay(_EventDay day) async {
    final saved = await showMSheet<bool>(
      context,
      _DayEditSheet(
        day: day,
        entitlements: _entitlements,
        org: _org,
      ),
    );
    if (saved == true) await _load();
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: const MAppBar(title: 'Event days', hairline: true),
      body: _body(),
      bottomBar: (!_loading && _error == null)
          ? StickyCta(children: [
              Expanded(
                child: MButton('Add a day',
                    icon: Icons.add, kind: MBtnKind.sec, onTap: _addDay),
              ),
            ])
          : null,
    );
  }

  Widget _body() {
    if (_loading) return const LoadingState();
    if (_error != null) {
      return ErrorStateView(
          message: _error!, onRetry: _load, reason: _errorReason);
    }

    return RefreshIndicator(
      color: AppColors.forest,
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(
            AppSpace.lg, AppSpace.base, AppSpace.lg, AppSpace.xxxl),
        children: [
          Text(
            'Turn ${widget.eventName} into a multi-day event. Give each day its '
            'own date, check-in toggle and capacity, and choose which '
            'entitlements are valid that day. Leave it empty for a '
            'single-day event.',
            style: AppText.bodySm,
          ),
          const SizedBox(height: AppSpace.xl),
          if (_days.isEmpty)
            const Padding(
              padding: EdgeInsets.only(top: 40),
              child: EmptyState(
                icon: Icons.calendar_view_day_outlined,
                title: 'Single-day event',
                message: 'Add a day to give this event its own multi-day schedule.',
              ),
            )
          else
            for (final day in _days) ...[
              _dayCard(day),
              const SizedBox(height: 10),
            ],
        ],
      ),
    );
  }

  Widget _dayCard(_EventDay day) {
    final entNames = day.entitlementIds
        .map((id) => _entitlements.where((e) => e.id == id).firstOrNull?.name)
        .whereType<String>()
        .toList();
    return GestureDetector(
      onTap: () => _editDay(day),
      child: Container(
        padding: const EdgeInsets.all(AppSpace.base),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.card),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: AppColors.forestSoft,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text('${day.dayIndex + 1}',
                  style: AppText.h3.copyWith(color: AppColors.forest, fontSize: 17)),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Day ${day.dayIndex + 1}', style: AppText.bodyStrong),
                  const SizedBox(height: 2),
                  Text(
                    day.date != null
                        ? _fmtDate(day.date!)
                        : 'No date set',
                    style: AppText.bodySm.copyWith(color: AppColors.inkMuted),
                  ),
                  if (entNames.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: entNames
                          .map((n) => Tag(n, kind: TagKind.gold))
                          .toList(),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Icon(
                  day.checkinEnabled ? Icons.qr_code_scanner : Icons.qr_code_scanner_outlined,
                  size: 16,
                  color: day.checkinEnabled ? AppColors.forest : AppColors.inkMuted,
                ),
                const SizedBox(height: 4),
                if (day.capacity != null)
                  Text('${day.capacity} cap',
                      style: AppText.caption.copyWith(color: AppColors.inkMuted)),
              ],
            ),
            const SizedBox(width: 4),
            const Icon(Icons.chevron_right, size: 18, color: AppColors.inkMuted),
          ],
        ),
      ),
    );
  }

  static String _fmtDate(DateTime d) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return '${months[d.month - 1]} ${d.day}, ${d.year}';
  }
}

/// Edit sheet for a single day — date, check-in toggle, capacity,
/// entitlement multi-select, delete.
class _DayEditSheet extends StatefulWidget {
  final _EventDay day;
  final List<_Entitlement> entitlements;
  final OrganizerApi org;
  const _DayEditSheet({
    required this.day,
    required this.entitlements,
    required this.org,
  });

  @override
  State<_DayEditSheet> createState() => _DayEditSheetState();
}

class _DayEditSheetState extends State<_DayEditSheet> {
  late DateTime? _date = widget.day.date;
  late bool _checkinEnabled = widget.day.checkinEnabled;
  late final _capacityCtrl =
      TextEditingController(text: widget.day.capacity?.toString() ?? '');
  final Set<String> _selectedEntitlements = {};
  bool _busy = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _selectedEntitlements.addAll(widget.day.entitlementIds);
  }

  @override
  void dispose() {
    _capacityCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _date ?? DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime(2100),
    );
    if (picked != null) setState(() => _date = picked);
  }

  Future<void> _save() async {
    int? capacity;
    final raw = _capacityCtrl.text.trim();
    if (raw.isNotEmpty) {
      final parsed = int.tryParse(raw);
      if (parsed == null || parsed < 1) {
        setState(() => _error = 'Capacity must be a whole number of 1 or more.');
        return;
      }
      capacity = parsed;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await widget.org.saveEventDay(
        widget.day.id,
        date: _date == null
            ? null
            : '${_date!.year.toString().padLeft(4, '0')}-'
                '${_date!.month.toString().padLeft(2, '0')}-'
                '${_date!.day.toString().padLeft(2, '0')}',
        checkinEnabled: _checkinEnabled,
        capacity: capacity,
        entitlementIds: _selectedEntitlements.toList(),
      );
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (mounted) {
        setState(() {
          _busy = false;
          _error = describeError(e, context: 'this day');
        });
      }
    }
  }

  Future<void> _delete() async {
    final confirmed = await showMSheet<bool>(
      context,
      Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Delete Day ${widget.day.dayIndex + 1}?', style: AppText.h3),
          const SizedBox(height: 6),
          Text('This removes the day and its entitlement links.',
              style: AppText.bodySm),
          const SizedBox(height: 16),
          Center(
            child: TextButton(
              onPressed: () => Navigator.of(context).pop(true),
              style: TextButton.styleFrom(
                  foregroundColor: AppColors.danger, minimumSize: const Size(0, 48)),
              child: const Text('Delete day',
                  style: TextStyle(fontWeight: FontWeight.w600)),
            ),
          ),
          MButton('Cancel',
              kind: MBtnKind.text, onTap: () => Navigator.of(context).pop(false)),
        ],
      ),
    );
    if (confirmed != true) return;
    setState(() => _busy = true);
    try {
      await widget.org.deleteEventDay(widget.day.id);
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (mounted) {
        setState(() {
          _busy = false;
          _error = describeError(e, context: 'this day');
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text('Day ${widget.day.dayIndex + 1}', style: AppText.h3),
        const SizedBox(height: 16),
        Text('Date', style: AppText.bodyStrong.copyWith(fontSize: 13)),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: _pickDate,
          child: Container(
            height: 46,
            padding: const EdgeInsets.symmetric(horizontal: 14),
            decoration: BoxDecoration(
              color: AppColors.canvas,
              borderRadius: BorderRadius.circular(AppRadius.btn),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              children: [
                const Icon(Icons.calendar_today_outlined,
                    size: 16, color: AppColors.inkMuted),
                const SizedBox(width: 10),
                Text(
                  _date != null
                      ? _EventDaysScreenState._fmtDate(_date!)
                      : 'No date set',
                  style: AppText.body,
                ),
                const Spacer(),
                if (_date != null)
                  GestureDetector(
                    onTap: () => setState(() => _date = null),
                    child: const Icon(Icons.close, size: 16, color: AppColors.inkMuted),
                  ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Check-in open this day', style: AppText.bodyStrong),
                  const SizedBox(height: 2),
                  Text('Attendees can be scanned in on this day.',
                      style: AppText.bodySm),
                ],
              ),
            ),
            MToggle(
              value: _checkinEnabled,
              onChanged: (v) => setState(() => _checkinEnabled = v),
            ),
          ],
        ),
        const SizedBox(height: 16),
        MInput(
          label: 'Capacity (optional)',
          hint: 'Leave empty for no limit',
          controller: _capacityCtrl,
          keyboardType: TextInputType.number,
        ),
        if (widget.entitlements.isNotEmpty) ...[
          const SizedBox(height: 16),
          Text('Entitlements valid this day',
              style: AppText.bodyStrong.copyWith(fontSize: 13)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: widget.entitlements.map((e) {
              final selected = _selectedEntitlements.contains(e.id);
              return MChip(e.name,
                  selected: selected,
                  onTap: () => setState(() {
                        if (selected) {
                          _selectedEntitlements.remove(e.id);
                        } else {
                          _selectedEntitlements.add(e.id);
                        }
                      }));
            }).toList(),
          ),
        ],
        if (_error != null) ...[
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.error_outline, color: AppColors.danger, size: 18),
              const SizedBox(width: 8),
              Expanded(
                child: Text(_error!, style: AppText.bodySm.copyWith(color: AppColors.danger)),
              ),
            ],
          ),
        ],
        const SizedBox(height: 18),
        MButton('Save', loading: _busy, onTap: _busy ? null : _save),
        const SizedBox(height: 4),
        Center(
          child: TextButton(
            onPressed: _busy ? null : _delete,
            style: TextButton.styleFrom(
                foregroundColor: AppColors.danger, minimumSize: const Size(0, 48)),
            child: const Text('Delete day', style: TextStyle(fontWeight: FontWeight.w600)),
          ),
        ),
        MButton('Cancel',
            kind: MBtnKind.text, onTap: _busy ? null : () => Navigator.of(context).pop(false)),
      ],
    );
  }
}

extension<T> on Iterable<T> {
  T? get firstOrNull => isEmpty ? null : first;
}
