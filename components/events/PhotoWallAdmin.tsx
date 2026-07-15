'use client';

import { useState } from 'react';
import { Check, X, Star, Images, Heart } from 'lucide-react';
import Image from 'next/image';
import { PageShell, PageHeader } from '@/components/dash';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Photo = any;

interface Props {
  eventId: string;
  eventName: string;
  initialPhotos: Photo[];
}

type Filter = 'all' | 'pending' | 'approved' | 'featured' | 'rejected';

const STATUS_PILL: Record<string, { label: string; bg: string; color: string; border: string }> = {
  pending:  { label: 'Pending',  bg: 'rgba(201,122,45,0.12)', color: '#C97A2D', border: 'rgba(201,122,45,0.3)' },
  approved: { label: 'Approved', bg: 'rgba(45,122,79,0.12)',  color: '#2D7A4F', border: 'rgba(45,122,79,0.3)' },
  featured: { label: 'Featured', bg: 'rgba(232,197,126,0.12)', color: '#C9A45E', border: 'rgba(201,164,94,0.4)' },
  rejected: { label: 'Rejected', bg: 'rgba(184,66,60,0.10)',  color: '#B8423C', border: 'rgba(184,66,60,0.3)' },
};

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all',      label: 'All' },
  { id: 'pending',  label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'featured', label: 'Featured' },
  { id: 'rejected', label: 'Rejected' },
];

