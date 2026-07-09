export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function RegistrationFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="p-8">
      <p className="text-sm font-mono text-[#6B7A72]">Phase 1.4 — Registration form builder: {id}</p>
    </div>
  );
}
