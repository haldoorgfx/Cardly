// SP03 · Speaker profile — light inline edit (headline, company, bio, social).
// Resolves the user's speaker row for this event; saves via `update_speaker_profile`
// RPC (063). Full management punts to web. DRAFT — verify via `flutter analyze`.

import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../ui/tokens.dart';
import '../../ui/components.dart';
import '../role_widgets.dart';

class SpeakerProfileScreen extends StatefulWidget {
  final String eventId;
  final String eventName;
  const SpeakerProfileScreen({super.key, required this.eventId, required this.eventName});

  @override
  State<SpeakerProfileScreen> createState() => _SpeakerProfileScreenState();
}

class _SpeakerProfileScreenState extends State<SpeakerProfileScreen> {
  final _headline = TextEditingController();
  final _company = TextEditingController();
  final _bio = TextEditingController();
  final _linkedin = TextEditingController();
  String? _speakerId, _name;
  bool _loading = true, _saving = false;
  String? _msg;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final email = Supabase.instance.client.auth.currentUser?.email?.toLowerCase() ?? '';
    final rows = await Supabase.instance.client
        .from('speakers')
        .select('id, name, headline, bio, company, linkedin_url, photo_url')
        .eq('event_id', widget.eventId)
        .ilike('email', email);
    if ((rows as List).isNotEmpty) {
      final m = Map<String, dynamic>.from(rows.first as Map);
      _speakerId = (m['id'] ?? '').toString();
      _name = (m['name'] ?? '').toString();
      _headline.text = (m['headline'] ?? '').toString();
      _company.text = (m['company'] ?? '').toString();
      _bio.text = (m['bio'] ?? '').toString();
      _linkedin.text = (m['linkedin_url'] ?? '').toString();
    }
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _save() async {
    if (_speakerId == null) return;
    setState(() { _saving = true; _msg = null; });
    try {
      final res = await Supabase.instance.client.rpc('update_speaker_profile', params: {
        'p_speaker_id': _speakerId,
        'p_headline': _headline.text.trim(),
        'p_bio': _bio.text.trim(),
        'p_company': _company.text.trim(),
        'p_linkedin_url': _linkedin.text.trim(),
      });
      final ok = (res is Map) && res['result'] == 'success';
      setState(() => _msg = ok ? 'Saved' : 'Could not save');
    } catch (_) {
      setState(() => _msg = 'Could not save');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: MAppBar(title: 'Speaker profile'),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.forest))
          : _speakerId == null
              ? const EmptyState(
                  icon: Icons.person_outline,
                  title: 'No speaker profile',
                  message: 'You are not listed as a speaker for this event.')
              : ListView(
                  children: [
                    RoleBar(icon: Icons.mic_none, eventName: widget.eventName, roleLine: 'Speaker'),
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(_name ?? '',
                              style: const TextStyle(
                                  color: AppColors.ink, fontSize: 20, fontWeight: FontWeight.w700)),
                          const SizedBox(height: 16),
                          _field('Headline', _headline),
                          _field('Company', _company),
                          _field('Bio', _bio, lines: 3),
                          _field('LinkedIn URL', _linkedin),
                          const SizedBox(height: 8),
                          if (_msg != null)
                            Padding(
                              padding: const EdgeInsets.only(bottom: 8),
                              child: Text(_msg!,
                                  style: TextStyle(
                                      color: _msg == 'Saved' ? AppColors.success : AppColors.danger,
                                      fontSize: 13)),
                            ),
                          MButton('Save', loading: _saving, onTap: _saving ? null : _save),
                          const SizedBox(height: 12),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                                color: AppColors.forestSoft, borderRadius: BorderRadius.circular(12)),
                            child: const Text('Photo, slides and full bio management are on the web dashboard.',
                                style: TextStyle(color: AppColors.forest, fontSize: 12.5, height: 1.4)),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
    );
  }

  Widget _field(String label, TextEditingController c, {int lines = 1}) => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label,
                style: const TextStyle(color: AppColors.inkMuted, fontSize: 12.5, fontWeight: FontWeight.w600)),
            const SizedBox(height: 4),
            TextField(
              controller: c,
              maxLines: lines,
              decoration: InputDecoration(
                filled: true,
                fillColor: AppColors.creamSoft,
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              ),
            ),
          ],
        ),
      );
}
