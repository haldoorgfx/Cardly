// Decorative event card mockup â€” used across hero, use-cases, how-it-works.
// NOT connected to real event data. Pure visual prop.

export type CardVariant = 'forest' | 'cream' | 'gold' | 'duotone';

interface CardMockupProps {
  width?: number;
  tilt?: number;
  variant?: CardVariant;
  org?: string;
  event?: string;
  role?: string;
  name?: string;
  initials?: string;
  title?: string;
  date?: string;
  location?: string;
  opacity?: number;
  scale?: number;
}

const VARIANTS: Record<CardVariant, string> = {
  forest:  'linear-gradient(155deg, #0a1f14 0%, #1F4D3A 55%, #2A6A50 100%)',
  cream:   'linear-gradient(155deg, #1F4D3A 0%, #2A6A50 50%, #E8C57E 130%)',
  gold:    'linear-gradient(155deg, #1a1000 0%, #3a2800 45%, #E8C57E 120%)',
  duotone: 'linear-gradient(155deg, #0F1F18 0%, #1F4D3A 50%, #3a6b5a 120%)',
};

export function CardMockup({
  width = 300,
  tilt = 0,
  variant = 'forest',
  org = 'AYA SUMMIT Â· 2026',
  event = "I'm attending Aya Summit.",
  role = "I'M ATTENDING",
  name = 'Aisha Ahmed',
  initials = 'AA',
  title = 'Climate Policy Lead',
  date = 'MAR 2026',
  location = 'DJIBOUTI',
  opacity,
  scale,
}: CardMockupProps) {
  const aspectH = Math.round(width * 1.3);

  return (
    <div
      style={{
        width,
        height: aspectH,
        borderRadius: Math.round(width * 0.07),
        background: VARIANTS[variant],
        overflow: 'hidden',
        position: 'relative',
        transform: tilt ? `rotate(${tilt}deg)` : undefined,
        opacity,
        scale: scale !== undefined ? String(scale) : undefined,
        boxShadow: '0 20px 50px rgba(15,31,24,0.25), 0 6px 16px rgba(15,31,24,0.15)',
        flexShrink: 0,
      }}
    >
      {/* Dot overlay */}
      <div
        aria-hidden
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '12px 12px',
        }}
      />

      {/* Card content */}
      <div style={{ position: 'absolute', inset: 0, padding: Math.round(width * 0.075), display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {/* Top */}
        <div>
          <div style={{ fontSize: Math.round(width * 0.028), fontFamily: 'Inter, system-ui, sans-serif', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: Math.round(width * 0.025) }}>
            {org}
          </div>
          <div style={{ fontSize: Math.round(width * 0.055), fontWeight: 700, color: 'white', lineHeight: 1.15, fontFamily: 'DM Sans, system-ui, sans-serif', letterSpacing: '-0.02em' }}>
            {event.split('\n').map((line, i) => (
              <span key={i}>{line}{i < event.split('\n').length - 1 && <br />}</span>
            ))}
          </div>
        </div>

        {/* Role badge */}
        <div style={{ display: 'inline-block' }}>
          <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: Math.round(width * 0.028), letterSpacing: '0.14em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', display: 'block', marginBottom: Math.round(width * 0.02) }}>
            {role}
          </span>
        </div>

        {/* Bottom: avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: Math.round(width * 0.04) }}>
          <div style={{
            width: Math.round(width * 0.135),
            height: Math.round(width * 0.135),
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #E8C57E, #C9A45E)',
            display: 'grid',
            placeItems: 'center',
            fontFamily: 'DM Sans, system-ui, sans-serif',
            fontWeight: 700,
            fontSize: Math.round(width * 0.04),
            color: '#1F4D3A',
            flexShrink: 0,
            border: '2px solid rgba(255,255,255,0.2)',
          }}>
            {initials}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: Math.round(width * 0.045), color: 'white', fontFamily: 'DM Sans, system-ui, sans-serif', lineHeight: 1.2 }}>
              {name}
            </div>
            <div style={{ fontSize: Math.round(width * 0.032), color: 'rgba(255,255,255,0.55)', fontFamily: 'Inter, system-ui, sans-serif', marginTop: 2, letterSpacing: '0.04em' }}>
              {title}
            </div>
            <div style={{ fontSize: Math.round(width * 0.026), color: 'rgba(255,255,255,0.35)', fontFamily: 'Inter, system-ui, sans-serif', marginTop: 2, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {date} Â· {location}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
