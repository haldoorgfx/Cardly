import 'package:flutter/material.dart';

import '../../net.dart';
import '../../ui/components.dart';
import '../../ui/tokens.dart';
import '../engage/_shared.dart';

/// CommunityChatScreen — event community channels + chat. Mirrors the web
/// `/e/[slug]/community` experience.
///
/// Contracts verified:
///  - Channels: community_channels select('id, name, description, is_pinned,
///    position').eq('event_id', ...).order('is_pinned', desc).order('position', asc).
///  - Messages: community_messages select('id, content, created_at, is_pinned,
///    registrations(attendee_name)').eq('event_id', ...).eq('channel_id', ...)
///    .order('created_at', asc).limit(100).
///  - Send: community_messages insert({event_id, channel_id, registration_id,
///    content}) — best-effort; RLS may reject, that's fine.
class CommunityChatScreen extends StatefulWidget {
  final String eventId;
  final String? registrationId;
  const CommunityChatScreen({
    super.key,
    required this.eventId,
    this.registrationId,
  });

  @override
  State<CommunityChatScreen> createState() => _CommunityChatScreenState();
}

class _Channel {
  final String id;
  final String name;
  final String description;
  final bool isPinned;
  final int position;
  _Channel({
    required this.id,
    required this.name,
    required this.description,
    required this.isPinned,
    required this.position,
  });
}

class _Message {
  final String id;
  final String content;
  final String senderName;
  final bool isPinned;
  final DateTime? createdAt;
  _Message({
    required this.id,
    required this.content,
    required this.senderName,
    required this.isPinned,
    required this.createdAt,
  });
}

class _CommunityChatScreenState extends State<CommunityChatScreen> {
  bool _loading = true;
  String? _error;
  List<_Channel> _channels = [];
  String? _selectedChannelId;

  bool _messagesLoading = false;
  String? _messagesError;
  List<_Message> _messages = [];

  final _composer = TextEditingController();
  bool _sending = false;
  String? _rid;

  @override
  void initState() {
    super.initState();
    _rid = widget.registrationId;
    _resolveReg();
    _load();
  }

  Future<void> _resolveReg() async {
    final rid = await effectiveRegId(widget.registrationId, widget.eventId);
    if (!mounted) return;
    setState(() => _rid = rid);
  }

