import 'dart:convert';
import 'dart:math';
import 'dart:ui' as ui;

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'app_config.dart';
import 'models.dart';

/// Thrown for friendly, user-facing failures.
class EventeraException implements Exception {
  final String message;
  EventeraException(this.message);
  @override
  String toString() => message;
}

class EventeraApi {
  final SupabaseClient _db = Supabase.instance.client;

  /// Load a published event + its variants by slug, directly from Supabase.
  /// Public-read RLS policies allow the anon key to read published events.
  Future<EventModel> loadEvent(String slug) async {
    final cleaned = slug.trim().toLowerCase();
    if (cleaned.isEmpty) {
      throw EventeraException('Enter an event link or code.');
    }

    final eventRow = await _db
        .from('events')
        // event_pages.title is the canonical display title (what Discover and
        // the web show). events.name can drift out of sync, so prefer the title.
        .select('id, name, slug, status, event_pages(title)')
        .eq('slug', cleaned)
        .eq('status', 'published')
        .maybeSingle();

    if (eventRow == null) {
      throw EventeraException(
          'No published event found for "$cleaned". Check the link.');
    }

    final page = eventRow['event_pages'];
    final pageTitle = page is Map ? page['title'] as String? : null;
    final displayName = (pageTitle != null && pageTitle.trim().isNotEmpty)
        ? pageTitle
        : ((eventRow['name'] as String?) ?? 'Event');

    final variantRows = await _db
        .from('event_variants')
        .select(
            'id, variant_name, variant_slug, background_url, background_width, background_height, zones, position')
        .eq('event_id', eventRow['id'] as String)
        .order('position', ascending: true);

    final variants = (variantRows as List)
        .whereType<Map<String, dynamic>>()
        .map(VariantModel.fromJson)
        .toList();

    return EventModel(
      id: eventRow['id'] as String,
      name: displayName,
      slug: eventRow['slug'] as String,
      status: eventRow['status'] as String,
      variants: variants,
    );
  }

  /// Events owned by the signed-in organizer (for the dashboard).
  /// RLS restricts this to rows where user_id = the authenticated user.
  Future<List<OrganizerEvent>> myEvents() async {
    final uid = _db.auth.currentUser?.id;
    if (uid == null) throw EventeraException('Please sign in first.');
    final rows = await _db
        .from('events')
        .select(
            'id, name, slug, status, view_count, download_count, created_at, '
            'event_pages(starts_at, venue_name, city, cover_image_url)')
        .eq('user_id', uid)
        .order('created_at', ascending: false);
    return (rows as List)
        .whereType<Map<String, dynamic>>()
        .map(OrganizerEvent.fromJson)
        .toList();
  }

  /// Create a new event from a background design.
  /// Mirrors the web `/api/events/create`: upload to `event-backgrounds`,
  /// create the event (slug retry on collision) + a default variant.
  /// Done directly via the authenticated Supabase client (RLS applies).
  /// Returns the new event id.
  Future<String> createEvent({
    required String name,
    required Uint8List imageBytes,
    required String contentType, // 'image/png' | 'image/jpeg'
  }) async {
    final uid = _db.auth.currentUser?.id;
    if (uid == null) throw EventeraException('Please sign in first.');
    final trimmed = name.trim();
    if (trimmed.isEmpty) throw EventeraException('Give your event a name.');

    final ext = contentType.contains('png') ? 'png' : 'jpg';
    final path = '$uid/${DateTime.now().millisecondsSinceEpoch}.$ext';

    // 1. Upload the background.
    try {
      await _db.storage.from('event-backgrounds').uploadBinary(
            path,
            imageBytes,
            fileOptions: FileOptions(
                contentType: contentType, cacheControl: '31536000'),
          );
    } catch (_) {
      throw EventeraException('Could not upload the design. Please try again.');
    }
    final publicUrl =
        _db.storage.from('event-backgrounds').getPublicUrl(path);

    // 2. Image dimensions (fall back to a portrait default).
    final dims = await _imageDimensions(imageBytes);

    // 3. Insert the event, retrying on slug collision (Postgres 23505).
    String? eventId;
    for (var attempt = 0; attempt < 3; attempt++) {
      try {
        final row = await _db
            .from('events')
            .insert({
              'user_id': uid,
              'name': trimmed,
              'slug': _generateSlug(trimmed),
              'background_url': publicUrl,
              'background_width': dims.$1,
              'background_height': dims.$2,
              'zones': [],
              'status': 'draft',
            })
            .select('id')
            .single();
        eventId = row['id'] as String;
        break;
      } on PostgrestException catch (e) {
        if (e.code != '23505') {
          throw EventeraException('Could not create the event. ${e.message}');
        }
      }
    }
    if (eventId == null) {
      throw EventeraException('Could not create the event. Please try again.');
    }

    // 4. Default variant (required by the attendee flow + editor).
    try {
      await _db.from('event_variants').insert({
        'event_id': eventId,
        'variant_name': 'Default',
        'variant_slug': 'default',
        'background_url': publicUrl,
        'background_width': dims.$1,
        'background_height': dims.$2,
        'zones': [],
        'position': 0,
      });
    } catch (_) {
      // Best-effort cleanup so we don't leave an event with no design.
      try {
        await _db.from('events').delete().eq('id', eventId);
      } catch (_) {}
      try {
        await _db.storage.from('event-backgrounds').remove([path]);
      } catch (_) {}
      throw EventeraException(
          'Could not finish creating the event. Please try again.');
    }

    return eventId;
  }

