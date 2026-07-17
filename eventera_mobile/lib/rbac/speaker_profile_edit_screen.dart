import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../net.dart';
import '../roles/speaker/speaker_api.dart';
import '../ui/components.dart';
import '../ui/tokens.dart';

/// Edit the signed-in speaker's public `speakers` profile for one event.
///
/// The speaker row is resolved for the account by email against `speakers.email`
/// (migration 039) at the given [eventId], then the editable subset — headline/
/// title, company, bio and socials — is saved DIRECT to Supabase through the
/// ownership-checked `update_speaker_profile` RPC (063).
///
/// Why the RPC and not the web API route: `speakers` RLS (migration 020) only
/// lets the EVENT OWNER write the row, and the Next.js `PATCH
/// /api/speakers/{id}/profile` route is COOKIE-authenticated — the mobile app
/// sends a Bearer token and has no cookie session, so that route always 401s
/// from here. The SECURITY DEFINER RPC authorizes the caller by email / active
/// speaker role and is the sanctioned mobile write path.
///
/// The RPC owns headline, bio, company and the three social links. `name` and
/// the headshot (`photo_url`) are organizer-managed — the RPC cannot write
/// them — so they are shown read-only with an honest note rather than a fake
/// control that silently drops the edit.
///
/// Everything fails SAFE: a resolve/save error shows a message, never a crash.
class SpeakerProfileEditScreen extends StatefulWidget {
  final String eventId;
  final String eventName;

  /// Optional: if the caller already resolved the speaker id, pass it to skip
  /// the lookup. When null, the row is resolved by email at [eventId].
  final String? speakerId;

  const SpeakerProfileEditScreen({
    super.key,
    required this.eventId,
    required this.eventName,
    this.speakerId,
  });

  @override
  State<SpeakerProfileEditScreen> createState() =>
      _SpeakerProfileEditScreenState();
}

class _SpeakerProfileEditScreenState extends State<SpeakerProfileEditScreen> {
  bool _loading = true;
  bool _saving = false;
  String? _error;
  StatusReason _errorReason = StatusReason.generic;

  String _speakerId = '';
  String _photoUrl = '';
  String _name = ''; // organizer-managed, read-only

