import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/auth/guards';
import { CONTENT_EDIT } from '@/lib/auth/permissions';
import { getPageById, addBlock, updateBlock } from '@/lib/cms/queries';
import { logAudit } from '@/lib/audit/log';

interface RouteParams {
  params: { id: string };
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const auth = await getAuthorizedUser(CONTENT_EDIT);
  if ('error' in auth) return auth.error;

  const { id } = params;
  try {
    const page = await getPageById(id);
    if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    return NextResponse.json(page.blocks ?? []);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await getAuthorizedUser(CONTENT_EDIT);
  if ('error' in auth) return auth.error;
  const { user } = auth;

  const { id: pageId } = params;
  let body: { type: string; content: object; position: number };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { type, content, position } = body;
  if (!type || content === undefined || position === undefined) {
    return NextResponse.json({ error: 'type, content, and position are required' }, { status: 400 });
  }

  try {
    const block = await addBlock(
      pageId,
      type as import('@/lib/cms/types').BlockType,
      content as unknown as import('@/lib/cms/types').BlockContent,
      position,
    );
    await logAudit(user, 'content.block_add', 'cms_blocks', block.id ?? pageId, { after: { type, position } });
    return NextResponse.json(block, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const auth = await getAuthorizedUser(CONTENT_EDIT);
  if ('error' in auth) return auth.error;
  const { user } = auth;

  let body: { order: Array<{ id: string; position: number }> };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  if (!Array.isArray(body.order)) {
    return NextResponse.json({ error: 'order must be an array of { id, position }' }, { status: 400 });
  }

  try {
    await Promise.all(body.order.map(({ id, position }) => updateBlock(id, { position })));
    await logAudit(user, 'content.blocks_reorder', 'cms_pages', params.id, { after: { count: body.order.length } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 });
  }
}
