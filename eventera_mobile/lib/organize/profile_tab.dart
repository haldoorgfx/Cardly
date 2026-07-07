import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../app_mode.dart';
import '../attendee/account/attendee_profile_screen.dart';
import '../attendee/account/notifications_screen.dart';
import '../attendee/auth/attendee_auth_screen.dart';
import '../net.dart';
import '../rbac/role_service.dart';
import '../ui/components.dart';
import '../ui/menu.dart';
import '../ui/tokens.dart';

/// Organize · Profile — the O12 mode-switch profile: identity, role chips,
/// the Attend ⇄ Organize toggle, role shortcuts, and settings.
class OrganizerProfileTab extends StatefulWidget {
  const OrganizerProfileTab({super.key});

  @override
  State<OrganizerProfileTab> createState() => _OrganizerProfileTabState();
}

class _OrganizerProfileTabState extends State<OrganizerProfileTab> {
  static const _roleService = RoleService();
  static const _storage = FlutterSecureStorage();
  static const _kNotifKey = 'eventera_notifications_enabled';

  UserRoles? _roles;
  bool _notifOn = true;
  String? _fullName;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final results = await Future.wait([
      _roleService.loadRoles(),
      _storage.read(key: _kNotifKey).catchError((_) => null),
      _loadFullName(),
    ]);
    if (!mounted) return;
    setState(() {
      _roles = results[0] as UserRoles;
      _notifOn = results[1] != 'off';
      _fullName = results[2] as String?;
    });
  }

  /// Real name from profiles.full_name — the email-derived fallback reads like
  /// a username ("Cabdalla005"), not a person.
  Future<String?> _loadFullName() async {
    try {
      final uid = currentUserId;
      if (uid == null) return null;
      final row = await supa
          .from('profiles')
          .select('full_name')
          .eq('id', uid)
          .maybeSingle();
      final name = (row?['full_name'] as String?)?.trim();
      return (name != null && name.isNotEmpty) ? name : null;
    } catch (_) {
      return null;
    }
  }

  void _push(Widget w) => Navigator.of(context)
      .push(MaterialPageRoute(builder: (_) => w))
      .then((_) {
        if (mounted) _load();
      });

  void _auth() => _push(const AttendeeAuthScreen());

  Future<void> _toggleNotifications(bool v) async {
    setState(() => _notifOn = v);
    try {
      await _storage.write(key: _kNotifKey, value: v ? 'on' : 'off');
    } catch (_) {/* best-effort */}
  }

  Future<void> _pickLanguage() async {
    await showMSheet(context, const _LanguageSheet());
  }

  Future<void> _confirmSignOut() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.card)),
        title: Text('Sign out?', style: AppText.h3),
        content: Text(
          'You can always sign back in with your email or Google.',
          style: AppText.bodySm,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: Text('Stay signed in',
                style: AppText.label.copyWith(color: AppColors.forest)),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: Text('Sign out',
                style: AppText.label.copyWith(color: AppColors.danger)),
          ),
        ],
      ),
    );
    if (ok == true) {
      await supa.auth.signOut();
      // Signed out — organizing needs an account, so land back on Attend.
      await setAppMode(AppMode.attend);
    }
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: const MAppBar(title: 'Profile', showBack: false),
      body: RefreshIndicator(
        color: AppColors.forest,
        onRefresh: _load,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 36),
          children: isSignedIn ? _signedIn() : _guest(),
        ),
      ),
    );
  }

  // ── Signed in (O12) ──────────────────────────────────────────────────────
  List<Widget> _signedIn() {
    final email = currentUserEmail ?? '';
    final name = _fullName ?? _displayName(email);
    return [
      // Identity — O12: 60px avatar · 19px bold name · muted email.
      Row(children: [
        Avatar(name: name, size: 60),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.h2.copyWith(fontSize: 19)),
              const SizedBox(height: 2),
              Text(email,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.bodySm
                      .copyWith(fontSize: 12.5, color: AppColors.inkMuted)),
            ],
          ),
        ),
      ]),
      const SizedBox(height: 14),

      // Role chips — small inline pills, not full-width bars (O12).
      Wrap(spacing: 7, runSpacing: 7, children: [
        for (final hat in _hats()) _RoleChip(hat, muted: hat == 'Attendee'),
      ]),
      const SizedBox(height: 24),

      // Mode switch
      const GroupLabel('Mode'),
      SegControl(
        segments: const ['Attend', 'Organize'],
        index: 1,
        onChanged: (i) {
          if (i == 0) setAppMode(AppMode.attend);
        },
      ),
      const SizedBox(height: 10),
      Text(
        "You're organizing. Switch to Attend to browse and join events "
        'as a guest.',
        style: AppText.bodySm.copyWith(color: AppColors.inkMuted),
      ),

      // O12 goes straight from Mode to Settings — per-event role tools
      // (Speaker tools, Booth tools, Manage check-in) live on the event page.
      const SizedBox(height: 24),
      const GroupLabel('Settings'),
      MenuGroup(children: [
        MenuRow(
          icon: Icons.settings_outlined,
          tone: ITone.forest,
          title: 'Account settings',
          onTap: () => _push(AttendeeProfileScreen(onSignInTap: _auth)),
        ),
        MenuRow(
          icon: Icons.notifications_none,
          tone: ITone.info,
          title: 'Notifications',
          chevron: false,
          trailing: MToggle(value: _notifOn, onChanged: _toggleNotifications),
          onTap: () => _push(NotificationsScreen(onSignInTap: _auth)),
        ),
        MenuRow(
          icon: Icons.language,
          tone: ITone.muted,
          title: 'Language',
          trailing: Text('English',
              style: AppText.bodySm.copyWith(color: AppColors.inkMuted)),
          onTap: _pickLanguage,
        ),
      ]),
      const SizedBox(height: 26),

      Center(
        child: GestureDetector(
          onTap: _confirmSignOut,
          behavior: HitTestBehavior.opaque,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            child: Text('Sign out',
                style: AppText.bodyStrong.copyWith(color: AppColors.danger)),
          ),
        ),
      ),
      const SizedBox(height: 12),
      Center(
        child: Text('Eventera · v1.0.0',
            style: AppText.caption.copyWith(color: AppColors.inkMuted)),
      ),
    ];
  }

  List<String> _hats() {
    final out = <String>[];
    final r = _roles;
    if (r != null) {
      if (r.hasOrganizing) out.add('Organizer');
      if (r.hasSpeaking) out.add('Speaker');
      if (r.hasSponsoring) out.add('Sponsor');
      if (r.isAdmin) out.add('Admin');
    }
    // Organizer is implied on this side of the app even before the first
    // role row lands; Attendee is always true.
    if (!out.contains('Organizer')) out.insert(0, 'Organizer');
    out.add('Attendee');
    return out;
  }

  // ── Guest fallback (shouldn't normally happen in Organize mode) ─────────
  List<Widget> _guest() {
    return [
      const SizedBox(height: 40),
      EmptyState(
        icon: Icons.person_outline,
        title: 'Sign in to organize',
        message: 'Your events, attendees and stats live behind your account.',
        ctaLabel: 'Sign in',
        onCta: _auth,
      ),
      const SizedBox(height: 20),
      Center(
        child: MButton(
          'Back to attending',
          kind: MBtnKind.text,
          fullWidth: false,
          onTap: () => setAppMode(AppMode.attend),
        ),
      ),
    ];
  }

  static String _displayName(String email) {
    final at = email.indexOf('@');
    if (at <= 0) return 'Your account';
    final local =
        email.substring(0, at).replaceAll(RegExp(r'[._]+'), ' ').trim();
    if (local.isEmpty) return 'Your account';
    return local
        .split(' ')
        .where((w) => w.isNotEmpty)
        .map((w) => w[0].toUpperCase() + w.substring(1))
        .join(' ');
  }
}

