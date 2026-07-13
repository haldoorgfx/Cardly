'use client';

import { hv as s, Ic, Chrome, Brand, NavItem, SkelNav, Plan, Stat, Col, Ecard, Bar, DotSq, Shot } from './primitives';

const COLS = [42, 56, 48, 64, 58, 100, 70];
const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** Scene 1 — Hero: organizer dashboard (light browser) + attendee Card (phone). */
export function Scene1DashboardHero({ float }: { float?: boolean }) {
  return (
    <Shot width={1080} height={716} float={float}>
      <div style={{ position: 'relative', width: 1000, height: 648 }}>
        <div className={s.liveFloat} style={{ left: -18, top: -14 }}>
          <span className={s.liveFloatDot} />Live · 847 registrations
        </div>
        <div className={s.win} style={{ width: 1000 }}>
          <Chrome url="events/pan-african-climate-summit" />
          <div className={s.app} style={{ height: 596 }}>
            <div className={s.side}>
              <Brand icon={<Ic n="ticket" c="crm" />} />
              <div className={s.navlist}>
                <NavItem active icon={<Ic n="cal" />} label="Events" />
                <SkelNav n={5} />
              </div>
              <Plan />
            </div>
            <div className={s.main}>
              <div className={s.topbar}>
                <div className={s.crumb}><b>Events</b> / Pan-African Climate Summit</div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 18 }}>
                  <Ic n="bell" c="mut" />
                  <div className={s.avatar}>A</div>
                </div>
              </div>
              <div className={s.body}>
                <div className={s.head}>
                  <span className={s.title}>Pan-African Climate Summit</span>
                  <span className={s.live}><span className={s.liveDot} />Live</span>
                </div>
                <div className={s.stats}>
                  <Stat label="Registrations" num="847" kind="gold" />
                  <Stat label="Cards shared" num="1,204" kind="forest" />
                  <Stat label="Check-ins" num="412" kind="ink" />
                </div>
                <div className={`${s.card} ${s.chartWrap}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className={s.label}>Registrations — Last 7 days</div>
                    <div className={s.mono} style={{
                      marginLeft: 'auto', fontSize: 11, color: 'var(--gold-deep)',
                      background: 'rgba(232,197,126,.14)', border: '1px solid rgba(201,164,94,.3)',
                      borderRadius: 99, padding: '3px 10px',
                    }}>Peak · Sat 184</div>
                  </div>
                  <div className={s.chart}>
                    {COLS.map((h, i) => (
                      <Col key={i} h={h} tone={i === 5 ? 'gold' : undefined} day={DAYS[i]} goldDay={i === 5} />
                    ))}
                  </div>
                </div>
                <div className={s.card} style={{ padding: '4px 18px' }}>
                  <div className={s.rows}>
                    <div className={s.row}>
                      <div className={s.thumb}><Ic n="cal" c="crm" /></div>
                      <div style={{ flex: 1 }}>
                        <div className={s.rwNm}>Pan-African Climate Summit</div>
                        <div className={s.rwMt}>847 reg.</div>
                      </div>
                      <Ic n="chev" c="mut" />
                    </div>
                    <div className={s.row}>
                      <div className={`${s.thumb} ${s.thumbSk}`} />
                      <div style={{ flex: 1 }}>
                        <Bar w="44%" />
                        <Bar sm w="24%" style={{ marginTop: 8 }} />
                      </div>
                      <DotSq />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          className={s.phone}
          style={{ position: 'absolute', right: -56, bottom: -52, width: 264, height: 534, transform: 'rotate(-2deg)', zIndex: 5 }}
        >
          <div className={s.phoneScreen} style={{ borderRadius: 28 }}>
            <div className={s.notch} />
            <div style={{ flex: 1, padding: 14 }}>
              <Ecard name="Amara Yusuf" role="Policy Lead · African Union" initials="AY" withBtn />
            </div>
            <div style={{ padding: '0 0 10px', textAlign: 'center', fontSize: 11, color: 'rgba(250,246,238,.6)' }}>Ready to share ✓</div>
            <div className={s.homeInd} />
          </div>
        </div>
      </div>
    </Shot>
  );
}
