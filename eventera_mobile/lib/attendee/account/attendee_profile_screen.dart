import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart' show FileOptions;

import '../../net.dart';
import '../../ui/tokens.dart';
import '../../ui/components.dart';

/// View / edit the signed-in attendee's `profiles` row.
///
/// Own-row RLS (id = auth.uid()). Verified against migrations
/// 003_roles_and_rls + 010_attendee_accounts and app/api/profile/route.ts:
///   profiles(id, full_name, avatar_url, city, phone, interests text[],
///            notification_prefs jsonb, email)
/// notification_prefs keys used here (subset of the defaults):
///   reminders_email, agenda_changes_email, organizer_follows_email,
///   recommendations_email.
class AttendeeProfileScreen extends StatefulWidget {
  final VoidCallback? onSignInTap;
  const AttendeeProfileScreen({super.key, this.onSignInTap});

  @override
  State<AttendeeProfileScreen> createState() => _AttendeeProfileScreenState();
}

class _AttendeeProfileScreenState extends State<AttendeeProfileScreen> {
  bool _loading = true;
  bool _saving = false;
  bool _uploadingAvatar = false;
  String? _error;

  final _nameCtl = TextEditingController();
  final _cityCtl = TextEditingController();
  final _phoneCtl = TextEditingController();
  final _interestCtl = TextEditingController();

  String? _avatarUrl;
  String _email = '';
  List<String> _interests = [];
  Map<String, dynamic> _prefs = {};

  // Suggested interests offered as tap-to-add chips (in addition to any
  // custom ones the attendee already has).
  static const _suggestedInterests = <String>[
    'Fintech', 'Design', 'Music', 'Startups', 'Climate', 'AI',
    'Marketing', 'Product', 'Web3', 'Health',
  ];

  // The notification pref toggles we surface (jsonb keys).
  static const _prefKeys = <String, String>{
    'reminders_email': 'Event reminders',
    'agenda_changes_email': 'Agenda changes',
    'organizer_follows_email': 'New events from organizers you follow',
    'recommendations_email': 'Recommended events',
  };

  @override
  void initState() {
    super.initState();
    if (isSignedIn) {
      _load();
    } else {
      _loading = false;
    }
  }

