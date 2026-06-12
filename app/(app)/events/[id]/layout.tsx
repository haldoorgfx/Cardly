import { createAdminClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';

interface Props {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const admin = createAdminClient();
  const { data: event } = await admin
    .from('events')
    .select('name')
    .eq('id', id)
    .single();
  return {
    title: event?.name ?? 'Event',
  };
}

export default function EventLayout({ children }: Props) {
  return <>{children}</>;
}
