'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Heart, Plus, Loader2, Star } from 'lucide-react';
import { buildSVG, TEMPLATE_CONFIGS, OVERLAY, W, H } from '@/lib/templates/svgs';
import { TEMPLATES, CATEGORIES, type CatalogTemplate as T } from '@/lib/templates/catalog';
import { PageShell, PageHeader } from '@/components/dash';
import { StatusState } from '@/components/ui/status-state';

/* ─────────────────────────────────────────────────────────────
   PERSON PLACEHOLDER DATA
   Sample names/roles so each card previews "filled" rather than
   with empty zones. Organizers' attendees replace these.
   No `photo` URL: the avatar is generated locally from the
   initials, so the gallery can never blank on a third-party
   image host outage.
───────────────────────────────────────────────────────────── */
interface Person { name: string; title: string; org: string }

const PEOPLE: Record<string, Person> = {
  atf:      { name:'Amara Osei',         title:'Lead Product Designer', org:'Paystack' },
  sunrise:  { name:'Kofi Mensah',        title:'Full-Stack Engineer',   org:'Andela' },
  devfest:  { name:'Zara Diallo',        title:'Developer Advocate',    org:'Google Africa' },
  gala:     { name:'Emmanuel Okonkwo',   title:'CEO',                   org:'Lagos Angel Network' },
  founders: { name:'Fatima Al-Hassan',   title:'Co-Founder & CEO',      org:'Kuda Bank' },
  nile:     { name:'Ahmed Khalil',       title:'Policy Director',       org:'African Union' },
  womentech:{ name:'Aisha Conteh',       title:'VP of Engineering',     org:'Flutterwave' },
  ai:       { name:'Marcus Taiwo',       title:'AI Research Lead',      org:'DeepMind Africa' },
  studio:   { name:'Lena Bekele',        title:'Creative Director',     org:'Studio Afrika' },
  sahara:   { name:'Yusuf Benmoussa',    title:'Founder & Partner',     org:'Sahara Ventures' },
  harvest:  { name:'Abena Amponsah',     title:'Artist Manager',        org:'Afrobeats Media' },
  agora:    { name:'Tunde Adeyemi',      title:'Public Policy Lead',    org:'Meta Africa' },
  pulse:    { name:'Nadia Ogunwale',     title:'Music Producer',        org:'Starboy Ent.' },
  nights:   { name:'DJ Kolade',          title:'Music Director',        org:'Lagos Nights' },
  chrome:   { name:'Sofia Mendes',       title:'Senior Engineer',       org:'Google' },
  cosmos:   { name:'Omar Idrissi',       title:'Executive Director',    org:'African Union' },
  faith:    { name:'Grace Wangari',      title:'Senior Pastor',         org:'Living Word Church' },
  arctic:   { name:'Lars Eriksson',      title:'CTO',                   org:'Nordic Tech AS' },
  run:      { name:'Chidi Okeke',        title:'Marathon Runner',       org:'Team Nigeria' },
  terra:    { name:'Sylvia Ngozi',       title:'Climate Scientist',     org:'UNEP Africa' },
  sea:      { name:'Brendan Eze',        title:'Backend Engineer',      org:'Interswitch' },
  zen:      { name:'Nia Kamara',         title:'Wellness Coach',        org:'Mind & Body Africa' },
  bloom:    { name:'Chiamaka Eze',       title:'Gender Advocate',       org:'UN Women' },
  editorial:{ name:'Pierre Mensah',      title:'Senior Editor',         org:'The Africa Report' },
  marathon: { name:'Selin Yilmaz',       title:'UX Lead',               org:'Design Collective' },
  prism:    { name:'Akin Babatunde',     title:'Creative Technologist', org:'Meta Creative' },
  pitch:    { name:'Chidera Nwosu',      title:'Founder',               org:'FinEdge Africa' },
  volta:    { name:'Felix Asante',       title:'Esports Captain',       org:'Team Volta' },
  century:  { name:'James Omondi',       title:'Managing Director',     org:'African Capital' },
  sport100: { name:'Victor Ikenna',      title:'Football Coach',        org:'AFCON Stars' },
};

