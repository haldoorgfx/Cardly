'use client';

import { hv as s, Ic, Shot } from './primitives';

/* One registration form field — real value or skeleton bar. */
function Field({ lbl, val }: { lbl: string; val?: string | null }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'rgba(250,246,238,.6)', fontWeight: 500, marginBottom: 6 }}>{lbl}</div>
      <div style={{
        height: 44, borderRadius: 11, background: 'rgba(255,255,255,.06)',
        border: '1px solid rgba(255,255,255,.13)', display: 'flex', alignItems: 'center', padding: '0 14px',
      }}>
        {val
          ? <span className={s.dm} style={{ fontWeight: 600, fontSize: 14, color: 'var(--cream)' }}>{val}</span>
          : <span className={s.barW} style={{ width: '55%', height: 8 }} />}
      </div>
    </div>
  );
}

/** Scene 2 — Registration → instant Card. Single phone on a deep-forest panel. */
export function Scene2Registration({ float }: { float?: boolean }) {
  return (
    <Shot width={420} height={760}>
      <div style={{
        width: 420, height: 760, background: '#0F1F18',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div className={`${s.phone} ${float ? s.float : ''}`} style={{ width: 340, height: 720 }}>
          <div className={s.phoneScreen}>
            <div className={s.notch} />
            <div className={s.phStatus}>9:41</div>
            <div style={{ flex: 1, padding: '8px 22px 18px', display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
              <div style={{ borderRadius: 16, padding: 18, background: 'linear-gradient(150deg,#163828,#2A6A50)', border: '1px solid rgba(232,197,126,.25)' }}>
                <div style={{ fontFamily: 'Inter', fontSize: 9.5, letterSpacing: '.16em', color: 'rgba(232,197,126,.9)', fontWeight: 600 }}>PAN-AFRICAN CLIMATE SUMMIT</div>
                <div className={s.dm} style={{ fontWeight: 700, fontSize: 19, margin: '8px 0 12px' }}>Register for this event</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontFamily: 'Inter', fontSize: 10.5, padding: '5px 11px', borderRadius: 99, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.16)' }}>Mar 15 · Nairobi</span>
                  <span style={{ fontFamily: 'Inter', fontSize: 10.5, padding: '5px 11px', borderRadius: 99, background: 'rgba(232,197,126,.9)', color: '#0F1F18', fontWeight: 600 }}>General · $25</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                <Field lbl="Full name" val="Idris Suleiman" />
                <Field lbl="Email" val={null} />
                <Field lbl="Job title" val="Policy Lead" />
              </div>
              <div style={{
                marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                background: 'var(--forest)', border: '1px solid rgba(232,197,126,.3)', color: 'var(--cream)',
                fontFamily: 'Plus Jakarta Sans', fontWeight: 600, fontSize: 14, padding: 14, borderRadius: 99,
              }}>
                {'Register & get your Eventera Card '}<Ic n="arr" c="crm" />
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 13, borderRadius: 14, background: 'rgba(232,197,126,.12)', border: '1px solid rgba(232,197,126,.3)' }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--forest)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', fontFamily: 'Plus Jakarta Sans', fontWeight: 700, color: 'var(--gold)', fontSize: 16 }}>E</div>
                <div>
                  <div className={s.dm} style={{ fontWeight: 600, fontSize: 13 }}>Your Eventera Card is generated</div>
                  <div style={{ fontSize: 11.5, color: 'rgba(250,246,238,.65)', marginTop: 2 }}>Ready to share in 2 seconds</div>
                </div>
              </div>
            </div>
            <div className={s.homeInd} />
          </div>
        </div>
      </div>
    </Shot>
  );
}
