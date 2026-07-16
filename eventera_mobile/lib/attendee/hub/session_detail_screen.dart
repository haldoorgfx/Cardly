import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../net.dart';
import '../../tz.dart';
import '../../ui/components.dart';
import '../../ui/tokens.dart';
import '../engage/qa_screen.dart';
import '../event_context.dart';
import 'event_page_model.dart';
import 'speaker_detail_screen.dart';

/// Detail view for a single published session.
///
/// Loads `sessions` (with `session_speakers -> speakers` and `tracks`) joined
/// on the sessionId. Verified against
/// app/(public)/e/[slug]/sessions/[sessionId]/page.tsx.
///
/// Rating posts POST /api/sessions/[id]/rate { rating } (same contract the
/// agenda screen uses).
class SessionDetailScreen extends StatefulWidget {
  final String sessionId;
  final String eventId;

  const SessionDetailScreen({
    super.key,
    required this.sessionId,
    required this.eventId,
  });

  @override
  State<SessionDetailScreen> createState() => _SessionDetailScreenState();
}

class _SessionDetailScreenState extends State<SessionDetailScreen> {
  bool _loading = true;
  String? _error;
  Map<String, dynamic>? _session;
  final List<SpeakerSummary> _speakers = [];
  int _myRating = 0;
  bool _saved = false;
  bool _savingBusy = false;
  String? _streamUrl;
  String? _timezone;

  @override
  void initState() {
    super.initState();
    _load();
    _loadSavedState();
  }

  Future<void> _loadSavedState() async {
    final rid = EventContext.regIdFor(widget.eventId);
    if (rid == null) return;
    try {
      final rows = await supa
          .from('attendee_agendas')
          .select('session_id')
          .eq('registration_id', rid)
          .eq('session_id', widget.sessionId);
      if (!mounted) return;
      setState(() => _saved = (rows as List).isNotEmpty);
    } catch (_) {
      // Non-fatal: leave as not-saved if we can't determine state.
    }
  }

