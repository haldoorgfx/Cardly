import '../../net.dart';

/// A parsed `event_pages` row plus the section data loaded for the hub.
///
/// Column names verified against the web app
/// (app/(public)/e/[slug]/page.tsx and PublicEventPageClient.tsx).
class EventPageModel {
  final String id;
  final String? eventId;
  final String title;
  final String? tagline;
  final String? description;
  final String? coverImageUrl;
  final DateTime? startsAt;
  final DateTime? endsAt;
  final String? timezone;
  final bool isOnline;
  final String? onlineUrl;
  final String? venueName;
  final String? venueAddress;
  final String? city;
  final String? country;
  final String? category;
  final String? organizerName;
  final String? organizerAvatarUrl;
  final String? customSlug;

  /// The `features` jsonb: which sections are enabled. A key set to `false`
  /// means the section is hidden; anything else (missing / true) => shown.
  final Map<String, dynamic> features;

  EventPageModel({
    required this.id,
    required this.eventId,
    required this.title,
    required this.tagline,
    required this.description,
    required this.coverImageUrl,
    required this.startsAt,
    required this.endsAt,
    required this.timezone,
    required this.isOnline,
    required this.onlineUrl,
    required this.venueName,
    required this.venueAddress,
    required this.city,
    required this.country,
    required this.category,
    required this.organizerName,
    required this.organizerAvatarUrl,
    required this.customSlug,
    required this.features,
  });

  factory EventPageModel.fromRow(Map<String, dynamic> r) {
    final rawFeatures = r['features'];
    return EventPageModel(
      id: asString(r['id']),
      eventId: r['event_id'] == null ? null : asString(r['event_id']),
      title: asString(r['title'], 'Event'),
      tagline: _nullable(r['tagline']),
      description: _nullable(r['description']),
      coverImageUrl: _nullable(r['cover_image_url']),
      startsAt: asDate(r['starts_at']),
      endsAt: asDate(r['ends_at']),
      timezone: _nullable(r['timezone']),
      isOnline: asBool(r['is_online']),
      onlineUrl: _nullable(r['online_url']),
      venueName: _nullable(r['venue_name']),
      venueAddress: _nullable(r['venue_address']),
      city: _nullable(r['city']),
      country: _nullable(r['country']),
      category: _nullable(r['category']),
      organizerName: _nullable(r['organizer_name']),
      organizerAvatarUrl: _nullable(r['organizer_avatar_url']),
      customSlug: _nullable(r['custom_slug']),
      features: rawFeatures is Map
          ? Map<String, dynamic>.from(rawFeatures)
          : <String, dynamic>{},
    );
  }

  /// Mirrors the web `featureOn(key)` -> `features[key] !== false`.
  bool featureOn(String key) => features[key] != false;

  String get locationLine {
    if (isOnline) return 'Online event';
    final parts = <String>[
      if ((venueName ?? '').isNotEmpty) venueName!,
      if ((venueAddress ?? '').isNotEmpty) venueAddress!,
    ];
    if (parts.isEmpty) {
      final geo = <String>[
        if ((city ?? '').isNotEmpty) city!,
        if ((country ?? '').isNotEmpty) country!,
      ];
      if (geo.isNotEmpty) return geo.join(', ');
      return 'Venue TBA';
    }
    return parts.join(' · ');
  }

  static String? _nullable(dynamic v) {
    if (v == null) return null;
    final s = v.toString().trim();
    return s.isEmpty ? null : s;
  }
}

/// A single attendee avatar strip entry.
class AttendeeAvatar {
  final String name;
  final String? avatarUrl;
  AttendeeAvatar({required this.name, required this.avatarUrl});
}

/// A schedule session summary (hub list item).
class SessionSummary {
  final String id;
  final String title;
  final String? description;
  final DateTime? startsAt;
  final DateTime? endsAt;
  final String? room;
  final String? track;

  SessionSummary({
    required this.id,
    required this.title,
    required this.description,
    required this.startsAt,
    required this.endsAt,
    required this.room,
    required this.track,
  });

  factory SessionSummary.fromRow(Map<String, dynamic> r) => SessionSummary(
        id: asString(r['id']),
        title: asString(r['title'], 'Untitled session'),
        description: EventPageModel._nullable(r['description']),
        startsAt: asDate(r['starts_at']),
        endsAt: asDate(r['ends_at']),
        room: EventPageModel._nullable(r['room']),
        track: EventPageModel._nullable(r['session_type']),
      );
}

/// A speaker summary (hub list item / speaker detail source).
class SpeakerSummary {
  final String id;
  final String name;
  final String? role;
  final String? company;
  final String? headline;
  final String? photoUrl;

  SpeakerSummary({
    required this.id,
    required this.name,
    required this.role,
    required this.company,
    required this.headline,
    required this.photoUrl,
  });

  factory SpeakerSummary.fromRow(Map<String, dynamic> r) => SpeakerSummary(
        id: asString(r['id']),
        name: asString(r['name'], 'Speaker'),
        role: EventPageModel._nullable(r['role'] ?? r['title']),
        company: EventPageModel._nullable(r['company']),
        headline: EventPageModel._nullable(r['headline']),
        photoUrl:
            EventPageModel._nullable(r['photo_url'] ?? r['avatar_url']),
      );

  String get roleLine =>
      [role, company].where((e) => (e ?? '').isNotEmpty).cast<String>().join(' · ');
}

/// A sponsor summary (hub list item).
class SponsorSummary {
  final String id;
  final String companyName;
  final String? tagline;
  final String? logoUrl;
  final String? tier;

  SponsorSummary({
    required this.id,
    required this.companyName,
    required this.tagline,
    required this.logoUrl,
    required this.tier,
  });

  factory SponsorSummary.fromRow(Map<String, dynamic> r) => SponsorSummary(
        id: asString(r['id']),
        companyName: asString(r['company_name'], 'Sponsor'),
        tagline: EventPageModel._nullable(r['tagline']),
        logoUrl: EventPageModel._nullable(r['logo_url']),
        tier: EventPageModel._nullable(r['tier']),
      );
}

/// Shared date formatting (no intl package).
class HubDates {
  static const _months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  static const _weekdays = [
    'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun',
  ];

  /// e.g. "Mon, 12 Jul 2026"
  static String longDate(DateTime? d) {
    if (d == null) return 'Date TBA';
    final wd = _weekdays[(d.weekday - 1).clamp(0, 6)];
    final mo = _months[(d.month - 1).clamp(0, 11)];
    return '$wd, ${d.day} $mo ${d.year}';
  }

  /// e.g. "9:05 AM"
  static String time(DateTime? d) {
    if (d == null) return '';
    final h24 = d.hour;
    final period = h24 >= 12 ? 'PM' : 'AM';
    var h = h24 % 12;
    if (h == 0) h = 12;
    final m = d.minute.toString().padLeft(2, '0');
    return '$h:$m $period';
  }

  /// e.g. "Mon, 12 Jul 2026 · 9:05 AM"
  static String dateTime(DateTime? d) {
    if (d == null) return 'Date TBA';
    final t = time(d);
    return t.isEmpty ? longDate(d) : '${longDate(d)} · $t';
  }

  /// Range formatter for hero: "Mon, 12 Jul 2026 · 9:00 AM – 5:00 PM".
  static String range(DateTime? start, DateTime? end) {
    if (start == null) return 'Date TBA';
    final base = dateTime(start);
    if (end == null) return base;
    final sameDay = start.year == end.year &&
        start.month == end.month &&
        start.day == end.day;
    if (sameDay) return '$base – ${time(end)}';
    return '$base → ${dateTime(end)}';
  }
}
