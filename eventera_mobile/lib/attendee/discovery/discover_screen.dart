import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../net.dart';
import '../../ui/components.dart';
import '../../ui/tokens.dart';
import '../account/notifications_screen.dart';
import '../app_shell.dart';
import '../event_landing_screen.dart';
import '../hub/event_page_model.dart';
import 'events_map_screen.dart';

/// Browse public, published events. Server-side filtering (category, city,
/// format, search) + lazy pagination (15 at a time). A sliding hero banner
/// leads (Eventera promo + featured events), then search, filters, and the
/// event feed.
class DiscoverScreen extends StatefulWidget {
  const DiscoverScreen({super.key});

  @override
  State<DiscoverScreen> createState() => _DiscoverScreenState();
}

const _pageSize = 15;

class _DiscoverScreenState extends State<DiscoverScreen> {
  bool _loading = true;
  bool _loadingMore = false;
  bool _hasMore = true;
  String? _error;
  int _page = 0;

  final List<_DiscoverEvent> _events = [];
  final List<_PromoBannerData> _banners = [];
  final Set<String> _cities = {};

  final _searchCtl = TextEditingController();
  final _scrollCtl = ScrollController();
  Timer? _debounce;

  // Filters
  String _query = '';
  String _category = 'All';
  String? _city; // null = everywhere
  String _format = 'All'; // All | inperson | online

  @override
  void initState() {
    super.initState();
    _scrollCtl.addListener(_onScroll);
    _fetch(reset: true);
    _loadBanners();
  }

