// EX03 · Meeting requests — attendee requests to meet the exhibitor.
// Requests / Scheduled / Declined tabs. Accept schedules it, Propose time picks
// a slot, Decline turns it down. Reads/updates `meeting_requests`
// (060_exhibitor_products_meetings.sql) via SponsorApi; every write surfaces
// success/failure rather than swallowing errors.

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../ui/tokens.dart';
import '../../ui/components.dart';
import '../role_widgets.dart';
import '../sponsor/sponsor_api.dart';

class MeetingRequestsScreen extends StatefulWidget {
  final String sponsorId;
  final String eventName;
  const MeetingRequestsScreen(
      {super.key, required this.sponsorId, required this.eventName});

  @override
  State<MeetingRequestsScreen> createState() => _MeetingRequestsScreenState();
}

class _Meeting {
  final String id, name, message, status;
  final DateTime? requestedTime, scheduledTime;
  _Meeting(this.id, this.name, this.message, this.status, this.requestedTime,
      this.scheduledTime);
}

class _MeetingRequestsScreenState extends State<MeetingRequestsScreen> {
  late Future<List<_Meeting>> _future;
  int _tab = 0; // 0 = requests (pending), 1 = scheduled, 2 = declined
  final Set<String> _busy = {};

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<_Meeting>> _load() async {
    final rows = await SponsorApi.fetchMeetings(widget.sponsorId);
    return rows.map((m) {
      return _Meeting(
        (m['id'] ?? '').toString(),
        (m['requester_name'] ?? 'Attendee').toString(),
        (m['message'] ?? '').toString(),
        (m['status'] ?? 'pending').toString(),
        m['requested_time'] != null
            ? DateTime.tryParse(m['requested_time'].toString())
            : null,
        m['scheduled_time'] != null
            ? DateTime.tryParse(m['scheduled_time'].toString())
            : null,
      );
    }).toList();
  }

  void _reload() => setState(() => _future = _load());

  Future<void> _run(_Meeting m, Future<void> Function() op, String okMsg) async {
    setState(() => _busy.add(m.id));
    try {
      await op();
      if (!mounted) return;
      HapticFeedback.selectionClick();
      showToast(context, okMsg);
      _reload();
    } catch (_) {
      if (mounted) showToast(context, "That didn't go through. Try again.");
    } finally {
      if (mounted) setState(() => _busy.remove(m.id));
    }
  }

  Future<void> _accept(_Meeting m) => _run(
        m,
        () => SponsorApi.updateMeeting(m.id,
            status: 'scheduled',
            scheduledTime: m.requestedTime ?? DateTime.now()),
        'Meeting accepted — added to Scheduled.',
      );

