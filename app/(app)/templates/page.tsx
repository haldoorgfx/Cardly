'use client';

import { useState } from 'react';
import Link from 'next/link';

const CATEGORIES = ['All', 'Tech', 'Conference', 'Music', 'Workshop', 'Summit', 'Hackathon', 'Networking'];

const TEMPLATES = [
  { id: 't1', name: 'Africa Tech Summit', category: 'Tech', tags: ['tech', 'africa'], gradient: 'linear-gradient(135deg,#1b1240,#6c63ff)', accent: '#f8a4d8', popular: true },
  { id: 't2', name: 'Founders Retreat', category: 'Conference', tags: ['conference', 'business'], gradient: 'linear-gradient(135deg,#0a2a1a,#1f8a5b)', accent: '#7be0c0', popular: true },
  { id: 't3', name: 'Music Festival', category: 'Music', tags: ['music', 'festival'], gradient: 'linear-gradient(135deg,#1a0a2a,#9b59b6)', accent: '#ffd28a', popular: false },
  { id: 't4', name: 'Design Week', category: 'Workshop', tags: ['design', 'creative'], gradient: 'linear-gradient(135deg,#1a0a0a,#e74c3c)', accent: '#f8a4d8', popular: true },
  { id: 't5', name: 'AI & Blockchain Summit', category: 'Summit', tags: ['tech', 'web3'], gradient: 'linear-gradient(135deg,#0a1a2a,#2980b9)', accent: '#7be0c0', popular: false },
  { id: 't6', name: 'Startup Hackathon', category: 'Hackathon', tags: ['hackathon', 'startup'], gradient: 'linear-gradient(135deg,#1a1a0a,#f39c12)', accent: '#ffd28a', popular: true },
  { id: 't7', name: 'Product Launch', category: 'Tech', tags: ['product', 'launch'], gradient: 'linear-gradient(135deg,#0a0a1a,#6c63ff)', accent: '#f8a4d8', popular: false },
  { id: 't8', name: 'Leadership Forum', category: 'Conference', tags: ['leadership', 'business'], gradient: 'linear-gradient(135deg,#1a0a1a,#8e44ad)', accent: '#f8a4d8', popular: false },
  { id: 't9', name: 'Creative Workshop', category: 'Workshop', tags: ['creative', 'art'], gradient: 'linear-gradient(135deg,#0a1a1a,#16a085)', accent: '#7be0c0', popular: false },
  { id: 't10', name: 'Women in Tech', category: 'Networking', tags: ['community', 'diversity'], gradient: 'linear-gradient(135deg,#1a0a0a,#c0392b)', accent: '#ffd28a', popular: true },
  { id: 't11', name: 'DevFest', category: 'Tech', tags: ['dev', 'google'], gradient: 'linear-gradient(135deg,#0a1a0a,#27ae60)', accent: '#7be0c0', popular: false },
  { id: 't12', name: 'Pitch Night', category: 'Networking', tags: ['startup', 'pitch'], gradient: 'linear-gradient(135deg,#1a1a1a,#2c3e50)', accent: '#6c63ff', popular: false },
];

