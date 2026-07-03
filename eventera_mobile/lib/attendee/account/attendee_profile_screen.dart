import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart'
    show FileOptions, UserAttributes;

import '../../net.dart';
import '../../ui/tokens.dart';
import '../../ui/components.dart';
import '../../ui/menu.dart';

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
  String _language = 'English';
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
      _language = asString(_prefs['language'], 'English');

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

  // Short descriptions shown under each notification toggle title.
  static const _prefBlurbs = <String, String>{
    'reminders_email': 'A nudge before events you\'re attending start.',
    'agenda_changes_email': 'When a session time or venue is updated.',
    'organizer_follows_email': 'Fresh events from organizers you follow.',
    'recommendations_email': 'Events we think you\'ll want to attend.',
  };

  // Opens a sheet to add a custom interest. Reuses the existing _interestCtl
  // and _addInterest logic so persistence is unchanged.
  Future<void> _openAddInterest() async {
    _interestCtl.clear();
    await showMSheet<void>(
      context,
      StatefulBuilder(
        builder: (ctx, setSheet) => Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Add an interest', style: AppText.h3),
            const SizedBox(height: 4),
            Text('Tell organizers what you\'re into.', style: AppText.bodySm),
            const SizedBox(height: 16),
            MInput(
              hint: 'e.g. Photography',
              controller: _interestCtl,
              icon: Icons.tag,
              action: TextInputAction.done,
              onSubmitted: (_) {
                _addInterest();
                Navigator.of(ctx).maybePop();
              },
            ),
            const SizedBox(height: 16),
            MButton('Add interest', onTap: () {
              _addInterest();
              Navigator.of(ctx).maybePop();
            }),
          ],
        ),
      ),
    );
  }

  // ── Account handlers ──────────────────────────────────────────────────
  /// Change email via Supabase's real flow: a confirmation link is sent to the
  /// new address and the email only changes once the user confirms it.
  Future<void> _changeEmail() async {
    final ctl = TextEditingController();
    bool busy = false;
    await showMSheet<void>(
      context,
      StatefulBuilder(
        builder: (ctx, setSheet) => Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Change email', style: AppText.h3),
            const SizedBox(height: 4),
            Text(
              'We\'ll email a confirmation link to the new address. Your sign-in '
              'email changes only after you confirm it.',
              style: AppText.bodySm,
            ),
            const SizedBox(height: 16),
            MInput(
              hint: 'new@email.com',
              controller: ctl,
              icon: Icons.alternate_email,
              keyboardType: TextInputType.emailAddress,
            ),
            const SizedBox(height: 16),
            MButton('Send confirmation', loading: busy, onTap: () async {
              final email = ctl.text.trim().toLowerCase();
              if (!email.contains('@') ||
                  !email.contains('.') ||
                  email.length < 5) {
                return;
              }
              setSheet(() => busy = true);
              try {
                await supa.auth.updateUser(UserAttributes(email: email));
                if (ctx.mounted) Navigator.of(ctx).pop();
                if (mounted) {
                  showToast(context, 'Check $email to confirm the change.');
                }
              } catch (_) {
                setSheet(() => busy = false);
                if (mounted) {
                  showToast(
                      context, 'Could not update your email. Please try again.');
                }
              }
            }),
          ],
        ),
      ),
    );
  }

  /// Pick a language. The choice is stored on the profile (saved on "Save
  /// changes"). Full UI translation is a separate localization task.
  Future<void> _changeLanguage() async {
    const langs = ['English', 'Français', 'Soomaali', 'العربية'];
    await showMSheet<void>(
      context,
      Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Language & region', style: AppText.h3),
          const SizedBox(height: 8),
          for (final l in langs)
            InkWell(
              onTap: () {
                setState(() {
                  _language = l;
                  _prefs['language'] = l;
                });
                Navigator.of(context).maybePop();
                showToast(context, 'Language set to $l — tap Save changes.');
              },
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 14),
                child: Row(
                  children: [
                    Icon(
                        l == _language
                            ? Icons.radio_button_checked
                            : Icons.radio_button_off,
                        size: 20,
                        color:
                            l == _language ? AppColors.forest : AppColors.inkMuted),
                    const SizedBox(width: 12),
                    Expanded(child: Text(l, style: AppText.bodyStrong)),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Future<void> _deleteAccount() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.card)),
        title: Text('Delete account?', style: AppText.h3),
        content: Text(
          'This permanently removes your profile and data. This can\'t be undone.',
          style: AppText.bodySm,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: Text('Cancel',
                style: AppText.label.copyWith(color: AppColors.inkSoft)),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: Text('Delete',
                style: AppText.label.copyWith(color: AppColors.danger)),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    setState(() => _saving = true);
    try {
      // Backend performs the privileged auth-user deletion.
      await apiPost('/api/account/delete', {});
      await supa.auth.signOut();
      if (!mounted) return;
      Navigator.of(context).popUntil((r) => r.isFirst);
      showToast(context, 'Your account has been deleted.');
    } catch (_) {
      if (!mounted) return;
      setState(() => _saving = false);
      showToast(context,
          'We couldn\'t delete your account right now. Please contact support.');
    }
  }

  Widget _buildForm() {
    // Interests to show as chips: suggested set + any custom ones already saved.
    final custom = _interests
        .where((i) => !_suggestedInterests
            .any((s) => s.toLowerCase() == i.toLowerCase()))
        .toList();
    final chips = [..._suggestedInterests, ...custom];

    return ListView(
      padding:
          const EdgeInsets.fromLTRB(AppSpace.lg, AppSpace.base, AppSpace.lg, 40),
      children: [
        // ── Avatar + email header ─────────────────────────────────────────
        Center(
          child: Column(
            children: [
              GestureDetector(
                onTap: _uploadingAvatar ? null : _changeAvatar,
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Avatar(name: _nameCtl.text, imageUrl: _avatarUrl, size: 72),
                    if (_uploadingAvatar)
                      Positioned.fill(
                        child: Container(
                          decoration: const BoxDecoration(
                            color: Color(0x66000000),
                            shape: BoxShape.circle,
                          ),
                          alignment: Alignment.center,
                          child: const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                                strokeWidth: 2.5, color: Colors.white),
                          ),
                        ),
                      ),
                    Positioned(
                      bottom: -2,
                      right: -2,
                      child: Container(
                        width: 26,
                        height: 26,
                        decoration: BoxDecoration(
                          color: AppColors.forest,
                          shape: BoxShape.circle,
                          border:
                              Border.all(color: AppColors.canvas, width: 2.5),
                        ),
                        alignment: Alignment.center,
                        child: const Icon(Icons.camera_alt,
                            size: 12, color: Colors.white),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              if (_email.isNotEmpty)
                Text(_email,
                    textAlign: TextAlign.center,
                    style: AppText.bodySm
                        .copyWith(color: AppColors.inkMuted)),
            ],
          ),
        ),
        const SizedBox(height: 26),

        // ── Personal details ──────────────────────────────────────────────
        const GroupLabel('Personal details'),
        MCard(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              MInput(
                label: 'Full name',
                hint: 'Your name',
                controller: _nameCtl,
                icon: Icons.person_outline,
                onChanged: (_) => setState(() {}),
              ),
              const SizedBox(height: 16),
              MInput(
                label: 'City',
                hint: 'Where you\'re based',
                controller: _cityCtl,
                icon: Icons.place_outlined,
              ),
              const SizedBox(height: 16),
              MInput(
                label: 'Phone',
                hint: '+000 000 0000',
                controller: _phoneCtl,
                icon: Icons.phone_outlined,
                keyboardType: TextInputType.phone,
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),

        // ── Interests ─────────────────────────────────────────────────────
        const GroupLabel('Interests'),
        MCard(
          padding: const EdgeInsets.all(16),
          child: Wrap(
            spacing: 9,
            runSpacing: 9,
            children: [
              for (final tag in chips)
                MChip(
                  tag,
                  selected: _hasInterest(tag),
                  onTap: () => _toggleInterest(tag),
                ),
              _AddChip(onTap: _openAddInterest),
            ],
          ),
        ),
        const SizedBox(height: 24),

        // ── Notifications ─────────────────────────────────────────────────
        const GroupLabel('Notifications'),
        MCard(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Column(
            children: [
              for (var i = 0; i < _prefKeys.length; i++) ...[
                if (i > 0)
                  const Divider(
                      height: 1, thickness: 1, color: AppColors.border),
                _NotifRow(
                  title: _prefKeys.values.elementAt(i),
                  blurb: _prefBlurbs[_prefKeys.keys.elementAt(i)] ?? '',
                  value: _prefs[_prefKeys.keys.elementAt(i)] == true,
                  onChanged: (v) => setState(
                      () => _prefs[_prefKeys.keys.elementAt(i)] = v),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 24),

        // ── Account ───────────────────────────────────────────────────────
        const GroupLabel('Account'),
        MenuGroup(children: [
          MenuRow(
            icon: Icons.alternate_email,
            tone: ITone.info,
            title: 'Change email',
            subtitle: _email.isNotEmpty ? _email : null,
            onTap: _changeEmail,
          ),
          MenuRow(
            icon: Icons.language,
            tone: ITone.forest,
            title: 'Language & region',
            trailing: Text(_language,
                style: AppText.bodySm.copyWith(color: AppColors.inkMuted)),
            onTap: _changeLanguage,
          ),
          MenuRow(
            icon: Icons.delete_outline,
            tone: ITone.danger,
            title: 'Delete account',
            chevron: false,
            onTap: _deleteAccount,
          ),
        ]),
      ],
    );
  }
}

// ─── local widgets ──────────────────────────────────────────────────────────

/// A dashed "＋ Add" chip that matches the MChip height/shape.
class _AddChip extends StatelessWidget {
  final VoidCallback onTap;
  const _AddChip({required this.onTap});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 34,
        padding: const EdgeInsets.symmetric(horizontal: 14),
        decoration: BoxDecoration(
          color: AppColors.creamSoft,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: AppColors.borderStrong),
        ),
        alignment: Alignment.center,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.add, size: 15, color: AppColors.forest),
            const SizedBox(width: 5),
            Text('Add',
                style: AppText.bodySm.copyWith(
                    color: AppColors.forest,
                    fontWeight: FontWeight.w600,
                    height: 1.0)),
          ],
        ),
      ),
    );
  }
}

/// A single notification preference row: title + short blurb + toggle.
class _NotifRow extends StatelessWidget {
  final String title;
  final String blurb;
  final bool value;
  final ValueChanged<bool> onChanged;
  const _NotifRow({
    required this.title,
    required this.blurb,
    required this.value,
    required this.onChanged,
  });
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 14),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(title, style: AppText.h3.copyWith(fontSize: 15)),
                if (blurb.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(blurb,
                      style: AppText.caption.copyWith(
                          fontSize: 12,
                          letterSpacing: 0,
                          color: AppColors.inkMuted)),
                ],
              ],
            ),
          ),
          const SizedBox(width: 12),
          MToggle(value: value, onChanged: onChanged),
        ],
      ),
    );
  }
}

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
