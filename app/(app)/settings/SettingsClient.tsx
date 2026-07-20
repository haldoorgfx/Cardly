'use client';

import { useState } from 'react';
import Link from 'next/link';
import { deleteAccount, signOutAllDevices } from '@/app/(auth)/actions';
import { Check, Lock, ChevronRight, LogOut } from 'lucide-react';
import { useConfirm } from '@/components/ui/ConfirmProvider';

// ── Helpers ───────────────────────────────────────────────────────────────────

interface Profile {
  full_name: string | null;
  email: string | null;
  plan: string | null;
  role?: string | null;
  avatar_url?: string | null;
  organization?: string | null;
  notify_registrations?: boolean | null;
  notify_downloads?: boolean | null;
}

interface Props {
  profile: Profile | null;
  userId: string;
  /** Which section to render. Omit to render all (legacy). The General
   *  settings sub-tabs pass one of these so each tab shows just its section
   *  while all state + the single Save persist everything together. */
  section?: 'notifications' | 'account';
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F4D3A]"
      style={{ background: checked ? '#1F4D3A' : '#E5E0D4' }}
    >
      <span
        className="inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 mt-0.5"
        style={{ transform: checked ? 'translateX(21px)' : 'translateX(2px)' }}
      />
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SettingsClient({ profile, section }: Props) {
  const confirm = useConfirm();
  const show = (s: 'notifications' | 'account') => !section || section === s;
  const showSaveBar = !section || section === 'notifications';

  // Notifications — two genuinely-wired toggles.
  // notify_registrations → organizer "new registration" notification (default ON).
  // notify_card_downloads → persisted to profiles.notify_downloads, the column the
  //   card render route (/api/render) actually reads before emailing the owner.
  const [notifyRegistrations,   setNotifyRegistrations]   = useState(profile?.notify_registrations ?? true);
  const [notifyCardDownloads,   setNotifyCardDownloads]   = useState(profile?.notify_downloads     ?? true);

  // Save state
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState('');

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting]           = useState(false);
  const [deleteError, setDeleteError]     = useState<string | null>(null);

  // Log out of all devices
  const [signingOutAll, setSigningOutAll] = useState(false);

  async function handleSignOutAll() {
    if (!(await confirm({
      title: 'Log out everywhere?',
      body: 'You will need to sign in again everywhere, including here.',
      confirmLabel: 'Log out',
    }))) return;
    setSigningOutAll(true);
    await signOutAllDevices();
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notify_registrations: notifyRegistrations,
        notify_downloads:     notifyCardDownloads,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Save failed');
    }
  }

  async function handleDeleteAccount() {
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    setDeleting(true);
    setDeleteError(null);
    // On success this redirects and never returns. On a refusal it returns
    // { error } — previously discarded, which left the button stuck on
    // "Deleting…" forever with no explanation of why nothing happened.
    const res = await deleteAccount();
    if (res?.error) {
      setDeleteError(res.error);
      setDeleting(false);
      setDeleteConfirm(false);
    }
  }

  return (
    <div className="w-full">
      {/* Save bar — shown on the Notifications tab only */}
      {showSaveBar && (
        <div className="flex items-center justify-end gap-3 mb-5">
          {error && <p className="text-[12px]" style={{ color: '#B8423C' }}>{error}</p>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 h-9 px-5 rounded-lg text-[13.5px] font-semibold text-white transition disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F4D3A]"
            style={{ background: saved ? '#2D7A4F' : '#1F4D3A' }}
          >
            <Check size={13} strokeWidth={2.5} />
            {saved ? 'Saved!' : saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      )}

      <div className="space-y-5">

        {/* ── Notifications ── */}
        {show('notifications') && (
        <section className="bg-white rounded-2xl border p-6" style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(15,31,24,0.06)' }}>
          <h2 className="font-display font-semibold text-[15px] tracking-tight text-[#0F1F18] mb-5">Notifications</h2>
          <div className="divide-y" style={{ borderColor: '#E5E0D4' }}>
            {[
              {
                label: 'New registrations',
                desc: 'Email me when someone registers for your event',
                checked: notifyRegistrations,
                onChange: setNotifyRegistrations,
              },
              {
                label: 'Card downloads',
                desc: 'Email me when an attendee downloads their card',
                checked: notifyCardDownloads,
                onChange: setNotifyCardDownloads,
              },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between gap-6 py-4">
                <div>
                  <div className="text-[13.5px] font-medium text-[#0F1F18]">{item.label}</div>
                  <div className="text-[12.5px] mt-0.5" style={{ color: '#65736B' }}>{item.desc}</div>
                </div>
                <Toggle checked={item.checked} onChange={item.onChange} />
              </div>
            ))}
          </div>
        </section>
        )}

        {/* ── Security ── */}
        {show('account') && (
        <section className="bg-white rounded-2xl border p-2" style={{ borderColor: '#E5E0D4' }}>
          <Link
            href="/settings/reset-password"
            className="flex items-center justify-between gap-4 rounded-xl px-4 py-3.5 transition-colors hover:bg-[#F5F3EE]"
          >
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-lg grid place-items-center shrink-0" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                <Lock size={16} strokeWidth={1.9} />
              </span>
              <div>
                <div className="text-[13.5px] font-medium text-[#0F1F18]">Change password</div>
                <div className="text-[12.5px] mt-0.5" style={{ color: '#65736B' }}>Update the password you use to sign in.</div>
              </div>
            </div>
            <ChevronRight size={16} strokeWidth={2} style={{ color: '#9BA8A1' }} />
          </Link>
          <button
            onClick={handleSignOutAll}
            disabled={signingOutAll}
            className="w-full flex items-center justify-between gap-4 rounded-xl px-4 py-3.5 transition-colors hover:bg-[#F5F3EE] text-left disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-lg grid place-items-center shrink-0" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                <LogOut size={16} strokeWidth={1.9} />
              </span>
              <div>
                <div className="text-[13.5px] font-medium text-[#0F1F18]">Log out of all devices</div>
                <div className="text-[12.5px] mt-0.5" style={{ color: '#65736B' }}>
                  {signingOutAll ? 'Signing out everywhere…' : 'Ends every active session, including this one.'}
                </div>
              </div>
            </div>
            <ChevronRight size={16} strokeWidth={2} style={{ color: '#9BA8A1' }} />
          </button>
        </section>
        )}

        {/* ── Danger zone ── */}
        {show('account') && (
        <>
        <section className="bg-white rounded-2xl border p-6" style={{ borderColor: 'rgba(184,66,60,0.25)' }}>
          <div className="flex items-center justify-between gap-6">
            <div>
              <div className="text-[13.5px] font-semibold mb-1" style={{ color: '#B8423C' }}>Delete account</div>
              <div className="text-[13px]" style={{ color: '#65736B' }}>
                Permanently removes your account and all events. This can&apos;t be undone.
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="h-8 px-4 rounded-lg text-[13px] font-medium transition disabled:opacity-40"
                style={
                  deleteConfirm
                    ? { background: '#B8423C', color: 'white', border: 'none' }
                    : { background: 'white', border: '1px solid rgba(184,66,60,0.35)', color: '#B8423C' }
                }
              >
                {deleting ? 'Deleting…' : deleteConfirm ? 'Confirm — delete forever' : 'Delete'}
              </button>
              {deleteConfirm && !deleting && (
                <button onClick={() => setDeleteConfirm(false)} className="text-[13px] transition" style={{ color: '#65736B' }}>
                  Cancel
                </button>
              )}
            </div>
          </div>
          {/* Full-width so the server's explanation (unrefunded tickets, a
              subscription we couldn't cancel) wraps readably on a phone. */}
          {deleteError && (
            <p className="mt-3 text-[13px] leading-relaxed" style={{ color: '#B8423C' }}>
              {deleteError}
            </p>
          )}
        </section>
        </>
        )}

      </div>
    </div>
  );
}
