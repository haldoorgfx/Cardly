'use client';

import { useState } from 'react';
import { Check, X, Star, Images, Heart } from 'lucide-react';
import Image from 'next/image';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Photo = any;

interface Props {
  eventId: string;
  eventName: string;
  initialPhotos: Photo[];
}

type Filter = 'all' | 'pending' | 'approved' | 'featured' | 'rejected';

const STATUS_PILL: Record<string, { label: string; cls: string }> = {
  pending:  { label: 'Pending',  cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  approved: { label: 'Approved', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  featured: { label: 'Featured', cls: 'bg-yellow-50 text-yellow-700 border border-yellow-200' },
  rejected: { label: 'Rejected', cls: 'bg-red-50 text-red-600 border border-red-200' },
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
    <div className="max-w-[1000px] mx-auto px-5 py-10">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[12.5px] tracking-[0.16em] uppercase mb-2 font-medium" style={{ color: '#6B7A72', fontFamily: 'Inter, system-ui, sans-serif' }}>
          Engagement
        </p>
        <h1 className="font-display font-semibold text-[26px] sm:text-[30px] leading-tight mb-1" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
          Photo wall
        </h1>
        <p className="text-[14px]" style={{ color: '#6B7A72' }}>
          Approve and feature attendee photos for <span className="font-medium" style={{ color: '#0F1F18' }}>{eventName}</span>.
        </p>
      </div>

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
              <div className="text-[12.5px]" style={{ color: '#6B7A72' }}>{s.label}</div>
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
          <p className="text-[13px] mt-1" style={{ color: '#6B7A72' }}>Attendees can upload photos through the event page.</p>
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
                        <div className="text-[12.5px] truncate" style={{ color: '#6B7A72' }}>{photo.caption}</div>
                      )}
                    </div>
                    <span className={`text-[12px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${pill.cls}`} style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
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
                            style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}>
                            <Star size={10} />
                          </button>
                          <button
                            onClick={() => moderate(photo.id, 'rejected')}
                            disabled={busy === photo.id + 'rejected'}
                            className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[12.5px] font-medium transition hover:opacity-90 disabled:opacity-40"
                            style={{ background: '#FEF2F2', color: '#B8423C', border: '1px solid #FECACA' }}>
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
    </div>
  );
}
