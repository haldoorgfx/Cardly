import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function PATCH(
  req: Request,
  { params }: { params: { speakerId: string } }
) {
  const body = await req.json();
  const admin = createAdminClient();

  const { error } = await (admin as any)
    .from('speakers')
    .update({
      name: body.name,
      role: body.role || null,
      company: body.company || null,
      bio: body.bio || null,
      twitter_url: body.twitter_url || null,
      linkedin_url: body.linkedin_url || null,
      website_url: body.website_url || null,
    })
    .eq('id', params.speakerId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
