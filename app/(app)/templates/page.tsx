'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Heart, Plus } from 'lucide-react';

const CATEGORIES = [
  { key: 'all', label: 'All', count: 42 },
  { key: 'tech', label: 'Tech & Startup', count: 14 },
  { key: 'conference', label: 'Conferences', count: 9 },
  { key: 'music', label: 'Music & Culture', count: 6 },
  { key: 'workshop', label: 'Workshops', count: 5 },
  { key: 'webinar', label: 'Webinars', count: 4 },
  { key: 'sport', label: 'Sport', count: 3 },
  { key: 'ngo', label: 'Religious / NGO', count: 3 },
];

const TEMPLATES = [
  { id: 'atf', name: 'Africa Tech Festival', cat: 'conference', catLabel: 'CONFERENCE', badge: 'POPULAR', gradient: 'linear-gradient(155deg,#1b1240,#3a2068 40%,#7a3a9a 80%,#f8a4d8 130%)', t1: "I'm attending", t2: 'Africa Tech Festival.' },
  { id: 'sunrise', name: 'Sunrise Hackathon', cat: 'tech', catLabel: 'HACKATHON', badge: 'NEW', gradient: 'linear-gradient(155deg,#0a2540,#1f8a5b 50%,#ffd28a 130%)', t1: 'Building at', t2: "Sunrise '26." },
  { id: 'studio', name: 'Studio Sessions', cat: 'workshop', catLabel: 'WORKSHOP', badge: null, gradient: 'linear-gradient(155deg,#f8a4d8,#6c63ff 60%,#0f0f1a 130%)', t1: 'See you at', t2: 'Studio Sessions.' },
  { id: 'devfest', name: 'Devfest Lagos', cat: 'conference', catLabel: 'CONFERENCE', badge: null, gradient: 'linear-gradient(155deg,#0a2540,#3a3aff 50%,#7be0c0 130%)', t1: 'Going to', t2: 'Devfest Lagos.' },
  { id: 'gala', name: 'Black Tie Gala', cat: 'conference', catLabel: 'GALA', badge: null, gradient: 'linear-gradient(155deg,#0f0f1a,#3a2068 60%,#ffd28a 130%)', t1: 'Joining the', t2: 'Annual Gala.' },
  { id: 'pulse', name: 'Pulse Music Fest', cat: 'music', catLabel: 'MUSIC', badge: 'POPULAR', gradient: 'linear-gradient(155deg,#E1306C,#6c63ff 60%,#ffd28a 130%)', t1: 'Front row at', t2: "Pulse '26." },
  { id: 'founders', name: 'Founders Retreat', cat: 'workshop', catLabel: 'WORKSHOP', badge: null, gradient: 'linear-gradient(155deg,#0a2540,#6c63ff 50%,#f8a4d8 130%)', t1: 'Reset at', t2: 'Founders Retreat.' },
  { id: 'run', name: 'Run Lagos 10K', cat: 'sport', catLabel: 'SPORT', badge: null, gradient: 'linear-gradient(155deg,#1f8a5b,#7be0c0 60%,#ffd28a 130%)', t1: 'Running', t2: 'Lagos 10K.' },
  { id: 'sea', name: 'Devs at Sea', cat: 'tech', catLabel: 'CONFERENCE', badge: null, gradient: 'linear-gradient(155deg,#0a2540,#0a66c2 50%,#7be0c0 130%)', t1: 'Sailing with', t2: 'Devs at Sea.' },
  { id: 'ai', name: 'AI Ethics Webinar', cat: 'webinar', catLabel: 'WEBINAR', badge: 'NEW', gradient: 'linear-gradient(155deg,#0f0f1a,#6c63ff 70%,#f8a4d8 130%)', t1: 'Joining the', t2: 'AI Ethics talk.' },
  { id: 'faith', name: 'Faith Conference', cat: 'ngo', catLabel: 'RELIGIOUS', badge: null, gradient: 'linear-gradient(155deg,#0a2540,#3a2068 60%,#ffd28a 130%)', t1: 'Attending', t2: "Faith Conf '26." },
  { id: 'womentech', name: 'Women in Tech Summit', cat: 'tech', catLabel: 'SUMMIT', badge: 'NEW', gradient: 'linear-gradient(155deg,#6c63ff,#f8a4d8 60%,#ffd28a 130%)', t1: 'Speaking at', t2: 'Women in Tech.' },
];

