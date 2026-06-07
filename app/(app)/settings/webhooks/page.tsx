import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Webhooks — Karta' };

export default async function WebhooksPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="max-w-[760px] mx-auto px-6 py-10">
      <div className="mb-8">
        <div className="font-mono text-[10px] tracking-[0.22em] uppercase mb-2" style={{ color: '#6B7A72' }}>Developer</div>
        <h1 className="font-display font-bold text-[28px] tracking-tight" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>Webhooks</h1>
        <p className="mt-1.5 text-[14px]" style={{ color: '#6B7A72' }}>Receive real-time event notifications to your server.</p>
      </div>

      <div className="bg-white rounded-2xl p-8 text-center" style={{ border: '1px solid #E5E0D4' }}>
        <div className="w-12 h-12 rounded-2xl grid place-items-center mx-auto mb-4" style={{ background: '#E8EFEB' }}>
          <svg width={22} height={22} fill="none" stroke="#1F4D3A" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
          </svg>
        </div>
        <h3 className="font-display text-[16px] font-semibold mb-2" style={{ color: '#0F1F18' }}>Webhooks coming soon</h3>
        <p className="text-[13px] max-w-[360px] mx-auto" style={{ color: '#6B7A72' }}>
          Get notified when registrations, check-ins, and payments happen — delivered to your endpoint in real time.
        </p>
      </div>
    </div>
  );
}
