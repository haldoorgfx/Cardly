'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Heart, Plus, Loader2, Star } from 'lucide-react';
import { buildSVG, TEMPLATE_CONFIGS, OVERLAY, W, H } from '@/lib/templates/svgs';

/* ─────────────────────────────────────────────────────────────
   PERSON PLACEHOLDER DATA
   Real photos + realistic names. Users replace these in the
   editor with their own info — this is the "filled" preview.
───────────────────────────────────────────────────────────── */
interface Person { name: string; title: string; org: string; photo: string }

const PEOPLE: Record<string, Person> = {
  atf:      { name:'Amara Osei',         title:'Lead Product Designer', org:'Paystack',            photo:'https://randomuser.me/api/portraits/women/44.jpg' },
  sunrise:  { name:'Kofi Mensah',        title:'Full-Stack Engineer',   org:'Andela',              photo:'https://randomuser.me/api/portraits/men/32.jpg'   },
  devfest:  { name:'Zara Diallo',        title:'Developer Advocate',    org:'Google Africa',       photo:'https://randomuser.me/api/portraits/women/22.jpg' },
  gala:     { name:'Emmanuel Okonkwo',   title:'CEO',                   org:'Lagos Angel Network', photo:'https://randomuser.me/api/portraits/men/14.jpg'   },
  founders: { name:'Fatima Al-Hassan',   title:'Co-Founder & CEO',      org:'Kuda Bank',           photo:'https://randomuser.me/api/portraits/women/29.jpg' },
  nile:     { name:'Ahmed Khalil',       title:'Policy Director',       org:'African Union',       photo:'https://randomuser.me/api/portraits/men/8.jpg'    },
  womentech:{ name:'Aisha Conteh',       title:'VP of Engineering',     org:'Flutterwave',         photo:'https://randomuser.me/api/portraits/women/6.jpg'  },
  ai:       { name:'Marcus Taiwo',       title:'AI Research Lead',      org:'DeepMind Africa',     photo:'https://randomuser.me/api/portraits/men/27.jpg'   },
  studio:   { name:'Lena Bekele',        title:'Creative Director',     org:'Studio Afrika',       photo:'https://randomuser.me/api/portraits/women/12.jpg' },
  sahara:   { name:'Yusuf Benmoussa',    title:'Founder & Partner',     org:'Sahara Ventures',     photo:'https://randomuser.me/api/portraits/men/40.jpg'   },
  harvest:  { name:'Abena Amponsah',     title:'Artist Manager',        org:'Afrobeats Media',     photo:'https://randomuser.me/api/portraits/women/38.jpg' },
  agora:    { name:'Tunde Adeyemi',      title:'Public Policy Lead',    org:'Meta Africa',         photo:'https://randomuser.me/api/portraits/men/20.jpg'   },
  pulse:    { name:'Nadia Ogunwale',     title:'Music Producer',        org:'Starboy Ent.',        photo:'https://randomuser.me/api/portraits/women/47.jpg' },
  nights:   { name:'DJ Kolade',          title:'Music Director',        org:'Lagos Nights',        photo:'https://randomuser.me/api/portraits/men/55.jpg'   },
  chrome:   { name:'Sofia Mendes',       title:'Senior Engineer',       org:'Google',              photo:'https://randomuser.me/api/portraits/women/31.jpg' },
  cosmos:   { name:'Omar Idrissi',       title:'Executive Director',    org:'African Union',       photo:'https://randomuser.me/api/portraits/men/48.jpg'   },
  faith:    { name:'Grace Wangari',      title:'Senior Pastor',         org:'Living Word Church',  photo:'https://randomuser.me/api/portraits/women/60.jpg' },
  arctic:   { name:'Lars Eriksson',      title:'CTO',                   org:'Nordic Tech AS',      photo:'https://randomuser.me/api/portraits/men/7.jpg'    },
  run:      { name:'Chidi Okeke',        title:'Marathon Runner',       org:'Team Nigeria',        photo:'https://randomuser.me/api/portraits/men/62.jpg'   },
  terra:    { name:'Sylvia Ngozi',       title:'Climate Scientist',     org:'UNEP Africa',         photo:'https://randomuser.me/api/portraits/women/3.jpg'  },
  sea:      { name:'Brendan Eze',        title:'Backend Engineer',      org:'Interswitch',         photo:'https://randomuser.me/api/portraits/men/18.jpg'   },
  zen:      { name:'Nia Kamara',         title:'Wellness Coach',        org:'Mind & Body Africa',  photo:'https://randomuser.me/api/portraits/women/51.jpg' },
  bloom:    { name:'Chiamaka Eze',       title:'Gender Advocate',       org:'UN Women',            photo:'https://randomuser.me/api/portraits/women/24.jpg' },
  editorial:{ name:'Pierre Mensah',      title:'Senior Editor',         org:'The Africa Report',   photo:'https://randomuser.me/api/portraits/men/36.jpg'   },
  marathon: { name:'Selin Yilmaz',       title:'UX Lead',               org:'Design Collective',   photo:'https://randomuser.me/api/portraits/women/9.jpg'  },
  prism:    { name:'Akin Babatunde',     title:'Creative Technologist', org:'Meta Creative',       photo:'https://randomuser.me/api/portraits/men/63.jpg'   },
  pitch:    { name:'Chidera Nwosu',      title:'Founder',               org:'FinEdge Africa',      photo:'https://randomuser.me/api/portraits/women/16.jpg' },
  volta:    { name:'Felix Asante',       title:'Esports Captain',       org:'Team Volta',          photo:'https://randomuser.me/api/portraits/men/42.jpg'   },
  century:  { name:'James Omondi',       title:'Managing Director',     org:'African Capital',     photo:'https://randomuser.me/api/portraits/men/25.jpg'   },
  sport100: { name:'Victor Ikenna',      title:'Football Coach',        org:'AFCON Stars',         photo:'https://randomuser.me/api/portraits/men/57.jpg'   },
};

