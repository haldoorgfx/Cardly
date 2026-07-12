'use client';

import type { CSSProperties } from 'react';
import { hv as s, Ic, Chrome, NavItem, Stat, Col, Bar, Shot } from './primitives';

const HEIGHTS = [30, 38, 34, 46, 42, 54, 50, 62, 58, 72, 66, 90];
const WEEKS = ['Wk1', 'Wk2', 'Wk3', 'Wk4', 'Wk5', 'Wk6'];
const ENG: CSSProperties = { color: 'var(--success)', fontFamily: 'JetBrains Mono', fontWeight: 600, fontSize: 13 };

/** Scene 3 — Analytics dashboard (wide light browser). */
export function Scene3Analytics() {
  return (
    <Shot width={1112} height={720}>
      <div className={s.win} style={{ width: 1112 }}>
        <Chrome url="" skel />
        <div className={s.app} style={{ height: 640 }}>
          <div className={s.side}>
            <div className={s.brand} style={{ marginBottom: 4 }}>
              <span className={s.dm} style={{ fontWeight: 700, fontSize: 17, color: 'var(--forest)' }}>Analytics</span>
            </div>
            <div className={s.navlist}>
              <NavItem active icon={<Ic n="chart" />} label="Overview" />
              <NavItem muted label="Registrations" />
              <NavItem muted label="Sessions" />
              <NavItem muted label="Networking" />
              <NavItem muted label="Revenue" />
              <NavItem muted label="Cards" />
            </div>
          </div>
          <div className={s.main}>
            <div className={s.topbar}>
              <Bar w={130} style={{ height: 10 }} />
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, alignItems: 'center' }}>
                <Ic n="bell" c="mut" />
                <div className={s.avatar}>Z</div>
              </div>
            </div>
            <div className={s.body}>
              <div className={`${s.stats} ${s.statsFour}`}>
                <Stat label="Total registrations" num="847" kind="forest" delta="12%" />
                <Stat label="Revenue" num="$8,940" kind="gold" delta="24%" />
                <Stat label="Cards shared" num="1,204" kind="forest" delta="31%" />
                <Stat label="Check-in rate" num="87%" kind="ink" delta="5 pts" />
              </div>
              <div className={`${s.card} ${s.chartWrap}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className={s.dm} style={{ fontWeight: 600, fontSize: 15, color: 'var(--forest-deep)' }}>Registrations over time</div>
                  <div className={s.toggle} style={{ marginLeft: 'auto' }}>
                    <span>7D</span><span className={s.on}>30D</span><span>90D</span>
                  </div>
                </div>
                <div className={s.chart}>
                  {HEIGHTS.map((h, i) => (
                    <Col key={i} h={h} tone={i === 9 ? 'forest' : 'tint'} />
                  ))}
                </div>
                <div style={{ display: 'flex', paddingTop: 8 }}>
                  {WEEKS.map((w) => (
                    <span key={w} className={s.colday} style={{ flex: 1, textAlign: 'center' }}>{w}</span>
                  ))}
                </div>
              </div>
              <div className={s.card}>
                <table className={s.tbl}>
                  <thead>
                    <tr><th>Session</th><th>Registrations</th><th>Attendance</th><th>Engagement</th></tr>
                  </thead>
                  <tbody>
                    <tr><td style={{ fontWeight: 600 }}>Opening Keynote</td><td>847</td><td>724</td><td style={ENG}>91%</td></tr>
                    <tr><td style={{ fontWeight: 600 }}>Panel: Climate Policy</td><td>612</td><td>538</td><td style={ENG}>88%</td></tr>
                    <tr><td style={{ fontWeight: 600 }}>Workshop: Green Infra</td><td>380</td><td>342</td><td style={ENG}>90%</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Shot>
  );
}
