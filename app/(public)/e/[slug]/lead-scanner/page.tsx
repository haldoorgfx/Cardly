'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type Rating = 'hot' | 'warm' | 'cold' | null;

interface Lead {
  id: string;
  name: string;
  role: string;
  company: string;
  tags: string[];
  sessions: number;
}

// Mock result — in production this would come from a QR scan decode + API call
const MOCK_LEAD: Lead = {
  id: '1',
  name: 'Amina Osman',
  role: 'Founder & CEO',
  company: 'Sahel Pay',
  tags: ['Fintech', 'Payments', 'Hiring'],
  sessions: 3,
};

function initials(name: string) { return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase(); }

export default function LeadScannerPage({ params }: { params: { slug: string } }) {
  const [state, setState] = useState<'scanning' | 'result'>('scanning');
  const [lead, setLead] = useState<Lead | null>(null);
  const [note, setNote] = useState('');
  const [rating, setRating] = useState<Rating>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const simulateScan = () => {
    setLead(MOCK_LEAD);
    setNote('');
    setRating(null);
    setSaved(false);
    setState('result');
  };

  const saveLead = async () => {
    if (!lead) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    setLeads(prev => [...prev, lead]);
    setSaved(true);
    setSaving(false);
  };

  const scanMore = () => {
    setState('scanning');
    setLead(null);
    setSaved(false);
  };

  const bg = '#0a1812';
  const forestDark = '#0f2518';
  const forestSurface = '#1a3828';

  return (
    <div style={{ background: bg, minHeight: '100vh', display: 'flex', justifyContent: 'center', padding: '40px 20px' }}>
      {/* Phone shell */}
      <div style={{
        width: 375, minHeight: 720,
        background: forestDark,
        borderRadius: 32,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        border: '1px solid rgba(232,197,126,0.12)',
      }}>
        {/* Top strip */}
        <div style={{ height: 56, background: forestSurface, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', flexShrink: 0 }}>
          <Link href={`/e/${params.slug}`} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>
            <ArrowLeft size={14} /> Exit
          </Link>
          <span style={{ fontFamily: 'var(--font-display, sans-serif)', fontWeight: 600, fontSize: 14, color: '#fff' }}>
            Lead Scanner
          </span>
          <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#E8C57E' }}>
            {leads.length} leads
          </span>
        </div>

        {/* Scanning state */}
        {state === 'scanning' && (
          <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column' }}>
            {/* Viewport */}
            <div style={{
              height: '55%', borderRadius: 16,
              position: 'relative', overflow: 'hidden',
              background: 'radial-gradient(ellipse at 50% 40%, rgba(31,77,58,0.5), transparent 70%), #0b1a13',
            }}>
              {/* QR placeholder pattern */}
              <div style={{
                position: 'absolute', left: '50%', top: '50%',
                transform: 'translate(-50%,-50%)',
                width: 110, height: 110, opacity: 0.2,
                backgroundImage: 'conic-gradient(from 0deg, #fff 0 25%, transparent 0 50%, #fff 0 75%, transparent 0)',
                backgroundSize: '22px 22px',
                borderRadius: 8,
              }} />
              {/* Corner brackets */}
              {(['tl','tr','bl','br'] as const).map(pos => (
                <div key={pos} style={{
                  position: 'absolute',
                  width: 28, height: 28,
                  border: '3px solid #E8C57E',
                  borderRight: pos.endsWith('l') ? 'none' : '3px solid #E8C57E',
                  borderLeft: pos.endsWith('r') ? 'none' : '3px solid #E8C57E',
                  borderBottom: pos.startsWith('t') ? 'none' : '3px solid #E8C57E',
                  borderTop: pos.startsWith('b') ? 'none' : '3px solid #E8C57E',
                  top: pos.startsWith('t') ? 18 : undefined,
                  bottom: pos.startsWith('b') ? 18 : undefined,
                  left: pos.endsWith('l') ? 18 : undefined,
                  right: pos.endsWith('r') ? 18 : undefined,
                }} />
              ))}
              {/* Scan line */}
              <div style={{
                position: 'absolute',
                left: 18, right: 18,
                height: 2,
                background: 'linear-gradient(90deg, transparent, #E8C57E, transparent)',
                boxShadow: '0 0 12px rgba(232,197,126,0.6)',
                animation: 'scan 2.4s ease-in-out infinite',
              }} />
            </div>

            <p style={{ color: '#fff', textAlign: 'center', marginTop: 24, fontSize: 15 }}>
              Point at attendee QR code
            </p>

            {/* Simulate scan for demo */}
            <button
              onClick={simulateScan}
              style={{
                marginTop: 'auto',
                width: '100%', height: 48,
                borderRadius: 999,
                background: '#E8C57E',
                color: '#0F1F18',
                border: 'none',
                fontWeight: 600,
                fontSize: 15,
                cursor: 'pointer',
              }}
            >
              Simulate scan
            </button>
          </div>
        )}

        {/* Result state */}
        {state === 'result' && lead && (
          <div style={{ flex: 1, padding: '28px 24px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            {/* Avatar */}
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, #1F4D3A, #2A6A50)',
              margin: '0 auto 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 600, color: '#fff',
              boxShadow: '0 0 0 2px #E8C57E',
            }}>
              {initials(lead.name)}
            </div>

            <div style={{ fontWeight: 500, fontSize: 24, color: '#fff', textAlign: 'center' }}>{lead.name}</div>
            <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: 4 }}>
              {lead.role}, {lead.company}
            </div>

            {/* Tags */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
              {lead.tags.map(tag => (
                <span key={tag} style={{
                  height: 26, padding: '0 12px', borderRadius: 999,
                  background: 'rgba(232,239,235,0.1)', color: 'rgba(255,255,255,0.75)',
                  fontSize: 12, fontWeight: 500,
                  display: 'inline-flex', alignItems: 'center',
                }}>
                  {tag}
                </span>
              ))}
            </div>

            <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginTop: 10 }}>
              Attending: <b>{lead.sessions}</b> sessions
            </div>

            {/* Note */}
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Add a note about this lead…"
              style={{
                marginTop: 20, width: '100%',
                background: '#1a3828',
                border: '1px solid rgba(232,197,126,0.2)',
                borderRadius: 12,
                padding: '12px 14px',
                fontSize: 14, color: '#fff',
                resize: 'none', minHeight: 64,
                outline: 'none',
              }}
            />

            {/* Rating */}
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              {([
                { key: 'hot', label: 'Hot', activeStyle: { background: '#E8C57E', color: '#0F1F18', borderColor: '#E8C57E' } },
                { key: 'warm', label: 'Warm', activeStyle: { background: '#1a3828', color: '#fff', borderColor: '#1a3828' } },
                { key: 'cold', label: 'Cold', activeStyle: { background: 'rgba(232,239,235,0.12)', color: '#fff', borderColor: 'rgba(232,239,235,0.2)' } },
              ] as { key: Rating; label: string; activeStyle: React.CSSProperties }[]).map(r => (
                <button
                  key={String(r.key)}
                  onClick={() => setRating(r.key)}
                  style={{
                    flex: 1, height: 40, borderRadius: 999,
                    border: '1px solid rgba(255,255,255,0.16)',
                    background: 'transparent', color: 'rgba(255,255,255,0.7)',
                    fontSize: 14, fontWeight: 500, cursor: 'pointer',
                    transition: 'all 0.15s',
                    ...(rating === r.key ? r.activeStyle : {}),
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Save */}
            <button
              onClick={saveLead}
              disabled={saving || saved}
              style={{
                marginTop: 20, width: '100%', height: 48,
                borderRadius: 999,
                background: saved ? '#2D7A4F' : '#E8C57E',
                color: saved ? '#fff' : '#0F1F18',
                border: 'none', fontSize: 16, fontWeight: 500, cursor: 'pointer',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Saving…' : saved ? '✓ Lead saved' : 'Save lead'}
            </button>

            <button
              onClick={scanMore}
              style={{ marginTop: 16, textAlign: 'center', fontSize: 14, color: 'rgba(232,197,126,0.8)', background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}
            >
              Scan another
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scan { 0%,100%{ top: 24px; } 50%{ top: calc(100% - 24px); } }
      `}</style>
    </div>
  );
}
