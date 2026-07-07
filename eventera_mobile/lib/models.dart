/// Lightweight, lenient models for the attendee flow.
/// Parsed straight from Supabase JSON; unknown fields are ignored so future
/// backend additions don't break the app.

class EventModel {
  final String id;
  final String name;
  final String slug;
  final String status;
  final List<VariantModel> variants;

  EventModel({
    required this.id,
    required this.name,
    required this.slug,
    required this.status,
    required this.variants,
  });

  /// The default variant shown to attendees (lowest position).
  VariantModel? get defaultVariant =>
      variants.isNotEmpty ? variants.first : null;
}

class VariantModel {
  final String id;
  final String? variantName;
  final String? backgroundUrl;
  final int backgroundWidth;
  final int backgroundHeight;
  final List<ZoneModel> zones;

  VariantModel({
    required this.id,
    required this.variantName,
    required this.backgroundUrl,
    required this.backgroundWidth,
    required this.backgroundHeight,
    required this.zones,
  });

  factory VariantModel.fromJson(Map<String, dynamic> j) {
    final rawZones = (j['zones'] as List?) ?? const [];
    return VariantModel(
      id: j['id'] as String,
      variantName: j['variant_name'] as String?,
      backgroundUrl: j['background_url'] as String?,
      backgroundWidth: (j['background_width'] as num?)?.toInt() ?? 1080,
      backgroundHeight: (j['background_height'] as num?)?.toInt() ?? 1350,
      zones: rawZones
          .whereType<Map<String, dynamic>>()
          .map(ZoneModel.fromJson)
          .toList(),
    );
  }

  /// Zones the attendee actually fills in (visible text/photo fields).
  List<ZoneModel> get inputZones =>
      zones.where((z) => !z.hidden && (z.isText || z.isPhoto)).toList();
}

class ZoneModel {
  final String id;
  final String type; // 'text' | 'photo' | 'custom'
  final String? label;
  final String? placeholder;
  final bool required;
  final bool hidden;
  final String? shape; // photo: 'circle' | 'square' | 'rounded'

  ZoneModel({
    required this.id,
    required this.type,
    required this.label,
    required this.placeholder,
    required this.required,
    required this.hidden,
    required this.shape,
  });

  factory ZoneModel.fromJson(Map<String, dynamic> j) {
    return ZoneModel(
      id: j['id'] as String,
      type: (j['type'] as String?) ?? 'text',
      label: j['label'] as String?,
      placeholder: j['placeholder'] as String?,
      required: j['required'] == true,
      hidden: j['hidden'] == true,
      shape: j['shape'] as String?,
    );
  }

  bool get isText => type == 'text' || type == 'custom';
  bool get isPhoto => type == 'photo';

  String get displayLabel =>
      (label != null && label!.trim().isNotEmpty) ? label! : 'Field';
}

/// An event owned by the signed-in organizer (dashboard view).
class OrganizerEvent {
  final String id;
  final String name;
  final String slug;
  final String status; // draft | published | archived
  final int viewCount;
  final int downloadCount;
  final DateTime? createdAt;
  final DateTime? startsAt;
  final String? location;
  final String? coverUrl;

  OrganizerEvent({
    required this.id,
    required this.name,
    required this.slug,
    required this.status,
    required this.viewCount,
    required this.downloadCount,
    required this.createdAt,
    this.startsAt,
    this.location,
    this.coverUrl,
  });

  factory OrganizerEvent.fromJson(Map<String, dynamic> j) {
    // Date/venue/cover live on the joined event_pages row (one per event).
    // Supabase returns it as a list or a map depending on the relationship.
    Map<String, dynamic>? page;
    final rawPage = j['event_pages'];
    if (rawPage is Map) {
      page = Map<String, dynamic>.from(rawPage);
    } else if (rawPage is List && rawPage.isNotEmpty && rawPage.first is Map) {
      page = Map<String, dynamic>.from(rawPage.first as Map);
    }
    final venue = (page?['venue_name'] as String?)?.trim();
    final city = (page?['city'] as String?)?.trim();
    final loc = [
      if (venue != null && venue.isNotEmpty) venue,
      if (city != null && city.isNotEmpty && city != venue) city,
    ].join(' · ');

    return OrganizerEvent(
      id: j['id'] as String,
      name: (j['name'] as String?) ?? 'Untitled event',
      slug: (j['slug'] as String?) ?? '',
      status: (j['status'] as String?) ?? 'draft',
      viewCount: (j['view_count'] as num?)?.toInt() ?? 0,
      downloadCount: (j['download_count'] as num?)?.toInt() ?? 0,
      createdAt: DateTime.tryParse(j['created_at'] as String? ?? ''),
      startsAt: DateTime.tryParse(page?['starts_at'] as String? ?? ''),
      location: loc.isEmpty ? null : loc,
      coverUrl: page?['cover_image_url'] as String?,
    );
  }

  bool get isPublished => status == 'published';

  /// True when the event runs today (drives the "Live today" pill).
  bool get isToday {
    final s = startsAt;
    if (s == null) return false;
    final now = DateTime.now();
    return s.year == now.year && s.month == now.month && s.day == now.day;
  }

  /// Whole days until the event starts (negative = already past).
  int? get daysUntil {
    final s = startsAt;
    if (s == null) return null;
    final now = DateTime.now();
    return DateTime(s.year, s.month, s.day)
        .difference(DateTime(now.year, now.month, now.day))
        .inDays;
  }
}

/// An event loaded for its owner (manage + edit). Keeps the default variant's
/// raw zones so unknown/extra fields survive a save round-trip.
class OwnedEvent {
  final String id;
  final String name;
  final String slug;
  final String status;
  final String variantId;
  final String? backgroundUrl;
  final int bgWidth;
  final int bgHeight;
  final List<Map<String, dynamic>> zonesRaw;

  OwnedEvent({
    required this.id,
    required this.name,
    required this.slug,
    required this.status,
    required this.variantId,
    required this.backgroundUrl,
    required this.bgWidth,
    required this.bgHeight,
    required this.zonesRaw,
  });

  bool get isPublished => status == 'published';
}
