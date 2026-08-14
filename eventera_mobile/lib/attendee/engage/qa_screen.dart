import 'package:flutter/material.dart';

import '../../net.dart';
import '../../ui/components.dart';
import '../../ui/tokens.dart';
import '../event_context.dart';
import '../register/registration_screen.dart';
import '_shared.dart';

/// QaScreen — audience Q&A.
///
/// Reads used to go straight to `qa_questions_public` (078 lockdown) via
/// Supabase, which bypassed the admin "qa" platform kill switch entirely —
/// the switch is enforced in the API route, not in RLS, so a direct table
/// read never saw it. Now routed through the gated GET below, same fix
/// pattern as GET /api/threads and GET /api/events/[id]/people.
///
/// Contracts verified:
///  - Read:    GET /api/events/[id]/q-and-a[?session_id=] → { questions: [...] },
///             each row is is_anonymous ? {..., registrations: null} :
///             {..., registrations: {attendee_name} | null}, status already
///             excludes 'hidden'. Gated by isPlatformFeatureEnabled('qa').
///  - Ask:     POST /api/events/[id]/q-and-a
///             {registration_id?, question, is_anonymous, session_id?}.
///  - Upvote:  apiPut('/api/events/[id]/q-and-a', {question_id, registration_id})
///             → toggles (RPC toggle_qa_upvote); returns {upvoted: bool}.
///  - My upvotes: qa_upvotes where registration_id (col question_id) — still a
///    direct read (no gated endpoint exists for "my upvotes"), but it only
///    ever runs after the gated question list above has already succeeded,
///    so a disabled kill switch still stops here first.
class QaScreen extends StatefulWidget {
  final String eventId;
  final String? registrationId;
  final String? qrCodeToken;
  final String? sessionId;
  const QaScreen({
    super.key,
    required this.eventId,
    this.registrationId,
    this.qrCodeToken,
    this.sessionId,
  });

  @override
  State<QaScreen> createState() => _QaScreenState();
}

class _Question {
  final String id;
  final String text;
  final String askerName;
  final bool isAnonymous;
  final String status;
  final bool isFeatured;
  final DateTime? createdAt;
  int upvotes;
  _Question({
    required this.id,
    required this.text,
    required this.askerName,
    required this.isAnonymous,
    required this.status,
    required this.isFeatured,
    required this.createdAt,
    required this.upvotes,
  });
}

class _QaScreenState extends State<QaScreen> {
  bool _loading = true;
  String? _error;
  StatusReason _errorReason = StatusReason.generic;
  List<_Question> _questions = [];
  final Set<String> _myUpvotes = {};
  final Set<String> _busy = {};
  bool _submitting = false;
  int _filter = 0; // 0 = Top, 1 = Recent
  String? _rid;
  String? _token;

  @override
  void initState() {
    super.initState();
    _rid = widget.registrationId;
    _token = widget.qrCodeToken;
    _resolveRegThenLoad();
  }

