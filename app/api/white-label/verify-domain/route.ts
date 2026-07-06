import { NextResponse } from 'next/server';
import { promises as dns } from 'dns';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// Attendee custom domains must CNAME to the platform host.
const TARGET_HOST = 'karta.cre8so.com';

export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single();
  if (profile?.plan !== 'studio') {
    return NextResponse.json({ error: 'White label requires the Studio plan.' }, { status: 403 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: settings } = await (admin as any)
    .from('white_label_settings')
    .select('custom_domain')
    .eq('user_id', user.id)
    .single();

  const domain: string | null = settings?.custom_domain ?? null;
  if (!domain) {
    return NextResponse.json({ verified: false, error: 'No custom domain set.' }, { status: 400 });
  }

  let verified = false;
  let detail = '';
  try {
    const records = await dns.resolveCname(domain);
    verified = records.some(r => r.replace(/\.$/, '').toLowerCase() === TARGET_HOST);
    if (!verified) {
      detail = `CNAME points to ${records.join(', ') || 'nothing'} — expected ${TARGET_HOST}.`;
    }
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const code = (err as any)?.code;
    detail = code === 'ENODATA' || code === 'ENOTFOUND'
      ? `No CNAME record found for ${domain} yet. DNS can take up to 48h to propagate.`
      : 'Could not resolve the domain. Check the record and try again.';
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from('white_label_settings')
    .update({ domain_verified: verified, updated_at: new Date().toISOString() })
    .eq('user_id', user.id);

  return NextResponse.json({ verified, target: TARGET_HOST, detail: detail || undefined });
}
