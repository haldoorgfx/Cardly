import 'package:flutter/material.dart';

import '../attendee/event_landing_screen.dart';
import '../net.dart';
import '../ui/components.dart';
import '../ui/tokens.dart';

/// "Speaking" — lists the events where the signed-in account holds an ACTIVE
/// `speaker` role (resolved from `user_event_roles`, passed in as [eventIds]).
///
/// For each event we load its public row (name, slug, dates) and, best-effort,
/// how many published sessions it has, then let the speaker open the full
/// attendee event page. Reads go through the anon client; published events are
/// public-readable, so this works under RLS without any special policy.
class SpeakingScreen extends StatefulWidget {
  final List<String> eventIds;
  const SpeakingScreen({super.key, required this.eventIds});

  @override
  State<SpeakingScreen> createState() => _SpeakingScreenState();
}

class _SpeakingScreenState extends State<SpeakingScreen> {
  bool _loading = true;
  List<_SpeakingEvent> _events = const [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final out = <_SpeakingEvent>[];
    try {
      final ids = widget.eventIds.where((e) => e.isNotEmpty).toList();
      if (ids.isNotEmpty) {
        // `events` reliably has id/name/slug (see eventera_api.dart). Display
        // metadata (cover, date, venue) lives on `event_pages` keyed by
        // event_id — same source Discover uses — so we embed it here.
        final rows = await supa
            .from('events')
            .select(
                'id, name, slug, status, event_pages(cover_image_url, starts_at, venue_name, city, country, is_online)')
            .inFilter('id', ids);
        for (final r in (rows as List).whereType<Map>()) {
          out.add(_SpeakingEvent.fromRow(Map<String, dynamic>.from(r)));
        }
        // Newest first by date (nulls last).
        out.sort((a, b) {
          final ad = a.startsAt, bd = b.startsAt;
          if (ad == null && bd == null) return 0;
          if (ad == null) return 1;
          if (bd == null) return -1;
          return bd.compareTo(ad);
        });
      }
    } catch (_) {
      // Fail safe — show an empty state rather than an error wall.
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
      appBar: const MAppBar(title: 'Speaking'),
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
                        icon: Icons.mic_none_outlined,
                        title: 'No speaking events yet',
                        message:
                            'Events where you are added as a speaker will appear here.',
                      ),
                    ],
                  )
                : ListView.separated(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(20, 12, 20, 36),
                    itemCount: _events.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (_, i) => _EventTile(
                      event: _events[i],
                      onTap: () => _open(_events[i]),
                    ),
                  ),
      ),
    );
  }

  void _open(_SpeakingEvent e) {
    if (e.slug.isEmpty) {
      showToast(context, 'This event page is not available yet.');
      return;
    }
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => EventLandingScreen(slug: e.slug)),
    );
  }
}

class _SpeakingEvent {
  final String id;
  final String name;
  final String slug;
  final DateTime? startsAt;
  final String location;
  final String coverUrl;
  const _SpeakingEvent({
    required this.id,
    required this.name,
    required this.slug,
    required this.startsAt,
    required this.location,
    required this.coverUrl,
  });

  factory _SpeakingEvent.fromRow(Map<String, dynamic> r) {
    // event_pages may come back as a Map (1:1) or a List; normalize to a map.
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

    return _SpeakingEvent(
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
  final _SpeakingEvent event;
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