  /// Admin-controlled promo banners (from the `promo_banners` table). Silent on
  /// failure — the carousel falls back to the default Eventera promo.
  Future<void> _loadBanners() async {
    try {
      final now = DateTime.now().toUtc().toIso8601String();
      final rows = await supa
          .from('promo_banners')
          .select(
              'title, subtitle, image_url, cta_label, cta_type, cta_target, bg_start, bg_end, text_color, sort_order')
          .eq('active', true)
          .or('starts_at.is.null,starts_at.lte.$now')
          .or('ends_at.is.null,ends_at.gte.$now')
          .order('sort_order', ascending: true)
          .limit(6);
      if (!mounted) return;
      setState(() {
        _banners
          ..clear()
          ..addAll(asMapList(rows).map(_PromoBannerData.fromRow));
      });
    } catch (_) {
      // Table may not exist yet, or offline — keep the default promo.
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchCtl.dispose();
    _scrollCtl.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (!_hasMore || _loadingMore || _loading) return;
    if (_scrollCtl.position.pixels >=
        _scrollCtl.position.maxScrollExtent - 500) {
      _fetch(reset: false);
    }
  }

  int get _activeFilters =>
      (_category != 'All' ? 1 : 0) +
      (_city != null ? 1 : 0) +
      (_format != 'All' ? 1 : 0);

  Future<void> _fetch({required bool reset}) async {
    if (reset) {
      setState(() {
        _error = null;
        _page = 0;
        _hasMore = true;
        // Only show the full skeleton on the very first load. During search /
        // filter changes we keep the current list (and the mounted search
        // field) so the keyboard never closes mid-typing.
        if (_events.isEmpty) _loading = true;
      });
    } else {
      setState(() => _loadingMore = true);
    }

    try {
      final now = DateTime.now().toUtc().toIso8601String();
      // Core events read — mirrors the VERIFIED web Discover query exactly
      // (app/(public)/events/page.tsx): public event_pages inner-joined to
      // their event, filtered only by is_public + the end-date window. The web
      // query intentionally does NOT add a PostgREST `events.status` filter on
      // the embedded resource, so neither do we — matching the shape proven to
      // return 200 with rows. venue_lat/venue_lng are extra (mobile map needs
      // them) but exist on the table.
      var q = supa
          .from('event_pages')
          .select(
              'id, event_id, title, tagline, cover_image_url, starts_at, ends_at, is_online, venue_name, venue_lat, venue_lng, city, country, category, organizer_name, custom_slug, events!inner(slug, status)')
          .eq('is_public', true)
          .or('ends_at.gte.$now,ends_at.is.null');

      if (_category != 'All') q = q.ilike('category', _category);
      if (_city != null && _city!.isNotEmpty) q = q.ilike('city', _city!);
      if (_format == 'online') q = q.eq('is_online', true);
      if (_format == 'inperson') q = q.eq('is_online', false);
      final query = _query.trim().replaceAll(',', ' ');
      if (query.isNotEmpty) {
        q = q.or(
            'title.ilike.%$query%,city.ilike.%$query%,venue_name.ilike.%$query%,organizer_name.ilike.%$query%');
      }

      final from = _page * _pageSize;
      final rows = await q
          .order('starts_at', ascending: true)
          .range(from, from + _pageSize - 1);

      final batch = <_DiscoverEvent>[];
      if (rows is List) {
        for (final r in rows) {
          if (r is Map) {
            // Parse each row defensively — one malformed row must never take
            // down the entire feed.
            try {
              batch.add(_DiscoverEvent.fromRow(Map<String, dynamic>.from(r)));
            } catch (e, st) {
              debugPrint('[Discover] skipped a row it could not parse: $e');
              if (kDebugMode) debugPrintStack(stackTrace: st);
            }
          }
        }
      }

      if (!mounted) return;
      setState(() {
        if (reset) _events.clear();
        _events.addAll(batch);
        // Secondary: derive the city filter list. Guarded so a bad value here
        // can't trip the core load.
        try {
          for (final e in batch) {
            if (e.city.isNotEmpty) _cities.add(e.city);
          }
        } catch (e) {
          debugPrint('[Discover] city derivation skipped: $e');
        }
        _hasMore = batch.length == _pageSize;
        _page += 1;
        _loading = false;
        _loadingMore = false;
        _error = null;
      });
    } on ApiException catch (e, st) {
      // Surface the true Supabase/API cause to the console instead of hiding it.
      debugPrint('[Discover] events load failed (ApiException): ${e.message}'
          '${e.status != null ? ' [${e.status}]' : ''}');
      if (kDebugMode) debugPrintStack(stackTrace: st);
      if (!mounted) return;
      setState(() {
        _loading = false;
        _loadingMore = false;
        // If we already have events on screen (e.g. a failed "load more"),
        // keep them and stay silent rather than blanking to an error.
        if (_events.isEmpty) _error = e.message;
      });
    } catch (e, st) {
      // Log the real exception so the actual cause is never swallowed.
      debugPrint('[Discover] events load failed: $e');
      if (kDebugMode) debugPrintStack(stackTrace: st);
      if (!mounted) return;
      setState(() {
        _loading = false;
        _loadingMore = false;
        if (_events.isEmpty) _error = 'Something went wrong loading events.';
      });
    }
  }

  void _onSearchChanged(String v) {
    _query = v;
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 400), () {
      _fetch(reset: true);
    });
  }

  void _setCategory(String c) {
    if (c == _category) return;
    setState(() => _category = c);
    HapticFeedback.selectionClick();
    _fetch(reset: true);
  }

  // ── Filters sheet ──────────────────────────────────────────────────
  void _openFilters() {
    var cat = _category;
    var city = _city;
    var fmt = _format;
    showMSheet(
      context,
      StatefulBuilder(
        builder: (ctx, setSheet) {
          Widget seg(String label, String value) {
            final on = fmt == value;
            return Expanded(
              child: GestureDetector(
                onTap: () => setSheet(() => fmt = value),
                child: Container(
                  height: 44,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: on ? AppColors.forest : AppColors.surface,
                    borderRadius: BorderRadius.circular(AppRadius.btn),
                    border: Border.all(
                        color: on ? AppColors.forest : AppColors.border),
                  ),
                  child: Text(label,
                      style: AppText.bodySm.copyWith(
                          color: on ? Colors.white : AppColors.inkSoft,
                          fontWeight: FontWeight.w600)),
                ),
              ),
            );
          }

          final cats = _availableCategories;
          final cityList = _cities.toList()..sort();
          return Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Filters', style: AppText.h2),
              const SizedBox(height: 18),
              const SectionLabel('Category'),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: cats
                    .map((c) => MChip(c,
                        selected: c == cat,
                        onTap: () => setSheet(() => cat = c)))
                    .toList(),
              ),
              const SizedBox(height: 20),
              const SectionLabel('Format'),
              const SizedBox(height: 10),
              Row(children: [
                seg('All', 'All'),
                const SizedBox(width: 8),
                seg('In person', 'inperson'),
                const SizedBox(width: 8),
                seg('Online', 'online'),
              ]),
              if (cityList.isNotEmpty) ...[
                const SizedBox(height: 20),
                const SectionLabel('City'),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    MChip('Everywhere',
                        selected: city == null,
                        onTap: () => setSheet(() => city = null)),
                    ...cityList.map((c) => MChip(c,
                        selected: c == city,
                        onTap: () => setSheet(() => city = c))),
                  ],
                ),
              ],
              const SizedBox(height: 24),
              Row(children: [
                Expanded(
                  child: MButton('Clear', kind: MBtnKind.sec, onTap: () {
                    Navigator.pop(ctx);
                    setState(() {
                      _category = 'All';
                      _city = null;
                      _format = 'All';
                    });
                    _fetch(reset: true);
                  }),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: MButton('Apply', onTap: () {
                    Navigator.pop(ctx);
                    setState(() {
                      _category = cat;
                      _city = city;
                      _format = fmt;
                    });
                    _fetch(reset: true);
                  }),
                ),
              ]),
            ],
          );
        },
      ),
    );
  }

  void _openCitySheet() {
    final cityList = _cities.toList()..sort();
    showMSheet(
      context,
      Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Choose a city', style: AppText.h3),
          const SizedBox(height: 8),
          _cityTile('Everywhere', _city == null, () {
            Navigator.pop(context);
            setState(() => _city = null);
            _fetch(reset: true);
          }),
          for (final c in cityList)
            _cityTile(c, c == _city, () {
              Navigator.pop(context);
              setState(() => _city = c);
              _fetch(reset: true);
            }),
        ],
      ),
    );
  }

  Widget _cityTile(String label, bool on, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 13),
        child: Row(
          children: [
            Icon(on ? Icons.radio_button_checked : Icons.location_city_outlined,
                size: 20, color: on ? AppColors.forest : AppColors.inkMuted),
            const SizedBox(width: 12),
            Expanded(
                child: Text(label,
                    style: AppText.bodyStrong.copyWith(
                        color: on ? AppColors.forest : AppColors.ink))),
          ],
        ),
      ),
    );
  }

  List<String> get _availableCategories {
    final set = <String>{};
    for (final e in _events) {
      if (e.category.isNotEmpty) set.add(e.category);
    }
    final list = set.toList()..sort();
    return ['All', ...list];
  }

  void _openMap() {
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => const EventsMapScreen(),
    ));
  }

  void _openCode() {
    final ctl = TextEditingController();
    String? error;
    showMSheet(
      context,
      StatefulBuilder(
        builder: (ctx, setSheet) {
          return Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Have an invite code?', style: AppText.h3),
              const SizedBox(height: 6),
              Text('Enter the code from your invitation to open the event.',
                  style: AppText.bodySm),
              const SizedBox(height: 16),
              MInput(
                controller: ctl,
                hint: 'Event code',
                errorText: error,
                onChanged: (_) {
                  if (error != null) setSheet(() => error = null);
                },
              ),
              const SizedBox(height: 8),
              Text('Tip: it\'s the short code at the end of your event link.',
                  style: AppText.caption.copyWith(color: AppColors.inkMuted)),
              const SizedBox(height: 16),
              MButton('Open event', onTap: () {
                final code = ctl.text.trim();
                if (code.isEmpty) {
                  setSheet(() => error = 'Enter your invite code to continue.');
                  return;
                }
                Navigator.pop(ctx);
                Navigator.of(context).push(MaterialPageRoute(
                  builder: (_) => EventLandingScreen(slug: code),
                ));
              }),
            ],
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: MAppBar(
        showBack: false,
        leading: const Padding(
          padding: EdgeInsets.only(left: 18),
          child: Center(child: _BrandWordmark()),
        ),
        actions: [
          _HeaderIcon(icon: Icons.notifications_none, onTap: _openNotifications),
          const SizedBox(width: 6),
          GestureDetector(
            onTap: () => mainTab.value = 3, // → Account tab
            child: Avatar(
              name: isSignedIn ? (currentUserEmail ?? 'You') : null,
              size: 38,
            ),
          ),
          const SizedBox(width: 14),
        ],
      ),
      body: _loading
          ? _loadingBody()
          : _error != null
              ? ErrorStateView(message: _error!, onRetry: () => _fetch(reset: true))
              : RefreshIndicator(
                  color: AppColors.forest,
                  onRefresh: () => _fetch(reset: true),
                  child: _feed(),
                ),
    );
  }

  void _openNotifications() {
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => NotificationsScreen(onSignInTap: () => mainTab.value = 3),
    ));
  }

  Widget _loadingBody() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 24),
      children: [
        Skeleton(height: 172, radius: AppRadius.card),
        const SizedBox(height: 18),
        Skeleton(height: 52, radius: AppRadius.input),
        const SizedBox(height: 18),
        Skeleton(height: 158, radius: AppRadius.card),
        const SizedBox(height: 14),
        Skeleton(height: 96, radius: AppRadius.card),
        const SizedBox(height: 12),
        Skeleton(height: 96, radius: AppRadius.card),
      ],
    );
  }

  Widget _feed() {
    final events = _events;
    final featured = events.isNotEmpty ? events.first : null;
    final rest = events.length > 1 ? events.sublist(1) : <_DiscoverEvent>[];
    final cats = _availableCategories;

    return ListView(
      controller: _scrollCtl,
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
      children: [
        // Sliding hero banner (Eventera promo + featured events)
        _HeroCarousel(
          banners: _banners,
          featured: events.take(4).toList(),
          onOpen: _open,
          onBannerCta: _onBannerCta,
          onExplore: () => _scrollCtl.animateTo(360,
              duration: const Duration(milliseconds: 400),
              curve: Curves.easeOut),
        ),
        const SizedBox(height: 18),

        // Search — dominant. A single filter button sits beside it; the map
        // lives in the section header below so the search box keeps its room.
        Row(
          children: [
            Expanded(
              child: MInput(
                controller: _searchCtl,
                icon: Icons.search,
                hint: 'Search events, cities, organizers',
                onChanged: _onSearchChanged,
                onSubmitted: (_) => _fetch(reset: true),
              ),
            ),
            const SizedBox(width: 10),
            _SquareAction(
              icon: Icons.tune,
              badge: _activeFilters,
              onTap: _openFilters,
            ),
          ],
        ),
        const SizedBox(height: 18),

        // Discover heading + map + city selector (compact pills on the right)
        Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Expanded(child: Text('Discover', style: AppText.h2)),
            _HeaderPill(
                icon: Icons.map_outlined, label: 'Map', onTap: _openMap),
            const SizedBox(width: 8),
            _HeaderPill(
              icon: Icons.place_outlined,
              label: _city ?? 'Everywhere',
              trailing: Icons.keyboard_arrow_down,
              onTap: _openCitySheet,
            ),
          ],
        ),
        const SizedBox(height: 12),

        // Category chips
        SizedBox(
          height: 36,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: cats.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (_, i) => MChip(cats[i],
                selected: cats[i] == _category,
                onTap: () => _setCategory(cats[i])),
          ),
        ),
        const SizedBox(height: 18),

        if (events.isEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 30),
            child: EmptyState(
              icon: Icons.search_off,
              title: (_query.isNotEmpty || _activeFilters > 0)
                  ? 'No events found'
                  : 'No events yet',
              message: (_query.isNotEmpty || _activeFilters > 0)
                  ? 'Try widening your search or clearing a filter.'
                  : 'Check back soon for upcoming events.',
              ctaLabel: (_query.isNotEmpty || _activeFilters > 0)
                  ? 'Clear filters'
                  : null,
              onCta: () {
                _searchCtl.clear();
                setState(() {
                  _query = '';
                  _category = 'All';
                  _city = null;
                  _format = 'All';
                });
                _fetch(reset: true);
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
          const SizedBox(height: 16),
          if (_loadingMore)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(8),
                child: SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(
                      strokeWidth: 2.4, color: AppColors.forest),
                ),
              ),
            )
          else if (!_hasMore && events.length > 6)
            Center(
              child: Text('You\'re all caught up',
                  style: AppText.bodySm.copyWith(color: AppColors.inkMuted)),
            ),
          const SizedBox(height: 18),
          // Secondary: invite code (moved off the top hero)
          Center(
            child: TextButton.icon(
              onPressed: _openCode,
              icon: const Icon(Icons.vpn_key_outlined,
                  size: 16, color: AppColors.forest),
              label: Text('Have an invite code?',
                  style: AppText.bodySm.copyWith(
                      color: AppColors.forest, fontWeight: FontWeight.w600)),
            ),
          ),
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

  void _onBannerCta(_PromoBannerData b) {
    switch (b.ctaType) {
      case 'event':
        final slug = b.ctaTarget.trim();
        if (slug.isEmpty) return;
        Navigator.of(context).push(MaterialPageRoute(
          builder: (_) => EventLandingScreen(slug: slug),
        ));
        break;
      case 'url':
        final url = b.ctaTarget.trim();
        if (url.isNotEmpty) {
          launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
        }
        break;
      default:
        _scrollCtl.animateTo(360,
            duration: const Duration(milliseconds: 400), curve: Curves.easeOut);
    }
  }
}

