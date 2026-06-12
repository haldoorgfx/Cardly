// Applies missing migrations to the production Supabase DB
// Usage: node scripts/apply-migrations.mjs
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');

// Read env
const envFile = readFileSync(join(root, '.env.local'), 'utf8');
const env = Object.fromEntries(
  envFile.split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0,i).trim(), l.slice(i+1).trim()]; })
);

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE env vars'); process.exit(1);
}

// Execute SQL via Supabase REST
async function sql(query) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    // Try pg-meta endpoint
    const res2 = await fetch(`${SUPABASE_URL.replace('.supabase.co', '.supabase.co')}/pg/query`, {
      method: 'POST',
      headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (!res2.ok) return { error: await res.text() };
    return res2.json();
  }
  return res.json();
}

// Check if column exists
async function columnExists(table, column) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?select=${column}&limit=1`,
    { headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}`, 'Prefer': 'count=none' } }
  );
  if (res.ok) return true;
  const txt = await res.text();
  return !txt.includes('column') && !txt.includes('does not exist');
}

// Apply specific migration SQL directly via the admin API
async function runSQL(sqlText) {
  // Use the Supabase pg endpoint
  const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (!projectRef) { console.error('Could not parse project ref'); return; }

  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sqlText }),
  });
  const text = await res.text();
  console.log(`  Status: ${res.status}`, text.slice(0, 200));
  return { ok: res.ok, text };
}

async function main() {
  console.log('Checking which migrations need applying...\n');

  const migrations = [
    {
      name: '024_onboarding_completed',
      sql: `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;`
    },
    {
      name: '026_profile_preferences',
      sql: `
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}';
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city text;
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text;
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website text;
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS twitter text;
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin text;
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS job_title text;
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company text;
      `
    },
    {
      name: '030_waitlist_series',
      sql: readFileSync(join(root, 'supabase/migrations/030_waitlist_series.sql'), 'utf8')
    },
    {
      name: '031_ticketing_depth',
      sql: readFileSync(join(root, 'supabase/migrations/031_ticketing_depth.sql'), 'utf8')
    },
    {
      name: '032_promoter_codes',
      sql: readFileSync(join(root, 'supabase/migrations/032_promoter_codes.sql'), 'utf8')
    },
    {
      name: '033_registration_unique_email',
      sql: readFileSync(join(root, 'supabase/migrations/033_registration_unique_email.sql'), 'utf8')
    },
    {
      name: '034_registration_chosen_price',
      sql: readFileSync(join(root, 'supabase/migrations/034_registration_chosen_price.sql'), 'utf8')
    },
    {
      name: '035_registrations_user_id',
      sql: readFileSync(join(root, 'supabase/migrations/035_registrations_user_id.sql'), 'utf8')
    },
    {
      name: '036_event_staff',
      sql: readFileSync(join(root, 'supabase/migrations/036_event_staff.sql'), 'utf8')
    },
    {
      name: '037_photo_wall',
      sql: readFileSync(join(root, 'supabase/migrations/037_photo_wall.sql'), 'utf8')
    },
  ];

  for (const m of migrations) {
    console.log(`Applying: ${m.name}`);
    const r = await runSQL(m.sql);
    if (r?.ok) console.log('  ✓ Applied\n');
    else console.log(`  ✗ Error\n`);
  }

  console.log('Done.');
}

main().catch(console.error);