  Future<void> _resolveRegThenLoad() async {
    _rid = await effectiveRegId(widget.registrationId, widget.eventId);
    _token = await effectiveQrToken(widget.qrCodeToken, widget.eventId);
    if (!mounted) return;
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await apiGet('/api/events/${widget.eventId}/q-and-a',
          query: {
            if (widget.sessionId != null) 'session_id': widget.sessionId,
          });
      final rows = asMapList(data is Map ? data['questions'] : data);

      final list = <_Question>[];
      for (final map in rows) {
        final anon = asBool(map['is_anonymous']);
        // The route redacts this server-side respecting anonymity (registrations
        // is null whenever is_anonymous, and registration_id is stripped
        // entirely) — no client-side join needed.
        final regs = map['registrations'];
        final name = anon
            ? 'Anonymous'
            : (regs is Map ? asString(regs['attendee_name'], 'Attendee') : 'Attendee');
        list.add(_Question(
          id: asString(map['id']),
          text: asString(map['question']),
          askerName: name,
          isAnonymous: anon,
          status: asString(map['status'], 'pending'),
          isFeatured: asBool(map['is_featured']),
          createdAt: asDate(map['created_at']),
          upvotes: asInt(map['upvotes_count']),
        ));
      }

      _myUpvotes.clear();
      final rid = _rid;
      if (rid != null) {
        final ups = await supa
            .from('qa_upvotes')
            .select('question_id')
            .eq('registration_id', rid);
        for (final u in (ups as List).whereType<Map>()) {
          _myUpvotes.add(asString(u['question_id']));
        }
      }
      if (!mounted) return;
      setState(() {
        _questions = list;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      final msg = describeError(e, context: 'the questions');
      setState(() {
        _error = msg;
        _errorReason = _reasonFor(e, msg);
        _loading = false;
      });
    }
  }

  Future<void> _upvote(_Question q) async {
    final rid = _rid;
    if (rid == null) {
      showToast(context, 'Register for this event to upvote',
          type: ToastType.error);
      return;
    }
    if (_busy.contains(q.id)) return;
    setState(() => _busy.add(q.id));
    // optimistic
    final wasUp = _myUpvotes.contains(q.id);
    setState(() {
      if (wasUp) {
        _myUpvotes.remove(q.id);
        q.upvotes = (q.upvotes - 1).clamp(0, 1 << 30);
      } else {
        _myUpvotes.add(q.id);
        q.upvotes += 1;
      }
    });
    try {
      final res = await apiPut('/api/events/${widget.eventId}/q-and-a', {
        'question_id': q.id,
        'registration_id': rid,
        if (_token != null) 'qr_code_token': _token,
      });
      // Route returns {upvoted: bool} — reconcile if it disagrees.
      if (res is Map && res.containsKey('upvoted')) {
        final upvoted = asBool(res['upvoted']);
        if (upvoted && !_myUpvotes.contains(q.id)) {
          _myUpvotes.add(q.id);
          q.upvotes += 1;
        } else if (!upvoted && _myUpvotes.contains(q.id)) {
          _myUpvotes.remove(q.id);
          q.upvotes = (q.upvotes - 1).clamp(0, 1 << 30);
        }
      }
      _reorder();
      if (mounted) setState(() {});
    } catch (e) {
      // rollback
      if (mounted) {
        setState(() {
          if (wasUp) {
            _myUpvotes.add(q.id);
            q.upvotes += 1;
          } else {
            _myUpvotes.remove(q.id);
            q.upvotes = (q.upvotes - 1).clamp(0, 1 << 30);
          }
        });
        showToast(context, describeError(e, context: 'your upvote'),
            type: ToastType.error);
      }
    } finally {
      if (mounted) setState(() => _busy.remove(q.id));
    }
  }

  void _reorder() {
    _questions.sort((a, b) => b.upvotes.compareTo(a.upvotes));
  }

  List<_Question> get _visible {
    final list = List<_Question>.from(_questions);
    if (_filter == 1) {
      list.sort((a, b) {
        final ad = a.createdAt, bd = b.createdAt;
        if (ad == null && bd == null) return 0;
        if (ad == null) return 1;
        if (bd == null) return -1;
        return bd.compareTo(ad);
      });
    } else {
      list.sort((a, b) => b.upvotes.compareTo(a.upvotes));
    }
    return list;
  }

  Future<void> _openComposer() async {
    if (_rid == null) {
      // Only registered attendees can ask. Take them to registration rather
      // than stopping at an error toast they can't act on.
      final ctx = EventContext.current;
      if (ctx != null && ctx.eventId == widget.eventId && ctx.slug.isNotEmpty) {
        await Navigator.of(context).push(MaterialPageRoute(
          builder: (_) => RegistrationScreen(
            eventId: ctx.eventId,
            slug: ctx.slug,
            eventName: ctx.eventName,
          ),
        ));
        if (!mounted) return;
        // Registration updates EventContext — pick the new id (and token) up
        // so the next tap opens the composer instead of bouncing again.
        _rid = await effectiveRegId(widget.registrationId, widget.eventId);
        _token = await effectiveQrToken(widget.qrCodeToken, widget.eventId);
        if (!mounted) return;
        setState(() {});
        return;
      }
      showToast(context, 'Register for this event to ask a question',
          type: ToastType.error);
      return;
    }
    final result =
        await showMSheet<_AskResult>(context, const _AskSheet());
    if (result == null) return;
    setState(() => _submitting = true);
    try {
      await apiPost('/api/events/${widget.eventId}/q-and-a', {
        'registration_id': _rid,
        'question': result.text,
        'is_anonymous': result.anonymous,
        if (widget.sessionId != null) 'session_id': widget.sessionId,
        if (_token != null) 'qr_code_token': _token,
      });
      if (mounted) {
        showToast(context, 'Your question was submitted',
            type: ToastType.success);
      }
      await _load();
    } catch (e) {
      if (mounted) {
        showToast(context, describeError(e, context: 'your question'),
            type: ToastType.error);
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: MAppBar(
        title: 'Live Q&A',
        hairline: true,
        actions: const [
          Padding(
            padding: EdgeInsets.only(right: 8),
            child: Center(child: Tag('Live', kind: TagKind.danger, dot: true)),
          ),
        ],
      ),
      bottomBar: _loading || _error != null
          ? null
          : StickyCta(children: [
              Expanded(
                child: MButton('Ask a question',
                    icon: Icons.add,
                    loading: _submitting,
                    onTap: _openComposer),
              ),
            ]),
      body: _loading || _error != null
          ? _body()
          : Column(
              children: [
                _filterRow(),
                Expanded(child: _body()),
              ],
            ),
    );
  }

  Widget _filterRow() {
    return SizedBox(
      height: 54,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(
            horizontal: AppSpace.lg, vertical: AppSpace.sm),
        children: [
          MChip('Top', selected: _filter == 0, onTap: () => setState(() => _filter = 0)),
          const SizedBox(width: 8),
          MChip('Recent',
              selected: _filter == 1, onTap: () => setState(() => _filter = 1)),
        ],
      ),
    );
  }

  Widget _body() {
    if (_loading) return const LoadingState();
    if (_error != null) {
      return ErrorStateView(
          message: _error!, onRetry: _load, reason: _errorReason);
    }
    final visible = _visible;
    return RefreshIndicator(
      color: AppColors.forest,
      onRefresh: _load,
      child: visible.isEmpty
          ? ListView(children: [
              SizedBox(height: MediaQuery.of(context).size.height * 0.18),
              EngageState(
                icon: Icons.forum_outlined,
                title: 'No questions yet',
                subtitle:
                    'Nobody has asked anything at this event. Yours would be first.',
                action: MButton('Ask a question',
                    icon: Icons.add,
                    fullWidth: false,
                    small: true,
                    onTap: _openComposer),
              ),
            ])
          : ListView.builder(
              padding: const EdgeInsets.fromLTRB(
                  AppSpace.lg, AppSpace.xs, AppSpace.lg, AppSpace.xxxl),
              itemCount: visible.length,
              itemBuilder: (_, i) => _questionCard(visible[i]),
            ),
    );
  }

  Widget _questionCard(_Question q) {
    final upvoted = _myUpvotes.contains(q.id);
    final busy = _busy.contains(q.id);
    final meta = [
      q.askerName,
      if (q.createdAt != null) fmtTime(q.createdAt!),
    ].join(' · ');
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpace.md),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(
            color: q.isFeatured ? AppColors.gold : AppColors.border,
            width: q.isFeatured ? 1.5 : 1),
        boxShadow: AppShadow.soft,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Upvote triangle + count
          GestureDetector(
            onTap: busy ? null : () => _upvote(q),
            behavior: HitTestBehavior.opaque,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.arrow_drop_up,
                    size: 30,
                    color: upvoted ? AppColors.forest : AppColors.inkMuted),
                Text('${q.upvotes}',
                    style: AppText.numSm.copyWith(
                        fontWeight: FontWeight.w500,
                        color: upvoted ? AppColors.forest : AppColors.inkMuted)),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(q.text,
                    style: AppText.body.copyWith(color: AppColors.ink, height: 1.45)),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: Text(meta,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppText.caption.copyWith(fontSize: 11.5, letterSpacing: 0)),
                    ),
                    if (q.isFeatured) ...[
                      const SizedBox(width: 8),
                      const Tag('Featured', kind: TagKind.gold),
                    ],
                    if (q.status == 'answered') ...[
                      const SizedBox(width: 8),
                      const Tag('Answered', kind: TagKind.success),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Classifies a caught load error into a [StatusReason] so [ErrorStateView]
/// shows the right icon/copy — network for connectivity, and the
/// ApiException status code for anything the server told us (404 covers both
/// "not found" and the admin "qa" kill switch's 404 response).
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

class _AskResult {
  final String text;
  final bool anonymous;
  _AskResult(this.text, this.anonymous);
}

class _AskSheet extends StatefulWidget {
  const _AskSheet();

  @override
  State<_AskSheet> createState() => _AskSheetState();
}

class _AskSheetState extends State<_AskSheet> {
  final _controller = TextEditingController();
  bool _anon = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(0, 4, 0, 4),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Ask a question', style: AppText.h3),
          const SizedBox(height: 14),
          MInput(
            controller: _controller,
            hint: 'What would you like to ask?',
            minLines: 3,
            maxLines: 5,
          ),
          const SizedBox(height: AppSpace.base),
          Container(
            decoration: const BoxDecoration(
              border: Border(top: BorderSide(color: AppColors.border)),
            ),
            padding: const EdgeInsets.symmetric(vertical: AppSpace.md),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Ask anonymously', style: AppText.bodyStrong),
                      const SizedBox(height: 1),
                      Text('Your name won\'t be shown',
                          style: AppText.bodySm.copyWith(color: AppColors.inkMuted)),
                    ],
                  ),
                ),
                MToggle(value: _anon, onChanged: (v) => setState(() => _anon = v)),
              ],
            ),
          ),
          const SizedBox(height: AppSpace.md),
          MButton('Post question', onTap: () {
            final t = _controller.text.trim();
            if (t.isEmpty) return;
            Navigator.of(context).pop(_AskResult(t, _anon));
          }),
        ],
      ),
    );
  }
}
