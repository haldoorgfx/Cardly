// Temporary migration script — run once then can be deleted
// Usage: node scripts/run-migration-026.mjs
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const __dir = dirname(fileURLToPath(import.meta.url));

// Load env from .env.local
const envFile = readFileSync(join(__dir, '../.env.local'), 'utf8');
const env = Object.fromEntries(
  envFile.split('\n').filter(l => l.includes('=')).map(l => {
    const idx = l.indexOf('=');
    return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
  })
);

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL'];
const SERVICE_KEY  = env['SUPABASE_SERVICE_ROLE_KEY'];

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// Try exec_sql rpc (available in some Supabase setups)
const sql = `
alter table profiles
  add column if not exists organization           text    default '',
  add column if not exists timezone               text    default 'UTC',
  add column if not exists language               text    default 'English',
  add column if not exists currency               text    default 'USD',
  add column if not exists date_format            text    default 'DD MMM YYYY',
  add column if not exists notify_registrations   boolean default true,
  add column if not exists notify_daily_summary   boolean default true,
  add column if not exists notify_card_shares     boolean default false,
  add column if not exists notify_product_updates boolean default true;
`;

const { data, error } = await supabase.rpc('exec_sql', { sql });

if (error) {
  console.error('exec_sql failed:', error.message);
  console.log('\nPlease run the following SQL in your Supabase SQL Editor:');
  console.log('https://supabase.com/dashboard/project/qhjvetcawsaswfkufzee/sql/new');
  console.log('\n' + sql);
} else {
  console.log('Migration applied successfully:', data);
}
