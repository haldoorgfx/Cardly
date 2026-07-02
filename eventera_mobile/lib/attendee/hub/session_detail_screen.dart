import 'package:flutter/material.dart';

import '../../net.dart';
import '../../theme.dart';
import 'event_page_model.dart';
import 'speaker_detail_screen.dart';

/// Detail view for a single published session.
///
/// Loads `sessions` (with `session_speakers -> speakers` and `tracks`) joined
/// on the sessionId. Verified against
/// app/(public)/e/[slug]/sessions/[sessionId]/page.tsx.
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
      final row = await supa
          .from('sessions')
          .select(
              '*, tracks(id,name,color), session_speakers(speaker_id, position, speakers(id,name,photo_url,role,company,headline))')
          .eq('id', widget.sessionId)
          .eq('event_id', widget.eventId)
          .eq('is_published', true)
          .maybeSingle();

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
      setState(() {
        _session = map;
        _loading = false;
      });
    } on ApiException catch (e) {
      setState(() {
        _loading = false;
        _error = e.message;
      });
    } catch (e) {
      setState(() {
        _loading = false;
        _error = 'Something went wrong loading this session.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Brand.cream,
      appBar: AppBar(
        backgroundColor: Brand.cream,
        foregroundColor: Brand.forest,
        elevation: 0,
        title: const Text('Session', style: TextStyle(color: Brand.forest)),
      ),
      body: _loading
          ? const _CenterSpinner()
          : _error != null
              ? _ErrorState(message: _error!, onRetry: _load)
              : _buildBody(),
    );
  }

  Widget _buildBody() {
    final s = _session!;
    final title = asString(s['title'], 'Untitled session');
    final desc = asString(s['description']).trim();
    final room = asString(s['room']).trim();
    final start = asDate(s['starts_at']);
    final end = asDate(s['ends_at']);
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
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
      children: [
        if (trackName != null) ...[
          _Pill(text: trackName),
          const SizedBox(height: 12),
        ],
        Text(
          title,
          style: const TextStyle(
            fontSize: 24,
            height: 1.2,
            fontWeight: FontWeight.w700,
            color: Brand.ink,
          ),
        ),
        const SizedBox(height: 16),
        _MetaRow(icon: Icons.schedule, text: HubDates.range(start, end)),
        if (room.isNotEmpty) ...[
          const SizedBox(height: 8),
          _MetaRow(icon: Icons.location_on_outlined, text: room),
        ],
        if (desc.isNotEmpty) ...[
          const SizedBox(height: 24),
          const _SectionLabel('About this session'),
          const SizedBox(height: 10),
          Text(
            desc,
            style: const TextStyle(
              fontSize: 15,
              height: 1.6,
              color: Brand.inkSoft,
            ),
          ),
        ],
        if (_speakers.isNotEmpty) ...[
          const SizedBox(height: 28),
          const _SectionLabel('Speakers'),
          const SizedBox(height: 12),
          ..._speakers.map(
            (sp) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: _SpeakerTile(
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
      ],
    );
  }
}

class _SpeakerTile extends StatelessWidget {
  final SpeakerSummary speaker;
  final VoidCallback onTap;
  const _SpeakerTile({required this.speaker, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Brand.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Brand.border),
        ),
        child: Row(
          children: [
            _Avatar(url: speaker.photoUrl, name: speaker.name, size: 44),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    speaker.name,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: Brand.ink,
                    ),
                  ),
                  if (speaker.roleLine.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(
                      speaker.roleLine,
                      style: const TextStyle(fontSize: 13, color: Brand.muted),
                    ),
                  ],
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: Brand.muted, size: 20),
          ],
        ),
      ),
    );
  }
}

// ---- small shared widgets (kept local to avoid editing shared files) ----

class _CenterSpinner extends StatelessWidget {
  const _CenterSpinner();
  @override
  Widget build(BuildContext context) => const Center(
        child: CircularProgressIndicator(color: Brand.forest),
      );
}

class _ErrorState extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const _ErrorState({required this.message, required this.onRetry});
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, color: Brand.danger, size: 40),
            const SizedBox(height: 12),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 15, color: Brand.inkSoft),
            ),
            const SizedBox(height: 16),
            FilledButton(onPressed: onRetry, child: const Text('Try again')),
          ],
        ),
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel(this.text);
  @override
  Widget build(BuildContext context) => Text(
        text,
        style: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.4,
          color: Brand.forest,
        ),
      );
}

class _MetaRow extends StatelessWidget {
  final IconData icon;
  final String text;
  const _MetaRow({required this.icon, required this.text});
  @override
  Widget build(BuildContext context) => Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: Brand.forest),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(fontSize: 14, color: Brand.inkSoft),
            ),
          ),
        ],
      );
}

class _Pill extends StatelessWidget {
  final String text;
  const _Pill({required this.text});
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: Brand.forest.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(999),
        ),
        child: Text(
          text,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: Brand.forest,
          ),
        ),
      );
}

class _Avatar extends StatelessWidget {
  final String? url;
  final String name;
  final double size;
  const _Avatar({required this.url, required this.name, this.size = 44});

  String get _initials {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts.first.isEmpty) return '?';
    if (parts.length == 1) return parts.first[0].toUpperCase();
    return (parts.first[0] + parts.last[0]).toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    final fallback = Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: const BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Brand.forest, Color(0xFF2A6A50)],
        ),
      ),
      child: Text(
        _initials,
        style: TextStyle(
          color: Colors.white,
          fontSize: size * 0.34,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
    if (url == null || url!.isEmpty) return fallback;
    return ClipOval(
      child: Image.network(
        url!,
        width: size,
        height: size,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => fallback,
        loadingBuilder: (ctx, child, prog) =>
            prog == null ? child : fallback,
      ),
    );
  }
}
