import 'package:flutter/material.dart';

import '../../net.dart';
import '../../theme.dart';

/// A one-to-one message thread between two attendees (by registration_id).
///
/// Verified against the web app:
///  - POST /api/threads { event_id, sender_id, recipient_id, content } creates
///    or reuses a `message_threads` row and inserts the message. Returns
///    { thread_id, message }.
///  - Messages are read directly from `messages` (public RLS on this event's
///    engagement tables). Row shape: { id, thread_id, sender_id, content,
///    read_at, created_at }.
///  - Read receipts: we stamp read_at on inbound messages we've now seen.
class ThreadScreen extends StatefulWidget {
  final String eventId;
  final String registrationId;
  final String otherRegId;
  final String? otherName;

  const ThreadScreen({
    super.key,
    required this.eventId,
    required this.registrationId,
    required this.otherRegId,
    this.otherName,
  });

  @override
  State<ThreadScreen> createState() => _ThreadScreenState();
}

class _ThreadScreenState extends State<ThreadScreen> {
  bool _loading = true;
  bool _sending = false;
  String? _error;
  String? _threadId;
  List<Map<String, dynamic>> _messages = [];

  final _controller = TextEditingController();
  final _scroll = ScrollController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _controller.dispose();
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      // Find an existing thread between the two participants (order-agnostic).
      final ids = [widget.registrationId, widget.otherRegId]..sort();
      final row = await supa
          .from('message_threads')
          .select('id')
          .eq('participant_a', ids[0])
          .eq('participant_b', ids[1])
          .maybeSingle();

      if (row == null) {
        // No thread yet — nothing to load; it will be created on first send.
        setState(() {
          _threadId = null;
          _messages = [];
          _loading = false;
        });
        return;
      }

      _threadId = asString(row['id']);
      await _refreshMessages(markRead: true);
      setState(() => _loading = false);
      _jumpToBottom();
    } on ApiException catch (e) {
      setState(() {
        _loading = false;
        _error = e.message;
      });
    } catch (_) {
      setState(() {
        _loading = false;
        _error = 'Could not open this conversation.';
      });
    }
  }

  Future<void> _refreshMessages({bool markRead = false}) async {
    if (_threadId == null) return;
    final rows = await supa
        .from('messages')
        .select('id, thread_id, sender_id, content, read_at, created_at')
        .eq('thread_id', _threadId!)
        .order('created_at', ascending: true);
    _messages = asMapList(rows);

    if (markRead) {
      // Stamp read_at on inbound, still-unread messages.
      final unreadInbound = _messages
          .where((m) =>
              asString(m['sender_id']) != widget.registrationId &&
              m['read_at'] == null)
          .map((m) => asString(m['id']))
          .toList();
      if (unreadInbound.isNotEmpty) {
        try {
          await supa
              .from('messages')
              .update({'read_at': DateTime.now().toUtc().toIso8601String()})
              .inFilter('id', unreadInbound);
        } catch (_) {/* non-fatal */}
      }
    }
    if (mounted) setState(() {});
  }

  Future<void> _send() async {
    final text = _controller.text.trim();
    if (text.isEmpty || _sending) return;
    setState(() => _sending = true);
    try {
      final res = await apiPost('/api/threads', {
        'event_id': widget.eventId,
        'sender_id': widget.registrationId,
        'recipient_id': widget.otherRegId,
        'content': text,
      });
      if (res is Map && res['thread_id'] != null) {
        _threadId = asString(res['thread_id']);
      }
      _controller.clear();
      await _refreshMessages();
      if (!mounted) return;
      setState(() => _sending = false);
      _jumpToBottom();
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _sending = false);
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(e.message)));
    } catch (_) {
      if (!mounted) return;
      setState(() => _sending = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Message failed to send')),
      );
    }
  }

  void _jumpToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.jumpTo(_scroll.position.maxScrollExtent);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Brand.cream,
      appBar: AppBar(
        backgroundColor: Brand.cream,
        foregroundColor: Brand.forest,
        elevation: 0,
        title: Text(widget.otherName ?? 'Conversation',
            style: const TextStyle(color: Brand.forest)),
      ),
      body: Column(
        children: [
          Expanded(
            child: _loading
                ? const _CenterSpinner()
                : _error != null
                    ? _ErrorState(message: _error!, onRetry: _load)
                    : _messages.isEmpty
                        ? const _EmptyState(
                            icon: Icons.chat_bubble_outline,
                            message:
                                'No messages yet.\nSay hello to start the conversation.',
                          )
                        : _buildMessages(),
          ),
          _buildComposer(),
        ],
      ),
    );
  }

  Widget _buildMessages() {
    return ListView.builder(
      controller: _scroll,
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      itemCount: _messages.length,
      itemBuilder: (context, i) {
        final m = _messages[i];
        final mine = asString(m['sender_id']) == widget.registrationId;
        return _Bubble(
          text: asString(m['content']),
          mine: mine,
          time: _MsgTime.format(asDate(m['created_at'])),
        );
      },
    );
  }

  Widget _buildComposer() {
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
        decoration: const BoxDecoration(
          color: Brand.surface,
          border: Border(top: BorderSide(color: Brand.border)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Expanded(
              child: TextField(
                controller: _controller,
                minLines: 1,
                maxLines: 4,
                textInputAction: TextInputAction.newline,
                decoration: const InputDecoration(
                  hintText: 'Type a message…',
                  isDense: true,
                ),
              ),
            ),
            const SizedBox(width: 8),
            _sending
                ? const Padding(
                    padding: EdgeInsets.all(10),
                    child: SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Brand.forest),
                    ),
                  )
                : IconButton.filled(
                    style: IconButton.styleFrom(backgroundColor: Brand.forest),
                    icon: const Icon(Icons.send, size: 20),
                    onPressed: _send,
                  ),
          ],
        ),
      ),
    );
  }
}

// ─── local widgets ──────────────────────────────────────────────────────────

class _Bubble extends StatelessWidget {
  final String text;
  final bool mine;
  final String time;
  const _Bubble({required this.text, required this.mine, required this.time});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Align(
        alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
        child: Column(
          crossAxisAlignment:
              mine ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            Container(
              constraints: BoxConstraints(
                  maxWidth: MediaQuery.of(context).size.width * 0.72),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: mine ? Brand.forest : Brand.surface,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: Radius.circular(mine ? 16 : 4),
                  bottomRight: Radius.circular(mine ? 4 : 16),
                ),
                border: mine ? null : Border.all(color: Brand.border),
              ),
              child: Text(text,
                  style: TextStyle(
                      fontSize: 15,
                      height: 1.35,
                      color: mine ? Colors.white : Brand.ink)),
            ),
            if (time.isNotEmpty) ...[
              const SizedBox(height: 3),
              Text(time,
                  style: const TextStyle(fontSize: 11, color: Brand.muted)),
            ],
          ],
        ),
      ),
    );
  }
}

class _MsgTime {
  static String format(DateTime? dt) {
    if (dt == null) return '';
    final local = dt.toLocal();
    final h = local.hour;
    final m = local.minute.toString().padLeft(2, '0');
    final ampm = h >= 12 ? 'PM' : 'AM';
    final h12 = h % 12 == 0 ? 12 : h % 12;
    return '$h12:$m $ampm';
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
