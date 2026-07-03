import 'package:flutter/material.dart';

import '../../net.dart';
import '../../ui/components.dart';
import '../../ui/tokens.dart';
import '_shared.dart';

/// CfpScreen — Call for Papers submission (mirrors web `/e/[slug]/cfp`).
///
/// An attendee submits a talk/paper abstract. The CFP window is read from
/// `call_for_papers`; if it is closed (missing row or `is_open == false`) we
/// show a closed state. Otherwise the form POSTs to `/api/events/cfp`.
class CfpScreen extends StatefulWidget {
  final String eventId;
  final String slug;
  const CfpScreen({super.key, required this.eventId, required this.slug});

  @override
  State<CfpScreen> createState() => _CfpScreenState();
}

class _CfpScreenState extends State<CfpScreen> {
  // ── Load state
  bool _loading = true;
  String? _loadError;
  bool _open = false;
  String? _description;
  DateTime? _deadline;

  // ── Form fields
  final _title = TextEditingController();
  final _abstract = TextEditingController();
  final _keywords = TextEditingController();
  final _category = TextEditingController();
  final _authorName = TextEditingController();
  final _authorEmail = TextEditingController();
  final _affiliation = TextEditingController();
  bool _presenting = true;

  // ── Submit state
  bool _submitting = false;
  bool _done = false;
  String? _submitError;

  static const _abstractMax = 500;

  @override
  void initState() {
    super.initState();
    final email = currentUserEmail;
    if (email != null) _authorEmail.text = email;
    _load();
  }

