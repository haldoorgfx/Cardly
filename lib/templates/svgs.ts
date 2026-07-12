/**
 * Shared SVG card builders — used by BOTH the template preview (page.tsx)
 * and the API route that rasterises to PNG via sharp.
 * Keep this file free of Node.js-only APIs so it runs in the browser too.
 */

export const W = 1080;
export const H = 1350;

export interface TextCfg {
  badge: string;
  line1: string;
  line2?: string;
  date: string;
  location: string;
  accent: string;
  hashtag: string;
  light?: boolean;
}

export interface TemplateConfig {
  name: string;
  accent: string;
  text: TextCfg;
  light?: boolean;
}

/* ── Zone positions (matched to SVG layout) ───────────────── */
export const PHOTO_CX = 540;
export const PHOTO_CY = 635;
export const PHOTO_R  = 148; // attendee photo radius
export const RING_R   = 165; // decorative ring radius

// Photo zone (for canvas editor)
export const ZONE_PHOTO = { x: PHOTO_CX - PHOTO_R, y: PHOTO_CY - PHOTO_R, w: PHOTO_R * 2, h: PHOTO_R * 2 };
// Name zone
export const ZONE_NAME  = { x: 90, y: 870, w: 900, h: 82 };
// Title zone
export const ZONE_TITLE = { x: 90, y: 960, w: 900, h: 58 };
// Org zone
export const ZONE_ORG   = { x: 90, y: 1024, w: 900, h: 50 };

/* ── CSS % positions for person overlay in browser preview ── */
export const OVERLAY = {
  photo: { cx: `${(PHOTO_CX / W * 100).toFixed(2)}%`, cy: `${(PHOTO_CY / H * 100).toFixed(2)}%`, size: `${(PHOTO_R * 2 / W * 100).toFixed(2)}%` },
  name:  { top: `${((ZONE_NAME.y  + ZONE_NAME.h  / 2) / H * 100).toFixed(2)}%` },
  title: { top: `${((ZONE_TITLE.y + ZONE_TITLE.h / 2) / H * 100).toFixed(2)}%` },
  org:   { top: `${((ZONE_ORG.y   + ZONE_ORG.h   / 2) / H * 100).toFixed(2)}%` },
};

/* ── XML escape ────────────────────────────────────────────── */
export function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/* ── Static text layer — baked into every SVG card ───────── */
export function staticText(c: TextCfg): string {
  const white  = c.light ? '#0F1F18'              : '#FFFFFF';
  const faint  = c.light ? 'rgba(0,0,0,0.20)'    : 'rgba(255,255,255,0.18)';
  const a      = c.accent;
  const fs     = 96;
  const line1Y = c.line2 ? 302 : 368;
  const line2Y = line1Y + fs + 8;

  return `
  <!-- ── BADGE ── -->
  <text x="540" y="196"
    text-anchor="middle"
    font-family="'JetBrains Mono', monospace"
    font-size="30" font-weight="700"
    fill="${a}" letter-spacing="12">
    ${esc(c.badge.toUpperCase())}
  </text>

  <!-- ── EVENT NAME ── -->
  <text x="540" y="${line1Y}"
    text-anchor="middle"
    font-family="'DM Sans', 'Noto Sans Arabic', sans-serif"
    font-size="${fs}" font-weight="700"
    fill="${white}" letter-spacing="-3">
    ${esc(c.line1)}
  </text>
  ${c.line2 ? `<text x="540" y="${line2Y}"
    text-anchor="middle"
    font-family="'DM Sans', 'Noto Sans Arabic', sans-serif"
    font-size="${fs}" font-weight="700"
    fill="${white}" letter-spacing="-3">
    ${esc(c.line2)}
  </text>` : ''}

  <!-- ── DIVIDER ── -->
  <line x1="180" y1="476" x2="900" y2="476"
    stroke="${a}" stroke-opacity="0.28" stroke-width="1.5"/>

  <!-- ── PHOTO RING ── -->
  <circle cx="${PHOTO_CX}" cy="${PHOTO_CY}" r="${RING_R}"
    fill="none" stroke="${a}" stroke-opacity="0.25" stroke-width="4"/>
  <circle cx="${PHOTO_CX}" cy="${PHOTO_CY}" r="${RING_R - 12}"
    fill="${c.light ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)'}"
    stroke="${a}" stroke-opacity="0.10" stroke-width="1.5"/>

  <!-- ── SEPARATOR ── -->
  <line x1="90" y1="1082" x2="990" y2="1082"
    stroke="${faint}" stroke-width="1"/>

  <!-- ── DATE ── -->
  <text x="390" y="1142"
    text-anchor="middle"
    font-family="'JetBrains Mono', monospace"
    font-size="28" font-weight="600"
    fill="${a}" fill-opacity="0.90" letter-spacing="4">
    ${esc(c.date)}
  </text>
  <text x="540" y="1142"
    text-anchor="middle"
    font-family="'JetBrains Mono', monospace"
    font-size="28" fill="${a}" fill-opacity="0.35">·</text>
  <text x="690" y="1142"
    text-anchor="middle"
    font-family="'JetBrains Mono', monospace"
    font-size="28" font-weight="500"
    fill="${a}" fill-opacity="0.72" letter-spacing="3">
    ${esc(c.location)}
  </text>

  <!-- ── HASHTAG ── -->
  <text x="540" y="1208"
    text-anchor="middle"
    font-family="'JetBrains Mono', monospace"
    font-size="26"
    fill="${c.light ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.28)'}"
    letter-spacing="2">
    ${esc(c.hashtag)}
  </text>

  <!-- ── EVENTERA WATERMARK ── -->
  <text x="${W - 60}" y="${H - 48}"
    text-anchor="end"
    font-family="'JetBrains Mono', monospace"
    font-size="22"
    fill="${c.light ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)'}"
    letter-spacing="5">
    MADE WITH EVENTERA
  </text>`;
}

