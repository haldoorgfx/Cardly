// SPO07 · Booth team — teammates with scan-access toggles (shared lead pool).
// Reads/updates `sponsor_members` (scan_access added in 059_sponsor_lead_capture.sql).
//
// DRAFT — not build-tested. The scan_access UPDATE relies on an RLS update policy for
// sponsor owners/members; if updates are blocked, wrap it in a small SECURITY DEFINER
// RPC the same way capture_lead works. Noted in the audit.

import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../ui/tokens.dart';
import '../../ui/components.dart';

class BoothTeamScreen extends StatefulWidget {
  final String sponsorId;
  const BoothTeamScreen({super.key, required this.sponsorId});

  @override
  State<BoothTeamScreen> createState() => _BoothTeamScreenState();
}

class _Member {
  final String id, email, role;
  bool scanAccess;
  _Member(this.id, this.email, this.role, this.scanAccess);
}

class _BoothTeamScreenState extends State<BoothTeamScreen> {
  late Future<List<_Member>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<_Member>> _load() async {
    final rows = await Supabase.instance.client
        .from('sponsor_members')
        .select('id, invited_email, role, scan_access')
        .eq('sponsor_id', widget.sponsorId)
        .order('created_at');
    return (rows as List).map((r) {
      final m = Map<String, dynamic>.from(r as Map);
      return _Member(
        (m['id'] ?? '').toString(),
        (m['invited_email'] ?? '').toString(),
        (m['role'] ?? 'Team member').toString(),
        m['scan_access'] != false,
      );
    }).toList();
  }

  Future<void> _toggle(_Member m, bool v) async {
    setState(() => m.scanAccess = v);
    try {
      await Supabase.instance.client
          .from('sponsor_members')
          .update({'scan_access': v}).eq('id', m.id);
    } catch (_) {
      if (mounted) setState(() => m.scanAccess = !v); // revert on failure
    }
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: MAppBar(title: 'Booth team'),
      body: FutureBuilder<List<_Member>>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: AppColors.forest));
          }
          final team = snap.data ?? [];
          if (team.isEmpty) {
            return const EmptyState(
              icon: Icons.group_outlined,
              title: 'No teammates yet',
              message: 'Invite booth staff from the Eventera web dashboard. They can scan leads once added.',
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: team.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (_, i) {
              final m = team[i];
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
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
                                  color: AppColors.ink, fontSize: 14, fontWeight: FontWeight.w600)),
                          Text(m.role,
                              style: const TextStyle(color: AppColors.inkMuted, fontSize: 12.5)),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text('Scan access',
                            style: TextStyle(color: AppColors.inkMuted, fontSize: 11)),
                        Switch(
                          value: m.scanAccess,
                          activeColor: AppColors.forest,
                          onChanged: (v) => _toggle(m, v),
                        ),
                      ],
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
