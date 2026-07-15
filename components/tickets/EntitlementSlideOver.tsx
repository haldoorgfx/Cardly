'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, AlertCircle } from 'lucide-react';
import { ENTITLEMENT_TYPES, EntitlementIcon } from './EntitlementIcon';
import {
  REDEMPTION_LIMITS,
  entitlementFormSchema,
  toLocalInput,
  type Entitlement,
  type EntitlementInput,
  type EntitlementFormValues,
  type TicketTypeLite,
} from './entitlement-model';

const inputStyle: React.CSSProperties = {
  background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#0F1F18',
};

interface Props {
  open: boolean;
  onClose: () => void;
  ticketTypes: TicketTypeLite[];
  initial: Entitlement | null;
  /** New entitlements default their validity window to the event's own
   *  start/end (a pass is valid for the whole event unless narrowed) instead
   *  of forcing the organizer to re-enter dates they already set for the
   *  event itself. Editing an existing entitlement always uses ITS saved
   *  values, even if that's blank — an explicit choice, not re-defaulted. */
  eventStartsAt: string | null;
  eventEndsAt: string | null;
  save: (values: EntitlementInput) => Promise<{ ok?: boolean; error?: string }>;
}

export function EntitlementSlideOver({ open, onClose, ticketTypes, initial, eventStartsAt, eventEndsAt, save }: Props) {
  const {
    register, handleSubmit, reset, watch, setValue,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<EntitlementFormValues>({
    resolver: zodResolver(entitlementFormSchema),
    defaultValues: {
      name: '', type: 'entry', quantity: '',
      valid_from: '', valid_until: '', redemption_limit: 'once', ticketTypeIds: [],
    },
  });

  // Re-seed the form whenever the panel opens (new vs edit). A brand-new
  // entitlement defaults its window to the event's own start/end — most
  // entitlements (entry, meals, sessions) are meant to be valid for the
  // whole event, so this saves re-entering dates already set at event
  // creation. Editing an existing entitlement always uses ITS saved values.
  useEffect(() => {
    if (!open) return;
    reset({
      name: initial?.name ?? '',
      type: initial?.type ?? 'entry',
      quantity: initial?.quantity != null ? String(initial.quantity) : '',
      valid_from: toLocalInput(initial ? initial.valid_from : eventStartsAt),
      valid_until: toLocalInput(initial ? initial.valid_until : eventEndsAt),
      redemption_limit: initial?.redemption_limit ?? 'once',
      ticketTypeIds: initial?.ticketTypeIds ?? [],
    });
  }, [open, initial, eventStartsAt, eventEndsAt, reset]);

  const type = watch('type');
  const redemptionLimit = watch('redemption_limit');
  const selectedTicketTypes = watch('ticketTypeIds');

  async function onSubmit(v: EntitlementFormValues) {
    const res = await save({
      name: v.name.trim(),
      type: v.type,
      quantity: v.quantity === '' ? null : parseInt(v.quantity, 10),
      valid_from: v.valid_from ? new Date(v.valid_from).toISOString() : null,
      valid_until: v.valid_until ? new Date(v.valid_until).toISOString() : null,
      redemption_limit: v.redemption_limit,
      ticketTypeIds: v.ticketTypeIds,
    });
    if (res.error) { setError('root', { message: res.error }); return; }
    onClose();
  }

  function toggleTicket(id: string) {
    const next = selectedTicketTypes.includes(id)
      ? selectedTicketTypes.filter((x) => x !== id)
      : [...selectedTicketTypes, id];
    setValue('ticketTypeIds', next, { shouldDirty: true });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes modalIn{from{opacity:0;transform:scale(0.97) translateY(6px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
      <div className="absolute inset-0 bg-black/40" style={{ animation: 'fadeIn 0.15s ease-out' }} onClick={onClose} />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="relative w-full max-w-[460px] max-h-[90vh] flex flex-col rounded-2xl"
        style={{ background: 'white', border: '1px solid #E5E0D4', boxShadow: '0 8px 40px rgba(15,31,24,0.18)', animation: 'modalIn 0.18s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid #E5E0D4' }}>
          <h3 className="font-display font-semibold text-[16px]" style={{ color: '#0F1F18' }}>
            {initial ? 'Edit entitlement' : 'New entitlement'}
          </h3>
          <button type="button" onClick={onClose} aria-label="Close" className="h-10 w-10 rounded-lg flex items-center justify-center transition hover:bg-[#F5F5F4]" style={{ color: '#65736B' }}>
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <Field label="Name" error={errors.name?.message}>
            <input
              {...register('name')} autoFocus aria-invalid={!!errors.name} placeholder="e.g. Lunch, Day 1"
              className="w-full h-10 px-3 rounded-lg text-[14px] outline-none transition" style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = '#E8C57E')}
              onBlur={(e) => (e.target.style.borderColor = '#E5E0D4')}
            />
          </Field>

          <Field label="Type">
            <div className="grid grid-cols-4 gap-2">
              {ENTITLEMENT_TYPES.map((t) => {
                const on = type === t.type;
                return (
                  <button
                    key={t.type} type="button" onClick={() => setValue('type', t.type, { shouldDirty: true })}
                    className="flex flex-col items-center gap-1.5 py-2.5 rounded-lg text-[11px] font-medium transition"
                    style={{
                      background: on ? '#E8EFEB' : 'white',
                      color: on ? '#1F4D3A' : '#65736B',
                      border: `1px solid ${on ? 'rgba(31,77,58,0.35)' : '#E5E0D4'}`,
                    }}
                  >
                    <EntitlementIcon type={t.type} size={18} strokeWidth={on ? 2 : 1.8} />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Quantity (stock)" hint="Leave blank for unlimited stock." error={errors.quantity?.message}>
            <div className="relative">
              <input
                {...register('quantity')} inputMode="numeric" aria-invalid={!!errors.quantity} placeholder="Unlimited"
                className="w-full h-10 px-3 pr-9 rounded-lg text-[14px] outline-none transition" style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#E8C57E')}
                onBlur={(e) => (e.target.style.borderColor = '#E5E0D4')}
              />
              {watch('quantity') === '' && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[16px] leading-none" style={{ color: '#65736B' }} aria-hidden>∞</span>
              )}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Valid from" hint={eventStartsAt && !initial ? 'Defaults to event start' : 'Optional'}>
              <input {...register('valid_from')} type="datetime-local"
                className="w-full h-10 px-3 rounded-lg text-[13px] outline-none transition" style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#E8C57E')} onBlur={(e) => (e.target.style.borderColor = '#E5E0D4')} />
            </Field>
            <Field label="Valid until" hint={eventEndsAt && !initial ? 'Defaults to event end' : 'Optional'} error={errors.valid_until?.message}>
              <input {...register('valid_until')} type="datetime-local" aria-invalid={!!errors.valid_until}
                className="w-full h-10 px-3 rounded-lg text-[13px] outline-none transition" style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#E8C57E')} onBlur={(e) => (e.target.style.borderColor = '#E5E0D4')} />
            </Field>
          </div>

          <Field label="Redemption limit">
            <div className="grid grid-cols-3 gap-2">
              {REDEMPTION_LIMITS.map((r) => {
                const on = redemptionLimit === r.value;
                return (
                  <button
                    key={r.value} type="button" onClick={() => setValue('redemption_limit', r.value, { shouldDirty: true })}
                    className="px-2 py-2.5 rounded-lg text-center transition"
                    style={{
                      background: on ? '#1F4D3A' : 'white',
                      color: on ? 'white' : '#3A4A42',
                      border: `1px solid ${on ? '#1F4D3A' : '#E5E0D4'}`,
                    }}
                  >
                    <div className="text-[12.5px] font-semibold">{r.label}</div>
                    <div className="text-[10.5px] mt-0.5" style={{ color: on ? 'rgba(255,255,255,0.7)' : '#9BA8A1' }}>{r.hint}</div>
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Included in ticket types" hint={ticketTypes.length === 0 ? 'No ticket types yet — create tickets first, then attach.' : 'Attendees on the checked tiers hold this entitlement.'}>
            {ticketTypes.length > 0 && (
              <div className="rounded-lg border divide-y" style={{ borderColor: '#E5E0D4' }}>
                {ticketTypes.map((tt) => {
                  const on = selectedTicketTypes.includes(tt.id);
                  return (
                    <button
                      key={tt.id} type="button" onClick={() => toggleTicket(tt.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition hover:bg-[#FAF6EE]"
                      style={{ borderColor: '#F0EDE6' }}
                    >
                      <span className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                        style={{ background: on ? '#1F4D3A' : 'white', border: `1px solid ${on ? '#1F4D3A' : '#C7CFC9'}` }}>
                        {on && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5.2 4 7.5 8.5 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                      </span>
                      <span className="text-[13.5px]" style={{ color: '#0F1F18' }}>{tt.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </Field>

          {errors.root?.message && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg text-[13px]"
              style={{ background: 'rgba(184,66,60,0.07)', border: '1px solid rgba(184,66,60,0.2)', color: '#B8423C' }}>
              <AlertCircle size={14} strokeWidth={2} className="mt-0.5 shrink-0" />
              {errors.root.message}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-5 py-4 shrink-0" style={{ borderTop: '1px solid #E5E0D4', background: 'white' }}>
          <button type="button" onClick={onClose}
            className="h-10 px-4 text-[13px] font-medium rounded-lg border transition hover:border-[#3A4A42]"
            style={{ borderColor: '#E5E0D4', color: '#3A4A42' }}>
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting}
            className="h-10 px-5 text-white text-[13px] font-semibold rounded-lg transition hover:opacity-90 disabled:opacity-60"
            style={{ background: '#1F4D3A' }}>
            {isSubmitting ? 'Saving…' : initial ? 'Save changes' : 'Add entitlement'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-medium mb-1.5" style={{ color: '#3A4A42' }}>{label}</label>
      {children}
      {hint && !error && <p className="text-[11.5px] mt-1" style={{ color: '#9BA8A1' }}>{hint}</p>}
      {error && (
        <p className="text-[11.5px] mt-1 flex items-center gap-1" style={{ color: '#B8423C' }}>
          <AlertCircle size={11} strokeWidth={2} />{error}
        </p>
      )}
    </div>
  );
}
