import 'package:flutter/material.dart';

import '../../net.dart';
import '../../theme.dart';
import '../hub/event_hub_screen.dart';
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

  @override
  void initState() {
    super.initState();
    _load();
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
      setState(() => _loading = false);
    } on ApiException catch (e) {
      setState(() {
        _loading = false;
        _error = e.message;
      });
    } catch (e) {
      setState(() {
        _loading = false;
        _error = 'Something went wrong loading events.';
      });
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
        title: const Text(
          'Discover',
          style: TextStyle(color: Brand.forest, fontWeight: FontWeight.w700),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Brand.forest))
          : _error != null
              ? _errorState()
              : _events.isEmpty
                  ? _emptyState()
                  : RefreshIndicator(
                      color: Brand.forest,
                      onRefresh: _load,
                      child: ListView.separated(
                        padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
                        itemCount: _events.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 14),
                        itemBuilder: (_, i) => _EventCard(
                          event: _events[i],
                          onTap: () => _open(_events[i]),
                        ),
                      ),
                    ),
    );
  }

  void _open(_DiscoverEvent e) {
    final slug = e.slug;
    if (slug.isEmpty) return;
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => EventHubScreen(slug: slug),
    ));
  }

  Widget _errorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, color: Brand.danger, size: 44),
            const SizedBox(height: 12),
            Text(
              _error!,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 15, color: Brand.inkSoft),
            ),
            const SizedBox(height: 16),
            FilledButton(onPressed: _load, child: const Text('Try again')),
          ],
        ),
      ),
    );
  }

  Widget _emptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 64,
              height: 64,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: Brand.forest.withValues(alpha: 0.08),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.event_outlined,
                  color: Brand.forest, size: 30),
            ),
            const SizedBox(height: 14),
            const Text(
              'No events yet',
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w700,
                color: Brand.ink,
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'Check back soon for upcoming events.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, color: Brand.muted),
            ),
          ],
        ),
      ),
    );
  }
}

class _EventCard extends StatelessWidget {
  final _DiscoverEvent event;
  final VoidCallback onTap;
  const _EventCard({required this.event, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        decoration: BoxDecoration(
          color: Brand.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Brand.border),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AspectRatio(
              aspectRatio: 16 / 9,
              child: (event.coverImageUrl.isNotEmpty)
                  ? Image.network(
                      event.coverImageUrl,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => const _CardGradient(),
                      loadingBuilder: (ctx, child, prog) =>
                          prog == null ? child : const _CardGradient(),
                    )
                  : const _CardGradient(),
            ),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (event.category.isNotEmpty) ...[
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Brand.forest.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        event.category,
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: Brand.forest,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                  ],
                  Text(
                    event.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 17,
                      height: 1.2,
                      fontWeight: FontWeight.w700,
                      color: Brand.ink,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      const Icon(Icons.calendar_today_outlined,
                          size: 14, color: Brand.forest),
                      const SizedBox(width: 6),
                      Text(
                        HubDates.longDate(event.startsAt),
                        style: const TextStyle(
                            fontSize: 13, color: Brand.inkSoft),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Icon(
                        event.isOnline
                            ? Icons.videocam_outlined
                            : Icons.location_on_outlined,
                        size: 14,
                        color: Brand.forest,
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          event.locationLine,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              fontSize: 13, color: Brand.inkSoft),
                        ),
                      ),
                    ],
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

class _CardGradient extends StatelessWidget {
  const _CardGradient();
  @override
  Widget build(BuildContext context) => const DecoratedBox(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Brand.forest, Color(0xFF2A6A50), Brand.gold],
          ),
        ),
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
}