  static String _generateSlug(String name) {
    final base = name
        .toLowerCase()
        .replaceAll(RegExp(r'[^a-z0-9\s-]'), '')
        .trim()
        .replaceAll(RegExp(r'\s+'), '-');
    final clipped = base.length > 40 ? base.substring(0, 40) : base;
    final r = Random();
    final hex =
        List.generate(8, (_) => r.nextInt(16).toRadixString(16)).join();
    return '$clipped-$hex';
  }

  static Future<(int, int)> _imageDimensions(Uint8List bytes) async {
    try {
      final codec = await ui.instantiateImageCodec(bytes);
      final frame = await codec.getNextFrame();
      final w = frame.image.width;
      final h = frame.image.height;
      frame.image.dispose();
      return (w, h);
    } catch (_) {
      return (1080, 1350);
    }
  }

  /// Load one of the organizer's own events (any status) + its default variant
  /// with the raw zones, for the detail screen and editor.
  Future<OwnedEvent> loadOwnEvent(String eventId) async {
    final uid = _db.auth.currentUser?.id;
    if (uid == null) throw EventeraException('Please sign in first.');
    final ev = await _db
        .from('events')
        .select('id, name, slug, status')
        .eq('id', eventId)
        .maybeSingle();
    if (ev == null) throw EventeraException('Event not found.');
    final variant = await _db
        .from('event_variants')
        .select('id, background_url, background_width, background_height, zones')
        .eq('event_id', eventId)
        .order('position', ascending: true)
        .limit(1)
        .maybeSingle();
    if (variant == null) {
      throw EventeraException('This event has no design yet.');
    }
    final zonesRaw = ((variant['zones'] as List?) ?? const [])
        .whereType<Map<String, dynamic>>()
        .map((m) => Map<String, dynamic>.from(m))
        .toList();
    return OwnedEvent(
      id: ev['id'] as String,
      name: (ev['name'] as String?) ?? 'Untitled event',
      slug: (ev['slug'] as String?) ?? '',
      status: (ev['status'] as String?) ?? 'draft',
      variantId: variant['id'] as String,
      backgroundUrl: variant['background_url'] as String?,
      bgWidth: (variant['background_width'] as num?)?.toInt() ?? 1080,
      bgHeight: (variant['background_height'] as num?)?.toInt() ?? 1350,
      zonesRaw: zonesRaw,
    );
  }

  /// Save the variant's editable zones (full replace).
  Future<void> saveZones(
      String variantId, List<Map<String, dynamic>> zones) async {
    await _db
        .from('event_variants')
        .update({'zones': zones}).eq('id', variantId);
  }

  /// Publish or unpublish an event.
  Future<void> setPublished(String eventId, bool published) async {
    await _db.from('events').update(
        {'status': published ? 'published' : 'draft'}).eq('id', eventId);
  }

  /// Delete an event (DB cascade removes its variants).
  Future<void> deleteEvent(String eventId) async {
    await _db.from('events').delete().eq('id', eventId);
  }

