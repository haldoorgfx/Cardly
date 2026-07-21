import 'package:flutter/material.dart';

import '../attendee/app_shell.dart';
import '../attendee/event_landing_screen.dart';
import '../net.dart';
import '../roles/role_widgets.dart';
import '../roles/sponsor/sponsor_tools_screen.dart';
import '../ui/components.dart';
import '../ui/tokens.dart';

/// "Sponsoring" — the events where the signed-in account holds an ACTIVE
/// `sponsor` role (resolved from `user_event_roles`, passed in as [eventIds]).
///
/// For each event we resolve the account's sponsor row(s) — matched by the
/// signed-in email against `sponsors.contact_email` (migration 023, the same
/// link the 055 backfill uses) — and show a booth summary: company, tier and
/// booth location/hours. We also try to read the sponsor's own lead count; the
/// `sponsor_leads` RLS grants read to the EVENT OWNER only (migration 023), so
/// on the anon/sponsor path that read returns nothing — the count is simply
/// omitted rather than shown as a misleading zero.
///
/// Every booth exposes a "Booth tools" entry that opens [SponsorToolsScreen]
/// (lead scanner, my leads, booth team, booth & products, meetings, directory
/// preview) — the same self-contained tools the event hub uses. Those screens
/// resolve their own sponsor id from the account, so we only pass eventId +
/// eventName.
///
/// Sponsor rows are public-readable (`is_visible = true`), event/`event_pages`
/// are public too, so this works under RLS with no special policy. Everything
/// fails SAFE: any query error yields the plain event list, never an error wall.
class SponsoringScreen extends StatefulWidget {
  final List<String> eventIds;
  const SponsoringScreen({super.key, required this.eventIds});

  @override
  State<SponsoringScreen> createState() => _SponsoringScreenState();
}

class _SponsoringScreenState extends State<SponsoringScreen> {
  bool _loading = true;
  List<_SponsorEvent> _events = const [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final out = <_SponsorEvent>[];
    try {
      final ids = widget.eventIds.where((e) => e.isNotEmpty).toList();
      if (ids.isNotEmpty) {
        // 1) Event display metadata — same source as Discover.
        final eventRows = await supa
            .from('events')
            .select(
                'id, name, slug, status, event_pages(cover_image_url, starts_at, venue_name, city, country, is_online)')
            .inFilter('id', ids);
        final byId = <String, _SponsorEvent>{};
        for (final r in (eventRows as List).whereType<Map>()) {
          final ev = _SponsorEvent.fromRow(Map<String, dynamic>.from(r));
          // Skip events with no public slug — their event page can't be opened,
          // so we never render a dead-end tile for them.
          if (ev.slug.isEmpty) continue;
          byId[ev.id] = ev;
        }

        // 2) The account's sponsor rows in those events, by contact_email.
        await _attachBooths(byId, ids);

        out.addAll(byId.values);
        out.sort((a, b) {
          final ad = a.startsAt, bd = b.startsAt;
          if (ad == null && bd == null) return 0;
          if (ad == null) return 1;
          if (bd == null) return -1;
          return bd.compareTo(ad);
        });
      }
    } catch (_) {
      // Fail safe.
    }
    if (!mounted) return;
    setState(() {
      _events = out;
      _loading = false;
    });
  }