const CATEGORIES = [
  { key:'all',        label:'All',              count:30 },
  { key:'tech',       label:'Tech & Startup',   count:8  },
  { key:'conference', label:'Conferences',       count:7  },
  { key:'music',      label:'Music & Culture',   count:3  },
  { key:'workshop',   label:'Workshops',         count:3  },
  { key:'webinar',    label:'Webinars',          count:1  },
  { key:'sport',      label:'Sport',             count:2  },
  { key:'ngo',        label:'NGO / Religious',   count:3  },
  { key:'creative',   label:'Creative & Design', count:3  },
];

interface T {
  id: string; name: string; cat: string; catLabel: string; badge: string | null;
}

const TEMPLATES: T[] = [
  { id:'atf',       name:'Africa Tech Festival',      cat:'conference', catLabel:'CONFERENCE', badge:'POPULAR' },
  { id:'sunrise',   name:'Sunrise Hackathon',          cat:'tech',       catLabel:'HACKATHON',  badge:'NEW'     },
  { id:'devfest',   name:'Devfest Lagos',              cat:'tech',       catLabel:'CONFERENCE', badge:null      },
  { id:'gala',      name:'Black Tie Gala',             cat:'conference', catLabel:'GALA',       badge:null      },
  { id:'founders',  name:'Founders Retreat',           cat:'workshop',   catLabel:'WORKSHOP',   badge:null      },
  { id:'nile',      name:'The Nile Forum',             cat:'conference', catLabel:'FORUM',      badge:null      },
  { id:'womentech', name:'Women in Tech Summit',       cat:'tech',       catLabel:'SUMMIT',     badge:'NEW'     },
  { id:'ai',        name:'AI Ethics Webinar',          cat:'webinar',    catLabel:'WEBINAR',    badge:'NEW'     },
  { id:'studio',    name:'Studio Sessions',            cat:'workshop',   catLabel:'WORKSHOP',   badge:null      },
  { id:'sahara',    name:'Sahara Leadership Summit',   cat:'conference', catLabel:'SUMMIT',     badge:null      },
  { id:'harvest',   name:'Harvest Festival',           cat:'music',      catLabel:'FESTIVAL',   badge:null      },
  { id:'agora',     name:'Agora Open Forum',           cat:'conference', catLabel:'FORUM',      badge:null      },
  { id:'pulse',     name:'Pulse Music Fest',           cat:'music',      catLabel:'MUSIC',      badge:'POPULAR' },
  { id:'nights',    name:'Lagos Nights',               cat:'music',      catLabel:'MUSIC',      badge:null      },
  { id:'chrome',    name:'Chrome Dev Summit',          cat:'tech',       catLabel:'SUMMIT',     badge:null      },
  { id:'cosmos',    name:'Cosmos Leadership Forum',    cat:'conference', catLabel:'FORUM',      badge:null      },
  { id:'faith',     name:'Faith Conference',           cat:'ngo',        catLabel:'RELIGIOUS',  badge:null      },
  { id:'arctic',    name:'Arctic Tech Conference',     cat:'tech',       catLabel:'CONFERENCE', badge:null      },
  { id:'run',       name:'Run Lagos 10K',              cat:'sport',      catLabel:'SPORT',      badge:null      },
  { id:'terra',     name:'Terra Climate Summit',       cat:'ngo',        catLabel:'SUMMIT',     badge:'NEW'     },
  { id:'sea',       name:'Devs at Sea',                cat:'tech',       catLabel:'CONFERENCE', badge:null      },
  { id:'zen',       name:'Zen Wellness Summit',        cat:'workshop',   catLabel:'WELLNESS',   badge:null      },
  { id:'bloom',     name:"Bloom Women's Forum",        cat:'ngo',        catLabel:'FORUM',      badge:'NEW'     },
  { id:'editorial', name:'The Press Forum',            cat:'conference', catLabel:'MEDIA',      badge:null      },
  { id:'marathon',  name:'Design Marathon',            cat:'creative',   catLabel:'CREATIVE',   badge:'NEW'     },
  { id:'prism',     name:'Prism Design Week',          cat:'creative',   catLabel:'DESIGN',     badge:null      },
  { id:'pitch',     name:'The Pitch Competition',      cat:'tech',       catLabel:'STARTUP',    badge:null      },
  { id:'volta',     name:'Volta Gaming Expo',          cat:'tech',       catLabel:'GAMING',     badge:'POPULAR' },
  { id:'century',   name:'Century Business Forum',     cat:'conference', catLabel:'BUSINESS',   badge:null      },
  { id:'sport100',  name:'100 Days to Kickoff',        cat:'sport',      catLabel:'SPORT',      badge:null      },
];

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
  // Ring size (slightly larger for glow ring)
  const ringSizePct  = `${((330 / W) * 100).toFixed(2)}%`;

  return (
    <div style={{ position:'absolute', inset:0 }}>
      {/* THE SVG — same as what sharp rasterises for the editor background */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={svgUrl}
        alt=""
        style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', display:'block' }}
      />

      {/* ── PERSON OVERLAY — positioned at exact zone coordinates ── */}

      {/* Glow ring behind photo */}
      <div style={{
        position:'absolute',
        left: OVERLAY.photo.cx, top: OVERLAY.photo.cy,
        width: ringSizePct, aspectRatio:'1',
        transform:'translate(-50%,-50%)',
        borderRadius:'50%',
        background: `radial-gradient(circle, ${accent}30 0%, transparent 72%)`,
        pointerEvents:'none',
      }} />

      {/* Photo circle */}
      <div style={{
        position:'absolute',
        left: OVERLAY.photo.cx, top: OVERLAY.photo.cy,
        width: photoSizePct, aspectRatio:'1',
        transform:'translate(-50%,-50%)',
        borderRadius:'50%',
        border:`3px solid ${accent}90`,
        overflow:'hidden',
        boxShadow:`0 0 0 4px ${accent}22, 0 12px 36px rgba(0,0,0,0.45)`,
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={person.photo}
          alt={person.name}
          style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
          loading="lazy"
        />
      </div>

      {/* Name */}
      <div style={{
        position:'absolute',
        left:'50%', top: OVERLAY.name.top,
        transform:'translate(-50%,-50%)',
        width:'86%',
        textAlign:'center',
        fontFamily:'Arial Black, Arial, sans-serif',
        fontWeight:900,
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
        fontFamily:'Arial, sans-serif',
        fontWeight:400,
        fontSize:`${(28 / H * 100 * 1.25).toFixed(2)}%`,
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
        fontFamily:'Courier New, Courier, monospace',
        fontWeight:600,
        fontSize:`${(24 / H * 100 * 1.25).toFixed(2)}%`,
        color: `${accent}CC`,
        letterSpacing:'0.06em',
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
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

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

  const toggleFav = (id: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setFavorites(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const openTemplate = async (templateId: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(templateId); setError('');
    try {
      const res = await fetch('/api/templates/use', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ templateId }),
      });
      const data = await res.json() as { id?:string; error?:string; plan?:string; limit?:number };
      if (res.status === 402 && data.error === 'PLAN_LIMIT')
        throw new Error(`You've reached the ${data.limit}-event limit on the ${data.plan ?? 'free'} plan. Upgrade for more.`);
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong');
      router.push(`/events/${data.id}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(null);
    }
  };

  const filtered = TEMPLATES.filter(t => {
    const matchesCat  = activeCategory === 'all' || t.cat === activeCategory;
    const matchesSearch = !search || t.name.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-full flex flex-col">

      {/* Header */}
      <div className="relative overflow-hidden px-6 pt-7 pb-6 border-b shrink-0" style={{ background:'white', borderColor:'#E5E0D4' }}>
        <div className="absolute pointer-events-none" style={{ top:'-50%', right:'-5%', width:260, height:260, background:'radial-gradient(ellipse,rgba(31,77,58,0.07) 0%,transparent 70%)', filter:'blur(40px)' }} />
        <div className="relative">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-display font-bold text-[28px] text-[#0F1F18] leading-tight tracking-tight">Templates</h1>
              <p className="text-[13px] text-[#6B7A72] mt-1">30 professionally designed event cards — what you see is what you edit.</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7A72]/60 pointer-events-none" size={13} strokeWidth={2} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates…"
                className="w-[240px] h-8 pl-8 pr-3 rounded-lg text-[13px] focus:outline-none transition"
                style={{ background:'#FAF6EE', border:'1px solid #E5E0D4', color:'#0F1F18' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-6 mt-4 px-4 py-3 rounded-xl text-[13px] flex items-center justify-between gap-3" style={{ background:'#FEF2F2', border:'1px solid #FECACA', color:'#B91C1C' }}>
          <span>{error}</span>
          <button onClick={() => setError('')} className="shrink-0 text-[11px] underline">Dismiss</button>
        </div>
      )}

      {/* Category chips */}
      <div className="px-6 pt-5 pb-4">
        <div className="flex items-center gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button key={cat.key} onClick={() => setActiveCategory(cat.key)}
              className={`inline-flex items-center justify-center h-9 px-4 rounded-full text-[12.5px] font-medium transition-all duration-150 ${
                activeCategory === cat.key ? 'bg-[#0F1F18] text-white' : 'bg-white border border-[#E5E0D4] text-[#0F1F18]/65 hover:bg-[#FAF6EE] hover:text-[#0F1F18]'
              }`}>
              {cat.label}
              <span className={`ml-1.5 font-mono text-[10.5px] ${activeCategory === cat.key ? 'opacity-50' : 'opacity-40'}`}>{cat.count}</span>
            </button>
          ))}
          <div className="flex-1" />
          <select className="h-9 px-3 rounded-full bg-white border border-[#E5E0D4] text-[12.5px] outline-none cursor-pointer hover:bg-[#FAF6EE] transition">
            <option>Most popular</option><option>Newest</option><option>A–Z</option>
          </select>
        </div>
      </div>

      {/* Grid — 3 cols on lg, 4 on xl so cards are large + impactful */}
      <div className="px-6 pb-16">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6">

          {/* Start blank */}
          <Link href="/events/new"
            className="group rounded-2xl border-2 border-dashed border-[#1F4D3A]/25 hover:border-[#1F4D3A] bg-white transition-all flex flex-col items-center justify-center text-center p-8"
            style={{ aspectRatio:`${W}/${H}` }}>
            <div className="h-14 w-14 rounded-2xl grid place-items-center text-white mb-4 group-hover:scale-110 transition-transform duration-200"
              style={{ background:'linear-gradient(135deg,#1F4D3A,#E8C57E)', boxShadow:'0 8px 24px rgba(31,77,58,0.25)' }}>
              <Plus size={26} strokeWidth={2.4} />
            </div>
            <div className="font-display font-bold text-[17px]">Start blank</div>
            <div className="text-[13px] text-[#0F1F18]/50 mt-1.5 leading-snug">Upload your own design</div>
          </Link>

          {filtered.map(tmpl => {
            const isLoading = loading === tmpl.id;
            return (
              <div key={tmpl.id} className="group block cursor-pointer" onClick={e => openTemplate(tmpl.id, e)}>

                {/* Card — fixed aspect ratio matching SVG canvas */}
                <div className="relative rounded-2xl overflow-hidden transition-all duration-200 group-hover:-translate-y-2 group-hover:shadow-2xl"
                  style={{ aspectRatio:`${W}/${H}`, boxShadow:'0 4px 20px rgba(15,31,24,0.14)', opacity: isLoading ? 0.7 : 1 }}>

                  <CardPreview id={tmpl.id} />

                  {/* POPULAR / NEW badge */}
                  {tmpl.badge && !isLoading && (
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[9px] font-mono tracking-widest text-white z-10"
                      style={{ background:'linear-gradient(135deg,#1F4D3A,#E8C57E)' }}>
                      {tmpl.badge}
                    </div>
                  )}

                  {/* Hover CTA */}
                  <div className={`absolute inset-0 z-20 flex flex-col items-center justify-end pb-4 px-4 transition-all duration-200 ${
                    isLoading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`} style={{ background:'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.08) 45%, transparent 100%)' }}>
                    <div className="w-full text-white text-center py-3 rounded-xl font-display font-bold text-[14px] flex items-center justify-center gap-2"
                      style={{ background:'linear-gradient(135deg,#1F4D3A 0%,#2A6A50 100%)', boxShadow:'0 8px 28px rgba(31,77,58,0.60)' }}>
                      {isLoading
                        ? <><Loader2 size={14} strokeWidth={2} className="animate-spin" />Opening editor…</>
                        : 'Use this template →'}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-display font-semibold text-[14px] leading-tight truncate">{tmpl.name}</div>
                    <div className="text-[11px] font-mono text-[#0F1F18]/40 tracking-wide mt-0.5">{tmpl.catLabel}</div>
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
          <div className="text-center py-16">
            <div className="text-[14px] text-[#0F1F18]/40">No templates match your search.</div>
            <button onClick={() => { setSearch(''); setActiveCategory('all'); }} className="mt-3 text-[13px] text-[#1F4D3A] hover:underline">Clear filters</button>
          </div>
        )}

        {/* ── Platform templates (DB-backed) ──────────────────── */}
        {dbTemplates.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-[#E5E0D4]" />
              <span className="text-[10px] font-mono text-[#6B7A72] uppercase tracking-widest">Platform templates</span>
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
                      <div className="absolute inset-0 grid place-items-center text-[#6B7A72]">
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
                      <div className="text-[10px] font-mono text-[#6B7A72] uppercase tracking-wide mt-0.5">{t.category}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coming soon */}
        <div className="mt-12 rounded-2xl border border-dashed border-[#1F4D3A]/20 bg-gradient-to-br from-[#1F4D3A]/[0.03] to-[#E8C57E]/[0.03] px-8 py-8 text-center">
          <div className="text-[10px] font-mono tracking-widest text-[#1F4D3A]/60 mb-2 uppercase">Coming soon</div>
          <div className="font-display font-bold text-[22px]">Submit your own template</div>
          <p className="text-[13.5px] text-[#0F1F18]/55 mt-2 max-w-[420px] mx-auto">Save any event design as a reusable template and share it with the community.</p>
          <Link href="/pricing" className="mt-5 inline-flex items-center gap-2 text-[13px] font-semibold text-white px-6 py-3 rounded-xl hover:opacity-95 transition"
            style={{ background:'linear-gradient(135deg,#1F4D3A,#E8C57E)' }}>
            See Studio plan →
          </Link>
        </div>
      </div>
    </div>
  );
}
