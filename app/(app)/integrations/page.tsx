'use client';

import { Zap, MessageSquare, Mail, Briefcase, BarChart2, CreditCard, Globe, CalendarDays } from 'lucide-react';
import { PageShell, Btn, Pill } from '@/components/dashboard/ui';

const INTEGRATIONS = [
  { name: 'Zapier', desc: 'Automate workflows with 5,000+ apps', icon: Zap, connected: true, color: '#FF4A00' },
  { name: 'Slack', desc: 'Get registration alerts in your channels', icon: MessageSquare, connected: true, color: '#4A154B' },
  { name: 'Mailchimp', desc: 'Sync registrants to email lists', icon: Mail, connected: false, color: '#FFE01B' },
  { name: 'Salesforce', desc: 'Push attendee data to your CRM', icon: Briefcase, connected: false, color: '#00A1E0' },
  { name: 'Google Analytics', desc: 'Track registration funnel events', icon: BarChart2, connected: true, color: '#E37400' },
  { name: 'Stripe', desc: 'Advanced payment & revenue reporting', icon: CreditCard, connected: true, color: '#635BFF' },
  { name: 'Flutterwave', desc: 'Accept payments across Africa', icon: Globe, connected: false, color: '#F5A623' },
  { name: 'Google Calendar', desc: 'Add events to attendee calendars', icon: CalendarDays, connected: false, color: '#4285F4' },
];

export default function IntegrationsPage() {
  return (
    <PageShell
      title="Integrations"
      subtitle="Connect Karta to your stack"
      actions={<Btn variant="ghost">Browse all</Btn>}
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {INTEGRATIONS.map((intg, i) => (
          <div
            key={i}
            className="bg-white border rounded-2xl p-5 flex items-start gap-4"
            style={{ borderColor: '#E5E0D4' }}
          >
            <div
              className="h-12 w-12 rounded-xl border grid place-items-center shrink-0"
              style={{ borderColor: '#E5E0D4', background: '#FAF6EE' }}
            >
              <intg.icon size={22} strokeWidth={1.7} color={intg.color} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-display font-semibold text-[14px] text-[#0F1F18]">{intg.name}</span>
                <Pill tone={intg.connected ? 'green' : 'neutral'} dot={intg.connected ? '#2D7A4F' : undefined}>
                  {intg.connected ? 'Connected' : 'Not connected'}
                </Pill>
              </div>
              <p className="text-[13px] text-[#6B7A72] mb-3 leading-snug">{intg.desc}</p>
              <Btn variant={intg.connected ? 'ghost' : 'soft'} className="text-[12px] h-7 px-3 py-0">
                {intg.connected ? 'Manage' : 'Connect'}
              </Btn>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
