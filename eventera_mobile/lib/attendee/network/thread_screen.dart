import 'package:flutter/material.dart';

import '../../net.dart';
import '../../ui/tokens.dart';
import '../../ui/components.dart';

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

  String get _name => (widget.otherName == null || widget.otherName!.isEmpty)
      ? 'Conversation'
      : widget.otherName!;

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

      if (!mounted) return;
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
      if (!mounted) return;
      setState(() => _loading = false);
      _jumpToBottom();
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
      showToast(context, e.message);
    } catch (_) {
      if (!mounted) return;
      setState(() => _sending = false);
      showToast(context, 'Message failed to send');
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
    return MScaffold(
      appBar: MAppBar(
        hairline: true,
        leading: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const _BackChip(),
            const SizedBox(width: 2),
            Avatar(name: _name, size: 32),
          ],
        ),
        title: _name,
      ),
      bottomBar: _buildComposer(),
      body: _loading
          ? const LoadingState()
          : _error != null
              ? ErrorStateView(message: _error!, onRetry: _load)
              : _messages.isEmpty
                  ? const EmptyState(
                      icon: Icons.chat_bubble_outline,
                      title: 'No messages yet',
                      message: 'Say hello to start the conversation.',
                    )
                  : _buildMessages(),
    );
  }

  Widget _buildMessages() {
    return ListView.builder(
      controller: _scroll,
      padding: const EdgeInsets.fromLTRB(AppSpace.base, AppSpace.base, AppSpace.base, AppSpace.sm),
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
    return Container(
      padding: const EdgeInsets.fromLTRB(AppSpace.base, AppSpace.sm, AppSpace.base, AppSpace.sm),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(top: BorderSide(color: AppColors.border)),
        boxShadow: AppShadow.tabbar,
      ),
      child: SafeArea(
        top: false,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Expanded(
              child: MInput(
                controller: _controller,
                hint: 'Message',
                minLines: 1,
                maxLines: 4,
                action: TextInputAction.send,
                onSubmitted: (_) => _send(),
              ),
            ),
            const SizedBox(width: 10),
            GestureDetector(
              onTap: _sending ? null : _send,
              child: Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  color: AppColors.forest,
                  borderRadius: BorderRadius.circular(AppRadius.btn),
                ),
                alignment: Alignment.center,
                child: _sending
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                            strokeWidth: 2.2, color: Colors.white),
                      )
                    : const Icon(Icons.send, size: 20, color: Colors.white),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── local widgets ──────────────────────────────────────────────────────────

class _BackChip extends StatelessWidget {
  const _BackChip();
  @override
  Widget build(BuildContext context) {
    return InkResponse(
      onTap: () => Navigator.of(context).maybePop(),
      radius: 24,
      child: const SizedBox(
        width: 38,
        height: 38,
        child: Icon(Icons.arrow_back, color: AppColors.ink, size: 22),
      ),
    );
  }
}

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
                color: mine ? AppColors.forest : AppColors.surface,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: Radius.circular(mine ? 16 : 4),
                  bottomRight: Radius.circular(mine ? 4 : 16),
                ),
                border: mine ? null : Border.all(color: AppColors.border),
              ),
              child: Text(text,
                  style: AppText.body.copyWith(
                      fontSize: 14.5,
                      height: 1.4,
                      color: mine ? Colors.white : AppColors.ink)),
            ),
            if (time.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(time,
                  style: AppText.numSm.copyWith(
                      fontSize: 10.5, color: AppColors.inkMuted)),
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
