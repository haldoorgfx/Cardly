'use client';

import { hv as s, Ic, Chrome, Brand, NavItem, SkelNav, Bar, Shot } from './primitives';

/** A single question card — top-voted variant is emphasized. */
function Q({ top, vote }: { top?: boolean; vote: number }) {
  return (
    <div
      className={s.card}
      style={{ padding: '14px 16px', ...(top ? { borderColor: 'rgba(31,77,58,.35)', boxShadow: '0 8px 22px -14px rgba(31,77,58,.5)' } : {}) }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {top
          ? <span style={{ fontFamily: 'Inter', fontSize: 9.5, fontWeight: 600, letterSpacing: '.12em', color: 'var(--forest)', background: 'var(--forest-soft)', borderRadius: 6, padding: '3px 8px' }}>TOP</span>
          : <div className={s.dotSq} style={{ width: 26, height: 26, borderRadius: '50%' }} />}
        <div style={{ flex: 1 }}>
          <div className={s.bar} style={{ width: top ? '82%' : '68%' }} />
          <div className={`${s.bar} ${s.barSm}`} style={{ width: top ? '54%' : '40%', marginTop: 8 }} />
        </div>
        <span style={{ fontFamily: 'Inter', fontSize: 12, fontWeight: 600, color: 'var(--forest-deep)', background: '#F4F0E6', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px' }}>▲ {vote}</span>
      </div>
    </div>
  );
}

/** Scene 5 — Live Q&A + Polls (browser + overlapping dark phone). */
export function Scene5LiveQA({ float }: { float?: boolean }) {
  return (
    <Shot width={1100} height={740} float={float}>
      <div style={{ position: 'relative', width: 1080, height: 720 }}>
        <div style={{ position: 'absolute', left: 0, top: -14, zIndex: 6, display: 'inline-flex', alignItems: 'center', gap: 9, background: 'var(--forest-deep)', color: 'var(--cream)', fontSize: 12.5, fontWeight: 600, padding: '9px 16px', borderRadius: 99, boxShadow: '0 16px 30px -14px rgba(15,31,24,.6)' }}>
          <span className={s.liveDot} style={{ background: '#B8423C' }} />87 questions · Session live
        </div>
        <div className={s.win} style={{ width: 1000, marginTop: 26 }}>
          <Chrome url="e/summit/qa" />
          <div className={s.app} style={{ height: 600 }}>
            <div className={s.side}>
              <Brand icon={<Ic n="msg" c="crm" />} />
              <div className={s.navlist}>
                <NavItem active icon={<Ic n="msg" />} label="Live Q&A" />
                <SkelNav n={5} />
              </div>
            </div>
            <div className={s.main}>
              <div className={s.topbar}>
                <Bar w={120} style={{ height: 10 }} />
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, alignItems: 'center' }}>
                  <Ic n="bell" c="mut" />
                  <div className={s.avatar}>N</div>
                </div>
              </div>
              <div className={s.body}>
                <div className={s.head} style={{ justifyContent: 'space-between' }}>
                  <div>
                    <span className={s.title} style={{ fontSize: 23 }}>Fintech in East Africa</span>
                    <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>87 questions · 312 voting</div>
                  </div>
                  <span className={`${s.live} ${s.liveRed}`}><span className={s.liveDot} />LIVE</span>
                </div>
                <Q top vote={47} />
                <Q vote={23} />
                <Q vote={18} />
                <div className={s.card} style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <Ic n="chart" />
                    <div className={s.dm} style={{ fontWeight: 600, fontSize: 14, color: 'var(--forest-deep)' }}>Live Poll</div>
                    <span className={s.mono} style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted)' }}>58 votes</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                    <div style={{ height: 14, borderRadius: 99, background: '#F1EEE6', overflow: 'hidden' }}><div style={{ width: '64%', height: '100%', background: 'var(--forest)', borderRadius: 99 }} /></div>
                    <div style={{ height: 14, borderRadius: 99, background: '#F1EEE6', overflow: 'hidden' }}><div style={{ width: '41%', height: '100%', background: 'var(--forest)', opacity: .7, borderRadius: 99 }} /></div>
                    <div style={{ height: 14, borderRadius: 99, background: '#F1EEE6', overflow: 'hidden' }}><div style={{ width: '23%', height: '100%', background: 'var(--forest)', opacity: .5, borderRadius: 99 }} /></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={s.phone} style={{ position: 'absolute', right: -40, bottom: -40, width: 258, height: 520, transform: 'rotate(-2deg)', zIndex: 7 }}>
          <div className={s.phoneScreen} style={{ borderRadius: 28, background: 'var(--cream)', color: 'var(--forest-deep)' }}>
            <div className={s.notch} />
            <div style={{ padding: '34px 16px 12px', background: 'linear-gradient(150deg,#163828,#2A6A50)', color: 'var(--cream)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className={s.dm} style={{ fontWeight: 700, fontSize: 15 }}>Live Q&A</span>
                <span className={`${s.live} ${s.liveRed}`} style={{ background: 'rgba(255,255,255,.14)', color: '#fff' }}>
                  <span className={s.liveDot} style={{ background: '#EC6A5E' }} />LIVE
                </span>
              </div>
            </div>
            <div style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>
              <Q top vote={47} />
              <Q vote={23} />
              <Q vote={18} />
            </div>
            <div className={s.homeInd} style={{ color: 'var(--forest-deep)' }} />
          </div>
        </div>
      </div>
    </Shot>
  );
}
