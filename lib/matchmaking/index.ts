import Anthropic from '@anthropic-ai/sdk';

export interface AttendeeProfile {
  registration_id: string;
  attendee_name: string;
  /** Custom fields from the registration form (role, company, interests, etc.) */
  attendee_data: Record<string, string | string[] | boolean | number>;
}

export interface MatchSuggestion {
  registration_id: string;
  matched_registration_id: string;
  score: number; // 0–100
  reason: string; // 1–2 sentence plain-English explanation
}

interface MatchResult {
  matches: Array<{
    id_a: string;
    id_b: string;
    score: number;
    reason: string;
  }>;
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Generate match suggestions for a list of attendees using Claude.
 * Returns up to `maxMatchesPerAttendee` suggestions per attendee.
 * Deduplicates bidirectional pairs (A↔B counted once).
 */
export async function generateMatches(
  attendees: AttendeeProfile[],
  eventName: string,
  maxMatchesPerAttendee = 3
): Promise<MatchSuggestion[]> {
  if (attendees.length < 2) return [];

  const profileSummaries = attendees.map(a => ({
    id: a.registration_id,
    name: a.attendee_name,
    ...a.attendee_data,
  }));

  const prompt = `You are an expert networking matchmaker for professional events.

Event: ${eventName}

Attendee profiles (JSON):
${JSON.stringify(profileSummaries, null, 2)}

Task:
- Analyse each attendee's role, company, interests, and goals from their profile data.
- Suggest up to ${maxMatchesPerAttendee} high-quality networking matches per attendee.
- Prioritise complementary skills, shared interests, mutual benefit, and serendipitous connections.
- For each match pair, provide a score (0–100, where 100 = perfect match) and a concise 1–2 sentence reason explaining WHY they should meet — be specific, not generic.
- Only include pairs that would genuinely benefit from meeting. Do not pad with weak matches.
- Do NOT repeat the same pair (A↔B and B↔A count as one).

Return ONLY valid JSON in this exact shape, no markdown, no commentary:
{
  "matches": [
    { "id_a": "<uuid>", "id_b": "<uuid>", "score": 85, "reason": "Both are product managers focused on fintech growth hacking — Alice's B2B experience complements Bob's consumer background." },
    ...
  ]
}`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = message.content[0].type === 'text' ? message.content[0].text : '';
  let parsed: MatchResult;

  try {
    parsed = JSON.parse(raw.trim()) as MatchResult;
  } catch {
    // Try extracting JSON from response if wrapped in prose
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Claude returned non-JSON response for matchmaking');
    parsed = JSON.parse(match[0]) as MatchResult;
  }

  // Validate and flatten into bidirectional suggestions
  const suggestions: MatchSuggestion[] = [];
  const seen = new Set<string>();

  for (const m of parsed.matches ?? []) {
    if (!m.id_a || !m.id_b || m.id_a === m.id_b) continue;
    const key = [m.id_a, m.id_b].sort().join(':');
    if (seen.has(key)) continue;
    seen.add(key);

    suggestions.push({
      registration_id: m.id_a,
      matched_registration_id: m.id_b,
      score: Math.min(100, Math.max(0, Math.round(m.score ?? 0))),
      reason: m.reason ?? '',
    });
  }

  return suggestions;
}

/**
 * Generate matches for a single attendee against a pool of others.
 * Useful for on-demand "who should I meet?" requests.
 */
export async function generateMatchesForOne(
  target: AttendeeProfile,
  pool: AttendeeProfile[],
  eventName: string,
  maxMatches = 5
): Promise<MatchSuggestion[]> {
  const others = pool.filter(p => p.registration_id !== target.registration_id);
  if (!others.length) return [];

  const targetSummary = { id: target.registration_id, name: target.attendee_name, ...target.attendee_data };
  const poolSummaries = others.map(a => ({ id: a.registration_id, name: a.attendee_name, ...a.attendee_data }));

  const prompt = `You are an expert networking matchmaker for professional events.

Event: ${eventName}

Target attendee:
${JSON.stringify(targetSummary, null, 2)}

Other attendees:
${JSON.stringify(poolSummaries, null, 2)}

Task:
- Find the top ${maxMatches} best networking matches for the target attendee from the pool.
- Rank by potential mutual value. Explain each match in 1–2 specific sentences.
- Score each match 0–100.

Return ONLY valid JSON, no markdown:
{
  "matches": [
    { "id_b": "<uuid of matched attendee>", "score": 90, "reason": "..." },
    ...
  ]
}`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = message.content[0].type === 'text' ? message.content[0].text : '';
  let parsed: { matches: Array<{ id_b: string; score: number; reason: string }> };

  try {
    parsed = JSON.parse(raw.trim());
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Claude returned non-JSON response');
    parsed = JSON.parse(match[0]);
  }

  return (parsed.matches ?? [])
    .filter(m => m.id_b && m.id_b !== target.registration_id)
    .slice(0, maxMatches)
    .map(m => ({
      registration_id: target.registration_id,
      matched_registration_id: m.id_b,
      score: Math.min(100, Math.max(0, Math.round(m.score ?? 0))),
      reason: m.reason ?? '',
    }));
}
