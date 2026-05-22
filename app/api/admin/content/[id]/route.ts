import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/guards';
import { CONTENT_EDIT } from '@/lib/auth/permissions';
import { updatePage, deletePage } from '@/lib/cms/queries';

interface RouteParams {
  params: { id: string };
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission(CONTENT_EDIT);

    const { id } = params;
    const body = await req.json();

    const { title, status, seo } = body as {
      title?: string;
      status?: 'draft' | 'published';
      seo?: object;
    };

    const updated = await updatePage(id, { title, status, seo });

    return NextResponse.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const status = message.toLowerCase().includes('permission') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission(CONTENT_EDIT);

    const { id } = params;
    await deletePage(id);

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const status = message.toLowerCase().includes('permission') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
