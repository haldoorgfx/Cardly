'use client';

/**
 * GetCardModal — lets an attendee personalise + generate their Eventera Card
 * from the ticket detail page, for registrations that don't have one yet
 * (organizer's design existed after they registered, or they hit "Skip for
 * now" during checkout). Reuses the same personalisation fields + POST to
 * /api/render as the post-registration confirm flow (ConfirmPage.tsx).
 */

import { useCallback, useState } from 'react';
import { ChevronRight, X } from 'lucide-react';
import { CardZoneFill } from '@/components/registration/CardZoneFill';
import { PhotoCropModal } from '@/components/registration/PhotoCropModal';
import type { Zone } from '@/types/database';

export interface CardVariant {
  id: string;
  zones: Zone[];
  background_url: string | null;
  background_width: number | null;
  background_height: number | null;
}

interface Props {
  variant: CardVariant;
  registrationId: string;
  eventId: string;
  attendeeName: string;
  onClose: () => void;
  onGenerated: (cardDataUrl: string) => void;
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function GetCardModal({ variant, registrationId, eventId, attendeeName, onClose, onGenerated }: Props) {
  const [zoneValues, setZoneValues] = useState<Record<string, string>>({});
  const [photoFiles, setPhotoFiles] = useState<Record<string, File>>({});
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [cropTarget, setCropTarget] = useState<{ zone: Zone; srcUrl: string; file: File } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const handlePhotoSelect = useCallback((zone: Zone, file: File, srcUrl: string) => {
    setCropTarget({ zone, srcUrl, file });
  }, []);

  const handleCropConfirm = useCallback((file: File, previewUrl: string) => {
    if (!cropTarget) return;
    setPhotoFiles(p => ({ ...p, [cropTarget.zone.id]: file }));
    setPhotoUrls(p => ({ ...p, [cropTarget.zone.id]: previewUrl }));
    setCropTarget(null);
  }, [cropTarget]);

  const handlePhotoClear = useCallback((zoneId: string) => {
    setPhotoFiles(p => { const n = { ...p }; delete n[zoneId]; return n; });
    setPhotoUrls(p => { const n = { ...p }; delete n[zoneId]; return n; });
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    setError('');
    try {
      const enriched = { ...zoneValues };
      const firstText = variant.zones.find(z => z.type === 'text' && !z.hidden);
      if (firstText && !enriched[firstText.id]) {
        enriched[firstText.id] = attendeeName;
      }

      const fd = new FormData();
      fd.append('variantId', variant.id);
      fd.append('fields', JSON.stringify(enriched));
      fd.append('idempotencyKey', registrationId); // valid UUID — safe for idempotency_key column
      fd.append('registrationId', registrationId);
      for (const [zoneId, file] of Object.entries(photoFiles)) {
        fd.append(`photo_${zoneId}`, file);
      }

      const res = await fetch('/api/render', { method: 'POST', body: fd });
      if (res.ok) {
        const cardId = res.headers.get('x-card-id');
        const blob = await res.blob();
        const dataUrl = await blobToDataUrl(blob);

        // Best-effort: link the nicer /c/{slug}/card/{id} path + persist zone data.
        // Requires the caller to be the event owner, so for most attendees this
        // silently no-ops — the render API above already wrote the raw storage
        // URL onto registrations.eventera_card_url, which is what actually matters.
        if (cardId) {
          fetch(`/api/events/${eventId}/registrations`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              registrationId,
              eventera_card_zone_data: enriched,
            }),
          }).catch(() => {});
        }

        onGenerated(dataUrl);
      } else {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.detail ?? body?.error ?? `Render failed (${res.status})`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Card generation failed');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(15,31,24,0.4)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-t-2xl sm:rounded-2xl overflow-hidden max-h-[92vh] flex flex-col"
        style={{ background: '#FAF6EE', border: '1px solid #E5E0D4' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-5 h-14 shrink-0" style={{ background: '#fff', borderBottom: '1px solid #E5E0D4' }}>
          <span className="font-display font-semibold text-[16px]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F1F18' }}>
            Get my Eventera Card
          </span>
          <button className="ml-auto flex items-center justify-center w-9 h-9 rounded-full" style={{ color: '#6B7A72' }} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-5 overflow-y-auto">
          <CardZoneFill
            zones={variant.zones}
            values={zoneValues}
            photoUrls={photoUrls}
            errors={{}}
            onChange={(id, v) => setZoneValues(p => ({ ...p, [id]: v }))}
            onPhotoSelect={handlePhotoSelect}
            onPhotoClear={handlePhotoClear}
            backgroundUrl={variant.background_url}
            backgroundWidth={variant.background_width}
            backgroundHeight={variant.background_height}
          />

          {error && (
            <div className="mt-4 px-4 py-3 rounded-xl text-[13px]" style={{ background: 'rgba(184,66,60,0.06)', color: '#B8423C', border: '1px solid rgba(184,66,60,0.15)' }}>
              {error}
            </div>
          )}
        </div>

        <div className="px-5 py-4 shrink-0" style={{ background: '#fff', borderTop: '1px solid #E5E0D4' }}>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-xl text-white font-semibold text-[15px] transition hover:opacity-90 disabled:opacity-50"
            style={{ background: '#1F4D3A', boxShadow: '0 4px 12px rgba(31,77,58,0.25)' }}
          >
            {generating ? (
              <>
                <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 1 1-9-9" strokeLinecap="round" />
                </svg>
                Generating your card…
              </>
            ) : (
              <>Get my card <ChevronRight size={16} strokeWidth={2.5} /></>
            )}
          </button>
        </div>
      </div>

      {cropTarget && (
        <PhotoCropModal
          target={cropTarget}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropTarget(null)}
        />
      )}
    </div>
  );
}
