import 'package:flutter/material.dart';

import '../../net.dart';
import '../../ui/tokens.dart';
import '../../ui/components.dart';
import 'thread_screen.dart';

/// Inbox of the attendee's message threads for an event.
///
/// Verified against the web app:
///  - GET /api/threads?registration_id=<id>&event_id=<id> returns
///    { threads: [{ id, event_id, participant_a, participant_b,
///      last_message_at, other_participant_id, other_participant_name,
///      last_message: { id, content, sender_id, created_at } | null,
///      unread_count }] }.
class MessagesScreen extends StatefulWidget {
  final String eventId;
  final String? registrationId;

  const MessagesScreen({
    super.key,
    required this.eventId,
    this.registrationId,
  });

  @override
  State<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends State<MessagesScreen> {
  bool _loading = true;
  String? _error;
  List<_Thread> _threads = [];

  bool get _canNetwork =>
      widget.registrationId != null && widget.registrationId!.isNotEmpty;

  @override
  void initState() {
    super.initState();
    if (_canNetwork) {
      _load();
    } else {
      _loading = false;
    }
  }

  Future<void> _load() async {
    if (!_canNetwork) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await apiGet('/api/threads', query: {
        'registration_id': widget.registrationId,
        'event_id': widget.eventId,
      });
      final list = asMapList(data is Map ? data['threads'] : data);
      if (!mounted) return;
      setState(() {
        _threads = list.map(_Thread.fromRow).toList();
        _loading = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.message;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Something went wrong loading your messages.';
      });
    }
  }

  Future<void> _open(_Thread t) async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => ThreadScreen(
          eventId: widget.eventId,
          registrationId: widget.registrationId!,
          otherRegId: t.otherId,
          otherName: t.otherName,
        ),
      ),
    );
    // Refresh unread counts / previews after returning.
    if (mounted) _load();
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: const MAppBar(title: 'Messages', showBack: false, hairline: true),
      body: !_canNetwork
          ? const EmptyState(
              icon: Icons.badge_outlined,
              title: 'Register to message',
              message: 'Register for this event to message other attendees.',
            )
          : _loading
              ? const LoadingState()
              : _error != null
                  ? ErrorStateView(message: _error!, onRetry: _load)
                  : RefreshIndicator(
                      color: AppColors.forest,
                      onRefresh: _load,
                      child: _buildList(),
                    ),
    );
  }

  Widget _buildList() {
    if (_threads.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: const [
          SizedBox(height: 100),
          EmptyState(
            icon: Icons.forum_outlined,
            title: 'No conversations yet',
            message: 'Message someone from the People tab to get started.',
          ),
        ],
      );
    }
    return ListView.separated(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(AppSpace.lg, AppSpace.xs, AppSpace.lg, 40),
      itemCount: _threads.length,
      separatorBuilder: (_, __) =>
          const Divider(height: 1, thickness: 1, color: AppColors.border),
      itemBuilder: (context, i) => _tile(_threads[i]),
    );
  }

  Widget _tile(_Thread t) {
    final unread = t.unread > 0;
    return ListRow(
      onTap: () => _open(t),
      leading: Avatar(name: t.otherName, size: 48),
      title: Row(
        children: [
          Expanded(
            child: Text(t.otherName,
                maxLines: 1, overflow: TextOverflow.ellipsis),
          ),
          if (t.time.isNotEmpty) ...[
            const SizedBox(width: 8),
            Text(t.time, style: AppText.numSm.copyWith(color: AppColors.inkMuted)),
          ],
        ],
      ),
      subtitle: Row(
        children: [
          Expanded(
            child: Text(
              t.preview.isEmpty ? 'No messages yet' : t.preview,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppText.bodySm.copyWith(
                color: unread ? AppColors.ink : AppColors.inkMuted,
                fontWeight: unread ? FontWeight.w600 : FontWeight.w400,
              ),
            ),
          ),
          if (unread) ...[
            const SizedBox(width: 8),
            Container(
              width: 9,
              height: 9,
              decoration: const BoxDecoration(
                  color: AppColors.forest, shape: BoxShape.circle),
            ),
          ],
        ],
      ),
    );
  }
}

// ─── model ──────────────────────────────────────────────────────────────────

class _Thread {
  final String id;
  final String otherId;
  final String otherName;
  final String preview;
  final String time;
  final int unread;

  _Thread({
    required this.id,
    required this.otherId,
    required this.otherName,
    required this.preview,
    required this.time,
    required this.unread,
  });

  factory _Thread.fromRow(Map<String, dynamic> r) {
    final last = r['last_message'];
    final preview =
        (last is Map) ? asString(last['content']).trim() : '';
    final ts = (last is Map)
        ? asDate(last['created_at'])
        : asDate(r['last_message_at']);
    return _Thread(
      id: asString(r['id']),
      otherId: asString(r['other_participant_id']),
      otherName: asString(r['other_participant_name'], 'Attendee'),
      preview: preview,
      time: _RelTime.format(ts),
      unread: asInt(r['unread_count']),
    );
  }
}

class _RelTime {
  static String format(DateTime? dt) {
    if (dt == null) return '';
    final now = DateTime.now();
    final local = dt.toLocal();
    final diff = now.difference(local);
    if (diff.inMinutes < 1) return 'now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m';
    if (diff.inHours < 24) return '${diff.inHours}h';
    if (diff.inDays < 7) return '${diff.inDays}d';
    const months = [
      'Jan','Feb','Mar','Apr','May','Jun',
      'Jul','Aug','Sep','Oct','Nov','Dec'
    ];
    return '${months[local.month - 1]} ${local.day}';
  }
}
