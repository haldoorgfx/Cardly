// Sponsor + Exhibitor data layer.
//
// The mobile app talks to Supabase DIRECTLY under RLS (the Next.js /api routes
// are cookie-authed and unreachable from mobile). Every read/write for the
// sponsor + exhibitor role shells lives here so the screens stay declarative.
//
// Security notes (see supabase/072_rls_lockdown.sql + 059/060):
//  - `sponsors` is owner/self-read locked; the event organizer or the booth
//    contact (matched by email) can read their row.
//  - Lead writes go through the `capture_lead` SECURITY DEFINER RPC, which binds
//    the write to auth.uid() and resolves the attendee from the scanned QR token
//    — never from a client-supplied id.
//  - Meeting-request inserts stamp the requester from the signed-in account, not
//    from client-supplied identity.

import 'package:supabase_flutter/supabase_flutter.dart';

import '../../net.dart';

class SponsorApi {
  // ── Booth resolution ───────────────────────────────────────────────────────

  /// Resolve the sponsor booth this account owns/contacts for [eventId].
  /// Returns the full row (id, company_name, tier, contact_email, event_id,
  /// description, booth_location) or null when none is visible under RLS.
  static Future<Map<String, dynamic>?> resolveBooth(String eventId) async {
    final email = (currentUserEmail ?? '').toLowerCase();
    final rows = await supa
        .from('sponsors')
        .select(
            'id, company_name, tier, contact_email, event_id, description, booth_location')
        .eq('event_id', eventId);
    final list = (rows as List)
        .map((r) => Map<String, dynamic>.from(r as Map))
        .toList();
    if (list.isEmpty) return null;
    for (final m in list) {
      if ((m['contact_email'] ?? '').toString().toLowerCase() == email) {
        return m;
      }
    }
    // Organizer viewing the event (owner policy) — fall back to the first booth.
    return list.first;
  }

  // ── Leads ──────────────────────────────────────────────────────────────────

  static const _leadColumnsBase =
      'id, attendee_name, attendee_email, company, role, rating, note, created_at, captured_at';
  static const _leadColumnsWithConsent = '$_leadColumnsBase, consent, consent_at';

  // `consent`/`consent_at` (migration 077) may not be live on every environment
  // yet — fall back to the base column list rather than let a missing-column
  // error break the whole leads list (same resilience pattern as captureLead's
  // PGRST202 fallback below).
  static Future<T> _withConsentFallback<T>(
      Future<T> Function(String columns) query) async {
    try {
      return await query(_leadColumnsWithConsent);
    } on PostgrestException catch (e) {
      if (e.code == '42703') return await query(_leadColumnsBase);
      rethrow;
    }
  }

  static Future<List<Map<String, dynamic>>> fetchLeads(String sponsorId) async {
    final rows = await _withConsentFallback((columns) => supa
        .from('sponsor_leads')
        .select(columns)
        .eq('sponsor_id', sponsorId)
        .order('created_at', ascending: false));
    return (rows as List)
        .map((r) => Map<String, dynamic>.from(r as Map))
        .toList();
  }

  static Future<Map<String, dynamic>?> fetchLead(String id) async {
    final row = await _withConsentFallback((columns) => supa
        .from('sponsor_leads')
        .select(columns)
        .eq('id', id)
        .maybeSingle());
    return row == null ? null : Map<String, dynamic>.from(row);
  }

  /// Capture a lead from a scanned attendee QR token via the `capture_lead` RPC.
  ///
  /// Returns the RPC's jsonb result: { result: 'success'|'invalid'|'error',
  /// message?, lead? }. [consent] records the attendee's GDPR consent captured
  /// at the booth. The production RPC does not yet persist consent, so we try
  /// the consent-aware signature first and transparently fall back to the
  /// current 4-arg one (PGRST202 = function/params not found) — consent is
  /// always enforced in the UI regardless.
  static Future<Map<String, dynamic>> captureLead({
    required String sponsorId,
    required String token,
    String? rating,
    String? note,
    required bool consent,
  }) async {
    Future<dynamic> call({required bool withConsent}) {
      final params = <String, dynamic>{
        'p_sponsor_id': sponsorId,
        'p_qr_token': token,
        'p_rating': rating,
        'p_note': note,
      };
      if (withConsent) params['p_consent'] = consent;
      return supa.rpc('capture_lead', params: params);
    }

    dynamic res;
    try {
      res = await call(withConsent: true);
    } on PostgrestException catch (e) {
      if (e.code == 'PGRST202') {
        res = await call(withConsent: false);
      } else {
        rethrow;
      }
    }
    return (res is Map)
        ? Map<String, dynamic>.from(res)
        : <String, dynamic>{'result': 'error', 'message': 'Unexpected response'};
  }

