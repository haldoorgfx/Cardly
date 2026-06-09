'use client';

/**
 * TemplatePickerModal — shown inside the canvas editor when adding a new variant.
 * Lets the designer pick a built-in template to use as a starting point,
 * OR upload their own design (original flow).
 *
 * On template selection: POSTs to /api/events/[id]/variants/from-template
 * which builds the SVG, rasterises to PNG, uploads to storage, and returns
 * the new variant ready to edit.
 */

import { useState, useRef, useEffect } from 'react';
import { Upload, Loader2, Search, X } from 'lucide-react';
import { buildSVG, TEMPLATE_CONFIGS, W, H } from '@/lib/templates/svgs';
import type { Variant } from '@/types/database';

interface Props {
  eventId: string;
  /** Called when a variant is created (either from template or upload) */
  onVariantCreated: (variant: Variant) => void;
  /** Fall back to the upload flow */
  onUploadInstead: () => void;
  onClose: () => void;
}

const CATEGORIES: { key: string; label: string }[] = [
  { key: 'all',   label: 'All'        },
  { key: 'tech',  label: 'Tech'       },
  { key: 'conf',  label: 'Conference' },
  { key: 'music', label: 'Music'      },
  { key: 'sport', label: 'Sport'      },
  { key: 'ngo',   label: 'NGO'        },
];

const TEMPLATE_CAT: Record<string, string> = {
  atf:'conf', sunrise:'tech', studio:'conf', devfest:'tech', gala:'conf',
  pulse:'music', founders:'conf', run:'sport', sea:'tech', ai:'tech',
  faith:'ngo', womentech:'tech', nile:'conf', sahara:'conf', chrome:'tech',
  bloom:'ngo', cosmos:'conf', nights:'music', terra:'ngo', harvest:'music',
  pitch:'tech', agora:'conf', editorial:'conf', marathon:'tech', prism:'tech',
  zen:'ngo', arctic:'tech', volta:'tech', century:'conf', sport100:'sport',
};

const TEMPLATES = Object.entries(TEMPLATE_CONFIGS).map(([id, cfg]) => ({
  id,
  name: cfg.name,
  accent: cfg.accent,
  cat: TEMPLATE_CAT[id] ?? 'conf',
}));

/**
 * Only builds + renders the SVG when the card scrolls into view.
 * Before that, shows a cheap gradient placeholder using the template accent color.
 * This prevents all 30 SVGs from being generated synchronously on mount,
 * which would freeze the browser tab.
 */
function TemplateSVGPreview({ templateId, accent }: { templateId: string; accent: string }) {
  const ref   = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { rootMargin: '120px' }   // start loading just before entering viewport
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const cfg = TEMPLATE_CONFIGS[templateId];

  return (
    <div ref={ref} style={{ width: '100%', height: '100%' }}>
      {visible && cfg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`data:image/svg+xml,${encodeURIComponent(buildSVG(templateId, cfg.text))}`}
          alt={cfg.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        // Placeholder: gradient using the template's brand accent — gives palette hint
        <div style={{
          width: '100%', height: '100%',
          background: `linear-gradient(160deg, #1F4D3A 0%, ${accent} 100%)`,
        }} />
      )}
    </div>
  );
}

