import 'package:flutter/material.dart';

import '../net.dart';
import '../ui/components.dart';
import '../ui/tokens.dart';

/// Edit the signed-in speaker's public `speakers` profile for one event.
///
/// This is the mobile equivalent of the web speaker self-edit surface. The
/// speaker row is resolved for the account by email against `speakers.email`
/// (migration 039) at the given [eventId], then the editable text fields —
/// name, role/title, company, bio and socials — are saved through the existing
/// web API route `PATCH /api/speakers/{id}/profile`.
///
/// Why the API route and not a direct Supabase update: the `speakers` RLS
/// (migration 020) only lets the EVENT OWNER write the row; a speaker cannot
/// update their own row via the anon client. The API route runs admin-side and
/// authorizes the caller by email/role match (`ownedSpeaker`), so the save
/// works for the speaker themself. The route accepts name, role, company, bio,
/// twitter_url, linkedin_url and website_url — those are exactly the fields
/// edited here.
///
/// The headshot (`photo_url`) is set by the organizer and is not part of the
/// self-edit route, so it is shown read-only with an honest note rather than a
/// dead "coming soon" control.
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

  String _speakerId = '';
  String _photoUrl = '';

  final _nameCtl = TextEditingController();
  final _roleCtl = TextEditingController();
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
    _nameCtl.dispose();
    _roleCtl.dispose();
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
    });
    try {
      Map<String, dynamic>? row;

      if ((widget.speakerId ?? '').isNotEmpty) {
        final r = await supa
            .from('speakers')
            .select(
                'id, name, headline, role, company, bio, photo_url, linkedin_url, twitter_url, website_url')
            .eq('id', widget.speakerId as Object)
            .maybeSingle();
        if (r != null) row = Map<String, dynamic>.from(r);
      } else {
        final email = (currentUserEmail ?? '').trim().toLowerCase();
        if (email.isNotEmpty) {
          final rows = await supa
              .from('speakers')
              .select(
                  'id, name, headline, role, company, bio, photo_url, linkedin_url, twitter_url, website_url, email')
              .eq('event_id', widget.eventId)
              .ilike('email', email);
          for (final r in (rows as List).whereType<Map>()) {
            row = Map<String, dynamic>.from(r);
            break; // first matching speaker row for this account at this event
          }
        }
      }

      if (!mounted) return;
      if (row == null) {
        setState(() {
          _loading = false;
          _error =
              'We could not find your speaker profile for this event. The '
              'organizer adds you as a speaker before you can edit your details.';
        });
        return;
      }

      _speakerId = asString(row['id']);
      _photoUrl = asString(row['photo_url']).trim();
      _nameCtl.text = asString(row['name']);
      // `role` is the title field; fall back to legacy `headline` if role is empty.
      final role = asString(row['role']).trim();
      _roleCtl.text = role.isNotEmpty ? role : asString(row['headline']).trim();
      _companyCtl.text = asString(row['company']);
      _bioCtl.text = asString(row['bio']);
      _linkedinCtl.text = asString(row['linkedin_url']);
      _twitterCtl.text = asString(row['twitter_url']);
      _websiteCtl.text = asString(row['website_url']);

      setState(() => _loading = false);
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Something went wrong loading your speaker profile.';
      });
    }
  }

  Future<void> _save() async {
    if (_saving || _speakerId.isEmpty) return;
    final name = _nameCtl.text.trim();
    if (name.isEmpty) {
      showToast(context, 'Your name is required.');
      return;
    }
    setState(() => _saving = true);
    try {
      String? tv(TextEditingController c) =>
          c.text.trim().isEmpty ? null : c.text.trim();
      await apiPatch('/api/speakers/$_speakerId/profile', {
        'name': name,
        'role': tv(_roleCtl),
        'company': tv(_companyCtl),
        'bio': tv(_bioCtl),
        'linkedin_url': tv(_linkedinCtl),
        'twitter_url': tv(_twitterCtl),
        'website_url': tv(_websiteCtl),
      });
      if (!mounted) return;
      setState(() => _saving = false);
      showToast(context, 'Speaker profile saved');
      Navigator.of(context).maybePop();
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _saving = false);
      showToast(context, e.message);
    } catch (_) {
      if (!mounted) return;
      setState(() => _saving = false);
      showToast(context, 'Could not save your speaker profile.');
    }
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
              ? ErrorStateView(message: _error!, onRetry: _load)
              : _buildForm(),
    );
  }

  Widget _buildForm() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 40),
      children: [
        // ── Headshot (read-only) + event context ────────────────────────────
        Center(
          child: Column(
            children: [
              Avatar(name: _nameCtl.text, imageUrl: _photoUrl, size: 76),
              const SizedBox(height: 10),
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
                label: 'Name',
                hint: 'Your full name',
                controller: _nameCtl,
                icon: Icons.person_outline,
                onChanged: (_) => setState(() {}),
              ),
              const SizedBox(height: 16),
              MInput(
                label: 'Role / title',
                hint: 'e.g. Head of Design',
                controller: _roleCtl,
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

        // Honest note: the photo is organizer-managed, not part of the
        // self-edit route — so we say so instead of faking an upload control.
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
                  'Your headshot is set by the event organizer. Ask them to '
                  'update it if it needs changing.',
                  style: AppText.bodySm.copyWith(color: AppColors.inkMuted),
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
