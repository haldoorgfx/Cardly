// Entitlement scan result states — E05–E08 + error.
//
// These are the ONLY dark surfaces in the organizer app (MOBILE_DESIGN_LAW §8):
// full-screen `AppColors.forestDark` with a single dominant status colour.
// Everything the server decides comes back on the `redeem_entitlement` RPC; this
// file renders it and does ZERO eligibility logic of its own.
//
// PRIVACY RULE (§8): dietary information renders on MEAL scans only. The guard is
// `entitlement.isMeal` — never relax it.

import 'package:flutter/material.dart';

import '../../ui/tokens.dart';

/// A single entitlement definition (row of `public.entitlements`).
class EntitlementDef {
  final String id;
  final String name;
  final String type; // entry|meal|session|merch|transport|access|parking|certificate
  final String redemptionLimit; // once|once_per_day|unlimited
  final DateTime? validFrom;
  final DateTime? validUntil;

  const EntitlementDef({
    required this.id,
    required this.name,
    required this.type,
    required this.redemptionLimit,
    this.validFrom,
    this.validUntil,
  });

  factory EntitlementDef.fromMap(Map<String, dynamic> m) => EntitlementDef(
        id: (m['id'] ?? '').toString(),
        name: (m['name'] ?? 'Untitled').toString(),
        type: (m['type'] ?? 'entry').toString(),
        redemptionLimit: (m['redemption_limit'] ?? 'once').toString(),
        validFrom: DateTime.tryParse((m['valid_from'] ?? '').toString()),
        validUntil: DateTime.tryParse((m['valid_until'] ?? '').toString()),
      );

  bool get isMeal => type == 'meal';

  IconData get icon {
    switch (type) {
      case 'meal':
        return Icons.restaurant_outlined;
      case 'session':
        return Icons.event_seat_outlined;
      case 'merch':
        return Icons.shopping_bag_outlined;
      case 'transport':
        return Icons.directions_bus_outlined;
      case 'access':
        return Icons.vpn_key_outlined;
      case 'parking':
        return Icons.local_parking_outlined;
      case 'certificate':
        return Icons.workspace_premium_outlined;
      case 'entry':
      default:
        return Icons.login_outlined;
    }
  }

  String get limitLabel {
    switch (redemptionLimit) {
      case 'once_per_day':
        return 'Once per day';
      case 'unlimited':
        return 'Unlimited';
      case 'once':
      default:
        return 'Once';
    }
  }
}

/// Parsed shape of the `redeem_entitlement` RPC response.
///
/// When [offline] is true the result is PROVISIONAL — it was resolved against
/// the local cache and queued, not confirmed by the server. The UI labels these
/// (OFFLINE pill + "will sync when online") and never claims a verified status.
class EntitlementScanResult {
  // Online statuses: redeemed|already|not_entitled|outside_window|error
  // Offline statuses add: offline_unverified|not_in_cache
  final String status;
  final String? name;
  final String? ticket;
  final List<Map<String, dynamic>> history;
  final List<Map<String, dynamic>> held;
  final List<String> dietary;
  final String? dietaryNote;
  final String? message;
  final bool offline; // provisional, cache-resolved + queued (never server-confirmed)

  const EntitlementScanResult({
    required this.status,
    this.name,
    this.ticket,
    this.history = const [],
    this.held = const [],
    this.dietary = const [],
    this.dietaryNote,
    this.message,
    this.offline = false,
  });

  factory EntitlementScanResult.error(String message) =>
      EntitlementScanResult(status: 'error', message: message);

  /// Offline: token resolved + ticket covers the entitlement → provisional
  /// check-in, queued for sync. [dietary]/[dietaryNote] are supplied by the
  /// scanner ONLY for meal entitlements (D04) so the caterer's pill renders
  /// offline exactly as it does online; the view still gates on entitlement.isMeal.
  factory EntitlementScanResult.offlineCheckedIn({
    String? name,
    String? ticket,
    List<String> dietary = const [],
    String? dietaryNote,
  }) =>
      EntitlementScanResult(
        status: 'redeemed',
        name: name,
        ticket: ticket,
        dietary: dietary,
        dietaryNote: dietaryNote,
        offline: true,
      );

  /// Offline: token resolved but the ticket does not obviously cover it (a grant
  /// may exist). Queued so the server decides — we do NOT deny it here.
  factory EntitlementScanResult.offlineUnverified({
    String? name,
    String? ticket,
    List<String> dietary = const [],
    String? dietaryNote,
  }) =>
      EntitlementScanResult(
        status: 'offline_unverified',
        name: name,
        ticket: ticket,
        dietary: dietary,
        dietaryNote: dietaryNote,
        offline: true,
      );

