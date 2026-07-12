/**
 * Builds the PostgREST `.or()` filter for "registrations this user owns".
 *
 * Owned = same user_id, OR same NON-EMPTY attendee_email. The empty-email case
 * is the important one: if a user's account has no email, a naive
 * `attendee_email.eq.${email}` becomes `attendee_email.eq.` which matches every
 * registration with a blank email — leaking other people's tickets. This helper
 * omits the email clause entirely when there's no email, and strips characters
 * that could break the comma-separated `.or()` grammar.
 */
export function registrationOwnershipFilter(userId: string, email: string | null | undefined): string {
  const parts = [`user_id.eq.${userId}`];
  const clean = (email ?? '').trim().toLowerCase();
  // A real email never contains these; drop the clause if anything looks off.
  if (clean && !/[(),"']/.test(clean)) {
    parts.push(`attendee_email.eq.${clean}`);
  }
  return parts.join(',');
}