export default function TemplatesPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const toggleFav = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = TEMPLATES.filter(t => {
    const matchesCat = activeCategory === 'all' || t.cat === activeCategory;
    const matchesSearch = !search || t.name.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-full flex flex-col">
      {/* Page header — same pattern as Analytics + Dashboard */}
      <div
        className="relative overflow-hidden px-6 pt-7 pb-6 border-b shrink-0"
        style={{ background: 'white', borderColor: '#E5E0D4' }}
      >
        <div
          className="absolute pointer-events-none"
          style={{ top: '-50%', right: '-5%', width: 260, height: 260, background: 'radial-gradient(ellipse, rgba(31,77,58,0.07) 0%, transparent 70%)', filter: 'blur(40px)' }}
        />

        <div className="relative">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[12px] font-mono text-[#6B7A72]/60 mb-3">
            <span>WORKSPACE</span>
            <span>/</span>
            <span className="text-[#6B7A72]">Templates</span>
          </div>

          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-display font-bold text-[28px] text-[#0F1F18] leading-tight tracking-tight">
                Templates
              </h1>
              <p className="text-[13px] text-[#6B7A72] mt-1">
                40+ event card designs — fully editable, zones already mapped.
              </p>
            </div>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7A72]/60 pointer-events-none" size={13} strokeWidth={2} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search 40+ templates…"
                className="w-[240px] h-8 pl-8 pr-3 rounded-lg text-[13px] focus:outline-none transition"
                style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#0F1F18' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Category chips */}
      <div className="px-6 pt-5 pb-4">
        <div className="flex items-center gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`h-9 px-4 rounded-full text-[12.5px] font-medium transition-all duration-150 ${
                activeCategory === cat.key
                  ? 'bg-[#0F1F18] text-white'
                  : 'bg-white border border-[#E5E0D4] text-[#0F1F18]/65 hover:bg-[#FAF6EE] hover:text-[#0F1F18]'
              }`}
            >
              {cat.label}
              <span className={`ml-1.5 font-mono text-[10.5px] ${activeCategory === cat.key ? 'opacity-50' : 'opacity-40'}`}>
                {cat.count}
              </span>
            </button>
          ))}
          <div className="flex-1" />
          <select className="h-9 px-3 rounded-full bg-white border border-[#E5E0D4] text-[12.5px] outline-none cursor-pointer hover:bg-[#FAF6EE] transition">
            <option>Most popular</option>
            <option>Newest</option>
            <option>A–Z</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="px-6 pb-16">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">

          {/* Start blank */}
          <Link
            href="/events/new"
            className="group rounded-2xl border-2 border-dashed border-[#1F4D3A]/25 hover:border-[#1F4D3A] bg-white transition-all flex flex-col items-center justify-center text-center p-6"
            style={{ aspectRatio: '4/5' }}
          >
            <div
              className="h-12 w-12 rounded-xl grid place-items-center text-white mb-3 group-hover:scale-110 transition-transform duration-200"
              style={{ background: 'linear-gradient(135deg,#1F4D3A,#E8C57E)', boxShadow: '0 8px 24px rgba(31,77,58,0.25)' }}
            >
              <Plus size={22} strokeWidth={2.4} />
            </div>
            <div className="font-display font-bold text-[15px]">Start blank</div>
            <div className="text-[12px] text-[#0F1F18]/50 mt-1 leading-snug">Upload your own design</div>
          </Link>

          {filtered.map(tmpl => (
            <Link key={tmpl.id} href="/events/new" className="group block">
              {/* Card thumbnail */}
              <div
                className="relative rounded-2xl overflow-hidden transition-all duration-200 group-hover:-translate-y-1"
                style={{
                  aspectRatio: '4/5',
                  background: tmpl.gradient,
                  boxShadow: '0 2px 8px rgba(15,31,24,0.08)',
                }}
              >
                {/* Glow */}
                <div
                  className="absolute -top-10 -right-10 h-32 w-32 rounded-full pointer-events-none"
                  style={{ background: 'radial-gradient(closest-side, rgba(255,255,255,0.28), transparent)' }}
                />

                {/* Top meta */}
                <div
                  className="absolute top-3 left-3 right-3 text-white/55 font-mono flex justify-between"
                  style={{ fontSize: 7.5, letterSpacing: '0.18em' }}
                >
                  <span>CARDLY · TEMPLATE</span>
                  <span>4:5</span>
                </div>

                {/* Tagline */}
                <div
                  className="absolute top-9 left-3 right-3 text-white font-display font-bold leading-[0.96]"
                  style={{ fontSize: 19, letterSpacing: '-0.03em' }}
                >
                  {tmpl.t1}
                  <br />
                  <span style={{ background: 'linear-gradient(135deg,#f8a4d8,#ffd28a)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                    {tmpl.t2}
                  </span>
                </div>

                {/* Attendee placeholder */}
                <div className="absolute bottom-3 left-3 right-3 flex items-end gap-2">
                  <div className="h-10 w-10 rounded-full bg-white/20 border border-white/25 shrink-0" />
                  <div className="flex-1 pb-0.5">
                    <div className="h-2 w-20 rounded bg-white/35 mb-1" />
                    <div className="h-1.5 w-14 rounded bg-white/20" />
                  </div>
                </div>

                {/* Badge */}
                {tmpl.badge && (
                  <div
                    className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[8px] font-mono tracking-widest text-white"
                    style={{ background: 'linear-gradient(135deg,#1F4D3A,#E8C57E)' }}
                  >
                    {tmpl.badge}
                  </div>
                )}

                {/* Hover CTA overlay */}
                <div className="absolute inset-x-3 bottom-3 z-10 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
                  <div
                    className="text-white text-center py-2.5 rounded-xl font-display font-semibold text-[12.5px]"
                    style={{ background: 'linear-gradient(135deg,#1F4D3A,#E8C57E)', boxShadow: '0 8px 20px rgba(31,77,58,0.45)' }}
                  >
                    Use this template →
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-display font-semibold text-[13.5px] leading-tight truncate">{tmpl.name}</div>
                  <div className="text-[10.5px] font-mono text-[#0F1F18]/40 tracking-wide mt-0.5">{tmpl.catLabel}</div>
                </div>
                <button
                  onClick={e => toggleFav(tmpl.id, e)}
                  className={`h-7 w-7 rounded-lg grid place-items-center shrink-0 transition hover:bg-[#FAF6EE] ${favorites.has(tmpl.id) ? 'text-[#E8C57E]' : 'text-[#0F1F18]/25 hover:text-[#0F1F18]/50'}`}
                >
                  <Heart size={14} strokeWidth={2} fill={favorites.has(tmpl.id) ? 'currentColor' : 'none'} />
                </button>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-[14px] text-[#0F1F18]/40">No templates match your search.</div>
            <button onClick={() => { setSearch(''); setActiveCategory('all'); }} className="mt-3 text-[13px] text-[#1F4D3A] hover:underline">
              Clear filters
            </button>
          </div>
        )}

        {/* Coming soon */}
        <div className="mt-10 rounded-2xl border border-dashed border-[#1F4D3A]/20 bg-gradient-to-br from-[#1F4D3A]/[0.03] to-[#E8C57E]/[0.03] px-8 py-7 text-center">
          <div className="text-[10px] font-mono tracking-widest text-[#1F4D3A]/60 mb-2 uppercase">Coming soon</div>
          <div className="font-display font-bold text-[20px]">Submit your own template</div>
          <p className="text-[13.5px] text-[#0F1F18]/55 mt-1.5 max-w-[400px] mx-auto">
            Save any event design as a reusable template and share it with the community.
          </p>
          <Link
            href="/pricing"
            className="mt-4 inline-flex items-center gap-2 text-[13px] font-semibold text-white px-5 py-2.5 rounded-xl hover:opacity-95 transition"
            style={{ background: 'linear-gradient(135deg,#1F4D3A,#E8C57E)' }}
          >
            See Studio plan →
          </Link>
        </div>
      </div>
    </div>
  );
}
