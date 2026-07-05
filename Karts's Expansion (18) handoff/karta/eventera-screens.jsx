// Eventera · Product screen mockups — realistic, light, brand-true.
// Same visual language as the dashboard hero: cream browser chrome, forest
// sidebar, gold accents, photo placeholders (.ph), skeleton lines.
// Each screen is a static frame sized to its artboard.

const LOGO = "assets/eventera-logo.png";

/* ─────────────────────────────────────────────────────────────
   Shared chrome
   ───────────────────────────────────────────────────────────── */
function Browser({ url, children, w = 860 }) {
  return (
    <div className="eb" style={{ width: w }}>
      <div className="eb-chrome">
        <div className="eb-tl"><span style={{ background: "#EC6A5E" }} /><span style={{ background: "#F4BF4F" }} /><span style={{ background: "#61C554" }} /></div>
        <div className="eb-url">
          <svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></svg>
          <span>{url}</span>
        </div>
        <div className="eb-plus">+</div>
      </div>
      {children}
    </div>
  );
}

function Sidebar({ active }) {
  const items = [
    ["Events", "M3 4h18v17H3zM3 9h18M8 2v4M16 2v4"],
    ["Registrations", "reg"],
    ["Agenda", "M3 4h18v17H3zM3 10h18M8 14h5"],
    ["Analytics", "M3 3v18h18M7 14l4-4 3 3 5-6"],
  ];
  return (
    <aside className="es-side">
      <div className="es-wm"><img src={LOGO} alt="Eventera" /></div>
      <nav className="es-nav">
        {items.map(([label, d], i) => (
          <div key={i} className={`es-ni ${active === label ? "on" : ""}`}>
            <svg viewBox="0 0 24 24">
              {d === "reg"
                ? (<g><circle cx="9" cy="8" r="3" /><circle cx="17" cy="10" r="2.3" /><path d="M3 20c0-3 2.7-5 6-5s6 2 6 5" /></g>)
                : <path d={d} />}
            </svg>
            {label}
          </div>
        ))}
        <div className="es-slab">Organizer</div>
        <div className="es-ni"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></svg>Team</div>
        <div className="es-ni"><svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>Billing</div>
      </nav>
      <div style={{ flex: 1 }} />
      <span className="es-pro">Pro plan</span>
    </aside>
  );
}

function TopHead({ crumb, children }) {
  return (
    <div className="es-head">
      <div className="es-crumb" dangerouslySetInnerHTML={{ __html: crumb }} />
      <div className="es-tools">
        {children}
        <svg viewBox="0 0 24 24" className="es-bell"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" /></svg>
        <div className="ph avatar avatar-ring" style={{ "--h": 32, width: 30, height: 30 }} />
      </div>
    </div>
  );
}

const SK = ({ w, h = 8, mt, dark, gold }) => <span className={`sk ${dark ? "sk-d" : ""} ${gold ? "sk-g" : ""}`} style={{ width: w, height: h, marginTop: mt }} />;

/* ─────────────────────────────────────────────────────────────
   1 · Public event page (booking)
   ───────────────────────────────────────────────────────────── */
