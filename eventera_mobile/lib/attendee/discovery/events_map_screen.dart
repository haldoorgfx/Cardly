import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';

import '../../net.dart';
import '../../ui/components.dart';
import '../../ui/tokens.dart';
import '../event_landing_screen.dart';
import '../hub/event_page_model.dart';

/// Live events map — plots public in-person events by their venue coordinates
/// on an OpenStreetMap tile layer. Tap a pin to preview and open/register.
class EventsMapScreen extends StatefulWidget {
  const EventsMapScreen({super.key});

  @override
  State<EventsMapScreen> createState() => _EventsMapScreenState();
}

class _MapEvent {
  final String title;
  final String slug;
  final String coverUrl;
  final String location;
  final DateTime? startsAt;
  final LatLng point;
  _MapEvent({
    required this.title,
    required this.slug,
    required this.coverUrl,
    required this.location,
    required this.startsAt,
    required this.point,
  });
}

class _EventsMapScreenState extends State<EventsMapScreen> {
  final _map = MapController();
  bool _loading = true;
  String? _error;
  final List<_MapEvent> _events = [];
  _MapEvent? _selected;

  // Default center (Nairobi) until events / location resolve.
  static const _fallback = LatLng(-1.286389, 36.817223);

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
              'title, custom_slug, cover_image_url, starts_at, venue_name, city, venue_lat, venue_lng, is_online, events!inner(slug)')
          .eq('is_public', true)
          .eq('is_online', false)
          .not('venue_lat', 'is', null)
          .not('venue_lng', 'is', null)
          .or('ends_at.gte.$now,ends_at.is.null')
          .limit(200);

      _events.clear();
      for (final r in asMapList(rows)) {
        final lat = asDouble(r['venue_lat']);
        final lng = asDouble(r['venue_lng']);
        if (lat == 0 && lng == 0) continue;
        final ev = r['events'];
        final evSlug = ev is Map ? asString(ev['slug']) : '';
        final custom = asString(r['custom_slug']).trim();
        final venue = asString(r['venue_name']).trim();
        final city = asString(r['city']).trim();
        _events.add(_MapEvent(
          title: asString(r['title'], 'Event'),
          slug: custom.isNotEmpty ? custom : evSlug,
          coverUrl: asString(r['cover_image_url']).trim(),
          location: venue.isNotEmpty ? venue : (city.isNotEmpty ? city : ''),
          startsAt: asDate(r['starts_at']),
          point: LatLng(lat, lng),
        ));
      }
      if (!mounted) return;
      setState(() => _loading = false);
      // Fit to events after first frame.
      WidgetsBinding.instance.addPostFrameCallback((_) => _fitToEvents());
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Could not load the map.';
      });
    }
  }

  void _onMapReady() {
    _fitToEvents();
    // Some Android devices leave the tile layer blank until the camera actually
    // changes. Nudge it by a hair after the first frame so tiles fetch on their
    // own without the user panning.
    Future.delayed(const Duration(milliseconds: 250), () {
      if (!mounted) return;
      try {
        _map.move(_map.camera.center, _map.camera.zoom + 0.0001);
      } catch (_) {}
    });
  }

  void _fitToEvents() {
    if (_events.isEmpty) return;
    try {
      final pts = _events.map((e) => e.point).toList();
      if (pts.length == 1) {
        _map.move(pts.first, 12);
        return;
      }
      final bounds = LatLngBounds.fromPoints(pts);
      _map.fitCamera(CameraFit.bounds(
        bounds: bounds,
        padding: const EdgeInsets.all(60),
      ));
    } catch (_) {}
  }

  Future<void> _locateMe() async {
    try {
      var perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.denied ||
          perm == LocationPermission.deniedForever) {
        if (mounted) showToast(context, 'Location permission is off.');
        return;
      }
      final pos = await Geolocator.getCurrentPosition();
      _map.move(LatLng(pos.latitude, pos.longitude), 12);
    } catch (_) {
      if (mounted) showToast(context, 'Could not get your location.');
    }
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: const MAppBar(title: 'Events map', hairline: true),
      body: _loading
          ? const LoadingState()
          : _error != null
              ? ErrorStateView(message: _error!, onRetry: _load)
              : Stack(
                  children: [
                    // Positioned.fill forces the map to take the full stack
                    // size on the first layout pass — without it the map can
                    // render at zero size and show blank tiles until a zoom.
                    Positioned.fill(
                      child: FlutterMap(
                      mapController: _map,
                      options: MapOptions(
                        initialCenter:
                            _events.isNotEmpty ? _events.first.point : _fallback,
                        initialZoom: _events.isNotEmpty ? 5 : 3,
                        minZoom: 2,
                        maxZoom: 18,
                        interactionOptions: const InteractionOptions(
                            flags: InteractiveFlag.all),
                        // Fit AND kick the first tile fetch once the map is laid
                        // out — doing it before ready leaves tiles blank until a
                        // manual zoom.
                        onMapReady: _onMapReady,
                        onTap: (_, __) => setState(() => _selected = null),
                      ),
                      children: [
                        TileLayer(
                          urlTemplate:
                              'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                          userAgentPackageName: 'com.eventera.app',
                          maxNativeZoom: 19,
                        ),
                        MarkerLayer(
                          markers: [
                            for (final e in _events)
                              Marker(
                                point: e.point,
                                width: 44,
                                height: 44,
                                alignment: Alignment.topCenter,
                                child: GestureDetector(
                                  onTap: () => setState(() => _selected = e),
                                  child: _Pin(active: _selected == e),
                                ),
                              ),
                          ],
                        ),
                      ],
                    ),
                    ),
                    if (_events.isEmpty)
                      const Center(
                        child: Padding(
                          padding: EdgeInsets.all(24),
                          child: EmptyState(
                            icon: Icons.map_outlined,
                            title: 'No mapped events',
                            message:
                                'In-person events with a location will appear here.',
                          ),
                        ),
                      ),
                    // Locate-me button
                    Positioned(
                      right: 16,
                      bottom: _selected != null ? 150 : 24,
                      child: FloatingActionButton.small(
                        heroTag: 'locate',
                        backgroundColor: AppColors.surface,
                        foregroundColor: AppColors.forest,
                        onPressed: _locateMe,
                        child: const Icon(Icons.my_location),
                      ),
                    ),
                    // Selected event card
                    if (_selected != null)
                      Positioned(
                        left: 16,
                        right: 16,
                        bottom: 20,
                        child: _MapEventCard(
                          event: _selected!,
                          onOpen: () {
                            final slug = _selected!.slug;
                            if (slug.isEmpty) return;
                            Navigator.of(context).push(MaterialPageRoute(
                              builder: (_) => EventLandingScreen(slug: slug),
                            ));
                          },
                        ),
                      ),
                  ],
                ),
    );
  }
}

