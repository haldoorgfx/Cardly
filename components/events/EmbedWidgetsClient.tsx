'use client';

import { useState } from 'react';
import { Check, Copy, Code2, ExternalLink } from 'lucide-react';
import { PageShell, PageHeader } from '@/components/dash';

interface Props {
  eventId: string;
  eventName: string;
  slug: string;
  status: string;
}

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? '';

type WidgetId = 'button' | 'card' | 'schedule';

const WIDGETS: { id: WidgetId; label: string; description: string }[] = [
  { id: 'button',   label: 'Register button',  description: 'A styled CTA button that opens the registration page.' },
  { id: 'card',     label: 'Event card',        description: 'A full event card with cover, date, and register link.' },
  { id: 'schedule', label: 'Schedule embed',    description: 'Embedded agenda/schedule for the event.' },
];

function getCode(widget: WidgetId, slug: string): string {
  const url = `${BASE}/e/${slug}`;
  const iframeBase = `<iframe src="${url}`;
  switch (widget) {
    case 'button':
      return `<!-- Eventera Register Button -->
<a href="${url}/register"
   style="display:inline-block;background:#1F4D3A;color:#FAF6EE;font-family:Inter,sans-serif;font-size:15px;font-weight:600;padding:12px 24px;border-radius:12px;text-decoration:none;"
   target="_blank" rel="noopener">
  Register now
</a>`;
    case 'card':
      return `<!-- Eventera Event Card -->
${iframeBase}"
  width="400" height="560"
  frameborder="0" scrolling="no"
  style="border-radius:16px;border:1px solid #E5E0D4;overflow:hidden;max-width:100%;"
  title="Event card">
</iframe>`;
    case 'schedule':
      return `<!-- Eventera Schedule Widget -->
${iframeBase}/schedule"
  width="100%" height="600"
  frameborder="0"
  style="border-radius:16px;border:1px solid #E5E0D4;overflow:hidden;"
  title="Event schedule">
</iframe>`;
  }
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative rounded-xl overflow-hidden" style={{ background: '#0F1F18', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <span className="flex items-center gap-1.5 text-[12.5px]" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter, system-ui, sans-serif' }}>
          <Code2 size={12} />
          HTML
        </span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-lg transition-colors"
          style={{ background: copied ? 'rgba(45,122,79,0.25)' : 'rgba(255,255,255,0.07)', color: copied ? '#2D7A4F' : 'rgba(255,255,255,0.6)' }}
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 text-[12px] leading-relaxed overflow-x-auto" style={{ color: '#E8C57E', fontFamily: 'Inter, system-ui, sans-serif', margin: 0 }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function EmbedWidgetsClient({ eventName, slug, status }: Props) {
  const [active, setActive] = useState<WidgetId>('button');
  const publicUrl = `${BASE}/e/${slug}`;

  const isUnpublished = status !== 'published';

  return (
    <PageShell width="wide">
      {/* Header */}
      <PageHeader
        eyebrow="Configure"
        title="Embed widgets"
        subtitle="Paste these snippets into any website to show your event."
      />

      {isUnpublished && (
        <div className="flex items-start gap-3 rounded-xl px-4 py-3.5 mb-8" style={{ background: '#FEF3C7', border: '1px solid #FDE68A' }}>
          <span className="text-[13px] font-medium" style={{ color: '#92400E' }}>
            Your event is not published yet. Widgets will show a placeholder until the event goes live.
          </span>
        </div>
      )}

      {/* Widget selector */}
      <div className="grid sm:grid-cols-3 gap-3 mb-8">
        {WIDGETS.map(w => (
          <button
            key={w.id}
            onClick={() => setActive(w.id)}
            className="text-left rounded-xl p-4 transition-all"
            style={{
              background: active === w.id ? '#1F4D3A' : '#FFFFFF',
              border: `1px solid ${active === w.id ? '#1F4D3A' : '#E5E0D4'}`,
            }}
          >
            <div className="text-[13px] font-semibold mb-1" style={{ color: active === w.id ? '#FAF6EE' : '#0F1F18' }}>
              {w.label}
            </div>
            <div className="text-[12px] leading-snug" style={{ color: active === w.id ? 'rgba(250,246,238,0.7)' : '#65736B' }}>
              {w.description}
            </div>
          </button>
        ))}
      </div>

      {/* Preview (for button widget) */}
      {active === 'button' && (
        <div className="rounded-xl p-6 mb-6 flex items-center justify-center" style={{ background: '#F5F2EC', border: '1px solid #E5E0D4', minHeight: 100 }}>
          <a
            href={`${publicUrl}/register`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-block', background: '#1F4D3A', color: '#FAF6EE', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, padding: '12px 24px', borderRadius: 12, textDecoration: 'none' }}
          >
            Register now
          </a>
        </div>
      )}

      {/* Code block */}
      <CodeBlock code={getCode(active, slug)} />

      {/* Instructions */}
      <div className="mt-6 rounded-xl p-5" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
        <h3 className="text-[13px] font-semibold mb-3" style={{ color: '#0F1F18' }}>How to use</h3>
        <ol className="space-y-2">
          {[
            'Copy the code snippet above.',
            'Open your website editor (Webflow, WordPress, Squarespace, Notion, etc.).',
            'Paste it in an HTML / Embed block.',
            'Save and publish your page.',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-[13px]" style={{ color: '#3A4A42' }}>
              <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[12px] font-semibold mt-0.5" style={{ background: '#E8EFEB', color: '#1F4D3A', fontFamily: 'Inter, system-ui, sans-serif' }}>
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* Public link */}
      <div className="mt-4 flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
        <span className="text-[12px] text-[#65736B]" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>{publicUrl}</span>
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto flex items-center gap-1.5 text-[12px] font-medium hover:opacity-75 transition"
          style={{ color: '#1F4D3A' }}
        >
          <ExternalLink size={12} />
          Open event
        </a>
      </div>

      {/* Event name */}
      <p className="mt-3 text-center text-[12px]" style={{ color: '#65736B' }}>
        Widgets for <span className="font-medium" style={{ color: '#0F1F18' }}>{eventName}</span>
      </p>
    </PageShell>
  );
}
