'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Ticket, CalendarClock, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { EntitlementIcon, entitlementTypeLabel } from './EntitlementIcon';
import { EntitlementSlideOver } from './EntitlementSlideOver';
import type { Entitlement, EntitlementInput, TicketTypeLite } from './entitlement-model';

interface Props {
  initialEntitlements: Entitlement[];
  ticketTypes: TicketTypeLite[];
  createEntitlement: (input: EntitlementInput) => Promise<{ ok?: boolean; error?: string }>;
  updateEntitlement: (id: string, input: EntitlementInput) => Promise<{ ok?: boolean; error?: string }>;
  deleteEntitlement: (id: string) => Promise<{ ok?: boolean; error?: string }>;
}

const LIMIT_LABEL: Record<Entitlement['redemption_limit'], string> = {
  once: 'Once', once_per_day: 'Once per day', unlimited: 'Unlimited',
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function validityLabel(from: string | null, until: string | null): string | null {
  if (from && until) return `${fmtDate(from)} → ${fmtDate(until)}`;
  if (from) return `From ${fmtDate(from)}`;
  if (until) return `Until ${fmtDate(until)}`;
  return null;
}

export function EntitlementsClient({
  initialEntitlements, ticketTypes,
  createEntitlement, updateEntitlement, deleteEntitlement,
}: Props) {
  const router = useRouter();
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<Entitlement | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Entitlement | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const ticketName = (id: string) => ticketTypes.find((t) => t.id === id)?.name ?? 'Ticket';

  const openNew = () => { setEditing(null); setPanelOpen(true); };
  const openEdit = (e: Entitlement) => { setEditing(e); setPanelOpen(true); };

  async function save(input: EntitlementInput): Promise<{ ok?: boolean; error?: string }> {
    const res = editing ? await updateEntitlement(editing.id, input) : await createEntitlement(input);
    if (res.ok) router.refresh();
    return res;
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleting(true); setDeleteError('');
    const res = await deleteEntitlement(confirmDelete.id);
    setDeleting(false);
    if (res.error) { setDeleteError(res.error); return; }
    setConfirmDelete(null);
    router.refresh();
  }

  const isEmpty = initialEntitlements.length === 0;

  return (
    <div>
      {!isEmpty && (
        <div className="flex justify-end mb-3">
          <button onClick={openNew}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-semibold text-white transition hover:opacity-90"
            style={{ background: '#1F4D3A' }}>
            <Plus size={14} strokeWidth={2.5} /> Add entitlement
          </button>
        </div>
      )}

      {isEmpty ? (
        <div className="rounded-2xl flex flex-col items-center justify-center py-16 text-center"
          style={{ background: 'white', border: '2px dashed #E5E0D4' }}>
          <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(31,77,58,0.08)' }}>
            <Sparkles size={20} strokeWidth={1.8} style={{ color: '#1F4D3A' }} />
          </div>
          <div className="font-display font-semibold text-[17px] mb-1" style={{ color: '#0F1F18' }}>
            No entitlements yet
          </div>
          <div className="text-[14px] mb-6 max-w-[380px]" style={{ color: '#6B7A72' }}>
            Entitlements are the things attendees can redeem — entry, meals, sessions, merch, transport and more. Each one scans on its own, with its own window and limit.
          </div>
          <button onClick={openNew}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-lg text-white text-[14px] font-semibold transition hover:opacity-90"
            style={{ background: '#1F4D3A' }}>
            <Plus size={14} strokeWidth={2.5} /> Add entitlement
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {initialEntitlements.map((e) => {
            const validity = validityLabel(e.valid_from, e.valid_until);
            return (
              <div key={e.id} className="rounded-xl transition"
                style={{ background: 'white', border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
                <div className="flex items-start gap-3.5 px-4 py-3.5">
                  <span className="w-10 h-10 rounded-xl grid place-items-center shrink-0" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                    <EntitlementIcon type={e.type} size={19} strokeWidth={1.9} />
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-[14.5px]" style={{ color: '#0F1F18' }}>{e.name}</span>
                      <span className="text-[10.5px] font-medium px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(232,197,126,0.16)', color: '#C9A45E' }}>
                        {entitlementTypeLabel(e.type)}
                      </span>
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center gap-x-4 gap-y-1 flex-wrap mt-1.5 text-[12px]" style={{ color: '#6B7A72' }}>
                      <span className="inline-flex items-center gap-1">
                        <RefreshCw size={11} strokeWidth={2} /> {LIMIT_LABEL[e.redemption_limit]}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        Stock: {e.quantity === null ? <span title="Unlimited">∞</span> : e.quantity}
                      </span>
                      {validity && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarClock size={11} strokeWidth={2} /> {validity}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1" style={{ color: e.redemptionCount > 0 ? '#2D7A4F' : '#9BA8A1' }}>
                        {e.redemptionCount} redeemed
                      </span>
                    </div>

                    {/* Ticket-type pills */}
                    <div className="flex items-center gap-1.5 flex-wrap mt-2">
                      {e.ticketTypeIds.length === 0 ? (
                        <span className="text-[11.5px] px-2 py-0.5 rounded-full"
                          style={{ background: '#FAF6EE', color: '#9BA8A1', border: '1px solid #E5E0D4' }}>
                          Not attached to any ticket type
                        </span>
                      ) : (
                        e.ticketTypeIds.map((id) => (
                          <span key={id} className="inline-flex items-center gap-1 text-[11.5px] px-2 py-0.5 rounded-full"
                            style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                            <Ticket size={10} strokeWidth={2} /> {ticketName(id)}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEdit(e)} title="Edit" className="h-8 w-8 rounded-lg flex items-center justify-center transition" style={{ color: '#6B7A72' }}
                      onMouseEnter={(ev) => (ev.currentTarget.style.background = '#F5F5F4')} onMouseLeave={(ev) => (ev.currentTarget.style.background = 'transparent')}>
                      <Pencil size={14} strokeWidth={2} />
                    </button>
                    <button onClick={() => { setConfirmDelete(e); setDeleteError(''); }} title="Delete" className="h-8 w-8 rounded-lg flex items-center justify-center transition" style={{ color: '#6B7A72' }}
                      onMouseEnter={(ev) => { ev.currentTarget.style.background = 'rgba(184,66,60,0.08)'; ev.currentTarget.style.color = '#B8423C'; }}
                      onMouseLeave={(ev) => { ev.currentTarget.style.background = 'transparent'; ev.currentTarget.style.color = '#6B7A72'; }}>
                      <Trash2 size={14} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <EntitlementSlideOver
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        ticketTypes={ticketTypes}
        initial={editing}
        save={save}
      />

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setConfirmDelete(null)} />
          <div className="relative w-full max-w-[400px] rounded-2xl p-6" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
            <h3 className="font-display font-semibold text-[18px] mb-2" style={{ color: '#0F1F18' }}>
              Delete &ldquo;{confirmDelete.name}&rdquo;?
            </h3>
            {confirmDelete.redemptionCount > 0 ? (
              <p className="text-[14px] mb-5" style={{ color: '#C97A2D' }}>
                This entitlement has <strong>{confirmDelete.redemptionCount}</strong> recorded redemption{confirmDelete.redemptionCount !== 1 ? 's' : ''}. Deleting it removes the definition and its history from scanning.
              </p>
            ) : (
              <p className="text-[14px] mb-5" style={{ color: '#6B7A72' }}>
                It will be removed from every ticket type. This cannot be undone.
              </p>
            )}
            {deleteError && (
              <p className="text-[13px] mb-3 flex items-center gap-1" style={{ color: '#B8423C' }}>
                <AlertCircle size={13} strokeWidth={2} />{deleteError}
              </p>
            )}
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 h-10 rounded-xl text-[14px] font-medium border transition" style={{ borderColor: '#E5E0D4', color: '#3A4A42' }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 h-10 rounded-xl text-white text-[14px] font-semibold transition hover:opacity-90 disabled:opacity-60" style={{ background: '#B8423C' }}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
