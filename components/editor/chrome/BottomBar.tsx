'use client';

import React from 'react';
import { ZoomIn, ZoomOut, Grid, Magnet, Maximize2 } from 'lucide-react';

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
    <div
      className="shrink-0 flex items-center px-3 gap-2"
      style={{
        height: 40,
        background: '#FFFFFF',
        borderTop: '1px solid #E5E0D4',
      }}
    >
      {/* Zoom control â€” bordered group */}
      <div
        className="flex items-center overflow-hidden"
        style={{
          height: 28,
          border: '1px solid #E5E0D4',
          borderRadius: 6,
          background: '#FAF6EE',
        }}
      >
        <button
          onClick={() => setZoom(z => Math.max(0.1, +(z - 0.1).toFixed(1)))}
          title="Zoom out (âŒ˜-)"
          className="flex items-center justify-center transition hover:bg-white"
          style={{ width: 26, height: 26, color: '#3A4A42', background: 'transparent', border: 'none', cursor: 'pointer' }}
        >
          <ZoomOut size={12} strokeWidth={2} />
        </button>

        <button
          onClick={() => setZoom(() => 1)}
          title="Reset to 100%"
          className="flex items-center justify-center transition hover:bg-white"
          style={{
            height: 26,
            padding: '0 8px',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 11,
            fontWeight: 500,
            color: '#0F1F18',
            background: 'transparent',
            border: 'none',
            borderLeft: '1px solid #E5E0D4',
            borderRight: '1px solid #E5E0D4',
            cursor: 'pointer',
            minWidth: 44,
            textAlign: 'center',
          }}
        >
          {Math.round(zoom * 100)}%
        </button>

        <button
          onClick={() => setZoom(z => Math.min(3, +(z + 0.1).toFixed(1)))}
          title="Zoom in (âŒ˜+)"
          className="flex items-center justify-center transition hover:bg-white"
          style={{ width: 26, height: 26, color: '#3A4A42', background: 'transparent', border: 'none', cursor: 'pointer' }}
        >
          <ZoomIn size={12} strokeWidth={2} />
        </button>
      </div>

      {/* Fit button */}
      <button
        onClick={fitZoom}
        title="Fit to screen"
        className="flex items-center gap-1.5 transition hover:bg-[#FAF6EE]"
        style={{
          height: 28,
          padding: '0 10px',
          background: '#FAF6EE',
          border: '1px solid #E5E0D4',
          borderRadius: 6,
          fontFamily: 'Inter, sans-serif',
          fontSize: 12,
          fontWeight: 500,
          color: '#0F1F18',
          cursor: 'pointer',
        }}
      >
        <Maximize2 size={11} strokeWidth={2} />
        <span>Fit</span>
      </button>

      {/* Divider */}
      <span style={{ width: 1, height: 18, background: '#E5E0D4', display: 'block' }} />

      {/* Grid toggle chip */}
      <button
        onClick={() => setGrid(g => !g)}
        title="Toggle grid (G)"
        className="flex items-center gap-1.5 transition"
        style={{
          height: 28,
          padding: '0 10px',
          background: grid ? '#E8EFEB' : '#FAF6EE',
          border: grid ? '1px solid rgba(31,77,58,0.18)' : '1px solid #E5E0D4',
          borderRadius: 6,
          fontFamily: 'Inter, sans-serif',
          fontSize: 12,
          fontWeight: 500,
          color: grid ? '#1F4D3A' : '#3A4A42',
          cursor: 'pointer',
        }}
      >
        <Grid size={12} strokeWidth={1.8} />
        <span>Grid</span>
      </button>

      {/* Snap toggle chip */}
      <button
        onClick={() => setGridSnap(s => !s)}
        title="Snap to grid"
        className="flex items-center gap-1.5 transition"
        style={{
          height: 28,
          padding: '0 10px',
          background: gridSnap ? '#E8EFEB' : '#FAF6EE',
          border: gridSnap ? '1px solid rgba(31,77,58,0.18)' : '1px solid #E5E0D4',
          borderRadius: 6,
          fontFamily: 'Inter, sans-serif',
          fontSize: 12,
          fontWeight: 500,
          color: gridSnap ? '#1F4D3A' : '#3A4A42',
          cursor: 'pointer',
        }}
      >
        <Magnet size={12} strokeWidth={1.8} />
        <span>Snap</span>
      </button>

      {/* Spacer + pan hint */}
      <div className="flex-1" />
      <span
        className="hidden sm:flex items-center gap-1.5"
        style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 10, color: '#6B7A72', letterSpacing: '0.04em' }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 11V6a2 2 0 0 0-4 0v5"/>
          <path d="M14 10V4a2 2 0 0 0-4 0v6"/>
          <path d="M10 10.5V6a2 2 0 0 0-4 0v8"/>
          <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2a8 8 0 0 1-8-8"/>
        </svg>
        <span>space + drag to pan</span>
      </span>
    </div>
  );
}
