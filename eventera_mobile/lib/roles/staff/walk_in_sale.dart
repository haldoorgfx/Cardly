// C01 · the cash-sale transaction, kept out of the screen so the widget stays
// short and the money path lives in one place.
//
// SECURITY (why this file was rewritten): the whole door sale is now ONE
// server-authoritative RPC — create_walkin_registration (migration 075). The
// client NEVER writes amount_paid, payment_status, or cash_shift_id. The RPC
// authorises with can_manage_event(), reads the price from ticket_types
// server-side, opens/reuses the caller's cash shift, inserts the PAID +
// checked-in registration, and is IDEMPOTENT on client_uuid (a unique index).
//
// [clientUuid] is generated ONCE per sale attempt (one WalkInSale == one
// attempt) and REUSED on every retry — never regenerated. That is the whole
// point: if the request reaches the server but the response is lost, a Retry
// re-sends the SAME client_uuid, so the RPC returns status='already' and the
// operator sees the ORIGINAL receipt instead of paying twice.

import 'dart:math';

import 'package:supabase_flutter/supabase_flutter.dart';

import '../../net.dart';
import '../../offline/scan_queue.dart' show isNetworkError;

enum WalkInFailure { notAuthorised, network, generic }

class WalkInSaleException implements Exception {
  final WalkInFailure kind;

  /// Server-supplied message for a `status:'error'` result, shown plainly.
  final String? message;
  const WalkInSaleException(this.kind, [this.message]);
}

/// The server receipt for a completed door sale. Every figure here comes from
/// the SERVER: [amountPaid] is the ticket_types price the RPC read, never a
/// client-typed value.
class WalkInReceipt {
  final String registrationId;
  final String qrToken;
  final String attendeeName;
  final String? ticketName; // null on a replay ('already') — screen falls back
  final double amountPaid;
  final String paymentMethod;
  final bool checkedIn;

  const WalkInReceipt({
    required this.registrationId,
    required this.qrToken,
    required this.attendeeName,
    required this.ticketName,
    required this.amountPaid,
    required this.paymentMethod,
    required this.checkedIn,
  });
}

class WalkInSale {
  final String eventId;
  WalkInSale(this.eventId);

  static final _rand = Random.secure();

  /// One idempotency key per sale attempt, generated ONCE here and reused on
  /// every retry (never regenerated). Reusing it is what makes a lost-response
  /// retry return the original receipt instead of taking money twice.
  final String clientUuid = _clientUuid();

  /// Set once the server confirms the sale. Non-null == money was taken and the
  /// registration row exists.
  WalkInReceipt? receipt;

  bool get committed => receipt != null;
  bool get checkedIn => receipt?.checkedIn ?? false;
  String? get qrToken => receipt?.qrToken;

  bool _isNotAuthorised(Object e) =>
      e is PostgrestException && e.message.contains('NOT_AUTHORISED');

  /// v4-shaped idempotency key. `uuid` is not a dependency, so this is built
  /// from Random.secure() folded with the microsecond clock — copied from
  /// entitlement_scanner_screen.dart. Do NOT add the uuid package.
  static String _clientUuid() {
    final b = List<int>.generate(16, (_) => _rand.nextInt(256));
    var micros = DateTime.now().microsecondsSinceEpoch;
    for (var i = 8; i < 16; i++) {
      b[i] ^= micros & 0xff;
      micros >>= 8;
    }
    b[6] = (b[6] & 0x0f) | 0x40; // version 4
    b[8] = (b[8] & 0x3f) | 0x80; // variant
    String h(int n) => n.toRadixString(16).padLeft(2, '0');
    final s = b.map(h).join();
    return '${s.substring(0, 8)}-${s.substring(8, 12)}-${s.substring(12, 16)}-'
        '${s.substring(16, 20)}-${s.substring(20)}';
  }

  /// Runs (or resumes) the sale as a single RPC. Returns the server receipt.
  /// Throws [WalkInSaleException] on failure; the caller inspects [committed] to
  /// know whether money was taken (it never is on a throw here — the RPC is
  /// atomic, so a failure leaves nothing charged).
  Future<WalkInReceipt> run({
    required String ticketId,
    required String name,
    required String? phone,
    required String email, // typed + lowercased; may be empty
    required String methodKey,
  }) async {
    // Already confirmed on a prior attempt — return the same receipt, never
    // re-charge. (A Retry after success is a no-op here.)
    final existing = receipt;
    if (existing != null) return existing;

    final Map<String, dynamic> res;
    try {
      final raw = await supa.rpc('create_walkin_registration', params: {
        'p_event_id': eventId,
        'p_ticket_type_id': ticketId,
        'p_name': name,
        // Empty email → the RPC synthesises a stable placeholder from
        // client_uuid, so a retry collides rather than making a second sale.
        'p_email': email.isEmpty ? null : email,
        'p_phone': (phone != null && phone.isNotEmpty) ? phone : null,
        'p_payment_method': methodKey,
        // The SAME client_uuid on every retry — a replayed sale returns
        // status='already' with the original receipt, never a second charge.
        'p_client_uuid': clientUuid,
      });
      res = (raw is Map) ? Map<String, dynamic>.from(raw) : const {};
    } catch (e) {
      // Network failure: the request MAY have reached the server. We NEVER fake
      // success and NEVER queue money. A Retry re-sends the same client_uuid, so
      // if a row was in fact created the RPC returns 'already' on the next try.
      if (isNetworkError(e)) {
        throw const WalkInSaleException(WalkInFailure.network);
      }
      if (_isNotAuthorised(e)) {
        throw const WalkInSaleException(WalkInFailure.notAuthorised);
      }
      throw const WalkInSaleException(WalkInFailure.generic);
    }

    final status = asString(res['status']);
    if (status == 'ok' || status == 'already') {
      // 'already' == this client_uuid was already processed. Treat it as
      // success and show the SAME receipt — do not charge again, do not error.
      final r = WalkInReceipt(
        registrationId: asString(res['registration_id']),
        qrToken: asString(res['qr_code_token']),
        attendeeName: asString(res['attendee_name'], name),
        ticketName:
            res['ticket_name'] == null ? null : asString(res['ticket_name']),
        amountPaid: asDouble(res['amount_paid']), // SERVER price
        paymentMethod: asString(res['payment_method'], methodKey),
        checkedIn: asBool(res['checked_in']),
      );
      receipt = r;
      return r;
    }

    // status == 'error' (or anything unexpected): surface the server message
    // plainly. "Not authorised for this event" maps to a friendly auth failure.
    final msg = asString(res['message'], 'Could not complete the sale.');
    if (msg.contains('Not authorised')) {
      throw const WalkInSaleException(WalkInFailure.notAuthorised);
    }
    throw WalkInSaleException(WalkInFailure.generic, msg);
  }
}
