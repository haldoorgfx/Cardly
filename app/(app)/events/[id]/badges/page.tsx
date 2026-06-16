import { redirect } from 'next/navigation';
import { resolveEventRef } from '@/lib/events/resolveEventRef';

interface Props { params: Promise<{ id: string }> }

export default async function BadgesPage({ params }: Props) {
  const { id: _ref } = await params;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;
  redirect(`/events/${id}/eventera-card`);
}
