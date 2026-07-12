'use client';

import type { CSSProperties, ReactNode } from 'react';
import { hv as s, Ic, Bar, Shot, type IcName } from './primitives';

/** One numbered step tile. */
function Tile({ n, title, icon, children }: { n: number; title: string; icon: IcName; children: ReactNode }) {
  return (
    <div className={s.card} style={{ width: 220, flex: 'none', padding: 18, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 230 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 26, height: 26, borderRadius: 8, background: 'var(--forest)', color: 'var(--cream)', fontFamily: 'JetBrains Mono', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n}</span>
        <Ic n={icon} />
      </div>
      <div className={s.dm} style={{ fontWeight: 600, fontSize: 15, color: 'var(--forest-deep)' }}>{title}</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>{children}</div>
    </div>
  );
}

function Pill({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <span style={{ alignSelf: 'flex-start', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 11.5, padding: '6px 13px', borderRadius: 99, ...style }}>{children}</span>;
}

const ticketRow = (name: string, price: string) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 9 }}>
    <span className={s.dm} style={{ fontWeight: 600, fontSize: 12 }}>{name}</span>
    <span className={s.mono} style={{ fontSize: 11, color: 'var(--gold-deep)', fontWeight: 600 }}>{price}</span>
  </div>
);

const agendaRow = (time: string) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <span className={s.mono} style={{ fontSize: 10, color: 'var(--muted)', background: 'var(--forest-soft)', borderRadius: 6, padding: '3px 7px' }}>{time}</span>
    <Bar style={{ flex: 1 }} />
  </div>
);

/** Scene 6 — How it works: horizontal strip of 5 step tiles. */
export function Scene6HowItWorks() {
  return (
    <Shot width={1196} height={280}>
      <div style={{ display: 'flex', gap: 18 }}>
        <Tile n={1} title="Create event" icon="cal">
          <Bar w="80%" />
          <Bar sm w="60%" />
          <Bar sm w="70%" />
          <Pill style={{ background: 'var(--forest)', color: 'var(--cream)' }}>Publish</Pill>
        </Tile>
        <Tile n={2} title="Add tickets" icon="ticket">
          {ticketRow('Free', '$0')}
          {ticketRow('VIP', '$25')}
          <Bar sm w="55%" />
        </Tile>
        <Tile n={3} title="Build agenda" icon="list">
          {agendaRow('09:00')}
          {agendaRow('11:30')}
          {agendaRow('14:00')}
        </Tile>
        <Tile n={4} title="Attendees register" icon="users">
          <div style={{ height: 26, borderRadius: 8, background: '#F4F0E6', border: '1px solid var(--border)' }} />
          <div style={{ height: 26, borderRadius: 8, background: '#F4F0E6', border: '1px solid var(--border)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
            <Pill style={{ background: 'var(--forest)', color: 'var(--cream)' }}>Register →</Pill>
            <div style={{ width: 28, height: 36, borderRadius: 6, marginLeft: 'auto', background: 'linear-gradient(160deg,#163828,#2A6A50)' }} />
          </div>
        </Tile>
        <Tile n={5} title="Track live" icon="chart">
          <div className={s.chart} style={{ paddingTop: 6, gap: 8, minHeight: 80 }}>
            <div className={s.colwrap}><div className={`${s.col} ${s.colTint}`} style={{ height: '50%' }} /></div>
            <div className={s.colwrap}><div className={`${s.col} ${s.colTint}`} style={{ height: '70%' }} /></div>
            <div className={s.colwrap}><div className={`${s.col} ${s.colGold}`} style={{ height: '100%' }} /></div>
            <div className={s.colwrap}><div className={`${s.col} ${s.colTint}`} style={{ height: '60%' }} /></div>
          </div>
          <Pill style={{ background: 'rgba(45,122,79,.12)', color: 'var(--success)' }}>● Live</Pill>
        </Tile>
      </div>
    </Shot>
  );
}