  /// Offline: already scanned on THIS device (local duplicate guard).
  factory EntitlementScanResult.offlineAlready({String? name, String? ticket}) =>
      EntitlementScanResult(status: 'already', name: name, ticket: ticket, offline: true);

  /// Offline: the token is not in the downloaded cache — cannot verify at all.
  factory EntitlementScanResult.notInCache() =>
      const EntitlementScanResult(status: 'not_in_cache', offline: true);

  factory EntitlementScanResult.fromRpc(dynamic raw) {
    final m = (raw is Map) ? Map<String, dynamic>.from(raw) : <String, dynamic>{};
    final attendee =
        (m['attendee'] is Map) ? Map<String, dynamic>.from(m['attendee']) : const {};
    final dietaryObj =
        (m['dietary'] is Map) ? Map<String, dynamic>.from(m['dietary']) : const {};

    List<Map<String, dynamic>> mapList(dynamic v) => (v is List)
        ? v.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
        : <Map<String, dynamic>>[];

    return EntitlementScanResult(
      status: (m['status'] ?? 'error').toString(),
      name: attendee['name']?.toString(),
      ticket: attendee['ticket']?.toString(),
      history: mapList(m['redemption_history']),
      held: mapList(m['held_entitlements']),
      dietary: _parseDietary(dietaryObj['dietary']),
      dietaryNote: dietaryObj['dietary_note']?.toString(),
      message: m['message']?.toString(),
    );
  }

  static List<String> _parseDietary(dynamic v) {
    if (v is List) {
      return v.map((e) => e.toString().trim()).where((s) => s.isNotEmpty).toList();
    }
    if (v is String && v.trim().isNotEmpty) return [v.trim()];
    return const [];
  }

  /// Earliest successful redemption on record (for E06).
  DateTime? get firstRedeemedAt {
    DateTime? best;
    for (final h in history) {
      if (h['action'] == 'redeemed' && h['status'] == 'redeemed') {
        final t = DateTime.tryParse((h['redeemed_at'] ?? '').toString());
        if (t != null && (best == null || t.isBefore(best))) best = t;
      }
    }
    return best;
  }

  /// Names of everything the attendee currently holds (for E07).
  List<String> get heldNames => held
      .map((h) => (h['name'] ?? '').toString().trim())
      .where((s) => s.isNotEmpty)
      .toList();
}

/// Full-screen dark result surface. Auto-dismiss is driven by the scanner; this
/// view also dismisses on tap.
class EntitlementScanResultView extends StatelessWidget {
  final EntitlementScanResult result;
  final EntitlementDef entitlement;
  final VoidCallback onDismiss;

  const EntitlementScanResultView({
    super.key,
    required this.result,
    required this.entitlement,
    required this.onDismiss,
  });

