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

export default function EventLayout({ children }: Props) {
  return <>{children}</>;
}
