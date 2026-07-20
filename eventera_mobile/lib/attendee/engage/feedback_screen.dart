import 'package:flutter/material.dart';

import '../../net.dart';
import '../../ui/components.dart';
import '../../ui/tokens.dart';
import '_shared.dart';

/// FeedbackScreen — post-event feedback: a 1–5 star rating, multi-select
/// highlight chips, and a free-text comment.
///
/// Contract verified:
///  - POST /api/events/[id]/feedback
///    { registration_id, overall_rating?, highlights?: string[], comment? }
///    (upsert on registration_id,event_id → one feedback per attendee).
class FeedbackScreen extends StatefulWidget {
  final String eventId;
  final String? registrationId;
  const FeedbackScreen({
    super.key,
    required this.eventId,
    this.registrationId,
  });

  @override
  State<FeedbackScreen> createState() => _FeedbackScreenState();
}

class _FeedbackScreenState extends State<FeedbackScreen> {
  static const _highlightOptions = [
    'Great speakers',
    'Well organized',
    'Good networking',
    'Valuable content',
    'Nice venue',
    'Smooth check-in',
    'Would recommend',
    'Fun',
  ];

  int _rating = 0;
  final Set<String> _selected = {};
  final _comment = TextEditingController();
  bool _submitting = false;
  bool _done = false;
  String? _rid;

  @override
  void initState() {
    super.initState();
    _rid = widget.registrationId;
    _resolveReg();
  }

  Future<void> _resolveReg() async {
    final rid = await effectiveRegId(widget.registrationId, widget.eventId);
    if (!mounted) return;
    setState(() => _rid = rid);
  }

  @override
  void dispose() {
    _comment.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final rid = _rid;
    if (rid == null) return;
    if (_rating == 0 && _selected.isEmpty && _comment.text.trim().isEmpty) {
      showToast(context, 'Add a rating or a comment first',
          type: ToastType.error);
      return;
    }
    setState(() => _submitting = true);
    try {
      await apiPost('/api/events/${widget.eventId}/feedback', {
        'registration_id': rid,
        if (_rating > 0) 'overall_rating': _rating,
        if (_selected.isNotEmpty) 'highlights': _selected.toList(),
        if (_comment.text.trim().isNotEmpty) 'comment': _comment.text.trim(),
      });
      if (mounted) setState(() => _done = true);
    } catch (e) {
      if (mounted) {
        showToast(context, describeError(e, context: 'your feedback'),
            type: ToastType.error);
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final gated = _rid == null;
    return MScaffold(
      appBar: const MAppBar(title: 'Feedback', hairline: true),
      bottomBar: (gated || _done)
          ? null
          : StickyCta(children: [
              Expanded(
                child: MButton('Submit feedback',
                    loading: _submitting, onTap: _submit),
              ),
            ]),
      body: gated
          ? RegisterPrompt(
              message: 'Register for this event to leave feedback',
              eventId: widget.eventId)
          : _done
              ? _thanks()
              : _form(),
    );
  }

  Widget _thanks() {
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
            Text('Feedback sent', style: AppText.h1.copyWith(fontSize: 24)),
            const SizedBox(height: AppSpace.sm),
            Text(
              'Your feedback went to the organizer. See you at the next one.',
              textAlign: TextAlign.center,
              style: AppText.body,
            ),
            const SizedBox(height: AppSpace.xl),
            MButton('Edit my feedback',
                kind: MBtnKind.sec,
                fullWidth: false,
                onTap: () => setState(() {
                      _done = false;
                    })),
          ],
        ),
      ),
    );
  }

  Widget _form() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(
          AppSpace.lg, AppSpace.lg, AppSpace.lg, AppSpace.xxxl),
      children: [
        Text('How was the event?', style: AppText.h1.copyWith(fontSize: 22)),
        const SizedBox(height: 6),
        Text('Your feedback is shared privately with the organizer.',
            style: AppText.body),
        const SizedBox(height: AppSpace.xxl),

        // Stars (centered)
        Center(
          child: StarRating(
            value: _rating,
            size: 40,
            onChanged: (v) => setState(() => _rating = v),
          ),
        ),
        const SizedBox(height: 10),
        Center(
          child: Text(_ratingLabel(),
              style: AppText.bodySm.copyWith(
                  fontWeight: FontWeight.w600, color: AppColors.inkSoft)),
        ),
        const SizedBox(height: AppSpace.xxl),

        // Highlights
        const SectionLabel('What stood out?'),
        const SizedBox(height: AppSpace.md),
        Wrap(
          spacing: 9,
          runSpacing: 9,
          children: _highlightOptions
              .map((o) => MChip(
                    o,
                    selected: _selected.contains(o),
                    onTap: () => setState(() {
                      if (_selected.contains(o)) {
                        _selected.remove(o);
                      } else {
                        _selected.add(o);
                      }
                    }),
                  ))
              .toList(),
        ),
        const SizedBox(height: AppSpace.xxl),

        // Comment
        MInput(
          label: 'Anything else? (optional)',
          hint: 'Share a highlight or suggestion',
          controller: _comment,
          minLines: 4,
          maxLines: 6,
        ),
      ],
    );
  }

  String _ratingLabel() {
    switch (_rating) {
      case 1:
        return 'Poor';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Great';
      case 5:
        return 'Excellent';
      default:
        return 'Tap to rate';
    }
  }
}
