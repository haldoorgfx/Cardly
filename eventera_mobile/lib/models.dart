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

  OrganizerEvent({
    required this.id,
    required this.name,
    required this.slug,
    required this.status,
    required this.viewCount,
    required this.downloadCount,
    required this.createdAt,
  });

  factory OrganizerEvent.fromJson(Map<String, dynamic> j) => OrganizerEvent(
        id: j['id'] as String,
        name: (j['name'] as String?) ?? 'Untitled event',
        slug: (j['slug'] as String?) ?? '',
        status: (j['status'] as String?) ?? 'draft',
        viewCount: (j['view_count'] as num?)?.toInt() ?? 0,
        downloadCount: (j['download_count'] as num?)?.toInt() ?? 0,
        createdAt: DateTime.tryParse(j['created_at'] as String? ?? ''),
      );

  bool get isPublished => status == 'published';
}
