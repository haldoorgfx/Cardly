/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/server";

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface Team {
  id: string;
  owner_id: string;
  name: string;
  created_at: string;
}

export interface TeamMember {
  team_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profile: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
}

export interface TeamInvite {
  id: string;
  team_id: string;
  email: string;
  role: string;
  token: string;
  invited_by: string | null;
  created_at: string;
  accepted_at: string | null;
  expires_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function throwOnError<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  if (data === null) throw new Error("No data returned");
  return data;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Get the team owned by or joined by a user.
 * Returns null when the user has no team.
 */
export async function getMyTeam(userId: string): Promise<Team | null> {
  const db = createAdminClient();

  // Check direct membership first (covers owner + member)
  const { data: membership } = await (db as any)
    .from("team_members")
    .select("team_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership) return null;

  const { data, error } = await (db as any)
    .from("teams")
    .select("id, owner_id, name, created_at")
    .eq("id", membership.team_id)
    .single();

  if (error) return null;
  return data as Team;
}

/**
 * Get all members of a team including their profile data.
 */
export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  const db = createAdminClient();

  const { data, error } = await (db as any)
    .from("team_members")
    .select(
      `team_id, user_id, role, joined_at,
       profiles ( full_name, email, avatar_url )`
    )
    .eq("team_id", teamId)
    .order("joined_at", { ascending: true });

  throwOnError(data, error);

  return (data as any[]).map((row: any) => ({
    team_id: row.team_id,
    user_id: row.user_id,
    role: row.role,
    joined_at: row.joined_at,
    profile: {
      full_name: row.profiles?.full_name ?? null,
      email: row.profiles?.email ?? null,
      avatar_url: row.profiles?.avatar_url ?? null,
    },
  }));
}

/**
 * Get all pending (not yet accepted) invites for a team.
 */
export async function getTeamInvites(teamId: string): Promise<TeamInvite[]> {
  const db = createAdminClient();

  const { data, error } = await (db as any)
    .from("team_invites")
    .select("id, team_id, email, role, token, invited_by, created_at, accepted_at, expires_at")
    .eq("team_id", teamId)
    .is("accepted_at", null)
    .order("created_at", { ascending: false });

  throwOnError(data, error);
  return data as TeamInvite[];
}

/**
 * Create a new team.
 * - Inserts into `teams`
 * - Adds the owner as a team_members row with role 'owner'
 * - Sets profiles.team_id for the owner
 */
export async function createTeam(ownerId: string, name: string): Promise<Team> {
  const db = createAdminClient();

  // 1. Create the team row
  const { data: team, error: teamError } = await (db as any)
    .from("teams")
    .insert({ owner_id: ownerId, name })
    .select("id, owner_id, name, created_at")
    .single();

  throwOnError(team, teamError);
  const newTeam = team as Team;

  // 2. Add owner as a member with role 'owner'
  const { error: memberError } = await (db as any)
    .from("team_members")
    .insert({ team_id: newTeam.id, user_id: ownerId, role: "owner" });

  if (memberError) throw new Error(memberError.message);

  // 3. Set profiles.team_id
  const { error: profileError } = await (db as any)
    .from("profiles")
    .update({ team_id: newTeam.id })
    .eq("id", ownerId);

  if (profileError) throw new Error(profileError.message);

  return newTeam;
}

/**
 * Create an invite record for the given email address.
 * The caller is responsible for building the invite link from `invite.token`.
 */
export async function createInvite(
  teamId: string,
  email: string,
  role: "admin" | "member",
  invitedBy: string
): Promise<TeamInvite> {
  const db = createAdminClient();

  const { data, error } = await (db as any)
    .from("team_invites")
    .insert({ team_id: teamId, email, role, invited_by: invitedBy })
    .select(
      "id, team_id, email, role, token, invited_by, created_at, accepted_at, expires_at"
    )
    .single();

  throwOnError(data, error);
  return data as TeamInvite;
}

/**
 * Accept an invite by its token.
 * - Validates the invite exists, is not expired, and is not already accepted
 * - Creates a team_members row for the user
 * - Updates profiles.team_id
 * - Marks the invite as accepted
 */
export async function acceptInvite(
  token: string,
  userId: string
): Promise<{ teamId: string }> {
  const db = createAdminClient();

  // 1. Find the invite
  const { data: invite, error: inviteError } = await (db as any)
    .from("team_invites")
    .select("id, team_id, role, accepted_at, expires_at")
    .eq("token", token)
    .single();

  if (inviteError || !invite) throw new Error("Invite not found.");

  const row = invite as { id: string; team_id: string; accepted_at: string | null; expires_at: string };

  if (row.accepted_at) throw new Error("Invite has already been accepted.");
  if (new Date(row.expires_at) < new Date()) throw new Error("Invite has expired.");

  // 2. Add the user as a team member
  const { error: memberError } = await (db as any)
    .from("team_members")
    .insert({ team_id: row.team_id, user_id: userId, role: invite.role ?? "member" });

  if (memberError) throw new Error(memberError.message);

  // 3. Update profiles.team_id
  const { error: profileError } = await (db as any)
    .from("profiles")
    .update({ team_id: row.team_id })
    .eq("id", userId);

  if (profileError) throw new Error(profileError.message);

  // 4. Mark the invite as accepted
  const { error: acceptError } = await (db as any)
    .from("team_invites")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", row.id);

  if (acceptError) throw new Error(acceptError.message);

  return { teamId: row.team_id };
}

/**
 * Remove a member from a team and clear their profiles.team_id.
 */
export async function removeMember(teamId: string, userId: string): Promise<void> {
  const db = createAdminClient();

  const { error: memberError } = await (db as any)
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("user_id", userId);

  if (memberError) throw new Error(memberError.message);

  const { error: profileError } = await (db as any)
    .from("profiles")
    .update({ team_id: null })
    .eq("id", userId)
    .eq("team_id", teamId); // only clear if they're still on this team

  if (profileError) throw new Error(profileError.message);
}

/**
 * Update a member's role within a team.
 */
export async function updateMemberRole(
  teamId: string,
  userId: string,
  role: "admin" | "member"
): Promise<void> {
  const db = createAdminClient();

  const { error } = await (db as any)
    .from("team_members")
    .update({ role })
    .eq("team_id", teamId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}

/**
 * Delete a team. Cascade in the DB handles team_members and team_invites.
 * Also clears profiles.team_id for all former members.
 */
export async function deleteTeam(teamId: string): Promise<void> {
  const db = createAdminClient();

  // Clear profiles.team_id before cascade removes team_members rows
  const { error: profileError } = await (db as any)
    .from("profiles")
    .update({ team_id: null })
    .eq("team_id", teamId);

  if (profileError) throw new Error(profileError.message);

  const { error } = await (db as any)
    .from("teams")
    .delete()
    .eq("id", teamId);

  if (error) throw new Error(error.message);
}