function EventPage() {
  return (
    <Browser url="eventera.co/e/your-event" w={840}>
      <div className="ep-cover">
        <div className="ep-cover-glow" />
        <SK w={130} h={7} dark />
        <div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            <SK w={320} h={17} dark /><SK w={210} h={17} dark />
          </div>
          <div className="ep-meta">
            <span><svg viewBox="0 0 24 24" className="gld"><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></svg> <SK w={58} h={7} dark /></span>
            <span><svg viewBox="0 0 24 24" className="gld"><path d="M12 21s7-6.5 7-11a7 7 0 10-14 0c0 4.5 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></svg> <SK w={46} h={7} dark /></span>
          </div>
        </div>
      </div>
      <div className="ep-body">
        <div className="ep-left">
          <div className="ep-sec">About this event</div>
          <SK w="100%" /><SK w="100%" mt={9} /><SK w="78%" mt={9} />
          <div className="ep-sec" style={{ marginTop: 22 }}>Agenda preview</div>
          {[["09:30", "#E8C57E", 150], ["11:00", "#1F4D3A", 120], ["14:00", "#2A6A50", 170]].map((r, i) => (
            <div className="ep-agrow" key={i}>
              <span className="ep-time">{r[0]}</span>
              <span className="ep-dot" style={{ background: r[1] }} />
              <SK w={r[2]} />
            </div>
          ))}
        </div>
        <div className="ep-card">
          <div className="ep-tk-k">General admission</div>
          <div className="ep-tk-v">KSh 4,500</div>
          <div className="ep-cta">Get ticket <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg></div>
          <div className="ep-pay">
            <span className="ep-paychip">M-Pesa</span><span className="ep-paychip">Card</span><span className="ep-paychip">Flutterwave</span>
          </div>
          <div className="ep-host">
            <div className="ph" style={{ "--h": 124, width: 34, height: 34, borderRadius: 8 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}><SK w={108} /><SK w={64} h={7} /></div>
          </div>
        </div>
      </div>
    </Browser>
  );
}

/* ─────────────────────────────────────────────────────────────
   2 · Ticketing setup
   ───────────────────────────────────────────────────────────── */
function Tickets() {
  const tix = [
    { n: "Early bird", p: "KSh 3,000", s: "Sold out", state: "sold" },
    { n: "General admission", p: "KSh 4,500", s: "284 left", state: "active" },
    { n: "VIP · front row", p: "KSh 12,000", s: "12 left", state: "" },
  ];
  return (
    <Browser url="app.eventera.co/events/tickets" w={860}>
      <div className="es-app">
        <Sidebar active="Events" />
        <main className="es-main">
          <TopHead crumb="<b>Events</b> &nbsp;/&nbsp; <span class='sk' style='width:128px;height:8px;display:inline-block'></span> &nbsp;/&nbsp; Tickets">
            <span className="es-mini-cta">Save</span>
          </TopHead>
          <div className="es-titlerow"><h1>Ticket types</h1><span className="es-add">+ Add type</span></div>
          <div className="tk-list">
            {tix.map((t, i) => (
              <div key={i} className={`tk-row ${t.state}`}>
                <span className="tk-ic">
                  <svg viewBox="0 0 24 24"><path d="M4 8a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2a2 2 0 000-4z" /><path d="M14 6v12" strokeDasharray="2 2" /></svg>
                </span>
                <div className="tk-meta">
                  <div className="tk-n">{t.n}</div>
                  <div className="tk-s">{t.s}</div>
                </div>
                <div className="tk-bar"><div className="tk-fill" style={{ width: t.state === "sold" ? "100%" : t.state === "active" ? "62%" : "20%" }} /></div>
                <div className="tk-p">{t.p}</div>
                <svg viewBox="0 0 24 24" className="tk-drag"><circle cx="9" cy="6" r="1.4" /><circle cx="15" cy="6" r="1.4" /><circle cx="9" cy="12" r="1.4" /><circle cx="15" cy="12" r="1.4" /><circle cx="9" cy="18" r="1.4" /><circle cx="15" cy="18" r="1.4" /></svg>
              </div>
            ))}
          </div>
          <div className="tk-promo">
            <span className="tk-promo-l">Promo code</span>
            <span className="tk-code">EARLY20</span>
            <span className="tk-promo-s">−20% · 96 uses left</span>
          </div>
          <div className="tk-foot">
            <div><div className="tk-foot-k">Projected revenue</div><div className="tk-foot-v">KSh 3.8M</div></div>
            <div><div className="tk-foot-k">Sold</div><div className="tk-foot-v">563 <span>/ 1,200</span></div></div>
            <div><div className="tk-foot-k">Payout</div><div className="tk-foot-v">Flutterwave</div></div>
          </div>
        </main>
      </div>
    </Browser>
  );
}

/* ─────────────────────────────────────────────────────────────
   3 · Agenda builder (multi-track grid)
   ───────────────────────────────────────────────────────────── */
function Agenda() {
  const times = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00"];
  const ROW = 38;
  const tracks = [["Main", "#1F4D3A"], ["Builders", "#2A6A50"], ["Invest", "#8A6FB0"], ["Workshop", "#C9A45E"]];
  const sessions = [
    { c: 0, t: 0, h: 2, color: "#1F4D3A" },
    { c: 1, t: 1, h: 2, color: "#2A6A50" },
    { c: 2, t: 0, h: 3, color: "#8A6FB0" },
    { c: 0, t: 3, h: 2, color: "#1F4D3A" },
    { c: 3, t: 2, h: 3, color: "#C9A45E" },
    { c: 1, t: 4, h: 2, color: "#2A6A50" },
  ];
  return (
    <Browser url="app.eventera.co/events/agenda" w={860}>
      <div className="ag-top">
        <div className="ag-days">
          <span className="ag-day on">Day 1</span><span className="ag-day">Day 2</span><span className="ag-day">Day 3</span>
        </div>
        <div className="ag-actions"><span className="ag-ghost">Preview</span><span className="es-mini-cta">Publish agenda</span></div>
      </div>
      <div className="ag-grid-wrap">
        <div className="ag-head">
          <div className="ag-th" />
          {tracks.map((t, i) => <div className="ag-th" key={i}><span className="ag-tdot" style={{ background: t[1] }} />{t[0]}</div>)}
        </div>
        <div className="ag-grid" style={{ height: times.length * ROW }}>
          <div className="ag-timecol">{times.map((t, i) => <div className="ag-tcell" key={i} style={{ height: ROW }}>{t}</div>)}</div>
          {tracks.map((_, c) => (
            <div className="ag-col" key={c}>
              {times.map((_, r) => <div className="ag-cell" key={r} style={{ height: ROW }} />)}
            </div>
          ))}
          {sessions.map((s, i) => (
            <div key={i} className="ag-sess" style={{
              left: `calc(64px + ${s.c} * ((100% - 64px) / 4) + 3px)`,
              width: `calc((100% - 64px) / 4 - 6px)`,
              top: s.t * ROW + 3, height: s.h * ROW - 6,
              borderLeft: `3px solid ${s.color}`,
            }}>
              <SK w="72%" h={7} /><SK w="46%" h={6} mt={6} />
            </div>
          ))}
        </div>
      </div>
    </Browser>
  );
}

/* ─────────────────────────────────────────────────────────────
   4 · Registration → the card moment
   ───────────────────────────────────────────────────────────── */
function CardMoment() {
  return (
    <Browser url="eventera.co/e/register" w={840}>
      <div className="cm-wrap">
        <div className="cm-form">
          <div className="cm-step">Step 2 of 2 · Your card</div>
          <div className="cm-h">You're in.</div>
          <div className="cm-sub">Your Eventera Card is ready to share.</div>
          <div className="cm-field"><div className="cm-k">Full name</div><SK w={150} mt={6} /></div>
          <div className="cm-2">
            <div className="cm-field"><div className="cm-k">Role</div><SK w={92} mt={6} /></div>
            <div className="cm-field cm-photo"><span className="cm-av" /><span>Photo added</span></div>
          </div>
          <div className="cm-cta">Share my card <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg></div>
        </div>
        <div className="cm-stage">
          <div className="cm-glow" />
          <div className="cm-badge"><svg viewBox="0 0 24 24" className="gld"><path d="M12 2l2.4 6.9L21 9l-5 4.3L17.6 21 12 17l-5.6 4 1.6-7.7L3 9l6.6-.1z" /></svg>Generated in 2s</div>
          <div className="kcard">
            <div className="kcard-lines" />
            <div className="kcard-brand">EVENTERA</div>
            <div className="ph kcard-av" style={{ "--h": 30 }} />
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}><SK w={120} h={12} dark /><SK w={150} h={7} dark /></div>
            <div style={{ marginTop: 12 }}><SK w={130} h={7} gold /></div>
            <div className="kcard-share">
              <span className="kcard-sb">IG</span><span className="kcard-sb">WA</span><span className="kcard-sb">X</span>
            </div>
            <div className="kcard-dl"><svg viewBox="0 0 24 24"><path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" /></svg>Download card</div>
          </div>
        </div>
      </div>
    </Browser>
  );
}