/// Small inline role pill (O12 `.tag`): forest-soft for active roles, quiet
/// cream for the always-true Attendee hat.
class _RoleChip extends StatelessWidget {
  final String label;
  final bool muted;
  const _RoleChip(this.label, {this.muted = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 24,
      padding: const EdgeInsets.symmetric(horizontal: 10),
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: muted ? AppColors.creamSoft : AppColors.forestSoft,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(label,
          style: AppText.caption.copyWith(
            color: muted ? AppColors.inkSoft : AppColors.forest,
            fontWeight: FontWeight.w600,
            fontSize: 11.5,
          )),
    );
  }
}

class _LanguageSheet extends StatelessWidget {
  const _LanguageSheet();

  @override
  Widget build(BuildContext context) {
    Widget row(String name, {bool selected = false, bool soon = false}) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Row(children: [
          Expanded(
            child: Text(name,
                style: AppText.body.copyWith(
                  color: soon ? AppColors.inkMuted : AppColors.ink,
                  fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
                )),
          ),
          if (selected)
            const Icon(Icons.check_circle, size: 20, color: AppColors.forest),
          if (soon)
            Text('Coming soon',
                style: AppText.caption.copyWith(color: AppColors.inkMuted)),
        ]),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text('Language', style: AppText.h3),
        const SizedBox(height: 6),
        Text('Eventera is in English for now — more languages are on the way.',
            style: AppText.bodySm),
        const SizedBox(height: 8),
        row('English', selected: true),
        const Divider(height: 1, color: AppColors.border),
        row('Af-Soomaali', soon: true),
        const Divider(height: 1, color: AppColors.border),
        row('العربية', soon: true),
        const Divider(height: 1, color: AppColors.border),
        row('Français', soon: true),
      ],
    );
  }
}
