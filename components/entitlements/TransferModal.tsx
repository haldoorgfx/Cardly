'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, ArrowLeftRight, Check, Ban, UserX, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import type { AttendeeEntitlement, TransferTarget, AttendeeActions } from './attendee-model';
import { initials } from './format';

interface Props {
  ent: AttendeeEntitlement;
  fromName: string;
  searchTargets: AttendeeActions['searchTargets'];
  lookupByEmail: AttendeeActions['lookupByEmail'];
  transfer: AttendeeActions['transfer'];
  onClose: () => void;
  onDone: () => void;
}

function notifiedCopy(toName: string, notified: number): string {
  if (notified >= 2) return `Transferred to ${toName}. Both attendees notified.`;
  if (notified === 1) return `Transferred to ${toName}. One attendee notified.`;
  return `Transferred to ${toName}. No in-app notifications sent — neither has a linked Eventera account.`;
}

/**
 * G04 — transfer a (held, not-yet-redeemed) entitlement to another attendee of
 * the SAME event. Search is by name or email over registrations. A person who is
 * NOT registered cannot be a transfer target — transfer_entitlement needs a
 * registration id on both sides — so the "invite by email" path is honestly
 * disabled with a one-line reason rather than faked. If the RPC refuses because
 * the source was already redeemed, we surface that specific refusal.
 */
