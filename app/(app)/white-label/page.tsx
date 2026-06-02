'use client';

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { PageShell, Btn, Panel, Toggle, SectionLabel, Pill } from '@/components/dashboard/ui';

export default function WhiteLabelPage() {
  const [toggles, setToggles] = useState({
    hideBranding: true,
    customFooter: false,
    customFavicon: true,
    customEmailSender: false,
  });

  const toggle = (key: keyof typeof toggles) => setToggles(p => ({ ...p, [key]: !p[key] }));

  return (
    <PageShell
      title="White Label"
      subtitle="Make Karta yours — remove our branding"
      maxWidth="900px"
      actions={
        <Btn variant="primary">Save changes</Btn>
      }
    >
      {/* Custom domain */}
      <Panel title="Custom domain" className="mb-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[13px] text-[#3A4A42]">cards.yourcompany.com</span>
              <Pill tone="green" dot="#2D7A4F">DNS verified</Pill>
            </div>
            <p className="text-[13px]" style={{ color: '#6B7A72' }}>
              Attendees see your domain instead of <span className="font-mono">karta.cre8so.com</span>
            </p>
          </div>
          <Btn variant="ghost">Change domain</Btn>
        </div>
      </Panel>

      {/* Branding toggles */}
      <Panel title="Branding" className="mb-4">
        <div className="space-y-0">
          {[
            { key: 'hideBranding' as const, label: 'Hide Karta branding', desc: 'Remove "Powered by Karta" from all pages' },
            { key: 'customFooter' as const, label: 'Custom footer', desc: 'Show your company name and links in the footer' },
            { key: 'customFavicon' as const, label: 'Custom favicon', desc: 'Use your favicon on attendee pages' },
          ].map((row, i) => (
            <div
              key={row.key}
              className="flex items-center justify-between py-4"
              style={{ borderTop: i > 0 ? '1px solid #E5E0D4' : undefined }}
            >
              <div>
                <div className="text-[13.5px] font-medium text-[#0F1F18]">{row.label}</div>
                <div className="text-[12.5px] mt-0.5" style={{ color: '#6B7A72' }}>{row.desc}</div>
              </div>
              <Toggle on={toggles[row.key]} onChange={() => toggle(row.key)} />
            </div>
          ))}
        </div>
      </Panel>

      {/* Email sender */}
      <Panel title="Email sender" className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[13px]" style={{ color: '#6B7A72' }}>
            Confirmation emails appear from your domain instead of karta.cre8so.com
          </div>
          <Toggle on={toggles.customEmailSender} onChange={() => toggle('customEmailSender')} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <div className="font-mono uppercase mb-1.5" style={{ fontSize: 9.5, color: '#6B7A72' }}>From name</div>
            <input
              type="text"
              defaultValue="Acme Events"
              className="w-full h-9 px-3 rounded-lg border text-[13px] outline-none transition focus:border-[#1F4D3A]/40"
              style={{ background: 'white', borderColor: '#E5E0D4', color: '#0F1F18' }}
              disabled={!toggles.customEmailSender}
            />
          </div>
          <div>
            <div className="font-mono uppercase mb-1.5" style={{ fontSize: 9.5, color: '#6B7A72' }}>From address</div>
            <input
              type="email"
              defaultValue="events@acme.com"
              className="w-full h-9 px-3 rounded-lg border text-[13px] outline-none transition focus:border-[#1F4D3A]/40"
              style={{ background: 'white', borderColor: '#E5E0D4', color: '#0F1F18' }}
              disabled={!toggles.customEmailSender}
            />
          </div>
        </div>
      </Panel>
    </PageShell>
  );
}
