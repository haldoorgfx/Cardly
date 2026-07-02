import 'package:flutter/material.dart';

import '../../net.dart';
import '../../theme.dart';
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
    if (_canNetwork) _load();
    else _loading = false;
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
      setState(() {
        _threads = list.map(_Thread.fromRow).toList();
        _loading = false;
      });
    } on ApiException catch (e) {
      setState(() {
        _loading = false;
        _error = e.message;
      });
    } catch (_) {
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
    return Scaffold(
      backgroundColor: Brand.cream,
      appBar: AppBar(
        backgroundColor: Brand.cream,
        foregroundColor: Brand.forest,
        elevation: 0,
        title: const Text('Messages', style: TextStyle(color: Brand.forest)),
      ),
      body: !_canNetwork
          ? const _RegisterPrompt()
          : _loading
              ? const _CenterSpinner()
              : _error != null
                  ? _ErrorState(message: _error!, onRetry: _load)
                  : RefreshIndicator(
                      color: Brand.forest,
                      onRefresh: _load,
                      child: _buildList(),
                    ),
    );
  }

  Widget _buildList() {
    if (_threads.isEmpty) {
      return ListView(
        children: const [
          SizedBox(height: 120),
          _EmptyState(
            icon: Icons.forum_outlined,
            message:
                'No conversations yet.\nMessage someone from the People tab to get started.',
          ),
        ],
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 40),
      itemCount: _threads.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, i) => _tile(_threads[i]),
    );
  }

  Widget _tile(_Thread t) {
    return InkWell(
      onTap: () => _open(t),
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Brand.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Brand.border),
        ),
        child: Row(
          children: [
            _Avatar(name: t.otherName, size: 46),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(t.otherName,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                                color: Brand.ink)),
                      ),
                      if (t.time.isNotEmpty)
                        Text(t.time,
                            style: const TextStyle(
                                fontSize: 12, color: Brand.muted)),
                    ],
                  ),
                  const SizedBox(height: 3),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          t.preview.isEmpty ? 'No messages yet' : t.preview,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                              fontSize: 13,
                              color: t.unread > 0
                                  ? Brand.inkSoft
                                  : Brand.muted,
                              fontWeight: t.unread > 0
                                  ? FontWeight.w600
                                  : FontWeight.w400),
                        ),
                      ),
                      if (t.unread > 0) ...[
                        const SizedBox(width: 8),
                        _UnreadDot(count: t.unread),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
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

// ─── local widgets ──────────────────────────────────────────────────────────

class _UnreadDot extends StatelessWidget {
  final int count;
  const _UnreadDot({required this.count});
  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: const BoxConstraints(minWidth: 20),
      height: 20,
      padding: const EdgeInsets.symmetric(horizontal: 6),
      alignment: Alignment.center,
      decoration: const BoxDecoration(
        color: Brand.forest,
        borderRadius: BorderRadius.all(Radius.circular(999)),
      ),
      child: Text(count > 9 ? '9+' : '$count',
          style: const TextStyle(
              color: Colors.white,
              fontSize: 11,
              fontWeight: FontWeight.w700)),
    );
  }
}

class _RegisterPrompt extends StatelessWidget {
  const _RegisterPrompt();
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Icon(Icons.badge_outlined, color: Brand.forest, size: 44),
            SizedBox(height: 14),
            Text('Register to message',
                style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: Brand.ink)),
            SizedBox(height: 8),
            Text(
              'Register for this event to message other attendees.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, height: 1.5, color: Brand.inkSoft),
            ),
          ],
        ),
      ),
    );
  }
}

class _CenterSpinner extends StatelessWidget {
  const _CenterSpinner();
  @override
  Widget build(BuildContext context) =>
      const Center(child: CircularProgressIndicator(color: Brand.forest));
}

class _ErrorState extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const _ErrorState({required this.message, required this.onRetry});
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, color: Brand.danger, size: 40),
            const SizedBox(height: 12),
            Text(message,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 15, color: Brand.inkSoft)),
            const SizedBox(height: 16),
            FilledButton(onPressed: onRetry, child: const Text('Try again')),
          ],
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final IconData icon;
  final String message;
  const _EmptyState({required this.icon, required this.message});
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: Brand.muted, size: 40),
            const SizedBox(height: 12),
            Text(message,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 15, color: Brand.inkSoft)),
          ],
        ),
      ),
    );
  }
}

class _Avatar extends StatelessWidget {
  final String name;
  final double size;
  const _Avatar({required this.name, this.size = 44});

  String get _initials {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts.first.isEmpty) return '?';
    if (parts.length == 1) return parts.first[0].toUpperCase();
    return (parts.first[0] + parts.last[0]).toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: const BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Brand.forest, Color(0xFF2A6A50)],
        ),
      ),
      child: Text(_initials,
          style: TextStyle(
              color: Colors.white,
              fontSize: size * 0.34,
              fontWeight: FontWeight.w600)),
    );
  }
}
