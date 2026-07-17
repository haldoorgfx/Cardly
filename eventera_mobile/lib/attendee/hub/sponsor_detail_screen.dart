import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../net.dart';
import '../../ui/components.dart';
import '../../ui/tokens.dart';

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
  StatusReason _errorReason = StatusReason.generic;
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
          .from('public_sponsors')
          .select('*')
          .eq('id', widget.sponsorId)
          .eq('event_id', widget.eventId)
          .maybeSingle();

      if (!mounted) return;
      if (row == null) {
        setState(() {
          _loading = false;
          _error = 'This sponsor could not be found.';
          _errorReason = StatusReason.notFound;
        });
        return;
      }
      setState(() {
        _sponsor = Map<String, dynamic>.from(row);
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      final msg = describeError(e, context: 'this sponsor');
      setState(() {
        _loading = false;
        _error = msg;
        _errorReason = msg.toLowerCase().contains("couldn't reach the server")
            ? StatusReason.network
            : StatusReason.generic;
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
    if (_loading) {
      return const MScaffold(
        appBar: MAppBar(title: 'Booth'),
        body: LoadingState(),
      );
    }
    if (_error != null) {
      return MScaffold(
        appBar: const MAppBar(title: 'Booth'),
        body: ErrorStateView(
            message: _error!, onRetry: _load, reason: _errorReason),
      );
    }
    return _buildBody();
  }

  Widget _buildBody() {
    final s = _sponsor!;
    final name = asString(s['company_name'], 'Sponsor');
    final tagline = asString(s['tagline']).trim();
    final logoUrl = asString(s['logo_url']).trim();
    final tier = asString(s['tier']).trim();
    final description = asString(s['description']).trim();
    final contactEmail = asString(s['contact_email']).trim();
    final meetingUrl = asString(s['meeting_url']).trim();
    final websiteUrl = asString(s['website_url']).trim();
    final boothLocation = asString(s['booth_location']).trim();
    final boothHours = asString(s['booth_hours']).trim();

    final canMeet = meetingUrl.isNotEmpty || contactEmail.isNotEmpty;

    return MScaffold(
      appBar: const MAppBar(title: 'Booth', hairline: true),
      bottomBar: canMeet
          ? StickyCta(children: [
              Expanded(
                child: MButton(
                  'Book a meeting',
                  icon: Icons.calendar_today_outlined,
                  onTap: () => meetingUrl.isNotEmpty
                      ? _openUrl(context, meetingUrl)
                      : _openEmail(context, contactEmail),
                ),
              ),
            ])
          : null,
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        children: [
          // logo + name + tier
          Row(
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: AppColors.forestSoft,
                  borderRadius: BorderRadius.circular(14),
                ),
                clipBehavior: Clip.antiAlias,
                alignment: Alignment.center,
                child: logoUrl.isNotEmpty
                    ? Image.network(
                        logoUrl,
                        fit: BoxFit.contain,
                        errorBuilder: (_, __, ___) => _logoFallback(name),
                        loadingBuilder: (ctx, child, prog) =>
                            prog == null ? child : _logoFallback(name),
                      )
                    : _logoFallback(name),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name, style: AppText.h2.copyWith(fontSize: 20)),
                    if (tier.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text('${_titleCase(tier)} sponsor',
                          style: AppText.caption.copyWith(fontSize: 12.5)),
                    ],
                  ],
                ),
              ),
            ],
          ),

          if (description.isNotEmpty) ...[
            const SizedBox(height: 16),
            Text(description, style: AppText.body),
          ] else if (tagline.isNotEmpty) ...[
            const SizedBox(height: 16),
            Text(tagline, style: AppText.body),
          ],

          // Booth location card
          if (boothLocation.isNotEmpty || boothHours.isNotEmpty) ...[
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: AppColors.canvas,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.location_on_outlined,
                      size: 18, color: AppColors.forest),
                  const SizedBox(width: 10),
                  Expanded(
                    child: RichText(
                      text: TextSpan(
                        style: AppText.bodySm.copyWith(fontSize: 12.5),
                        children: [
                          if (boothLocation.isNotEmpty)
                            TextSpan(
                                text: boothLocation,
                                style: AppText.bodyStrong
                                    .copyWith(fontSize: 12.5)),
                          if (boothLocation.isNotEmpty && boothHours.isNotEmpty)
                            const TextSpan(text: ' · '),
                          if (boothHours.isNotEmpty)
                            TextSpan(text: 'open $boothHours'),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],

          // Offerings
          if (_offerings.isNotEmpty) ...[
            const SizedBox(height: 22),
            const SectionLabel('Offerings'),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (var i = 0; i < _offerings.length; i++)
                  Tag(_offerings[i],
                      kind: i == _offerings.length - 1 && _offerings.length > 1
                          ? TagKind.gold
                          : TagKind.forest),
              ],
            ),
          ],

          // Team
          if (_team.isNotEmpty) ...[
            const SizedBox(height: 22),
            const SectionLabel('Team at the booth'),
            const SizedBox(height: 14),
            Row(
              children: _team.map((m) {
                final mName = asString(m['name'], 'Team member');
                final mAvatar = asString(m['avatar_url']).trim();
                return Padding(
                  padding: const EdgeInsets.only(right: 16),
                  child: Column(
                    children: [
                      Avatar(
                          name: mName,
                          imageUrl: mAvatar.isEmpty ? null : mAvatar,
                          size: 48),
                      const SizedBox(height: 6),
                      Text(mName.split(' ').first,
                          style: AppText.subhead.copyWith(fontSize: 11)),
                    ],
                  ),
                );
              }).toList(),
            ),
          ],

          if (websiteUrl.isNotEmpty) ...[
            const SizedBox(height: 22),
            Center(
              child: GestureDetector(
                onTap: () => _openUrl(context, websiteUrl),
                child: Text('$websiteUrl →',
                    style: AppText.bodySm.copyWith(color: AppColors.inkMuted)),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _openUrl(BuildContext context, String url) async {
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

  Widget _logoFallback(String name) => Text(
        name.isNotEmpty ? name[0].toUpperCase() : '?',
        style: AppText.h2.copyWith(color: AppColors.forest, fontSize: 24),
      );

  String _titleCase(String s) =>
      s.isEmpty ? s : s[0].toUpperCase() + s.substring(1).toLowerCase();
}