/* ─────────────────────────────────────────────────────────────
   SVG CARD BUILDERS — one per template family
───────────────────────────────────────────────────────────── */
export function buildSVG(id: string, c: TextCfg): string {
  const t = staticText(c);

  switch (id) {
    /* ── ATF — deep purple hex ─────────────────────────── */
    case 'atf': return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="bg" x1="0%" y1="100%" x2="70%" y2="0%">
    <stop offset="0%" stop-color="#1b1240"/>
    <stop offset="42%" stop-color="#3a2068"/>
    <stop offset="82%" stop-color="#7a3a9a"/>
  </linearGradient>
  <radialGradient id="gl" cx="78%" cy="8%" r="48%">
    <stop offset="0%" stop-color="rgba(122,58,154,0.55)"/>
    <stop offset="100%" stop-color="rgba(122,58,154,0)"/>
  </radialGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<rect width="${W}" height="${H}" fill="url(#gl)"/>
${Array.from({length:10},(_,r)=>Array.from({length:9},(_,c)=>`<circle cx="${c*135+(r%2?67:0)}" cy="${r*140+70}" r="5.5" fill="rgba(255,255,255,0.08)"/>`).join('')).join('')}
<polygon points="540,110 660,178 660,314 540,382 420,314 420,178" fill="none" stroke="rgba(232,197,126,0.18)" stroke-width="9"/>
<polygon points="820,680 950,751 950,893 820,964 690,893 690,751" fill="none" stroke="rgba(232,197,126,0.10)" stroke-width="6"/>
${t}
</svg>`;

    /* ── SUNRISE — circuit/hacker ──────────────────────── */
    case 'sunrise': return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="bg" x1="0%" y1="100%" x2="70%" y2="0%">
    <stop offset="0%" stop-color="#0a2540"/>
    <stop offset="46%" stop-color="#1f4a30"/>
    <stop offset="82%" stop-color="#1f8a5b"/>
  </linearGradient>
  <radialGradient id="gl" cx="74%" cy="7%" r="42%">
    <stop offset="0%" stop-color="rgba(255,210,138,0.32)"/>
    <stop offset="100%" stop-color="rgba(255,210,138,0)"/>
  </radialGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<rect width="${W}" height="${H}" fill="url(#gl)"/>
${Array.from({length:26},(_,i)=>`<line x1="0" y1="${i*52+26}" x2="${W}" y2="${i*52+26}" stroke="rgba(255,255,255,0.025)" stroke-width="1"/>`).join('')}
<path d="M60,380 L240,380 L240,560 L400,560" fill="none" stroke="rgba(31,138,91,0.50)" stroke-width="3.5"/>
<circle cx="400" cy="560" r="11" fill="rgba(31,138,91,0.50)"/>
<circle cx="400" cy="560" r="5" fill="rgba(31,138,91,0.80)"/>
<path d="M520,220 L660,220 L660,400 L820,400 L820,560" fill="none" stroke="rgba(255,210,138,0.35)" stroke-width="3.5"/>
<circle cx="820" cy="560" r="11" fill="rgba(255,210,138,0.35)"/>
<circle cx="820" cy="560" r="5" fill="rgba(255,210,138,0.60)"/>
<path d="M80,920 L280,920 L280,1070" fill="none" stroke="rgba(31,138,91,0.28)" stroke-width="2.5"/>
<path d="M740,1020 L900,1020 L900,840 L1000,840" fill="none" stroke="rgba(255,210,138,0.22)" stroke-width="2.5"/>
${t}
</svg>`;

    /* ── STUDIO — gold film strip ──────────────────────── */
    case 'studio': return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#C9A45E"/>
    <stop offset="50%" stop-color="#1F4D3A"/>
    <stop offset="100%" stop-color="#0F1F18"/>
  </linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
${Array.from({length:13},(_,i)=>`<rect x="16" y="${i*104+52}" width="44" height="66" rx="10" fill="rgba(201,164,94,0.22)"/><rect x="22" y="${i*104+58}" width="32" height="54" rx="7" fill="rgba(0,0,0,0.38)"/>`).join('')}
<line x1="320" y1="60" x2="540" y2="420" stroke="rgba(201,164,94,0.14)" stroke-width="4"/>
<line x1="500" y1="40" x2="720" y2="400" stroke="rgba(201,164,94,0.09)" stroke-width="3"/>
${t}
</svg>`;

    /* ── DEVFEST — code brackets ───────────────────────── */
    case 'devfest': return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="bg" x1="0%" y1="100%" x2="70%" y2="0%">
    <stop offset="0%" stop-color="#0a2540"/>
    <stop offset="46%" stop-color="#1a1a80"/>
    <stop offset="82%" stop-color="#3a3aff"/>
  </linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
${Array.from({length:10},(_,r)=>Array.from({length:9},(_,c)=>`<circle cx="${c*120+60}" cy="${r*135+67}" r="5" fill="rgba(123,224,192,0.12)"/>`).join('')).join('')}
<text x="56" y="240" font-family="'JetBrains Mono',monospace" font-size="130" fill="rgba(123,224,192,0.18)" font-weight="bold">{</text>
<text x="${W-56}" y="240" text-anchor="end" font-family="'JetBrains Mono',monospace" font-size="130" fill="rgba(123,224,192,0.18)" font-weight="bold">}</text>
<text x="56" y="${H-50}" font-family="'JetBrains Mono',monospace" font-size="100" fill="rgba(123,224,192,0.14)">&lt;</text>
<text x="${W-56}" y="${H-50}" text-anchor="end" font-family="'JetBrains Mono',monospace" font-size="100" fill="rgba(123,224,192,0.14)">/&gt;</text>
${t}
</svg>`;

    /* ── GALA — diamond + gold corners ────────────────── */
    case 'gala': return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="bg" x1="0%" y1="100%" x2="70%" y2="0%">
    <stop offset="0%" stop-color="#0F1F18"/>
    <stop offset="46%" stop-color="#1e1030"/>
    <stop offset="82%" stop-color="#3a2068"/>
  </linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
${Array.from({length:6},(_,r)=>Array.from({length:6},(_,c)=>{const cx=c*185+92+(r%2?0:92);const cy=r*220+110;return `<rect x="${cx-26}" y="${cy-26}" width="52" height="52" transform="rotate(45 ${cx} ${cy})" fill="none" stroke="rgba(255,210,138,0.09)" stroke-width="1.5"/>`;}).join('')).join('')}
<line x1="60" y1="60" x2="190" y2="60" stroke="rgba(255,210,138,0.55)" stroke-width="2.5"/>
<line x1="60" y1="60" x2="60" y2="190" stroke="rgba(255,210,138,0.55)" stroke-width="2.5"/>
<circle cx="60" cy="60" r="6" fill="rgba(255,210,138,0.55)"/>
<line x1="${W-60}" y1="60" x2="${W-190}" y2="60" stroke="rgba(255,210,138,0.55)" stroke-width="2.5"/>
<line x1="${W-60}" y1="60" x2="${W-60}" y2="190" stroke="rgba(255,210,138,0.55)" stroke-width="2.5"/>
<circle cx="${W-60}" cy="60" r="6" fill="rgba(255,210,138,0.55)"/>
<line x1="60" y1="${H-60}" x2="190" y2="${H-60}" stroke="rgba(255,210,138,0.30)" stroke-width="1.5"/>
<line x1="60" y1="${H-60}" x2="60" y2="${H-190}" stroke="rgba(255,210,138,0.30)" stroke-width="1.5"/>
<line x1="${W-60}" y1="${H-60}" x2="${W-190}" y2="${H-60}" stroke="rgba(255,210,138,0.30)" stroke-width="1.5"/>
<line x1="${W-60}" y1="${H-60}" x2="${W-60}" y2="${H-190}" stroke="rgba(255,210,138,0.30)" stroke-width="1.5"/>
${t}
</svg>`;

    /* ── PULSE — music waves ───────────────────────────── */
    case 'pulse': return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="bg" x1="0%" y1="100%" x2="70%" y2="0%">
    <stop offset="0%" stop-color="#C1185B"/>
    <stop offset="46%" stop-color="#7b1040"/>
    <stop offset="90%" stop-color="#1F4D3A"/>
  </linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<path d="M0,430 Q135,355 270,430 Q405,505 540,430 Q675,355 810,430 Q945,505 1080,430" fill="none" stroke="rgba(255,210,138,0.22)" stroke-width="3.5"/>
<path d="M0,475 Q135,398 270,475 Q405,552 540,475 Q675,398 810,475 Q945,552 1080,475" fill="none" stroke="rgba(255,210,138,0.13)" stroke-width="3"/>
<path d="M0,520 Q135,443 270,520 Q405,597 540,520 Q675,443 810,520 Q945,597 1080,520" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="2"/>
<circle cx="540" cy="${H*0.7}" r="100" fill="none" stroke="rgba(255,210,138,0.16)" stroke-width="2.5"/>
<circle cx="540" cy="${H*0.7}" r="200" fill="none" stroke="rgba(255,210,138,0.09)" stroke-width="2"/>
<circle cx="540" cy="${H*0.7}" r="300" fill="none" stroke="rgba(255,210,138,0.05)" stroke-width="1.5"/>
${t}
</svg>`;

    /* ── FOUNDERS — mountains + stars ─────────────────── */
    case 'founders': return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="bg" x1="0%" y1="100%" x2="70%" y2="0%">
    <stop offset="0%" stop-color="#0a2540"/>
    <stop offset="46%" stop-color="#0d3020"/>
    <stop offset="82%" stop-color="#1F4D3A"/>
  </linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<path d="M0,980 L200,600 L380,780 L540,440 L700,720 L880,560 L1080,780 L1080,1350 L0,1350 Z" fill="rgba(31,77,58,0.26)"/>
<path d="M0,1080 L240,720 L420,860 L540,580 L660,840 L840,680 L1080,920 L1080,1350 L0,1350 Z" fill="rgba(31,77,58,0.18)"/>
${[[100,100],[260,185],[655,82],[865,155],[442,235],[935,340],[162,388],[764,408]].map(([cx,cy])=>`<circle cx="${cx}" cy="${cy}" r="5.5" fill="rgba(232,197,126,0.52)"/>`).join('')}
${[[384,134],[524,275],[944,92],[194,508],[624,525]].map(([cx,cy])=>`<circle cx="${cx}" cy="${cy}" r="3" fill="rgba(255,255,255,0.32)"/>`).join('')}
<circle cx="900" cy="200" r="70" fill="none" stroke="rgba(232,197,126,0.28)" stroke-width="2"/>
<line x1="900" y1="132" x2="900" y2="268" stroke="rgba(232,197,126,0.32)" stroke-width="2"/>
<line x1="832" y1="200" x2="968" y2="200" stroke="rgba(232,197,126,0.32)" stroke-width="2"/>
<text x="900" y="120" text-anchor="middle" font-family="'JetBrains Mono',monospace" font-size="24" fill="rgba(232,197,126,0.55)">N</text>
${t}
</svg>`;

    /* ── RUN — speed lines + oval ──────────────────────── */
    case 'run': return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="bg" x1="0%" y1="100%" x2="70%" y2="0%">
    <stop offset="0%" stop-color="#1f8a5b"/>
    <stop offset="50%" stop-color="#3aaa78"/>
    <stop offset="86%" stop-color="#7be0c0"/>
  </linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
${Array.from({length:10},(_,i)=>`<line x1="${-80+i*145}" y1="0" x2="${60+i*145}" y2="${H}" stroke="rgba(255,210,138,0.08)" stroke-width="3.5"/>`).join('')}
<ellipse cx="540" cy="740" rx="440" ry="190" fill="none" stroke="rgba(255,210,138,0.22)" stroke-width="4.5"/>
<ellipse cx="540" cy="740" rx="310" ry="120" fill="none" stroke="rgba(255,255,255,0.09)" stroke-width="2.5"/>
<text x="540" y="${H-55}" text-anchor="middle" font-family="'DM Sans','Noto Sans Arabic',sans-serif" font-size="220" fill="rgba(255,255,255,0.04)" font-weight="900">10K</text>
${t}
</svg>`;

    /* ── SEA — waves + compass ─────────────────────────── */
    case 'sea': return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="bg" x1="0%" y1="100%" x2="70%" y2="0%">
    <stop offset="0%" stop-color="#0a2540"/>
    <stop offset="46%" stop-color="#073a70"/>
    <stop offset="82%" stop-color="#0a66c2"/>
  </linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<path d="M0,820 Q270,720 540,820 Q810,920 1080,820" fill="none" stroke="rgba(123,224,192,0.26)" stroke-width="3.5"/>
<path d="M0,880 Q270,780 540,880 Q810,980 1080,880" fill="none" stroke="rgba(123,224,192,0.16)" stroke-width="3"/>
<path d="M0,940 Q270,840 540,940 Q810,1040 1080,940" fill="none" stroke="rgba(123,224,192,0.10)" stroke-width="2.5"/>
<path d="M0,1000 Q270,920 540,1000 Q810,1080 1080,1000" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="2"/>
<circle cx="840" cy="240" r="108" fill="none" stroke="rgba(123,224,192,0.26)" stroke-width="3"/>
<circle cx="840" cy="240" r="78" fill="none" stroke="rgba(123,224,192,0.12)" stroke-width="1.5"/>
<line x1="840" y1="134" x2="840" y2="346" stroke="rgba(123,224,192,0.26)" stroke-width="2.5"/>
<line x1="734" y1="240" x2="946" y2="240" stroke="rgba(123,224,192,0.26)" stroke-width="2.5"/>
<text x="840" y="122" text-anchor="middle" font-family="'JetBrains Mono',monospace" font-size="28" fill="rgba(123,224,192,0.58)">N</text>
${t}
</svg>`;

    /* ── AI — neural network ───────────────────────────── */
    case 'ai': return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="bg" x1="0%" y1="100%" x2="70%" y2="0%">
    <stop offset="0%" stop-color="#0F1F18"/>
    <stop offset="46%" stop-color="#0d2a1c"/>
    <stop offset="82%" stop-color="#1F4D3A"/>
  </linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
${[220,400,580,760].flatMap(y1=>[310,490,670].map(y2=>`<line x1="198" y1="${y1}" x2="402" y2="${y2}" stroke="rgba(232,197,126,0.09)" stroke-width="1.5"/>`)). join('')}
${[310,490,670].flatMap(y1=>[400,580].map(y2=>`<line x1="438" y1="${y1}" x2="618" y2="${y2}" stroke="rgba(232,197,126,0.09)" stroke-width="1.5"/>`)). join('')}
${[220,400,580,760].map(cy=>`<circle cx="180" cy="${cy}" r="19" fill="none" stroke="rgba(232,197,126,0.30)" stroke-width="2.5"/><circle cx="180" cy="${cy}" r="8" fill="rgba(232,197,126,0.14)"/>`).join('')}
${[310,490,670].map(cy=>`<circle cx="420" cy="${cy}" r="19" fill="none" stroke="rgba(232,197,126,0.24)" stroke-width="2.5"/><circle cx="420" cy="${cy}" r="8" fill="rgba(232,197,126,0.10)"/>`).join('')}
${[400,580].map(cy=>`<circle cx="640" cy="${cy}" r="23" fill="none" stroke="rgba(232,197,126,0.20)" stroke-width="2.5"/><circle cx="640" cy="${cy}" r="10" fill="rgba(232,197,126,0.08)"/>`).join('')}
${t}
</svg>`;

    /* ── FAITH — sun rays ──────────────────────────────── */
    case 'faith': return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="bg" x1="0%" y1="100%" x2="70%" y2="0%">
    <stop offset="0%" stop-color="#0a2540"/>
    <stop offset="46%" stop-color="#1a1040"/>
    <stop offset="82%" stop-color="#3a2068"/>
  </linearGradient>
  <radialGradient id="sun" cx="50%" cy="0%" r="62%">
    <stop offset="0%" stop-color="rgba(255,210,138,0.32)"/>
    <stop offset="62%" stop-color="rgba(255,210,138,0.08)"/>
    <stop offset="100%" stop-color="rgba(255,210,138,0)"/>
  </radialGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<rect width="${W}" height="${H}" fill="url(#sun)"/>
${Array.from({length:20},(_,i)=>{const a=(i/20)*Math.PI;const x1=540+Math.cos(Math.PI+a)*62;const y1=-10+Math.sin(Math.PI+a)*62;const x2=540+Math.cos(Math.PI+a)*440;const y2=-10+Math.sin(Math.PI+a)*440;return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="rgba(255,210,138,0.13)" stroke-width="2"/>`;}).join('')}
<ellipse cx="540" cy="0" rx="210" ry="170" fill="rgba(255,210,138,0.20)"/>
${[[162,305],[784,244],[102,664],[984,584],[302,924],[724,884]].map(([cx,cy])=>`<circle cx="${cx}" cy="${cy}" r="7.5" fill="rgba(255,210,138,0.42)"/>`).join('')}
${t}
</svg>`;

    /* ── WOMENTECH — flowing curves ────────────────────── */
    case 'womentech': return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="bg" x1="0%" y1="100%" x2="70%" y2="0%">
    <stop offset="0%" stop-color="#1F4D3A"/>
    <stop offset="46%" stop-color="#2d6a4f"/>
    <stop offset="90%" stop-color="#C9A45E"/>
  </linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<path d="M0,240 C270,120 450,480 720,300 S990,600 1080,420" fill="none" stroke="rgba(232,197,126,0.22)" stroke-width="4.5"/>
<path d="M0,420 C200,300 380,660 620,480 S860,780 1080,600" fill="none" stroke="rgba(232,197,126,0.14)" stroke-width="3.5"/>
<path d="M0,660 C320,540 480,840 720,700 S920,900 1080,820" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="2.5"/>
<circle cx="820" cy="180" r="86" fill="none" stroke="rgba(232,197,126,0.22)" stroke-width="3"/>
<circle cx="820" cy="180" r="58" fill="none" stroke="rgba(232,197,126,0.10)" stroke-width="2"/>
<rect x="100" y="900" width="136" height="136" rx="20" fill="none" stroke="rgba(232,197,126,0.20)" stroke-width="2.5" transform="rotate(15 168 968)"/>
<polygon points="900,960 996,1108 804,1108" fill="none" stroke="rgba(232,197,126,0.16)" stroke-width="2.5"/>
${t}
</svg>`;

    /* ── NILE — blue/gold ──────────────────────────────── */
    case 'nile': return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="bg" x1="0%" y1="100%" x2="70%" y2="0%">
    <stop offset="0%" stop-color="#010B1A"/>
    <stop offset="46%" stop-color="#021840"/>
    <stop offset="82%" stop-color="#0A3D7A"/>
  </linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<path d="M0,620 Q270,532 540,620 Q810,708 1080,620" fill="none" stroke="rgba(212,175,55,0.20)" stroke-width="3.5"/>
<path d="M0,680 Q270,592 540,680 Q810,768 1080,680" fill="none" stroke="rgba(212,175,55,0.11)" stroke-width="2.5"/>
${Array.from({length:8},(_,i)=>`<circle cx="${i*155+77}" cy="${980+i*42}" r="4.5" fill="rgba(212,175,55,0.28)"/>`).join('')}
<polygon points="540,82 626,144 602,238 540,208 478,238 454,144" fill="none" stroke="rgba(212,175,55,0.20)" stroke-width="2.5"/>
<circle cx="160" cy="204" r="74" fill="none" stroke="rgba(212,175,55,0.18)" stroke-width="2"/>
${t}
</svg>`;

    /* ── SAHARA — warm desert ──────────────────────────── */
    case 'sahara': return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="bg" x1="0%" y1="100%" x2="70%" y2="0%">
    <stop offset="0%" stop-color="#3D1008"/>
    <stop offset="40%" stop-color="#7B3A1C"/>
    <stop offset="75%" stop-color="#C87A3A"/>
    <stop offset="112%" stop-color="#F5C56A"/>
  </linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<path d="M0,920 Q270,832 540,920 Q810,1008 1080,920 L1080,1350 L0,1350 Z" fill="rgba(0,0,0,0.14)"/>
<path d="M0,1000 Q270,922 540,1000 Q810,1078 1080,1000 L1080,1350 L0,1350 Z" fill="rgba(0,0,0,0.09)"/>
<circle cx="864" cy="162" r="96" fill="rgba(245,197,106,0.12)" stroke="rgba(245,197,106,0.22)" stroke-width="2.5"/>
<circle cx="864" cy="162" r="62" fill="rgba(245,197,106,0.08)"/>
${Array.from({length:6},(_,i)=>`<circle cx="${i*220+110}" cy="${70+i*32}" r="${22+i*5}" fill="rgba(245,197,106,0.07)"/>`).join('')}
${t}
</svg>`;

    /* ── CHROME — starfield purple ─────────────────────── */
    case 'chrome': return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="bg" x1="0%" y1="100%" x2="70%" y2="0%">
    <stop offset="0%" stop-color="#080810"/>
    <stop offset="40%" stop-color="#111128"/>
    <stop offset="75%" stop-color="#1E1E50"/>
    <stop offset="112%" stop-color="#2E2E70"/>
  </linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
${Array.from({length:70},(_,i)=>`<circle cx="${(i*173)%W}" cy="${(i*229)%H}" r="${i%6===0?3.5:i%3===0?2:1.2}" fill="rgba(255,255,255,${i%6===0?0.65:i%3===0?0.38:0.15})"/>`).join('')}
<circle cx="540" cy="200" r="210" fill="none" stroke="rgba(129,140,248,0.12)" stroke-width="3.5"/>
<circle cx="540" cy="200" r="148" fill="none" stroke="rgba(129,140,248,0.07)" stroke-width="2"/>
<circle cx="540" cy="200" r="86" fill="rgba(129,140,248,0.06)"/>
${t}
</svg>`;

    /* ── BLOOM — rose pink ─────────────────────────────── */
    case 'bloom': return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="bg" x1="0%" y1="100%" x2="70%" y2="0%">
    <stop offset="0%" stop-color="#7B0F3A"/>
    <stop offset="46%" stop-color="#C1185B"/>
    <stop offset="80%" stop-color="#E84B82"/>
    <stop offset="122%" stop-color="#FF9BC0"/>
  </linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
${Array.from({length:8},(_,i)=>`<circle cx="${i*155+77}" cy="${H-100-i*62}" r="${32+i*16}" fill="none" stroke="rgba(255,214,232,0.16)" stroke-width="2"/>`).join('')}
<circle cx="826" cy="200" r="116" fill="rgba(255,214,232,0.10)" stroke="rgba(255,214,232,0.22)" stroke-width="2.5"/>
<circle cx="826" cy="200" r="74" fill="none" stroke="rgba(255,214,232,0.12)" stroke-width="1.5"/>
<path d="M0,300 C180,240 360,360 540,300 S720,420 900,360 S1024,440 1080,400" fill="none" stroke="rgba(255,214,232,0.16)" stroke-width="3.5"/>
<path d="M0,380 C200,300 400,440 600,360 S800,480 1080,420" fill="none" stroke="rgba(255,214,232,0.10)" stroke-width="2.5"/>
${t}
</svg>`;

    /* ── COSMOS — deep space ───────────────────────────── */
    case 'cosmos': return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="bg" x1="0%" y1="100%" x2="70%" y2="0%">
    <stop offset="0%" stop-color="#000005"/>
    <stop offset="40%" stop-color="#030318"/>
    <stop offset="75%" stop-color="#0A0A45"/>
    <stop offset="112%" stop-color="#10105A"/>
  </linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
${Array.from({length:90},(_,i)=>`<circle cx="${(i*139)%W}" cy="${(i*213)%H}" r="${i%5===0?3.5:i%3===0?2:1.2}" fill="rgba(255,255,255,${i%5===0?0.65:i%3===0?0.38:0.16})"/>`).join('')}
<circle cx="704" cy="180" r="126" fill="none" stroke="rgba(74,144,226,0.16)" stroke-width="2.5"/>
<circle cx="704" cy="180" r="84" fill="rgba(74,144,226,0.06)"/>
${t}
</svg>`;

    /* ── NIGHTS — neon purple ──────────────────────────── */
    case 'nights': return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="bg" x1="0%" y1="100%" x2="70%" y2="0%">
    <stop offset="0%" stop-color="#0D001A"/>
    <stop offset="40%" stop-color="#1A0030"/>
    <stop offset="75%" stop-color="#3D0068"/>
    <stop offset="112%" stop-color="#6B0D9E"/>
  </linearGradient>
  <radialGradient id="neon" cx="50%" cy="60%" r="52%">
    <stop offset="0%" stop-color="rgba(255,107,245,0.16)"/>
    <stop offset="100%" stop-color="rgba(255,107,245,0)"/>
  </radialGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<rect width="${W}" height="${H}" fill="url(#neon)"/>
${Array.from({length:8},(_,i)=>`<line x1="0" y1="${i*172}" x2="${W}" y2="${i*172}" stroke="rgba(255,107,245,0.04)" stroke-width="1"/>`).join('')}
<circle cx="162" cy="180" r="104" fill="none" stroke="rgba(255,107,245,0.20)" stroke-width="3"/>
<circle cx="162" cy="180" r="62" fill="rgba(255,107,245,0.07)"/>
<circle cx="906" cy="1108" r="136" fill="none" stroke="rgba(255,107,245,0.10)" stroke-width="2.5"/>
${t}
</svg>`;

    /* ── TERRA — green earth ───────────────────────────── */
    case 'terra': return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="bg" x1="0%" y1="100%" x2="70%" y2="0%">
    <stop offset="0%" stop-color="#0A1A04"/>
    <stop offset="40%" stop-color="#1A3008"/>
    <stop offset="70%" stop-color="#2D5016"/>
    <stop offset="112%" stop-color="#5C8A2E"/>
  </linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<path d="M0,720 Q270,632 540,720 Q810,808 1080,720 L1080,1350 L0,1350 Z" fill="rgba(0,0,0,0.16)"/>
<circle cx="804" cy="220" r="94" fill="none" stroke="rgba(168,224,99,0.20)" stroke-width="2.5"/>
<circle cx="804" cy="220" r="148" fill="none" stroke="rgba(168,224,99,0.09)" stroke-width="2"/>
${Array.from({length:5},(_,i)=>`<line x1="${i*222}" y1="0" x2="${i*222+100}" y2="${H}" stroke="rgba(168,224,99,0.04)" stroke-width="2.5"/>`).join('')}
${t}
</svg>`;

    /* ── HARVEST — amber warm ──────────────────────────── */
    case 'harvest': return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="bg" x1="0%" y1="100%" x2="70%" y2="0%">
    <stop offset="0%" stop-color="#1A0800"/>
    <stop offset="40%" stop-color="#3D1500"/>
    <stop offset="70%" stop-color="#8B3A00"/>
    <stop offset="112%" stop-color="#CC6600"/>
  </linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
${Array.from({length:7},(_,i)=>`<circle cx="${i*162+81}" cy="${H-210}" r="${42+i*22}" fill="rgba(255,183,50,0.07)"/>`).join('')}
<circle cx="826" cy="162" r="94" fill="rgba(255,183,50,0.13)" stroke="rgba(255,183,50,0.24)" stroke-width="2.5"/>
<circle cx="826" cy="162" r="58" fill="rgba(255,183,50,0.09)"/>
${t}
</svg>`;

    /* ── PITCH — dark mono ─────────────────────────────── */
    case 'pitch': return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="bg" x1="0%" y1="100%" x2="70%" y2="0%">
    <stop offset="0%" stop-color="#0F0F0F"/>
    <stop offset="40%" stop-color="#1A1A1A"/>
    <stop offset="70%" stop-color="#2A2A2A"/>
    <stop offset="112%" stop-color="#3A3A3A"/>
  </linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
${Array.from({length:12},(_,i)=>`<line x1="0" y1="${i*116}" x2="${W}" y2="${i*116}" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>`).join('')}
<circle cx="540" cy="162" r="124" fill="none" stroke="rgba(34,211,238,0.16)" stroke-width="3.5"/>
<circle cx="540" cy="162" r="84" fill="none" stroke="rgba(34,211,238,0.08)" stroke-width="2"/>
<circle cx="540" cy="162" r="42" fill="rgba(34,211,238,0.06)"/>
<line x1="90" y1="162" x2="376" y2="162" stroke="rgba(34,211,238,0.12)" stroke-width="1.5"/>
<line x1="704" y1="162" x2="990" y2="162" stroke="rgba(34,211,238,0.12)" stroke-width="1.5"/>
${t}
</svg>`;

    /* ── AGORA — burnt orange ──────────────────────────── */
    case 'agora': return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="bg" x1="0%" y1="100%" x2="70%" y2="0%">
    <stop offset="0%" stop-color="#1A0500"/>
    <stop offset="46%" stop-color="#5C1200"/>
    <stop offset="82%" stop-color="#A82200"/>
    <stop offset="112%" stop-color="#D43600"/>
  </linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<path d="M0,520 L540,100 L1080,520" fill="none" stroke="rgba(255,140,66,0.16)" stroke-width="3.5"/>
<path d="M0,624 L540,204 L1080,624" fill="none" stroke="rgba(255,140,66,0.09)" stroke-width="2.5"/>
${Array.from({length:6},(_,i)=>`<circle cx="${i*202+102}" cy="82" r="9" fill="rgba(255,140,66,0.22)"/>`).join('')}
${t}
</svg>`;

    /* ── EDITORIAL — white paper ───────────────────────── */
    case 'editorial': return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#F0EDE6"/>
    <stop offset="50%" stop-color="#E8E4DC"/>
    <stop offset="100%" stop-color="#DDD8CE"/>
  </linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
${Array.from({length:18},(_,i)=>`<line x1="0" y1="${i*80}" x2="${W}" y2="${i*80}" stroke="rgba(0,0,0,0.04)" stroke-width="1"/>`).join('')}
<rect x="60" y="60" width="${W-120}" height="${H-120}" fill="none" stroke="rgba(0,0,0,0.09)" stroke-width="2.5"/>
<rect x="82" y="82" width="${W-164}" height="${H-164}" fill="none" stroke="rgba(0,0,0,0.04)" stroke-width="1"/>
<line x1="60" y1="200" x2="${W-60}" y2="200" stroke="rgba(0,0,0,0.12)" stroke-width="3.5"/>
<line x1="60" y1="212" x2="310" y2="212" stroke="rgba(0,0,0,0.06)" stroke-width="1.5"/>
${staticText({...c, accent:'#1A1A1A'})}
</svg>`;

    /* ── MARATHON — purple creative ────────────────────── */
    case 'marathon': return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="bg" x1="0%" y1="100%" x2="70%" y2="0%">
    <stop offset="0%" stop-color="#0D0D1A"/>
    <stop offset="46%" stop-color="#1A0D2E"/>
    <stop offset="82%" stop-color="#2E1052"/>
    <stop offset="112%" stop-color="#4A1A7A"/>
  </linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
${Array.from({length:6},(_,i)=>`<circle cx="540" cy="${300+i*162}" r="${42+i*32}" fill="none" stroke="rgba(192,132,252,${(0.12-i*0.016).toFixed(3)})" stroke-width="2"/>`).join('')}
<rect x="80" y="80" width="126" height="126" fill="none" stroke="rgba(192,132,252,0.20)" stroke-width="2.5" transform="rotate(15 143 143)"/>
<rect x="${W-206}" y="${H-206}" width="126" height="126" fill="none" stroke="rgba(192,132,252,0.13)" stroke-width="2.5" transform="rotate(-15 ${W-143} ${H-143})"/>
${t}
</svg>`;

    /* ── PRISM — electric violet ───────────────────────── */
    case 'prism': return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="bg" x1="0%" y1="100%" x2="70%" y2="0%">
    <stop offset="0%" stop-color="#0D0020"/>
    <stop offset="40%" stop-color="#1A0038"/>
    <stop offset="75%" stop-color="#2D0060"/>
    <stop offset="112%" stop-color="#450080"/>
  </linearGradient>
  <radialGradient id="glow" cx="50%" cy="28%" r="42%">
    <stop offset="0%" stop-color="rgba(232,121,249,0.20)"/>
    <stop offset="100%" stop-color="rgba(232,121,249,0)"/>
  </radialGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<rect width="${W}" height="${H}" fill="url(#glow)"/>
<polygon points="540,80 706,204 644,386 436,386 374,204" fill="none" stroke="rgba(232,121,249,0.20)" stroke-width="3.5"/>
${Array.from({length:5},(_,i)=>`<line x1="${i*284}" y1="0" x2="${i*284+186}" y2="${H}" stroke="rgba(232,121,249,0.04)" stroke-width="2.5"/>`).join('')}
${t}
</svg>`;

    /* ── ZEN — green serenity ──────────────────────────── */
    case 'zen': return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="bg" x1="0%" y1="100%" x2="70%" y2="0%">
    <stop offset="0%" stop-color="#0A1A12"/>
    <stop offset="40%" stop-color="#122A1C"/>
    <stop offset="75%" stop-color="#1E4030"/>
    <stop offset="112%" stop-color="#2A5A40"/>
  </linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
${Array.from({length:5},(_,i)=>`<circle cx="540" cy="690" r="${82+i*84}" fill="none" stroke="rgba(134,239,172,${(0.13-i*0.022).toFixed(2)})" stroke-width="1.5"/>`).join('')}
<path d="M0,720 Q270,634 540,720 Q810,806 1080,720" fill="none" stroke="rgba(134,239,172,0.11)" stroke-width="2.5"/>
<circle cx="162" cy="162" r="62" fill="none" stroke="rgba(134,239,172,0.17)" stroke-width="2"/>
<circle cx="162" cy="162" r="37" fill="none" stroke="rgba(134,239,172,0.09)" stroke-width="1.5"/>
${t}
</svg>`;

    /* ── ARCTIC — ice geometry ─────────────────────────── */
    case 'arctic': return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="bg" x1="0%" y1="100%" x2="70%" y2="0%">
    <stop offset="0%" stop-color="#050A1A"/>
    <stop offset="40%" stop-color="#0A1428"/>
    <stop offset="75%" stop-color="#0F2040"/>
    <stop offset="112%" stop-color="#162E58"/>
  </linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
${Array.from({length:6},(_,i)=>{const r=62+i*72;const pts=6;const d=Array.from({length:pts},(_,j)=>{const a=(j/pts)*Math.PI*2;return `${j===0?'M':'L'}${(540+Math.cos(a)*r).toFixed(1)},${(200+Math.sin(a)*r).toFixed(1)}`;}).join(' ')+'Z';return `<path d="${d}" fill="none" stroke="rgba(147,197,253,0.09)" stroke-width="1.5"/>`;}).join('')}
<path d="M0,1080 L270,930 L540,1080 L810,930 L1080,1080" fill="none" stroke="rgba(147,197,253,0.13)" stroke-width="2.5"/>
<path d="M0,1180 L270,1030 L540,1180 L810,1030 L1080,1180" fill="none" stroke="rgba(147,197,253,0.07)" stroke-width="1.5"/>
${t}
</svg>`;

    /* ── VOLTA — gaming gold ───────────────────────────── */
    case 'volta': return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="bg" x1="0%" y1="100%" x2="70%" y2="0%">
    <stop offset="0%" stop-color="#0A0A00"/>
    <stop offset="40%" stop-color="#1A1400"/>
    <stop offset="75%" stop-color="#2E2400"/>
    <stop offset="112%" stop-color="#4A3800"/>
  </linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<text x="540" y="820" text-anchor="middle" font-family="'DM Sans','Noto Sans Arabic',sans-serif" font-size="620" font-weight="900" fill="rgba(255,215,0,0.04)" letter-spacing="-20">26</text>
${Array.from({length:8},(_,i)=>`<line x1="0" y1="${i*175}" x2="${W}" y2="${i*175}" stroke="rgba(255,215,0,0.04)" stroke-width="1"/>`).join('')}
<circle cx="162" cy="162" r="84" fill="none" stroke="rgba(255,215,0,0.13)" stroke-width="2.5"/>
<path d="M122,162 L162,100 L202,162 L162,224 Z" fill="none" stroke="rgba(255,215,0,0.22)" stroke-width="2"/>
${t}
</svg>`;

    /* ── CENTURY — royal purple frames ────────────────── */
    case 'century': return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="bg" x1="0%" y1="100%" x2="70%" y2="0%">
    <stop offset="0%" stop-color="#08010F"/>
    <stop offset="40%" stop-color="#140222"/>
    <stop offset="75%" stop-color="#220338"/>
    <stop offset="112%" stop-color="#340552"/>
  </linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<text x="540" y="${H-72}" text-anchor="middle" font-family="'DM Sans','Noto Sans Arabic',sans-serif" font-size="340" font-weight="900" fill="rgba(167,139,250,0.04)" letter-spacing="-10">100</text>
${Array.from({length:5},(_,i)=>`<rect x="${90+i*30}" y="${90+i*30}" width="${W-180-i*60}" height="${H-180-i*60}" rx="4" fill="none" stroke="rgba(167,139,250,${(0.09-i*0.016).toFixed(3)})" stroke-width="1"/>`).join('')}
${t}
</svg>`;

    /* ── SPORT100 — countdown green ───────────────────── */
    case 'sport100': return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="bg" x1="0%" y1="100%" x2="70%" y2="0%">
    <stop offset="0%" stop-color="#001208"/>
    <stop offset="40%" stop-color="#002814"/>
    <stop offset="75%" stop-color="#004020"/>
    <stop offset="112%" stop-color="#006030"/>
  </linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<text x="540" y="${H-72}" text-anchor="middle" font-family="'DM Sans','Noto Sans Arabic',sans-serif" font-size="420" font-weight="900" fill="rgba(74,222,128,0.04)" letter-spacing="-15">100</text>
<ellipse cx="540" cy="720" rx="450" ry="208" fill="none" stroke="rgba(74,222,128,0.13)" stroke-width="3.5"/>
<ellipse cx="540" cy="720" rx="328" ry="136" fill="none" stroke="rgba(74,222,128,0.07)" stroke-width="2.5"/>
${Array.from({length:8},(_,i)=>`<line x1="${-62+i*167}" y1="0" x2="${62+i*167}" y2="${H}" stroke="rgba(74,222,128,0.04)" stroke-width="2.5"/>`).join('')}
${t}
</svg>`;

    /* ── DEFAULT ───────────────────────────────────────── */
    default: return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="bg" x1="0%" y1="100%" x2="75%" y2="0%">
    <stop offset="0%" stop-color="#1F4D3A"/>
    <stop offset="100%" stop-color="#E8C57E"/>
  </linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
${t}
</svg>`;
  }
}

/* ─────────────────────────────────────────────────────────────
   TEMPLATE CONFIGS (used by page.tsx preview + API route)
───────────────────────────────────────────────────────────── */
export const TEMPLATE_CONFIGS: Record<string, TemplateConfig> = {
  atf:      { name:'Africa Tech Festival',    accent:'#E8C57E', text:{ badge:"I'M ATTENDING",  line1:'Africa Tech',   line2:'Festival',     date:'JUN 12–14',  location:'NAIROBI',       accent:'#E8C57E', hashtag:'#ATF2026' } },
  sunrise:  { name:'Sunrise Hackathon',        accent:'#ffd28a', text:{ badge:'BUILDING AT',    line1:'Sunrise',       line2:'Hackathon',    date:'MAR 7–9',    location:'LAGOS',         accent:'#ffd28a', hashtag:'#SUNRISEHACK' } },
  studio:   { name:'Studio Sessions',          accent:'#C9A45E', text:{ badge:'SEE YOU AT',     line1:'Studio',        line2:'Sessions',     date:'APR 5',      location:'ACCRA',         accent:'#C9A45E', hashtag:'#STUDIOSESSIONS' } },
  devfest:  { name:'Devfest Lagos',            accent:'#7be0c0', text:{ badge:'GOING TO',       line1:'Devfest',       line2:'Lagos',        date:'NOV 22',     location:'LAGOS',         accent:'#7be0c0', hashtag:'#DEVFESTLAGOS' } },
  gala:     { name:'Black Tie Gala',           accent:'#ffd28a', text:{ badge:'JOINING THE',    line1:'Annual',        line2:'Gala 2026',    date:'DEC 6',      location:'ABIDJAN',       accent:'#ffd28a', hashtag:'#ANNUALGALA' } },
  pulse:    { name:'Pulse Music Fest',         accent:'#ffd28a', text:{ badge:'FRONT ROW AT',   line1:'Pulse',         line2:'Music Fest',   date:'AUG 15–17',  location:'ACCRA',         accent:'#ffd28a', hashtag:'#PULSEFEST26' } },
  founders: { name:'Founders Retreat',         accent:'#E8C57E', text:{ badge:'RESET AT',       line1:'Founders',      line2:'Retreat',      date:'SEPT 20–22', location:'KIGALI',        accent:'#E8C57E', hashtag:'#FOUNDERSRETREAT' } },
  run:      { name:'Run Lagos 10K',            accent:'#ffd28a', text:{ badge:'RUNNING',        line1:'Lagos',         line2:'10K Run',      date:'OCT 11',     location:'VIC. ISLAND',   accent:'#ffd28a', hashtag:'#RUNLAGOS' } },
  sea:      { name:'Devs at Sea',              accent:'#7be0c0', text:{ badge:'SAILING WITH',   line1:'Devs',          line2:'at Sea',       date:'MAY 10–14',  location:'MEDITERRANEAN', accent:'#7be0c0', hashtag:'#DEVSATSEA' } },
  ai:       { name:'AI Ethics Webinar',        accent:'#E8C57E', text:{ badge:'JOINING THE',    line1:'AI Ethics',     line2:'Webinar',      date:'JAN 30',     location:'ONLINE',        accent:'#E8C57E', hashtag:'#AIETHICS2026' } },
  faith:    { name:'Faith Conference',         accent:'#ffd28a', text:{ badge:'ATTENDING',      line1:'Faith',         line2:"Conference",   date:'FEB 21–23',  location:'ADDIS ABABA',   accent:'#ffd28a', hashtag:'#FAITHCONF26' } },
  womentech:{ name:'Women in Tech Summit',     accent:'#E8C57E', text:{ badge:'SPEAKING AT',    line1:'Women in Tech', line2:'Summit',       date:'MAR 28',     location:'NAIROBI',       accent:'#E8C57E', hashtag:'#WOMENTECH26' } },
  nile:     { name:'The Nile Forum',           accent:'#D4AF37', text:{ badge:'CONVENING AT',   line1:'The Nile',      line2:'Forum',        date:'NOV 2026',   location:'CAIRO',         accent:'#D4AF37', hashtag:'#NILEFORUM' } },
  sahara:   { name:'Sahara Summit',            accent:'#F5C56A', text:{ badge:"I'M ATTENDING",  line1:'Sahara',        line2:'Summit',       date:'SEPT 14–16', location:'MARRAKECH',     accent:'#F5C56A', hashtag:'#SAHARASUMMIT' } },
  chrome:   { name:'Chrome Dev Summit',        accent:'#818CF8', text:{ badge:'ATTENDING',      line1:'Chrome Dev',    line2:'Summit',       date:'OCT 8–9',    location:'ONLINE',        accent:'#818CF8', hashtag:'#CHROMESUMMIT' } },
  bloom:    { name:"Bloom Women's Forum",      accent:'#FFD6E8', text:{ badge:'SPEAKING AT',    line1:'Bloom',         line2:"Forum '26",    date:'MAR 8',      location:'NAIROBI',       accent:'#FFD6E8', hashtag:'#BLOOMFORUM' } },
  cosmos:   { name:'Cosmos Leadership Forum',  accent:'#4A90E2', text:{ badge:'CONVENING',      line1:'Cosmos',        line2:'Forum',        date:'DEC 12',     location:'CAIRO',         accent:'#4A90E2', hashtag:'#COSMOSFORUM' } },
  nights:   { name:'Lagos Nights',             accent:'#FF6BF5', text:{ badge:'TONIGHT AT',     line1:'Lagos',         line2:'Nights',       date:'EVERY FRI',  location:'LAGOS',         accent:'#FF6BF5', hashtag:'#LAGOSNIGHTS' } },
  terra:    { name:'Terra Climate Summit',     accent:'#A8E063', text:{ badge:'ATTENDING',      line1:'Terra',         line2:'Summit',       date:'APR 22',     location:'CAPE TOWN',     accent:'#A8E063', hashtag:'#TERRASUMMIT' } },
  harvest:  { name:'Harvest Festival',         accent:'#FFB732', text:{ badge:'FRONT ROW',      line1:'Harvest',       line2:'Fest 2026',    date:'NOV 1–3',    location:'ACCRA',         accent:'#FFB732', hashtag:'#HARVESTFEST' } },
  pitch:    { name:'The Pitch Competition',    accent:'#22D3EE', text:{ badge:'COMPETING',      line1:'The Pitch',     line2:'Competition',  date:'JUN 20',     location:'ABIDJAN',       accent:'#22D3EE', hashtag:'#THEPITCH26' } },
  agora:    { name:'Agora Open Forum',         accent:'#FF8C42', text:{ badge:"I'M SPEAKING",   line1:'Agora',         line2:'Forum',        date:'MAY 2026',   location:'ABUJA',         accent:'#FF8C42', hashtag:'#AGORAFORUM' } },
  editorial:{ name:'The Press Forum',          accent:'#1A1A1A', light:true, text:{ badge:'PANELIST', line1:'The Press', line2:'Forum',       date:'FEB 2026',   location:'DAKAR',         accent:'#1A1A1A', hashtag:'#PRESSFORUM', light:true } },
  marathon: { name:'Design Marathon',          accent:'#C084FC', text:{ badge:'PARTICIPATING',  line1:'Design',        line2:'Marathon',     date:'JUL 2026',   location:'KIGALI',        accent:'#C084FC', hashtag:'#DESIGNMARATHON' } },
  prism:    { name:'Prism Design Week',        accent:'#E879F9', text:{ badge:'ATTENDING',      line1:'Prism',         line2:'Design Week',  date:'AUG 10–14',  location:'LAGOS',         accent:'#E879F9', hashtag:'#PRISMDESIGN' } },
  zen:      { name:'Zen Wellness Summit',      accent:'#86EFAC', text:{ badge:'JOINING',        line1:'Zen',           line2:'Summit',       date:'JAN 25',     location:'ZANZIBAR',      accent:'#86EFAC', hashtag:'#ZENSUMMIT' } },
  arctic:   { name:'Arctic Tech Conference',   accent:'#93C5FD', text:{ badge:'ATTENDING',      line1:'Arctic Tech',   line2:'Conference',   date:'FEB 2027',   location:'REYKJAVIK',     accent:'#93C5FD', hashtag:'#ARCTICTECH' } },
  volta:    { name:'Volta Gaming Expo',        accent:'#FFD700', text:{ badge:'PLAYING',        line1:'Volta',         line2:'Gaming Expo',  date:'SEPT 2026',  location:'LAGOS',         accent:'#FFD700', hashtag:'#VOLTAGAMING' } },
  century:  { name:'Century Business Forum',   accent:'#A78BFA', text:{ badge:'ATTENDING',      line1:'Century',       line2:'Forum',        date:'OCT 1',      location:'JOHANNESBURG',  accent:'#A78BFA', hashtag:'#CENTURYFORUM' } },
  sport100: { name:'100 Days to Kickoff',      accent:'#4ADE80', text:{ badge:'TRAINING',       line1:'100 Days',      line2:'to Kickoff',   date:'COUNTDOWN',  location:'ALL AFRICA',    accent:'#4ADE80', hashtag:'#100DAYS' } },
};
