'use client';

/**
 * AttendeeFlow — top-level client orchestrator for the 5-screen attendee experience.
 *
 * Screens:
 *   arrival   → E0 – Intro with card preview + CTA
 *   details   → E1 – Form with live preview
 *   crop      → E1.5 – Photo crop modal (rendered on top of details)
 *   preview   → E2 – Generated card preview + download
 *   success   → E3 – Success + viral share
 */

import { useState, useCallback } from 'react';
import { fetchWithRetry } from '@/lib/utils/fetch-retry';
import type { Zone } from '@/types/database';
import type { Area } from 'react-easy-crop';

import ArrivalScreen       from './components/ArrivalScreen';
import DetailsFormScreen   from './components/DetailsFormScreen';
import PhotoCropModal      from './components/PhotoCropModal';
import PreviewDownloadScreen from './components/PreviewDownloadScreen';
import SuccessShareScreen  from './components/SuccessShareScreen';

export interface AttendeeFlowProps {
  variantId: string;
  eventName: string;
  backgroundUrl: string;
  backgroundWidth: number;
  backgroundHeight: number;
  zones: Zone[];
}

type Screen = 'arrival' | 'details' | 'preview' | 'success';

export interface CropTarget {
  zoneId: string;
  zone: Zone;
  srcUrl: string;
  file: File;
}

/** Helper: draw crop area to offscreen canvas → JPEG blob */
async function getCroppedBlob(imageSrc: string, crop: Area): Promise<Blob> {
  const image = new window.Image();
  image.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => {
    image.onload  = () => resolve();
    image.onerror = () => reject(new Error('Failed to load image'));
    image.src = imageSrc;
  });
  const canvas  = document.createElement('canvas');
  canvas.width  = Math.round(crop.width);
  canvas.height = Math.round(crop.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No canvas context');
  ctx.drawImage(
    image,
    Math.round(crop.x), Math.round(crop.y),
    Math.round(crop.width), Math.round(crop.height),
    0, 0,
    Math.round(crop.width), Math.round(crop.height),
  );
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      blob => blob ? resolve(blob) : reject(new Error('Canvas is empty')),
      'image/jpeg', 0.93,
    );
  });
}