  @override
  void dispose() {
    _nameCtl.dispose();
    _cityCtl.dispose();
    _phoneCtl.dispose();
    _interestCtl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    if (!isSignedIn) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final row = await supa
          .from('profiles')
          .select(
              'full_name, avatar_url, city, phone, interests, notification_prefs, email')
          .eq('id', currentUserId as Object)
          .maybeSingle();

      if (!mounted) return;
      final m = row == null
          ? <String, dynamic>{}
          : Map<String, dynamic>.from(row);
      _nameCtl.text = asString(m['full_name']);
      _cityCtl.text = asString(m['city']);
      _phoneCtl.text = asString(m['phone']);
      _avatarUrl = m['avatar_url'] == null ? null : asString(m['avatar_url']);
      _email = asString(m['email'], currentUserEmail ?? '');
      final rawInterests = m['interests'];
      _interests = (rawInterests is List)
          ? rawInterests.map((e) => e.toString()).toList()
          : <String>[];
      final rawPrefs = m['notification_prefs'];
      _prefs = (rawPrefs is Map)
          ? Map<String, dynamic>.from(rawPrefs)
          : <String, dynamic>{};

      setState(() => _loading = false);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.message;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Something went wrong loading your profile.';
      });
    }
  }

  bool _hasInterest(String v) =>
      _interests.any((e) => e.toLowerCase() == v.toLowerCase());

  void _addInterest([String? value]) {
    final v = (value ?? _interestCtl.text).trim();
    if (v.isEmpty) return;
    if (_hasInterest(v)) {
      _interestCtl.clear();
      return;
    }
    setState(() {
      _interests.add(v);
      _interestCtl.clear();
    });
  }

  void _toggleInterest(String v) {
    setState(() {
      if (_hasInterest(v)) {
        _interests.removeWhere((e) => e.toLowerCase() == v.toLowerCase());
      } else {
        _interests.add(v);
      }
    });
  }

  Future<void> _save() async {
    if (!isSignedIn || _saving) return;
    setState(() => _saving = true);
    try {
      final patch = <String, dynamic>{
        'full_name': _nameCtl.text.trim().isEmpty ? null : _nameCtl.text.trim(),
        'city': _cityCtl.text.trim().isEmpty ? null : _cityCtl.text.trim(),
        'phone': _phoneCtl.text.trim().isEmpty ? null : _phoneCtl.text.trim(),
        'interests': _interests,
        'notification_prefs': _prefs,
      };
      await supa.from('profiles').update(patch).eq('id', currentUserId as Object);
      if (!mounted) return;
      setState(() => _saving = false);
      showToast(context, 'Profile saved');
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _saving = false);
      showToast(context, e.message);
    } catch (_) {
      if (!mounted) return;
      setState(() => _saving = false);
      showToast(context, 'Could not save your profile');
    }
  }

  Future<void> _changeAvatar() async {
    if (!isSignedIn || _uploadingAvatar) return;
    try {
      final picked = await ImagePicker().pickImage(
        source: ImageSource.gallery,
        maxWidth: 800,
        maxHeight: 800,
        imageQuality: 85,
      );
      if (picked == null) return;
      final bytes = await picked.readAsBytes();
      if (!mounted) return;
      setState(() => _uploadingAvatar = true);

      final path = 'avatars/$currentUserId.jpg';
      await supa.storage.from('uploads').uploadBinary(
            path,
            bytes,
            fileOptions: const FileOptions(
              upsert: true,
              contentType: 'image/jpeg',
            ),
          );
      final url = supa.storage.from('uploads').getPublicUrl(path);
      await supa
          .from('profiles')
          .update({'avatar_url': url}).eq('id', currentUserId as Object);

      if (!mounted) return;
      setState(() {
        // Cache-bust so the freshly uploaded image shows immediately.
        _avatarUrl = '$url?t=${DateTime.now().millisecondsSinceEpoch}';
        _uploadingAvatar = false;
      });
      showToast(context, 'Photo updated');
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _uploadingAvatar = false);
      showToast(context, e.message);
    } catch (_) {
      if (!mounted) return;
      setState(() => _uploadingAvatar = false);
      showToast(context, 'Could not update your photo');
    }
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: MAppBar(
        title: 'Profile',
        hairline: true,
        actions: [
          if (isSignedIn)
            Padding(
              padding: const EdgeInsets.only(right: 6),
              child: GestureDetector(
                onTap: _saving ? null : _save,
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
                  child: _saving
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: AppColors.forest),
                        )
                      : Text('Save',
                          style:
                              AppText.label.copyWith(color: AppColors.forest)),
                ),
              ),
            ),
        ],
      ),
      bottomBar: isSignedIn && !_loading && _error == null
          ? StickyCta(children: [
              Expanded(
                child: MButton('Save changes',
                    loading: _saving, onTap: _save),
              ),
            ])
          : null,
      body: !isSignedIn
          ? _SignInPrompt(
              message: 'Sign in to view and edit your profile.',
              onSignInTap: widget.onSignInTap)
          : _loading
              ? const LoadingState()
              : _error != null
                  ? ErrorStateView(message: _error!, onRetry: _load)
                  : _buildForm(),
    );
  }

  Widget _buildForm() {
    // Interests to show as chips: suggested set + any custom ones already saved.
    final custom = _interests
        .where((i) => !_suggestedInterests
            .any((s) => s.toLowerCase() == i.toLowerCase()))
        .toList();
    final chips = [..._suggestedInterests, ...custom];

    return ListView(
      padding: const EdgeInsets.fromLTRB(AppSpace.lg, AppSpace.base, AppSpace.lg, 40),
      children: [
        Center(
          child: Column(
            children: [
              GestureDetector(
                onTap: _uploadingAvatar ? null : _changeAvatar,
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Avatar(name: _nameCtl.text, imageUrl: _avatarUrl, size: 84),
                    if (_uploadingAvatar)
                      Positioned.fill(
                        child: Container(
                          decoration: const BoxDecoration(
                            color: Color(0x66000000),
                            shape: BoxShape.circle,
                          ),
                          alignment: Alignment.center,
                          child: const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(
                                strokeWidth: 2.5, color: Colors.white),
                          ),
                        ),
                      ),
                    Positioned(
                      bottom: -2,
                      right: -2,
                      child: Container(
                        width: 28,
                        height: 28,
                        decoration: BoxDecoration(
                          color: AppColors.forest,
                          shape: BoxShape.circle,
                          border:
                              Border.all(color: AppColors.canvas, width: 2.5),
                        ),
                        alignment: Alignment.center,
                        child: const Icon(Icons.edit,
                            size: 13, color: Colors.white),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 10),
              if (_email.isNotEmpty)
                Text(_email, style: AppText.caption),
            ],
          ),
        ),
        const SizedBox(height: 28),
        MInput(
          label: 'Full name',
          hint: 'Your name',
          controller: _nameCtl,
          onChanged: (_) => setState(() {}),
        ),
        const SizedBox(height: 18),
        MInput(
          label: 'City',
          hint: 'Where you\'re based',
          controller: _cityCtl,
        ),
        const SizedBox(height: 18),
        MInput(
          label: 'Phone',
          hint: '+000 000 0000',
          controller: _phoneCtl,
          keyboardType: TextInputType.phone,
        ),
        const SizedBox(height: 24),
        const SectionLabel('Interests'),
        const SizedBox(height: 12),
        Wrap(
          spacing: 9,
          runSpacing: 9,
          children: [
            for (final tag in chips)
              MChip(
                tag,
                selected: _hasInterest(tag),
                onTap: () => _toggleInterest(tag),
              ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: MInput(
                hint: 'Add your own interest',
                controller: _interestCtl,
                action: TextInputAction.done,
                onSubmitted: (_) => _addInterest(),
              ),
            ),
            const SizedBox(width: 10),
            GestureDetector(
              onTap: () => _addInterest(),
              child: Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  color: AppColors.forest,
                  borderRadius: BorderRadius.circular(AppRadius.btn),
                ),
                alignment: Alignment.center,
                child: const Icon(Icons.add, size: 20, color: Colors.white),
              ),
            ),
          ],
        ),
        const SizedBox(height: 28),
        const SectionLabel('Notifications'),
        const SizedBox(height: 4),
        ..._prefKeys.entries.map((e) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Row(
                children: [
                  Expanded(
                    child: Text(e.value,
                        style: AppText.subhead.copyWith(fontSize: 14)),
                  ),
                  const SizedBox(width: 12),
                  MToggle(
                    value: _prefs[e.key] == true,
                    onChanged: (v) => setState(() => _prefs[e.key] = v),
                  ),
                ],
              ),
            )),
      ],
    );
  }
}

// ─── local widgets ──────────────────────────────────────────────────────────

class _SignInPrompt extends StatelessWidget {
  final String message;
  final VoidCallback? onSignInTap;
  const _SignInPrompt({required this.message, this.onSignInTap});
  @override
  Widget build(BuildContext context) {
    return EmptyState(
      icon: Icons.lock_outline,
      title: 'Sign in required',
      message: message,
      ctaLabel: onSignInTap != null ? 'Sign in' : null,
      onCta: onSignInTap,
    );
  }
}