// ─────────────────────────────────────────── Brand wordmark (header)

class _BrandWordmark extends StatelessWidget {
  const _BrandWordmark();
  @override
  Widget build(BuildContext context) {
    return Image.asset(
      'assets/brand/logo.png',
      height: 26,
      filterQuality: FilterQuality.high,
    );
  }
}

/// Header icon button with a generous 44px tap target.
class _HeaderIcon extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  const _HeaderIcon({required this.icon, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return InkResponse(
      onTap: () {
        HapticFeedback.lightImpact();
        onTap();
      },
      radius: 26,
      child: SizedBox(
        width: 44,
        height: 44,
        child: Icon(icon, size: 24, color: AppColors.ink),
      ),
    );
  }
}

/// Compact rounded pill used in the section header (Map / city selector).
class _HeaderPill extends StatelessWidget {
  final IconData icon;
  final String label;
  final IconData? trailing;
  final VoidCallback onTap;
  const _HeaderPill({
    required this.icon,
    required this.label,
    required this.onTap,
    this.trailing,
  });
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      behavior: HitTestBehavior.opaque,
      child: Container(
        height: 36,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: AppColors.forest),
            const SizedBox(width: 5),
            ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 96),
              child: Text(label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.label.copyWith(color: AppColors.forest)),
            ),
            if (trailing != null)
              Icon(trailing, size: 16, color: AppColors.forest),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────── Square icon action (filter/map)

