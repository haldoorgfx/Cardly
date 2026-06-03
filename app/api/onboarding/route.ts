import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as {
    evType: string;
    orgName: string;
    region: string;
    currency: string;
    accent: string;
    evName: string;
    evStart: string;
    evEnd: string;
    venue: string;
    inviteEmails: string[];
  };

  const admin = createAdminClient();

  // Save org preferences to profile metadata
  await admin
    .from('profiles')
    .update({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(body.orgName ? { full_name: body.orgName } : {}),
    } as any)
    .eq('id', user.id);

  // Create first event if name provided
  if (body.evName.trim()) {
    const slug = body.evName.trim().toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 40) + '-' + Math.random().toString(36).slice(2, 6);

    await admin.from('events').insert({
      user_id: user.id,
      name: body.evName.trim(),
      slug,
      status: 'draft',
    });
  }

  // Invite team members
  if (body.inviteEmails?.length) {
    // Queue invites — best-effort, don't block on errors
    await Promise.allSettled(
      body.inviteEmails.map(email =>
        fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/api/team/invite`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-internal': 'onboarding' },
          body: JSON.stringify({ email, inviter_id: user.id }),
        }).catch(() => null)
      )
    );
  }

  return NextResponse.json({ ok: true });
}
