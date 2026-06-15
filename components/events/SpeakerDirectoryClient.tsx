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

      {/* Featured speaker */}
      {showFeatured && featuredSpeaker && (
        <Link href={`/e/${eventSlug}/speakers/${featuredSpeaker.id}`} className="block">
          <div
            className="relative w-full rounded-2xl overflow-hidden"
            style={{ height: 300, background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #163828 100%)' }}
          >
            {featuredSpeaker.photo_url && (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${featuredSpeaker.photo_url})` }}
              />
            )}
            {!featuredSpeaker.photo_url && (
              <div className="absolute inset-0 flex items-center justify-center opacity-10">
                <span className="text-[120px] font-bold text-white leading-none">
                  {getInitials(featuredSpeaker.name)}
                </span>
              </div>
            )}
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to bottom, transparent 30%, rgba(15,31,24,0.78) 100%)' }}
            />
            <div className="absolute bottom-5 left-5">
              <span
                className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-full mb-2"
                style={{ background: 'rgba(232,197,126,0.2)', color: '#E8C57E', border: '1px solid #E8C57E' }}
              >
                Featured
              </span>
              <h2 className="font-display text-[28px] font-normal leading-tight text-white">
                {featuredSpeaker.name}
              </h2>
              {(featuredSpeaker.role || featuredSpeaker.company) && (
                <p className="text-[14px] mt-0.5" style={{ color: '#E8C57E' }}>
                  {[featuredSpeaker.role, featuredSpeaker.company].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          </div>
        </Link>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {gridSpeakers.map((speaker) => (
          <Link
            key={speaker.id}
            href={`/e/${eventSlug}/speakers/${speaker.id}`}
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
                className="absolute top-2.5 left-2.5 text-[11px] font-medium px-2 py-0.5 rounded-full"
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
