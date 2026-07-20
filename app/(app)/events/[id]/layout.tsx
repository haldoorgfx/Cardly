import type { Metadata } from 'next';
import { resolveEventRef } from '@/lib/events/resolveEventRef';

interface Props {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const _ev = await resolveEventRef(id);
  return {
    title: _ev?.name ?? 'Event',
  };
}

// The cross-role switcher used to render here as a strip above the hero. It
// read as a stray toolbar floating on cream above the forest banner, so it now
// lives inside the hero itself (see the event page) alongside the status
// badge — the same place mobile puts its role pills.
export default function EventLayout({ children }: Props) {
  return <>{children}</>;
}