  final _headlineCtl = TextEditingController();
  final _companyCtl = TextEditingController();
  final _bioCtl = TextEditingController();
  final _linkedinCtl = TextEditingController();
  final _twitterCtl = TextEditingController();
  final _websiteCtl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _headlineCtl.dispose();
    _companyCtl.dispose();
    _bioCtl.dispose();
    _linkedinCtl.dispose();
    _twitterCtl.dispose();
    _websiteCtl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
      _errorReason = StatusReason.generic;
    });
    try {
      final row = await SpeakerApi.resolveSpeaker(
        eventId: widget.eventId,
        speakerId: widget.speakerId,
      );

      if (!mounted) return;
      if (row == null) {
        setState(() {
          _loading = false;
          _errorReason = StatusReason.notFound;
          _error =
              'We could not find your speaker profile for this event. The '
              'organizer adds you as a speaker before you can edit your details.';
        });
        return;
      }

      _speakerId = asString(row['id']);
      _photoUrl = asString(row['photo_url']).trim();
      _name = asString(row['name']);
      // The RPC persists `headline`; fall back to legacy `role` when empty.
      final headline = asString(row['headline']).trim();
      _headlineCtl.text =
          headline.isNotEmpty ? headline : asString(row['role']).trim();
      _companyCtl.text = asString(row['company']);
      _bioCtl.text = asString(row['bio']);
      _linkedinCtl.text = asString(row['linkedin_url']);
      _twitterCtl.text = asString(row['twitter_url']);
      _websiteCtl.text = asString(row['website_url']);

      setState(() => _loading = false);
    } catch (e) {
      if (!mounted) return;
      final msg = describeError(e, context: 'your speaker profile');
      final lower = msg.toLowerCase();
      setState(() {
        _loading = false;
        _error = msg;
        _errorReason = lower.contains("couldn't reach the server")
            ? StatusReason.network
            : lower.contains('permission')
                ? StatusReason.permission
                : StatusReason.generic;
      });
    }
  }

  Future<void> _save() async {
    if (_saving || _speakerId.isEmpty) return;
    HapticFeedback.mediumImpact();
    setState(() => _saving = true);
    final res = await SpeakerApi.saveProfile(
      speakerId: _speakerId,
      headline: _headlineCtl.text,
      company: _companyCtl.text,
      bio: _bioCtl.text,
      linkedin: _linkedinCtl.text,
      twitter: _twitterCtl.text,
      website: _websiteCtl.text,
    );
    if (!mounted) return;
    setState(() => _saving = false);
    showToast(context, res.message);
    if (res.ok) Navigator.of(context).maybePop();
  }

  @override
  Widget build(BuildContext context) {
    final canSave = !_loading && _error == null;
    return MScaffold(
      appBar: const MAppBar(title: 'Speaker profile'),
      bottomBar: canSave
          ? StickyCta(children: [
              Expanded(
                child: MButton('Save changes', loading: _saving, onTap: _save),
              ),
            ])
          : null,
      body: _loading
          ? const LoadingState()
          : _error != null
              ? ErrorStateView(
                  message: _error!, onRetry: _load, reason: _errorReason)
              : _buildForm(),
    );
  }

  Widget _buildForm() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 40),
      children: [
        // ── Name + headshot (read-only, organizer-managed) + event context ──
        Center(
          child: Column(
            children: [
              Avatar(name: _name, imageUrl: _photoUrl, size: 76),
              const SizedBox(height: 10),
              Text(_name.isEmpty ? 'Speaker' : _name,
                  textAlign: TextAlign.center, style: AppText.h3),
              const SizedBox(height: 2),
              Text(widget.eventName,
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.bodySm.copyWith(color: AppColors.inkMuted)),
            ],
          ),
        ),
        const SizedBox(height: 22),

        const _SectionLabel('Speaker details'),
        MCard(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              MInput(
                label: 'Headline / title',
                hint: 'e.g. Head of Design',
                controller: _headlineCtl,
                icon: Icons.badge_outlined,
              ),
              const SizedBox(height: 16),
              MInput(
                label: 'Company / organization',
                hint: 'Where you work',
                controller: _companyCtl,
                icon: Icons.apartment_outlined,
              ),
            ],
          ),
        ),
        const SizedBox(height: 22),

        const _SectionLabel('Bio'),
        MCard(
          padding: const EdgeInsets.all(16),
          child: MInput(
            hint: 'A short bio attendees will see on your speaker page.',
            controller: _bioCtl,
            minLines: 4,
            maxLines: 8,
            keyboardType: TextInputType.multiline,
          ),
        ),
        const SizedBox(height: 22),

        const _SectionLabel('Links'),
        MCard(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              MInput(
                label: 'LinkedIn',
                hint: 'linkedin.com/in/you',
                controller: _linkedinCtl,
                icon: Icons.link,
                keyboardType: TextInputType.url,
              ),
              const SizedBox(height: 16),
              MInput(
                label: 'X / Twitter',
                hint: '@handle or link',
                controller: _twitterCtl,
                icon: Icons.alternate_email,
              ),
              const SizedBox(height: 16),
              MInput(
                label: 'Website',
                hint: 'https://…',
                controller: _websiteCtl,
                icon: Icons.public,
                keyboardType: TextInputType.url,
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Honest note: name + photo are organizer-managed, not writable by the
        // self-edit RPC — so we say so instead of faking a control.
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.creamSoft,
            borderRadius: BorderRadius.circular(AppRadius.card),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.info_outline,
                  size: 18, color: AppColors.inkMuted),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Your name and headshot are set by the event organizer. Ask '
                  'them to update those if they need changing.',
                  style: AppText.bodySm.copyWith(color: AppColors.inkSoft),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

/// Small uppercase section label matching the account-screen grouping style.
class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel(this.text);
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 2, bottom: 8),
      child: Text(text.toUpperCase(), style: AppText.seclab),
    );
  }
}