  // ── Booth team ─────────────────────────────────────────────────────────────

  static Future<List<Map<String, dynamic>>> fetchTeam(String sponsorId) async {
    final rows = await supa
        .from('sponsor_members')
        .select('id, invited_email, role, status, scan_access, user_id')
        .eq('sponsor_id', sponsorId)
        .order('created_at');
    return (rows as List)
        .map((r) => Map<String, dynamic>.from(r as Map))
        .toList();
  }

  static Future<void> setScanAccess(String memberId, bool value) async {
    await supa
        .from('sponsor_members')
        .update({'scan_access': value}).eq('id', memberId);
  }

  static Future<void> inviteMember(
      String sponsorId, String email, String role) async {
    await supa.from('sponsor_members').insert({
      'sponsor_id': sponsorId,
      'invited_email': email.trim().toLowerCase(),
      'role': role.trim().isEmpty ? 'Team member' : role.trim(),
      'status': 'invited',
    });
  }

  static Future<void> removeMember(String memberId) async {
    await supa.from('sponsor_members').delete().eq('id', memberId);
  }

  // ── Exhibitor products ─────────────────────────────────────────────────────

  static Future<List<Map<String, dynamic>>> fetchProducts(
      String sponsorId) async {
    final rows = await supa
        .from('exhibitor_products')
        .select('id, name, description, image_url, is_featured, position')
        .eq('sponsor_id', sponsorId)
        .order('position');
    return (rows as List)
        .map((r) => Map<String, dynamic>.from(r as Map))
        .toList();
  }

  static Future<void> addProduct({
    required String sponsorId,
    required String eventId,
    required String name,
    required String description,
    required bool featured,
    required int position,
  }) async {
    await supa.from('exhibitor_products').insert({
      'sponsor_id': sponsorId,
      'event_id': eventId,
      'name': name.trim(),
      'description': description.trim(),
      'is_featured': featured,
      'position': position,
    });
  }

  static Future<void> updateProduct({
    required String id,
    required String name,
    required String description,
    required bool featured,
  }) async {
    await supa.from('exhibitor_products').update({
      'name': name.trim(),
      'description': description.trim(),
      'is_featured': featured,
    }).eq('id', id);
  }

  static Future<void> deleteProduct(String id) async {
    await supa.from('exhibitor_products').delete().eq('id', id);
  }

  // ── Meeting requests ───────────────────────────────────────────────────────

  static Future<List<Map<String, dynamic>>> fetchMeetings(
      String sponsorId) async {
    final rows = await supa
        .from('meeting_requests')
        .select(
            'id, requester_name, requester_email, message, status, requested_time, scheduled_time, created_at')
        .eq('sponsor_id', sponsorId)
        .order('created_at', ascending: false);
    return (rows as List)
        .map((r) => Map<String, dynamic>.from(r as Map))
        .toList();
  }

  static Future<void> updateMeeting(
    String id, {
    required String status,
    DateTime? scheduledTime,
  }) async {
    final data = <String, dynamic>{'status': status};
    if (scheduledTime != null) {
      data['scheduled_time'] = scheduledTime.toIso8601String();
    }
    await supa.from('meeting_requests').update(data).eq('id', id);
  }

  /// Request a meeting with a booth. Requester identity is bound to the signed-in
  /// account (never client-supplied). This is the same write an attendee makes
  /// from the public directory.
  static Future<void> requestMeeting({
    required String sponsorId,
    required String eventId,
    String? message,
    DateTime? requestedTime,
  }) async {
    final email = currentUserEmail;
    final uid = currentUserId;
    String? name;
    if (uid != null) {
      final p = await supa
          .from('profiles')
          .select('full_name')
          .eq('id', uid)
          .maybeSingle();
      name = (p?['full_name'])?.toString();
    }
    await supa.from('meeting_requests').insert({
      'sponsor_id': sponsorId,
      'event_id': eventId,
      'requester_name':
          (name == null || name.trim().isEmpty) ? (email ?? 'Attendee') : name,
      'requester_email': email,
      'message':
          (message == null || message.trim().isEmpty) ? null : message.trim(),
      'requested_time': requestedTime?.toIso8601String(),
      'status': 'pending',
    });
  }
}