  /// Generate the personalized card via the existing `/api/render` endpoint.
  /// Mirrors the web attendee flow: multipart with `variantId`, `fields`
  /// (JSON of zoneId -> text), `idempotencyKey`, and `photo_<zoneId>` files.
  /// Returns the PNG bytes on success.
  ///
  /// Attendees are often on slow, lossy mobile networks, so this is resilient:
  ///  1. Retry the multipart upload a few times for transient blips.
  ///  2. Fall back to a JSON body with a base64 photo — the same endpoint
  ///     accepts both. The JSON path sends one contiguous body, which survives
  ///     environments where chunked multipart uploads are flaky (some NATs, the
  ///     Android emulator). A single `idempotencyKey` is reused across all
  ///     attempts so a retry never double-counts against the event's card cap.
  Future<Uint8List> generateCard({
    required String variantId,
    required Map<String, String> fields,
    required Map<String, PhotoUpload> photos,
    required String registrationId,
  }) async {
    final idempotencyKey = 'mob-${DateTime.now().microsecondsSinceEpoch}';
    Object? lastError;

    // 1) Multipart, with a few retries for transient network failures.
    for (var attempt = 0; attempt < 3; attempt++) {
      try {
        return await _sendCardMultipart(
            variantId, fields, photos, idempotencyKey, registrationId);
      } on EventeraException {
        rethrow; // real backend rejection (4xx) — retrying won't help
      } catch (e) {
        lastError = e;
        if (kDebugMode) {
          debugPrint('generateCard multipart attempt $attempt failed: $e');
        }
      }
      await Future.delayed(Duration(milliseconds: 500 * (attempt + 1)));
    }

    // 2) Fallback: JSON + base64 photo (single contiguous body). The JSON path
    //    maps one photo to the first photo zone, so only use it with ≤1 photo.
    if (photos.length <= 1) {
      try {
        return await _sendCardJson(
            variantId, fields, photos, idempotencyKey, registrationId);
      } on EventeraException {
        rethrow;
      } catch (e) {
        lastError = e;
        if (kDebugMode) debugPrint('generateCard JSON fallback failed: $e');
      }
    }

    if (kDebugMode) debugPrint('generateCard gave up: $lastError');
    throw EventeraException(
        'Could not reach the server. Check your connection and try again.');
  }

  Future<Uint8List> _sendCardMultipart(
    String variantId,
    Map<String, String> fields,
    Map<String, PhotoUpload> photos,
    String idempotencyKey,
    String registrationId,
  ) async {
    final req = http.MultipartRequest('POST', AppConfig.renderEndpoint);
    req.fields['variantId'] = variantId;
    req.fields['fields'] = jsonEncode(fields);
    req.fields['idempotencyKey'] = idempotencyKey;
    req.fields['registrationId'] = registrationId;

    photos.forEach((zoneId, photo) {
      req.files.add(http.MultipartFile.fromBytes(
        'photo_$zoneId',
        photo.bytes,
        filename: photo.filename,
        contentType: MediaType('image', photo.subtype),
      ));
    });

    final streamed = await req.send().timeout(const Duration(seconds: 45));
    final res = await http.Response.fromStream(streamed);
    return _cardResponse(res);
  }

  Future<Uint8List> _sendCardJson(
    String variantId,
    Map<String, String> fields,
    Map<String, PhotoUpload> photos,
    String idempotencyKey,
    String registrationId,
  ) async {
    final body = <String, dynamic>{
      'variantId': variantId,
      'fields': fields,
      'idempotencyKey': idempotencyKey,
      'registrationId': registrationId,
    };
    if (photos.isNotEmpty) {
      final photo = photos.values.first;
      body['photoDataUrl'] =
          'data:image/${photo.subtype};base64,${base64Encode(photo.bytes)}';
    }
    final res = await http
        .post(
          AppConfig.renderEndpoint,
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode(body),
        )
        .timeout(const Duration(seconds: 45));
    return _cardResponse(res);
  }

  /// Shared response handling: 200 -> PNG bytes; otherwise map the backend
  /// error code to friendly copy (same codes as the web app).
  Uint8List _cardResponse(http.Response res) {
    if (res.statusCode == 200) return res.bodyBytes;

    String code = '';
    String? detail;
    try {
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      code = (body['error'] as String?) ?? '';
      detail = body['detail'] as String?;
    } catch (_) {}

    const map = {
      'CARD_LIMIT_REACHED':
          'This event hit its card limit for the month. Contact the organiser.',
      'PLAN_LIMIT': 'This event has reached its limit. Contact the organiser.',
      'DUPLICATE_SUBMISSION':
          'Your card is already being generated — give it a moment.',
      'REGISTRATION_REQUIRED':
          'Register for this event first to create your card.',
      'Event not found or not published':
          'This event is not published yet.',
    };
    throw EventeraException(
        map[code] ?? detail ?? 'Could not generate your card. Please try again.');
  }
}

/// A photo ready for upload to the render endpoint.
class PhotoUpload {
  final Uint8List bytes;
  final String filename;
  final String subtype; // 'jpeg' | 'png' | 'webp'
  PhotoUpload(this.bytes, this.filename, this.subtype);

  /// Build from picked-image bytes + original path (to infer the type).
  factory PhotoUpload.fromPath(Uint8List bytes, String path) {
    final lower = path.toLowerCase();
    if (lower.endsWith('.png')) return PhotoUpload(bytes, 'photo.png', 'png');
    if (lower.endsWith('.webp')) return PhotoUpload(bytes, 'photo.webp', 'webp');
    return PhotoUpload(bytes, 'photo.jpg', 'jpeg');
  }
}
