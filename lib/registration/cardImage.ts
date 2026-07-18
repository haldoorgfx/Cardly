/**
 * Helpers for turning a `registrations.eventera_card_url` into something the UI
 * can actually show and download.
 *
 * `eventera_card_url` is inconsistent by design: usually a direct Supabase
 * storage PNG URL, but the owner-registration path stores a page path of the
 * form `/c/{slug}/card/{uuid}`. Feeding that page path to an <img> or a download
 * link renders broken / downloads HTML — so callers must resolve it first.
 *
 * This file has NO server-only imports, so it is safe to use from both server
 * components (pass in the admin client) and client components (cardDownloadUrl).
 */

/**
 * Resolve a raw `eventera_card_url` to the actual card image URL, or null.
 * Pass the caller's admin Supabase client so this stays import-safe everywhere.
 */
export async function resolveCardImageUrl(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  raw: string | null | undefined,
): Promise<string | null> {
  if (!raw) return null;
  // Direct storage URL — use as-is.
  if (raw.startsWith('http')) return raw;
  // Page path `/c/{slug}/card/{uuid}` — look up the generated card's PNG.
  const match = raw.match(/\/card\/([0-9a-f-]{36})$/);
  if (!match) return null;
  const { data } = await admin
    .from('generated_cards')
    .select('output_url')
    .eq('id', match[1])
    .single();
  return (data?.output_url as string | undefined) ?? null;
}

/**
 * Build a URL that actually triggers a file download. The browser's `download`
 * attribute is ignored for cross-origin resources, so for a Supabase storage
 * URL we append `?download`, which makes Supabase send it as an attachment.
 * Same-origin `data:`/`blob:` URLs already honor `download`, so pass through.
 */
export function cardDownloadUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  if (!imageUrl.startsWith('http')) return imageUrl;
  return imageUrl.includes('?') ? `${imageUrl}&download` : `${imageUrl}?download`;
}
