// arrival-card.jsx — The event card preview component used inside ArrivalScreen.
// Forest-green themed event card with 3 editable zones: name, title, photo.
// Renders with placeholder data; floating idle animation handled by parent wrapper.

window.EventCardPreview = function EventCardPreview({ scale = 1, placeholder = true, name, title, photoUrl, renderPhoto }) {
  // Card is designed at a base 400x500 frame, scaled via transform from outside.
  const W = 400, H = 500;
  return (
    <div style={{
      width: W, height: H,
      transform: `scale(${scale})`,
      transformOrigin: 'top left',
    }}>
      <div style={{
        width: W, height: H,
        position: 'relative',
        borderRadius: 22,
        overflow: 'hidden',
        background: 'linear-gradient(165deg, #1F4D3A 0%, #163828 55%, #1F4D3A 100%)',
        boxShadow: '0 4px 12px rgba(15,31,24,0.08), 0 24px 60px rgba(31,77,58,0.22)',
        color: '#FAF6EE',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        {/* Decorative concentric arcs (African-modern editorial feel) */}
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0, opacity: 0.10 }}>
          <defs>
            <radialGradient id="cgrad" cx="85%" cy="20%" r="80%">
              <stop offset="0%" stopColor="#E8C57E" stopOpacity="0.6"/>
              <stop offset="100%" stopColor="#E8C57E" stopOpacity="0"/>
            </radialGradient>
          </defs>
          <rect width={W} height={H} fill="url(#cgrad)"/>
          <circle cx={W-40} cy={H+40} r={260} fill="none" stroke="#E8C57E" strokeWidth="1.2"/>
          <circle cx={W-40} cy={H+40} r={200} fill="none" stroke="#E8C57E" strokeWidth="1.2"/>
          <circle cx={W-40} cy={H+40} r={140} fill="none" stroke="#E8C57E" strokeWidth="1.2"/>
        </svg>

        {/* Top strip: organizer brand */}
        <div style={{
          position: 'absolute', top: 22, left: 22, right: 22,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: '#E8C57E', color: '#1F4D3A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 11,
            letterSpacing: '-0.02em',
          }}>AU</div>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: 'rgba(250,246,238,0.7)',
          }}>African Union · Youth Programme</div>
        </div>

        {/* Photo zone — circle, top-right (overlapping below header) */}
        <div style={{
          position: 'absolute', top: 64, right: 22,
          width: 96, height: 96, borderRadius: '50%',
          background: '#E8EFEB',
          border: '3px solid #E8C57E',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
          boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
        }}>
          {renderPhoto ? renderPhoto() : placeholder ? (
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#1F4D3A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          ) : photoUrl ? <img src={photoUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : null}
        </div>

        {/* Event title — center upper */}
        <div style={{
          position: 'absolute', top: 180, left: 22, right: 22,
        }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10, letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#E8C57E',
            marginBottom: 8,
          }}>I'm attending</div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: 700,
            fontSize: 28, lineHeight: 1.08,
            letterSpacing: '-0.025em',
            color: '#FAF6EE',
            maxWidth: 280,
          }}>5th Pan-African<br/>Youth Forum</div>
        </div>

        {/* Editable zones — name + title */}
        <div style={{
          position: 'absolute', left: 22, right: 22, bottom: 86,
        }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 9, letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'rgba(232,197,126,0.85)',
            marginBottom: 6,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{
              display: 'inline-block', width: 5, height: 5, borderRadius: '50%',
              background: '#E8C57E',
            }}/>
            Delegate
          </div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: 700, fontSize: 30, lineHeight: 1.05,
            letterSpacing: '-0.02em',
            color: '#FAF6EE',
            opacity: placeholder ? 0.55 : 1,
          }}>{placeholder ? 'Your Name' : name}</div>
          <div style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500, fontSize: 14, marginTop: 6,
            color: 'rgba(250,246,238,0.7)',
            opacity: placeholder ? 0.7 : 1,
          }}>{placeholder ? 'Your role or organization' : title}</div>
        </div>

        {/* Bottom strip */}
        <div style={{
          position: 'absolute', left: 22, right: 22, bottom: 22,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: 16,
          borderTop: '1px solid rgba(232,197,126,0.22)',
        }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10, letterSpacing: '0.06em',
            color: 'rgba(250,246,238,0.7)',
          }}>4–6 NOV 2025</div>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10, letterSpacing: '0.06em',
            color: 'rgba(250,246,238,0.7)',
          }}>DJIBOUTI</div>
        </div>
      </div>
    </div>
  );
};