class _SquareAction extends StatelessWidget {
  final IconData icon;
  final int badge;
  final VoidCallback onTap;
  const _SquareAction({required this.icon, this.badge = 0, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        onTap();
      },
      child: Container(
        width: 52,
        height: 52,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.input),
          border: Border.all(color: AppColors.border),
          boxShadow: AppShadow.soft,
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            Icon(icon, size: 22, color: AppColors.forest),
            if (badge > 0)
              Positioned(
                top: 8,
                right: 8,
                child: Container(
                  width: 16,
                  height: 16,
                  decoration: const BoxDecoration(
                      color: AppColors.gold, shape: BoxShape.circle),
                  alignment: Alignment.center,
                  child: Text('$badge',
                      style: AppText.caption.copyWith(
                          color: AppColors.ink,
                          fontSize: 10,
                          fontWeight: FontWeight.w800)),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────── Hero carousel

class _HeroCarousel extends StatefulWidget {
  final List<_PromoBannerData> banners;
  final List<_DiscoverEvent> featured;
  final void Function(_DiscoverEvent) onOpen;
  final void Function(_PromoBannerData) onBannerCta;
  final VoidCallback onExplore;
  const _HeroCarousel({
    required this.banners,
    required this.featured,
    required this.onOpen,
    required this.onBannerCta,
    required this.onExplore,
  });
  @override
  State<_HeroCarousel> createState() => _HeroCarouselState();
}

class _HeroCarouselState extends State<_HeroCarousel> {
  final _pc = PageController();
  int _index = 0;
  Timer? _auto;

  @override
  void initState() {
    super.initState();
    _startAuto();
  }

  void _startAuto() {
    _auto?.cancel();
    _auto = Timer.periodic(const Duration(seconds: 5), (_) {
      if (!mounted || !_pc.hasClients) return;
      final bannerCount = widget.banners.isEmpty ? 1 : widget.banners.length;
      final count = bannerCount + widget.featured.length;
      if (count <= 1) return;
      final next = (_index + 1) % count;
      _pc.animateToPage(next,
          duration: const Duration(milliseconds: 450), curve: Curves.easeInOut);
    });
  }

  @override
  void dispose() {
    _auto?.cancel();
    _pc.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final pages = <Widget>[
      if (widget.banners.isEmpty)
        _PromoBanner(onExplore: widget.onExplore)
      else
        ...widget.banners.map(
            (b) => _AdminBanner(data: b, onTap: () => widget.onBannerCta(b))),
      ...widget.featured
          .map((e) => _EventBanner(event: e, onTap: () => widget.onOpen(e))),
    ];
    return Column(
      children: [
        SizedBox(
          height: 192,
          child: PageView(
            controller: _pc,
            onPageChanged: (i) => setState(() => _index = i),
            children: pages,
          ),
        ),
        const SizedBox(height: 10),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            for (int i = 0; i < pages.length; i++)
              AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                margin: const EdgeInsets.symmetric(horizontal: 3),
                width: i == _index ? 20 : 6,
                height: 6,
                decoration: BoxDecoration(
                  color: i == _index ? AppColors.forest : AppColors.borderStrong,
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
          ],
        ),
      ],
    );
  }
}

class _PromoBanner extends StatelessWidget {
  final VoidCallback onExplore;
  const _PromoBanner({required this.onExplore});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onExplore,
      child: Container(
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF163828), AppColors.forest, Color(0xFF2A6A50)],
            stops: [0.0, 0.55, 1.0],
          ),
          borderRadius: BorderRadius.circular(AppRadius.card),
          boxShadow: AppShadow.lift,
        ),
        clipBehavior: Clip.antiAlias,
        child: Stack(
          children: [
            Positioned(
              right: -30,
              top: -30,
              child: Container(
                width: 160,
                height: 160,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.gold.withValues(alpha: 0.12),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('The new era of events',
                      style: AppText.h2.copyWith(
                          color: Colors.white, fontSize: 24, height: 1.12)),
                  const SizedBox(height: 6),
                  Text('Discover, register, and get your card in seconds.',
                      style: AppText.bodySm.copyWith(
                          color: Colors.white.withValues(alpha: 0.8))),
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 9),
                    decoration: BoxDecoration(
                      color: AppColors.gold,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text('Explore events',
                            style: AppText.bodySm.copyWith(
                                color: AppColors.ink,
                                fontWeight: FontWeight.w700)),
                        const SizedBox(width: 6),
                        const Icon(Icons.arrow_forward,
                            size: 15, color: AppColors.ink),
                      ],
                    ),
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

/// Admin-controlled banner (from the `promo_banners` table). Renders an image
/// background (with a left scrim) or a two-stop gradient when no image is set.
class _AdminBanner extends StatelessWidget {
  final _PromoBannerData data;
  final VoidCallback onTap;
  const _AdminBanner({required this.data, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final fg = _hexColor(data.textColor, Colors.white);
    final hasImage = data.imageUrl.isNotEmpty;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          gradient: hasImage
              ? null
              : LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    _hexColor(data.bgStart, const Color(0xFF163828)),
                    _hexColor(data.bgEnd, const Color(0xFF2A6A50)),
                  ],
                ),
          borderRadius: BorderRadius.circular(AppRadius.card),
          boxShadow: AppShadow.lift,
        ),
        clipBehavior: Clip.antiAlias,
        child: Stack(
          fit: StackFit.expand,
          children: [
            if (hasImage) ...[
              CachedNetworkImage(
                imageUrl: data.imageUrl,
                fit: BoxFit.cover,
                placeholder: (_, __) => Container(color: AppColors.forest),
                errorWidget: (_, __, ___) => Container(color: AppColors.forest),
              ),
              const DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.centerLeft,
                    end: Alignment.centerRight,
                    colors: [Color(0xE60D1F17), Color(0x400D1F17)],
                  ),
                ),
              ),
            ],
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(data.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.h2
                          .copyWith(color: fg, fontSize: 22, height: 1.15)),
                  if (data.subtitle.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(data.subtitle,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: AppText.bodySm
                            .copyWith(color: fg.withValues(alpha: 0.85))),
                  ],
                  if (data.ctaLabel.isNotEmpty) ...[
                    const SizedBox(height: 14),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 9),
                      decoration: BoxDecoration(
                        color: AppColors.gold,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(data.ctaLabel,
                              style: AppText.bodySm.copyWith(
                                  color: AppColors.ink,
                                  fontWeight: FontWeight.w700)),
                          const SizedBox(width: 6),
                          const Icon(Icons.arrow_forward,
                              size: 15, color: AppColors.ink),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Parse `#RGB`/`#RRGGBB`/`#AARRGGBB` hex → Color, else [fallback].
Color _hexColor(String hex, Color fallback) {
  var h = hex.trim().replaceAll('#', '');
  if (h.length == 6) h = 'FF$h';
  if (h.length != 8) return fallback;
  final v = int.tryParse(h, radix: 16);
  return v == null ? fallback : Color(v);
}

class _EventBanner extends StatelessWidget {
  final _DiscoverEvent event;
  final VoidCallback onTap;
  const _EventBanner({required this.event, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(AppRadius.card),
          boxShadow: AppShadow.lift,
        ),
        clipBehavior: Clip.antiAlias,
        child: Stack(
          fit: StackFit.expand,
          children: [
            _cover(event, BoxFit.cover),
            const DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Colors.transparent, Color(0xCC0D1F17)],
                  stops: [0.35, 1.0],
                ),
              ),
            ),
            const Positioned(
                top: 14, left: 14, child: Tag('Featured', kind: TagKind.gold)),
            Positioned(
              left: 16,
              right: 16,
              bottom: 14,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(event.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.h2
                          .copyWith(color: Colors.white, fontSize: 20)),
                  const SizedBox(height: 4),
                  Text(
                    '${HubDates.shortDate(event.startsAt)} · ${event.shortLocation}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.bodySm.copyWith(
                        color: Colors.white.withValues(alpha: 0.85)),
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
              height: 158,
              width: double.infinity,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  _cover(event, BoxFit.cover),
                  const ScrimBottom(),
                  Positioned(
                    left: 16,
                    right: 16,
                    bottom: 14,
                    child: Text(
                      event.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style:
                          AppText.h2.copyWith(color: Colors.white, fontSize: 20),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 13, 16, 15),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _metaRow(Icons.calendar_today_outlined,
                      HubDates.longDate(event.startsAt)),
                  const SizedBox(height: 7),
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
            borderRadius: BorderRadius.circular(12),
            child: SizedBox(
              width: 76,
              height: 76,
              child: _cover(event, BoxFit.cover),
            ),
          ),
          const SizedBox(width: 13),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(event.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.h3.copyWith(fontSize: 16)),
                const SizedBox(height: 5),
                Text(
                  '${HubDates.shortDate(event.startsAt)} · ${event.shortLocation}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.bodySm.copyWith(color: AppColors.inkMuted),
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
    return CachedNetworkImage(
      imageUrl: e.coverImageUrl,
      fit: fit,
      placeholder: (_, __) => PhotoPlaceholder(hue: hueFromString(e.slug)),
      errorWidget: (_, __, ___) => PhotoPlaceholder(hue: hueFromString(e.slug)),
      fadeInDuration: const Duration(milliseconds: 250),
    );
  }
  return PhotoPlaceholder(hue: hueFromString(e.slug));
}

Widget _metaRow(IconData icon, String text) {
  return Row(
    children: [
      Icon(icon, size: 15, color: AppColors.forest),
      const SizedBox(width: 8),
      Expanded(
        child: Text(
          text,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: AppText.bodySm.copyWith(color: AppColors.inkSoft),
        ),
      ),
    ],
  );
}

/// An admin-controlled promo banner parsed from a `promo_banners` row.
class _PromoBannerData {
  final String title;
  final String subtitle;
  final String imageUrl;
  final String ctaLabel;
  final String ctaType; // 'none' | 'event' | 'url'
  final String ctaTarget;
  final String bgStart;
  final String bgEnd;
  final String textColor;

  _PromoBannerData({
    required this.title,
    required this.subtitle,
    required this.imageUrl,
    required this.ctaLabel,
    required this.ctaType,
    required this.ctaTarget,
    required this.bgStart,
    required this.bgEnd,
    required this.textColor,
  });

  factory _PromoBannerData.fromRow(Map<String, dynamic> r) => _PromoBannerData(
        title: asString(r['title'], 'The new era of events'),
        subtitle: asString(r['subtitle']).trim(),
        imageUrl: asString(r['image_url']).trim(),
        ctaLabel: asString(r['cta_label']).trim(),
        ctaType: asString(r['cta_type'], 'none').trim(),
        ctaTarget: asString(r['cta_target']).trim(),
        bgStart: asString(r['bg_start'], '#163828').trim(),
        bgEnd: asString(r['bg_end'], '#2A6A50').trim(),
        textColor: asString(r['text_color'], '#FFFFFF').trim(),
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
  final double? lat;
  final double? lng;

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
    required this.lat,
    required this.lng,
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
      lat: r['venue_lat'] == null ? null : asDouble(r['venue_lat']),
      lng: r['venue_lng'] == null ? null : asDouble(r['venue_lng']),
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