/* ─────────────────────────────────────────────────────────────
   5 · QR Check-in (phone)
   ───────────────────────────────────────────────────────────── */
function CheckIn() {
  return (
    <div className="ephone">
      <div className="ephone-notch" />
      <div className="ci">
        <div className="ci-top">
          <img src={LOGO} alt="Eventera" className="ci-logo" />
          <span className="ci-live"><span className="ci-dot" /> Door 2 · Live</span>
        </div>
        <div className="ci-scan">
          <div className="ci-frame">
            <span className="cnr tl" /><span className="cnr tr" /><span className="cnr bl" /><span className="cnr br" />
            <div className="ci-qr" />
            <div className="ci-laser" />
          </div>
          <div className="ci-hint">Point at attendee QR</div>
        </div>
        <div className="ci-result">
          <div className="ci-check"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg></div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginTop: 11 }}>
            <SK w={120} h={11} /><SK w={150} h={7} />
          </div>
          <div className="ci-row"><span>Checked in</span><b>412</b></div>
          <div className="ci-bar"><div className="ci-fill" style={{ width: "49%" }} /></div>
          <div className="ci-sub">49% of 847 registered</div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Canvas
   ───────────────────────────────────────────────────────────── */
function App() {
  return (
    <DesignCanvas>
      <DCSection id="screens" title="Eventera · Product Screens" subtitle="Realistic mockups matching the dashboard hero — Eventera brand, light theme">
        <DCArtboard id="event" label="01 · Public event page" width={840} height={560}><div className="frame"><EventPage /></div></DCArtboard>
        <DCArtboard id="tickets" label="02 · Ticketing setup" width={860} height={560}><div className="frame"><Tickets /></div></DCArtboard>
        <DCArtboard id="agenda" label="03 · Agenda builder" width={860} height={560}><div className="frame"><Agenda /></div></DCArtboard>
        <DCArtboard id="card" label="04 · The card moment" width={840} height={560}><div className="frame"><CardMoment /></div></DCArtboard>
        <DCArtboard id="checkin" label="05 · QR check-in" width={320} height={560}><div className="frame frame-c"><CheckIn /></div></DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
