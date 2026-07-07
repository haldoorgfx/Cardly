// SP03 · Speaker profile — mobile self-edit.
// Resolves the account's speaker row for this event and saves the editable
// subset (headline, company, bio, socials) DIRECT to Supabase through the
// ownership-checked `update_speaker_profile` RPC (063). Name + headshot are
// organizer-managed and shown read-only — the RPC cannot write them, so we say
// so honestly rather than fake a control.

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../net.dart';
import '../../ui/tokens.dart';
import '../../ui/components.dart';
import '../role_widgets.dart';
import 'speaker_api.dart';

class SpeakerProfileScreen extends StatefulWidget {
  final String eventId;
  final String eventName;
  const SpeakerProfileScreen(
      {super.key, required this.eventId, required this.eventName});

  @override
  State<SpeakerProfileScreen> createState() => _SpeakerProfileScreenState();
}

class _SpeakerProfileScreenState extends State<SpeakerProfileScreen> {
  final _headline = TextEditingController();
  final _company = TextEditingController();
  final _bio = TextEditingController();
  final _linkedin = TextEditingController();
  final _twitter = TextEditingController();
  final _website = TextEditingController();

  String? _speakerId;
  String _name = '';
  String _photoUrl = '';

  bool _loading = true;
  bool _saving = false;
  bool _error = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _headline.dispose();
    _company.dispose();
    _bio.dispose();
    _linkedin.dispose();
    _twitter.dispose();
    _website.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = false;
    });
    try {
      final row = await SpeakerApi.resolveSpeaker(eventId: widget.eventId);
      if (!mounted) return;
      if (row == null) {
        setState(() {
          _speakerId = null;
          _loading = false;
        });
        return;
      }
      _speakerId = asString(row['id']);
      _name = asString(row['name']);
      _photoUrl = asString(row['photo_url']).trim();
      // The RPC persists `headline`; fall back to legacy `role` when empty.
      final headline = asString(row['headline']).trim();
      _headline.text =
          headline.isNotEmpty ? headline : asString(row['role']).trim();
      _company.text = asString(row['company']);
      _bio.text = asString(row['bio']);
      _linkedin.text = asString(row['linkedin_url']);
      _twitter.text = asString(row['twitter_url']);
      _website.text = asString(row['website_url']);
      setState(() => _loading = false);
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = true;
      });
    }
  }

  Future<void> _save() async {
    final id = _speakerId;
    if (id == null || _saving) return;
    HapticFeedback.mediumImpact();
    setState(() => _saving = true);
    final res = await SpeakerApi.saveProfile(
      speakerId: id,
      headline: _headline.text,
      bio: _bio.text,
      company: _company.text,
      linkedin: _linkedin.text,
      twitter: _twitter.text,
      website: _website.text,
    );
    if (!mounted) return;
    setState(() => _saving = false);
    showToast(context, res.message);
    if (res.ok) Navigator.of(context).maybePop();
  }

  @override
  Widget build(BuildContext context) {
    final canSave = !_loading && !_error && _speakerId != null;
    return MScaffold(
      appBar: const MAppBar(title: 'Speaker profile'),
      bottomBar: canSave
          ? StickyCta(children: [
              Expanded(
                child:
                    MButton('Save changes', loading: _saving, onTap: _save),
              ),
            ])
          : null,
      body: _loading
          ? const LoadingState()
          : _error
              ? ErrorStateView(
                  message: "We couldn't load your speaker profile.",
                  onRetry: _load)
              : _speakerId == null
                  ? const EmptyState(
                      icon: Icons.person_outline,
                      title: 'No speaker profile',
                      message:
                          'You are not listed as a speaker for this event. The '
                          'organizer adds you before you can edit your details.',
                    )
                  : _form(),
    );
  }

  Widget _form() {
    return ListView(
      children: [
        RoleBar(
            icon: Icons.mic_none,
            eventName: widget.eventName,
            roleLine: 'Speaker'),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 18, 16, 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Column(
                  children: [
                    Avatar(name: _name, imageUrl: _photoUrl, size: 76),
                    const SizedBox(height: 10),
                    Text(_name,
                        textAlign: TextAlign.center,
                        style: AppText.h3),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              const SectionLabel('Speaker details'),
              const SizedBox(height: 10),
              _field('Headline / title', _headline,
                  hint: 'e.g. Head of Design at Acme', icon: Icons.badge_outlined),
              _field('Company / organization', _company,
                  hint: 'Where you work', icon: Icons.apartment_outlined),
              _field('Bio', _bio,
                  hint: 'A short bio attendees will see on your speaker page.',
                  lines: 4),
              const SizedBox(height: 6),
              const SectionLabel('Links'),
              const SizedBox(height: 10),
              _field('LinkedIn', _linkedin,
                  hint: 'linkedin.com/in/you',
                  icon: Icons.link,
                  keyboard: TextInputType.url),
              _field('X / Twitter', _twitter,
                  hint: '@handle or link', icon: Icons.alternate_email),
              _field('Website', _website,
                  hint: 'https://…',
                  icon: Icons.public,
                  keyboard: TextInputType.url),
              const SizedBox(height: 6),
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
                        'Your name and headshot are set by the event organizer. '
                        'Ask them to update those if they need changing.',
                        style:
                            AppText.bodySm.copyWith(color: AppColors.inkSoft),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _field(String label, TextEditingController c,
          {String? hint,
          IconData? icon,
          int lines = 1,
          TextInputType? keyboard}) =>
      Padding(
        padding: const EdgeInsets.only(bottom: 14),
        child: MInput(
          label: label,
          hint: hint,
          controller: c,
          icon: icon,
          minLines: lines,
          maxLines: lines > 1 ? lines + 3 : 1,
          keyboardType:
              keyboard ?? (lines > 1 ? TextInputType.multiline : null),
        ),
      );
}
