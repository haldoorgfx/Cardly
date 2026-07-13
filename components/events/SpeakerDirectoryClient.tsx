'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Speaker, SpeakerType } from '@/types/database';

interface Props {
  speakers: Speaker[];
  eventSlug: string;
}

const TYPE_FILTERS: { value: SpeakerType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'keynote', label: 'Keynote' },
  { value: 'speaker', label: 'Speaker' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'panelist', label: 'Panelist' },
];

const TYPE_LABELS: Record<SpeakerType, string> = {
  speaker: 'Speaker',
  keynote: 'Keynote',
  panelist: 'Panelist',
  workshop: 'Workshop',
  mc: 'MC',
};

function getInitials(name: string) {
  return name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2);
}

export default function SpeakerDirectoryClient({ speakers, eventSlug }: Props) {
  const [activeFilter, setActiveFilter] = useState<SpeakerType | 'all'>('all');
  const [search, setSearch] = useState('');

  const featuredSpeaker = useMemo(
    () => speakers.find((s) => s.is_featured) ?? null,
    [speakers]
  );

  const filtered = useMemo(() => {
    let list = speakers;
    if (activeFilter !== 'all') list = list.filter((s) => s.speaker_type === activeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.company ?? '').toLowerCase().includes(q) ||
          (s.role ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [speakers, activeFilter, search]);

  const gridSpeakers = useMemo(
    () => filtered.filter((s) => !s.is_featured || activeFilter !== 'all' || search.trim()),
    [filtered, activeFilter, search]
  );

  const showFeatured = !search.trim() && activeFilter === 'all' && !!featuredSpeaker;

  if (speakers.length === 0) {
    return (
      <div className="flex flex-col items-center py-20 gap-3">
        <p className="text-base" style={{ color: '#6B7A72' }}>No speakers announced yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search speakers by name, company or role..."
          className="w-full border rounded-full px-5 py-3 text-sm"
          style={{ borderColor: '#E5E0D4', color: '#0F1F18', background: '#fff' }}
        />
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setActiveFilter(f.value)}
            className="px-4 py-1.5 rounded-full text-sm font-medium border transition-colors"
            style={
              activeFilter === f.value
                ? { background: '#1F4D3A', color: '#fff', borderColor: '#1F4D3A' }
                : { background: '#fff', color: '#0F1F18', borderColor: '#E5E0D4' }
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-sm py-10 text-center" style={{ color: '#6B7A72' }}>
          No speakers match your search.
        </p>
      )}

      {/* Featured speaker — split card (image left, content right) */}
      {showFeatured && featuredSpeaker && (
        <Link
          href={`/e/${eventSlug}/speakers/${featuredSpeaker.slug ?? featuredSpeaker.id}`}
          className="group block rounded-2xl overflow-hidden border transition-all duration-200 hover:-translate-y-0.5"
          style={{ borderColor: '#E5E0D4', background: '#fff' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#E8C57E'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(31,77,58,0.14)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E0D4'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <div className="flex flex-col sm:flex-row">
            {/* Image / initials — contained, never letterboxed */}
            <div
              className="relative shrink-0 w-full sm:w-[240px] overflow-hidden"
              style={{ aspectRatio: '4/3' }}
            >
              {featuredSpeaker.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={featuredSpeaker.photo_url}
                  alt={featuredSpeaker.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <div
                  className="absolute inset-0 flex items-center justify-center font-display font-semibold"
                  style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 100%)', color: 'rgba(255,255,255,0.92)', fontSize: 56 }}
                >
                  {getInitials(featuredSpeaker.name)}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 p-5 sm:p-6 flex flex-col justify-center">
              <span
                className="inline-flex items-center gap-1.5 self-start text-[12.5px] font-semibold uppercase tracking-[0.06em] px-2.5 py-1 rounded-full mb-3"
                style={{ background: '#FBF3DF', color: '#C9A45E' }}
              >
                <svg viewBox="0 0 24 24" className="w-3 h-3" fill="currentColor"><path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z" /></svg>
                Featured
              </span>
              <h2 className="font-display text-[24px] sm:text-[26px] font-bold leading-tight" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
                {featuredSpeaker.name}
              </h2>
              {(featuredSpeaker.role || featuredSpeaker.company) && (
                <p className="text-[14px] mt-1" style={{ color: '#3A4A42' }}>
                  {[featuredSpeaker.role, featuredSpeaker.company].filter(Boolean).join(' · ')}
                </p>
              )}
              {featuredSpeaker.bio && (
                <p className="text-[14px] mt-2.5 leading-relaxed line-clamp-2" style={{ color: '#6B7A72' }}>
                  {featuredSpeaker.bio}
                </p>
              )}
              <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold mt-4" style={{ color: '#1F4D3A' }}>
                View profile
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </span>
            </div>
          </div>
        </Link>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {gridSpeakers.map((speaker) => (
          <Link
            key={speaker.id}
            href={`/e/${eventSlug}/speakers/${speaker.slug ?? speaker.id}`}
            className="block group bg-white border rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1"
            style={{ borderColor: '#E5E0D4' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#E8C57E'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(31,77,58,0.14)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E0D4'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div
              className="relative overflow-hidden"
              style={{ aspectRatio: '1/1' }}
            >
              <div
                className="w-full h-full flex items-center justify-center text-3xl font-semibold"
                style={{ background: '#E8EFEB', color: '#1F4D3A' }}
              >
                {getInitials(speaker.name)}
              </div>
              {speaker.photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={speaker.photo_url}
                  alt={speaker.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              )}
              {/* Type pill */}
              <span
                className="absolute top-2.5 left-2.5 text-[12.5px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(31,77,58,0.85)', color: '#fff' }}
              >
                {speaker.speaker_type ? TYPE_LABELS[speaker.speaker_type] ?? speaker.speaker_type : 'Speaker'}
              </span>
            </div>
            <div className="px-3.5 py-3" style={{ borderTop: '1px solid #E5E0D4' }}>
              <p className="font-display text-[14px] font-medium truncate" style={{ color: '#0F1F18' }}>
                {speaker.name}
              </p>
              {(speaker.role || speaker.company) && (
                <p className="text-[12px] mt-0.5 truncate" style={{ color: '#6B7A72' }}>
                  {[speaker.role, speaker.company].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