export default function AttendeeFlow({
  variantId, eventName, backgroundUrl, backgroundWidth, backgroundHeight, zones,
}: AttendeeFlowProps) {

  /* ── Screen state ─────────────────────────────────────────────────────── */
  const [screen, setScreen] = useState<Screen>('arrival');

  /* ── Form state ───────────────────────────────────────────────────────── */
  const [values, setValues]         = useState<Record<string, string>>({});
  const [photoFiles, setPhotoFiles] = useState<Record<string, File>>({});
  const [photoUrls, setPhotoUrls]   = useState<Record<string, string>>({});
  const [errors, setErrors]         = useState<Record<string, string>>({});

  /* ── Crop modal state ─────────────────────────────────────────────────── */
  const [cropTarget, setCropTarget]     = useState<CropTarget | null>(null);
  const [cropPos, setCropPos]           = useState<{x: number; y: number}>({ x: 0, y: 0 });
  const [cropZoom, setCropZoom]         = useState(1);
  const [croppedAreaPx, setCroppedAreaPx] = useState<Area | null>(null);

  /* ── Generation state ─────────────────────────────────────────────────── */
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrl, setResultUrl]       = useState<string | null>(null);
  const [generateError, setGenerateError] = useState('');
  // One UUID per form session — prevents double-taps from creating duplicate cards.
  // Regenerated when the user goes back to edit so a re-submit is treated as new.
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());

  /* ── Derived ──────────────────────────────────────────────────────────── */
  const editableZones = zones
    .filter(z => !z.hidden && (z.type === 'text' || z.type === 'custom' || z.type === 'photo'))
    .sort((a, b) => a.y - b.y || a.x - b.x);

  const requiredZones = editableZones.filter(z => z.required);

  const allRequiredFilled = requiredZones.every(z =>
    z.type === 'photo' ? !!photoFiles[z.id] : !!values[z.id]?.trim()
  );

  /* ── Photo selection → open crop modal ───────────────────────────────── */
  const handlePhotoSelect = useCallback((zoneId: string, file: File) => {
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return;
    const srcUrl = URL.createObjectURL(file);
    setCropPos({ x: 0, y: 0 });
    setCropZoom(1);
    setCroppedAreaPx(null);
    setCropTarget({ zoneId, zone, srcUrl, file });
  }, [zones]);

  /* ── Confirm crop ─────────────────────────────────────────────────────── */
  const handleCropConfirm = useCallback(async () => {
    if (!cropTarget || !croppedAreaPx) return;
    try {
      const blob        = await getCroppedBlob(cropTarget.srcUrl, croppedAreaPx);
      const croppedFile = new File([blob], cropTarget.file.name, { type: 'image/jpeg' });
      const croppedUrl  = URL.createObjectURL(blob);
      setPhotoFiles(p => ({ ...p, [cropTarget.zoneId]: croppedFile }));
      setPhotoUrls(u  => ({ ...u, [cropTarget.zoneId]: croppedUrl }));
      setCropTarget(null);
      // Clear any photo error
      setErrors(e => { const n = { ...e }; delete n[cropTarget.zoneId]; return n; });
    } catch (err) {
      console.error('[crop]', err);
    }
  }, [cropTarget, croppedAreaPx]);

  /* ── Validate form ────────────────────────────────────────────────────── */
  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    for (const z of requiredZones) {
      if (z.type === 'photo' && !photoFiles[z.id]) {
        errs[z.id] = 'Please add a photo';
      } else if ((z.type === 'text' || z.type === 'custom') && !values[z.id]?.trim()) {
        errs[z.id] = `${z.label || 'This field'} is required`;
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /* ── Generate card ────────────────────────────────────────────────────── */
  const handleGenerate = useCallback(async () => {
    if (!validate()) return;
    setIsGenerating(true);
    setGenerateError('');
    try {
      const fd = new FormData();
      fd.append('variantId', variantId);
      fd.append('fields', JSON.stringify(values));
      fd.append('idempotencyKey', idempotencyKey);
      for (const [zoneId, file] of Object.entries(photoFiles)) {
        fd.append(`photo_${zoneId}`, file);
      }
      const res = await fetchWithRetry('/api/render', { method: 'POST', body: fd }, { attempts: 3, baseDelay: 1500 });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        // Map machine error codes to human copy
        const errorMap: Record<string, string> = {
          CARD_LIMIT_REACHED:   "This event has reached its card limit for the month. Please contact the organiser.",
          RENDER_FAILED:        "We couldn't generate your card right now. Please try again in a moment.",
          PLAN_LIMIT:           "This event has reached its limit. Please contact the organiser.",
          DUPLICATE_SUBMISSION: "Your card is already being generated. Please wait a moment.",
        };
        throw new Error(errorMap[d.error] ?? d.detail ?? 'Something went wrong. Please try again.');
      }
      const blob = await res.blob();
      setResultUrl(URL.createObjectURL(blob));
      setScreen('preview');
    } catch (e: unknown) {
      setGenerateError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setIsGenerating(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variantId, values, photoFiles, idempotencyKey]);

  /* ── Download card ────────────────────────────────────────────────────── */
  const handleDownload = useCallback(() => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href     = resultUrl;
    a.download = `${eventName.toLowerCase().replace(/\s+/g, '-')}-card.png`;
    a.click();
    setTimeout(() => setScreen('success'), 400);
  }, [resultUrl, eventName]);

  /* ── Render ───────────────────────────────────────────────────────────── */

  if (screen === 'arrival') return (
    <ArrivalScreen
      eventName={eventName}
      backgroundUrl={backgroundUrl}
      backgroundWidth={backgroundWidth}
      backgroundHeight={backgroundHeight}
      zones={zones}
      onStart={() => setScreen('details')}
    />
  );

  if (screen === 'details') return (
    <>
      <DetailsFormScreen
        eventName={eventName}
        backgroundUrl={backgroundUrl}
        backgroundWidth={backgroundWidth}
        backgroundHeight={backgroundHeight}
        zones={zones}
        editableZones={editableZones}
        values={values}
        photoUrls={photoUrls}
        photoFiles={photoFiles}
        errors={errors}
        isGenerating={isGenerating}
        generateError={generateError}
        allRequiredFilled={allRequiredFilled}
        onValueChange={(zoneId, value) => {
          setValues(v => ({ ...v, [zoneId]: value }));
          if (errors[zoneId]) setErrors(e => { const n = { ...e }; delete n[zoneId]; return n; });
        }}
        onPhotoSelect={handlePhotoSelect}
        onGenerate={handleGenerate}
        onBack={() => setScreen('arrival')}
      />
      {/* Photo crop modal renders on top of the form */}
      {cropTarget && (
        <PhotoCropModal
          cropTarget={cropTarget}
          cropPos={cropPos}
          cropZoom={cropZoom}
          onCropChange={setCropPos}
          onZoomChange={setCropZoom}
          onCropComplete={(_area, pixels) => setCroppedAreaPx(pixels)}
          onConfirm={handleCropConfirm}
          onReupload={() => {
            setCropTarget(null);
          }}
          onClose={() => setCropTarget(null)}
        />
      )}
    </>
  );

  if (screen === 'preview' && resultUrl) return (
    <PreviewDownloadScreen
      eventName={eventName}
      backgroundWidth={backgroundWidth}
      backgroundHeight={backgroundHeight}
      resultUrl={resultUrl}
      onDownload={handleDownload}
      onEdit={() => { setIdempotencyKey(crypto.randomUUID()); setScreen('details'); }}
    />
  );

  if (screen === 'success') return (
    <SuccessShareScreen
      eventName={eventName}
      backgroundWidth={backgroundWidth}
      backgroundHeight={backgroundHeight}
      resultUrl={resultUrl}
      onBack={() => setScreen('preview')}
    />
  );

  // Fallback — should never reach here
  return null;
}
