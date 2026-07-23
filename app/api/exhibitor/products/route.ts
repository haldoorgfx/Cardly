import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isPlatformFeatureEnabled } from '@/lib/features/platform';

const CreateSchema = z.object({
  token:       z.string().min(1).max(200),
  name:        z.string().min(1).max(200).trim(),
  description: z.string().max(2000).trim().optional().nullable(),
  image_url:   z.string().max(1000).trim().optional().nullable(),
  is_featured: z.boolean().optional(),
});

const UpdateSchema = z.object({
  token:       z.string().min(1).max(200),
  product_id:  z.string().uuid(),
  name:        z.string().min(1).max(200).trim().optional(),
  description: z.string().max(2000).trim().optional().nullable(),
  image_url:   z.string().max(1000).trim().optional().nullable(),
  is_featured: z.boolean().optional(),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveSponsor(admin: any, token: string) {
  const { data } = await admin
    .from('sponsors')
    .select('id, event_id')
    .eq('invite_token', token)
    .single();
  return data as { id: string; event_id: string } | null;
}

export async function POST(req: Request) {
  if (!(await isPlatformFeatureEnabled('exhibitors'))) return NextResponse.json({ error: 'Exhibitors is currently unavailable.' }, { status: 404 });

  const raw = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Validation failed' }, { status: 400 });
  }
  const { token, name, description, image_url, is_featured } = parsed.data;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const sponsor = await resolveSponsor(admin, token);
  if (!sponsor) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: product, error } = await admin
    .from('exhibitor_products')
    .insert({
      sponsor_id:  sponsor.id,
      event_id:    sponsor.event_id,
      name,
      description: description || null,
      image_url:   image_url || null,
      is_featured: is_featured ?? false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product });
}

export async function PATCH(req: Request) {
  if (!(await isPlatformFeatureEnabled('exhibitors'))) return NextResponse.json({ error: 'Exhibitors is currently unavailable.' }, { status: 404 });

  const raw = await req.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Validation failed' }, { status: 400 });
  }
  const { token, product_id, name, description, image_url, is_featured } = parsed.data;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const sponsor = await resolveSponsor(admin, token);
  if (!sponsor) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const patch: Record<string, unknown> = {};
  if (name        !== undefined) patch.name        = name;
  if (description !== undefined) patch.description = description || null;
  if (image_url   !== undefined) patch.image_url   = image_url || null;
  if (is_featured !== undefined) patch.is_featured = is_featured;

  const { data: product, error } = await admin
    .from('exhibitor_products')
    .update(patch)
    .eq('id', product_id)
    .eq('sponsor_id', sponsor.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product });
}

export async function DELETE(req: Request) {
  if (!(await isPlatformFeatureEnabled('exhibitors'))) return NextResponse.json({ error: 'Exhibitors is currently unavailable.' }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const id    = searchParams.get('id');
  const token = searchParams.get('token');
  if (!id || !token) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const sponsor = await resolveSponsor(admin, token);
  if (!sponsor) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { error } = await admin
    .from('exhibitor_products')
    .delete()
    .eq('id', id)
    .eq('sponsor_id', sponsor.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
