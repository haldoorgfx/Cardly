// SPO07 · Booth team — teammates with per-person scan-access toggles (shared
// lead pool), plus invite + remove. Reads/writes `sponsor_members`
// (scan_access added in 059_sponsor_lead_capture.sql). Manage actions run under
// the event-owner RLS policy from 072_rls_lockdown.sql; when a write is blocked
// the optimistic change rolls back and a toast explains why.

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../ui/tokens.dart';
import '../../ui/components.dart';
import 'sponsor_api.dart';

class BoothTeamScreen extends StatefulWidget {
  final String sponsorId;
  const BoothTeamScreen({super.key, required this.sponsorId});

  @override
  State<BoothTeamScreen> createState() => _BoothTeamScreenState();
}

class _Member {
  final String id, email, role, status;
  bool scanAccess;
  _Member(this.id, this.email, this.role, this.status, this.scanAccess);
}

class _BoothTeamScreenState extends State<BoothTeamScreen> {
  late Future<List<_Member>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<_Member>> _load() async {
    final rows = await SponsorApi.fetchTeam(widget.sponsorId);
    return rows.map((m) {
      return _Member(
        (m['id'] ?? '').toString(),
        (m['invited_email'] ?? '').toString(),
        (m['role'] ?? 'Team member').toString(),
        (m['status'] ?? 'invited').toString(),
        m['scan_access'] != false,
      );
    }).toList();
  }

  void _reload() => setState(() => _future = _load());

  Future<void> _toggle(_Member m, bool v) async {
    HapticFeedback.selectionClick();
    setState(() => m.scanAccess = v);
    try {
      await SponsorApi.setScanAccess(m.id, v);
    } catch (e) {
      if (!mounted) return;
      setState(() => m.scanAccess = !v); // revert on failure
      final msg = describeError(e, context: 'that change');
      showToast(
          context,
          msg.toLowerCase().contains('permission')
              ? "Only the event organizer can change the team."
              : msg);
    }
  }

  Future<void> _invite() async {
    final email = TextEditingController();
    final role = TextEditingController();
    final ok = await showMSheet<bool>(
      context,
      StatefulBuilder(builder: (ctx, setSheet) {
        return Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Invite teammate',
                style: TextStyle(
                    color: AppColors.ink, fontSize: 17, fontWeight: FontWeight.w700)),
            const SizedBox(height: 4),
            const Text('They can scan leads at your booth once they sign in.',
                style: TextStyle(color: AppColors.inkSoft, fontSize: 13)),
            const SizedBox(height: 16),
            MInput(
                label: 'Email',
                hint: 'name@company.com',
                controller: email,
                icon: Icons.mail_outline,
                keyboardType: TextInputType.emailAddress),
            const SizedBox(height: 12),
            MInput(
                label: 'Role (optional)',
                hint: 'e.g. Booth staff',
                controller: role,
                icon: Icons.badge_outlined),
            const SizedBox(height: 18),
            MButton('Send invite', icon: Icons.send_outlined,
                onTap: () => Navigator.pop(ctx, true)),
          ],
        );
      }),
    );
    if (ok != true) return;
    final e = email.text.trim();
    if (e.isEmpty || !e.contains('@')) {
      if (mounted) showToast(context, 'Enter a valid email to invite.');
      return;
    }
    try {
      await SponsorApi.inviteMember(widget.sponsorId, e, role.text.trim());
      if (!mounted) return;
      _reload();
      showToast(context, 'Invite added for $e.');
    } catch (error) {
      if (!mounted) return;
      final msg = describeError(error, context: 'that teammate');
      showToast(
          context,
          msg.toLowerCase().contains('permission')
              ? "Only the event organizer can manage the team."
              : msg);
    }
  }

  Future<void> _remove(_Member m) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Remove teammate?'),
        content: Text(
            'Remove ${m.email} from your booth team? They will lose scan access.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancel',
                  style: TextStyle(color: AppColors.inkSoft))),
          TextButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Remove',
                  style: TextStyle(
                      color: AppColors.danger, fontWeight: FontWeight.w700))),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await SponsorApi.removeMember(m.id);
      if (!mounted) return;
      _reload();
      showToast(context, 'Removed ${m.email}.');
    } catch (e) {
      if (!mounted) return;
      final msg = describeError(e, context: 'that teammate');
      showToast(
          context,
          msg.toLowerCase().contains('permission')
              ? "Only the event organizer can manage the team."
              : msg);
    }
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: MAppBar(title: 'Booth team'),
      bottomBar: Padding(
        padding: const EdgeInsets.all(16),
        child: MButton('Invite teammate', icon: Icons.person_add_alt,
            onTap: _invite),
      ),
      body: FutureBuilder<List<_Member>>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const LoadingState();
          }
          if (snap.hasError) {
            final msg = describeError(snap.error, context: 'your booth team');
            return ErrorStateView(
              message: msg,
              onRetry: _reload,
              reason: msg.toLowerCase().contains("couldn't reach the server")
                  ? StatusReason.network
                  : msg.toLowerCase().contains('permission')
                      ? StatusReason.permission
                      : StatusReason.generic,
            );
          }
          final team = snap.data ?? [];
          if (team.isEmpty) {
            return const EmptyState(
              icon: Icons.group_outlined,
              title: 'No teammates yet',
              message:
                  'Invite booth staff so they can scan leads at your booth.',
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: team.length,
            separatorBuilder: (_, _) => const SizedBox(height: 8),
            itemBuilder: (_, i) {
              final m = team[i];
              return Container(
                padding: const EdgeInsets.fromLTRB(14, 10, 6, 10),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(m.email,
                              style: const TextStyle(
                                  color: AppColors.ink,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600)),
                          const SizedBox(height: 2),
                          Row(children: [
                            Text(m.role,
                                style: const TextStyle(
                                    color: AppColors.inkSoft, fontSize: 12.5)),
                            if (m.status == 'invited') ...[
                              const SizedBox(width: 6),
                              const Tag('Invited', kind: TagKind.warning),
                            ],
                          ]),
                        ],
                      ),
                    ),
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        const Text('Scan',
                            style: TextStyle(
                                color: AppColors.inkSoft, fontSize: 11)),
                        const SizedBox(height: 2),
                        MToggle(
                          value: m.scanAccess,
                          onChanged: (v) => _toggle(m, v),
                        ),
                      ],
                    ),
                    IconButton(
                      onPressed: () => _remove(m),
                      icon: const Icon(Icons.more_vert,
                          size: 20, color: AppColors.inkMuted),
                      tooltip: 'Remove',
                      constraints:
                          const BoxConstraints(minWidth: 44, minHeight: 44),
                    ),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}
