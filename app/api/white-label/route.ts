import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { isPlatformFeatureEnabled } from '@/lib/features/platform';

export async function GET() {
  if (!(await isPlatformFeatureEnabled('white_label'))) return NextResponse.json({ error: 'White-label branding is currently unavailable.' }, { status: 404 });

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({}, { status: 401 });

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any)
    .from('white_label_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: Record<string, any> = data ?? {};
  // Normalize legacy purple palette colors → forest green
  const LEGACY_COLORS = ['#7300ff', '#6c63ff', '#6366f1', '#8b5cf6', '#7c3aed'];
  if (result.primary_color && LEGACY_COLORS.includes((result.primary_color as string).toLowerCase())) {
    result.primary_color = '#1F4D3A';
  }
  return NextResponse.json(result);
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// hostname label(s) + TLD, no protocol/path
const DOMAIN_RE = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/;

/** Strip protocol, path, port, trailing dot, whitespace, and lowercase. */
function normalizeDomain(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '')
    .replace(/\.$/, '');
}

export async function POST(req: NextRequest) {
  if (!(await isPlatformFeatureEnabled('white_label'))) return NextResponse.json({ error: 'White-label branding is currently unavailable.' }, { status: 404 });

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();

  // White label is a Studio-plan feature — enforce server-side, not just in the UI.
  const { data: profile } = await admin
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single();

  if (profile?.plan !== 'studio') {
    return NextResponse.json({ error: 'White label requires the Studio plan.' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));

  // Whitelist + validate every field. Never trust the raw body.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: Record<string, any> = {};

  if (typeof body.brand_name === 'string') {
    const v = body.brand_name.trim().slice(0, 60);
    update.brand_name = v || null;
  }

  if (typeof body.primary_color === 'string') {
    const v = body.primary_color.trim();
    if (v && !HEX_RE.test(v)) {
      return NextResponse.json({ error: 'Primary color must be a 6-digit hex value, e.g. #1F4D3A.' }, { status: 400 });
    }
    update.primary_color = v || '#1F4D3A';
  }

  if (typeof body.from_name === 'string') {
    update.from_name = body.from_name.trim().slice(0, 60) || null;
  }

  if (typeof body.reply_to_email === 'string') {
    const v = body.reply_to_email.trim();
    if (v && !EMAIL_RE.test(v)) {
      return NextResponse.json({ error: 'Reply-to must be a valid email address.' }, { status: 400 });
    }
    update.reply_to_email = v || null;
  }

  if (typeof body.hide_powered_by === 'boolean') {
    update.hide_powered_by = body.hide_powered_by;
  }

  // Custom domain: normalize + validate. Any change resets verification, since
  // the new host must be re-checked against DNS.
  if (typeof body.custom_domain === 'string') {
    const raw = body.custom_domain.trim();
    if (!raw) {
      update.custom_domain = null;
      update.domain_verified = false;
    } else {
      const domain = normalizeDomain(raw);
      if (!DOMAIN_RE.test(domain)) {
        return NextResponse.json({ error: 'Enter a valid domain, e.g. events.yourcompany.com.' }, { status: 400 });
      }
      // Only reset verification when the domain actually changed.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existing } = await (admin as any)
        .from('white_label_settings')
        .select('custom_domain')
        .eq('user_id', user.id)
        .single();
      update.custom_domain = domain;
      if (!existing || existing.custom_domain !== domain) {
        update.domain_verified = false;
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from('white_label_settings')
    .upsert(
      { user_id: user.id, ...update, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
