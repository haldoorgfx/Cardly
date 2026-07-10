/// Pure entitlement-state logic for the attendee entitlement view (E03).
///
/// Mirrors the server contract in migration 065_entitlements.sql:
///  - "held"  = ticket-type inclusion (+1) + granted - revoked - transferred > 0
///  - "active" redemptions = (action='redeemed' AND status='redeemed') minus
///    (action='un_redeemed'), scoped to the day for `once_per_day`.
///
/// No Flutter imports — this file is unit-testable on its own.

enum EntLimit { once, oncePerDay, unlimited }

EntLimit entLimitFrom(String? s) {
  switch (s) {
    case 'once_per_day':
      return EntLimit.oncePerDay;
    case 'unlimited':
      return EntLimit.unlimited;
    default:
      return EntLimit.once;
  }
}

/// Redemption limit in plain words.
String entLimitWords(EntLimit l) {
  switch (l) {
    case EntLimit.once:
      return 'Once';
    case EntLimit.oncePerDay:
      return 'Once per day';
    case EntLimit.unlimited:
      return 'Unlimited';
  }
}

enum EntStatus { available, redeemed, expired, notYetValid }

DateTime? _date(dynamic v) =>
    v == null ? null : DateTime.tryParse(v.toString());

String _str(dynamic v, [String fallback = '']) =>
    v == null ? fallback : v.toString();

/// An entitlement definition (subset of `entitlements` the attendee may read).
class Entitlement {
  final String id;
  final String name;

  /// entry|meal|session|merch|transport|access|parking|certificate
  final String type;
  final EntLimit limit;
  final DateTime? validFrom;
  final DateTime? validUntil;

  const Entitlement({
    required this.id,
    required this.name,
    required this.type,
    required this.limit,
    this.validFrom,
    this.validUntil,
  });

  factory Entitlement.fromMap(Map<String, dynamic> m) => Entitlement(
        id: _str(m['id']),
        name: _str(m['name'], 'Pass'),
        type: _str(m['type'], 'access'),
        limit: entLimitFrom(m['redemption_limit']?.toString()),
        validFrom: _date(m['valid_from']),
        validUntil: _date(m['valid_until']),
      );
}

/// One row of the append-only redemption ledger (attendee reads their own).
class LedgerRow {
  final String entitlementId;
  final String action; // redeemed|un_redeemed|granted|revoked|transferred|extended
  final String status;
  final DateTime? redeemedAt;
  final int? dayIndex;

  const LedgerRow({
    required this.entitlementId,
    required this.action,
    required this.status,
    this.redeemedAt,
    this.dayIndex,
  });

  factory LedgerRow.fromMap(Map<String, dynamic> m) => LedgerRow(
        entitlementId: _str(m['entitlement_id']),
        action: _str(m['action']),
        status: _str(m['status']),
        redeemedAt: _date(m['redeemed_at']),
        dayIndex: m['day_index'] is num
            ? (m['day_index'] as num).toInt()
            : int.tryParse('${m['day_index']}'),
      );
}

/// Does this registration currently HOLD this entitlement?
/// Mirrors `_entitlement_held` in 065: base inclusion counts as +1 so a
/// revoke or transfer-away can cancel it out.
bool entitlementHeld({
  required bool includedByTicket,
  required Iterable<LedgerRow> pairLedger,
}) {
  var n = includedByTicket ? 1 : 0;
  for (final r in pairLedger) {
    switch (r.action) {
      case 'granted':
        n += 1;
        break;
      case 'revoked':
        n -= 1;
        break;
      case 'transferred':
        n -= 1;
        break;
    }
  }
  return n > 0;
}

/// An entitlement paired with its computed state for a registration.
class EntComputed {
  final Entitlement entitlement;
  final EntStatus status;

  /// The most recent active redemption in scope (null unless [status] is
  /// [EntStatus.redeemed]).
  final DateTime? redeemedAt;

  const EntComputed(this.entitlement, this.status, this.redeemedAt);
}

bool _sameDay(DateTime a, DateTime b) =>
    a.year == b.year && a.month == b.month && a.day == b.day;

/// Compute the attendee-facing state for one HELD entitlement from its ledger.
///
/// Precedence: a live redemption (Redeemed) is the most useful truth and wins
/// over the validity window; otherwise not-yet-valid, then expired, then
/// available. `unlimited` never reads as Redeemed — it stays Available in-window.
EntComputed computeState(
  Entitlement e,
  Iterable<LedgerRow> pairLedger,
  DateTime now,
) {
  final localNow = now.toLocal();
  final redeemed = <DateTime>[];
  var unredeemed = 0;

  for (final r in pairLedger) {
    final at = r.redeemedAt?.toLocal();
    final inScope = e.limit != EntLimit.oncePerDay ||
        (at != null && _sameDay(at, localNow));
    if (r.action == 'redeemed' && r.status == 'redeemed') {
      if (at != null && inScope) redeemed.add(at);
    } else if (r.action == 'un_redeemed') {
      if (inScope) unredeemed += 1;
    }
  }

  final activeCount = redeemed.length - unredeemed;
  final isRedeemed = e.limit != EntLimit.unlimited && activeCount > 0;

  DateTime? lastRedeemedAt;
  if (redeemed.isNotEmpty) {
    redeemed.sort();
    lastRedeemedAt = redeemed.last;
  }

  final notYet =
      e.validFrom != null && localNow.isBefore(e.validFrom!.toLocal());
  final expired =
      e.validUntil != null && localNow.isAfter(e.validUntil!.toLocal());

  EntStatus status;
  if (isRedeemed) {
    status = EntStatus.redeemed;
  } else if (notYet) {
    status = EntStatus.notYetValid;
  } else if (expired) {
    status = EntStatus.expired;
  } else {
    status = EntStatus.available;
  }

  return EntComputed(e, status, isRedeemed ? lastRedeemedAt : null);
}

/// From the raw rows an attendee is allowed to read (RLS: entitlement
/// definitions + ticket-type inclusions for events they attend, plus their OWN
/// redemption ledger), compute the entitlements they currently HOLD, each with
/// its attendee-facing state. Pure — no I/O, unit-testable.
///
/// [includedEntitlementIds] are the ids linked to the registration's
/// ticket_type via `ticket_type_entitlements` (base inclusion). [ledger] is the
/// registration's full `entitlement_redemptions` history across all
/// entitlements. Result is sorted by type then name (mirrors `order by e.type`).
List<EntComputed> computeHeldEntitlements({
  required Iterable<Entitlement> all,
  required Set<String> includedEntitlementIds,
  required Iterable<LedgerRow> ledger,
  required DateTime now,
}) {
  final byEnt = <String, List<LedgerRow>>{};
  for (final r in ledger) {
    (byEnt[r.entitlementId] ??= <LedgerRow>[]).add(r);
  }

  final out = <EntComputed>[];
  for (final e in all) {
    final pair = byEnt[e.id] ?? const <LedgerRow>[];
    final held = entitlementHeld(
      includedByTicket: includedEntitlementIds.contains(e.id),
      pairLedger: pair,
    );
    if (!held) continue;
    out.add(computeState(e, pair, now));
  }

  out.sort((a, b) {
    final t = a.entitlement.type.compareTo(b.entitlement.type);
    return t != 0
        ? t
        : a.entitlement.name
            .toLowerCase()
            .compareTo(b.entitlement.name.toLowerCase());
  });
  return out;
}
