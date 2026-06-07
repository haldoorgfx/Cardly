import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const metadata = { title: 'White Label — Karta' };

export default async function WhiteLabelPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="max-w-[760px] mx-auto px-6 py-10">
      <div className="mb-8">
        <div className="font-mono text-[10px] tracking-[0.22em] uppercase mb-2" style={{ color: '#6B7A72' }}>Developer</div>
        <h1 className="font-display font-bold text-[28px] tracking-tight" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>White Label</h1>
        <p className="mt-1.5 text-[14px]" style={{ color: '#6B7A72' }}>Remove Karta branding and use your own domain.</p>
      </div>

      <div className="bg-white rounded-2xl p-8 text-center" style={{ border: '1px solid #E5E0D4' }}>
        <div className="w-12 h-12 rounded-2xl grid place-items-center mx-auto mb-4" style={{ background: '#E8EFEB' }}>
          <svg width={22} height={22} fill="none" stroke="#1F4D3A" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
          </svg>
        </div>
        <h3 className="font-display text-[16px] font-semibold mb-2" style={{ color: '#0F1F18' }}>White label coming soon</h3>
        <p className="text-[13px] max-w-[380px] mx-auto" style={{ color: '#6B7A72' }}>
          Custom domain, remove &quot;Powered by Karta&quot; branding, and fully branded attendee experience. Available on Studio plan.
        </p>
      </div>
    </div>
  );
}