  Future<void> _decline(_Meeting m) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Decline request?'),
        content: Text('Decline the meeting request from ${m.name}?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancel',
                  style: TextStyle(color: AppColors.inkSoft))),
          TextButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Decline',
                  style: TextStyle(
                      color: AppColors.danger, fontWeight: FontWeight.w700))),
        ],
      ),
    );
    if (ok != true) return;
    await _run(m, () => SponsorApi.updateMeeting(m.id, status: 'declined'),
        'Request declined.');
  }

  /// Pick a date + time and schedule the meeting at that moment.
  Future<void> _proposeTime(_Meeting m) async {
    final now = DateTime.now();
    final seed = m.requestedTime != null && m.requestedTime!.isAfter(now)
        ? m.requestedTime!
        : now;
    final date = await showDatePicker(
      context: context,
      initialDate: seed,
      firstDate: DateTime(now.year, now.month, now.day),
      lastDate: DateTime(now.year + 1, now.month, now.day),
      builder: (ctx, child) => Theme(
        data: Theme.of(ctx).copyWith(
          colorScheme: const ColorScheme.light(
            primary: AppColors.forest,
            onPrimary: Colors.white,
            onSurface: AppColors.ink,
          ),
        ),
        child: child!,
      ),
    );
    if (date == null || !mounted) return;

    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(seed),
      builder: (ctx, child) => Theme(
        data: Theme.of(ctx).copyWith(
          colorScheme: const ColorScheme.light(
            primary: AppColors.forest,
            onPrimary: Colors.white,
            onSurface: AppColors.ink,
          ),
        ),
        child: child!,
      ),
    );
    if (time == null || !mounted) return;

    final scheduled =
        DateTime(date.year, date.month, date.day, time.hour, time.minute);
    await _run(
      m,
      () => SponsorApi.updateMeeting(m.id,
          status: 'scheduled', scheduledTime: scheduled),
      'Time proposed — meeting scheduled.',
    );
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: MAppBar(title: 'Meetings'),
      body: Column(
        children: [
          RoleBar(
              icon: Icons.storefront_outlined,
              eventName: widget.eventName,
              roleLine: 'Exhibitor'),
          Padding(
            padding: const EdgeInsets.all(16),
            child: SegControl(
              segments: const ['Requests', 'Scheduled', 'Declined'],
              index: _tab,
              onChanged: (i) => setState(() => _tab = i),
            ),
          ),
          Expanded(
            child: FutureBuilder<List<_Meeting>>(
              future: _future,
              builder: (context, snap) {
                if (snap.connectionState == ConnectionState.waiting) {
                  return const LoadingState();
                }
                if (snap.hasError) {
                  return ErrorStateView(
                    message: "We couldn't load your meetings. Try again.",
                    onRetry: _reload,
                  );
                }
                final all = snap.data ?? [];
                final wanted = _tab == 0
                    ? 'pending'
                    : _tab == 1
                        ? 'scheduled'
                        : 'declined';
                final list =
                    all.where((m) => m.status == wanted).toList();
                if (list.isEmpty) {
                  return EmptyState(
                    icon: Icons.event_outlined,
                    title: _tab == 0
                        ? 'No requests'
                        : _tab == 1
                            ? 'Nothing scheduled'
                            : 'Nothing declined',
                    message: _tab == 0
                        ? 'Meeting requests from attendees will appear here.'
                        : _tab == 1
                            ? 'Accepted meetings show up here and in both agendas.'
                            : 'Requests you decline are kept here.',
                  );
                }
                return ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: list.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 8),
                  itemBuilder: (_, i) {
                    final m = list[i];
                    final busy = _busy.contains(m.id);
                    final when = m.scheduledTime ?? m.requestedTime;
                    return Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(m.name,
                              style: const TextStyle(
                                  color: AppColors.ink,
                                  fontSize: 14.5,
                                  fontWeight: FontWeight.w700)),
                          if (when != null)
                            Padding(
                              padding: const EdgeInsets.only(top: 2),
                              child: Text(
                                '${_tab == 1 ? 'Scheduled' : 'Requested'} · ${_stamp(when)}',
                                style: const TextStyle(
                                    color: AppColors.inkSoft, fontSize: 12.5),
                              ),
                            ),
                          if (m.message.isNotEmpty)
                            Padding(
                              padding: const EdgeInsets.only(top: 6),
                              child: Text(m.message,
                                  style: const TextStyle(
                                      color: AppColors.inkSoft, fontSize: 13)),
                            ),
                          if (_tab == 0) ...[
                            const SizedBox(height: 12),
                            Row(children: [
                              Expanded(
                                child: MButton('Accept',
                                    small: true,
                                    loading: busy,
                                    onTap: busy ? null : () => _accept(m)),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: MButton('Propose',
                                    small: true,
                                    kind: MBtnKind.sec,
                                    onTap: busy ? null : () => _proposeTime(m)),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: MButton('Decline',
                                    small: true,
                                    kind: MBtnKind.text,
                                    onTap: busy ? null : () => _decline(m)),
                              ),
                            ]),
                          ] else if (_tab == 1) ...[
                            const SizedBox(height: 10),
                            Align(
                              alignment: Alignment.centerLeft,
                              child: MButton('Cancel meeting',
                                  small: true,
                                  kind: MBtnKind.text,
                                  fullWidth: false,
                                  onTap: busy ? null : () => _decline(m)),
                            ),
                          ],
                        ],
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  static String _stamp(DateTime at) {
    final l = at.toLocal();
    return '${l.month}/${l.day} · ${l.hour}:${l.minute.toString().padLeft(2, '0')}';
  }
}
