/**
 * Downloads TTF files for bundled fonts from Google Fonts.
 * Run once: node scripts/download-fonts.mjs
 */
import { createWriteStream, mkdirSync, existsSync } from 'fs';
import { pipeline } from 'stream/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'public', 'fonts');
mkdirSync(OUT, { recursive: true });

// Old Android UA forces Google to return TTF (not WOFF2)
const UA = 'Mozilla/5.0 (Linux; U; Android 2.2; en-us) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1';

const FONTS = [
  { family: 'DM Sans',        weights: [400, 500, 600, 700] },
  { family: 'Inter',           weights: [400, 500, 600, 700] },
  { family: 'JetBrains Mono', weights: [400, 500, 700] },
];

async function getTtfUrl(family, weight) {
  const param = family.replace(/\s+/g, '+');
  const url = `https://fonts.googleapis.com/css?family=${param}:${weight}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`CSS fetch failed ${res.status} for ${family}:${weight}`);
  const css = await res.text();
  const m = css.match(/url\(['"]?(https:\/\/fonts\.gstatic\.com\/[^'")\s]+\.(?:ttf|otf))['"]?\)/i);
  if (!m) throw new Error(`No TTF URL found for ${family}:${weight}\n${css.slice(0, 400)}`);
  return m[1];
}

async function downloadFont(family, weight) {
  const safeName = family.toLowerCase().replace(/[^a-z0-9]/g, '');
  const outFile = path.join(OUT, `${safeName}-${weight}.ttf`);
  if (existsSync(outFile)) { console.log(`  skip  ${path.basename(outFile)} (exists)`); return; }

  const ttfUrl = await getTtfUrl(family, weight);
  const res = await fetch(ttfUrl);
  if (!res.ok) throw new Error(`TTF download failed ${res.status} for ${ttfUrl}`);
  await pipeline(res.body, createWriteStream(outFile));
  console.log(`  saved ${path.basename(outFile)}`);
}

for (const { family, weights } of FONTS) {
  console.log(`\n${family}`);
  for (const w of weights) {
    await downloadFont(family, w);
  }
}
console.log('\nDone.');
