// SP02 · Session live Q&A — speaker moderation.
// Reads `qa_questions` for a session (upvote-sorted) and lets the assigned
// speaker mark a question answered, feature it, or hide it. Writes go through
// the SECURITY DEFINER `speaker_set_qa_status` RPC, which derives authority from
// auth.uid() + the question's own session — no ids are trusted from the client.
// Direct table writes are blocked by RLS (migration 050), so the RPC is the
// sanctioned path. Realtime keeps the list live as the audience upvotes/asks.

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../net.dart';
import '../../ui/tokens.dart';
import '../../ui/components.dart';
import '../role_widgets.dart';
import 'speaker_api.dart';

class SessionQaScreen extends StatefulWidget {
  final String eventId;
  final String sessionId;
  final String eventName;
  final String sessionTitle;
  const SessionQaScreen({
    super.key,
    required this.eventId,
    required this.sessionId,
    required this.eventName,
    required this.sessionTitle,
  });

  @override
  State<SessionQaScreen> createState() => _SessionQaScreenState();
}

class _SessionQaScreenState extends State<SessionQaScreen> {
  List<QaQuestion> _all = [];
  bool _loading = true;
  bool _error = false;
  int _filter = 0; // 0 all · 1 unanswered · 2 answered
  final Set<String> _busy = {}; // question ids with an in-flight write

  RealtimeChannel? _channel;

