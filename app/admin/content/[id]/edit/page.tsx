import { notFound } from 'next/navigation';
import { requirePermission } from '@/lib/auth/guards';
import { CONTENT_EDIT } from '@/lib/auth/permissions';
import { getPageById } from '@/lib/cms/queries';
import { PageEditorClient } from './PageEditorClient';

export const dynamic = 'force-dynamic';

export default async function ContentEditPage({ params }: { params: { id: string } }) {
  await requirePermission(CONTENT_EDIT);
  const page = await getPageById(params.id);
  if (!page) notFound();

  return <PageEditorClient page={page} />;
}
