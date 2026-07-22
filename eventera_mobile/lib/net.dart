import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';

import 'app_config.dart';

/// Shared networking helpers for the attendee features.
///
/// Access model (from the web app):
///  - Public READS  -> query Supabase directly with the anon key (`supa`).
///  - Public WRITES (register, vote, ask, connect, message, feedback, ...) ->
///    POST the existing web API routes (`apiPost`), which run admin-side.
///  - Logged-in ACCOUNT data (saved, follows, notifications, profile, tickets)
///    -> query Supabase directly; own-row RLS applies to the authed session.

SupabaseClient get supa => Supabase.instance.client;

String? get currentUserId => supa.auth.currentUser?.id;
String? get currentUserEmail => supa.auth.currentUser?.email;
bool get isSignedIn => supa.auth.currentUser != null;

class ApiException implements Exception {
  final String message;
  final int? status;
  ApiException(this.message, [this.status]);
  @override
  String toString() => message;
}

Map<String, String> _headers({bool json = false}) {
  final h = <String, String>{};
  if (json) h['Content-Type'] = 'application/json';
  final token = supa.auth.currentSession?.accessToken;
  if (token != null) h['Authorization'] = 'Bearer $token';
  return h;
}

dynamic _decode(http.Response res) {
  final ok = res.statusCode >= 200 && res.statusCode < 300;
  dynamic data;
  try {
    data = res.body.isNotEmpty ? jsonDecode(res.body) : null;
  } catch (_) {
    data = res.body;
  }
  if (!ok) {
    final msg = (data is Map && data['error'] != null)
        ? data['error'].toString()
        : 'Request failed (${res.statusCode})';
    throw ApiException(msg, res.statusCode);
  }
  return data;
}

Uri _uri(String path, [Map<String, dynamic>? query]) {
  final base = '${AppConfig.renderBaseUrl}$path';
  final u = Uri.parse(base);
  if (query == null) return u;
  return u.replace(queryParameters: {
    ...u.queryParameters,
    for (final e in query.entries)
      if (e.value != null) e.key: '${e.value}',
  });
}

Future<dynamic> apiGet(String path, {Map<String, dynamic>? query}) async {
  final res = await http
      .get(_uri(path, query), headers: _headers())
      .timeout(const Duration(seconds: 30));
  return _decode(res);
}

Future<dynamic> apiPost(String path, Map<String, dynamic> body) async {
  final res = await http
      .post(_uri(path), headers: _headers(json: true), body: jsonEncode(body))
      .timeout(const Duration(seconds: 45));
  return _decode(res);
}

Future<dynamic> apiPut(String path, Map<String, dynamic> body) async {
  final res = await http
      .put(_uri(path), headers: _headers(json: true), body: jsonEncode(body))
      .timeout(const Duration(seconds: 45));
  return _decode(res);
}

Future<dynamic> apiPatch(String path, Map<String, dynamic> body) async {
  final res = await http
      .patch(_uri(path), headers: _headers(json: true), body: jsonEncode(body))
      .timeout(const Duration(seconds: 45));
  return _decode(res);
}

/// Multipart POST — for the one write that isn't plain JSON: uploading a
/// file (currently just the public photo-wall submission). Everything else
/// on this surface is small enough to stay JSON via [apiPost].
Future<dynamic> apiPostMultipart(
  String path, {
  required String filePath,
  required String fileField,
  Map<String, String>? fields,
}) async {
  final req = http.MultipartRequest('POST', _uri(path));
  req.headers.addAll(_headers());
  if (fields != null) req.fields.addAll(fields);
  req.files.add(await http.MultipartFile.fromPath(fileField, filePath));
  final streamed = await req.send().timeout(const Duration(seconds: 60));
  final res = await http.Response.fromStream(streamed);
  return _decode(res);
}

Future<dynamic> apiDelete(String path, {Map<String, dynamic>? body}) async {
  final res = await http
      .delete(_uri(path),
          headers: _headers(json: body != null),
          body: body != null ? jsonEncode(body) : null)
      .timeout(const Duration(seconds: 30));
  return _decode(res);
}

/// Helpers to coerce dynamic JSON safely.
String asString(dynamic v, [String fallback = '']) =>
    v == null ? fallback : v.toString();
int asInt(dynamic v, [int fallback = 0]) =>
    v is num ? v.toInt() : int.tryParse('$v') ?? fallback;
double asDouble(dynamic v, [double fallback = 0]) =>
    v is num ? v.toDouble() : double.tryParse('$v') ?? fallback;
bool asBool(dynamic v) => v == true || v == 'true' || v == 1;
DateTime? asDate(dynamic v) =>
    v == null ? null : DateTime.tryParse(v.toString());
List<Map<String, dynamic>> asMapList(dynamic v) => (v is List)
    ? v.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
    : <Map<String, dynamic>>[];
