import 'package:flutter/material.dart';

import '../../net.dart';
import '../../theme.dart';

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
  String? _error;

  final _nameCtl = TextEditingController();
  final _cityCtl = TextEditingController();
  final _phoneCtl = TextEditingController();
  final _interestCtl = TextEditingController();

  String? _avatarUrl;
  String _email = '';
  List<String> _interests = [];
  Map<String, dynamic> _prefs = {};

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
    if (isSignedIn) _load();
    else _loading = false;
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

      final m = (row is Map) ? Map<String, dynamic>.from(row) : <String, dynamic>{};
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
      setState(() {
        _loading = false;
        _error = e.message;
      });
    } catch (_) {
      setState(() {
        _loading = false;
        _error = 'Something went wrong loading your profile.';
      });
    }
  }

  void _addInterest() {
    final v = _interestCtl.text.trim();
    if (v.isEmpty) return;
    if (_interests.any((e) => e.toLowerCase() == v.toLowerCase())) {
      _interestCtl.clear();
      return;
    }
    setState(() {
      _interests.add(v);
      _interestCtl.clear();
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
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Profile saved')));
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _saving = false);
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(e.message)));
    } catch (_) {
      if (!mounted) return;
      setState(() => _saving = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not save your profile')),
      );
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
        title: const Text('Profile', style: TextStyle(color: Brand.forest)),
      ),
      body: !isSignedIn
          ? _SignInPrompt(
              message: 'Sign in to view and edit your profile.',
              onSignInTap: widget.onSignInTap)
          : _loading
              ? const _CenterSpinner()
              : _error != null
                  ? _ErrorState(message: _error!, onRetry: _load)
                  : _buildForm(),
    );
  }

  Widget _buildForm() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 40),
      children: [
        Center(
          child: Column(
            children: [
              _Avatar(url: _avatarUrl, name: _nameCtl.text, size: 84),
              const SizedBox(height: 10),
              if (_email.isNotEmpty)
                Text(_email,
                    style: const TextStyle(fontSize: 13, color: Brand.muted)),
            ],
          ),
        ),
        const SizedBox(height: 28),
        const _FieldLabel('Full name'),
        const SizedBox(height: 6),
        TextField(
          controller: _nameCtl,
          textCapitalization: TextCapitalization.words,
          decoration: const InputDecoration(hintText: 'Your name'),
          onChanged: (_) => setState(() {}),
        ),
        const SizedBox(height: 18),
        const _FieldLabel('City'),
        const SizedBox(height: 6),
        TextField(
          controller: _cityCtl,
          textCapitalization: TextCapitalization.words,
          decoration: const InputDecoration(hintText: 'Where you\'re based'),
        ),
        const SizedBox(height: 18),
        const _FieldLabel('Phone'),
        const SizedBox(height: 6),
        TextField(
          controller: _phoneCtl,
          keyboardType: TextInputType.phone,
          decoration: const InputDecoration(hintText: '+000 000 0000'),
        ),
        const SizedBox(height: 24),
        const _FieldLabel('Interests'),
        const SizedBox(height: 6),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _interestCtl,
                textInputAction: TextInputAction.done,
                decoration:
                    const InputDecoration(hintText: 'Add an interest'),
                onSubmitted: (_) => _addInterest(),
              ),
            ),
            const SizedBox(width: 8),
            IconButton.filled(
              style: IconButton.styleFrom(backgroundColor: Brand.forest),
              icon: const Icon(Icons.add, size: 20),
              onPressed: _addInterest,
            ),
          ],
        ),
        if (_interests.isNotEmpty) ...[
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _interests
                .map((tag) => _InterestChip(
                      label: tag,
                      onRemove: () => setState(() => _interests.remove(tag)),
                    ))
                .toList(),
          ),
        ],
        const SizedBox(height: 28),
        const _FieldLabel('Email notifications'),
        const SizedBox(height: 4),
        ..._prefKeys.entries.map((e) => SwitchListTile.adaptive(
              contentPadding: EdgeInsets.zero,
              activeColor: Brand.forest,
              title: Text(e.value,
                  style: const TextStyle(fontSize: 14, color: Brand.ink)),
              value: _prefs[e.key] == true,
              onChanged: (v) => setState(() => _prefs[e.key] = v),
            )),
        const SizedBox(height: 24),
        FilledButton(
          onPressed: _saving ? null : _save,
          child: _saving
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                      strokeWidth: 2, color: Colors.white),
                )
              : const Text('Save changes'),
        ),
      ],
    );
  }
}

// ─── local widgets ──────────────────────────────────────────────────────────

class _FieldLabel extends StatelessWidget {
  final String text;
  const _FieldLabel(this.text);
  @override
  Widget build(BuildContext context) => Text(
        text,
        style: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w700,
          color: Brand.inkSoft,
        ),
      );
}

class _InterestChip extends StatelessWidget {
  final String label;
  final VoidCallback onRemove;
  const _InterestChip({required this.label, required this.onRemove});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.only(left: 12, right: 6, top: 6, bottom: 6),
      decoration: BoxDecoration(
        color: Brand.forest.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(label,
              style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Brand.forest)),
          const SizedBox(width: 4),
          GestureDetector(
            onTap: onRemove,
            child: const Icon(Icons.close, size: 16, color: Brand.forest),
          ),
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
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.lock_outline, color: Brand.forest, size: 44),
            const SizedBox(height: 14),
            const Text('Sign in required',
                style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: Brand.ink)),
            const SizedBox(height: 8),
            Text(message,
                textAlign: TextAlign.center,
                style:
                    const TextStyle(fontSize: 14, height: 1.5, color: Brand.inkSoft)),
            if (onSignInTap != null) ...[
              const SizedBox(height: 20),
              FilledButton(onPressed: onSignInTap, child: const Text('Sign in')),
            ],
          ],
        ),
      ),
    );
  }
}

class _CenterSpinner extends StatelessWidget {
  const _CenterSpinner();
  @override
  Widget build(BuildContext context) =>
      const Center(child: CircularProgressIndicator(color: Brand.forest));
}

class _ErrorState extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const _ErrorState({required this.message, required this.onRetry});
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, color: Brand.danger, size: 40),
            const SizedBox(height: 12),
            Text(message,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 15, color: Brand.inkSoft)),
            const SizedBox(height: 16),
            FilledButton(onPressed: onRetry, child: const Text('Try again')),
          ],
        ),
      ),
    );
  }
}

class _Avatar extends StatelessWidget {
  final String? url;
  final String name;
  final double size;
  const _Avatar({required this.url, required this.name, this.size = 44});

  String get _initials {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts.first.isEmpty) return '?';
    if (parts.length == 1) return parts.first[0].toUpperCase();
    return (parts.first[0] + parts.last[0]).toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
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
      child: Text(_initials,
          style: TextStyle(
              color: Colors.white,
              fontSize: size * 0.34,
              fontWeight: FontWeight.w600)),
    );
    if (url == null || url!.isEmpty) return fallback;
    return ClipOval(
      child: Image.network(
        url!,
        width: size,
        height: size,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => fallback,
        loadingBuilder: (ctx, child, prog) => prog == null ? child : fallback,
      ),
    );
  }
}
