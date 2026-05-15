'use client';

import React from 'react';
import { ZoomIn, ZoomOut, Grid, Magnet } from 'lucide-react';

interface BottomBarProps {
  zoom: number;
  setZoom: (fn: (z: number) => number) => void;
  fitZoom: () => void;
  grid: boolean;
  setGrid: (fn: (g: boolean) => boolean) => void;
  gridSnap: boolean;
  setGridSnap: (fn: (s: boolean) => boolean) => void;
}

export default function BottomBar({
  zoom, setZoom, fitZoom, grid, setGrid, gridSnap, setGridSnap,
}: BottomBarProps) {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white rounded-xl border border-border shadow-soft p-1 z-10">
      <button
        onClick={() => setZoom(z => Math.max(0.1, z - 0.1))}
        className="h-8 w-8 rounded-lg hover:bg-cream grid place-items-center text-ink/70 transition"
        title="Zoom out (⌘-)"
      >
        <ZoomOut size={14} strokeWidth={1.8} />
      </button>

      <button
        onClick={() => setZoom(() => 1)}
        className="font-mono text-[12px] px-2 min-w-[60px] text-center hover:bg-cream rounded-lg py-1.5 text-ink/70 transition"
        title="Reset to 100%"
      >
        {Math.round(zoom * 100)}%
      </button>

      <button
        onClick={() => setZoom(z => Math.min(3, z + 0.1))}
        className="h-8 w-8 rounded-lg hover:bg-cream grid place-items-center text-ink/70 transition"
        title="Zoom in (⌘+)"
      >
        <ZoomIn size={14} strokeWidth={1.8} />
      </button>

      <span className="h-5 w-px bg-border mx-0.5" />

      <button
        onClick={fitZoom}
        className="h-8 px-2.5 rounded-lg hover:bg-cream text-[12px] text-ink/70 font-mono transition"
        title="Fit to screen"
      >
        Fit
      </button>

      <span className="h-5 w-px bg-border mx-0.5" />

      <button
        onClick={() => setGrid(g => !g)}
        className={`h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-[12px] transition ${grid ? 'bg-primary/10 text-primary' : 'hover:bg-cream text-ink/70'}`}
        title="Toggle grid (G)"
      >
        <Grid size={12} strokeWidth={1.8} />Grid
      </button>

      <button
        onClick={() => setGridSnap(s => !s)}
        className={`h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-[12px] transition ${gridSnap ? 'bg-accent/20 text-[#C9A45E]' : 'hover:bg-cream text-ink/70'}`}
        title="Snap to grid"
      >
        <Magnet size={12} strokeWidth={1.8} />Snap
      </button>

      <span className="h-5 w-px bg-border mx-0.5" />

      <span className="text-[10px] font-mono text-ink/35 px-1 select-none hidden sm:block">⎵ pan</span>
    </div>
  );
}