class _Pin extends StatelessWidget {
  final bool active;
  const _Pin({required this.active});
  @override
  Widget build(BuildContext context) {
    return Icon(
      Icons.location_on,
      size: active ? 44 : 36,
      color: active ? AppColors.gold : AppColors.forest,
      shadows: const [
        Shadow(color: Color(0x55000000), blurRadius: 6, offset: Offset(0, 2)),
      ],
    );
  }
}

class _MapEventCard extends StatelessWidget {
  final _MapEvent event;
  final VoidCallback onOpen;
  const _MapEventCard({required this.event, required this.onOpen});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onOpen,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.card),
          border: Border.all(color: AppColors.border),
          boxShadow: AppShadow.lift,
        ),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: SizedBox(
                width: 60,
                height: 60,
                child: (event.coverUrl.isNotEmpty)
                    ? Image.network(event.coverUrl,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) =>
                            PhotoPlaceholder(hue: hueFromString(event.slug)))
                    : PhotoPlaceholder(hue: hueFromString(event.slug)),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(event.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.h3.copyWith(fontSize: 15)),
                  const SizedBox(height: 3),
                  Text(
                    '${HubDates.shortDate(event.startsAt)}${event.location.isNotEmpty ? ' · ${event.location}' : ''}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.bodySm.copyWith(color: AppColors.inkMuted),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: AppColors.inkMuted),
          ],
        ),
      ),
    );
  }
}
