'use client';

import { useState, useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';

const INPUT = 'w-full rounded-xl px-3 py-2.5 text-[14px] outline-none transition';
const INPUT_STYLE = { background: 'white', border: '1px solid #E5E0D4', color: '#0F1F18' };
const INPUT_FOCUS = 'focus:border-[#1F4D3A] focus:ring-[3px] focus:ring-[rgba(31,77,58,0.12)]';

interface WhiteLabelSettings {
  brand_name: string;
  primary_color: string;
  custom_domain: string;
  domain_verified: boolean;
  from_name: string;
  reply_to_email: string;
  hide_powered_by: boolean;
}

const DEFAULTS: WhiteLabelSettings = {
  brand_name: '',
  primary_color: '#1F4D3A',
  custom_domain: '',
  domain_verified: false,
  from_name: '',
  reply_to_email: '',
  hide_powered_by: false,
};

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200"
      style={{ background: checked ? '#1F4D3A' : '#E5E0D4' }}
    >
      <span
        className="inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 mt-0.5"
        style={{ transform: checked ? 'translateX(17px)' : 'translateX(2px)' }}
      />
    </button>
  );
}

export function WhiteLabelTab({ plan }: { plan: string }) {
  const [settings, setSettings] = useState<WhiteLabelSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/white-label')
      .then(r => r.ok ? r.json() : DEFAULTS)
      .then((d: Partial<WhiteLabelSettings>) => {
        setSettings({ ...DEFAULTS, ...d });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const set = <K extends keyof WhiteLabelSettings>(key: K, val: WhiteLabelSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: val }));
    setSaved(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/white-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaveError(data.error ?? 'Could not save. Please try again.');
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setSaveError('Network error — please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyDomain = async () => {
    setVerifying(true);
    setVerifyMsg(null);
    try {
      const res = await fetch('/api/white-label/verify-domain', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      setSettings(prev => ({ ...prev, domain_verified: Boolean(data.verified) }));
      setVerifyMsg(data.verified ? 'Domain verified ✓' : (data.detail ?? data.error ?? 'Not verified yet.'));
    } catch {
      setVerifyMsg('Could not check DNS right now — try again.');
    } finally {
      setVerifying(false);
    }
  };

  const previewColor = settings.primary_color.match(/^#[0-9a-fA-F]{3,6}$/)
    ? settings.primary_color
    : '#1F4D3A';

  if (plan !== 'studio') {
    return (
      <div className="rounded-2xl p-8 text-center" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: '#E8EFEB' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1F4D3A" strokeWidth="1.6">
            <circle cx="12" cy="12" r="3" />
            <path d="M19 12a7 7 0 00-.1-1l2-1.5-2-3.4-2.3 1a7 7 0 00-1.7-1l-.3-2.5H10l-.3 2.5a7 7 0 00-1.7 1l-2.3-1-2 3.4 2 1.5a7 7 0 000 2l-2 1.5 2 3.4 2.3-1a7 7 0 001.7 1l.3 2.5h3.8l.3-2.5a7 7 0 001.7-1l2.3 1 2-3.4-2-1.5c.1-.3.1-.7.1-1z" />
          </svg>
        </div>
        <div
          className="inline-flex items-center h-7 px-3 rounded-full text-[12.5px] font-medium mb-3"
          style={{ border: '1px solid #E8C57E', color: '#C9A45E' }}
        >
          Studio plan feature
        </div>
        <p className="font-display font-normal text-[20px] mb-2" style={{ color: '#0F1F18' }}>White Label</p>
        <p className="text-[14px] mb-6 max-w-[340px] mx-auto" style={{ color: '#6B7A72' }}>
          Replace Eventera branding with your own — custom domain, brand name, logo, and colors.
        </p>
        <a
          href="/settings/billing"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-[14px] font-medium text-white"
          style={{ background: '#1F4D3A' }}
        >
          Upgrade to Studio →
        </a>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={20} className="animate-spin" color="#6B7A72" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave}>
      <div
        className="flex flex-col lg:grid gap-8 lg:gap-12"
        style={{ gridTemplateColumns: '1fr 280px', alignItems: 'start' }}
      >
        {/* Left: settings */}
        <div className="space-y-8">
          {/* Brand Identity */}
          <div className="rounded-2xl p-6" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
            <h3 className="font-display font-medium text-[17px] mb-5" style={{ color: '#0F1F18' }}>Brand Identity</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[12px] mb-1.5" style={{ color: '#6B7A72' }}>
                  Brand name — replaces &ldquo;Eventera&rdquo; everywhere
                </label>
                <input
                  type="text"
                  value={settings.brand_name}
                  onChange={e => set('brand_name', e.target.value)}
                  placeholder="e.g. TechCorp Events"
                  className={`${INPUT} ${INPUT_FOCUS}`}
                  style={INPUT_STYLE}
                  maxLength={60}
                />
              </div>

              <div>
                <label className="block text-[12px] mb-2" style={{ color: '#6B7A72' }}>Primary color</label>
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg border shrink-0 transition-colors"
                    style={{ background: previewColor, borderColor: '#E5E0D4' }}
                  />
                  <input
                    type="text"
                    value={settings.primary_color}
                    onChange={e => set('primary_color', e.target.value)}
                    placeholder="#1F4D3A"
                    className={`w-36 ${INPUT} ${INPUT_FOCUS}`}
                    style={INPUT_STYLE}
                  />
                  <input
                    type="color"
                    value={previewColor}
                    onChange={e => set('primary_color', e.target.value)}
                    className="h-8 w-8 rounded-lg border cursor-pointer"
                    style={{ borderColor: '#E5E0D4', padding: 2 }}
                    title="Pick color"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Custom Domain */}
          <div className="rounded-2xl p-6" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
            <h3 className="font-display font-medium text-[17px] mb-5" style={{ color: '#0F1F18' }}>Custom Domain</h3>

            <div>
              <label className="block text-[12px] mb-1.5" style={{ color: '#6B7A72' }}>Domain</label>
              <input
                type="text"
                value={settings.custom_domain}
                onChange={e => set('custom_domain', e.target.value)}
                placeholder="events.yourcompany.com"
                className={`${INPUT} ${INPUT_FOCUS}`}
                style={INPUT_STYLE}
              />
            </div>

            {settings.custom_domain && (
              <div className="mt-4">
                <p className="text-[13px] mb-3" style={{ color: '#6B7A72' }}>
                  Add this CNAME record to your DNS provider:
                </p>
                <div
                  className="rounded-xl px-4 py-3  text-[13px] break-all"
                  style={{ background: '#E8EFEB', color: '#1F4D3A' }}
                >
                  CNAME&nbsp;&nbsp;{settings.custom_domain}&nbsp;&nbsp;→&nbsp;&nbsp;{(process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/^https?:\/\//, '')}
                </div>

                <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
                  {settings.domain_verified ? (
                    <div className="flex items-center gap-2 text-[13px]" style={{ color: '#2D7A4F' }}>
                      <Check size={14} strokeWidth={2.5} /> Domain verified
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-[13px]" style={{ color: '#C97A2D' }}>
                      <span className="w-2 h-2 rounded-full" style={{ background: '#C97A2D' }} />
                      Not verified yet
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleVerifyDomain}
                    disabled={verifying}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-opacity"
                    style={{ border: '1px solid #E5E0D4', color: '#1F4D3A', opacity: verifying ? 0.6 : 1 }}
                  >
                    {verifying ? <><Loader2 size={13} className="animate-spin" /> Checking…</> : 'Verify DNS'}
                  </button>
                </div>

                {verifyMsg && (
                  <p className="text-[12px] mt-2" style={{ color: settings.domain_verified ? '#2D7A4F' : '#6B7A72' }}>
                    {verifyMsg}
                  </p>
                )}
                <p className="text-[12px] mt-2" style={{ color: '#6B7A72' }}>
                  Save your changes first, then verify. Serving the domain also requires our team to add it to the platform — contact support once DNS is verified.
                </p>
              </div>
            )}
          </div>

          {/* Emails */}
          <div className="rounded-2xl p-6" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
            <h3 className="font-display font-medium text-[17px] mb-5" style={{ color: '#0F1F18' }}>Emails</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[12px] mb-1.5" style={{ color: '#6B7A72' }}>From name</label>
                <input
                  type="text"
                  value={settings.from_name}
                  onChange={e => set('from_name', e.target.value)}
                  placeholder="TechCorp Events"
                  className={`${INPUT} ${INPUT_FOCUS}`}
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <label className="block text-[12px] mb-1.5" style={{ color: '#6B7A72' }}>Reply-to email</label>
                <input
                  type="email"
                  value={settings.reply_to_email}
                  onChange={e => set('reply_to_email', e.target.value)}
                  placeholder="events@yourcompany.com"
                  className={`${INPUT} ${INPUT_FOCUS}`}
                  style={INPUT_STYLE}
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <div className="text-[14px] font-medium" style={{ color: '#0F1F18' }}>Hide &ldquo;Powered by Eventera&rdquo;</div>
                  <div className="text-[12px] mt-0.5" style={{ color: '#6B7A72' }}>
                    Removes Eventera branding from all attendee emails
                  </div>
                </div>
                <Toggle checked={settings.hide_powered_by} onChange={v => set('hide_powered_by', v)} />
              </div>
            </div>
          </div>

          {/* Save */}
          {saveError && (
            <div className="rounded-xl px-4 py-3 text-[13px]" style={{ background: '#FBEAE9', color: '#B8423C', border: '1px solid #F0C9C6' }}>
              {saveError}
            </div>
          )}
          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-display font-medium text-[15px] text-white transition-opacity"
            style={{ background: '#1F4D3A', opacity: saving ? 0.7 : 1 }}
          >
            {saving ? (
              <><Loader2 size={15} className="animate-spin" /> Saving…</>
            ) : saved ? (
              <><Check size={15} strokeWidth={2.5} /> Saved</>
            ) : (
              'Save changes'
            )}
          </button>
        </div>

        {/* Right: live preview */}
        <aside className="sticky" style={{ top: 88 }}>
          <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
            <div className="font-display font-medium text-[15px] mb-4" style={{ color: '#0F1F18' }}>Preview</div>

            {/* Mock event page */}
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #E5E0D4' }}>
              {/* Nav bar */}
              <div
                className="h-10 flex items-center px-4"
                style={{ background: previewColor }}
              >
                <span className="font-display font-semibold text-[13px] text-white">
                  {settings.brand_name || 'Your Brand'}
                </span>
              </div>

              {/* Cover image placeholder */}
              <div
                className="h-24"
                style={{ background: '#E8EFEB' }}
              />

              {/* Content */}
              <div className="p-3.5">
                <div className="font-display font-medium text-[14px] mb-1" style={{ color: '#0F1F18' }}>
                  Annual Developer Summit
                </div>
                <div className=" text-[12.5px] mb-3" style={{ color: '#6B7A72' }}>
                  12 Mar · 09:00 · Lagos
                </div>
                <div
                  className="h-8 rounded-lg flex items-center justify-center font-display font-medium text-[12px] text-white"
                  style={{ background: previewColor }}
                >
                  Register now
                </div>
                {!settings.hide_powered_by && (
                  <div className="text-center text-[12px] mt-2.5" style={{ color: '#C9C3B1' }}>
                    Powered by Eventera
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Responsive override */}
      <style>{`
        @media (max-width: 860px) {
          form > div[style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </form>
  );
}
