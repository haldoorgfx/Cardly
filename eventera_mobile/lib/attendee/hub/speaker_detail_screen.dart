import 'package:flutter/material.dart';

import '../../net.dart';
import '../../theme.dart';
import 'event_page_model.dart';

/// Detail view for a single speaker.
///
/// Loads `speakers` by id (or slug) for the event, plus their published
/// sessions. Columns verified against
/// app/(public)/e/[slug]/speakers/[speakerId]/page.tsx and
/// components/events/SpeakerProfileClient.tsx.
class SpeakerDetailScreen extends StatefulWidget {
  final String speakerId;
  final String eventId;

  const SpeakerDetailScreen({
    super.key,
    required this.speakerId,
    required this.eventId,
  });

  @override
  State<SpeakerDetailScreen> createState() => _SpeakerDetailScreenState();
}

class _SpeakerDetailScreenState extends State<SpeakerDetailScreen> {
  bool _loading = true;
  String? _error;
  Map<String, dynamic>? _speaker;

  static final RegExp _uuid = RegExp(
    r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
    caseSensitive: false,
  );

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
      final col = _uuid.hasMatch(widget.speakerId) ? 'id' : 'slug';
      final row = await supa
          .from('speakers')
          .select('*')
          .eq(col, widget.speakerId)
          .eq('event_id', widget.eventId)
          .maybeSingle();

      if (row == null) {
        setState(() {
          _loading = false;
          _error = 'This speaker could not be found.';
        });
        return;
      }
      setState(() {
        _speaker = Map<String, dynamic>.from(row);
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
        _error = 'Something went wrong loading this speaker.';
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
        title: const Text('Speaker', style: TextStyle(color: Brand.forest)),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Brand.forest))
          : _error != null
              ? _errorState()
              : _buildBody(),
    );
  }

  Widget _errorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, color: Brand.danger, size: 40),
            const SizedBox(height: 12),
            Text(
              _error!,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 15, color: Brand.inkSoft),
            ),
            const SizedBox(height: 16),
            FilledButton(onPressed: _load, child: const Text('Try again')),
          ],
        ),
      ),
    );
  }

  Widget _buildBody() {
    final s = _speaker!;
    final name = asString(s['name'], 'Speaker');
    final role = asString(s['role']).trim();
    final company = asString(s['company']).trim();
    final headline = asString(s['headline']).trim();
    final bio = asString(s['bio']).trim();
    final photoUrl = asString(s['photo_url'] ?? s['avatar_url']).trim();
    final linkedin = asString(s['linkedin_url']).trim();
    final twitter = asString(s['twitter_url']).trim();
    final website = asString(s['website_url']).trim();

    final roleLine =
        [role, company].where((e) => e.isNotEmpty).join(' · ');

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 40),
      children: [
        Center(
          child: _BigAvatar(
            url: photoUrl.isEmpty ? null : photoUrl,
            name: name,
          ),
        ),
        const SizedBox(height: 18),
        Center(
          child: Text(
            name,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w700,
              color: Brand.ink,
            ),
          ),
        ),
        if (roleLine.isNotEmpty) ...[
          const SizedBox(height: 6),
          Center(
            child: Text(
              roleLine,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 15, color: Brand.forest),
            ),
          ),
        ],
        if (headline.isNotEmpty && headline != roleLine) ...[
          const SizedBox(height: 4),
          Center(
            child: Text(
              headline,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 14, color: Brand.muted),
            ),
          ),
        ],
        if (linkedin.isNotEmpty || twitter.isNotEmpty || website.isNotEmpty) ...[
          const SizedBox(height: 16),
          Wrap(
            alignment: WrapAlignment.center,
            spacing: 10,
            runSpacing: 10,
            children: [
              if (linkedin.isNotEmpty)
                _SocialChip(label: 'LinkedIn', icon: Icons.link, url: linkedin),
              if (twitter.isNotEmpty)
                _SocialChip(label: 'Twitter', icon: Icons.alternate_email, url: twitter),
              if (website.isNotEmpty)
                _SocialChip(label: 'Website', icon: Icons.language, url: website),
            ],
          ),
        ],
        if (bio.isNotEmpty) ...[
          const SizedBox(height: 28),
          const Text(
            'Biography',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.4,
              color: Brand.forest,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            bio,
            style: const TextStyle(
              fontSize: 15,
              height: 1.6,
              color: Brand.inkSoft,
            ),
          ),
        ],
      ],
    );
  }
}

class _SocialChip extends StatelessWidget {
  final String label;
  final IconData icon;
  final String url;
  const _SocialChip({
    required this.label,
    required this.icon,
    required this.url,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: Brand.surface,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: Brand.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 15, color: Brand.forest),
          const SizedBox(width: 6),
          Text(
            label,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: Brand.ink,
            ),
          ),
        ],
      ),
    );
  }
}

class _BigAvatar extends StatelessWidget {
  final String? url;
  final String name;
  const _BigAvatar({required this.url, required this.name});

  String get _initials {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts.first.isEmpty) return '?';
    if (parts.length == 1) return parts.first[0].toUpperCase();
    return (parts.first[0] + parts.last[0]).toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    const size = 108.0;
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
        style: const TextStyle(
          color: Colors.white,
          fontSize: 34,
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
