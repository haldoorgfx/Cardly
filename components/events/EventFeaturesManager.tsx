'use client';

import { useEffect, useState } from 'react';
import {
  Plus, Trash2, GripVertical, Link2, FileText, AlertTriangle, Check, Loader2,
  CalendarDays, Users, Briefcase, MessageSquare, BarChart3, Newspaper, Trophy, Network, Camera,
} from 'lucide-react';

interface MenuItem { id: string; label: string; type: 'link' | 'page'; url: string; content: string; }
interface Props { eventId: string; }

const C = {
  forest: '#1F4D3A', soft: '#E8EFEB', ink: '#0F1F18', muted: '#65736B',
  border: '#E5E0D4', cream: '#FAF6EE', danger: '#B8423C', success: '#2D7A4F',
};

/** Toggleable attendee-app sections. Default ON (a section is hidden only when explicitly false). */
const FEATURE_DEFS: { key: string; label: string; desc: string; Icon: typeof CalendarDays }[] = [
  { key: 'schedule',     label: 'Schedule',        desc: 'Let attendees browse the agenda', Icon: CalendarDays },
  { key: 'speakers',     label: 'Speakers',        desc: 'Show the speaker directory', Icon: Users },
  { key: 'sponsors',     label: 'Sponsors',        desc: 'Show sponsors & partners', Icon: Briefcase },
  { key: 'networking',   label: 'Networking',      desc: 'Attendee connections & messaging', Icon: Network },
  { key: 'qa',           label: 'Live Q&A',        desc: 'Questions during sessions', Icon: MessageSquare },
  { key: 'polls',        label: 'Live Polls',      desc: 'Interactive polls', Icon: BarChart3 },
  { key: 'community',    label: 'Community feed',  desc: 'Attendee posts', Icon: Newspaper },
  { key: 'photos',       label: 'Photo wall',      desc: 'Attendees upload & share event photos', Icon: Camera },
  { key: 'gamification', label: 'Gamification',    desc: 'Points & leaderboard', Icon: Trophy },
];

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} type="button"
      className="relative w-10 h-6 rounded-full transition-colors shrink-0"
      style={{ background: on ? C.forest : '#C9C3B1' }} aria-pressed={on}>
      <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
        style={{ left: on ? '18px' : '2px' }} />
    </button>
  );
}

