'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Photo {
  id: string;
  attendee_name: string | null;
  image_url: string;
  caption: string | null;
}

interface Props {
  eventId: string;
}

/**
 * Public photo wall — the attendee-facing half of the organizer's moderation
 * queue (components/events/PhotoWallAdmin.tsx). Reads approved/featured
 * photos straight from Supabase: migration 101's RLS policy already scopes
 * anon reads to `status in ('approved','featured')` for publicly visible
 * events, so no API route is needed for the list. Uploads go through
 * POST /api/events/[id]/photos (server-side, service-role) and always land
 * as 'pending' — nothing submitted here appears until an organizer approves it.
 */
export function PhotoWallPublicClient({ eventId }: Props) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // event_photos isn't in the generated Database type (added post-generation) —
    // cast the client, matching how every server-side admin query on this table
    // already handles it.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    supabase
      .from('event_photos')
      .select('id, attendee_name, image_url, caption')
      .eq('event_id', eventId)
      .in('status', ['approved', 'featured'])
      .order('created_at', { ascending: false })
      .limit(60)
      .then(({ data }: { data: Photo[] | null }) => {
        setPhotos(data ?? []);
        setLoading(false);
      });
  }, [eventId]);

  function handleFile(f: File | null) {
    setFile(f);
    setError('');
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function handleSubmit() {
    if (!file) { setError('Choose a photo to share.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (name.trim()) formData.append('attendee_name', name.trim());
      if (caption.trim()) formData.append('caption', caption.trim());

      const res = await fetch(`/api/events/${eventId}/photos`, { method: 'POST', body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Could not upload your photo. Please try again.');
        return;
      }
      setSubmitted(true);
      setFormOpen(false);
      setName('');
      setCaption('');
      handleFile(null);
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display font-normal text-[22px]" style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}>
          Photo wall
        </h2>
        <button
          onClick={() => { setFormOpen(true); setSubmitted(false); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-[13.5px] font-medium transition hover:opacity-90"
          style={{ background: '#1F4D3A' }}
        >
          <ImagePlus size={15} strokeWidth={2} /> Add your photo
        </button>
      </div>

      {submitted && (
        <div className="rounded-xl p-4 mb-5 text-[13.5px]" style={{ background: '#E8EFEB', color: '#0F1F18', border: '1px solid #C9E0D4' }}>
          Thanks! Your photo is in for review and will appear here once an organizer approves it.
        </div>
      )}

      {formOpen && (
        <div className="rounded-2xl p-5 mb-6" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="font-display font-medium text-[15px]" style={{ color: '#0F1F18' }}>Share a photo</span>
            <button onClick={() => setFormOpen(false)} aria-label="Close" style={{ color: '#65736B' }}>
              <X size={18} strokeWidth={2} />
            </button>
          </div>

          <button
            onClick={() => fileRef.current?.click()}
            className="w-full h-40 rounded-xl flex items-center justify-center mb-4 overflow-hidden"
            style={{ background: '#FAF6EE', border: '1px dashed #C9C2B4' }}
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="flex flex-col items-center gap-2 text-[13px]" style={{ color: '#65736B' }}>
                <Camera size={22} strokeWidth={1.6} />
                Tap to choose a photo
              </span>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={e => handleFile(e.target.files?.[0] ?? null)}
          />

          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name (optional)"
            maxLength={200}
            className="w-full h-11 px-3 rounded-lg text-[14px] mb-3 outline-none"
            style={{ border: '1px solid #E5E0D4', color: '#0F1F18' }}
          />
          <input
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="Caption (optional)"
            maxLength={200}
            className="w-full h-11 px-3 rounded-lg text-[14px] mb-4 outline-none"
            style={{ border: '1px solid #E5E0D4', color: '#0F1F18' }}
          />

          {error && <p className="text-[13px] mb-3" style={{ color: '#B8423C' }} role="alert">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting || !file}
            className="w-full h-11 rounded-lg text-white text-[14px] font-medium transition hover:opacity-90 disabled:opacity-50"
            style={{ background: '#1F4D3A' }}
          >
            {submitting ? 'Uploading…' : 'Share to the photo wall'}
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} className="aspect-square rounded-xl animate-pulse" style={{ background: '#F0EDE6' }} />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
          <Camera size={24} strokeWidth={1.6} style={{ color: '#9BA8A1', margin: '0 auto 10px' }} />
          <p className="text-[14px]" style={{ color: '#65736B' }}>No photos yet — be the first to share one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map(p => (
            <figure key={p.id} className="rounded-xl overflow-hidden" style={{ background: '#F0EDE6' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image_url} alt={p.caption ?? ''} className="w-full aspect-square object-cover" />
              {(p.caption || p.attendee_name) && (
                <figcaption className="px-2.5 py-2 text-[12px]" style={{ color: '#3A4A42' }}>
                  {p.caption && <span>{p.caption}</span>}
                  {p.attendee_name && <span style={{ color: '#9BA8A1' }}> · {p.attendee_name}</span>}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
