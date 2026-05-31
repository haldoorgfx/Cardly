import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/auth/guards';
import { CONTENT_EDIT } from '@/lib/auth/permissions';
import { updatePage, deletePage } from '@/lib/cms/queries';
import { logAudit } from '@/lib/audit/log';

interface RouteParams {
  params: { id: string };
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await getAuthorizedUser(CONTENT_EDIT);
  if ('error' in auth) return auth.error;
  const { user } = auth;

  const { id } = params;
  let body: { title?: string; status?: 'draft' | 'published'; seo?: object };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  try {
    const updated = await updatePage(id, { title: body.title, status: body.status, seo: body.seo });
    await logAudit(user, 'content.update', 'cms_pages', id, { after: { title: body.title, status: body.status } });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const auth = await getAuthorizedUser(CONTENT_EDIT);
  if ('error' in auth) return auth.error;
  const { user } = auth;

  const { id } = params;
  try {
    await deletePage(id);
    await logAudit(user, 'content.delete', 'cms_pages', id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 });
  }
}
