// EX03 · Meeting requests — attendee requests to meet the exhibitor.
// Requests / Scheduled tabs; Accept schedules it. Reads/updates `meeting_requests`
// (060_exhibitor_products_meetings.sql). DRAFT — verify via `flutter analyze`.

import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../ui/tokens.dart';
import '../../ui/components.dart';
import '../role_widgets.dart';

class MeetingRequestsScreen extends StatefulWidget {
  final String sponsorId;
  final String eventName;
  const MeetingRequestsScreen({super.key, required this.sponsorId, required this.eventName});

  @override
  State<MeetingRequestsScreen> createState() => _MeetingRequestsScreenState();
}

class _Meeting {
  final String id, name, message, status;
  final DateTime? requestedTime;
  _Meeting(this.id, this.name, this.message, this.status, this.requestedTime);
}

class _MeetingRequestsScreenState extends State<MeetingRequestsScreen> {
  late Future<List<_Meeting>> _future;
  int _tab = 0; // 0 = requests (pending), 1 = scheduled

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<_Meeting>> _load() async {
    final rows = await Supabase.instance.client
        .from('meeting_requests')
        .select('id, requester_name, message, status, requested_time')
        .eq('sponsor_id', widget.sponsorId)
        .order('created_at', ascending: false);
    return (rows as List).map((r) {
      final m = Map<String, dynamic>.from(r as Map);
      return _Meeting(
        (m['id'] ?? '').toString(),
        (m['requester_name'] ?? 'Attendee').toString(),
        (m['message'] ?? '').toString(),
        (m['status'] ?? 'pending').toString(),
        m['requested_time'] != null ? DateTime.tryParse(m['requested_time'].toString()) : null,
      );
    }).toList();
  }

  Future<void> _accept(_Meeting m) async {
    try {
      await Supabase.instance.client.from('meeting_requests').update({
        'status': 'scheduled',
        'scheduled_time': m.requestedTime?.toIso8601String(),
      }).eq('id', m.id);
      setState(() => _future = _load());
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: MAppBar(title: 'Meetings'),
      body: Column(
        children: [
          RoleBar(icon: Icons.storefront_outlined, eventName: widget.eventName, roleLine: 'Exhibitor'),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                _seg('Requests', 0),
                const SizedBox(width: 8),
                _seg('Scheduled', 1),
              ],
            ),
          ),
          Expanded(
            child: FutureBuilder<List<_Meeting>>(
              future: _future,
              builder: (context, snap) {
                if (snap.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator(color: AppColors.forest));
                }
                final all = snap.data ?? [];
                final list = all
                    .where((m) => _tab == 0 ? m.status == 'pending' : m.status == 'scheduled')
                    .toList();
                if (list.isEmpty) {
                  return EmptyState(
                    icon: Icons.event_outlined,
                    title: _tab == 0 ? 'No requests' : 'Nothing scheduled',
                    message: _tab == 0
                        ? 'Meeting requests from attendees will appear here.'
                        : 'Accepted meetings show up here and in both agendas.',
                  );
                }
                return ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: list.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (_, i) {
                    final m = list[i];
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
                                  color: AppColors.ink, fontSize: 14.5, fontWeight: FontWeight.w700)),
                          if (m.requestedTime != null)
                            Text(
                              '${m.requestedTime!.month}/${m.requestedTime!.day} · ${m.requestedTime!.hour}:${m.requestedTime!.minute.toString().padLeft(2, '0')}',
                              style: const TextStyle(color: AppColors.inkMuted, fontSize: 12.5),
                            ),
                          if (m.message.isNotEmpty)
                            Padding(
                              padding: const EdgeInsets.only(top: 6),
                              child: Text(m.message,
                                  style: const TextStyle(color: AppColors.inkSoft, fontSize: 13)),
                            ),
                          if (_tab == 0) ...[
                            const SizedBox(height: 12),
                            Row(children: [
                              Expanded(child: MButton('Accept', small: true, onTap: () => _accept(m))),
                              const SizedBox(width: 8),
                              Expanded(
                                child: MButton('Propose time',
                                    small: true, kind: MBtnKind.sec, onTap: () {}),
                              ),
                            ]),
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

  Widget _seg(String label, int i) {
    final sel = _tab == i;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _tab = i),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: sel ? AppColors.forest : AppColors.creamSoft,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Center(
            child: Text(label,
                style: TextStyle(
                    color: sel ? Colors.white : AppColors.inkMuted,
                    fontWeight: FontWeight.w600,
                    fontSize: 13.5)),
          ),
        ),
      ),
    );
  }
}
