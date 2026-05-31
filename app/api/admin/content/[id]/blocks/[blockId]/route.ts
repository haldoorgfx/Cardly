import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/auth/guards';
import { CONTENT_EDIT } from '@/lib/auth/permissions';
import { updateBlock, deleteBlock } from '@/lib/cms/queries';
import { logAudit } from '@/lib/audit/log';

interface RouteParams {
  params: { id: string; blockId: string };
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await getAuthorizedUser(CONTENT_EDIT);
  if ('error' in auth) return auth.error;
  const { user } = auth;

  const { blockId } = params;
  let body: { content?: object; position?: number };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { content, position } = body;
  if (content === undefined && position === undefined) {
    return NextResponse.json({ error: 'At least one of content or position must be provided' }, { status: 400 });
  }

  try {
    const updated = await updateBlock(blockId, {
      content: content as unknown as import('@/lib/cms/types').BlockContent,
      position,
    });
    await logAudit(user, 'content.block_update', 'cms_blocks', blockId, { after: { position } });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const auth = await getAuthorizedUser(CONTENT_EDIT);
  if ('error' in auth) return auth.error;
  const { user } = auth;

  const { blockId } = params;
  try {
    await deleteBlock(blockId);
    await logAudit(user, 'content.block_delete', 'cms_blocks', blockId);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 });
  }
}
