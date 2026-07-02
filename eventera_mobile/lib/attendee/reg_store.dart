import 'dart:convert';
import 'dart:io';

import 'package:path_provider/path_provider.dart';

/// Remembers the attendee's registration for an event on this device, so the
/// engagement features (agenda, polls, Q&A, networking) have a registration_id
/// without re-registering. Keyed by event slug. Web-safe (falls back to memory).
class RegInfo {
  final String registrationId;
  final String? qrToken;
  final String? attendeeName;
  final String? attendeeEmail;
  RegInfo({
    required this.registrationId,
    this.qrToken,
    this.attendeeName,
    this.attendeeEmail,
  });

  Map<String, dynamic> toJson() => {
        'registrationId': registrationId,
        'qrToken': qrToken,
        'attendeeName': attendeeName,
        'attendeeEmail': attendeeEmail,
      };

  factory RegInfo.fromJson(Map<String, dynamic> j) => RegInfo(
        registrationId: j['registrationId'] as String,
        qrToken: j['qrToken'] as String?,
        attendeeName: j['attendeeName'] as String?,
        attendeeEmail: j['attendeeEmail'] as String?,
      );
}

class RegStore {
  RegStore._();
  static final RegStore instance = RegStore._();

  final Map<String, RegInfo> _mem = {};
  bool _loaded = false;

  Future<File?> _file() async {
    try {
      final dir = await getApplicationDocumentsDirectory();
      return File('${dir.path}/eventera_regs.json');
    } catch (_) {
      return null; // web / unsupported
    }
  }

  Future<void> _load() async {
    if (_loaded) return;
    _loaded = true;
    try {
      final f = await _file();
      if (f == null || !await f.exists()) return;
      final raw = jsonDecode(await f.readAsString());
      if (raw is Map) {
        raw.forEach((k, v) {
          if (v is Map) {
            _mem[k as String] =
                RegInfo.fromJson(Map<String, dynamic>.from(v));
          }
        });
      }
    } catch (_) {}
  }

  Future<void> _persist() async {
    try {
      final f = await _file();
      if (f == null) return;
      await f.writeAsString(
          jsonEncode(_mem.map((k, v) => MapEntry(k, v.toJson()))));
    } catch (_) {}
  }

  Future<RegInfo?> get(String slug) async {
    await _load();
    return _mem[slug];
  }

  Future<void> set(String slug, RegInfo info) async {
    await _load();
    _mem[slug] = info;
    await _persist();
  }

  Future<void> clear(String slug) async {
    await _load();
    _mem.remove(slug);
    await _persist();
  }
}