export function EventFeaturesManager({ eventId }: Props) {
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [migrated, setMigrated] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/events/${eventId}/features`);
        const data = await res.json();
        setFeatures(data.features ?? {});
        setMenu(Array.isArray(data.custom_menu) ? data.custom_menu : []);
        setMigrated(data.migrated !== false);
      } catch {
        setError('Could not load settings.');
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId]);

  const isOn = (key: string) => features[key] !== false;
  const toggle = (key: string) => { setFeatures(f => ({ ...f, [key]: !isOn(key) ? true : false })); setSaved(false); };

  function addMenuItem() {
    setMenu(m => [...m, { id: `m${Date.now()}`, label: '', type: 'link', url: '', content: '' }]);
    setSaved(false);
  }
  function updateItem(id: string, patch: Partial<MenuItem>) {
    setMenu(m => m.map(it => it.id === id ? { ...it, ...patch } : it));
    setSaved(false);
  }
  function removeItem(id: string) { setMenu(m => m.filter(it => it.id !== id)); setSaved(false); }

  async function save() {
    setSaving(true); setError(''); setSaved(false);
    try {
      const clean = menu.filter(it => it.label.trim());
      const res = await fetch(`/api/events/${eventId}/features`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features, custom_menu: clean }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Save failed'); setMigrated(data.migrated !== false); return; }
      setMenu(clean);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError('Network error while saving.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex items-center gap-2 text-[13px] py-8" style={{ color: C.muted }}><Loader2 size={15} className="animate-spin" /> Loading…</div>;
  }

  return (
    <div className="space-y-6">
      {!migrated && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-xl text-[13px]"
          style={{ background: 'rgba(201,122,45,0.08)', border: '1px solid rgba(201,122,45,0.3)', color: '#8a4f17' }}>
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>Saving is disabled until the database migration <strong>038</strong> is applied (event_pages.features + custom_menu). Run it in the Supabase SQL editor.</span>
        </div>
      )}

      {/* Feature toggles */}
      <div className="bg-white border rounded-2xl overflow-hidden" style={{ borderColor: C.border }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: C.border }}>
          <h3 className="font-display text-[15px] font-semibold" style={{ color: C.ink }}>Attendee app features</h3>
          <p className="text-[12.5px] mt-0.5" style={{ color: C.muted }}>Turn sections on or off for your attendees. Off sections are hidden from the public event app.</p>
        </div>
        <div>
          {FEATURE_DEFS.map((f, i) => (
            <div key={f.key} className="flex items-center gap-3 px-5 py-3.5" style={{ borderTop: i ? `1px solid ${C.border}` : 'none' }}>
              <div className="w-9 h-9 rounded-lg grid place-items-center shrink-0" style={{ background: C.soft }}>
                <f.Icon size={16} style={{ color: C.forest }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-medium" style={{ color: C.ink }}>{f.label}</div>
                <div className="text-[12px]" style={{ color: C.muted }}>{f.desc}</div>
              </div>
              <Toggle on={isOn(f.key)} onClick={() => toggle(f.key)} />
            </div>
          ))}
        </div>
      </div>

      {/* Custom menu */}
      <div className="bg-white border rounded-2xl overflow-hidden" style={{ borderColor: C.border }}>
        <div className="px-5 py-4 border-b flex items-center justify-between gap-3" style={{ borderColor: C.border }}>
          <div>
            <h3 className="font-display text-[15px] font-semibold" style={{ color: C.ink }}>Custom menu</h3>
            <p className="text-[12.5px] mt-0.5" style={{ color: C.muted }}>Add your own links or info pages (FAQ, venue map, code of conduct) to the event page.</p>
          </div>
          <button onClick={addMenuItem}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium border shrink-0 transition hover:bg-[#F5F3EE]"
            style={{ borderColor: C.border, color: C.forest }}>
            <Plus size={14} /> Add item
          </button>
        </div>
        {menu.length === 0 ? (
          <div className="px-5 py-8 text-center text-[13px]" style={{ color: C.muted }}>No custom menu items yet.</div>
        ) : (
          <div>
            {menu.map((it, i) => (
              <div key={it.id} className="px-5 py-4 space-y-2.5" style={{ borderTop: i ? `1px solid ${C.border}` : 'none' }}>
                <div className="flex items-center gap-2">
                  <GripVertical size={15} style={{ color: '#C9C3B1' }} className="shrink-0" />
                  <input
                    value={it.label}
                    onChange={e => updateItem(it.id, { label: e.target.value })}
                    placeholder="Menu label (e.g. Code of Conduct)"
                    className="flex-1 border rounded-lg px-3 py-2 text-[13.5px]"
                    style={{ borderColor: C.border, color: C.ink }}
                  />
                  <div className="flex rounded-lg overflow-hidden border shrink-0" style={{ borderColor: C.border }}>
                    {(['link', 'page'] as const).map(t => (
                      <button key={t} onClick={() => updateItem(it.id, { type: t })}
                        className="px-2.5 py-2 text-[12px] font-medium flex items-center gap-1 transition"
                        style={it.type === t ? { background: C.forest, color: 'white' } : { background: 'white', color: C.muted }}>
                        {t === 'link' ? <Link2 size={12} /> : <FileText size={12} />}{t === 'link' ? 'Link' : 'Page'}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => removeItem(it.id)} className="w-10 h-10 grid place-items-center rounded-lg hover:bg-red-50 shrink-0" title="Remove">
                    <Trash2 size={14} style={{ color: C.danger }} />
                  </button>
                </div>
                {it.type === 'link' ? (
                  <input
                    value={it.url}
                    onChange={e => updateItem(it.id, { url: e.target.value })}
                    placeholder="https://…"
                    className="w-full border rounded-lg px-3 py-2 text-[13px] ml-6"
                    style={{ borderColor: C.border, color: C.ink, width: 'calc(100% - 1.5rem)' }}
                  />
                ) : (
                  <textarea
                    value={it.content}
                    onChange={e => updateItem(it.id, { content: e.target.value })}
                    placeholder="Page content…"
                    rows={3}
                    className="w-full border rounded-lg px-3 py-2 text-[13px] ml-6 resize-none"
                    style={{ borderColor: C.border, color: C.ink, width: 'calc(100% - 1.5rem)' }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save bar */}
      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[13.5px] font-semibold text-white disabled:opacity-60"
          style={{ background: C.forest }}>
          {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : saved ? <><Check size={14} /> Saved</> : 'Save changes'}
        </button>
        {error && <span className="text-[13px]" style={{ color: C.danger }}>{error}</span>}
        {saved && !error && <span className="text-[13px]" style={{ color: C.success }}>Changes saved.</span>}
      </div>
    </div>
  );
}