export function TransferModal({ ent, fromName, searchTargets, lookupByEmail, transfer, onClose, onDone }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TransferTarget[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<TransferTarget | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [blocked, setBlocked] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  // Invite-by-email (honest disable): lets you check a non-attendee email.
  const [email, setEmail] = useState('');
  const [emailChecking, setEmailChecking] = useState(false);
  const [notRegistered, setNotRegistered] = useState(false);

  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (selected) return;
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setSearching(true);
      const r = await searchTargets(query);
      setResults(r);
      setSearching(false);
    }, 250);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [query, selected, searchTargets]);

  async function checkEmail() {
    const e = email.trim();
    if (!e) return;
    setEmailChecking(true);
    setNotRegistered(false);
    const res = await lookupByEmail(e);
    setEmailChecking(false);
    if (res.found) { setSelected(res.target); setError(''); setBlocked(false); }
    else setNotRegistered(true);
  }

  async function doTransfer() {
    if (!selected) return;
    setPending(true);
    setError('');
    setBlocked(false);
    const res = await transfer(ent.id, selected.registrationId);
    setPending(false);
    if ('blocked' in res) { setBlocked(true); return; }
    if ('error' in res) { setError(res.error); return; }
    setSuccess(notifiedCopy(res.toName, res.notified));
  }

  if (success) {
    return (
      <Modal open onClose={onDone} title="Transfer complete" subtitle={ent.name} maxWidth={440}
        footer={<button type="button" onClick={onDone}
          className="rounded-lg px-4 py-2 text-[13px] font-medium text-white transition hover:bg-[#163828]" style={{ background: '#1F4D3A' }}>Done</button>}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: '#E8EFEB', color: '#2D7A4F' }}>
            <CheckCircle2 size={20} strokeWidth={1.9} />
          </div>
          <p className="text-[13.5px]" style={{ color: '#3A4A42' }}>{success}</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Transfer entitlement"
      subtitle={`${ent.name} · from ${fromName}`}
      maxWidth={480}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={pending}
            className="rounded-lg px-4 py-2 text-[13px] font-medium border transition disabled:opacity-60"
            style={{ borderColor: '#E5E0D4', color: '#65736B', background: '#FFFFFF' }}>
            Cancel
          </button>
          <button type="button" onClick={doTransfer} disabled={!selected || pending}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            style={{ background: '#1F4D3A' }}>
            {pending ? 'Transferring…' : <><ArrowLeftRight size={14} strokeWidth={2} /> Transfer</>}
          </button>
        </>
      }
    >
      {blocked && (
        <div className="mb-4 flex items-start gap-2.5 px-3.5 py-3 rounded-xl"
          style={{ background: 'rgba(184,66,60,0.08)', border: '1px solid rgba(184,66,60,0.24)' }}>
          <Ban size={15} strokeWidth={2} className="mt-0.5 shrink-0" style={{ color: '#B8423C' }} />
          <p className="text-[12.5px]" style={{ color: '#B8423C' }}>
            This entitlement has already been redeemed, so it can&apos;t be transferred. Un-redeem it first if this was a mistake.
          </p>
        </div>
      )}

      {selected ? (
        <div className="rounded-xl p-3.5" style={{ background: '#E8EFEB', border: '1px solid rgba(31,77,58,0.24)' }}>
          <p className="text-[11px] uppercase tracking-[0.1em] mb-2" style={{ color: '#1F4D3A' }}>Transfer to</p>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white text-[12px] font-semibold" style={{ background: '#1F4D3A' }}>
              {initials(selected.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium truncate" style={{ color: '#0F1F18' }}>{selected.name}</p>
              <p className="text-[12px] truncate" style={{ color: '#65736B' }}>{selected.email ?? selected.ticketName ?? '—'}</p>
            </div>
            <button type="button" onClick={() => { setSelected(null); setError(''); setBlocked(false); }}
              className="text-[12.5px] font-medium" style={{ color: '#1F4D3A' }}>Change</button>
          </div>
        </div>
      ) : (
        <>
          <div className="relative mb-3">
            <Search size={15} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#65736B' }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search attendees by name or email"
              className="w-full h-10 pl-9 pr-3 rounded-lg text-[14px] outline-none border"
              style={{ borderColor: '#E5E0D4', background: '#FFFFFF', color: '#0F1F18' }}
            />
          </div>

          <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
            {searching ? (
              <p className="text-[13px] px-1 py-2" style={{ color: '#65736B' }}>Searching…</p>
            ) : results.length === 0 ? (
              <p className="text-[13px] px-1 py-2" style={{ color: '#65736B' }}>No matching attendees.</p>
            ) : (
              results.map((t) => (
                <button key={t.registrationId} type="button" onClick={() => setSelected(t)}
                  className="w-full text-left flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-[#FAF6EE] border"
                  style={{ borderColor: '#E5E0D4', background: '#FFFFFF' }}>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[12px] font-semibold" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                    {initials(t.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium truncate" style={{ color: '#0F1F18' }}>{t.name}</p>
                    <p className="text-[12px] truncate" style={{ color: '#65736B' }}>{t.email ?? t.ticketName ?? '—'}</p>
                  </div>
                  <Check size={15} strokeWidth={2} style={{ color: '#65736B' }} />
                </button>
              ))
            )}
          </div>

          {/* Invite-by-email — honestly disabled for non-attendees. */}
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid #E5E0D4' }}>
            <p className="text-[11px] uppercase tracking-[0.1em] mb-2" style={{ color: '#65736B' }}>Not in the list?</p>
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setNotRegistered(false); }}
                placeholder="their@email.com"
                className="flex-1 h-9 px-3 rounded-lg text-[13px] outline-none border"
                style={{ borderColor: '#E5E0D4', background: '#FFFFFF', color: '#0F1F18' }}
              />
              <button type="button" onClick={checkEmail} disabled={emailChecking || !email.trim()}
                className="rounded-lg px-3 py-2 text-[13px] font-medium border transition disabled:opacity-50"
                style={{ borderColor: '#E5E0D4', color: '#3A4A42', background: '#FFFFFF' }}>
                {emailChecking ? 'Checking…' : 'Find'}
              </button>
            </div>
            {notRegistered && (
              <p className="mt-2 flex items-center gap-1.5 text-[12.5px]" style={{ color: '#C97A2D' }}>
                <UserX size={13} strokeWidth={2} /> They must be registered for this event first.
              </p>
            )}
          </div>
        </>
      )}

      {error && (
        <div className="mt-3 px-3.5 py-2.5 rounded-xl text-[12.5px]"
          style={{ background: 'rgba(184,66,60,0.08)', color: '#B8423C', border: '1px solid rgba(184,66,60,0.24)' }}>
          {error}
        </div>
      )}
    </Modal>
  );
}
