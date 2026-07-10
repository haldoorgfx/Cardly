import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { StudioClient } from '@/components/studio/StudioClient';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Eventera Card Studio' };

export default async function StudioPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return <StudioClient />;
}