  @override
  void dispose() {
    _composer.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final rows = await supa
          .from('community_channels')
          .select('id, name, description, is_pinned, position')
          .eq('event_id', widget.eventId)
          .order('is_pinned', ascending: false)
          .order('position', ascending: true);

      final list = <_Channel>[];
      for (final r in (rows as List).whereType<Map>()) {
        final map = Map<String, dynamic>.from(r);
        list.add(_Channel(
          id: asString(map['id']),
          name: asString(map['name'], 'Channel'),
          description: asString(map['description']),
          isPinned: asBool(map['is_pinned']),
          position: asInt(map['position']),
        ));
      }

      if (!mounted) return;
      final firstId = list.isNotEmpty ? list.first.id : null;
      setState(() {
        _channels = list;
        _selectedChannelId = firstId;
        _loading = false;
      });
      if (firstId != null) {
        await _loadMessages(firstId);
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e is ApiException ? e.message : e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _loadMessages(String channelId) async {
    setState(() {
      _messagesLoading = true;
      _messagesError = null;
    });
    try {
      final rows = await supa
          .from('community_messages')
          .select('id, content, created_at, is_pinned, registrations(attendee_name)')
          .eq('channel_id', channelId)
          .order('created_at', ascending: true)
          .limit(100);

      final list = <_Message>[];
      for (final r in (rows as List).whereType<Map>()) {
        final map = Map<String, dynamic>.from(r);
        final reg = map['registrations'];
        final name = (reg is Map && reg['attendee_name'] != null)
            ? reg['attendee_name'].toString()
            : 'Someone';
        list.add(_Message(
          id: asString(map['id']),
          content: asString(map['content']),
          senderName: name,
          isPinned: asBool(map['is_pinned']),
          createdAt: asDate(map['created_at']),
        ));
      }

      if (!mounted) return;
      // Only apply if this is still the selected channel.
      if (_selectedChannelId != channelId) return;
      setState(() {
        _messages = list;
        _messagesLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      if (_selectedChannelId != channelId) return;
      setState(() {
        _messagesError = e is ApiException ? e.message : e.toString();
        _messagesLoading = false;
      });
    }
  }

  void _selectChannel(String id) {
    if (id == _selectedChannelId) return;
    setState(() {
      _selectedChannelId = id;
      _messages = [];
      _messagesError = null;
    });
    _loadMessages(id);
  }

  Future<void> _send() async {
    final channelId = _selectedChannelId;
    if (channelId == null || _rid == null) return;
    final text = _composer.text.trim();
    if (text.isEmpty || _sending) return;

    setState(() => _sending = true);
    try {
      await supa.from('community_messages').insert({
        'channel_id': channelId,
        'registration_id': _rid,
        'content': text,
      });
      if (!mounted) return;
      _composer.clear();
      setState(() => _sending = false);
      await _loadMessages(channelId);
    } catch (_) {
      // RLS may reject — keep the text, just tell the user.
      if (!mounted) return;
      setState(() => _sending = false);
      showToast(context, 'Couldn\'t send your message.');
    }
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: const MAppBar(title: 'Community', hairline: true),
      body: _body(),
    );
  }

  Widget _body() {
    if (_loading) return const LoadingState();
    if (_error != null) {
      return ErrorStateView(message: _error!, onRetry: _load);
    }
    if (_channels.isEmpty) {
      return const EmptyState(
        icon: Icons.forum_outlined,
        title: 'No community channels',
        message: 'This event has no community channels yet.',
      );
    }

    return Column(
      children: [
        _channelStrip(),
        Expanded(child: _messagePane()),
        _composerBar(),
      ],
    );
  }

  Widget _channelStrip() {
    return SizedBox(
      height: 54,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(
            horizontal: AppSpace.lg, vertical: AppSpace.sm),
        itemCount: _channels.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (_, i) {
          final c = _channels[i];
          return MChip(
            c.name,
            selected: c.id == _selectedChannelId,
            icon: c.isPinned ? Icons.push_pin : null,
            onTap: () => _selectChannel(c.id),
          );
        },
      ),
    );
  }

  Widget _messagePane() {
    if (_messagesLoading && _messages.isEmpty) return const LoadingState();
    if (_messagesError != null) {
      final id = _selectedChannelId;
      return ErrorStateView(
        message: _messagesError!,
        onRetry: id == null ? null : () => _loadMessages(id),
      );
    }

    final id = _selectedChannelId;
    return RefreshIndicator(
      color: AppColors.forest,
      onRefresh: () => id == null ? Future.value() : _loadMessages(id),
      child: _messages.isEmpty
          ? ListView(children: [
              SizedBox(height: MediaQuery.of(context).size.height * 0.16),
              const EmptyState(
                icon: Icons.chat_bubble_outline,
                title: 'No messages yet',
                message: 'Be the first to say something.',
              ),
            ])
          : ListView.builder(
              padding: const EdgeInsets.fromLTRB(
                  AppSpace.lg, AppSpace.sm, AppSpace.lg, AppSpace.base),
              itemCount: _messages.length,
              itemBuilder: (_, i) => _messageBubble(_messages[i]),
            ),
    );
  }

  Widget _messageBubble(_Message m) {
    final hue = hueFromString(m.senderName);
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpace.md),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Avatar(name: m.senderName, size: 34),
          const SizedBox(width: 10),
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(
                  horizontal: 13, vertical: 10),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(AppRadius.card),
                border: Border.all(
                    color: m.isPinned ? AppColors.gold : AppColors.border,
                    width: m.isPinned ? 1.5 : 1),
                boxShadow: AppShadow.soft,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          m.senderName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppText.bodyStrong.copyWith(
                              color: HSLColor.fromAHSL(
                                      1, hue.toDouble(), 0.45, 0.30)
                                  .toColor(),
                              fontSize: 13.5),
                        ),
                      ),
                      if (m.isPinned) ...[
                        const SizedBox(width: 8),
                        const Icon(Icons.push_pin,
                            size: 13, color: AppColors.goldHover),
                      ],
                      const Spacer(),
                      if (m.createdAt != null)
                        Text(_relTime(m.createdAt!),
                            style: AppText.caption
                                .copyWith(fontSize: 11, letterSpacing: 0)),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(m.content,
                      style: AppText.body
                          .copyWith(color: AppColors.ink, height: 1.45)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _composerBar() {
    if (_rid == null) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.fromLTRB(
            AppSpace.lg, AppSpace.md, AppSpace.lg, AppSpace.md),
        decoration: const BoxDecoration(
          color: AppColors.surface,
          border: Border(top: BorderSide(color: AppColors.border)),
        ),
        child: SafeArea(
          top: false,
          child: Text(
            'Register for this event to join the conversation.',
            textAlign: TextAlign.center,
            style: AppText.bodySm.copyWith(color: AppColors.inkMuted),
          ),
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.fromLTRB(
          AppSpace.lg, AppSpace.sm, AppSpace.lg, AppSpace.sm),
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
                controller: _composer,
                hint: 'Write a message…',
                minLines: 1,
                maxLines: 4,
                action: TextInputAction.send,
                onSubmitted: (_) => _send(),
              ),
            ),
            const SizedBox(width: 10),
            _SendButton(loading: _sending, onTap: _send),
          ],
        ),
      ),
    );
  }

  static String _relTime(DateTime t) {
    final now = DateTime.now();
    final d = now.difference(t.toLocal());
    if (d.inSeconds < 60) return 'now';
    if (d.inMinutes < 60) return '${d.inMinutes}m';
    if (d.inHours < 24) return '${d.inHours}h';
    if (d.inDays < 7) return '${d.inDays}d';
    final local = t.toLocal();
    return '${local.month}/${local.day}';
  }
}

/// Circular forest send button matching the composer height.
class _SendButton extends StatelessWidget {
  final bool loading;
  final VoidCallback onTap;
  const _SendButton({required this.loading, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: loading ? null : onTap,
      child: Container(
        width: 50,
        height: 50,
        decoration: const BoxDecoration(
          color: AppColors.forest,
          shape: BoxShape.circle,
        ),
        alignment: Alignment.center,
        child: loading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                    strokeWidth: 2.4, color: Colors.white),
              )
            : const Icon(Icons.send_rounded, color: Colors.white, size: 20),
      ),
    );
  }
}