  @override
  Widget build(BuildContext context) {
    var (color, icon, word) = _statusVisual(result.status);
    // Offline check-in must not claim a server-verified "Redeemed".
    if (result.offline && result.status == 'redeemed') word = 'Checked in';
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onDismiss,
      child: Container(
        color: AppColors.forestDark,
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                if (result.offline) ...[
                  const _OfflineBadge(),
                  const SizedBox(height: 18),
                ],
                Container(
                  width: 92,
                  height: 92,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.16),
                    shape: BoxShape.circle,
                    border: Border.all(color: color, width: 2),
                  ),
                  child: Icon(icon, color: color, size: 48),
                ),
                const SizedBox(height: 20),
                Text(word, textAlign: TextAlign.center, style: AppText.h1.copyWith(color: color)),
                const SizedBox(height: 14),
                if (result.name != null && result.name!.isNotEmpty)
                  Text(result.name!,
                      textAlign: TextAlign.center,
                      style: AppText.h2.copyWith(color: Colors.white)),
                if (result.ticket != null && result.ticket!.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(result.ticket!,
                      textAlign: TextAlign.center,
                      style: AppText.bodySm.copyWith(color: Colors.white70)),
                ],
                const SizedBox(height: 22),
                ..._supporting(),
                const Spacer(),
                Text(
                  result.status == 'error' ? 'Tap to try again' : 'Tap to continue',
                  style: AppText.caption.copyWith(color: Colors.white54),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  /// At most two supporting facts, per §8.
  List<Widget> _supporting() {
    // Offline results are provisional — say so plainly, never claim verification.
    // A meal scan (guarded by entitlement.isMeal) still shows the caterer's
    // dietary pill from the offline cache, exactly as an online meal scan does.
    if (result.offline) {
      final showDietary = entitlement.isMeal && result.dietary.isNotEmpty;
      List<Widget> withDietary(List<Widget> facts) => showDietary
          ? [..._dietaryBlock(), const SizedBox(height: 18), ...facts]
          : facts;
      switch (result.status) {
        case 'redeemed':
          return withDietary(
              [_fact('Status', 'Checked in — will sync when online')]);
        case 'offline_unverified':
          return withDietary(
              [_fact('Status', 'Queued — server will verify when online')]);
        case 'already':
          return [_fact('Status', 'Already scanned on this device')];
        case 'not_in_cache':
        default:
          return [_fact('Status', 'Not in cache — reconnect to verify')];
      }
    }
    switch (result.status) {
      case 'redeemed':
        // Dietary renders on MEAL scans only — this is the privacy guard.
        if (entitlement.isMeal && result.dietary.isNotEmpty) {
          return _dietaryBlock();
        }
        return const [];
      case 'already':
        final t = result.firstRedeemedAt;
        return [_fact('First redeemed', t == null ? 'Earlier today' : _fmtTime(t))];
      case 'not_entitled':
        final names = result.heldNames;
        return [
          _fact('Holds', names.isEmpty ? 'No active entitlements' : names.join('  ·  ')),
        ];
      case 'outside_window':
        return [_fact('Valid', _window(entitlement))];
      case 'error':
      default:
        final msg = (result.message ?? '').trim();
        return [
          Text(msg.isEmpty ? 'Something went wrong' : msg,
              textAlign: TextAlign.center,
              style: AppText.body.copyWith(color: Colors.white)),
        ];
    }
  }

  /// The caterer's dietary pills + optional note. Rendered identically for an
  /// online meal scan and an offline (cache-resolved) meal scan. Callers gate on
  /// entitlement.isMeal before invoking this — the privacy guard is never here.
  List<Widget> _dietaryBlock() => [
        Wrap(
          alignment: WrapAlignment.center,
          spacing: 10,
          runSpacing: 10,
          children: [
            for (final d in result.dietary)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 11),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(AppRadius.pill),
                ),
                child: Text(
                  d.toUpperCase(),
                  style: AppText.bodyStrong.copyWith(
                      color: AppColors.forestDark,
                      fontSize: 22,
                      letterSpacing: 0.5),
                ),
              ),
          ],
        ),
        if ((result.dietaryNote ?? '').trim().isNotEmpty) ...[
          const SizedBox(height: 12),
          Text(result.dietaryNote!.trim(),
              textAlign: TextAlign.center,
              style: AppText.body.copyWith(color: Colors.white70)),
        ],
      ];

  Widget _fact(String label, String value) => Column(
        children: [
          Text(label.toUpperCase(),
              style: AppText.caption.copyWith(color: Colors.white54, letterSpacing: 0.4)),
          const SizedBox(height: 4),
          Text(value,
              textAlign: TextAlign.center,
              style: AppText.bodyStrong.copyWith(color: Colors.white, fontSize: 17)),
        ],
      );

  (Color, IconData, String) _statusVisual(String status) {
    switch (status) {
      case 'redeemed':
        return (AppColors.success, Icons.check_circle_rounded, 'Redeemed');
      case 'already':
        return (AppColors.warning, Icons.history_rounded, 'Already redeemed');
      case 'not_entitled':
        return (AppColors.danger, Icons.block_rounded, 'Not entitled');
      case 'outside_window':
        return (AppColors.danger, Icons.schedule_rounded, 'Outside window');
      case 'offline_unverified':
        return (AppColors.warning, Icons.cloud_queue_rounded, 'Queued');
      case 'not_in_cache':
        return (AppColors.danger, Icons.cloud_off_rounded, 'Not in cache');
      case 'error':
      default:
        return (AppColors.danger, Icons.error_outline_rounded, 'Error');
    }
  }
}

/// Small "OFFLINE" badge shown above a provisional result. Scanner dark surface,
/// so the Colors.white* precedent applies.
class _OfflineBadge extends StatelessWidget {
  const _OfflineBadge();
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.forestCard,
        borderRadius: BorderRadius.circular(AppRadius.pill),
        border: Border.all(color: AppColors.gold),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.cloud_off_rounded, size: 14, color: AppColors.gold),
          const SizedBox(width: 7),
          Text('OFFLINE',
              style: AppText.caption
                  .copyWith(color: AppColors.gold, letterSpacing: 1.0)),
        ],
      ),
    );
  }
}

const _months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

String _fmtTime(DateTime dt) {
  final l = dt.toLocal();
  final h = l.hour.toString().padLeft(2, '0');
  final m = l.minute.toString().padLeft(2, '0');
  return '${_months[l.month - 1]} ${l.day}, $h:$m';
}

String _window(EntitlementDef e) {
  final f = e.validFrom;
  final u = e.validUntil;
  if (f == null && u == null) return 'No time limit';
  if (f != null && u != null) return '${_fmtTime(f)} – ${_fmtTime(u)}';
  if (f != null) return 'From ${_fmtTime(f)}';
  return 'Until ${_fmtTime(u!)}';
}
