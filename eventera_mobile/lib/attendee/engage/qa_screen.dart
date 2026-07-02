import 'package:flutter/material.dart';

import '../../net.dart';
import '../../theme.dart';
import '_shared.dart';

/// QaScreen — audience Q&A. Reads `qa_questions` (public) ordered by upvotes,
/// lets attendees ask and upvote.
///
/// Contracts verified:
///  - Read:    qa_questions select('*, registrations(attendee_name)')
///             .eq('event_id', ...).neq('status','hidden')
///             .order('upvotes_count', desc).order('created_at', asc).
///  - Ask:     POST /api/events/[id]/q-and-a
///             {registration_id?, question, is_anonymous, session_id?}.
///  - Upvote:  apiPut('/api/events/[id]/q-and-a', {question_id, registration_id})
///             → toggles (RPC toggle_qa_upvote); returns {upvoted: bool}.
///  - My upvotes: qa_upvotes where registration_id (col question_id).
class QaScreen extends StatefulWidget {
  final String eventId;
  final String? registrationId;
  final String? sessionId;
  const QaScreen({
    super.key,
    required this.eventId,
    this.registrationId,
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
  int upvotes;
  _Question({
    required this.id,
    required this.text,
    required this.askerName,
    required this.isAnonymous,
    required this.status,
    required this.isFeatured,
    required this.upvotes,
  });
}

class _QaScreenState extends State<QaScreen> {
  bool _loading = true;
  String? _error;
  List<_Question> _questions = [];
  final Set<String> _myUpvotes = {};
  final Set<String> _busy = {};
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      var query = supa
          .from('qa_questions')
          .select('*, registrations(attendee_name)')
          .eq('event_id', widget.eventId)
          .neq('status', 'hidden');
      if (widget.sessionId != null) {
        query = query.eq('session_id', widget.sessionId!);
      }
      final rows = await query
          .order('upvotes_count', ascending: false)
          .order('created_at', ascending: true);

      final list = <_Question>[];
      for (final r in (rows as List).whereType<Map>()) {
        final map = Map<String, dynamic>.from(r);
        final reg = map['registrations'];
        final anon = asBool(map['is_anonymous']);
        final name = (!anon && reg is Map && reg['attendee_name'] != null)
            ? reg['attendee_name'].toString()
            : 'Anonymous';
        list.add(_Question(
          id: asString(map['id']),
          text: asString(map['question']),
          askerName: name,
          isAnonymous: anon,
          status: asString(map['status'], 'pending'),
          isFeatured: asBool(map['is_featured']),
          upvotes: asInt(map['upvotes_count']),
        ));
      }

      _myUpvotes.clear();
      final rid = widget.registrationId;
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
      setState(() {
        _error = e is ApiException ? e.message : e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _upvote(_Question q) async {
    final rid = widget.registrationId;
    if (rid == null) {
      showEngageSnack(context, 'Register for this event to upvote', error: true);
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
        showEngageSnack(context,
            e is ApiException ? e.message : 'Could not upvote',
            error: true);
      }
    } finally {
      if (mounted) setState(() => _busy.remove(q.id));
    }
  }

  void _reorder() {
    _questions.sort((a, b) => b.upvotes.compareTo(a.upvotes));
  }

  Future<void> _openComposer() async {
    if (widget.registrationId == null) {
      showEngageSnack(context, 'Register for this event to ask a question',
          error: true);
      return;
    }
    final result = await showModalBottomSheet<_AskResult>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Brand.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => const _AskSheet(),
    );
    if (result == null) return;
    setState(() => _submitting = true);
    try {
      await apiPost('/api/events/${widget.eventId}/q-and-a', {
        'registration_id': widget.registrationId,
        'question': result.text,
        'is_anonymous': result.anonymous,
        if (widget.sessionId != null) 'session_id': widget.sessionId,
      });
      if (mounted) showEngageSnack(context, 'Your question was submitted');
      await _load();
    } catch (e) {
      if (mounted) {
        showEngageSnack(context,
            e is ApiException ? e.message : 'Could not submit your question',
            error: true);
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Q&A'),
        backgroundColor: Brand.cream,
        surfaceTintColor: Colors.transparent,
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _submitting ? null : _openComposer,
        backgroundColor: Brand.forest,
        foregroundColor: Colors.white,
        icon: _submitting
            ? const SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(
                    strokeWidth: 2, color: Colors.white))
            : const Icon(Icons.add),
        label: const Text('Ask a question'),
      ),
      body: _body(),
    );
  }

  Widget _body() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator(color: Brand.forest));
    }
    if (_error != null) {
      return EngageState(
        icon: Icons.error_outline,
        title: 'Couldn\'t load Q&A',
        subtitle: _error,
        action: FilledButton(onPressed: _load, child: const Text('Retry')),
      );
    }
    return RefreshIndicator(
      color: Brand.forest,
      onRefresh: _load,
      child: _questions.isEmpty
          ? ListView(children: [
              SizedBox(height: MediaQuery.of(context).size.height * 0.22),
              const EngageState(
                icon: Icons.forum_outlined,
                title: 'No questions yet',
                subtitle: 'Be the first to ask.',
              ),
            ])
          : ListView.builder(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
              itemCount: _questions.length,
              itemBuilder: (_, i) => _questionCard(_questions[i]),
            ),
    );
  }

  Widget _questionCard(_Question q) {
    final upvoted = _myUpvotes.contains(q.id);
    final busy = _busy.contains(q.id);
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Brand.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
            color: q.isFeatured ? Brand.gold : Brand.border,
            width: q.isFeatured ? 1.5 : 1),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Upvote button
          GestureDetector(
            onTap: busy ? null : () => _upvote(q),
            child: Container(
              width: 52,
              padding: const EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(
                color: upvoted ? Brand.forest : Brand.cream,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                    color: upvoted ? Brand.forest : Brand.border),
              ),
              child: Column(
                children: [
                  Icon(
                    Icons.keyboard_arrow_up,
                    color: upvoted ? Colors.white : Brand.inkSoft,
                  ),
                  Text(
                    '${q.upvotes}',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: upvoted ? Colors.white : Brand.inkSoft,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  q.text,
                  style: const TextStyle(
                    fontSize: 15,
                    color: Brand.ink,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Text(
                      q.askerName,
                      style: const TextStyle(fontSize: 12, color: Brand.muted),
                    ),
                    if (q.isFeatured) ...[
                      const SizedBox(width: 8),
                      _tag('Featured', Brand.gold),
                    ],
                    if (q.status == 'answered') ...[
                      const SizedBox(width: 8),
                      _tag('Answered', Brand.success),
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

  Widget _tag(String label, Color c) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(
        color: c.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(5),
      ),
      child: Text(label,
          style: TextStyle(
              fontSize: 10, fontWeight: FontWeight.w600, color: c)),
    );
  }
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
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Ask a question',
            style: TextStyle(
                fontSize: 18, fontWeight: FontWeight.w700, color: Brand.ink),
          ),
          const SizedBox(height: 14),
          TextField(
            controller: _controller,
            autofocus: true,
            maxLines: 4,
            maxLength: 500,
            textCapitalization: TextCapitalization.sentences,
            decoration: const InputDecoration(
              hintText: 'What would you like to ask?',
            ),
          ),
          Row(
            children: [
              Checkbox(
                value: _anon,
                activeColor: Brand.forest,
                onChanged: (v) => setState(() => _anon = v ?? false),
              ),
              const Text('Ask anonymously',
                  style: TextStyle(fontSize: 14, color: Brand.inkSoft)),
            ],
          ),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: () {
                final t = _controller.text.trim();
                if (t.isEmpty) return;
                Navigator.of(context).pop(_AskResult(t, _anon));
              },
              child: const Text('Submit question'),
            ),
          ),
        ],
      ),
    );
  }
}
