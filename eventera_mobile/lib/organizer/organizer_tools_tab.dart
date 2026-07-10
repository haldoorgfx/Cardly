import 'package:flutter/material.dart';

import '../net.dart';
import '../rbac/role_service.dart';
import '../rbac/speaking_screen.dart';
import '../rbac/sponsoring_screen.dart';
import '../roles/role_widgets.dart';
import '../roles/staff/cash_shift_screen.dart';
import '../roles/staff/event_control_screen.dart';
import '../roles/staff/walk_in_screen.dart';
import '../screens/organizer/offline_prepare_screen.dart';
import '../ui/components.dart';
import '../ui/tokens.dart';
import 'organizer_shell.dart';
import 'organizer_tools_widgets.dart';

/// Tools tab — the professional roles this account holds beyond organizing
/// (speaker / sponsor / staff), gated by [RoleService]. Exactly ONE forest
/// "tools" entry card (the first role held, §1.3); every other role is a white
/// row. No admin affordance, ever.
class OrganizerToolsTab extends StatefulWidget {
  const OrganizerToolsTab({super.key});

  @override
  State<OrganizerToolsTab> createState() => _OrganizerToolsTabState();
}

class _OrganizerToolsTabState extends State<OrganizerToolsTab> {
  static const _service = RoleService();
  late Future<UserRoles> _future;

  @override
  void initState() {
    super.initState();
    _future = _service.loadRoles();
  }

  void _reload() => setState(() => _future = _service.loadRoles());

  Future<void> _refresh() async {
    _reload();
    await _future;
  }

  void _openSpeaking(UserRoles r) => Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => SpeakingScreen(eventIds: r.eventsWithRole('speaker'))));

  void _openSponsoring(UserRoles r) => Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => SponsoringScreen(eventIds: r.eventsWithRole('sponsor'))));

  /// Staff has no rbac wrapper: resolve the event names, then open on-site
  /// control directly (one event) or after a small picker (several).
  /// Offline check-in prep (O02) — pick an event, then download its data.
  Future<void> _openOfflinePrepare() async {
    final event =
        await showOrganizerEventPicker(context, title: 'Prepare offline for');
    if (event == null || !mounted) return;
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) =>
          OfflinePrepareScreen(eventId: event.id, eventName: event.name),
    ));
  }

  /// C01 — cash walk-in registration. Pick an event (owner-or-staff enforced
  /// server-side on the shift + check-in RPCs), then take money at the door.
  Future<void> _openWalkIn() async {
    final event =
        await showOrganizerEventPicker(context, title: 'Cash walk-in for');
    if (event == null || !mounted) return;
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => WalkInScreen(eventId: event.id, eventName: event.name),
    ));
  }

  /// C02 — end-of-shift reconciliation for the caller's own cash drawer.
  Future<void> _openCashShift() async {
    final event =
        await showOrganizerEventPicker(context, title: 'Cash drawer for');
    if (event == null || !mounted) return;
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => CashShiftScreen(eventId: event.id, eventName: event.name),
    ));
  }

  Future<void> _openStaff(UserRoles r) async {
    final ids = r.eventsWithRole('staff').where((e) => e.isNotEmpty).toList();
    if (ids.isEmpty) return;
    var events = <StaffPick>[];
    try {
      final rows = await supa.from('events').select('id, name').inFilter('id', ids);
      events = [
        for (final row in (rows as List).whereType<Map>())
          StaffPick(asString(row['id']), asString(row['name'], 'Event')),
      ];
    } catch (_) {
      events = [for (final id in ids) StaffPick(id, 'Event')];
    }
    if (events.isEmpty) events = [for (final id in ids) StaffPick(id, 'Event')];
    if (!mounted) return;

    StaffPick? chosen = events.length == 1 ? events.first : null;
    chosen ??=
        await showMSheet<StaffPick>(context, StaffPickerBody(events: events));
    final pick = chosen;
    if (pick == null || !mounted) return;
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => EventControlScreen(
          eventId: pick.id, eventName: pick.name, isOwner: false),
    ));
  }

  List<_ToolEntry> _entries(UserRoles r) {
    final out = <_ToolEntry>[];
    if (r.hasSpeaking) {
      out.add(_ToolEntry(
        icon: Icons.mic_none_outlined,
        title: 'Speaking',
        summary: 'Sessions, green room, live Q&A',
        onTap: () => _openSpeaking(r),
      ));
    }
    if (r.hasSponsoring) {
      out.add(_ToolEntry(
        icon: Icons.workspace_premium_outlined,
        title: 'Sponsoring',
        summary: 'Lead scanner, my leads, booth',
        onTap: () => _openSponsoring(r),
      ));
    }
    if (r.hasStaff) {
      out.add(_ToolEntry(
        icon: Icons.badge_outlined,
        title: 'Staff access',
        summary: 'On-site check-in and attendee list',
        onTap: () => _openStaff(r),
      ));
    }
    return out;
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const OrgHeaderBand(title: 'Tools'),
        Expanded(
          child: FutureBuilder<UserRoles>(
            future: _future,
            builder: (context, snap) {
              if (snap.connectionState == ConnectionState.waiting) {
                return const ToolsSkeleton();
              }
              final roles = snap.data ?? const UserRoles.empty();
              final entries = _entries(roles);
              // Offline check-in is always available (no role required). When
              // there are role tools, the first is the one forest card (§1.3)
              // and offline is a white row; otherwise everything is a white row.
              return RefreshIndicator(
                color: AppColors.forest,
                onRefresh: _refresh,
                child: ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(20, 18, 20, 100),
                  children: [
                    if (entries.isNotEmpty) ...[
                      // The one forest tools entry card (§1.3).
                      ToolCard(
                        icon: entries.first.icon,
                        title: entries.first.title,
                        summary: entries.first.summary,
                        onTap: entries.first.onTap,
                      ),
                      for (final e in entries.skip(1)) ...[
                        const SizedBox(height: 10),
                        ToolRow(
                          icon: e.icon,
                          title: e.title,
                          summary: e.summary,
                          onTap: e.onTap,
                        ),
                      ],
                      const SizedBox(height: 10),
                    ],
                    ToolRow(
                      icon: Icons.point_of_sale_outlined,
                      title: 'Cash walk-in',
                      summary: 'Register and take payment at the door',
                      onTap: _openWalkIn,
                    ),
                    const SizedBox(height: 10),
                    ToolRow(
                      icon: Icons.account_balance_wallet_outlined,
                      title: 'Cash drawer',
                      summary: 'Count and hand over your shift',
                      onTap: _openCashShift,
                    ),
                    const SizedBox(height: 10),
                    ToolRow(
                      icon: Icons.cloud_download_outlined,
                      title: 'Offline check-in',
                      summary: 'Download event data for no-signal scanning',
                      onTap: _openOfflinePrepare,
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _ToolEntry {
  final IconData icon;
  final String title;
  final String summary;
  final VoidCallback onTap;
  _ToolEntry(
      {required this.icon,
      required this.title,
      required this.summary,
      required this.onTap});
}
