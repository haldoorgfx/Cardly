import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/guards';
import { CONTENT_EDIT } from '@/lib/auth/permissions';
import { updateBlock, deleteBlock } from '@/lib/cms/queries';

interface RouteParams {
  params: { id: string; blockId: string };
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission(CONTENT_EDIT);

    const { blockId } = params;
    const body = await req.json();

    const { content, position } = body as {
      content?: object;
      position?: number;
    };

    if (content === undefined && position === undefined) {
      return NextResponse.json(
        { error: 'At least one of content or position must be provided' },
        { status: 400 }
      );
    }

    const updated = await updateBlock(blockId, {
      content: content as unknown as import('@/lib/cms/types').BlockContent,
      position,
    });

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

    const { blockId } = params;
    await deleteBlock(blockId);

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const status = message.toLowerCase().includes('permission') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
