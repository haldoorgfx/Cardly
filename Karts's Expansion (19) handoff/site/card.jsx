// CardPreview — the visual centerpiece of the landing page.
// Designed as a real-feeling event share card, NOT a generic mockup.

function PhotoCircle({ initials = "AA", size = 56, ring = "rgba(232, 197, 126, 0.45)" }) {
  return (
    <div
      className="relative shrink-0 grid place-items-center font-display font-semibold"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background:
          "radial-gradient(120% 120% at 30% 25%, #f3e4c1 0%, #c9a45e 55%, #8a6f3a 100%)",
        color: "#1F4D3A",
        fontSize: size * 0.36,
        boxShadow: `0 0 0 3px ${ring}, 0 8px 18px rgba(15, 31, 24, 0.35)`,
        letterSpacing: "-0.02em",
      }}
    >
      {initials}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Main hero card — Pan-African Youth Forum / Aisha Ahmed
// ────────────────────────────────────────────────────────────────────
function CardPreview({
  width = 360,
  tilt = 0,
  role = "I'M ATTENDING",
  org = "AFRICAN UNION YOUTH PROGRAMME",
  event = "5th Pan-African Youth Forum",
  name = "Aisha Ahmed",
  title = "Climate Policy Lead",
  initials = "AA",
  date = "4–6 NOV 2025",
  location = "DJIBOUTI",
  style = {},
  className = "",
}) {
  const h = Math.round(width * 1.25); // 4:5 portrait
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        width,
        height: h,
        borderRadius: 22,
        transform: `rotate(${tilt}deg)`,
        boxShadow:
          "0 30px 60px -20px rgba(15, 31, 24, 0.45), 0 12px 24px -12px rgba(15, 31, 24, 0.35)",
        background:
          "linear-gradient(165deg, #163828 0%, #1F4D3A 45%, #2A6A50 100%)",
        color: "#FAF6EE",
        ...style,
      }}
    >
      {/* Decorative grain / glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(80% 60% at 110% -10%, rgba(232, 197, 126, 0.35), transparent 60%), radial-gradient(60% 50% at -10% 110%, rgba(232, 197, 126, 0.18), transparent 65%)",
          pointerEvents: "none",
        }}
      />
      {/* Subtle topo texture using svg */}
      <svg
        aria-hidden
        viewBox="0 0 400 500"
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0.08,
          pointerEvents: "none",
        }}
      >
        {Array.from({ length: 7 }).map((_, i) => (
          <path
            key={i}
            d={`M -50 ${80 + i * 60} Q 100 ${40 + i * 60} 220 ${110 + i * 60} T 450 ${90 + i * 60}`}
            fill="none"
            stroke="#E8C57E"
            strokeWidth="1.2"
          />
        ))}
      </svg>

      {/* Top row: org + corner monogram */}
      <div
        style={{
          position: "relative",
          padding: `${width * 0.07}px ${width * 0.07}px 0`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <div
          className="font-mono"
          style={{
            fontSize: Math.max(9, width * 0.029),
            letterSpacing: "0.14em",
            color: "#E8C57E",
            lineHeight: 1.3,
            maxWidth: "70%",
          }}
        >
          {org}
        </div>
        <div
          className="font-display"
          style={{
            fontSize: Math.max(11, width * 0.034),
            letterSpacing: "-0.02em",
            color: "#FAF6EE",
            opacity: 0.85,
            border: "1px solid rgba(250, 246, 238, 0.25)",
            borderRadius: 999,
            padding: `${width * 0.012}px ${width * 0.028}px`,
            whiteSpace: "nowrap",
          }}
        >
          Karta
        </div>
      </div>

      {/* Headline event */}
      <div
        className="font-display"
        style={{
          position: "relative",
          padding: `${width * 0.05}px ${width * 0.07}px 0`,
          fontSize: Math.max(22, width * 0.085),
          lineHeight: 1.02,
          letterSpacing: "-0.03em",
          fontWeight: 700,
          color: "#FAF6EE",
          textWrap: "balance",
        }}
      >
        {event}
      </div>

      {/* Role badge */}
      <div
        style={{
          position: "relative",
          padding: `${width * 0.05}px ${width * 0.07}px 0`,
        }}
      >
        <span
          className="font-mono"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "#E8C57E",
            color: "#163828",
            fontSize: Math.max(9, width * 0.03),
            letterSpacing: "0.18em",
            fontWeight: 600,
            padding: `${width * 0.014}px ${width * 0.028}px`,
            borderRadius: 4,
          }}
        >
          <span
            style={{
              width: width * 0.018,
              height: width * 0.018,
              background: "#163828",
              borderRadius: 999,
            }}
          />
          {role}
        </span>
      </div>

      {/* Attendee block — bottom-anchored */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: `${width * 0.07}px`,
          display: "flex",
          flexDirection: "column",
          gap: width * 0.045,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: width * 0.04 }}>
          <PhotoCircle initials={initials} size={width * 0.18} />
          <div style={{ minWidth: 0 }}>
            <div
              className="font-display"
              style={{
                fontSize: Math.max(15, width * 0.055),
                fontWeight: 600,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                color: "#FAF6EE",
              }}
            >
              {name}
            </div>
            <div
              style={{
                fontSize: Math.max(10, width * 0.032),
                color: "#E8C57E",
                marginTop: 2,
                letterSpacing: "0.01em",
              }}
            >
              {title}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: width * 0.04,
            borderTop: "1px solid rgba(232, 197, 126, 0.25)",
          }}
        >
          <div
            className="font-mono"
            style={{
              fontSize: Math.max(9, width * 0.03),
              letterSpacing: "0.16em",
              color: "#FAF6EE",
              opacity: 0.9,
            }}
          >
            {date}
          </div>
          <div
            className="font-mono"
            style={{
              fontSize: Math.max(9, width * 0.03),
              letterSpacing: "0.16em",
              color: "#FAF6EE",
              opacity: 0.9,
            }}
          >
            {location}
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Generic mini-card for use-case grid — different visual treatments
// ────────────────────────────────────────────────────────────────────
function MiniCard({
  width = 150,
  variant = "forest", // forest | cream | gold | duotone
  org = "AFRICA TECH FEST",
  event = "Africa Tech Festival 2026",
  role = "I'M SPEAKING AT",
  name = "Kwame Mensah",
  initials = "KM",
  title = "Product Engineer",
  date = "12 MAR 2026",
  location = "LAGOS",
}) {
  const h = Math.round(width * 1.25);

  const palettes = {
    forest: {
      bg: "linear-gradient(160deg, #163828 0%, #1F4D3A 60%, #1F4D3A 100%)",
      ink: "#FAF6EE",
      sub: "#E8C57E",
      badgeBg: "#E8C57E",
      badgeInk: "#163828",
      divider: "rgba(232,197,126,0.25)",
      accentOverlay:
        "radial-gradient(80% 60% at 110% -10%, rgba(232, 197, 126, 0.30), transparent 60%)",
    },
    cream: {
      bg: "linear-gradient(165deg, #FAF6EE 0%, #F1E9D6 100%)",
      ink: "#1F4D3A",
      sub: "#3A4A42",
      badgeBg: "#1F4D3A",
      badgeInk: "#FAF6EE",
      divider: "rgba(31, 77, 58, 0.18)",
      accentOverlay:
        "radial-gradient(80% 60% at 110% -10%, rgba(31, 77, 58, 0.10), transparent 60%)",
    },
    gold: {
      bg: "linear-gradient(160deg, #E8C57E 0%, #C9A45E 100%)",
      ink: "#163828",
      sub: "#163828",
      badgeBg: "#163828",
      badgeInk: "#E8C57E",
      divider: "rgba(22, 56, 40, 0.25)",
      accentOverlay:
        "radial-gradient(70% 50% at 110% -10%, rgba(250, 246, 238, 0.35), transparent 60%)",
    },
    duotone: {
      bg: "linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)",
      ink: "#FAF6EE",
      sub: "#FAF6EE",
      badgeBg: "#FAF6EE",
      badgeInk: "#163828",
      divider: "rgba(250, 246, 238, 0.35)",
      accentOverlay: "none",
    },
  };
  const p = palettes[variant] || palettes.forest;

  return (
    <div
      style={{
        width,
        height: h,
        borderRadius: 14,
        overflow: "hidden",
        background: p.bg,
        color: p.ink,
        position: "relative",
        boxShadow:
          "0 14px 28px -14px rgba(15,31,24,0.30), 0 6px 12px -6px rgba(15,31,24,0.22)",
      }}
    >
      <div
        aria-hidden
        style={{ position: "absolute", inset: 0, background: p.accentOverlay }}
      />
      <div
        style={{
          position: "relative",
          padding: width * 0.08,
          display: "flex",
          justifyContent: "space-between",
          gap: 6,
        }}
      >
        <div
          className="font-mono"
          style={{
            fontSize: Math.max(7, width * 0.05),
            letterSpacing: "0.14em",
            color: p.sub,
            maxWidth: "75%",
            lineHeight: 1.3,
          }}
        >
          {org}
        </div>
      </div>
      <div
        className="font-display"
        style={{
          position: "relative",
          padding: `${width * 0.04}px ${width * 0.08}px 0`,
          fontSize: Math.max(13, width * 0.11),
          lineHeight: 1.02,
          letterSpacing: "-0.03em",
          fontWeight: 700,
          textWrap: "balance",
        }}
      >
        {event}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: width * 0.08,
        }}
      >
        <div
          className="font-mono"
          style={{
            display: "inline-block",
            background: p.badgeBg,
            color: p.badgeInk,
            fontSize: Math.max(7, width * 0.05),
            letterSpacing: "0.18em",
            fontWeight: 600,
            padding: `${width * 0.022}px ${width * 0.05}px`,
            borderRadius: 3,
            marginBottom: width * 0.08,
          }}
        >
          {role}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: width * 0.05 }}>
          <PhotoCircle
            initials={initials}
            size={width * 0.22}
            ring={p.divider}
          />
          <div style={{ minWidth: 0 }}>
            <div
              className="font-display"
              style={{
                fontSize: Math.max(11, width * 0.075),
                fontWeight: 600,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                color: p.ink,
              }}
            >
              {name}
            </div>
            <div
              style={{
                fontSize: Math.max(8, width * 0.05),
                color: p.sub,
                marginTop: 1,
                opacity: variant === "gold" ? 0.75 : 1,
              }}
            >
              {title}
            </div>
          </div>
        </div>
        <div
          style={{
            marginTop: width * 0.06,
            paddingTop: width * 0.04,
            borderTop: `1px solid ${p.divider}`,
            display: "flex",
            justifyContent: "space-between",
          }}
          className="font-mono"
        >
          <span
            style={{
              fontSize: Math.max(7, width * 0.048),
              letterSpacing: "0.14em",
              opacity: 0.85,
            }}
          >
            {date}
          </span>
          <span
            style={{
              fontSize: Math.max(7, width * 0.048),
              letterSpacing: "0.14em",
              opacity: 0.85,
            }}
          >
            {location}
          </span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CardPreview, MiniCard, PhotoCircle });
