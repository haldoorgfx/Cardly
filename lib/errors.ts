/**
 * Turn raw/technical errors (Postgres, Supabase, network) into calm,
 * human-readable messages safe to show end-users. Never leak SQL,
 * constraint names, or stack traces to the UI.
 */

const FRIENDLY_BY_CONSTRAINT: Record<string, string> = {
  registrations_event_email_unique: 'This email is already registered for this event.',
  registrations_qr_code_token_key: 'Could not generate a unique badge — please try again.',
};

const PATTERN_RULES: { test: RegExp; message: string }[] = [
  { test: /duplicate key value|already exists|unique constraint/i, message: 'This already exists.' },
  { test: /violates foreign key|foreign key constraint/i, message: 'Something it depends on is missing. Please refresh and try again.' },
  { test: /violates not-null|null value in column/i, message: 'Please fill in all required fields.' },
  { test: /value too long/i, message: 'One of the fields is too long.' },
  { test: /invalid input syntax|invalid text representation/i, message: "That doesn't look right — please check your entry." },
  { test: /permission denied|row-level security|not authorized|unauthorized/i, message: "You don't have permission to do that." },
  { test: /timeout|timed out/i, message: 'The request took too long. Please try again.' },
  { test: /network|fetch failed|failed to fetch/i, message: 'Connection problem — please check your network and try again.' },
];

/**
 * Map a raw error (string, Error, or Supabase error object) to a friendly message.
 * Pass a `fallback` to control the generic case.
 */
export function humanizeError(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const raw =
    typeof err === 'string'
      ? err
      : err && typeof err === 'object' && 'message' in err
        ? String((err as { message: unknown }).message ?? '')
        : '';

  if (!raw) return fallback;

  // Named constraint match (most specific)
  for (const [constraint, message] of Object.entries(FRIENDLY_BY_CONSTRAINT)) {
    if (raw.includes(constraint)) return message;
  }

  // Pattern match
  for (const { test, message } of PATTERN_RULES) {
    if (test.test(raw)) return message;
  }

  // If the raw message already looks human (no SQL/technical noise), pass it through.
  const looksTechnical = /constraint|syntax|column|relation|pg_|null value|key value|::/i.test(raw);
  if (!looksTechnical && raw.length < 160) return raw;

  return fallback;
}
