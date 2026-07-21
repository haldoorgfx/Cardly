export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { resolvePublicSlug } from '@/lib/events/resolvePublicSlug';
import { Check } from 'lucide-react';

interface Props {
  params: { slug: string; boothId: string };
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

// Safely derive a display hostname from a stored website URL. Values may be
// stored without a scheme (e.g. "example.com"), which makes `new URL()` throw
// and 500 the page. Prepend https:// when missing and fall back to the raw
// string if it still can't be parsed.
function safeHostname(url: string): string {
  const withScheme = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  try {
    return new URL(withScheme).hostname;
  } catch {
    return url;
  }
}

export default async function BoothPage({ params }: Props) {
  const admin = createAdminClient();

  const resolved = await resolvePublicSlug(params.slug);
  if (!resolved) notFound();
  const { event } = resolved;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sponsor } = await (admin as any)
    .from('sponsors')
    // Explicit column list. `select('*')` also pulled `invite_token` — the only
    // credential guarding the exhibitor portal (/exhibitor/[token]) — into a
    // public page. Nothing renders it today, so it never reached the HTML, but
    // one refactor into a client component would have published it.
    .select('id, company_name, tagline, description, logo_url, cover_url, website_url, booth_location, booth_hours, meeting_url, contact_email, offerings, team_members, event_id')
    .eq('id', params.boothId)
    .eq('event_id', event.id)
    .single();

  if (!sponsor) notFound();

  const offerings: string[] = sponsor.offerings ?? [];
  const teamMembers: { name: string; role: string; avatar_url?: string }[] = sponsor.team_members ?? [];

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>

      {/* Hero */}
      <div
        className="w-full relative overflow-hidden"
        style={{ height: 400, background: sponsor.cover_url ? 'transparent' : 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)' }}
      >
        {sponsor.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={sponsor.cover_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        {/* Gradient scrim */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(15,31,24,0.72) 100%)' }}
        />
        <div className="absolute inset-x-0 bottom-0 pb-10">
          <div className="max-w-[960px] mx-auto px-4 sm:px-6 lg:px-10">
            {sponsor.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={sponsor.logo_url}
                alt={sponsor.company_name}
                className="h-10 object-contain mb-4 rounded"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            )}
            <h1
              className="font-display font-normal text-[32px] text-white"
              style={{ letterSpacing: '-0.02em' }}
            >
              {sponsor.company_name}
            </h1>
            {sponsor.tagline && (
              <p className="text-[16px] mt-2" style={{ color: '#E8C57E' }}>{sponsor.tagline}</p>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div
        className="max-w-[960px] mx-auto px-4 sm:px-6 lg:px-10 py-12 flex flex-col-reverse lg:grid gap-10 lg:gap-14"
        style={{ gridTemplateColumns: '1fr 280px', alignItems: 'start' }}
      >
        {/* Left: content */}
        <div>
          {/* About */}
          {sponsor.description && (
            <div className="mb-10">
              <h2
                className="font-display font-normal text-[22px] mb-4"
                style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}
              >
                About {sponsor.company_name}
              </h2>
              <p className="text-[15px] leading-relaxed" style={{ color: '#3A4A42' }}>
                {sponsor.description}
              </p>
            </div>
          )}

          {/* Offerings */}
          {offerings.length > 0 && (
            <div className="mb-10">
              <h2
                className="font-display font-normal text-[22px] mb-4"
                style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}
              >
                What we&apos;re offering
              </h2>
              <div className="space-y-0">
                {offerings.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 py-3"
                    style={{ borderBottom: i < offerings.length - 1 ? '1px solid #E5E0D4' : 'none' }}
                  >
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: '#E8EFEB' }}
                    >
                      <Check size={11} strokeWidth={2.4} color="#3A4A42" />
                    </span>
                    <span className="text-[15px] leading-snug" style={{ color: '#3A4A42' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Team */}
          {teamMembers.length > 0 && (
            <div>
              <h2
                className="font-display font-normal text-[22px] mb-5"
                style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}
              >
                Meet the team at the booth
              </h2>
              <div className="flex flex-wrap gap-5">
                {teamMembers.map((member, i) => (
                  <div key={i} className="flex items-center gap-3">
                    {member.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={member.avatar_url}
                        alt={member.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-display font-semibold text-white text-[13px] shrink-0"
                        style={{ background: '#1F4D3A' }}
                      >
                        {initials(member.name)}
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-[14px]" style={{ color: '#0F1F18' }}>{member.name}</div>
                      <div className="text-[12px]" style={{ color: '#65736B' }}>{member.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: booth card */}
        <aside>
          <div
            className="rounded-2xl p-6 sticky"
            style={{ top: 88, background: 'white', border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(15,31,24,0.06)' }}
          >
            {sponsor.booth_location && (
              <div className=" font-normal text-[18px] mb-2" style={{ color: '#0F1F18' }}>
                {sponsor.booth_location}
              </div>
            )}
            {sponsor.booth_hours && (
              <div className=" text-[13px] mb-5" style={{ color: '#65736B' }}>
                Open: {sponsor.booth_hours}
              </div>
            )}

            {sponsor.contact_email && (
              <a
                href={`mailto:${sponsor.contact_email}`}
                className="flex items-center justify-center w-full py-3 rounded-xl font-display font-medium text-[15px] text-white transition-opacity hover:opacity-90"
                style={{ background: '#1F4D3A', marginBottom: 12 }}
              >
                Connect at the booth
              </a>
            )}

            {sponsor.meeting_url && (
              <a
                href={sponsor.meeting_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-full py-3 rounded-xl font-medium text-[14px] transition-colors hover:bg-[#F0EBE3]"
                style={{ background: 'transparent', border: '1px solid #E5E0D4', color: '#0F1F18' }}
              >
                Book a meeting
              </a>
            )}

            {sponsor.website_url && (
              <a
                href={sponsor.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-[13px] mt-4 hover:underline"
                style={{ color: '#65736B' }}
              >
                {safeHostname(sponsor.website_url)} →
              </a>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
