'use client';

import React from 'react';
import type { Zone, Variant } from '@/types/database';
import { Plus, Tag, Copy, Trash2, ChevronDown } from 'lucide-react';

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
      className="shrink-0 flex items-center px-4 gap-1.5 overflow-x-auto"
      style={{
        height: 40,
        background: '#FAF6EE',
        borderBottom: '1px solid #E5E0D4',
        zIndex: 20,
        position: 'relative',
      }}
      onClick={() => setVariantMenuId(null)}
    >
      {/* "Variants" label */}
      <span
        className="text-[10px] uppercase tracking-[0.1em] mr-1 shrink-0"
        style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#65736B' }}
      >
        Variants
      </span>

      {/* Tab pills */}
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
                className="h-[28px] px-2.5 rounded-md text-[12px] font-semibold outline-none w-[130px]"
                style={{ border: '2px solid #1F4D3A', background: 'white' }}
              />
            ) : (
              <div className="flex items-stretch" style={{ position: 'relative' }}>
                {/* Tab label button */}
                <button
                  onClick={() => switchVariant(v.id)}
                  onDoubleClick={() => { setRenamingVariantId(v.id); setRenameValue(v.variant_name); }}
                  className="flex items-center gap-2 pl-2.5 pr-1.5 transition"
                  style={{
                    height: 28,
                    background: isActive ? '#FFFFFF' : 'transparent',
                    border: isActive ? '1px solid #E5E0D4' : '1px solid transparent',
                    borderBottom: isActive ? '1px solid transparent' : '1px solid transparent',
                    borderRadius: '6px 0 0 6px',
                    boxShadow: isActive ? '0 1px 2px rgba(15,31,24,0.04)' : 'none',
                    position: 'relative',
                  }}
                >
                  {/* Green underline for active */}
                  {isActive && (
                    <span style={{
                      position: 'absolute',
                      left: 8, right: 8, bottom: -1,
                      height: 2,
                      background: '#1F4D3A',
                      borderRadius: 1,
                    }} />
                  )}
                  {/* Small card icon */}
                  <span style={{
                    width: 12,
                    height: 16,
                    borderRadius: 2,
                    background: isActive ? '#1F4D3A' : '#C9C3B1',
                    flexShrink: 0,
                    display: 'inline-block',
                  }} />
                  <span
                    className="text-[12px] font-semibold"
                    style={{ color: isActive ? '#0F1F18' : '#3A4A42' }}
                  >
                    {v.variant_name}
                  </span>
                  <span
                    className="text-[10px]"
                    style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#65736B' }}
                  >
                    {zoneCount}
                  </span>
                </button>

                {/* Chevron context menu trigger */}
                <button
                  onClick={e => { e.stopPropagation(); setVariantMenuId(menuOpen ? null : v.id); }}
                  title="Variant options"
                  className="flex items-center justify-center transition"
                  style={{
                    height: 28,
                    width: 22,
                    background: isActive ? '#FFFFFF' : 'transparent',
                    border: isActive ? '1px solid #E5E0D4' : '1px solid transparent',
                    borderLeft: isActive ? '1px solid #E5E0D4' : '1px solid transparent',
                    borderRadius: '0 6px 6px 0',
                    color: isActive ? '#65736B' : '#65736B',
                    boxShadow: isActive ? '0 1px 2px rgba(15,31,24,0.04)' : 'none',
                  }}
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
                  className="w-full text-left px-3 py-2 text-[12.5px] hover:bg-[#FAF6EE] flex items-center gap-2.5 rounded-lg transition"
                  style={{ color: '#0F1F18' }}
                >
                  <Tag size={13} strokeWidth={1.8} />Rename
                </button>
                <button
                  onClick={() => handleDuplicateVariant(v.id)}
                  className="w-full text-left px-3 py-2 text-[12.5px] hover:bg-[#FAF6EE] flex items-center gap-2.5 transition"
                  style={{ color: '#0F1F18' }}
                >
                  <Copy size={13} strokeWidth={1.8} />Duplicate
                </button>
                <div className="h-px mx-3 my-1" style={{ background: '#E5E0D4' }} />
                <button
                  onClick={() => handleDeleteVariant(v.id)}
                  disabled={variants.length <= 1}
                  className="w-full text-left px-3 py-2 text-[12.5px] flex items-center gap-2.5 disabled:opacity-30 disabled:cursor-not-allowed transition hover:bg-red-50"
                  style={{ color: '#B8423C' }}
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
        className="flex items-center gap-1.5 px-2.5 rounded-md transition shrink-0"
        style={{
          height: 28,
          background: 'transparent',
          border: '1px dashed #C9C3B1',
          fontFamily: 'Inter, sans-serif',
          fontSize: 12,
          fontWeight: 500,
          color: '#65736B',
        }}
      >
        <Plus size={12} strokeWidth={2.5} />Add variant
      </button>

      {/* Spacer — canvas dims are already shown in the stage overlay chip, no need to repeat here */}
      <div className="flex-1" />
    </div>
  );
}