  /// Populates each event's `booth` with the account's sponsor row and, if RLS
  /// permits, a lead count.
  Future<void> _attachBooths(
      Map<String, _SponsorEvent> byId, List<String> ids) async {
    final email = (currentUserEmail ?? '').trim().toLowerCase();
    try {
      var q = supa
          .from('sponsors')
          .select(
              'id, event_id, company_name, tier, booth_location, booth_hours, contact_email')
          .inFilter('event_id', ids);
      if (email.isNotEmpty) {
        q = q.eq('contact_email', email);
      }
      final rows = await q;

      final sponsorIds = <String>[];
      for (final s in (rows as List).whereType<Map>()) {
        final map = Map<String, dynamic>.from(s);
        final eid = asString(map['event_id']);
        final ev = byId[eid];
        if (ev == null) continue;
        // Take the first matching sponsor row per event as the booth.
        ev.booth ??= _Booth.fromRow(map);
        final sid = asString(map['id']);
        if (sid.isNotEmpty) sponsorIds.add(sid);
      }

      // 3) Best-effort lead count. Under migration-023 RLS only the event owner
      //    can read sponsor_leads, so on the sponsor path this quietly returns
      //    nothing — we then show the "manage on web" note. If a future policy
      //    lets sponsors read their own leads, the count shows automatically.
      if (sponsorIds.isNotEmpty) {
        try {
          final leadRows = await supa
              .from('sponsor_leads')
              .select('id, sponsor_id')
              .inFilter('sponsor_id', sponsorIds);
          final counts = <String, int>{};
          for (final l in (leadRows as List).whereType<Map>()) {
            final sid = asString(l['sponsor_id']);
            if (sid.isEmpty) continue;
            counts[sid] = (counts[sid] ?? 0) + 1;
          }
          if (counts.isNotEmpty) {
            for (final ev in byId.values) {
              final b = ev.booth;
              if (b != null && counts.containsKey(b.sponsorId)) {
                ev.booth = b.withLeads(counts[b.sponsorId]!);
              }
            }
          }
        } catch (_) {
          // Leads not readable on this path — leave leadCount null.
        }
      }
    } catch (_) {
      // Non-fatal — events still render, just without booth details.
    }
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: const MAppBar(title: 'Sponsoring'),
      body: RefreshIndicator(
        color: AppColors.forest,
        onRefresh: _load,
        child: _loading
            ? const LoadingState()
            : _events.isEmpty
                ? ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    children: [
                      const SizedBox(height: 120),
                      EmptyState(
                        icon: Icons.work_outline,
                        title: 'No sponsored events yet',
                        message:
                            'Organizers add your booth from their own dashboard '
                            '— the event then shows up here with your lead '
                            'scanner and booth tools.',
                        ctaLabel: 'Browse events',
                        onCta: _browseEvents,
                      ),
                    ],
                  )
                : ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(20, 12, 20, 36),
                    children: [
                      for (final e in _events) ...[
                        _EventBlock(
                          event: e,
                          onTap: () => _open(e),
                          onOpenTools: () => _openTools(e),
                        ),
                        const SizedBox(height: 16),
                      ],
                    ],
                  ),
      ),
    );
  }

  /// Nothing here can create a sponsorship, so the empty state hands the user
  /// back to Discover rather than leaving only a back button.
  void _browseEvents() {
    Navigator.of(context).popUntil((r) => r.isFirst);
    mainTab.value = 0;
  }

  void _open(_SponsorEvent e) {
    // Events without a slug are pre-filtered out in _load, so every tile that
    // renders here has an openable event page.
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => EventLandingScreen(slug: e.slug)),
    );
  }

  /// Opens the full sponsor tool set for this event. [SponsorToolsScreen]
  /// resolves the account's sponsor booth itself, so we only pass the event
  /// id + name. Wrapped so a navigation failure never crashes the tab.
  void _openTools(_SponsorEvent e) {
    try {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) =>
              SponsorToolsScreen(eventId: e.id, eventName: e.name),
        ),
      );
    } catch (_) {
      showToast(context, 'Could not open sponsor tools.');
    }
  }
}

class _SponsorEvent {
  final String id;
  final String name;
  final String slug;
  final DateTime? startsAt;
  final String location;
  final String coverUrl;
  _Booth? booth;
  _SponsorEvent({
    required this.id,
    required this.name,
    required this.slug,
    required this.startsAt,
    required this.location,
    required this.coverUrl,
  });

  factory _SponsorEvent.fromRow(Map<String, dynamic> r) {
    final pagesRaw = r['event_pages'];
    Map<String, dynamic> page = const {};
    if (pagesRaw is Map) {
      page = Map<String, dynamic>.from(pagesRaw);
    } else if (pagesRaw is List && pagesRaw.isNotEmpty && pagesRaw.first is Map) {
      page = Map<String, dynamic>.from(pagesRaw.first as Map);
    }
    String location() {
      if (asBool(page['is_online'])) return 'Online';
      final venue = asString(page['venue_name']).trim();
      if (venue.isNotEmpty) return venue;
      return [asString(page['city']).trim(), asString(page['country']).trim()]
          .where((e) => e.isNotEmpty)
          .join(', ');
    }

    return _SponsorEvent(
      id: asString(r['id']),
      name: asString(r['name'], 'Event'),
      slug: asString(r['slug']),
      startsAt: asDate(page['starts_at']),
      location: location(),
      coverUrl: asString(page['cover_image_url']).trim(),
    );
  }
}

class _Booth {
  final String sponsorId;
  final String company;
  final String tier;
  final String boothLocation;
  final String boothHours;
  final int? leadCount; // null = not readable on this path
  const _Booth({
    required this.sponsorId,
    required this.company,
    required this.tier,
    required this.boothLocation,
    required this.boothHours,
    this.leadCount,
  });

  factory _Booth.fromRow(Map<String, dynamic> s) => _Booth(
        sponsorId: asString(s['id']),
        company: asString(s['company_name']).trim(),
        tier: asString(s['tier']).trim(),
        boothLocation: asString(s['booth_location']).trim(),
        boothHours: asString(s['booth_hours']).trim(),
      );

