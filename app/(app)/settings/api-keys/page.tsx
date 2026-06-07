import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const metadata = { title: 'API Keys — Karta' };

export default async function ApiKeysPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="max-w-[760px] mx-auto px-6 py-10">
      <div className="mb-8">
        <div className="font-mono text-[10px] tracking-[0.22em] uppercase mb-2" style={{ color: '#6B7A72' }}>Developer</div>
        <h1 className="font-display font-bold text-[28px] tracking-tight" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>API Keys</h1>
        <p className="mt-1.5 text-[14px]" style={{ color: '#6B7A72' }}>Authenticate your app with the Karta API.</p>
      </div>

      <div className="bg-white rounded-2xl p-8 text-center" style={{ border: '1px solid #E5E0D4' }}>
        <div className="w-12 h-12 rounded-2xl grid place-items-center mx-auto mb-4" style={{ background: '#E8EFEB' }}>
          <svg width={22} height={22} fill="none" stroke="#1F4D3A" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
          </svg>
        </div>
        <h3 className="font-display text-[16px] font-semibold mb-2" style={{ color: '#0F1F18' }}>API access coming soon</h3>
        <p className="text-[13px] max-w-[360px] mx-auto" style={{ color: '#6B7A72' }}>
          Programmatic access to your events, registrations, and attendee data via REST API. Available on Studio plan.
        </p>
      </div>
    </div>
  );
}
