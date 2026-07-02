import 'package:flutter/material.dart';

import '../../net.dart';
import '../../theme.dart';
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

  @override
  void dispose() {
    _comment.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final rid = widget.registrationId;
    if (rid == null) return;
    if (_rating == 0 && _selected.isEmpty && _comment.text.trim().isEmpty) {
      showEngageSnack(context, 'Add a rating or a comment first', error: true);
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
        showEngageSnack(context,
            e is ApiException ? e.message : 'Could not submit feedback',
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
        title: const Text('Feedback'),
        backgroundColor: Brand.cream,
        surfaceTintColor: Colors.transparent,
      ),
      body: widget.registrationId == null
          ? const RegisterPrompt(message: 'Register for this event to leave feedback')
          : _done
              ? _thanks()
              : _form(),
    );
  }

  Widget _thanks() {
    return EngageState(
      icon: Icons.check_circle_outline,
      title: 'Thanks for your feedback!',
      subtitle: 'Your response helps the organizer make the next event even better.',
      action: OutlinedButton(
        onPressed: () => setState(() {
          _done = false;
          _rating = 0;
          _selected.clear();
          _comment.clear();
        }),
        style: OutlinedButton.styleFrom(
          foregroundColor: Brand.forest,
          side: const BorderSide(color: Brand.forest),
        ),
        child: const Text('Edit my feedback'),
      ),
    );
  }

  Widget _form() {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        const Text(
          'How was the event?',
          style: TextStyle(
              fontSize: 20, fontWeight: FontWeight.w700, color: Brand.ink),
        ),
        const SizedBox(height: 6),
        const Text(
          'Your feedback is shared privately with the organizer.',
          style: TextStyle(fontSize: 14, color: Brand.muted),
        ),
        const SizedBox(height: 24),

        // Stars
        Center(
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(5, (i) {
              final v = i + 1;
              return IconButton(
                iconSize: 44,
                onPressed: () => setState(() => _rating = v),
                icon: Icon(
                  v <= _rating ? Icons.star : Icons.star_border,
                  color: Brand.gold,
                ),
              );
            }),
          ),
        ),
        Center(
          child: Text(
            _ratingLabel(),
            style: const TextStyle(
                fontSize: 14, fontWeight: FontWeight.w600, color: Brand.inkSoft),
          ),
        ),
        const SizedBox(height: 28),

        // Highlights
        const Text(
          'What stood out?',
          style: TextStyle(
              fontSize: 16, fontWeight: FontWeight.w700, color: Brand.ink),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _highlightOptions.map(_chip).toList(),
        ),
        const SizedBox(height: 28),

        // Comment
        const Text(
          'Anything else? (optional)',
          style: TextStyle(
              fontSize: 16, fontWeight: FontWeight.w700, color: Brand.ink),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _comment,
          maxLines: 5,
          maxLength: 1000,
          textCapitalization: TextCapitalization.sentences,
          decoration: const InputDecoration(
            hintText: 'Share your thoughts…',
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: FilledButton(
            onPressed: _submitting ? null : _submit,
            child: _submitting
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white))
                : const Text('Submit feedback'),
          ),
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

  Widget _chip(String label) {
    final active = _selected.contains(label);
    return GestureDetector(
      onTap: () => setState(() {
        if (active) {
          _selected.remove(label);
        } else {
          _selected.add(label);
        }
      }),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
        decoration: BoxDecoration(
          color: active ? Brand.forest : Brand.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: active ? Brand.forest : Brand.border),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (active)
              const Padding(
                padding: EdgeInsets.only(right: 6),
                child: Icon(Icons.check, size: 15, color: Colors.white),
              ),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: active ? Colors.white : Brand.inkSoft,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
