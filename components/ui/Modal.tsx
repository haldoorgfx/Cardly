'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Optional sticky footer (e.g. Cancel / Save buttons) */
  footer?: React.ReactNode;
  maxWidth?: number;
}

/**
 * Unified centered modal used for ALL create/edit/update forms across the platform.
 * Dim backdrop (click + Esc to close), white rounded panel, header with title + X,
 * scrollable body, optional sticky footer. Brand: forest + cream.
 */
export function Modal({ open, onClose, title, subtitle, children, footer, maxWidth = 520 }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" style={{ animation: 'kfade .15s ease-out' }} onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-h-[90vh] flex flex-col rounded-2xl overflow-hidden"
        style={{ maxWidth, background: 'white', border: '1px solid #E5E0D4', boxShadow: '0 8px 40px rgba(15,31,24,0.18)', animation: 'kmodal .18s ease-out' }}
      >
        <div className="flex items-start justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid #E5E0D4' }}>
          <div className="min-w-0">
            <h3 className="font-display text-[16px] font-semibold" style={{ color: '#0F1F18' }}>{title}</h3>
            {subtitle && <p className="text-[12.5px] mt-0.5" style={{ color: '#6B7A72' }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="h-8 w-8 rounded-lg grid place-items-center transition hover:bg-[#F5F3EE] shrink-0" style={{ color: '#6B7A72' }}>
            <X size={18} strokeWidth={2} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="flex justify-end gap-3 px-6 py-4 shrink-0" style={{ borderTop: '1px solid #E5E0D4', background: 'white' }}>
            {footer}
          </div>
        )}
        <style>{`
          @keyframes kmodal { from { opacity: 0; transform: scale(.97) translateY(6px); } to { opacity: 1; transform: scale(1) translateY(0); } }
          @keyframes kfade { from { opacity: 0; } to { opacity: 1; } }
        `}</style>
      </div>
    </div>
  );
}
