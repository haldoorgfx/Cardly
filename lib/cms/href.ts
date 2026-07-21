/**
 * lib/cms/href.ts
 *
 * Safe `href` handling for CMS block content.
 *
 * WHY THIS EXISTS: block content is free-form JSON authored in the admin
 * editor and rendered straight into `<Link href>` / `<a href>`. Two distinct
 * failure modes were proven by exercising every block against degenerate
 * input:
 *
 *  1. XSS — `javascript:alert(1)` stored in a button's `href` reached the
 *     rendered DOM in 8 of 21 blocks. Stored once by anyone who can edit
 *     content, executed for every later visitor.
 *  2. CRASH — a missing `href` (`{}` in a `buttons` array) makes `next/link`
 *     throw, and a server-rendered throw takes the WHOLE page down, not just
 *     the block.
 *
 * `safeExternalUrl` from `lib/url/safeUrl` is the repo's one URL validator and
 * does the scheme work here — but it is deliberately absolute-only, so a bare
 * `/pricing` comes back as `https://pricing/`. CMS links are overwhelmingly
 * internal, so this wrapper adds exactly one thing: same-origin paths and
 * in-page anchors pass through untouched, and everything else is delegated.
 * It is NOT a second validator — no scheme logic lives here.
 */

import { safeExternalUrl } from '@/lib/url/safeUrl';
import type { CtaButton } from './types';

/**
 * Normalise an authored `href` to something safe to render, or `null`.
 *
 * `null` means "render no link at all" — never fall back to the raw value,
 * which would reintroduce the sink.
 */
export function safeBlockHref(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  // In-page anchor. `#` alone is not a destination.
  if (trimmed.startsWith('#')) return trimmed.length > 1 ? trimmed : null;

  // Same-origin path. `//host` is protocol-relative — that is an EXTERNAL
  // destination wearing a leading slash, so it must go through the scheme
  // check rather than being waved through as a local path.
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed;

  return safeExternalUrl(trimmed);
}

/**
 * Safe `src` for authored media (`<img>`, `<video>`). Same rules as
 * {@link safeBlockHref}; anchors are meaningless for a media source.
 */
export function safeBlockSrc(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed;
  return safeExternalUrl(trimmed);
}

/**
 * `href` for the contactChannels block, which is the ONE place in the CMS
 * where `mailto:`/`tel:` are a legitimate destination — the block exists to
 * render "email us" / "call us" cards and even strips the `mailto:` prefix for
 * display.
 *
 * `safeExternalUrl` deliberately refuses those schemes so it keeps exactly one
 * meaning everywhere else, so the allowance is made here, explicitly, for this
 * block only. Everything that is not `mailto:`/`tel:` is delegated to
 * {@link safeBlockHref} — no scheme logic is duplicated.
 */
export function safeContactHref(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  if (lower.startsWith('mailto:') || lower.startsWith('tel:')) {
    // Reject whitespace and control characters, which are how a header/attribute
    // injection would be smuggled through, and require a non-empty target.
    const target = trimmed.slice(trimmed.indexOf(':') + 1);
    if (!target || Array.from(trimmed).some((ch) => ch <= ' ' || ch === '"' || ch === "'" || ch === '<' || ch === '>')) return null;
    return trimmed;
  }

  return safeBlockHref(trimmed);
}

/**
 * Filter an authored CTA button array down to the ones that can actually be
 * rendered as a link, carrying the normalised href alongside.
 *
 * Dropping is the right behaviour: a button with no usable destination is not
 * a button, and rendering it as a dead `<a>` would be exactly the "looks
 * populated, leads nowhere" problem this content area already has.
 */
export function linkableButtons(
  buttons: CtaButton[] | undefined | null,
): Array<CtaButton & { safeHref: string }> {
  if (!Array.isArray(buttons)) return [];
  return buttons.flatMap((b) => {
    const safeHref = safeBlockHref(b?.href);
    return safeHref ? [{ ...b, safeHref }] : [];
  });
}