  Future<void> _toggleSaved() async {
    final rid = EventContext.regIdFor(widget.eventId);
    if (rid == null) {
      showToast(context, 'Register for this event to build your agenda.');
      return;
    }
    if (_savingBusy) return;
    _savingBusy = true;
    final wasSaved = _saved;
    try {
      if (wasSaved) {
        await supa
            .from('attendee_agendas')
            .delete()
            .eq('registration_id', rid)
            .eq('session_id', widget.sessionId);
      } else {
        await apiPost(
          '/api/events/${widget.eventId}/sessions/${widget.sessionId}/book',
          {'registrationId': rid},
        );
      }
      if (!mounted) return;
      setState(() => _saved = !wasSaved);
      showToast(context,
          wasSaved ? 'Removed from your agenda' : 'Added to your agenda');
    } catch (e) {
      if (!mounted) return;
      showToast(context,
          e is ApiException ? e.message : 'Could not update your agenda');
    } finally {
      _savingBusy = false;
    }
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final row = await supa
          .from('sessions')
          .select(
              '*, tracks(id,name,color), session_speakers(speaker_id, position, speakers(id,name,photo_url,role,company,headline))')
          .eq('id', widget.sessionId)
          .eq('event_id', widget.eventId)
          .eq('is_published', true)
          .maybeSingle();

      if (!mounted) return;
      if (row == null) {
        setState(() {
          _loading = false;
          _error = 'This session could not be found.';
        });
        return;
      }

      final map = Map<String, dynamic>.from(row);
      _speakers.clear();
      for (final link in asMapList(map['session_speakers'])) {
        final sp = link['speakers'];
        if (sp is Map) {
          _speakers.add(SpeakerSummary.fromRow(Map<String, dynamic>.from(sp)));
        }
      }
      final stream = asString(map['stream_url']).trim();
      // Sessions have no zone of their own — they run in the event's venue
      // timezone. Best-effort: never blocks the session itself from showing.
      try {
        final page = await supa
            .from('event_pages')
            .select('timezone')
            .eq('event_id', widget.eventId)
            .maybeSingle();
        _timezone = page == null ? null : asString(page['timezone']).trim();
      } catch (_) {
        _timezone = null;
      }
      setState(() {
        _session = map;
        _streamUrl = stream.isEmpty ? null : stream;
        _loading = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.message;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Something went wrong loading this session.';
      });
    }
  }

  Future<void> _rate(int rating) async {
    setState(() => _myRating = rating);
    try {
      await apiPost('/api/sessions/${widget.sessionId}/rate', {
        'rating': rating,
      });
      if (!mounted) return;
      showToast(context, 'Thanks for rating this session');
    } catch (e) {
      if (!mounted) return;
      showToast(context,
          e is ApiException ? e.message : 'Could not submit rating');
    }
  }

  void _openQa() {
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => QaScreen(
        eventId: widget.eventId,
        sessionId: widget.sessionId,
      ),
    ));
  }

  Future<void> _openStream() async {
    final url = _streamUrl;
    if (url == null || url.isEmpty) return;
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      if (!mounted) return;
      showToast(context, 'Could not open the stream');
    }
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: MAppBar(
        title: 'Session',
        hairline: true,
        actions: [
          AppBarAction(
            _saved ? Icons.bookmark : Icons.bookmark_border,
            onTap: _toggleSaved,
          ),
        ],
      ),
      bottomBar: _loading || _error != null ? null : _stickyBar(),
      body: _loading
          ? const LoadingState()
          : _error != null
              ? ErrorStateView(message: _error!, onRetry: _load)
              : _buildBody(),
    );
  }

  Widget _stickyBar() {
    return StickyCta(children: [
      MButton('',
          kind: MBtnKind.sec,
          icon: _saved ? Icons.bookmark : Icons.bookmark_border,
          fullWidth: false,
          onTap: _toggleSaved),
      const SizedBox(width: 10),
      Expanded(
        child: MButton('Join live Q&A',
            icon: Icons.forum_outlined, onTap: _openQa),
      ),
    ]);
  }

  Widget _buildBody() {
    final s = _session!;
    final title = asString(s['title'], 'Untitled session');
    final desc = asString(s['description']).trim();
    final room = asString(s['room']).trim();
    final start = toEventZone(asDate(s['starts_at']), _timezone);
    final end = toEventZone(asDate(s['ends_at']), _timezone);
    final tracks = s['tracks'];
    String? trackName;
    if (tracks is Map) {
      final t = asString(tracks['name']).trim();
      if (t.isNotEmpty) trackName = t;
    }
    trackName ??= asString(s['session_type']).trim().isEmpty
        ? null
        : asString(s['session_type']);

    return ListView(
      padding: const EdgeInsets.fromLTRB(AppSpace.lg, AppSpace.md, AppSpace.lg, AppSpace.xxxl),
      children: [
        Row(
          children: [
            if (trackName != null) ...[
              Tag(trackName, kind: TagKind.gold, dot: true),
              const SizedBox(width: 8),
            ],
            if (room.isNotEmpty) Tag(room, kind: TagKind.info),
          ],
        ),
        const SizedBox(height: AppSpace.md),
        Text(title, style: AppText.h1.copyWith(fontSize: 23)),
        if (_streamUrl != null && _streamUrl!.isNotEmpty) ...[
          const SizedBox(height: AppSpace.md),
          MButton(
            'Watch live',
            kind: MBtnKind.forest,
            icon: Icons.play_circle_outline,
            onTap: _openStream,
          ),
        ],
        const SizedBox(height: AppSpace.md),
        _MetaRow(icon: Icons.schedule, text: HubDates.range(start, end)),
        if (desc.isNotEmpty) ...[
          const SizedBox(height: AppSpace.base),
          Text(desc, style: AppText.body),
        ],
        if (_speakers.isNotEmpty) ...[
          const SizedBox(height: AppSpace.xl),
          const SectionLabel('Speaker'),
          const SizedBox(height: AppSpace.md),
          ..._speakers.map(
            (sp) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: _SpeakerRow(
                speaker: sp,
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => SpeakerDetailScreen(
                        speakerId: sp.id,
                        eventId: widget.eventId,
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
        ],
        const SizedBox(height: AppSpace.lg),
        _RateCard(value: _myRating, onChanged: _rate),
      ],
    );
  }
}

class _RateCard extends StatelessWidget {
  final int value;
  final ValueChanged<int> onChanged;
  const _RateCard({required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return MCard(
      color: const Color(0xFFFBFAF6),
      child: Row(
        children: [
          Expanded(
            child: Text('Rate this session', style: AppText.bodyStrong),
          ),
          StarRating(value: value, size: 22, onChanged: onChanged),
        ],
      ),
    );
  }
}

class _SpeakerRow extends StatelessWidget {
  final SpeakerSummary speaker;
  final VoidCallback onTap;
  const _SpeakerRow({required this.speaker, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppRadius.card),
      child: Row(
        children: [
          Avatar(imageUrl: speaker.photoUrl, name: speaker.name, size: 48),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(speaker.name, style: AppText.h3.copyWith(fontSize: 15)),
                if (speaker.roleLine.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(speaker.roleLine, style: AppText.bodySm),
                ],
              ],
            ),
          ),
          const Icon(Icons.chevron_right, color: AppColors.inkMuted, size: 20),
        ],
      ),
    );
  }
}

class _MetaRow extends StatelessWidget {
  final IconData icon;
  final String text;
  const _MetaRow({required this.icon, required this.text});
  @override
  Widget build(BuildContext context) => Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: AppColors.forest),
          const SizedBox(width: 8),
          Expanded(
            child: Text(text,
                style: AppText.numSm.copyWith(color: AppColors.inkSoft)),
          ),
        ],
      );
}
