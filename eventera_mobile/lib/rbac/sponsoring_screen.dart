import 'package:flutter/material.dart';

import '../attendee/event_landing_screen.dart';
import '../net.dart';
import '../ui/components.dart';
import '../ui/tokens.dart';

/// "Sponsoring" — lists the events where the signed-in account holds an ACTIVE
/// `sponsor` role (resolved from `user_event_roles`, passed in as [eventIds]).
///
/// The unified plan wants the lead scanner surfaced first, but the mobile app
/// has no lead-scanner / exhibitor screen yet — those exhibitor tools
/// (leads, booth editing, resources, team) live on the web at
/// `app/exhibitor/[token]/*`. So here we list the sponsor's events, let them
/// open the public event page, and point them to the web for lead tools. When
/// a mobile scanner ships, deep-link it from the tile's primary action.
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
        // Same source as Discover: `events` for id/name/slug, embedded
        // `event_pages` for display metadata (cover, date, venue).
        final rows = await supa
            .from('events')
            .select(
                'id, name, slug, status, event_pages(cover_image_url, starts_at, venue_name, city, country, is_online)')
            .inFilter('id', ids);
        for (final r in (rows as List).whereType<Map>()) {
          out.add(_SponsorEvent.fromRow(Map<String, dynamic>.from(r)));
        }
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
                    children: const [
                      SizedBox(height: 120),
                      EmptyState(
                        icon: Icons.work_outline,
                        title: 'No sponsored events yet',
                        message:
                            'Events where you are added as a sponsor will appear here.',
                      ),
                    ],
                  )
                : ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(20, 12, 20, 36),
                    children: [
                      for (final e in _events) ...[
                        _EventTile(event: e, onTap: () => _open(e)),
                        const SizedBox(height: 12),
                      ],
                      const _LeadToolsNote(),
                    ],
                  ),
      ),
    );
  }

  void _open(_SponsorEvent e) {
    if (e.slug.isEmpty) {
      showToast(context, 'This event page is not available yet.');
      return;
    }
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => EventLandingScreen(slug: e.slug)),
    );
  }
}

class _SponsorEvent {
  final String id;
  final String name;
  final String slug;
  final DateTime? startsAt;
  final String location;
  final String coverUrl;
  const _SponsorEvent({
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

class _EventTile extends StatelessWidget {
  final _SponsorEvent event;
  final VoidCallback onTap;
  const _EventTile({required this.event, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final sub = [
      if (event.startsAt != null) _fmtDate(event.startsAt!),
      if (event.location.isNotEmpty) event.location,
    ].join(' · ');
    return MCard(
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
          const Icon(Icons.chevron_right, size: 18, color: AppColors.inkMuted),
        ],
      ),
    );
  }

  static String _fmtDate(DateTime d) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return '${months[d.month - 1]} ${d.day}, ${d.year}';
  }
}

/// Quiet note pointing sponsors to the web for lead scanning / booth tools,
/// which don't have a mobile surface yet.
class _LeadToolsNote extends StatelessWidget {
  const _LeadToolsNote();
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.forestSoft,
        borderRadius: BorderRadius.circular(AppRadius.card),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.qr_code_scanner_outlined,
              size: 20, color: AppColors.forest),
          const SizedBox(width: 11),
          Expanded(
            child: Text(
              'Lead scanning, booth editing and exhibitor resources are on the '
              'web dashboard for now.',
              style: AppText.bodySm.copyWith(color: AppColors.forest),
            ),
          ),
        ],
      ),
    );
  }
}