  @override
  void dispose() {
    _title.dispose();
    _abstract.dispose();
    _keywords.dispose();
    _category.dispose();
    _authorName.dispose();
    _authorEmail.dispose();
    _affiliation.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _loadError = null;
    });
    try {
      final row = await supa
          .from('call_for_papers')
          .select('deadline_at, is_open, instructions')
          .eq('event_id', widget.eventId)
          .maybeSingle();
      if (!mounted) return;
      setState(() {
        _open = row != null && asBool(row['is_open']);
        _description = row == null ? null : _clean(asString(row['instructions']));
        _deadline = row == null ? null : asDate(row['deadline_at']);
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loadError = e is ApiException ? e.message : 'Could not load the call for papers';
        _loading = false;
      });
    }
  }

  String? _clean(String s) => s.trim().isEmpty ? null : s.trim();

  bool _validEmail(String s) =>
      RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(s.trim());

  Future<void> _submit() async {
    final title = _title.text.trim();
    final abstract = _abstract.text.trim();
    final authorName = _authorName.text.trim();
    final authorEmail = _authorEmail.text.trim();

    if (title.isEmpty) {
      _fail('Add a title for your abstract');
      return;
    }
    if (abstract.isEmpty) {
      _fail('Add an abstract');
      return;
    }
    if (authorName.isEmpty) {
      _fail('Add the author name');
      return;
    }
    if (!_validEmail(authorEmail)) {
      _fail('Enter a valid author email');
      return;
    }

    final keywordsList = _keywords.text
        .split(',')
        .map((k) => k.trim())
        .where((k) => k.isNotEmpty)
        .toList();
    final category = _category.text.trim();
    final affiliation = _affiliation.text.trim();

    setState(() {
      _submitting = true;
      _submitError = null;
    });
    try {
      await apiPost('/api/events/cfp', {
        'eventSlug': widget.slug,
        'title': title,
        'abstract': abstract,
        'keywords': keywordsList,
        'category': category,
        'primaryAuthor': {
          'name': authorName,
          'email': authorEmail,
          'affiliation': affiliation,
        },
        'presenting': _presenting,
        'coAuthors': <Map<String, dynamic>>[],
      });
      if (mounted) setState(() => _done = true);
    } catch (e) {
      if (mounted) {
        setState(() => _submitError =
            e is ApiException ? e.message : 'Could not submit your abstract');
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  void _fail(String msg) {
    setState(() => _submitError = msg);
    showEngageSnack(context, msg, error: true);
  }

  @override
  Widget build(BuildContext context) {
    final showCta = !_loading && _loadError == null && _open && !_done;
    return MScaffold(
      appBar: const MAppBar(title: 'Call for papers', hairline: true),
      bottomBar: showCta
          ? StickyCta(children: [
              Expanded(
                child: MButton('Submit abstract',
                    loading: _submitting, onTap: _submit),
              ),
            ])
          : null,
      body: _body(),
    );
  }

  Widget _body() {
    if (_loading) return const LoadingState();
    if (_loadError != null) {
      return ErrorStateView(message: _loadError!, onRetry: _load);
    }
    if (!_open) return _closed();
    if (_done) return _success();
    return _form();
  }

  Widget _closed() {
    final msg = _deadline != null
        ? 'Submissions closed on ${fmtDayLabel(_deadline!)}.'
        : 'Submissions for this event are closed.';
    return EmptyState(
      icon: Icons.description_outlined,
      title: 'Call for papers closed',
      message: msg,
    );
  }

  Widget _success() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpace.xxxl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 76,
              height: 76,
              alignment: Alignment.center,
              decoration: const BoxDecoration(
                  color: AppColors.forestSoft, shape: BoxShape.circle),
              child: const Icon(Icons.check_rounded,
                  size: 36, color: AppColors.forest),
            ),
            const SizedBox(height: AppSpace.lg),
            Text('Abstract submitted', style: AppText.h1.copyWith(fontSize: 24)),
            const SizedBox(height: AppSpace.sm),
            Text(
              'Thanks — your abstract is now with the organizers. '
              'They will be in touch about the review outcome.',
              textAlign: TextAlign.center,
              style: AppText.body,
            ),
            const SizedBox(height: AppSpace.xl),
            MButton('Done',
                fullWidth: false, onTap: () => Navigator.of(context).maybePop()),
          ],
        ),
      ),
    );
  }

  Widget _form() {
    final abstractLen = _abstract.text.characters.length;
    return ListView(
      padding: const EdgeInsets.fromLTRB(
          AppSpace.lg, AppSpace.lg, AppSpace.lg, AppSpace.xxxl),
      children: [
        Text('Submit an abstract', style: AppText.h1.copyWith(fontSize: 22)),
        const SizedBox(height: 6),
        Text('Propose a talk or paper for this event.', style: AppText.body),
        if (_description != null) ...[
          const SizedBox(height: AppSpace.base),
          Container(
            padding: const EdgeInsets.all(AppSpace.base),
            decoration: engageCard(),
            child: Text(_description!, style: AppText.bodySm),
          ),
        ],
        const SizedBox(height: AppSpace.xxl),

        // ── The talk
        const SectionLabel('Your submission'),
        const SizedBox(height: AppSpace.md),
        MInput(
          label: 'Title',
          hint: 'A clear, specific title',
          controller: _title,
        ),
        const SizedBox(height: AppSpace.base),
        MInput(
          label: 'Abstract',
          hint: 'What is it about, and why does it matter?',
          controller: _abstract,
          minLines: 4,
          maxLines: 8,
          onChanged: (_) => setState(() {}),
        ),
        const SizedBox(height: 6),
        Align(
          alignment: Alignment.centerRight,
          child: Text('$abstractLen / $_abstractMax',
              style: AppText.caption.copyWith(
                  color: abstractLen > _abstractMax
                      ? AppColors.danger
                      : AppColors.inkMuted)),
        ),
        const SizedBox(height: AppSpace.base),
        MInput(
          label: 'Keywords (optional)',
          hint: 'Comma-separated, e.g. design, africa, systems',
          controller: _keywords,
        ),
        const SizedBox(height: AppSpace.base),
        MInput(
          label: 'Category (optional)',
          hint: 'e.g. Talk, Workshop, Poster',
          controller: _category,
        ),
        const SizedBox(height: AppSpace.xxl),

        // ── The author
        const SectionLabel('About you'),
        const SizedBox(height: AppSpace.md),
        MInput(
          label: 'Author name',
          hint: 'Your full name',
          controller: _authorName,
        ),
        const SizedBox(height: AppSpace.base),
        MInput(
          label: 'Author email',
          hint: 'you@example.com',
          controller: _authorEmail,
          keyboardType: TextInputType.emailAddress,
        ),
        const SizedBox(height: AppSpace.base),
        MInput(
          label: 'Affiliation (optional)',
          hint: 'Company, university, or team',
          controller: _affiliation,
        ),
        const SizedBox(height: AppSpace.lg),
        _presentToggle(),

        if (_submitError != null) ...[
          const SizedBox(height: AppSpace.lg),
          _errorBox(_submitError!),
        ],
      ],
    );
  }

  Widget _presentToggle() {
    return GestureDetector(
      onTap: () => setState(() => _presenting = !_presenting),
      child: Container(
        padding: const EdgeInsets.symmetric(
            horizontal: AppSpace.base, vertical: 14),
        decoration: engageCard(),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('I will present this myself',
                      style: AppText.bodyStrong),
                  const SizedBox(height: 2),
                  Text('Turn off if a co-author will present.',
                      style: AppText.bodySm),
                ],
              ),
            ),
            const SizedBox(width: AppSpace.md),
            MToggle(
              value: _presenting,
              onChanged: (v) => setState(() => _presenting = v),
            ),
          ],
        ),
      ),
    );
  }

  Widget _errorBox(String msg) {
    return Container(
      padding: const EdgeInsets.all(AppSpace.md),
      decoration: BoxDecoration(
        color: AppColors.danger.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: AppColors.danger.withValues(alpha: 0.35)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.error_outline, size: 18, color: AppColors.danger),
          const SizedBox(width: 10),
          Expanded(
            child: Text(msg,
                style: AppText.bodySm.copyWith(color: AppColors.danger)),
          ),
        ],
      ),
    );
  }
}
     