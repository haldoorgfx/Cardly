import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../net.dart';
import '../../ui/components.dart';
import '../../ui/tokens.dart';

/// Detail view for a single speaker.
///
/// Loads `speakers` by id (or slug) for the event. Columns verified against
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
  StatusReason _errorReason = StatusReason.generic;
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
      // public_speakers omits `email` — it's a login-linking column (039), not
      // a public contact field; the "email speaker" button below hides itself
      // when email is absent.
      final row = await supa
          .from('public_speakers')
          .select('*')
          .eq(col, widget.speakerId)
          .eq('event_id', widget.eventId)
          .maybeSingle();

      if (!mounted) return;
      if (row == null) {
        setState(() {
          _loading = false;
          _error = 'This speaker could not be found.';
          _errorReason = StatusReason.notFound;
        });
        return;
      }
      setState(() {
        _speaker = Map<String, dynamic>.from(row);
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      final msg = describeError(e, context: 'this speaker');
      setState(() {
        _loading = false;
        _error = msg;
        _errorReason = msg.toLowerCase().contains("couldn't reach the server")
            ? StatusReason.network
            : StatusReason.generic;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const MScaffold(body: LoadingState());
    }
    if (_error != null) {
      return MScaffold(
        appBar: const MAppBar(),
        body: ErrorStateView(
            message: _error!, onRetry: _load, reason: _errorReason),
      );
    }
    return Scaffold(
      backgroundColor: AppColors.canvas,
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    final s = _speaker!;
    final id = asString(s['id'], widget.speakerId);
    final name = asString(s['name'], 'Speaker');
    final role = asString(s['role'] ?? s['title']).trim();
    final company = asString(s['company']).trim();
    final headline = asString(s['headline']).trim();
    final bio = asString(s['bio']).trim();
    final photoUrl = asString(s['photo_url'] ?? s['avatar_url']).trim();
    final linkedin = asString(s['linkedin_url']).trim();
    final twitter = asString(s['twitter_url']).trim();
    final website = asString(s['website_url']).trim();
    final email = asString(s['email'] ?? s['contact_email']).trim();

    final roleLine = [role, company].where((e) => e.isNotEmpty).join(' · ');

    return CustomScrollView(
      slivers: [
        // Tall photo hero + scrim + floating back
        SliverToBoxAdapter(
          child: SizedBox(
            height: 280,
            width: double.infinity,
            child: Stack(
              fit: StackFit.expand,
              children: [
                if (photoUrl.isNotEmpty)
                  Image.network(
                    photoUrl,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) =>
                        PhotoPlaceholder(hue: hueFromString(id)),
                    loadingBuilder: (ctx, child, prog) => prog == null
                        ? child
                        : PhotoPlaceholder(hue: hueFromString(id)),
                  )
                else
                  PhotoPlaceholder(hue: hueFromString(id)),
                const ScrimBottom(),
                Positioned(
                  top: MediaQuery.of(context).padding.top + 8,
                  left: 12,
                  child: _GlassBack(
                      onTap: () => Navigator.of(context).maybePop()),
                ),
                Positioned(
                  left: 20,
                  right: 20,
                  bottom: 16,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(name,
                          style: AppText.h1
                              .copyWith(color: Colors.white, fontSize: 24)),
                      if (roleLine.isNotEmpty) ...[
                        const SizedBox(height: 3),
                        Text(roleLine,
                            style: AppText.bodySm.copyWith(
                                color: Colors.white.withValues(alpha: 0.85))),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 40),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (headline.isNotEmpty && headline != roleLine) ...[
                  Text(headline, style: AppText.subhead),
                  const SizedBox(height: 14),
                ],
                if (linkedin.isNotEmpty ||
                    twitter.isNotEmpty ||
                    website.isNotEmpty ||
                    email.isNotEmpty) ...[
                  Row(
                    children: [
                      if (linkedin.isNotEmpty)
                        _SocialButton(
                            icon: Icons.business_center_outlined,
                            onTap: () => _open(context, linkedin)),
                      if (twitter.isNotEmpty)
                        _SocialButton(
                            icon: Icons.alternate_email,
                            onTap: () => _open(context, twitter)),
                      if (website.isNotEmpty)
                        _SocialButton(
                            icon: Icons.language,
                            onTap: () => _open(context, website)),
                      if (email.isNotEmpty)
                        _SocialButton(
                            icon: Icons.mail_outline,
                            onTap: () => _openEmail(context, email)),
                    ],
                  ),
                  const SizedBox(height: 18),
                ],
                if (bio.isNotEmpty) ...[
                  const SectionLabel('Biography'),
                  const SizedBox(height: 10),
                  Text(bio, style: AppText.body),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }

  Future<void> _open(BuildContext context, String url) async {
    final uri = Uri.tryParse(url);
    if (uri == null) {
      showToast(context, 'Could not open link', type: ToastType.error);
      return;
    }
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      if (!context.mounted) return;
      showToast(context, 'Could not open link', type: ToastType.error);
    }
  }

  Future<void> _openEmail(BuildContext context, String email) async {
    final uri = Uri(scheme: 'mailto', path: email);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      if (!context.mounted) return;
      showToast(context, 'Could not open link', type: ToastType.error);
    }
  }
}

class _GlassBack extends StatelessWidget {
  final VoidCallback onTap;
  const _GlassBack({required this.onTap});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          color: const Color(0xFF08120C).withValues(alpha: 0.42),
          shape: BoxShape.circle,
        ),
        child: const Icon(Icons.arrow_back, size: 19, color: Colors.white),
      ),
    );
  }
}

class _SocialButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  const _SocialButton({required this.icon, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 10),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppColors.border),
          ),
          child: Icon(icon, size: 18, color: AppColors.forest),
        ),
      ),
    );
  }
}
