'use client';

import React from 'react';
import type { Zone, Variant } from '@/types/database';
import { Layers, ChevronDown, Plus, Tag, Copy, Trash2 } from 'lucide-react';

interface VariantsTabsProps {
  variants: Variant[];
  activeVariantId: string;
  variantZonesMap: Record<string, Zone[]>;
  variantMenuId: string | null;
  setVariantMenuId: (id: string | null) => void;
  renamingVariantId: string | null;
  setRenamingVariantId: (id: string | null) => void;
  renameValue: string;
  setRenameValue: (v: string) => void;
  switchVariant: (id: string) => void;
  handleRenameVariant: (id: string, name: string) => Promise<void>;
  handleDeleteVariant: (id: string) => Promise<void>;
  handleDuplicateVariant: (id: string) => Promise<void>;
  onAddVariant: () => void;
}

export default function VariantsTabs({
  variants, activeVariantId, variantZonesMap,
  variantMenuId, setVariantMenuId,
  renamingVariantId, setRenamingVariantId,
  renameValue, setRenameValue,
  switchVariant, handleRenameVariant, handleDeleteVariant, handleDuplicateVariant,
  onAddVariant,
}: VariantsTabsProps) {
  return (
    <div
      className="h-11 bg-white border-b border-border flex items-center px-4 gap-1.5 shrink-0"
      style={{ zIndex: 20, position: 'relative' }}
      onClick={() => setVariantMenuId(null)}
    >
      <span className="text-[10px] font-mono text-ink/40 mr-1 shrink-0 tracking-widest uppercase">Variants</span>

      {variants.map(v => {
        const isActive   = v.id === activeVariantId;
        const isRenaming = renamingVariantId === v.id;
        const menuOpen   = variantMenuId === v.id;
        const zoneCount  = (variantZonesMap[v.id] ?? []).length;

        return (
          <div key={v.id} className="relative shrink-0">
            {isRenaming ? (
              <input
                autoFocus
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                onBlur={() => handleRenameVariant(v.id, renameValue)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleRenameVariant(v.id, renameValue);
                  if (e.key === 'Escape') setRenamingVariantId(null);
                  e.stopPropagation();
                }}
                onClick={e => e.stopPropagation()}
                className="h-7 px-2.5 rounded-lg text-[12.5px] font-medium outline-none w-[130px]"
                style={{ border: '2px solid #1F4D3A', background: 'white' }}
              />
            ) : (
              <div className="flex items-stretch">
                {/* Tab label */}
                <button
                  onClick={() => switchVariant(v.id)}
                  onDoubleClick={() => { setRenamingVariantId(v.id); setRenameValue(v.variant_name); }}
                  className={`flex items-center gap-1.5 pl-2.5 pr-2 h-7 text-[12.5px] font-medium transition rounded-l-lg ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'bg-white text-ink/65 hover:text-ink hover:bg-cream border border-r-0 border-border'
                  }`}
                >
                  <Layers size={11} strokeWidth={2} />
                  <span>{v.variant_name}</span>
                  {/* Zone count badge */}
                  <span className={`text-[10px] font-mono opacity-70 ${isActive ? 'text-white/70' : 'text-ink/40'}`}>
                    · {zoneCount}
                  </span>
                </button>

                {/* Chevron / context menu trigger */}
                <button
                  onClick={e => { e.stopPropagation(); setVariantMenuId(menuOpen ? null : v.id); }}
                  title="Variant options"
                  className={`h-7 w-6 flex items-center justify-center rounded-r-lg transition ${
                    isActive
                      ? 'bg-primary text-white/60 hover:bg-primary-dark hover:text-white'
                      : 'bg-white border border-border text-ink/35 hover:text-ink hover:bg-cream'
                  }`}
                >
                  <ChevronDown size={10} strokeWidth={2.5} />
                </button>
              </div>
            )}

            {/* Context menu */}
            {menuOpen && (
              <div
                className="absolute left-0 bg-white rounded-xl py-1 w-44"
                style={{
                  top: 'calc(100% + 4px)',
                  border: '1px solid #E5E0D4',
                  boxShadow: '0 8px 24px rgba(15,31,24,0.14)',
                  zIndex: 200,
                }}
                onClick={e => e.stopPropagation()}
              >
                <button
                  onClick={() => { setRenamingVariantId(v.id); setRenameValue(v.variant_name); setVariantMenuId(null); }}
                  className="w-full text-left px-3 py-2 text-[12.5px] text-ink hover:bg-cream flex items-center gap-2.5 rounded-lg transition"
                >
                  <Tag size={13} strokeWidth={1.8} />Rename
                </button>
                <button
                  onClick={() => handleDuplicateVariant(v.id)}
                  className="w-full text-left px-3 py-2 text-[12.5px] text-ink hover:bg-cream flex items-center gap-2.5 transition"
                >
                  <Copy size={13} strokeWidth={1.8} />Duplicate
                </button>
                <div className="h-px mx-3 my-1 bg-border" />
                <button
                  onClick={() => handleDeleteVariant(v.id)}
                  disabled={variants.length <= 1}
                  className="w-full text-left px-3 py-2 text-[12.5px] text-danger hover:bg-red-50 flex items-center gap-2.5 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  <Trash2 size={13} strokeWidth={1.8} />Delete
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* Add variant */}
      <button
        onClick={onAddVariant}
        className="flex items-center gap-1.5 px-3 h-7 rounded-lg text-[12.5px] font-medium border border-dashed border-border text-ink/50 hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition shrink-0"
      >
        <Plus size={13} strokeWidth={2.5} />Add variant
      </button>
    </div>
  );
}
