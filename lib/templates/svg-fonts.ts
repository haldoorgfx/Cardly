// Server-only: injects the brand fonts into a template SVG as base64 @font-face
// rules so sharp's librsvg backend can rasterise the baked static text.
//
// Why this exists: `lib/templates/svgs.ts` is shared with the browser (which has
// the brand webfonts loaded), but on the server the SVG rasteriser has NO fonts
// on its fontconfig path, so any <text> came out as tofu (missing-glyph boxes).
// Embedding the fonts directly into the SVG makes them resolvable everywhere.
// Verified: rsvg/pango honour data-URI @font-face.
import { FONT_DATA } from '@/lib/fonts/embedded-font-data';

// key prefix in FONT_DATA -> CSS font-family used in svgs.ts
const FAMILY_BY_PREFIX: Record<string, string> = {
  dmsans: 'DM Sans',
  jetbrainsmono: 'JetBrains Mono',
  inter: 'Inter',
  notosansarabic: 'Noto Sans Arabic',
};

function buildFontFaceCss(): string {
  const rules: string[] = [];
  for (const [key, b64] of Object.entries(FONT_DATA)) {
    const dash = key.lastIndexOf('-');
    const prefix = key.slice(0, dash);
    const weight = key.slice(dash + 1);
    const family = FAMILY_BY_PREFIX[prefix];
    if (!family || !b64) continue;
    rules.push(
      `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};` +
        `src:url(data:font/ttf;base64,${b64}) format('truetype');}`,
    );
  }
  return rules.join('');
}

// Built once per cold start (the base64 payload is large).
let cachedStyle: string | null = null;
function fontStyleBlock(): string {
  if (cachedStyle === null) {
    cachedStyle = `<style type="text/css">${buildFontFaceCss()}</style>`;
  }
  return cachedStyle;
}

/**
 * Inserts the brand @font-face block immediately after the opening <svg …> tag
 * so the fonts are available to the rasteriser. No-op if there is no <svg> tag.
 */
export function injectSvgFonts(svg: string): string {
  const m = svg.match(/<svg[^>]*>/);
  if (!m) return svg;
  const insertAt = m.index! + m[0].length;
  return svg.slice(0, insertAt) + fontStyleBlock() + svg.slice(insertAt);
}
