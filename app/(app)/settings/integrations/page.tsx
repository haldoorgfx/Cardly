import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SettingsTabs } from '@/components/settings/SettingsTabs';

export const metadata = { title: 'Integrations — Karta' };

const INTEGRATIONS = [
  { name: 'Zapier', desc: 'Connect Karta to 5,000+ apps without code.', status: 'soon' },
  { name: 'Mailchimp', desc: 'Sync attendees directly to your email lists.', status: 'soon' },
  { name: 'Slack', desc: 'Get registration alerts in your Slack channels.', status: 'soon' },
  { name: 'HubSpot', desc: 'Push registrant data into your CRM automatically.', status: 'soon' },
  { name: 'Google Sheets', desc: 'Export attendee data to a live spreadsheet.', status: 'soon' },
  { name: 'Stripe', desc: 'Accept card payments for paid events.', status: 'soon' },
];

export default async function IntegrationsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <>
      <SettingsTabs />
    <div className="px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="font-display font-semibold text-[24px] tracking-tight" style={{ color: '#0F1F18' }}>Integrations</h1>
        <p className="mt-1.5 text-[14px]" style={{ color: '#6B7A72' }}>Connect Karta to your existing tools and workflows.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {INTEGRATIONS.map(int => (
          <div key={int.name} className="bg-white rounded-2xl p-5" style={{ border: '1px solid #E5E0D4' }}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl grid place-items-center text-[16px] font-bold"
                style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                {int.name[0]}
              </div>
              <span className="font-mono text-[9.5px] tracking-[0.14em] uppercase px-2 py-1 rounded-full"
                style={{ background: '#F5F3EE', color: '#6B7A72', border: '1px solid #E5E0D4' }}>
                Soon
              </span>
            </div>
            <div className="font-display text-[14.5px] font-semibold mb-1" style={{ color: '#0F1F18' }}>{int.name}</div>
            <p className="text-[12.5px]" style={{ color: '#6B7A72' }}>{int.desc}</p>
          </div>
        ))}
      </div>
    </div>
    </>
  );
}
