'use client';

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import type { Zone } from '@/types/database';

interface CropTarget { zone: Zone; srcUrl: string; file: File }
interface CroppedAreaPixels { x: number; y: number; width: number; height: number }

interface Props {
  target: CropTarget;
  onConfirm: (file: File, previewUrl: string) => void;
  onCancel: () => void;
}

async function getCroppedBlob(srcUrl: string, px: CroppedAreaPixels): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = px.width;
      canvas.height = px.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, px.x, px.y, px.width, px.height, 0, 0, px.width, px.height);
      canvas.toBlob(blob => {
        if (!blob) { reject(new Error('crop failed')); return; }
        resolve(new File([blob], 'photo.jpg', { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.93);
    };
    img.onerror = reject;
    img.src = srcUrl;
  });
}

export function PhotoCropModal({ target, onConfirm, onCancel }: Props) {
  const { zone, srcUrl } = target;
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPx, setCroppedAreaPx] = useState<CroppedAreaPixels | null>(null);
  const [processing, setProcessing] = useState(false);

  const aspect = zone.w && zone.h ? zone.w / zone.h : 1;
  const cropShape: 'round' | 'rect' = zone.shape === 'circle' ? 'round' : 'rect';
  const shapeLabel = zone.shape === 'circle' ? 'Circle' : zone.shape === 'rounded' ? 'Rounded' : zone.shape === 'hexagon' ? 'Hexagon' : 'Square';

  const onCropComplete = useCallback((_: unknown, px: CroppedAreaPixels) => {
    setCroppedAreaPx(px);
  }, []);

  async function handleConfirm() {
    if (!croppedAreaPx) return;
    setProcessing(true);
    try {
      const file = await getCroppedBlob(srcUrl, croppedAreaPx);
      const previewUrl = URL.createObjectURL(file);
      onConfirm(file, previewUrl);
    } catch {
      // fallback: use original
      onConfirm(target.file, srcUrl);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div
        className="relative w-full max-w-[540px] rounded-2xl overflow-hidden"
        style={{ background: '#0F1F18' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <div className="text-[15px] font-semibold text-white">{zone.label ?? 'Photo'}</div>
            <div className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {shapeLabel} · crop to fit the card zone
            </div>
          </div>
          <button onClick={onCancel} className="text-[13px] font-medium transition" style={{ color: 'rgba(232,197,126,0.7)' }}>
            Cancel
          </button>
        </div>

        {/* Cropper */}
        <div style={{ position: 'relative', height: 360, background: '#050F09' }}>
          <Cropper
            image={srcUrl}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape={cropShape}
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{
              containerStyle: { background: 'transparent' },
              cropAreaStyle: { border: '2px solid #E8C57E', boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)' },
            }}
          />
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button onClick={() => setZoom(z => Math.max(1, z - 0.1))} className="shrink-0" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <ZoomOut size={16} strokeWidth={2} />
          </button>
          <input
            type="range" min={1} max={3} step={0.05}
            value={zoom}
            onChange={e => setZoom(parseFloat(e.target.value))}
            className="flex-1 accent-[#E8C57E]"
          />
          <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="shrink-0" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <ZoomIn size={16} strokeWidth={2} />
          </button>
          <button
            onClick={() => { setCrop({ x: 0, y: 0 }); setZoom(1); }}
            className="shrink-0 transition"
            style={{ color: 'rgba(255,255,255,0.4)' }}
            title="Reset"
          >
            <RotateCcw size={14} strokeWidth={2} />
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={onCancel}
            className="flex-1 h-11 rounded-xl text-[14px] font-medium transition"
            style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }}
          >
            Re-upload
          </button>
          <button
            onClick={handleConfirm}
            disabled={processing}
            className="flex-1 h-11 rounded-xl text-white text-[14px] font-semibold transition hover:opacity-90 disabled:opacity-60"
            style={{ background: '#1F4D3A' }}
          >
            {processing ? 'Processing…' : 'Use this photo'}
          </button>
        </div>
      </div>
    </div>
  );
}
