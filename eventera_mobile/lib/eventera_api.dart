import 'dart:convert';
import 'dart:typed_data';

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
        .select('id, name, slug, status')
        .eq('slug', cleaned)
        .eq('status', 'published')
        .maybeSingle();

    if (eventRow == null) {
      throw EventeraException(
          'No published event found for "$cleaned". Check the link.');
    }

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
      name: (eventRow['name'] as String?) ?? 'Event',
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
            'id, name, slug, status, view_count, download_count, created_at')
        .eq('user_id', uid)
        .order('created_at', ascending: false);
    return (rows as List)
        .whereType<Map<String, dynamic>>()
        .map(OrganizerEvent.fromJson)
        .toList();
  }

  /// Generate the personalized card via the existing `/api/render` endpoint.
  /// Mirrors the web attendee flow: multipart with `variantId`, `fields`
  /// (JSON of zoneId -> text), `idempotencyKey`, and `photo_<zoneId>` files.
  /// Returns the PNG bytes on success.
  Future<Uint8List> generateCard({
    required String variantId,
    required Map<String, String> fields,
    required Map<String, PhotoUpload> photos,
  }) async {
    final req = http.MultipartRequest('POST', AppConfig.renderEndpoint);
    req.fields['variantId'] = variantId;
    req.fields['fields'] = jsonEncode(fields);
    req.fields['idempotencyKey'] =
        'mob-${DateTime.now().microsecondsSinceEpoch}';

    photos.forEach((zoneId, photo) {
      req.files.add(http.MultipartFile.fromBytes(
        'photo_$zoneId',
        photo.bytes,
        filename: photo.filename,
        contentType: MediaType('image', photo.subtype),
      ));
    });

    late http.StreamedResponse streamed;
    try {
      streamed = await req.send().timeout(const Duration(seconds: 45));
    } catch (_) {
      throw EventeraException(
          'Could not reach the server. Check your connection and try again.');
    }

    final res = await http.Response.fromStream(streamed);

    if (res.statusCode == 200) {
      return res.bodyBytes;
    }

    // Map backend error codes to friendly copy (same codes as the web app).
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
