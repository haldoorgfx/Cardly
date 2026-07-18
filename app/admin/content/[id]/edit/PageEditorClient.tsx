'use client';

import React, { useState, useCallback, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, Plus, Trash2, GripVertical, ChevronDown, ChevronRight, Save, Globe, FileText, Loader2 } from 'lucide-react';
import type { CmsPageWithBlocks, CmsBlock, BlockType } from '@/lib/cms/types';
import { WysiwygEditor } from '@/components/cms/editor/WysiwygEditor';
import { useConfirm } from '@/components/ui/ConfirmProvider';

// ── Block type list ───────────────────────────────────────────────────────────

const BLOCK_TYPES: BlockType[] = [
  'hero', 'sectionHeader', 'richText', 'featuresGrid', 'stepsGrid',
  'faqAccordion', 'cta', 'logoStrip', 'pricingCards', 'comparisonTable',
  'testimonial', 'teamGrid', 'pressSection', 'useCasesGrid', 'tabInterface',
  'contactChannels', 'categoryGrid', 'programCards', 'proseSections',
  'statsStrip', 'videoDemo',
];

const BLOCK_LABELS: Record<BlockType, string> = {
  hero: 'Hero',
  sectionHeader: 'Section Header',
  richText: 'Rich Text',
  featuresGrid: 'Features Grid',
  stepsGrid: 'Steps Grid',
  faqAccordion: 'FAQ Accordion',
  cta: 'CTA',
  logoStrip: 'Logo Strip',
  pricingCards: 'Pricing Cards',
  comparisonTable: 'Comparison Table',
  testimonial: 'Testimonial',
  teamGrid: 'Team Grid',
  pressSection: 'Press Section',
  useCasesGrid: 'Use Cases Grid',
  tabInterface: 'Tab Interface',
  contactChannels: 'Contact Channels',
  categoryGrid: 'Category Grid',
  programCards: 'Program Cards',
  proseSections: 'Prose Sections',
  statsStrip: 'Stats Strip',
  videoDemo: 'Video Demo',
};

// ── Smart field editor ────────────────────────────────────────────────────────