export function PhotoWallAdmin({ eventId, eventName, initialPhotos }: Props) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [filter, setFilter] = useState<Filter>('all');
  const [busy, setBusy] = useState<string | null>(null);

  const visible = filter === 'all' ? photos : photos.filter(p => p.status === filter);

  const counts = {
    all: photos.length,
    pending: photos.filter(p => p.status === 'pending').length,
    approved: photos.filter(p => p.status === 'approved').length,
    featured: photos.filter(p => p.status === 'featured').length,
    rejected: photos.filter(p => p.status === 'rejected').length,
  };

  async function moderate(photoId: string, status: string) {
    setBusy(photoId + status);
    const res = await fetch(`/api/events/${eventId}/photos`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoId, status }),
    });
    if (res.ok) {
      setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, status } : p));
    }
    setBusy(null);
  }

  return (
    <PageShell width="wide">
      <PageHeader
        eyebrow="Engagement"
        title="Photo wall"
        subtitle={<>Approve and feature attendee photos for <span className="font-medium" style={{ color: '#0F1F18' }}>{eventName}</span>.</>}
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total photos', value: counts.all,    icon: <Images size={15} style={{ color: '#3A6B8C' }} /> },
          { label: 'Pending',      value: counts.pending, icon: <Images size={15} style={{ color: '#C97A2D' }} /> },
          { label: 'Approved',     value: counts.approved, icon: <Check size={15} style={{ color: '#2D7A4F' }} /> },
          { label: 'Featured',     value: counts.featured, icon: <Star size={15} style={{ color: '#C9A45E' }} /> },
        ].map(s => (
          <div key={s.label} className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
            {s.icon}
            <div>
              <div className="font-semibold text-[18px] font-display" style={{ color: '#0F1F18' }}>{s.value}</div>
              <div className="text-[12.5px]" style={{ color: '#65736B' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className="px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors"
            style={{
              background: filter === f.id ? '#1F4D3A' : '#FFFFFF',
              color: filter === f.id ? '#FAF6EE' : '#3A4A42',
              borderColor: filter === f.id ? '#1F4D3A' : '#E5E0D4',
            }}>
            {f.label} <span className="opacity-60">{counts[f.id]}</span>
          </button>
        ))}
      </div>

      {/* Photo grid */}
      {visible.length === 0 ? (
        <div className="rounded-2xl flex flex-col items-center py-20" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
          <Images size={32} style={{ color: '#C9C3B1' }} className="mb-3" />
          <p className="text-[15px] font-medium" style={{ color: '#0F1F18' }}>No photos yet</p>
          <p className="text-[13px] mt-1" style={{ color: '#65736B' }}>Attendees can upload photos through the event page.</p>
        </div>
      ) : (
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-3">
          {visible.map(photo => {
            const pill = STATUS_PILL[photo.status] ?? STATUS_PILL.pending;
            const isPending = photo.status === 'pending';
            const isFeatured = photo.status === 'featured';
            return (
              <div key={photo.id} className="break-inside-avoid mb-3 rounded-xl overflow-hidden relative group"
                style={{ border: '1px solid #E5E0D4', background: '#FFFFFF' }}>
                {/* Photo */}
                <div className="relative w-full" style={{ minHeight: 120, background: '#F0EDE6' }}>
                  {photo.image_url ? (
                    <Image
                      src={photo.image_url}
                      alt={photo.caption ?? ''}
                      width={300}
                      height={200}
                      className="w-full h-auto object-cover"
                      style={{ display: 'block' }}
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-28 flex items-center justify-center" style={{ color: '#C9C3B1' }}>
                      <Images size={24} />
                    </div>
                  )}
                  {/* Likes overlay */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full text-[12.5px] font-semibold"
                    style={{ background: 'rgba(15,31,24,0.65)', color: '#FFFFFF' }}>
                    <Heart size={10} fill="currentColor" /> {photo.likes}
                  </div>
                </div>

                {/* Footer */}
                <div className="p-2.5">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div>
                      {photo.attendee_name && (
                        <div className="text-[12.5px] font-medium truncate" style={{ color: '#0F1F18' }}>{photo.attendee_name}</div>
                      )}
                      {photo.caption && (
                        <div className="text-[12.5px] truncate" style={{ color: '#65736B' }}>{photo.caption}</div>
                      )}
                    </div>
                    <span className="text-[12px] font-medium px-1.5 py-0.5 rounded-full shrink-0 border" style={{ fontFamily: 'Inter, system-ui, sans-serif', background: pill.bg, color: pill.color, borderColor: pill.border }}>
                      {pill.label}
                    </span>
                  </div>

                  {/* Action buttons */}
                  {(isPending || isFeatured) && (
                    <div className="flex gap-1.5">
                      {isPending && (
                        <>
                          <button
                            onClick={() => moderate(photo.id, 'approved')}
                            disabled={busy === photo.id + 'approved'}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[12.5px] font-medium transition hover:opacity-90 disabled:opacity-40"
                            style={{ background: '#1F4D3A', color: '#FAF6EE' }}>
                            <Check size={10} /> Approve
                          </button>
                          <button
                            onClick={() => moderate(photo.id, 'featured')}
                            disabled={busy === photo.id + 'featured'}
                            className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[12.5px] font-medium transition hover:opacity-90 disabled:opacity-40"
                            style={{ background: 'rgba(232,197,126,0.12)', color: '#C9A45E', border: '1px solid rgba(201,164,94,0.4)' }}>
                            <Star size={10} />
                          </button>
                          <button
                            onClick={() => moderate(photo.id, 'rejected')}
                            disabled={busy === photo.id + 'rejected'}
                            className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[12.5px] font-medium transition hover:opacity-90 disabled:opacity-40"
                            style={{ background: 'rgba(184,66,60,0.10)', color: '#B8423C', border: '1px solid rgba(184,66,60,0.3)' }}>
                            <X size={10} />
                          </button>
                        </>
                      )}
                      {isFeatured && (
                        <button
                          onClick={() => moderate(photo.id, 'approved')}
                          disabled={busy === photo.id + 'approved'}
                          className="flex-1 py-1.5 rounded-lg text-[12.5px] font-medium transition hover:opacity-90 disabled:opacity-40"
                          style={{ background: '#F0EDE6', color: '#3A4A42' }}>
                          Unfeature
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