/* TEMPLATES + CATEGORIES now live in lib/templates/catalog.ts — shared with the
   creation wizard, and with category counts derived from the list rather than
   hand-written (the hardcoded ones had drifted: Conferences said 7 for 8 cards,
   Creative said 3 for 2). */


/* ─────────────────────────────────────────────────────────────
   CARD PREVIEW
   Renders the EXACT same SVG as the editor background,
   then overlays the person photo/name/title/org at
   the precise zone coordinates (converted to CSS %).
───────────────────────────────────────────────────────────── */
function CardPreview({ id }: { id: string }) {
  const cfg    = TEMPLATE_CONFIGS[id];
  const person = PEOPLE[id];
  if (!cfg || !person) return null;

  const svgStr = buildSVG(id, cfg.text);
  const svgUrl = `data:image/svg+xml,${encodeURIComponent(svgStr)}`;
  const accent = cfg.accent;
  const light  = cfg.light;

  // Photo size in % of card width (matches zone: PHOTO_R*2 / W)
  const photoSizePct = `${((296 / W) * 100).toFixed(2)}%`;

  return (
    <div style={{ position:'absolute', inset:0 }}>
      {/* THE SVG — same as what sharp rasterises for the editor background */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={svgUrl}
        alt=""
        style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', display:'block' }}
      />

      {/* ── PERSON OVERLAY — positioned at exact zone coordinates ──
          The page promises "what you see is what you edit", so this overlay
          mirrors lib/templates/apply.ts#getTemplateZones exactly: the photo
          border is the zone's 4px accent ring, the name renders in DM Sans and
          the organization in Inter. It previously used a radial glow, Arial
          Black and Courier monospace — none of which the rasterized card has
          (and all of which the anti-slop rules forbid), so every preview
          overstated the design the organizer would actually get. */}

      {/* Photo circle — matches photoBorderColor/photoBorderWidth on z-photo */}
      <div style={{
        position:'absolute',
        left: OVERLAY.photo.cx, top: OVERLAY.photo.cy,
        width: photoSizePct, aspectRatio:'1',
        transform:'translate(-50%,-50%)',
        borderRadius:'50%',
        border:`4px solid ${accent}`,
        overflow:'hidden',
      }}>
        {(() => {
          // Locally-generated, accent-coloured initials avatar — no external
          // image host, so the flagship gallery can never blank on an outage.
          const initials = person.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
          const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><rect width='120' height='120' fill='${accent}'/><text x='50%' y='50%' dy='.35em' text-anchor='middle' font-family='sans-serif' font-size='44' fill='white'>${initials}</text></svg>`;
          const src = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
          // eslint-disable-next-line @next/next/no-img-element
          return <img src={src} alt={person.name} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />;
        })()}
      </div>

      {/* Name */}
      <div style={{
        position:'absolute',
        left:'50%', top: OVERLAY.name.top,
        transform:'translate(-50%,-50%)',
        width:'86%',
        textAlign:'center',
        fontFamily:'DM Sans, sans-serif', // z-name zone font
        fontWeight:700,
        fontSize:`${(56 / H * 100 * 1.25).toFixed(2)}%`, // scale font with card height
        lineHeight:1.1,
        color: light ? '#0F1F18' : '#FFFFFF',
        letterSpacing:'-0.02em',
        whiteSpace:'nowrap',
        overflow:'hidden',
        textOverflow:'ellipsis',
        textShadow: light ? 'none' : '0 2px 12px rgba(0,0,0,0.55)',
      }}>
        {person.name}
      </div>

      {/* Title */}
      <div style={{
        position:'absolute',
        left:'50%', top: OVERLAY.title.top,
        transform:'translate(-50%,-50%)',
        width:'84%',
        textAlign:'center',
        fontFamily:'Inter, sans-serif', // z-title zone font
        fontWeight:400,
        fontSize:`${(26 / H * 100 * 1.25).toFixed(2)}%`,
        color: light ? 'rgba(0,0,0,0.58)' : 'rgba(255,255,255,0.65)',
        whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
        textShadow: light ? 'none' : '0 1px 8px rgba(0,0,0,0.40)',
      }}>
        {person.title}
      </div>

      {/* Org */}
      <div style={{
        position:'absolute',
        left:'50%', top: OVERLAY.org.top,
        transform:'translate(-50%,-50%)',
        width:'80%',
        textAlign:'center',
        fontFamily:'Inter, sans-serif', // z-org zone font — never monospace
        fontWeight:400,
        fontSize:`${(22 / H * 100 * 1.25).toFixed(2)}%`,
        color: light ? 'rgba(0,0,0,0.40)' : (accent.startsWith('rgba') ? 'rgba(255,255,255,0.45)' : `${accent}BB`),
        whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
        textShadow: light ? 'none' : '0 1px 6px rgba(0,0,0,0.40)',
      }}>
        {person.org}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────────── */
export default function TemplatesPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'popular' | 'newest' | 'az'>('popular');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<string | null>(null);

  // DB-backed platform templates
  const [dbTemplates, setDbTemplates] = useState<{
    id: string; name: string; category: string | null;
    thumbnail_url: string | null; min_plan: string; featured: boolean;
  }[]>([]);

  useEffect(() => {
    fetch('/api/templates/published')
      .then(r => r.json())
      .then(d => { if (d.templates) setDbTemplates(d.templates); })
      .catch(() => {});
  }, []);

  // Favourites survive a reload. The heart used to be pure decoration — state
  // was dropped on navigation, so hearting a template did nothing at all.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('eventera:template-favorites');
      if (saved) setFavorites(new Set(JSON.parse(saved) as string[]));
    } catch { /* private mode / corrupt value — favourites are non-essential */ }
  }, []);

  const toggleFav = (id: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setFavorites(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      // Array.from, not spread — tsconfig targets ES5 without downlevelIteration.
      try { window.localStorage.setItem('eventera:template-favorites', JSON.stringify(Array.from(n))); } catch { /* non-essential */ }
      return n;
    });
  };

  /**
   * Picking a template hands off to the creation wizard rather than creating the
   * event here.
   *
   * The old path POSTed to /api/templates/use, which made an `events` row with
   * no `event_pages` row and no dates, then dropped the organizer straight into
   * Card Studio. That event had no public page and no register link, and the
   * Publish screen showed blank dates — the design was ready before the event
   * existed. Now the template rides along as ?template= and is applied by
   * /api/events/create-basic once the name and dates are in.
   */
  const openTemplate = (templateId: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(templateId);
    router.push(`/events/new?template=${encodeURIComponent(templateId)}`);
  };

  const filtered = TEMPLATES.filter(t => {
    const matchesCat  = activeCategory === 'all' || t.cat === activeCategory;
    const matchesSearch = !search || t.name.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Sort the filtered set. Array order is the curated "popularity" order, so
  // POPULAR-badged cards float up for "Most popular" and NEW ones for "Newest";
  // Array.prototype.sort is stable, so equal-rank cards keep their curated order.
  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'az') return a.name.localeCompare(b.name);
    if (sort === 'newest') {
      const rank = (t: T) => (t.badge === 'NEW' ? 0 : 1);
      return rank(a) - rank(b);
    }
    const rank = (t: T) => (t.badge === 'POPULAR' ? 0 : t.badge === 'NEW' ? 1 : 2);
    return rank(a) - rank(b);
  });

  return (
    <PageShell width="wide">

      {/* Header */}
      <PageHeader
        title="Templates"
        subtitle="30 professionally designed event cards — what you see is what you edit."
        actions={
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#65736B]/60 pointer-events-none" size={13} strokeWidth={2} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates…"
              className="w-[240px] h-8 pl-8 pr-3 rounded-lg text-[13px] focus:outline-none transition"
              style={{ background:'#FAF6EE', border:'1px solid #E5E0D4', color:'#0F1F18' }} />
          </div>
        }
      />

      {/* No error banner: picking a template is now a client-side navigation to
          the creation wizard, so plan limits and template errors surface there,
          next to the Create button that triggers them. */}

      {/* Category chips */}
      <div className="pb-4">
        <div className="flex items-center gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button key={cat.key} onClick={() => setActiveCategory(cat.key)}
              className={`inline-flex items-center justify-center h-9 px-4 rounded-full text-[12.5px] font-medium transition-all duration-150 ${
                activeCategory === cat.key ? 'bg-[#0F1F18] text-white' : 'bg-white border border-[#E5E0D4] text-[#0F1F18]/65 hover:bg-[#FAF6EE] hover:text-[#0F1F18]'
              }`}>
              {cat.label}
              <span className={`ml-1.5  text-[12px] ${activeCategory === cat.key ? 'opacity-50' : 'opacity-40'}`}>{cat.count}</span>
            </button>
          ))}
          <div className="flex-1" />
          <div className="relative">
            <select
              value={sort}
              onChange={e => setSort(e.target.value as 'popular' | 'newest' | 'az')}
              aria-label="Sort templates"
              className="h-9 pl-4 pr-8 rounded-full bg-white border border-[#E5E0D4] text-[12.5px] outline-none cursor-pointer hover:bg-[#FAF6EE] transition appearance-none"
            >
              <option value="popular">Most popular</option>
              <option value="newest">Newest</option>
              <option value="az">A–Z</option>
            </select>
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#65736B" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </div>
      </div>

      {/* Grid — 3 cols on lg, 4 on xl so cards are large + impactful */}
      <div className="pb-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6">

          {/* Start blank */}
          <Link href="/events/new"
            className="group rounded-2xl border-2 border-dashed border-[#1F4D3A]/25 hover:border-[#1F4D3A] bg-white transition-all flex flex-col items-center justify-center text-center p-8"
            style={{ aspectRatio:`${W}/${H}` }}>
            <div className="h-14 w-14 rounded-2xl grid place-items-center text-white mb-4 group-hover:scale-110 transition-transform duration-200"
              style={{ background:'#1F4D3A', boxShadow:'0 8px 20px rgba(15,31,24,0.18)' }}>
              <Plus size={26} strokeWidth={2.4} />
            </div>
            <div className="font-display font-bold text-[17px]">Start blank</div>
            <div className="text-[13px] text-[#0F1F18]/50 mt-1.5 leading-snug">Upload your own design</div>
          </Link>

          {sorted.map(tmpl => {
            const isLoading = loading === tmpl.id;
            return (
              <div key={tmpl.id} className="group block cursor-pointer" onClick={e => openTemplate(tmpl.id, e)}>

                {/* Card — fixed aspect ratio matching SVG canvas */}
                <div className="relative rounded-2xl overflow-hidden transition-all duration-200 group-hover:-translate-y-2 group-hover:shadow-2xl"
                  style={{ aspectRatio:`${W}/${H}`, boxShadow:'0 4px 20px rgba(15,31,24,0.14)', opacity: isLoading ? 0.7 : 1 }}>

                  <CardPreview id={tmpl.id} />

                  {/* POPULAR / NEW badge */}
                  {tmpl.badge && !isLoading && (
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11.5px] tracking-widest text-white z-10"
                      style={{ background:'#1F4D3A' }}>
                      {tmpl.badge}
                    </div>
                  )}

                  {/* Hover CTA */}
                  <div className={`absolute inset-0 z-20 flex flex-col items-center justify-end pb-4 px-4 transition-all duration-200 ${
                    isLoading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`} style={{ background:'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.08) 45%, transparent 100%)' }}>
                    <div className="w-full text-white text-center py-3 rounded-xl font-display font-bold text-[14px] flex items-center justify-center gap-2"
                      style={{ background:'#1F4D3A', boxShadow:'0 8px 20px rgba(15,31,24,0.3)' }}>
                      {isLoading
                        ? <><Loader2 size={14} strokeWidth={2} className="animate-spin" />Opening…</>
                        : 'Use this template →'}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-display font-semibold text-[14px] leading-tight truncate">{tmpl.name}</div>
                    <div className="text-[12.5px] text-[#0F1F18]/40 tracking-wide mt-0.5">{tmpl.catLabel}</div>
                  </div>
                  <button onClick={e => toggleFav(tmpl.id, e)}
                    className={`h-7 w-7 rounded-lg grid place-items-center shrink-0 transition hover:bg-[#FAF6EE] ${favorites.has(tmpl.id) ? 'text-[#E8C57E]' : 'text-[#0F1F18]/25 hover:text-[#0F1F18]/50'}`}>
                    <Heart size={14} strokeWidth={2} fill={favorites.has(tmpl.id) ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <StatusState
            kind="empty"
            title="No templates match"
            message="Try a different search term or category."
            primaryAction={{ label: 'Clear filters', onClick: () => { setSearch(''); setActiveCategory('all'); } }}
          />
        )}

        {/* ── Platform templates (DB-backed) ──────────────────── */}
        {dbTemplates.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-[#E5E0D4]" />
              <span className="text-[12px] text-[#65736B] uppercase tracking-widest">Platform templates</span>
              <div className="h-px flex-1 bg-[#E5E0D4]" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {dbTemplates.map(t => (
                <div key={t.id} className="group relative rounded-2xl border border-[#E5E0D4] overflow-hidden bg-white cursor-pointer hover:border-[#1F4D3A]/40 transition-colors"
                  onClick={e => openTemplate(`db:${t.id}`, e as React.MouseEvent)}>
                  <div className="aspect-[4/3] bg-[#FAF6EE] relative overflow-hidden">
                    {t.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.thumbnail_url} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center text-[#65736B]">
                        <svg className="w-8 h-8 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M4.5 19.5h15M3.75 6.75h16.5" />
                        </svg>
                      </div>
                    )}
                    {t.featured && (
                      <div className="absolute top-2 right-2 bg-[#E8C57E] rounded-full p-1">
                        <Star size={9} strokeWidth={2} className="text-[#0F1F18]" fill="currentColor" />
                      </div>
                    )}
                    {loading === `db:${t.id}` && (
                      <div className="absolute inset-0 bg-white/70 grid place-items-center">
                        <Loader2 size={20} strokeWidth={2} className="animate-spin text-[#1F4D3A]" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="font-medium text-[13px] text-[#0F1F18] truncate">{t.name}</div>
                    {t.category && (
                      <div className="text-[12px] text-[#65736B] uppercase tracking-wide mt-0.5">{t.category}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coming soon */}
        <div className="mt-12 rounded-2xl border border-dashed border-[#1F4D3A]/20 bg-[#1F4D3A]/[0.03] px-8 py-8 text-center">
          <div className="text-[12px] tracking-widest text-[#65736B]/60 mb-2 uppercase">Coming soon</div>
          <div className="font-display font-bold text-[22px]">Submit your own template</div>
          <p className="text-[13.5px] text-[#0F1F18]/55 mt-2 max-w-[420px] mx-auto">Save any event design as a reusable template and share it with the community.</p>
          <Link href="/pricing" className="mt-5 inline-flex items-center gap-2 text-[13px] font-semibold text-white px-6 py-3 rounded-lg hover:bg-[#163828] transition"
            style={{ background:'#1F4D3A' }}>
            See Studio plan →
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
