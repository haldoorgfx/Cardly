import 'package:flutter/material.dart';

import '../../net.dart';
import '../../ui/components.dart';
import '../../ui/tokens.dart';
import '../event_landing_screen.dart';
import '../hub/event_page_model.dart';

/// Browse public, published events — mirrors app/(public)/events/page.tsx.
///
/// Query: `event_pages` where `is_public = true`, upcoming (ends_at >= now OR
/// null), ordered by `starts_at`. Tapping a card opens EventHubScreen(slug).
class DiscoverScreen extends StatefulWidget {
  const DiscoverScreen({super.key});

  @override
  State<DiscoverScreen> createState() => _DiscoverScreenState();
}

class _DiscoverScreenState extends State<DiscoverScreen> {
  bool _loading = true;
  String? _error;
  final List<_DiscoverEvent> _events = [];

  final _searchCtl = TextEditingController();
  String _query = '';
  String _category = 'All'; // client-side category filter

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _searchCtl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final now = DateTime.now().toUtc().toIso8601String();
      final rows = await supa
          .from('event_pages')
          .select(
              'id, event_id, title, tagline, cover_image_url, starts_at, ends_at, timezone, is_online, venue_name, city, country, category, organizer_name, custom_slug, events!inner(slug, status)')
          .eq('is_public', true)
          .or('ends_at.gte.$now,ends_at.is.null')
          .order('starts_at', ascending: true)
          .limit(48);

      _events.clear();
      if (rows is List) {
        for (final r in rows) {
          if (r is Map) {
            _events.add(_DiscoverEvent.fromRow(Map<String, dynamic>.from(r)));
          }
        }
      }
      if (!mounted) return;
      setState(() => _loading = false);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.message;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Something went wrong loading events.';
      });
    }
  }

  // ── derived ────────────────────────────────────────────────────────

  /// Distinct categories from the loaded events (for the chip row).
  List<String> get _categories {
    final set = <String>{};
    for (final e in _events) {
      if (e.category.isNotEmpty) set.add(e.category);
    }
    final list = set.toList()..sort();
    return ['All', ...list];
  }

  List<_DiscoverEvent> get _filtered {
    final q = _query.trim().toLowerCase();
    return _events.where((e) {
      if (_category != 'All' &&
          e.category.toLowerCase() != _category.toLowerCase()) {
        return false;
      }
      if (q.isEmpty) return true;
      return e.title.toLowerCase().contains(q) ||
          e.city.toLowerCase().contains(q) ||
          e.country.toLowerCase().contains(q) ||
          e.venueName.toLowerCase().contains(q) ||
          e.category.toLowerCase().contains(q);
    }).toList();
  }

  /// The location label for the city selector (most common city, if any).
  String get _cityLabel {
    final counts = <String, int>{};
    for (final e in _events) {
      if (e.city.isNotEmpty) counts[e.city] = (counts[e.city] ?? 0) + 1;
    }
    if (counts.isEmpty) return 'Everywhere';
    return counts.entries.reduce((a, b) => a.value >= b.value ? a : b).key;
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: MAppBar(
        showBack: false,
        leading: const Padding(
          padding: EdgeInsets.only(left: 12),
          child: Center(child: _Wordmark()),
        ),
        actions: [
          AppBarAction(Icons.search, onTap: _focusSearch),
          const SizedBox(width: 2),
          const Padding(
            padding: EdgeInsets.only(right: 6),
            child: Avatar(name: 'You', size: 32),
          ),
        ],
      ),
      body: _loading
          ? _loadingBody()
          : _error != null
              ? ErrorStateView(message: _error!, onRetry: _load)
              : RefreshIndicator(
                  color: AppColors.forest,
                  onRefresh: _load,
                  child: _feed(),
                ),
    );
  }

  void _focusSearch() {
    // no-op focus hook; search field is inline below the header
    setState(() {});
  }

  Widget _loadingBody() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
      children: [
        Skeleton(height: 108, radius: AppRadius.card),
        const SizedBox(height: 22),
        Row(children: [
          Skeleton(width: 54, height: 34, radius: 999),
          const SizedBox(width: 8),
          Skeleton(width: 70, height: 34, radius: 999),
          const SizedBox(width: 8),
          Skeleton(width: 60, height: 34, radius: 999),
        ]),
        const SizedBox(height: 18),
        Skeleton(height: 150, radius: AppRadius.card),
        const SizedBox(height: 14),
        Skeleton(height: 94, radius: AppRadius.card),
        const SizedBox(height: 12),
        Skeleton(height: 94, radius: AppRadius.card),
      ],
    );
  }

  Widget _feed() {
    final filtered = _filtered;
    final featured = filtered.isNotEmpty ? filtered.first : null;
    final rest = filtered.length > 1 ? filtered.sublist(1) : <_DiscoverEvent>[];

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 6, 20, 24),
      children: [
        const _CodeCard(),
        const SizedBox(height: 22),

        // Search field (folds screens 4/5 search into the tab root)
        MInput(
          controller: _searchCtl,
          icon: Icons.search,
          hint: 'Search events, cities, organizers',
          onChanged: (v) => setState(() => _query = v),
        ),
        const SizedBox(height: 18),

        // Discover heading + city selector
        Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Expanded(child: Text('Discover', style: AppText.h2)),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(_cityLabel,
                    style: AppText.label.copyWith(color: AppColors.forest)),
                const Icon(Icons.keyboard_arrow_down,
                    size: 18, color: AppColors.forest),
              ],
            ),
          ],
        ),
        const SizedBox(height: 12),

        // Category chips
        SizedBox(
          height: 34,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: _categories.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (_, i) {
              final c = _categories[i];
              return MChip(c,
                  selected: c == _category,
                  onTap: () => setState(() => _category = c));
            },
          ),
        ),
        const SizedBox(height: 18),

        if (filtered.isEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 40),
            child: EmptyState(
              icon: Icons.search,
              title: (_query.isNotEmpty || _category != 'All')
                  ? 'No events found'
                  : 'No events yet',
              message: (_query.isNotEmpty || _category != 'All')
                  ? 'Try widening your search or clearing a filter.'
                  : 'Check back soon for upcoming events.',
              ctaLabel: (_query.isNotEmpty || _category != 'All')
                  ? 'Clear filters'
                  : null,
              onCta: () {
                _searchCtl.clear();
                setState(() {
                  _query = '';
                  _category = 'All';
                });
              },
            ),
          )
        else ...[
          if (featured != null)
            _FeaturedCard(event: featured, onTap: () => _open(featured)),
          if (rest.isNotEmpty) const SizedBox(height: 14),
          for (var i = 0; i < rest.length; i++) ...[
            _CompactCard(event: rest[i], onTap: () => _open(rest[i])),
            if (i != rest.length - 1) const SizedBox(height: 12),
          ],
        ],
      ],
    );
  }

  void _open(_DiscoverEvent e) {
    final slug = e.slug;
    if (slug.isEmpty) return;
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => EventLandingScreen(slug: slug),
    ));
  }
}

