import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/guards';
import { CONTENT_EDIT } from '@/lib/auth/permissions';
import { getPageById, addBlock, updateBlock } from '@/lib/cms/queries';

interface RouteParams {
  params: { id: string };
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission(CONTENT_EDIT);

    const { id } = params;
    const page = await getPageById(id);

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json(page.blocks ?? []);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const status = message.toLowerCase().includes('permission') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission(CONTENT_EDIT);

    const { id: pageId } = params;
    const body = await req.json();

    const { type, content, position } = body as {
      type: string;
      content: object;
      position: number;
    };

    if (!type || content === undefined || position === undefined) {
      return NextResponse.json(
        { error: 'type, content, and position are required' },
        { status: 400 }
      );
    }

    const block = await addBlock(
      pageId,
      type as import('@/lib/cms/types').BlockType,
      content as unknown as import('@/lib/cms/types').BlockContent,
      position,
    );

    return NextResponse.json(block, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const status = message.toLowerCase().includes('permission') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requirePermission(CONTENT_EDIT);

    const body = await req.json();
    const { order } = body as {
      order: Array<{ id: string; position: number }>;
    };

    if (!Array.isArray(order)) {
      return NextResponse.json(
        { error: 'order must be an array of { id, position }' },
        { status: 400 }
      );
    }

    await Promise.all(
      order.map(({ id, position }) => updateBlock(id, { position }))
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const status = message.toLowerCase().includes('permission') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
