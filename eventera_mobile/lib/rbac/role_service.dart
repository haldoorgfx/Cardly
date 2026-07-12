import 'package:flutter/foundation.dart' show debugPrint;

import '../net.dart';

/// Mobile role resolver — the single source of truth for "what can this account
/// do, and where?", mirroring the web `lib/rbac/roles.ts`.
///
/// A Eventera account holds ONE global platform role (user / admin /
/// super_admin) on `profiles.platform_role`, plus MANY event-scoped roles
/// (attendee / speaker / sponsor / organizer / staff) stored in
/// `user_event_roles` (migration 055). The Account screen sections light up
/// only when the account holds the matching role.
///
/// Reads go through the ANON Supabase client (`supa`); migration 055 ships RLS
/// policies letting an authenticated user read their OWN `user_event_roles`
/// rows and their own `profiles.platform_role`. Everything here fails SAFE:
/// any error resolves to platformRole 'user' with no event roles — it never
/// throws, so the Account screen can never break because of role loading.

/// Event-scoped role kinds. Matches the web `EventRole` union.
class EventRoleKind {
  static const attendee = 'attendee';
  static const speaker = 'speaker';
  static const sponsor = 'sponsor';
  static const organizer = 'organizer';
  static const staff = 'staff';
}

/// Resolved role snapshot for the current account.
class UserRoles {
  /// Global platform role: 'user' | 'admin' | 'super_admin'. Default 'user'.
  final String platformRole;

  /// Distinct set of ACTIVE event-role kinds held anywhere.
  final Set<String> roleKinds;

  /// Event ids per role kind (ACTIVE only) — for building per-section lists.
  final Map<String, List<String>> eventIdsByRole;

  const UserRoles({
    required this.platformRole,
    required this.roleKinds,
    required this.eventIdsByRole,
  });

  /// Empty / safe default: an unknown account is a plain 'user' with no roles.
  const UserRoles.empty()
      : platformRole = 'user',
        roleKinds = const {},
        eventIdsByRole = const {};

  // ── Convenience getters (mirror the web nav gating predicate) ──────────────
  bool get hasSpeaking => roleKinds.contains(EventRoleKind.speaker);
  bool get hasSponsoring => roleKinds.contains(EventRoleKind.sponsor);
  bool get hasOrganizing => roleKinds.contains(EventRoleKind.organizer);
  bool get hasStaff => roleKinds.contains(EventRoleKind.staff);

  /// Admin gate — `platform_role in ('admin','super_admin')`, matching web
  /// `isAdmin()`.
  bool get isAdmin =>
      platformRole == 'admin' || platformRole == 'super_admin';

  /// Event ids where the account holds [role] (ACTIVE only).
  List<String> eventsWithRole(String role) =>
      eventIdsByRole[role] ?? const [];
}

/// Loads roles for the current authenticated user. Never throws.
class RoleService {
  const RoleService();

  /// Reads the current user's ACTIVE `user_event_roles` rows plus their
  /// `profiles.platform_role`, via the anon client (own-row RLS applies).
  /// Returns [UserRoles.empty] for signed-out users or on any error.
  Future<UserRoles> loadRoles() async {
    final uid = currentUserId;
    if (uid == null) return const UserRoles.empty();

    String platformRole = 'user';
    final kinds = <String>{};
    final byRole = <String, List<String>>{};

    // profiles.platform_role — own row via RLS.
    try {
      final row = await supa
          .from('profiles')
          .select('platform_role')
          .eq('id', uid)
          .maybeSingle();
      final pr = row == null ? null : row['platform_role'];
      if (pr is String && pr.trim().isNotEmpty) {
        platformRole = pr.trim();
      }
    } catch (e) {
      debugPrint('RoleService: platform_role load failed — $e');
    }

    // user_event_roles — own ACTIVE rows via RLS.
    try {
      final rows = await supa
          .from('user_event_roles')
          .select('event_id, role, status')
          .eq('user_id', uid)
          .eq('status', 'active');
      for (final r in (rows as List)) {
        if (r is! Map) continue;
        final role = (r['role'] ?? '').toString();
        final eventId = (r['event_id'] ?? '').toString();
        if (role.isEmpty) continue;
        kinds.add(role);
        if (eventId.isNotEmpty) {
          (byRole[role] ??= <String>[]).add(eventId);
        }
      }
    } catch (e) {
      debugPrint('RoleService: user_event_roles load failed — $e');
    }

    // Owning an event ALWAYS makes you an organizer, even if no explicit
    // user_event_roles row exists. Deriving organizer access solely from that
    // table was fragile — an event owner could lose the Organize shell if the
    // role row was never created or got cleaned up. Ownership is the source of
    // truth (events.user_id via own-row RLS).
    if (!kinds.contains(EventRoleKind.organizer)) {
      try {
        final owned = await supa
            .from('events')
            .select('id')
            .eq('user_id', uid)
            .limit(1);
        if ((owned as List).isNotEmpty) kinds.add(EventRoleKind.organizer);
      } catch (e) {
        debugPrint('RoleService: owned-events check failed — $e');
      }
    }

    return UserRoles(
      platformRole: platformRole,
      roleKinds: kinds,
      eventIdsByRole: byRole,
    );
  }
}