// ─────────────────────────────────────────── Wordmark

class _Wordmark extends StatelessWidget {
  const _Wordmark();
  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 26,
          height: 26,
          decoration: BoxDecoration(
            gradient: AppColors.heroGradient,
            borderRadius: BorderRadius.circular(7),
          ),
          alignment: Alignment.center,
          child: const Icon(Icons.event_available, size: 15, color: AppColors.gold),
        ),
        const SizedBox(width: 8),
        Text('Eventera',
            style: AppText.h3.copyWith(color: AppColors.forest, fontSize: 18)),
      ],
    );
  }
}

// ─────────────────────────────────────────── "Have a code?" card

class _CodeCard extends StatefulWidget {
  const _CodeCard();
  @override
  State<_CodeCard> createState() => _CodeCardState();
}

class _CodeCardState extends State<_CodeCard> {
  final _ctl = TextEditingController();

  @override
  void dispose() {
    _ctl.dispose();
    super.dispose();
  }

  void _go() {
    final code = _ctl.text.trim();
    if (code.isEmpty) return;
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => EventLandingScreen(slug: code),
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF163828), AppColors.forest, Color(0xFF2A6A50)],
          stops: [0.0, 0.6, 1.0],
        ),
        borderRadius: BorderRadius.circular(AppRadius.card),
        boxShadow: AppShadow.lift,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Have an event code?',
              style: AppText.h3.copyWith(color: Colors.white, fontSize: 16)),
          const SizedBox(height: 3),
          Text('Jump straight into an event you were invited to.',
              style: AppText.bodySm.copyWith(
                  color: Colors.white.withValues(alpha: 0.72), fontSize: 12.5)),
          const SizedBox(height: 13),
          Row(
            children: [
              Expanded(
                child: Container(
                  height: 46,
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  alignment: Alignment.centerLeft,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(11),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.18)),
                  ),
                  child: TextField(
                    controller: _ctl,
                    textCapitalization: TextCapitalization.characters,
                    onSubmitted: (_) => _go(),
                    style: AppText.numMd.copyWith(
                        color: Colors.white, letterSpacing: 4, fontSize: 15),
                    decoration: InputDecoration(
                      isDense: true,
                      border: InputBorder.none,
                      contentPadding: EdgeInsets.zero,
                      hintText: 'CODE',
                      hintStyle: AppText.numMd.copyWith(
                          color: Colors.white.withValues(alpha: 0.5),
                          letterSpacing: 4,
                          fontSize: 15),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 9),
              GestureDetector(
                onTap: _go,
                child: Container(
                  width: 46,
                  height: 46,
                  decoration: BoxDecoration(
                    color: AppColors.gold,
                    borderRadius: BorderRadius.circular(11),
                  ),
                  child: const Icon(Icons.arrow_forward,
                      size: 20, color: AppColors.ink),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────── Featured card

class _FeaturedCard extends StatelessWidget {
  final _DiscoverEvent event;
  final VoidCallback onTap;
  const _FeaturedCard({required this.event, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.card),
          border: Border.all(color: AppColors.border),
          boxShadow: AppShadow.soft,
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              height: 150,
              width: double.infinity,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  _cover(event, BoxFit.cover),
                  const ScrimBottom(),
                  const Positioned(
                      top: 12, left: 12, child: Tag('Featured', kind: TagKind.gold)),
                  Positioned(
                    left: 14,
                    right: 14,
                    bottom: 12,
                    child: Text(
                      event.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.h3
                          .copyWith(color: Colors.white, fontSize: 19),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _metaRow(Icons.calendar_today_outlined,
                      HubDates.longDate(event.startsAt), mono: true),
                  const SizedBox(height: 6),
                  _metaRow(
                    event.isOnline
                        ? Icons.videocam_outlined
                        : Icons.location_on_outlined,
                    event.locationLine,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────── Compact list card

class _CompactCard extends StatelessWidget {
  final _DiscoverEvent event;
  final VoidCallback onTap;
  const _CompactCard({required this.event, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return MCard(
      onTap: onTap,
      padding: const EdgeInsets.all(11),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: SizedBox(
              width: 72,
              height: 72,
              child: _cover(event, BoxFit.cover),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(event.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.h3.copyWith(fontSize: 15)),
                const SizedBox(height: 5),
                Text(
                  '${HubDates.shortDate(event.startsAt)} · ${event.shortLocation}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.numSm.copyWith(color: AppColors.inkMuted),
                ),
                if (event.category.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Tag(event.category, kind: TagKind.forest),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────── shared bits

Widget _cover(_DiscoverEvent e, BoxFit fit) {
  if (e.coverImageUrl.isNotEmpty) {
    return Image.network(
      e.coverImageUrl,
      fit: fit,
      errorBuilder: (_, __, ___) => PhotoPlaceholder(hue: hueFromString(e.slug)),
      loadingBuilder: (ctx, child, prog) =>
          prog == null ? child : PhotoPlaceholder(hue: hueFromString(e.slug)),
    );
  }
  return PhotoPlaceholder(hue: hueFromString(e.slug));
}

Widget _metaRow(IconData icon, String text, {bool mono = false}) {
  return Row(
    children: [
      Icon(icon, size: 14, color: AppColors.forest),
      const SizedBox(width: 7),
      Expanded(
        child: Text(
          text,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: mono
              ? AppText.numSm.copyWith(color: AppColors.inkSoft, fontSize: 12)
              : AppText.bodySm.copyWith(color: AppColors.inkMuted),
        ),
      ),
    ],
  );
}

/// A discovery list item parsed from an `event_pages` row (with events join).
class _DiscoverEvent {
  final String title;
  final String coverImageUrl;
  final DateTime? startsAt;
  final bool isOnline;
  final String venueName;
  final String city;
  final String country;
  final String category;
  final String slug;

  _DiscoverEvent({
    required this.title,
    required this.coverImageUrl,
    required this.startsAt,
    required this.isOnline,
    required this.venueName,
    required this.city,
    required this.country,
    required this.category,
    required this.slug,
  });

  factory _DiscoverEvent.fromRow(Map<String, dynamic> r) {
    final events = r['events'];
    String eventSlug = '';
    if (events is Map) {
      eventSlug = asString(events['slug']);
    }
    final custom = asString(r['custom_slug']).trim();
    return _DiscoverEvent(
      title: asString(r['title'], 'Untitled event'),
      coverImageUrl: asString(r['cover_image_url']).trim(),
      startsAt: asDate(r['starts_at']),
      isOnline: asBool(r['is_online']),
      venueName: asString(r['venue_name']).trim(),
      city: asString(r['city']).trim(),
      country: asString(r['country']).trim(),
      category: asString(r['category']).trim(),
      slug: custom.isNotEmpty ? custom : eventSlug,
    );
  }

  String get locationLine {
    if (isOnline) return 'Online';
    if (venueName.isNotEmpty) return venueName;
    final geo = [city, country].where((e) => e.isNotEmpty).join(', ');
    return geo.isEmpty ? 'Venue TBA' : geo;
  }

  String get shortLocation {
    if (isOnline) return 'Online';
    if (city.isNotEmpty) return city;
    if (venueName.isNotEmpty) return venueName;
    if (country.isNotEmpty) return country;
    return 'TBA';
  }
}
