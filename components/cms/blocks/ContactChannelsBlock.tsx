import { Mail, MessageSquare, ExternalLink } from 'lucide-react';
import type { ContactChannelsContent, ContactChannel } from '@/lib/cms/types';

interface ContactChannelsBlockProps {
  content: ContactChannelsContent;
}

function ChannelIcon({ icon }: { icon: string }) {
  if (icon === 'mail') return <Mail size={18} strokeWidth={1.8} />;
  if (icon === 'whatsapp') return <MessageSquare size={18} strokeWidth={1.8} />;
  return <ExternalLink size={18} strokeWidth={1.8} />;
}

function ChannelCard({ channel }: { channel: ContactChannel }) {
  return (
    <a
      href={channel.href}
      target={channel.href.startsWith('mailto:') ? undefined : '_blank'}
      rel="noopener noreferrer"
      className="group rounded-2xl border p-7 transition-all hover:shadow-[0_4px_12px_rgba(15,31,24,0.08),_0_24px_60px_rgba(31,77,58,0.12)]"
      style={{
        borderColor: '#E5E0D4',
        background: '#FFFFFF',
      }}
    >
      <div
        className="h-10 w-10 rounded-xl grid place-items-center mb-5 transition-colors"
        style={{ background: '#E8EFEB', color: '#1F4D3A' }}
      >
        <ChannelIcon icon={channel.icon} />
      </div>
      <div
        className="font-display font-semibold text-[17px] mb-1 tracking-tight"
        style={{ color: '#0F1F18' }}
      >
        {channel.label}
      </div>
      <div
        className="font-mono text-[14px]"
        style={{ color: '#1F4D3A' }}
      >
        {channel.href.replace('mailto:', '')}
      </div>
      <div
        className="mt-2 text-[13px] leading-[1.55]"
        style={{ color: 'rgba(15,31,24,0.50)' }}
      >
        {channel.description}
      </div>
    </a>
  );
}

export function ContactChannelsBlock({ content }: ContactChannelsBlockProps) {
  return (
    <section className="mx-auto max-w-[820px] px-5 lg:px-6 py-16 lg:py-20">
      {content.header && (
        <div className="mb-12">
          {content.header.eyebrow && (
            <div
              className="font-mono text-[11px] tracking-[0.18em] uppercase mb-4"
              style={{ color: '#1F4D3A' }}
            >
              {content.header.eyebrow}
            </div>
          )}
          <h2
            className="font-display font-bold text-[36px] sm:text-[48px] leading-[1.02] tracking-tight mb-4"
            style={{ color: '#0F1F18' }}
          >
            {content.header.headline}
          </h2>
          {content.header.subtext && (
            <p
              className="text-[17px] leading-relaxed max-w-[480px]"
              style={{ color: 'rgba(15,31,24,0.65)' }}
            >
              {content.header.subtext}
            </p>
          )}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-5">
        {content.channels.map((channel, i) => (
          <ChannelCard key={i} channel={channel} />
        ))}
      </div>

      {content.reasons && content.reasons.length > 0 && (
        <div
          className="mt-12 rounded-2xl border p-7"
          style={{
            background: '#E8EFEB',
            borderColor: '#E5E0D4',
          }}
        >
          <div
            className="font-mono text-[11px] tracking-widest uppercase mb-4"
            style={{ color: 'rgba(15,31,24,0.40)' }}
          >
            Good reasons to reach out
          </div>
          <ul className="space-y-2.5">
            {content.reasons.map((reason, i) => (
              <li
                key={i}
                className="flex gap-2.5 text-[15px]"
                style={{ color: 'rgba(15,31,24,0.70)' }}
              >
                <span
                  className="mt-2 h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ background: '#1F4D3A' }}
                />
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
