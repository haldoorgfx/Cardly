'use client';

import React from 'react';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import type { Zone } from '@/types/database';
import {
  ArrowLeft, Pencil, Undo2, Redo2, CheckCircle2, Wand2,
  HelpCircle, Eye, Play, Globe,
} from 'lucide-react';

interface TopBarProps {
  eventId: string;
  nameVal: string;
  setNameVal: (v: string) => void;
  editName: boolean;
  setEditName: (v: boolean) => void;
  saveName: () => Promise<void>;
  pastLength: number;
  futureLength: number;
  undo: () => void;
  redo: () => void;
  savedAt: string;
  saveError: boolean;
  previewMode: boolean;
  setPreviewMode: (fn: (p: boolean) => boolean) => void;
  showShortcuts: boolean;
  setShowShortcuts: (fn: (s: boolean) => boolean) => void;
  selected: Zone | null;
  copiedStyle: Partial<Zone> | null;
  styleFlash: boolean;
  copyStyle: () => void;
  pasteStyle: () => void;
  eventSlug: string;
  router: AppRouterInstance;
}

export default function TopBar({
  eventId, nameVal, setNameVal, editName, setEditName, saveName,
  pastLength, futureLength, undo, redo, savedAt,
  previewMode, setPreviewMode,
  showShortcuts, setShowShortcuts,
  selected, copiedStyle, styleFlash, copyStyle, pasteStyle,
  eventSlug, router, saveError,
}: TopBarProps) {
  return (
    <header
      className="bg-white border-b border-border flex items-center px-4 gap-3 shrink-0 z-10"
      style={{ height: 52 }}
    >
      {/* Left — back + breadcrumb */}
      <a
        href={`/events/${eventSlug}/eventera-card`}
        className="h-8 w-8 rounded-lg hover:bg-cream grid place-items-center text-ink/70 shrink-0 transition"
        title="Back to Cards &amp; Badges"
      >
        <ArrowLeft size={16} strokeWidth={1.8} />
      </a>

      <div className="h-5 w-px bg-border shrink-0" />

      {/* Eventera mark */}
      <a href={`/events/${eventSlug}/eventera-card`} className="shrink-0">
        <span className="h-7 w-7 rounded-lg grid place-items-center text-white font-display font-bold text-[13px] bg-primary">K</span>
      </a>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[13px] min-w-0">
        <a href="/dashboard" className="text-ink/40  text-[11px] hover:text-ink/60 transition shrink-0">Events</a>
        <span className="text-ink/30 shrink-0">/</span>

        {editName ? (
          <input
            autoFocus
            value={nameVal}
            onChange={e => setNameVal(e.target.value)}
            onBlur={saveName}
            onKeyDown={e => {
              if (e.key === 'Enter') saveName();
              if (e.key === 'Escape') setEditName(false);
            }}
            className="font-display font-semibold bg-white border border-primary/40 rounded-md px-2 py-0.5 outline-none w-[240px] text-[13px] focus:ring-2 focus:ring-primary/20"
          />
        ) : (
          <button
            onClick={() => setEditName(true)}
            title="Click to rename event"
            className="group flex items-center gap-1.5 font-display font-semibold hover:bg-cream rounded-md px-2 py-0.5 text-[13px] transition min-w-0 max-w-[220px]"
          >
            <span className="truncate">{nameVal}</span>
            <Pencil size={11} strokeWidth={2} className="text-ink/30 group-hover:text-primary transition shrink-0" />
          </button>
        )}
      </div>

      <div className="flex-1" />

      {/* Undo / Redo */}
      <div className="flex items-center gap-0.5">
        <button
          title="Undo (⌘Z)"
          disabled={!pastLength}
          onClick={undo}
          className={`h-8 w-8 rounded-lg grid place-items-center transition ${pastLength ? 'text-ink/80 hover:bg-cream' : 'text-ink/25'}`}
        >
          <Undo2 size={15} strokeWidth={1.8} />
        </button>
        <button
          title="Redo (⇧⌘Z)"
          disabled={!futureLength}
          onClick={redo}
          className={`h-8 w-8 rounded-lg grid place-items-center transition ${futureLength ? 'text-ink/80 hover:bg-cream' : 'text-ink/25'}`}
        >
          <Redo2 size={15} strokeWidth={1.8} />
        </button>
      </div>

      {/* Saved indicator */}
      <div className="flex items-center gap-1.5 text-[11px] mx-1 shrink-0">
        {saveError ? (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#B8423C" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
            <span className="text-[#B8423C]">Save failed — edit to retry</span>
          </>
        ) : (
          <>
            <CheckCircle2 size={12} strokeWidth={2.2} className="text-success" />
            <span className="text-ink/45">Saved {savedAt}</span>
          </>
        )}
      </div>

      {/* Copy / paste style (only when a zone is selected) */}
      {selected && (
        <div className="flex items-center gap-0.5">
          <button
            onClick={copyStyle}
            title="Copy style (⌘⌥C)"
            className={`h-8 px-2.5 rounded-lg text-[11.5px] flex items-center gap-1.5 transition ${styleFlash ? 'bg-primary text-white' : 'hover:bg-cream text-ink/65'}`}
          >
            <Wand2 size={13} strokeWidth={1.8} />
            {styleFlash ? 'Copied!' : 'Copy style'}
          </button>
          {copiedStyle && (
            <button
              onClick={pasteStyle}
              title="Paste style (⌘⌥V)"
              className="h-8 px-2.5 rounded-lg text-[11.5px] flex items-center gap-1.5 hover:bg-primary/10 hover:text-primary text-ink/65 transition border border-dashed border-primary/30"
            >
              <Wand2 size={13} strokeWidth={1.8} />
              Paste style
            </button>
          )}
        </div>
      )}

      {/* Action group */}
      <div className="flex items-center gap-2">
        {/* Shortcuts */}
        <button
          onClick={() => setShowShortcuts(s => !s)}
          title="Keyboard shortcuts (⌘/)"
          className={`h-8 w-8 rounded-lg grid place-items-center transition ${showShortcuts ? 'bg-primary/10 text-primary' : 'hover:bg-cream text-ink/60'}`}
        >
          <HelpCircle size={15} strokeWidth={1.8} />
        </button>

        {/* Preview toggle */}
        <button
          onClick={() => setPreviewMode(p => !p)}
          title="Preview mode (⌘P)"
          className={`inline-flex items-center gap-1.5 text-[12.5px] px-3 py-1.5 rounded-lg border transition ${
            previewMode
              ? 'bg-primary/10 text-primary border-primary/30 font-medium'
              : 'text-ink/70 border-border hover:bg-cream'
          }`}
        >
          <Eye size={13} strokeWidth={2} />
          {previewMode ? 'Editing' : 'Preview'}
          <span className="text-[10px] opacity-50 ml-0.5">⌘P</span>
        </button>

        {/* Test — opens attendee page in new tab with preview bypass */}
        <a
          href={`/c/${eventSlug}?preview=${eventId}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Preview attendee experience"
          className="inline-flex items-center gap-1.5 text-[12.5px] text-ink/80 bg-white border border-border px-3 py-1.5 rounded-lg hover:bg-cream transition"
        >
          <Play size={13} strokeWidth={2.2} />Test
        </a>

        {/* Publish */}
        <button
          onClick={() => router.push(`/events/${eventSlug}/publish`)}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white px-3.5 py-1.5 rounded-lg hover:opacity-95 transition shadow-soft bg-primary"
        >
          <Globe size={13} strokeWidth={2.2} />Publish
        </button>
      </div>
    </header>
  );
}
