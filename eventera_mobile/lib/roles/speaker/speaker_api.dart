// Backend calls for the SPEAKER role tools. All reads/writes go DIRECT to
// Supabase via the shared `supa` client under RLS (mobile cannot call the
// cookie-authenticated Next.js /api routes).
//
// Access model, per the web app + the RLS lockdown (migration 050):
//  - `speakers`      : public SELECT; writes blocked by RLS → self-edit goes
//                      through the SECURITY DEFINER `update_speaker_profile`
//                      RPC (063), which authorises the caller by email / active
//                      speaker role. It writes the fields it owns, never `name`
//                      (organizer-managed) — so the mobile editor treats name as
//                      read-only, matching the RPC's real capability.
//  - `qa_questions`  : public SELECT; writes blocked by RLS → a speaker marks a
//                      question answered / featured / hidden through the
//                      SECURITY DEFINER `speaker_set_qa_status` RPC, which binds
//                      the write to auth.uid() (event owner OR active staff OR a
//                      speaker assigned to THAT question's session) and never
//                      trusts a client-supplied speaker/registration id.
//  - `sessions` /
//    `session_speakers`: public SELECT → read directly for green-room content.
//
// Everything fails SAFE: a missing RPC / RLS denial surfaces as a friendly
// message, never a crash.

import '../../net.dart';

/// Result of a mutating call: [ok] plus a human message for toasts.
class SpeakerResult {
  final bool ok;
  final String message;
  const SpeakerResult(this.ok, this.message);
}

/// A question in a session's live Q&A.
class QaQuestion {
  final String id;
  final String text;
  final int votes;
  bool featured;
  String status; // 'pending' | 'answered' | 'hidden'
  final bool anonymous;
  final DateTime? createdAt;

  QaQuestion({
    required this.id,
    required this.text,
    required this.votes,
    required this.featured,
    required this.status,
    required this.anonymous,
    required this.createdAt,
  });

  bool get answered => status == 'answered';
}

class SpeakerApi {
  // ── Speaker profile ────────────────────────────────────────────────────────

  /// Resolve the speaker row for the signed-in account at [eventId] (by email),
  /// or by explicit [speakerId] when the caller already knows it. Returns the
  /// raw row map, or null when this account is not a speaker for the event.
  static Future<Map<String, dynamic>?> resolveSpeaker({
    required String eventId,
    String? speakerId,
  }) async {
    const cols =
        'id, name, headline, role, company, bio, photo_url, linkedin_url, twitter_url, website_url, email';
    if ((speakerId ?? '').isNotEmpty) {
      final r = await supa
          .from('speakers')
          .select(cols)
          .eq('id', speakerId as Object)
          .maybeSingle();
      return r == null ? null : Map<String, dynamic>.from(r);
    }
    final email = (currentUserEmail ?? '').trim().toLowerCase();
    if (email.isEmpty) return null;
    final rows = await supa
        .from('speakers')
        .select(cols)
        .eq('event_id', eventId)
        .ilike('email', email);
    for (final r in (rows as List).whereType<Map>()) {
      return Map<String, dynamic>.from(r);
    }
    return null;
  }

  /// Save the speaker-editable subset through the ownership-checked RPC (063).
  /// `name` and `photo_url` are organizer-managed and intentionally not sent.
  static Future<SpeakerResult> saveProfile({
    required String speakerId,
    required String headline,
    required String bio,
    required String company,
    required String linkedin,
    required String twitter,
    required String website,
  }) async {
    try {
      final res = await supa.rpc('update_speaker_profile', params: {
        'p_speaker_id': speakerId,
        'p_headline': headline.trim(),
        'p_bio': bio.trim(),
        'p_company': company.trim(),
        'p_linkedin_url': linkedin.trim(),
        'p_twitter_url': twitter.trim(),
        'p_website_url': website.trim(),
      });
      if (res is Map && res['result'] == 'success') {
        return const SpeakerResult(true, 'Speaker profile saved');
      }
      final msg = (res is Map && res['message'] != null)
          ? res['message'].toString()
          : 'Could not save your speaker profile';
      return SpeakerResult(false, msg);
    } catch (_) {
      return const SpeakerResult(false, 'Could not save your speaker profile');
    }
  }

  // ── Session Q&A ─────────────────────────────────────────────────────────────

  /// Read every non-hidden question for [sessionId], upvote-sorted.
  static Future<List<QaQuestion>> sessionQuestions(String sessionId) async {
    final rows = await supa
        .from('qa_questions')
        .select('id, question, upvotes_count, is_featured, status, is_anonymous, created_at')
        .eq('session_id', sessionId)
        .neq('status', 'hidden')
        .order('upvotes_count', ascending: false)
        .order('created_at', ascending: true);
    return (rows as List).map((r) {
      final m = Map<String, dynamic>.from(r as Map);
      return QaQuestion(
        id: asString(m['id']),
        text: asString(m['question']),
        votes: asInt(m['upvotes_count']),
        featured: asBool(m['is_featured']),
        status: asString(m['status'], 'pending'),
        anonymous: asBool(m['is_anonymous']),
        createdAt: asDate(m['created_at']),
      );
    }).toList();
  }

  /// Speaker moderation of a question. Authority is derived server-side from
  /// auth.uid() + the question's own session — no ids are trusted from the
  /// client. Pass only the fields you want to change.
  static Future<SpeakerResult> setQaStatus(
    String questionId, {
    String? status,
    bool? featured,
  }) async {
    try {
      final params = <String, dynamic>{'p_question_id': questionId};
      if (status != null) params['p_status'] = status;
      if (featured != null) params['p_is_featured'] = featured;
      final res = await supa.rpc('speaker_set_qa_status', params: params);
      if (res is Map && res['result'] == 'success') {
        return const SpeakerResult(true, 'Updated');
      }
      final msg = (res is Map && res['message'] != null)
          ? res['message'].toString()
          : 'Could not update the question';
      return SpeakerResult(false, msg);
    } catch (_) {
      return const SpeakerResult(false, 'Could not update the question');
    }
  }

  // ── Green room ──────────────────────────────────────────────────────────────

  /// Full row for one session (description, room, timing).
  static Future<Map<String, dynamic>?> session(String sessionId) async {
    final r = await supa
        .from('sessions')
        .select('id, title, description, room, starts_at, ends_at, session_type')
        .eq('id', sessionId)
        .maybeSingle();
    return r == null ? null : Map<String, dynamic>.from(r);
  }

  /// Co-speakers assigned to [sessionId] (name + title), position-ordered.
  static Future<List<Map<String, dynamic>>> sessionSpeakers(
      String sessionId) async {
    final links = await supa
        .from('session_speakers')
        .select('speaker_id, position')
        .eq('session_id', sessionId)
        .order('position', ascending: true);
    final ids = (links as List)
        .map((r) => asString(Map<String, dynamic>.from(r as Map)['speaker_id']))
        .where((s) => s.isNotEmpty)
        .toList();
    if (ids.isEmpty) return [];
    final rows = await supa
        .from('speakers')
        .select('id, name, headline, role, company, photo_url')
        .inFilter('id', ids);
    return (rows as List)
        .map((r) => Map<String, dynamic>.from(r as Map))
        .toList();
  }
}