  _Booth withLeads(int count) => _Booth(
        sponsorId: sponsorId,
        company: company,
        tier: tier,
        boothLocation: boothLocation,
        boothHours: boothHours,
        leadCount: count,
      );
}

/// One event: header tile + a booth summary card (or nothing if no matching
/// sponsor row was found).
class _EventBlock extends StatelessWidget {
  final _SponsorEvent event;
  final VoidCallback onTap;
  final VoidCallback onOpenTools;
  const _EventBlock({
    required this.event,
    required this.onTap,
    required this.onOpenTools,
  });

  @override
  Widget build(BuildContext context) {
    final sub = [
      if (event.startsAt != null) _fmtDate(event.startsAt!),
      if (event.location.isNotEmpty) event.location,
    ].join(' · ');
    final b = event.booth;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        MCard(
          onTap: onTap,
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(11),
                child: SizedBox(
                  width: 52,
                  height: 52,
                  child: event.coverUrl.isNotEmpty
                      ? Image.network(
                          event.coverUrl,
                          fit: BoxFit.cover,
                          loadingBuilder: (ctx, child, progress) =>
                              progress == null
                                  ? child
                                  : PhotoPlaceholder(
                                      hue: hueFromString(event.id)),
                          errorBuilder: (_, __, ___) =>
                              PhotoPlaceholder(hue: hueFromString(event.id)),
                        )
                      : PhotoPlaceholder(hue: hueFromString(event.id)),
                ),
              ),
              const SizedBox(width: 13),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(event.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppText.h3.copyWith(fontSize: 15.5)),
                    if (sub.isNotEmpty) ...[
                      const SizedBox(height: 3),
                      Text(sub,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppText.bodySm),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 6),
              const Icon(Icons.chevron_right,
                  size: 18, color: AppColors.inkMuted),
            ],
          ),
        ),
        if (b != null) ...[
          const SizedBox(height: 10),
          _BoothCard(booth: b),
        ],
        // Booth tools entry — opens the full sponsor toolset (lead scanner,
        // my leads, booth team, products, meetings, directory preview).
        const SizedBox(height: 10),
        ToolCard(
          icon: Icons.workspace_premium_outlined,
          title: 'Booth tools',
          summary: 'Lead scanner · my leads · team · products · meetings',
          onTap: onOpenTools,
        ),
      ],
    );
  }

  static String _fmtDate(DateTime d) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    final l = d.toLocal();
    return '${months[l.month - 1]} ${l.day}, ${l.year}';
  }
}

/// Booth summary: company + tier badge, booth location/hours, and a lead count
/// if it was readable.
class _BoothCard extends StatelessWidget {
  final _Booth booth;
  const _BoothCard({required this.booth});

  @override
  Widget build(BuildContext context) {
    final company =
        booth.company.isEmpty ? 'Your booth' : booth.company;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: AppColors.border),
        boxShadow: AppShadow.soft,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.storefront_outlined,
                  size: 18, color: AppColors.forest),
              const SizedBox(width: 8),
              Expanded(
                child: Text(company,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.h3.copyWith(fontSize: 14.5)),
              ),
              if (booth.tier.isNotEmpty) _TierBadge(tier: booth.tier),
            ],
          ),
          if (booth.boothLocation.isNotEmpty) ...[
            const SizedBox(height: 10),
            _MetaRow(icon: Icons.place_outlined, text: booth.boothLocation),
          ],
          if (booth.boothHours.isNotEmpty) ...[
            const SizedBox(height: 8),
            _MetaRow(icon: Icons.schedule, text: booth.boothHours),
          ],
          if (booth.leadCount != null) ...[
            const SizedBox(height: 8),
            _MetaRow(
              icon: Icons.people_alt_outlined,
              text: booth.leadCount == 1
                  ? '1 lead captured'
                  : '${booth.leadCount} leads captured',
            ),
          ],
        ],
      ),
    );
  }
}

class _TierBadge extends StatelessWidget {
  final String tier;
  const _TierBadge({required this.tier});
  @override
  Widget build(BuildContext context) {
    // Map sponsor tiers to a Tag look. Platinum/gold -> gold; else forest.
    final t = tier.toLowerCase();
    final kind = (t == 'platinum' || t == 'gold') ? TagKind.gold : TagKind.forest;
    final label = tier.isEmpty
        ? ''
        : tier[0].toUpperCase() + tier.substring(1).toLowerCase();
    return Tag(label, kind: kind);
  }
}

class _MetaRow extends StatelessWidget {
  final IconData icon;
  final String text;
  const _MetaRow({required this.icon, required this.text});
  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 15, color: AppColors.inkMuted),
        const SizedBox(width: 8),
        Expanded(
          child: Text(text,
              style: AppText.bodySm.copyWith(color: AppColors.inkSoft)),
        ),
      ],
    );
  }
}
