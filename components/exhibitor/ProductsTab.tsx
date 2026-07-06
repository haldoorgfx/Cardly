'use client';

import { useState, useTransition } from 'react';

interface Product {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_featured: boolean;
  position: number;
  created_at: string;
}

interface Props {
  products: Product[];
  token: string;
}

/* ── Add / edit modal ──────────────────────────────────────────────────── */
function ProductModal({
  product, token, onClose, onSaved, onDeleted,
}: {
  product: Product | null;
  token: string;
  onClose: () => void;
  onSaved: (p: Product) => void;
  onDeleted: (id: string) => void;
}) {
  const [name, setName]               = useState(product?.name ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [imageUrl, setImageUrl]       = useState(product?.image_url ?? '');
  const [isFeatured, setIsFeatured]   = useState(product?.is_featured ?? false);
  const [error, setError]             = useState<string | null>(null);
  const [isPending, startTransition]  = useTransition();
  const [deleting, setDeleting]       = useState(false);

  function handleSave() {
    if (!name.trim()) { setError('Name is required'); return; }
    setError(null);
    startTransition(async () => {
      const res = await fetch('/api/exhibitor/products', {
        method: product ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          product_id: product?.id,
          name: name.trim(),
          description: description.trim() || null,
          image_url: imageUrl.trim() || null,
          is_featured: isFeatured,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? 'Could not save product'); return; }
      if (data.product) onSaved(data.product);
      onClose();
    });
  }

  function handleDelete() {
    if (!product) return;
    if (!confirm('Delete this product? This cannot be undone.')) return;
    setDeleting(true);
    startTransition(async () => {
      await fetch(`/api/exhibitor/products?id=${product.id}&token=${token}`, { method: 'DELETE' });
      onDeleted(product.id);
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-[420px]" style={{ border: '1px solid #E5E0D4', boxShadow: '0 8px 40px rgba(15,31,24,0.18)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #E5E0D4' }}>
          <div className="font-display text-[15px] font-semibold" style={{ color: '#0F1F18' }}>
            {product ? 'Edit product' : 'Add product'}
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg grid place-items-center hover:bg-[#F5F3EE]" style={{ color: '#6B7A72' }}>
            <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-3.5">
          <div>
            <div className=" text-[10px] tracking-[0.12em] uppercase mb-2" style={{ color: '#6B7A72' }}>Name</div>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Payouts API"
              className="w-full rounded-xl px-3 py-2.5 text-[13.5px] outline-none"
              style={{ border: '1px solid #E5E0D4', background: '#FAF6EE', color: '#0F1F18' }}
              onFocus={e => (e.target.style.borderColor = 'rgba(31,77,58,0.4)')}
              onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
            />
          </div>
          <div>
            <div className=" text-[10px] tracking-[0.12em] uppercase mb-2" style={{ color: '#6B7A72' }}>Description</div>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Developer platform · live demo"
              className="w-full rounded-xl px-3 py-2.5 text-[13.5px] outline-none resize-none"
              style={{ border: '1px solid #E5E0D4', background: '#FAF6EE', color: '#0F1F18' }}
              onFocus={e => (e.target.style.borderColor = 'rgba(31,77,58,0.4)')}
              onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
            />
          </div>
          <div>
            <div className=" text-[10px] tracking-[0.12em] uppercase mb-2" style={{ color: '#6B7A72' }}>Image URL <span style={{ textTransform: 'none', letterSpacing: 0 }}>(optional)</span></div>
            <input
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              placeholder="https://…"
              className="w-full rounded-xl px-3 py-2.5 text-[13.5px] outline-none"
              style={{ border: '1px solid #E5E0D4', background: '#FAF6EE', color: '#0F1F18' }}
              onFocus={e => (e.target.style.borderColor = 'rgba(31,77,58,0.4)')}
              onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
            />
          </div>
          <button
            type="button"
            onClick={() => setIsFeatured(v => !v)}
            className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl border"
            style={{ borderColor: '#E5E0D4', background: '#FFFFFF' }}
          >
            <div className="text-left">
              <div className="text-[13px] font-medium" style={{ color: '#0F1F18' }}>Featured</div>
              <div className="text-[11.5px] mt-0.5" style={{ color: '#6B7A72' }}>Highlight this in your directory listing</div>
            </div>
            <span
              className="relative inline-flex h-6 w-10 rounded-full transition-colors shrink-0"
              style={{ background: isFeatured ? '#1F4D3A' : '#E5E0D4' }}
            >
              <span
                className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform"
                style={{ left: 2, transform: isFeatured ? 'translateX(16px)' : 'translateX(0)' }}
              />
            </span>
          </button>

          {error && <div className="text-[12.5px]" style={{ color: '#B8423C' }}>{error}</div>}
        </div>

        <div className="px-5 pb-5 flex gap-2">
          {product && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2.5 rounded-xl text-[13.5px] font-medium border transition"
              style={{ borderColor: 'rgba(184,66,60,0.3)', color: '#B8423C', background: 'rgba(184,66,60,0.05)' }}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-[13.5px] font-medium border"
            style={{ borderColor: '#E5E0D4', color: '#6B7A72' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex-1 py-2.5 rounded-xl text-[13.5px] font-medium text-white transition"
            style={{ background: '#1F4D3A', opacity: isPending ? 0.6 : 1 }}
          >
            {isPending ? 'Saving…' : product ? 'Save changes' : 'Add product'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────────────── */
export function ProductsTab({ products: initial, token }: Props) {
  const [products, setProducts] = useState(initial);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  function openAdd()  { setEditing(null);  setModalOpen(true); }
  function openEdit(p: Product) { setEditing(p); setModalOpen(true); }

  function handleSaved(p: Product) {
    setProducts(prev => {
      const exists = prev.some(x => x.id === p.id);
      return exists ? prev.map(x => x.id === p.id ? p : x) : [...prev, p];
    });
  }
  function handleDeleted(id: string) {
    setProducts(prev => prev.filter(p => p.id !== id));
  }

  async function toggleFeatured(p: Product) {
    const next = !p.is_featured;
    setProducts(prev => prev.map(x => x.id === p.id ? { ...x, is_featured: next } : x));
    const res = await fetch('/api/exhibitor/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, product_id: p.id, is_featured: next }),
    });
    if (!res.ok) {
      // revert on failure
      setProducts(prev => prev.map(x => x.id === p.id ? { ...x, is_featured: p.is_featured } : x));
    }
  }

  return (
    <div className="bg-white rounded-2xl border" style={{ borderColor: '#E5E0D4' }}>
      {modalOpen && (
        <ProductModal
          product={editing}
          token={token}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(229,224,212,0.7)' }}>
        <div className="font-display text-[14px] font-semibold tracking-tight" style={{ color: '#0F1F18' }}>
          Showcase · {products.length}
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13.5px] font-medium text-white transition-colors"
          style={{ background: '#1F4D3A' }}
        >
          <svg width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
          </svg>
          Add product
        </button>
      </div>

      {/* List */}
      {products.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <div className="mx-auto mb-3 grid place-items-center rounded-2xl" style={{ width: 56, height: 56, background: 'rgba(232,197,126,0.18)' }}>
            <svg width={26} height={26} fill="none" stroke="#C9A45E" strokeWidth={1.6} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75h4.5v4.5h-4.5zM3.75 15.75h4.5v4.5h-4.5zM15.75 3.75h4.5v4.5h-4.5zM15.75 15.75h4.5v4.5h-4.5z" />
            </svg>
          </div>
          <div className="font-display text-[15px] font-semibold" style={{ color: '#0F1F18' }}>No products yet</div>
          <p className="text-[13px] mt-1.5 max-w-[320px] mx-auto" style={{ color: '#6B7A72' }}>
            Add the products you&apos;re showcasing at your booth — they sync to your directory listing.
          </p>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: 'rgba(229,224,212,0.6)' }}>
          {products.map((p) => (
            <div key={p.id} className="flex items-center gap-3.5 px-5 py-3.5">
              <button
                onClick={() => openEdit(p)}
                className="flex items-center gap-3.5 flex-1 min-w-0 text-left"
              >
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image_url} alt="" className="rounded-xl object-cover shrink-0" style={{ width: 48, height: 48, border: '1px solid #E5E0D4' }} />
                ) : (
                  <span className="rounded-xl grid place-items-center shrink-0" style={{ width: 48, height: 48, background: '#E8EFEB' }}>
                    <svg width={20} height={20} fill="none" stroke="#1F4D3A" strokeWidth={1.6} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75h4.5v4.5h-4.5zM3.75 15.75h4.5v4.5h-4.5zM15.75 3.75h4.5v4.5h-4.5zM15.75 15.75h4.5v4.5h-4.5z" />
                    </svg>
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-medium truncate" style={{ color: '#0F1F18' }}>{p.name}</div>
                  {p.description && (
                    <div className="text-[11.5px] truncate mt-0.5" style={{ color: '#6B7A72' }}>{p.description}</div>
                  )}
                </div>
              </button>
              <button
                onClick={() => toggleFeatured(p)}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors shrink-0"
                style={p.is_featured
                  ? { background: 'rgba(232,197,126,0.2)', color: '#C9A45E', borderColor: 'rgba(232,197,126,0.4)' }
                  : { background: '#FFFFFF', color: '#6B7A72', borderColor: '#E5E0D4' }}
              >
                <svg width={11} height={11} fill={p.is_featured ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.5l2.37 4.8 5.3.77-3.83 3.74.9 5.28L11.48 15.6l-4.74 2.49.9-5.28L3.8 9.07l5.3-.77z" />
                </svg>
                {p.is_featured ? 'Featured' : 'Feature'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Sync note */}
      <div className="mx-5 mb-5 mt-4 flex items-start gap-2.5 px-3.5 py-3 rounded-xl" style={{ background: '#FAF6EE', border: '1px solid #E5E0D4' }}>
        <svg width={16} height={16} fill="none" stroke="#6B7A72" strokeWidth={1.6} viewBox="0 0 24 24" className="shrink-0 mt-0.5">
          <circle cx="12" cy="12" r="9" /><path strokeLinecap="round" d="M12 8v5M12 16v.01" />
        </svg>
        <div className="text-[12px] leading-relaxed" style={{ color: '#3A4A42' }}>
          Featured products and rich product pages appear on your public booth directory listing.
        </div>
      </div>
    </div>
  );
}
