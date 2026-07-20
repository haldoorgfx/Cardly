import 'package:flutter/material.dart';

import '../../net.dart';
import '../../ui/tokens.dart';
import '../../ui/components.dart';
import '../engage/_shared.dart';
import '../event_context.dart';
import '../register/registration_screen.dart';
import 'people_screen.dart';
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
  StatusReason _errorReason = StatusReason.generic;
  List<_Thread> _threads = [];
  String? _rid;

  bool get _canNetwork => _rid != null && _rid!.isNotEmpty;

  @override
  void initState() {
    super.initState();
    _rid = widget.registrationId;
    if (_canNetwork) {
      _load();
    } else {
      _resolveRegThenLoad();
    }
  }

  Future<void> _resolveRegThenLoad() async {
    final rid = await effectiveRegId(widget.registrationId, widget.eventId);
    if (!mounted) return;
    setState(() => _rid = rid);
    if (_canNetwork) {
      _load();
    } else {
      setState(() => _loading = false);
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
        'registration_id': _rid,
        'event_id': widget.eventId,
      });
      final list = asMapList(data is Map ? data['threads'] : data);
      if (!mounted) return;
      setState(() {
        _threads = list.map(_Thread.fromRow).toList();
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      final msg = describeError(e, context: 'your messages');
      setState(() {
        _loading = false;
        _error = msg;
        _errorReason = _reasonFor(e, msg);
      });
    }
  }

  Future<void> _open(_Thread t) async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => ThreadScreen(
          eventId: widget.eventId,
          registrationId: _rid!,
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
          ? EmptyState(
              icon: Icons.badge_outlined,
              title: 'Register to message',
              message:
                  'Messaging is between registered attendees. Register and you '
                  'can start a conversation with anyone here.',
              ctaLabel: _eventCtx != null ? 'Register for this event' : null,
              onCta: _eventCtx != null ? _openRegistration : null,
            )
          : _loading
              ? const LoadingState()
              : _error != null
                  ? ErrorStateView(
                      message: _error!, onRetry: _load, reason: _errorReason)
                  : RefreshIndicator(
                      color: AppColors.forest,
                      onRefresh: _load,
                      child: _buildList(),
                    ),
    );
  }

  /// The in-memory context for THIS event, or null when it belongs to another
  /// event (or the app restarted). Gates the two navigation CTAs below, both
  /// of which need the event slug.
  EventContext? get _eventCtx {
    final c = EventContext.current;
    if (c != null && c.eventId == widget.eventId && c.slug.isNotEmpty) return c;
    return null;
  }

  Future<void> _openRegistration() async {
    final ctx = _eventCtx;
    if (ctx == null) return;
    await Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => RegistrationScreen(
          eventId: ctx.eventId, slug: ctx.slug, eventName: ctx.eventName),
    ));
    if (!mounted) return;
    _resolveRegThenLoad();
  }

  Future<void> _openPeople() async {
    final ctx = _eventCtx;
    if (ctx == null) return;
    await Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => PeopleScreen(
          eventId: widget.eventId, slug: ctx.slug, registrationId: _rid),
    ));
    if (mounted) _load();
  }

  Widget _buildList() {
    if (_threads.isEmpty) {
      final canBrowse = _eventCtx != null;
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          const SizedBox(height: 100),
          EmptyState(
            icon: Icons.forum_outlined,
            title: 'No conversations yet',
            message: canBrowse
                ? 'Conversations start when you message someone. Browse who '
                    'else is at this event and say hello.'
                : 'Conversations you start with other attendees appear here.',
            ctaLabel: canBrowse ? 'Find people to message' : null,
            onCta: canBrowse ? _openPeople : null,
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

/// Classifies a caught load error into a [StatusReason] so [ErrorStateView]
/// shows the right icon/copy — network for connectivity, and the ApiException
/// status code for anything the server told us (403 permission, 404 not
/// found, 402 plan-gated) — falling back to a generic error otherwise.
StatusReason _reasonFor(Object? error, String message) {
  if (message.toLowerCase().contains("couldn't reach the server")) {
    return StatusReason.network;
  }
  if (error is ApiException) {
    switch (error.status) {
      case 402:
        return StatusReason.plan;
      case 403:
        return StatusReason.permission;
      case 404:
        return StatusReason.notFound;
    }
  }
  return StatusReason.generic;
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
