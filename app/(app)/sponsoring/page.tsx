export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getUserRoles, eventsWithRole } from '@/lib/rbac/roles';
import { Briefcase, MapPin, Users, Flame, ArrowRight } from 'lucide-react';
import { PageShell, PageHeader } from '@/components/dash';
import { ClaimSponsorButton } from './ClaimSponsorButton';

export const metadata: Metadata = { title: 'Sponsoring' };

type SponsorCard = {
  sponsorId: string;
  companyName: string;
  logoUrl: string | null;
  tier: string | null;
  boothLocation: string | null;
  inviteToken: string | null;
  eventName: string;
  eventSlug: string;
  leads: number;
  hot: number;
  warm: number;
  cold: number;
  resources: number;
  mode: 'sponsor' | 'exhibitor';
};

export default async function SponsoringPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/account/login?next=/sponsoring');

  const roles = await getUserRoles(user.id);
  const roleEventIds = eventsWithRole(roles, 'sponsor');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;

  const { data: profile } = await db
    .from('profiles')
    .select('email')
    .eq('id', user.id)
    .single();
  const email = (profile?.email as string | undefined)?.toLowerCase() ?? '';

  // Resolve sponsor rows by contact email AND via events where the account holds
  // an active 'sponsor' role. Merge, de-dupe by sponsor id.
  const [byEmailRes, byEventRes] = await Promise.all([
    email
      ? db.from('sponsors')
          .select('id, company_name, logo_url, tier, booth_location, invite_token, event_id')
          .ilike('contact_email', email)
      : Promise.resolve({ data: [] }),
    roleEventIds.length > 0
      ? db.from('sponsors')
          .select('id, company_name, logo_url, tier, booth_location, invite_token, event_id')
          .in('event_id', roleEventIds)
      : Promise.resolve({ data: [] }),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sponsorRows: any[] = [];
  const seen = new Set<string>();
  for (const row of [...((byEmailRes?.data) ?? []), ...((byEventRes?.data) ?? [])]) {
    if (!seen.has(row.id)) { seen.add(row.id); sponsorRows.push(row); }
  }

  let cards: SponsorCard[] = [];

  if (sponsorRows.length > 0) {
    const eventIds = Array.from(new Set(sponsorRows.map(s => s.event_id as string)));
    const sponsorIds = sponsorRows.map(s => s.id as string);

    const [eventsRes, leadsRes, resourcesRes, productsRes] = await Promise.all([
      db.from('events').select('id, name, slug').in('id', eventIds),
      db.from('sponsor_leads').select('sponsor_id, rating').in('sponsor_id', sponsorIds),
      db.from('sponsor_resources').select('sponsor_id').in('sponsor_id', sponsorIds),
      // exhibitor_products (migration 060) may not exist yet — never let it break the list.
      db.from('exhibitor_products').select('sponsor_id').in('sponsor_id', sponsorIds)
        .then((r: { data: unknown[] | null; error: unknown }) => (r.error ? { data: [] } : r)),
    ]);

    const productSponsorIds = new Set<string>(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (((productsRes?.data as any[]) ?? [])).map(p => p.sponsor_id as string),
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eventById = new Map<string, any>(((eventsRes?.data as any[]) ?? []).map(e => [e.id, e]));

    const leadsBySponsor = new Map<string, { total: number; hot: number; warm: number; cold: number }>();
    for (const l of ((leadsRes?.data) ?? [])) {
      const cur = leadsBySponsor.get(l.sponsor_id) ?? { total: 0, hot: 0, warm: 0, cold: 0 };
      cur.total += 1;
      if (l.rating === 'hot') cur.hot += 1;
      else if (l.rating === 'warm') cur.warm += 1;
      else if (l.rating === 'cold') cur.cold += 1;
      leadsBySponsor.set(l.sponsor_id, cur);
    }
    const resourcesBySponsor = new Map<string, number>();
    for (const r of ((resourcesRes?.data) ?? [])) {
      resourcesBySponsor.set(r.sponsor_id, (resourcesBySponsor.get(r.sponsor_id) ?? 0) + 1);
    }

    cards = sponsorRows
      .filter(s => eventById.has(s.event_id))
      .map(s => {
        const ev = eventById.get(s.event_id);
        const lead = leadsBySponsor.get(s.id) ?? { total: 0, hot: 0, warm: 0, cold: 0 };
        return {
          sponsorId: s.id,
          companyName: s.company_name,
          logoUrl: s.logo_url,
          tier: s.tier,
          boothLocation: s.booth_location,
          inviteToken: s.invite_token,
          eventName: ev.name as string,
          eventSlug: ev.slug as string,
          leads: lead.total,
          hot: lead.hot,
          warm: lead.warm,
          cold: lead.cold,
          resources: resourcesBySponsor.get(s.id) ?? 0,
          // An entry with a booth or products is an exhibitor; a pure partner is a sponsor.
          mode: (s.booth_location || productSponsorIds.has(s.id)) ? 'exhibitor' : 'sponsor',
        };
      });
  }

  const isEmpty = cards.length === 0;

  return (
    <PageShell>
        <PageHeader title="Sponsoring" subtitle="Your booths, leads, and exhibitor portals." />

        {isEmpty ? (
          <div className="bg-white rounded-2xl border p-8 sm:p-10 text-center"
            style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
            <div className="inline-grid place-items-center w-14 h-14 rounded-2xl mb-5"
              style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
              <Briefcase size={26} strokeWidth={1.7} />
            </div>
            <h2 className="font-display text-[20px] font-semibold tracking-tight" style={{ color: '#0F1F18' }}>
              No sponsorships yet
            </h2>
            <p className="mt-2 text-[14px] max-w-[420px] mx-auto leading-[1.6]" style={{ color: '#6B7A72' }}>
              When an organizer adds you as a sponsor, your booth and leads will appear here.
              If you were invited by email, claim access to link it to your account.
            </p>
            <div className="mt-6">
              <ClaimSponsorButton />
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {cards.map(card => (
              <section key={card.sponsorId} className="bg-white rounded-2xl border overflow-hidden"
                style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
                <div className="flex items-start gap-4 px-5 sm:px-6 py-5">
                  <span className="w-12 h-12 rounded-xl grid place-items-center overflow-hidden shrink-0"
                    style={{ background: '#FAF6EE', border: '1px solid #E5E0D4' }}>
                    {card.logoUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={card.logoUrl} alt="" className="w-full h-full object-contain" />
                      : <Briefcase size={20} strokeWidth={1.8} style={{ color: '#6B7A72' }} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display text-[16px] font-semibold truncate" style={{ color: '#0F1F18' }}>
                        {card.companyName}
                      </span>
                      <span className="text-[10.5px] font-medium px-2 py-0.5 rounded-full border"
                        style={{ background: '#E8EFEB', color: '#1F4D3A', borderColor: 'rgba(31,77,58,0.2)' }}>
                        {card.mode === 'exhibitor' ? 'Exhibitor' : 'Sponsor'}
                      </span>
                      {card.tier && (
                        <span className="text-[10.5px] font-medium px-2 py-0.5 rounded-full border capitalize"
                          style={{ background: 'rgba(232,197,126,0.16)', color: '#C9A45E', borderColor: 'rgba(232,197,126,0.4)' }}>
                          {card.tier}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-[13px]" style={{ color: '#6B7A72' }}>{card.eventName}</div>
                    {card.boothLocation && (
                      <div className="mt-1 inline-flex items-center gap-1.5 text-[12.5px]" style={{ color: '#6B7A72' }}>
                        <MapPin size={12} strokeWidth={1.9} /> {card.boothLocation}
                      </div>
                    )}
                  </div>
                </div>

                {/* Booth / lead summary */}
                <div className="grid grid-cols-3 border-t" style={{ borderColor: '#F0EDE6' }}>
                  {[
                    { icon: <Users size={14} strokeWidth={1.9} />, value: card.leads, label: 'Leads' },
                    { icon: <Flame size={14} strokeWidth={1.9} />, value: card.hot, label: 'Hot' },
                    { icon: <Briefcase size={14} strokeWidth={1.9} />, value: card.resources, label: 'Resources' },
                  ].map((stat, i) => (
                    <div key={i} className="px-4 py-4 text-center border-l first:border-l-0" style={{ borderColor: '#F0EDE6' }}>
                      <div className="inline-flex items-center gap-1.5 text-[18px] font-semibold" style={{ color: '#1F4D3A' }}>
                        <span style={{ color: '#6B7A72' }}>{stat.icon}</span>
                        {stat.value}
                      </div>
                      <div className="text-[11px] mt-0.5 uppercase tracking-[0.06em]" style={{ color: '#9BA8A1' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Lead quality breakdown — hot / warm / cold */}
                {card.leads > 0 && (
                  <div className="px-5 sm:px-6 py-4 border-t grid gap-2.5" style={{ borderColor: '#F0EDE6' }}>
                    {[
                      { label: 'Hot', count: card.hot, color: '#1F4D3A' },
                      { label: 'Warm', count: card.warm, color: '#2A6A50' },
                      { label: 'Cold', count: card.cold, color: '#A8C2B5' },
                    ].map((bar) => {
                      const pct = Math.round((bar.count / (card.leads || 1)) * 100);
                      return (
                        <div key={bar.label}>
                          <div className="flex items-center justify-between mb-1 text-[12.5px]">
                            <span style={{ color: '#3A4A42' }}>{bar.label}</span>
                            <span style={{ color: '#6B7A72' }}>{bar.count} · {pct}%</span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(232,239,235,0.6)' }}>
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: bar.color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Open the sponsor workspace — native dashboard route */}
                <div className="px-5 sm:px-6 py-4 border-t flex items-center justify-between gap-3"
                  style={{ borderColor: '#F0EDE6' }}>
                  <span className="text-[12.5px]" style={{ color: '#6B7A72' }}>
                    Manage leads, booth profile & resources
                  </span>
                  <Link href={`/sponsoring/${card.sponsorId}`}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-white text-[13px] font-medium transition hover:bg-[#163828]"
                    style={{ background: '#1F4D3A' }}>
                    Open workspace
                    <ArrowRight size={13} strokeWidth={2} />
                  </Link>
                </div>
              </section>
            ))}
          </div>
        )}
    </PageShell>
  );
}
