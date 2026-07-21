import { createAdminClient } from '@/lib/supabase/server';

type Admin = ReturnType<typeof createAdminClient>;

/**
 * Resolve which of the supplied registrations belong to attendees who opted OUT
 * of the attendee directory (`profiles.directory_visible === false`).
 *
 * The opt-out lives on the profile, but networking works in registration space,
 * so every caller has to hop registration -> user_id -> profile. That hop was
 * open-coded in the directory route and the speed-networking deck but MISSING
 * from matchmaking, which is how an attendee who had switched themselves off
 * still surfaced (name + custom fields) inside other people's "Suggested for
 * you". Centralised here so the three networking surfaces cannot drift again.
 *
 * Registrations with no linked account are always visible — a guest has no
 * profile-level preference to honour.
 *
 * @returns the subset of `registrationIds` that must NOT be shown to peers.
 */
export async function hiddenRegistrationIds(
  admin: Admin,
  registrationIds: string[],
): Promise<Set<string>> {
  const hidden = new Set<string>();
  if (registrationIds.length === 0) return hidden;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: regs } = await (admin as any)
    .from('registrations')
    .select('id, user_id')
    .in('id', registrationIds);

  const rows = (regs ?? []) as { id: string; user_id: string | null }[];
  const userIds = Array.from(
    new Set(rows.map(r => r.user_id).filter((u): u is string => !!u)),
  );
  if (userIds.length === 0) return hidden;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profs } = await (admin as any)
    .from('profiles')
    .select('id, directory_visible')
    .in('id', userIds);

  const hiddenUsers = new Set<string>();
  for (const p of (profs ?? []) as { id: string; directory_visible: boolean | null }[]) {
    if (p.directory_visible === false) hiddenUsers.add(p.id);
  }
  if (hiddenUsers.size === 0) return hidden;

  for (const r of rows) {
    if (r.user_id && hiddenUsers.has(r.user_id)) hidden.add(r.id);
  }
  return hidden;
}