  @override
  void initState() {
    super.initState();
    _reload();
    _channel = supa
        .channel('qa:${widget.sessionId}')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'qa_questions',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'session_id',
            value: widget.sessionId,
          ),
          // Don't stomp a row mid-write; only refresh when nothing is in-flight.
          callback: (_) {
            if (mounted && _busy.isEmpty) _reload(silent: true);
          },
        )
        .subscribe();
  }

  @override
  void dispose() {
    final c = _channel;
    if (c != null) supa.removeChannel(c);
    super.dispose();
  }

  Future<void> _reload({bool silent = false}) async {
    if (!silent) setState(() => _loading = true);
    try {
      final list = await SpeakerApi.sessionQuestions(widget.sessionId);
      if (!mounted) return;
      setState(() {
        _all = list;
        _loading = false;
        _error = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        if (!silent) _error = true;
      });
    }
  }

  List<QaQuestion> get _visible {
    if (_filter == 1) return _all.where((q) => !q.answered).toList();
    if (_filter == 2) return _all.where((q) => q.answered).toList();
    return _all;
  }

  // ── Optimistic mutations with rollback ──────────────────────────────────────

  Future<void> _toggleAnswered(QaQuestion q) async {
    HapticFeedback.mediumImpact();
    final prev = q.status;
    final next = q.answered ? 'pending' : 'answered';
    setState(() {
      q.status = next;
      _busy.add(q.id);
    });
    final res = await SpeakerApi.setQaStatus(q.id, status: next);
    if (!mounted) return;
    setState(() => _busy.remove(q.id));
    if (!res.ok) {
      setState(() => q.status = prev);
      showToast(context, res.message);
    } else {
      showToast(context,
          next == 'answered' ? 'Marked answered' : 'Moved back to open');
    }
  }

  Future<void> _toggleFeatured(QaQuestion q) async {
    HapticFeedback.selectionClick();
    final prev = q.featured;
    final next = !q.featured;
    setState(() {
      q.featured = next;
      _busy.add(q.id);
    });
    final res = await SpeakerApi.setQaStatus(q.id, featured: next);
    if (!mounted) return;
    setState(() => _busy.remove(q.id));
    if (!res.ok) {
      setState(() => q.featured = prev);
      showToast(context, res.message);
    } else {
      showToast(context, next ? 'Featured' : 'Unfeatured');
    }
  }

  Future<void> _hide(QaQuestion q) async {
    final ok = await _confirmHide(q);
    if (ok != true) return;
    HapticFeedback.mediumImpact();
    // Optimistically remove; restore on failure.
    final index = _all.indexOf(q);
    setState(() {
      _all.remove(q);
      _busy.add(q.id);
    });
    final res = await SpeakerApi.setQaStatus(q.id, status: 'hidden');
    if (!mounted) return;
    setState(() => _busy.remove(q.id));
    if (!res.ok) {
      setState(() =>
          _all.insert(index < 0 || index > _all.length ? _all.length : index, q));
      showToast(context, res.message);
    } else {
      showToast(context, 'Question hidden');
    }
  }

  Future<bool?> _confirmHide(QaQuestion q) {
    return showModalBottomSheet<bool>(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
          borderRadius:
              BorderRadius.vertical(top: Radius.circular(AppRadius.sheet))),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 18, 20, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Hide this question?', style: AppText.h3),
              const SizedBox(height: 6),
              Text(
                q.text,
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
                style: AppText.bodySm,
              ),
              const SizedBox(height: 18),
              GestureDetector(
                onTap: () => Navigator.pop(ctx, true),
                child: Container(
                  height: 52,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: AppColors.danger,
                    borderRadius: BorderRadius.circular(AppRadius.btn),
                  ),
                  child: Text('Hide question',
                      style: AppText.btn.copyWith(color: Colors.white)),
                ),
              ),
              const SizedBox(height: 8),
              MButton('Cancel',
                  kind: MBtnKind.sec, onTap: () => Navigator.pop(ctx, false)),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final answered = _all.where((q) => q.answered).length;
    return MScaffold(
      appBar: const MAppBar(title: 'Audience Q&A'),
      body: Column(
        children: [
          RoleBar(
            icon: Icons.mic_none,
            eventName: widget.sessionTitle,
            roleLine: 'Speaker · moderating',
          ),
          if (!_loading && !_error && _all.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
              child: SegControl(
                segments: [
                  'All ${_all.length}',
                  'Open ${_all.length - answered}',
                  'Answered $answered',
                ],
                index: _filter,
                onChanged: (i) => setState(() => _filter = i),
              ),
            ),
          Expanded(child: _content()),
        ],
      ),
    );
  }

  Widget _content() {
    if (_loading) return const LoadingState();
    if (_error) {
      return ErrorStateView(
          message: "We couldn't load the questions.", onRetry: _reload);
    }
    if (_all.isEmpty) {
      return const EmptyState(
        icon: Icons.forum_outlined,
        title: 'No questions yet',
        message: 'Audience questions will appear here, sorted by upvotes.',
      );
    }
    final qs = _visible;
    return RefreshIndicator(
      color: AppColors.forest,
      onRefresh: _reload,
      child: qs.isEmpty
          ? ListView(children: [
              const SizedBox(height: 80),
              EmptyState(
                icon: Icons.filter_alt_off_outlined,
                title: _filter == 1
                    ? 'Every question is answered'
                    : 'Nothing answered yet',
                message: _filter == 1
                    ? 'You have replied to all ${_all.length} questions in '
                        'this session.'
                    : 'You have not answered any of the ${_all.length} '
                        'questions in this session yet.',
                ctaLabel: 'Show all questions',
                onCta: () => setState(() => _filter = 0),
              ),
            ])
          : ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
              itemCount: qs.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (_, i) => _card(qs[i]),
            ),
    );
  }

  Widget _card(QaQuestion q) {
    final top = q.featured;
    final busy = _busy.contains(q.id);
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
            color: top ? AppColors.gold : AppColors.border,
            width: top ? 2 : 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Column(
                children: [
                  Icon(Icons.keyboard_arrow_up,
                      size: 20,
                      color: top ? AppColors.gold : AppColors.inkMuted),
                  Text('${q.votes}',
                      style: TextStyle(
                          color: top ? AppColors.goldHover : AppColors.inkSoft,
                          fontWeight: FontWeight.w700,
                          fontSize: 13)),
                ],
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(q.text,
                        style: const TextStyle(
                            color: AppColors.ink, fontSize: 14.5, height: 1.4)),
                    if (q.answered || q.featured) ...[
                      const SizedBox(height: 8),
                      Wrap(spacing: 6, runSpacing: 6, children: [
                        if (q.answered)
                          const Tag('Answered',
                              kind: TagKind.success, dot: true),
                        if (q.featured) const Tag('Featured', kind: TagKind.gold),
                      ]),
                    ],
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Divider(height: 1, color: AppColors.border),
          const SizedBox(height: 8),
          Row(
            children: [
              _action(
                icon: q.answered
                    ? Icons.undo_rounded
                    : Icons.check_circle_outline,
                label: q.answered ? 'Reopen' : 'Answered',
                primary: !q.answered,
                busy: busy,
                onTap: busy ? null : () => _toggleAnswered(q),
              ),
              const SizedBox(width: 8),
              _action(
                icon: q.featured ? Icons.star_rounded : Icons.star_outline,
                label: q.featured ? 'Unfeature' : 'Feature',
                onTap: busy ? null : () => _toggleFeatured(q),
              ),
              const Spacer(),
              _iconBtn(
                icon: Icons.visibility_off_outlined,
                onTap: busy ? null : () => _hide(q),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _action({
    required IconData icon,
    required String label,
    VoidCallback? onTap,
    bool primary = false,
    bool busy = false,
  }) {
    final fg = primary ? Colors.white : AppColors.forest;
    final bg = primary ? AppColors.forest : AppColors.forestSoft;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 40,
        padding: const EdgeInsets.symmetric(horizontal: 14),
        decoration: BoxDecoration(
          color: onTap == null ? bg.withValues(alpha: 0.55) : bg,
          borderRadius: BorderRadius.circular(999),
        ),
        alignment: Alignment.center,
        child: busy
            ? SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(strokeWidth: 2, color: fg))
            : Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(icon, size: 17, color: fg),
                  const SizedBox(width: 6),
                  Text(label,
                      style: TextStyle(
                          color: fg,
                          fontSize: 13,
                          fontWeight: FontWeight.w600)),
                ],
              ),
      ),
    );
  }

  Widget _iconBtn({required IconData icon, VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 40,
        height: 40,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: AppColors.creamSoft,
          borderRadius: BorderRadius.circular(999),
        ),
        child: Icon(icon,
            size: 18,
            color: onTap == null ? AppColors.inkMuted : AppColors.inkSoft),
      ),
    );
  }
}