export default function TemplatePickerModal({ eventId, onVariantCreated, onUploadInstead, onClose }: Props) {
  const [cat, setCat]         = useState('all');
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError]     = useState('');

  const filtered = TEMPLATES.filter(t => {
    const matchCat    = cat === 'all' || t.cat === cat;
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleSelect = async (templateId: string) => {
    if (loading) return;
    setLoading(templateId);
    setError('');
    try {
      const res = await fetch(`/api/events/${eventId}/variants/from-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId }),
      });
      const data = await res.json() as Variant & { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed to apply template');
      onVariantCreated(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(15,31,24,0.55)' }}>
      <div
        className="relative flex flex-col bg-white rounded-2xl overflow-hidden w-full"
        style={{
          maxWidth: 860, maxHeight: '88vh',
          boxShadow: '0 8px 40px rgba(15,31,24,0.22)',
          border: '1px solid #E5E0D4',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b shrink-0" style={{ borderColor: '#E5E0D4' }}>
          <div>
            <h2 className="font-display font-bold text-[18px] text-[#0F1F18] leading-tight tracking-tight">
              Choose a template
            </h2>
            <p className="text-[12.5px] text-[#6B7A72] mt-0.5">
              Select a design to start from — you can customise everything in the editor.
            </p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg grid place-items-center hover:bg-[#FAF6EE] transition shrink-0">
            <X size={16} strokeWidth={2} style={{ color: '#6B7A72' }} />
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 px-6 py-3 border-b shrink-0 overflow-x-auto" style={{ borderColor: '#E5E0D4' }}>
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              onClick={() => setCat(c.key)}
              className={`h-7 px-3 rounded-full text-[12px] font-medium whitespace-nowrap transition-all ${
                cat === c.key
                  ? 'bg-[#0F1F18] text-white'
                  : 'bg-white border border-[#E5E0D4] text-[#0F1F18]/65 hover:bg-[#FAF6EE]'
              }`}
            >
              {c.label}
            </button>
          ))}
          <div className="flex-1" />
          <div className="relative shrink-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" size={12} strokeWidth={2} style={{ color: '#9BA8A1' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              className="h-7 w-36 pl-7 pr-3 rounded-full text-[12px] outline-none"
              style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#0F1F18' }}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-3 px-3 py-2 rounded-lg text-[12.5px] text-[#B8423C] shrink-0" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
            {error}
          </div>
        )}

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {filtered.map(tmpl => {
              const isLoading = loading === tmpl.id;
              return (
                <button
                  key={tmpl.id}
                  onClick={() => handleSelect(tmpl.id)}
                  disabled={!!loading}
                  className="group text-left focus:outline-none"
                >
                  {/* Card */}
                  <div
                    className="relative rounded-xl overflow-hidden transition-all duration-150 group-hover:-translate-y-1 group-hover:shadow-xl"
                    style={{
                      aspectRatio: `${W}/${H}`,
                      boxShadow: '0 2px 8px rgba(15,31,24,0.12)',
                      opacity: loading && !isLoading ? 0.5 : 1,
                      border: '1px solid rgba(15,31,24,0.06)',
                    }}
                  >
                    <TemplateSVGPreview templateId={tmpl.id} accent={tmpl.accent} />

                    {/* Loading overlay */}
                    {isLoading && (
                      <div className="absolute inset-0 bg-white/75 grid place-items-center">
                        <Loader2 size={22} strokeWidth={2} className="animate-spin" style={{ color: '#1F4D3A' }} />
                      </div>
                    )}

                    {/* Hover CTA */}
                    {!isLoading && (
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-150 flex flex-col items-center justify-end pb-3 px-2"
                        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 55%)' }}>
                        <div className="w-full text-white text-center py-2 rounded-lg text-[11px] font-semibold"
                          style={{ background: 'rgba(31,77,58,0.9)' }}>
                          Use this →
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <div className="mt-2 text-[11.5px] font-medium text-[#0F1F18] leading-tight truncate">
                    {tmpl.name}
                  </div>
                </button>
              );
            })}

            {filtered.length === 0 && (
              <div className="col-span-5 text-center py-12 text-[13px] text-[#6B7A72]">
                No templates match your search.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t shrink-0" style={{ borderColor: '#E5E0D4', background: '#FAF6EE' }}>
          <p className="text-[12px] text-[#6B7A72]">Or start from scratch with your own design</p>
          <button
            onClick={onUploadInstead}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-[12.5px] font-medium transition hover:bg-[#E8EFEB]"
            style={{ border: '1px solid #1F4D3A', color: '#1F4D3A', background: 'white' }}
          >
            <Upload size={13} strokeWidth={2} />
            Upload design
          </button>
        </div>
      </div>
    </div>
  );
}