function FieldEditor({
  name, value, onChange,
}: {
  name: string; value: unknown; onChange: (v: unknown) => void;
}) {
  if (typeof value === 'boolean') {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <div
          onClick={() => onChange(!value)}
          className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${value ? 'bg-[#1F4D3A]' : 'bg-[#E5E0D4]'}`}
        >
          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${value ? 'left-4' : 'left-0.5'}`} />
        </div>
        <span className="text-[12px] text-[#3A4A42]">{value ? 'Yes' : 'No'}</span>
      </label>
    );
  }

  if (typeof value === 'number') {
    return (
      <input
        type="number"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-8 px-2.5 border border-[#E5E0D4] rounded-lg text-[13px] text-[#0F1F18] bg-white focus:outline-none focus:border-[#1F4D3A]"
      />
    );
  }

  if (typeof value === 'string') {
    // HTML/rich text fields → WYSIWYG editor
    const isHtml = name === 'html' || name === 'body' || name === 'content' || value.includes('<');
    if (isHtml) {
      return <WysiwygEditor value={value} onChange={onChange as (v: string) => void} minHeight={180} />;
    }
    // Long plain text → textarea
    const isLong = value.length > 80 || name.toLowerCase().includes('answer') || name.toLowerCase().includes('subtext') || name.toLowerCase().includes('description') || name.toLowerCase().includes('blurb');
    if (isLong) {
      return (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={3}
          className="w-full px-2.5 py-2 border border-[#E5E0D4] rounded-lg text-[13px] text-[#0F1F18] bg-white focus:outline-none focus:border-[#1F4D3A] resize-y leading-relaxed"
        />
      );
    }
    // Short plain text → single line
    return (
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full h-8 px-2.5 border border-[#E5E0D4] rounded-lg text-[13px] text-[#0F1F18] bg-white focus:outline-none focus:border-[#1F4D3A]"
      />
    );
  }

  if (Array.isArray(value)) {
    return (
      <div className="space-y-2">
        {value.map((item, idx) => (
          <div key={idx} className="border border-[#E5E0D4] rounded-lg p-3 bg-[#FAF6EE] relative">
            <button
              onClick={() => onChange(value.filter((_, i) => i !== idx))}
              className="absolute top-2 right-2 text-[#B8423C] hover:text-[#8B2E2A] transition-colors"
            >
              <Trash2 size={12} />
            </button>
            {typeof item === 'string' ? (
              <input
                type="text"
                value={item}
                onChange={e => {
                  const next = [...value];
                  next[idx] = e.target.value;
                  onChange(next);
                }}
                className="w-full h-7 px-2 border border-[#E5E0D4] rounded-md text-[12px] text-[#0F1F18] bg-white focus:outline-none focus:border-[#1F4D3A]"
              />
            ) : typeof item === 'object' && item !== null ? (
              <ObjectEditor
                value={item as Record<string, unknown>}
                onChange={updated => {
                  const next = [...value];
                  next[idx] = updated;
                  onChange(next);
                }}
              />
            ) : (
              <span className="text-[12px] text-[#65736B]">{String(item)}</span>
            )}
          </div>
        ))}
        <button
          onClick={() => {
            const sample = value[0];
            if (typeof sample === 'string') onChange([...value, '']);
            else if (typeof sample === 'object' && sample !== null) {
              const blank = Object.fromEntries(Object.keys(sample).map(k => [k, typeof (sample as Record<string,unknown>)[k] === 'number' ? 0 : typeof (sample as Record<string,unknown>)[k] === 'boolean' ? false : '']));
              onChange([...value, blank]);
            } else onChange([...value, '']);
          }}
          className="text-[12.5px] text-[#1F4D3A] hover:text-[#163828] transition-colors flex items-center gap-1"
        >
          <Plus size={11} /> Add item
        </button>
      </div>
    );
  }

  if (typeof value === 'object' && value !== null) {
    return (
      <ObjectEditor
        value={value as Record<string, unknown>}
        onChange={onChange}
      />
    );
  }

  return (
    <input
      type="text"
      value={String(value ?? '')}
      onChange={e => onChange(e.target.value)}
      className="w-full h-8 px-2.5 border border-[#E5E0D4] rounded-lg text-[13px] text-[#0F1F18] bg-white focus:outline-none focus:border-[#1F4D3A]"
    />
  );
}

function ObjectEditor({ value, onChange }: {
  value: Record<string, unknown>; onChange: (v: unknown) => void;
}) {
  return (
    <div className="space-y-2">
      {Object.entries(value).map(([k, v]) => (
        <div key={k}>
          <div className="text-[12px] uppercase tracking-[0.12em] text-[#65736B] mb-1">{k}</div>
          <FieldEditor
            name={k}
            value={v}
            onChange={updated => onChange({ ...value, [k]: updated })}
          />
        </div>
      ))}
    </div>
  );
}

// ── Block row ─────────────────────────────────────────────────────────────────

function BlockRow({
  block, onUpdate, onDelete, index,
}: {
  block: CmsBlock;
  onUpdate: (content: Record<string, unknown>) => void;
  onDelete: () => void;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState<Record<string, unknown>>(
    block.content as unknown as Record<string, unknown>
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch(`/api/admin/content/${block.page_id}/blocks/${block.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error('Save failed');
      onUpdate(content);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setSaveError('Failed to save block — please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-[#E5E0D4] rounded-xl overflow-hidden bg-white">
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="text-[#C9C3B1] cursor-grab shrink-0">
          <GripVertical size={14} />
        </div>
        <div className="w-6 h-6 rounded-md bg-[#FAF6EE] border border-[#E5E0D4] grid place-items-center shrink-0">
          <span className=" text-[11.5px] text-[#65736B]">{index + 1}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-[13px] text-[#0F1F18]">
            {BLOCK_LABELS[block.type as BlockType] ?? block.type}
          </div>
          <div className=" text-[12px] text-[#65736B] truncate">
            {getContentSummary(block.content as unknown as Record<string, unknown>)}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setOpen(o => !o)}
            className="h-7 px-2.5 rounded-lg border border-[#E5E0D4] text-[12px] text-[#3A4A42] hover:bg-[#FAF6EE] transition-colors flex items-center gap-1"
          >
            {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            Edit
          </button>
          <button
            onClick={onDelete}
            className="h-10 w-10 rounded-lg border border-[#E5E0D4] grid place-items-center text-[#B8423C] hover:bg-red-50 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Editor panel */}
      {open && (
        <div className="border-t border-[#E5E0D4] px-4 py-4 bg-[#FAF6EE]">
          <div className="space-y-4">
            {Object.entries(content).map(([key, val]) => (
              <div key={key}>
                <div className="text-[12.5px] uppercase tracking-[0.12em] text-[#65736B] mb-1.5">{key}</div>
                <FieldEditor
                  name={key}
                  value={val}
                  onChange={updated => setContent(prev => ({ ...prev, [key]: updated }))}
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg bg-[#1F4D3A] text-white text-[12px] font-medium hover:bg-[#163828] transition-colors disabled:opacity-60"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              {saved ? 'Saved!' : 'Save block'}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="h-8 px-3 rounded-lg border border-[#E5E0D4] text-[12px] text-[#65736B] hover:bg-white transition-colors"
            >
              Cancel
            </button>
            {saveError && <span role="alert" className="text-[12px]" style={{ color: '#B8423C' }}>{saveError}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

function getContentSummary(content: Record<string, unknown>): string {
  const candidates = ['headline', 'title', 'heading', 'question', 'label', 'eyebrow'];
  for (const key of candidates) {
    if (typeof content[key] === 'string' && content[key]) {
      return String(content[key]).slice(0, 60);
    }
  }
  return Object.keys(content).join(', ');
}

// ── Main editor ───────────────────────────────────────────────────────────────

export function PageEditorClient({ page }: { page: CmsPageWithBlocks }) {
  const confirm = useConfirm();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [blocks, setBlocks] = useState<CmsBlock[]>(
    [...page.blocks].sort((a, b) => a.position - b.position) as CmsBlock[]
  );
  const [title, setTitle] = useState(page.title);
  const [status, setStatus] = useState(page.status);
  const [titleSaving, setTitleSaving] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [addingBlock, setAddingBlock] = useState(false);

  const saveTitle = async () => {
    if (title === page.title) return;
    setTitleSaving(true);
    await fetch(`/api/admin/content/${page.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    setTitleSaving(false);
  };

  const toggleStatus = async () => {
    const next = status === 'published' ? 'draft' : 'published';
    setStatusSaving(true);
    await fetch(`/api/admin/content/${page.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    setStatus(next);
    setStatusSaving(false);
  };

  const handleDeleteBlock = useCallback(async (blockId: string) => {
    if (!(await confirm({
      title: 'Delete this block?',
      body: 'This can’t be undone.',
      confirmLabel: 'Delete',
      danger: true,
    }))) return;
    await fetch(`/api/admin/content/${page.id}/blocks/${blockId}`, { method: 'DELETE' });
    setBlocks(prev => prev.filter(b => b.id !== blockId));
  }, [page.id, confirm]);

  const handleUpdateBlock = useCallback((blockId: string, content: Record<string, unknown>) => {
    setBlocks(prev => prev.map(b => b.id === blockId
      ? { ...b, content: content as unknown as CmsBlock['content'] }
      : b
    ) as CmsBlock[]);
  }, []);

  const handleAddBlock = async (type: BlockType) => {
    setAddingBlock(true);
    setShowAddBlock(false);
    const defaultContent = getDefaultContent(type);
    const position = blocks.length;
    const res = await fetch(`/api/admin/content/${page.id}/blocks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, content: defaultContent, position }),
    });
    if (res.ok) {
      const newBlock = await res.json();
      setBlocks(prev => [...prev, newBlock as CmsBlock]);
    }
    setAddingBlock(false);
  };

  const handleDelete = async () => {
    if (!(await confirm({
      title: 'Delete page?',
      body: `This deletes the page "${title}". This can’t be undone.`,
      confirmLabel: 'Delete',
      danger: true,
    }))) return;
    await fetch(`/api/admin/content/${page.id}`, { method: 'DELETE' });
    startTransition(() => router.push('/admin/content'));
  };

  return (
    <div className="min-h-screen bg-[#FAF6EE]">
      {/* Sticky toolbar */}
      <div className="sticky top-0 z-40 bg-white border-b border-[#E5E0D4]">
        <div className="flex items-center gap-3 px-5 py-3 max-w-[900px] mx-auto">
          <Link
            href="/admin/content"
            className="inline-flex items-center gap-1.5 text-[12px] text-[#65736B] hover:text-[#0F1F18] transition-colors shrink-0"
          >
            <ArrowLeft size={13} /> All pages
          </Link>
          <div className="h-4 w-px bg-[#E5E0D4]" />

          {/* Title */}
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={saveTitle}
            className="flex-1 font-display font-semibold text-[16px] text-[#0F1F18] bg-transparent border-b border-transparent hover:border-[#E5E0D4] focus:border-[#1F4D3A] outline-none transition-colors py-0.5 min-w-0"
          />

          {titleSaving && <Loader2 size={13} className="animate-spin text-[#65736B] shrink-0" />}

          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {/* Status badge */}
            <span className={` text-[12px] tracking-[0.14em] uppercase px-2 py-1 rounded-full ${
              status === 'published'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {status}
            </span>

            {/* Publish toggle */}
            <button
              onClick={toggleStatus}
              disabled={statusSaving}
              className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium transition-colors disabled:opacity-60 ${
                status === 'published'
                  ? 'border border-[#E5E0D4] text-[#3A4A42] hover:bg-[#FAF6EE]'
                  : 'bg-[#1F4D3A] text-white hover:bg-[#163828]'
              }`}
            >
              {statusSaving ? <Loader2 size={12} className="animate-spin" /> : status === 'published' ? <FileText size={12} /> : <Globe size={12} />}
              {status === 'published' ? 'Unpublish' : 'Publish'}
            </button>

            {/* Preview */}
            <Link
              href={`/admin/content/${page.id}/preview`}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#E5E0D4] text-[12px] text-[#3A4A42] hover:bg-[#FAF6EE] transition-colors"
            >
              <Eye size={12} /> Preview
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[900px] mx-auto px-5 py-8">

        {/* Page meta */}
        <div className="mb-6 p-4 bg-white border border-[#E5E0D4] rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className=" text-[12px] uppercase tracking-[0.14em] text-[#65736B] mb-1">Slug</div>
              <div className=" text-[13px] text-[#3A4A42]">/{page.slug}</div>
            </div>
            <div>
              <div className=" text-[12px] uppercase tracking-[0.14em] text-[#65736B] mb-1">Blocks</div>
              <div className=" text-[13px] text-[#3A4A42]">{blocks.length}</div>
            </div>
            <button
              onClick={handleDelete}
              className="text-[12px] text-[#B8423C] hover:text-[#8B2E2A] transition-colors "
            >
              Delete page
            </button>
          </div>
        </div>

        {/* Block list */}
        <div className="space-y-3">
          {blocks.length === 0 && (
            <div className="py-16 text-center border-2 border-dashed border-[#E5E0D4] rounded-2xl">
              <p className="text-[14px] text-[#65736B]">No blocks yet. Add one below.</p>
            </div>
          )}
          {blocks.map((block, index) => (
            <BlockRow
              key={block.id}
              block={block}
              index={index}

              onUpdate={(content) => handleUpdateBlock(block.id, content)}
              onDelete={() => handleDeleteBlock(block.id)}
            />
          ))}
        </div>

        {/* Add block */}
        <div className="mt-4 relative">
          <button
            onClick={() => setShowAddBlock(o => !o)}
            disabled={addingBlock}
            className="w-full h-10 rounded-xl border-2 border-dashed border-[#C9C3B1] text-[13px] text-[#65736B] hover:border-[#1F4D3A] hover:text-[#1F4D3A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {addingBlock ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Add block
          </button>

          {showAddBlock && (
            <div className="absolute top-12 left-0 right-0 z-50 bg-white border border-[#E5E0D4] rounded-2xl shadow-lift p-3 grid grid-cols-3 gap-1.5">
              {BLOCK_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => handleAddBlock(type)}
                  className="text-left px-3 py-2 rounded-lg hover:bg-[#FAF6EE] transition-colors"
                >
                  <div className="text-[12px] font-medium text-[#0F1F18]">{BLOCK_LABELS[type]}</div>
                  <div className=" text-[12px] text-[#65736B]">{type}</div>
                </button>
              ))}
              <button
                onClick={() => setShowAddBlock(false)}
                className="col-span-3 mt-1 text-[12.5px] text-[#65736B] hover:text-[#0F1F18] transition-colors py-1"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Default content per block type ────────────────────────────────────────────

function getDefaultContent(type: BlockType): Record<string, unknown> {
  const defaults: Partial<Record<BlockType, Record<string, unknown>>> = {
    hero: { eyebrow: '', headline: 'Your headline here', subheadline: '', buttons: [], layout: 'split' },
    sectionHeader: { eyebrow: '', headline: 'Section heading', subtext: '', align: 'center' },
    richText: { html: '<p>Your content here.</p>' },
    featuresGrid: { header: { headline: 'Features' }, cards: [], background: 'light', columns: 3 },
    stepsGrid: { header: { headline: 'How it works' }, steps: [], layout: 'horizontal' },
    faqAccordion: { header: { headline: 'FAQ' }, items: [] },
    cta: { headline: 'Ready to get started?', subtext: '', buttons: [], background: 'default' },
    logoStrip: { eyebrow: 'Used by', logos: [] },
    pricingCards: { header: { headline: 'Pricing' }, plans: [] },
    comparisonTable: { header: { headline: 'Compare plans' }, groups: [] },
    testimonial: { quote: '', authorName: '', authorRole: '' },
    teamGrid: { header: { headline: 'Our team' }, members: [] },
    pressSection: { label: 'As seen in', mentions: [] },
    useCasesGrid: { header: { headline: 'Use cases' }, cases: [], columns: 2 },
    tabInterface: { tabs: [] },
    contactChannels: { header: { headline: 'Get in touch' }, channels: [], reasons: [] },
    categoryGrid: { header: { headline: 'Categories' }, categories: [] },
    programCards: { header: { headline: 'Programs' }, programs: [] },
    proseSections: { eyebrow: '', headline: 'Untitled page', sections: [] },
    statsStrip: { stats: [] },
    videoDemo: { label: '', headline: 'See it in action', placeholder: 'Demo video' },
  };
  return defaults[type] ?? { content: '' };
}