export default function TemplatesPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = TEMPLATES.filter(t => {
    const matchCat = activeCategory === 'All' || t.category === activeCategory;
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.tags.some(g => g.includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div className="px-8 py-8 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-mono text-[#0f0f1a]/40">
            <span>WORKSPACE</span><span>/</span><span className="text-[#0f0f1a]/70">Templates</span>
          </div>
          <h1 className="mt-2 font-display font-bold text-[34px] leading-tight">Templates</h1>
          <p className="text-[#0f0f1a]/60 mt-1 text-[14.5px]">Start with a professionally designed card. Customize everything — or upload your own.</p>
        </div>
        <Link
          href="/events/new"
          className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-white px-4 py-2.5 rounded-xl hover:opacity-95 transition"
          style={{ background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          Start blank
        </Link>
      </div>

      {/* Search + filters */}
      <div className="flex items-center gap-4 mb-7 flex-wrap">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0f0f1a]/40" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
          </svg>
          <input
            type="text"
            placeholder="Search templates…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 pr-4 py-2 bg-white border border-[#e5e5ea] rounded-xl text-[13.5px] placeholder-[#0f0f1a]/40 focus:ring-2 focus:ring-[#6c63ff]/30 outline-none w-[220px]"
          />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-[12.5px] px-3 py-1.5 rounded-lg transition font-medium ${activeCategory === cat ? 'text-white' : 'text-[#0f0f1a]/60 bg-white border border-[#e5e5ea] hover:bg-[#fafafa]'}`}
              style={activeCategory === cat ? { background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)' } : {}}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Start blank CTA card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        <Link
          href="/events/new"
          className="group rounded-2xl border-2 border-dashed border-[#6c63ff]/25 hover:border-[#6c63ff]/50 bg-white hover:bg-[#fafafa] transition flex flex-col items-center justify-center gap-3 p-8 text-center"
          style={{ minHeight: 280 }}
        >
          <div className="h-12 w-12 rounded-2xl grid place-items-center text-white group-hover:scale-105 transition" style={{ background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)', boxShadow: '0 8px 24px rgba(108,99,255,0.2)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          </div>
          <div className="font-display font-semibold text-[15px]">Start blank</div>
          <div className="text-[12.5px] text-[#0f0f1a]/50 max-w-[160px]">Upload your own design and define zones</div>
        </Link>

        {filtered.map(t => (
          <div key={t.id} className="group rounded-2xl border border-[#e5e5ea] bg-white overflow-hidden hover:shadow-lift transition cursor-pointer relative">
            {t.popular && (
              <div className="absolute top-3 right-3 z-10 text-[10px] font-mono text-white px-2 py-0.5 rounded-full" style={{ background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)' }}>
                POPULAR
              </div>
            )}

            {/* Card preview */}
            <div className="relative overflow-hidden" style={{ aspectRatio: '4/5', background: t.gradient }}>
              {/* Decorative elements */}
              <div className="absolute top-8 left-1/2 -translate-x-1/2 h-16 w-16 rounded-full border-2 border-white/20" />
              <div className="absolute top-8 left-1/2 -translate-x-1/2 h-16 w-16 rounded-full bg-white/10 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" opacity="0.6">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
              {/* Name line */}
              <div className="absolute" style={{ bottom: '38%', left: '10%', right: '10%', height: 12, background: 'rgba(255,255,255,0.7)', borderRadius: 6 }} />
              {/* Role line */}
              <div className="absolute" style={{ bottom: '28%', left: '20%', right: '20%', height: 8, background: 'rgba(255,255,255,0.35)', borderRadius: 4 }} />
              {/* Badge */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full border text-[9px] font-mono whitespace-nowrap" style={{ borderColor: t.accent, color: t.accent }}>
                {t.name.split(' ').slice(0, 2).join(' ').toUpperCase()}
              </div>
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-[#0f0f1a]/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <div className="text-[13px] font-semibold text-white border border-white/40 px-4 py-2 rounded-xl hover:bg-white/10 transition">
                  Use template
                </div>
              </div>
            </div>

            <div className="p-3">
              <div className="font-display font-semibold text-[13.5px] truncate">{t.name}</div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[11px] font-mono text-[#0f0f1a]/45">{t.category}</span>
                <div className="flex gap-1">
                  {t.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#fafafa] text-[#0f0f1a]/50 border border-[#e5e5ea]">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-[#0f0f1a]/40">
          <div className="text-[15px] font-medium">No templates match &ldquo;{search}&rdquo;</div>
          <div className="text-[13px] mt-1">Try a different search or <button onClick={() => { setSearch(''); setActiveCategory('All'); }} className="text-[#6c63ff] underline">clear filters</button></div>
        </div>
      )}

      {/* Coming soon banner */}
      <div className="mt-10 rounded-2xl border border-[#6c63ff]/20 bg-[#6c63ff]/5 p-5 flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl grid place-items-center text-white shrink-0" style={{ background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l2.4 7.4L22 12l-7.6 2.6L12 22l-2.4-7.4L2 12l7.6-2.6z"/>
          </svg>
        </div>
        <div className="flex-1">
          <div className="text-[13.5px] font-semibold">More templates coming soon</div>
          <div className="text-[12.5px] text-[#0f0f1a]/60 mt-0.5">We&apos;re building a full library. Have a design to contribute? <Link href="/dashboard" className="text-[#6c63ff] font-medium">Reach out →</Link></div>
        </div>
      </div>
    </div>
  );
}
