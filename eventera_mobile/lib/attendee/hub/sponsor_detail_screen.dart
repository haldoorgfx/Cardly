import 'package:flutter/material.dart';

import '../../net.dart';
import '../../theme.dart';

/// Detail view for a single sponsor / booth.
///
/// Loads `sponsors` by id for the event. Columns verified against
/// app/(public)/e/[slug]/sponsors/[boothId]/page.tsx.
class SponsorDetailScreen extends StatefulWidget {
  final String sponsorId;
  final String eventId;

  const SponsorDetailScreen({
    super.key,
    required this.sponsorId,
    required this.eventId,
  });

  @override
  State<SponsorDetailScreen> createState() => _SponsorDetailScreenState();
}

class _SponsorDetailScreenState extends State<SponsorDetailScreen> {
  bool _loading = true;
  String? _error;
  Map<String, dynamic>? _sponsor;

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
          .from('sponsors')
          .select('*')
          .eq('id', widget.sponsorId)
          .eq('event_id', widget.eventId)
          .maybeSingle();

      if (row == null) {
        setState(() {
          _loading = false;
          _error = 'This sponsor could not be found.';
        });
        return;
      }
      setState(() {
        _sponsor = Map<String, dynamic>.from(row);
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
        _error = 'Something went wrong loading this sponsor.';
      });
    }
  }

  List<String> get _offerings {
    final raw = _sponsor?['offerings'];
    if (raw is List) {
      return raw.map((e) => e.toString()).where((s) => s.isNotEmpty).toList();
    }
    return const [];
  }

  List<Map<String, dynamic>> get _team => asMapList(_sponsor?['team_members']);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Brand.cream,
      appBar: AppBar(
        backgroundColor: Brand.cream,
        foregroundColor: Brand.forest,
        elevation: 0,
        title: const Text('Sponsor', style: TextStyle(color: Brand.forest)),
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
    final s = _sponsor!;
    final name = asString(s['company_name'], 'Sponsor');
    final tagline = asString(s['tagline']).trim();
    final logoUrl = asString(s['logo_url']).trim();
    final coverUrl = asString(s['cover_url']).trim();
    final tier = asString(s['tier']).trim();
    final description = asString(s['description']).trim();
    final contactEmail = asString(s['contact_email']).trim();
    final meetingUrl = asString(s['meeting_url']).trim();
    final websiteUrl = asString(s['website_url']).trim();
    final boothLocation = asString(s['booth_location']).trim();
    final boothHours = asString(s['booth_hours']).trim();

    return ListView(
      padding: EdgeInsets.zero,
      children: [
        _Hero(coverUrl: coverUrl, logoUrl: logoUrl, name: name, tagline: tagline, tier: tier),
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 22, 20, 40),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (description.isNotEmpty) ...[
                _label('About $name'),
                const SizedBox(height: 10),
                Text(
                  description,
                  style: const TextStyle(
                    fontSize: 15,
                    height: 1.6,
                    color: Brand.inkSoft,
                  ),
                ),
                const SizedBox(height: 26),
              ],
              if (_offerings.isNotEmpty) ...[
                _label("What we're offering"),
                const SizedBox(height: 10),
                ..._offerings.map(
                  (o) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 20,
                          height: 20,
                          margin: const EdgeInsets.only(top: 2),
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: Brand.forest.withValues(alpha: 0.10),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.check,
                              size: 12, color: Brand.forest),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            o,
                            style: const TextStyle(
                              fontSize: 15,
                              height: 1.4,
                              color: Brand.inkSoft,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
              ],
              if (_team.isNotEmpty) ...[
                _label('Meet the team at the booth'),
                const SizedBox(height: 14),
                Wrap(
                  spacing: 18,
                  runSpacing: 16,
                  children: _team.map((m) {
                    final mName = asString(m['name'], 'Team member');
                    final mRole = asString(m['role']).trim();
                    final mAvatar = asString(m['avatar_url']).trim();
                    return _TeamMember(
                        name: mName, role: mRole, avatarUrl: mAvatar);
                  }).toList(),
                ),
                const SizedBox(height: 26),
              ],
              _BoothCard(
                boothLocation: boothLocation,
                boothHours: boothHours,
                contactEmail: contactEmail,
                meetingUrl: meetingUrl,
                websiteUrl: websiteUrl,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _label(String text) => Text(
        text,
        style: const TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: Brand.forest,
        ),
      );
}

class _Hero extends StatelessWidget {
  final String coverUrl;
  final String logoUrl;
  final String name;
  final String tagline;
  final String tier;
  const _Hero({
    required this.coverUrl,
    required this.logoUrl,
    required this.name,
    required this.tagline,
    required this.tier,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 240,
      width: double.infinity,
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (coverUrl.isNotEmpty)
            Image.network(
              coverUrl,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => const _GradientBg(),
              loadingBuilder: (ctx, child, prog) =>
                  prog == null ? child : const _GradientBg(),
            )
          else
            const _GradientBg(),
          DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.transparent,
                  Brand.ink.withValues(alpha: 0.72),
                ],
                stops: const [0.4, 1.0],
              ),
            ),
          ),
          Positioned(
            left: 20,
            right: 20,
            bottom: 20,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (tier.isNotEmpty)
                  Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: Brand.gold,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      tier.toUpperCase(),
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: Brand.ink,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                Text(
                  name,
                  style: const TextStyle(
                    fontSize: 26,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
                if (tagline.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    tagline,
                    style: const TextStyle(fontSize: 15, color: Brand.gold),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _GradientBg extends StatelessWidget {
  const _GradientBg();
  @override
  Widget build(BuildContext context) => const DecoratedBox(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Brand.forest, Color(0xFF2A6A50), Brand.gold],
          ),
        ),
      );
}

class _TeamMember extends StatelessWidget {
  final String name;
  final String role;
  final String avatarUrl;
  const _TeamMember({
    required this.name,
    required this.role,
    required this.avatarUrl,
  });

  String get _initials {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts.first.isEmpty) return '?';
    if (parts.length == 1) return parts.first[0].toUpperCase();
    return (parts.first[0] + parts.last[0]).toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    final fallback = Container(
      width: 40,
      height: 40,
      alignment: Alignment.center,
      decoration: const BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          colors: [Brand.forest, Color(0xFF2A6A50)],
        ),
      ),
      child: Text(
        _initials,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 13,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
    return SizedBox(
      width: 150,
      child: Row(
        children: [
          if (avatarUrl.isEmpty)
            fallback
          else
            ClipOval(
              child: Image.network(
                avatarUrl,
                width: 40,
                height: 40,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => fallback,
                loadingBuilder: (ctx, child, prog) =>
                    prog == null ? child : fallback,
              ),
            ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Brand.ink,
                  ),
                ),
                if (role.isNotEmpty)
                  Text(
                    role,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 12, color: Brand.muted),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _BoothCard extends StatelessWidget {
  final String boothLocation;
  final String boothHours;
  final String contactEmail;
  final String meetingUrl;
  final String websiteUrl;
  const _BoothCard({
    required this.boothLocation,
    required this.boothHours,
    required this.contactEmail,
    required this.meetingUrl,
    required this.websiteUrl,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Brand.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Brand.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (boothLocation.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: Text(
                boothLocation,
                style: const TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w600,
                  color: Brand.forest,
                ),
              ),
            ),
          if (boothHours.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: Text(
                'Open: $boothHours',
                style: const TextStyle(fontSize: 13, color: Brand.muted),
              ),
            ),
          FilledButton(
            onPressed: contactEmail.isEmpty
                ? null
                : () => _snack(context, 'Contact: $contactEmail'),
            child: const Text('Connect at the booth'),
          ),
          if (meetingUrl.isNotEmpty) ...[
            const SizedBox(height: 10),
            OutlinedButton(
              onPressed: () => _snack(context, meetingUrl),
              style: OutlinedButton.styleFrom(
                foregroundColor: Brand.ink,
                side: const BorderSide(color: Brand.border),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text('Book a meeting'),
            ),
          ],
          if (websiteUrl.isNotEmpty) ...[
            const SizedBox(height: 14),
            Center(
              child: GestureDetector(
                onTap: () => _snack(context, websiteUrl),
                child: Text(
                  '$websiteUrl →',
                  style: const TextStyle(fontSize: 13, color: Brand.muted),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  void _snack(BuildContext context, String msg) {
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(msg)));
  }
}
