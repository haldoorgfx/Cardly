// details-screen.jsx — Screen 2 (Details Form / E1)
// Live card preview + grouped form + sticky CTA. Three layouts via `variant`.
// Mobile: empty/initial state. Tablet: partial fill (name + photo). Desktop: validation error.

const detailTokens = {
  primary: '#1F4D3A', primaryDark: '#163828', primarySoft: '#E8EFEB',
  accent: '#E8C57E', accentDark: '#C9A45E',
  ink: '#0F1F18', inkSoft: '#3A4A42', muted: '#6B7A72',
  cream: '#FAF6EE', surface: '#FFFFFF',
  border: '#E5E0D4', borderStrong: '#C9C3B1',
  success: '#2D7A4F', danger: '#B8423C', dangerSoft: '#F6E3E1',
};

// ---- Icons (Lucide style) ----
const DSvg = ({ children, size = 18, sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);
const IconImage = (p) => <DSvg {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></DSvg>;
const IconAlert = (p) => <DSvg {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></DSvg>;
const IconCheck = (p) => <DSvg {...p}><polyline points="20 6 9 17 4 12"/></DSvg>;
const IconChevDown = (p) => <DSvg {...p}><polyline points="6 9 12 15 18 9"/></DSvg>;
const IconCal = (p) => <DSvg {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></DSvg>;
const IconPin = (p) => <DSvg {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></DSvg>;
const IconEye = (p) => <DSvg {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></DSvg>;
const IconPencil = (p) => <DSvg {...p}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/></DSvg>;

// ---- Compact event brand strip (smaller than Screen 1) ----
function MiniBrandStrip() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 12px',
      background: detailTokens.surface,
      border: `1px solid ${detailTokens.border}`,
      borderRadius: 12,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: detailTokens.primary, color: detailTokens.accent,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 11,
        flexShrink: 0,
      }}>AU</div>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 13,
          color: detailTokens.ink, lineHeight: 1.2,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>5th Pan-African Youth Forum</div>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: detailTokens.muted,
          letterSpacing: '0.04em', marginTop: 1,
        }}>4–6 NOV · DJIBOUTI</div>
      </div>
    </div>
  );
}

// ---- Field primitives ----
function FieldLabel({ children, required }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 4,
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 12, color: detailTokens.inkSoft,
      letterSpacing: '0.02em',
      marginBottom: 6, textTransform: 'lowercase',
    }}>
      <span>{children}</span>
      {required && <span style={{ color: detailTokens.primary }}>*</span>}
    </label>
  );
}

function FieldError({ children }) {
  return (
    <div role="alert" aria-live="polite" style={{
      display: 'flex', alignItems: 'center', gap: 6, marginTop: 6,
      fontFamily: 'Inter, sans-serif', fontSize: 13,
      color: detailTokens.danger,
    }}>
      <IconAlert size={14} sw={2}/>
      <span>{children}</span>
    </div>
  );
}

function TextField({ label, required, value = '', placeholder, error, focused, hint }) {
  const ring = focused ? '0 0 0 3px rgba(31,77,58,0.15)' : 'none';
  const borderColor = error ? detailTokens.danger
                    : focused ? detailTokens.primary
                    : detailTokens.border;
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <div style={{
        position: 'relative',
        height: 56, padding: '0 16px',
        background: detailTokens.surface,
        border: `1.5px solid ${borderColor}`,
        borderRadius: 14,
        boxShadow: ring,
        display: 'flex', alignItems: 'center',
        transition: 'border-color .2s ease-out, box-shadow .2s ease-out',
      }}>
        <span style={{
          fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: 500,
          color: value ? detailTokens.ink : detailTokens.muted,
          flex: 1,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{value || placeholder}</span>
        {focused && value && (
          <span style={{
            display: 'inline-block', width: 2, height: 20,
            background: detailTokens.primary,
            animation: 'caretBlink 1s steps(2) infinite',
            marginLeft: 2,
          }}/>
        )}
      </div>
      {hint && !error && <div style={{
        fontFamily: 'Inter, sans-serif', fontSize: 12, color: detailTokens.muted,
        marginTop: 6,
      }}>{hint}</div>}
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}

function SelectField({ label, required, value, placeholder, error }) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <div style={{
        height: 56, padding: '0 16px',
        background: detailTokens.surface,
        border: `1.5px solid ${error ? detailTokens.danger : detailTokens.border}`,
        borderRadius: 14,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{
          fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: 500,
          color: value ? detailTokens.ink : detailTokens.muted, flex: 1,
        }}>{value || placeholder}</span>
        <IconChevDown size={18} sw={2}/>
      </div>
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}

function TextAreaField({ label, required, value, placeholder, hint }) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <div style={{
        minHeight: 80, padding: '14px 16px',
        background: detailTokens.surface,
        border: `1.5px solid ${detailTokens.border}`,
        borderRadius: 14,
        fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: 500,
        color: value ? detailTokens.ink : detailTokens.muted,
        lineHeight: 1.5,
      }}>{value || placeholder}</div>
      {hint && <div style={{
        fontFamily: 'Inter, sans-serif', fontSize: 12, color: detailTokens.muted,
        marginTop: 6,
      }}>{hint}</div>}
    </div>
  );
}

function PhotoField({ filled, photoColor = '#C9B98A', error }) {
  if (!filled) {
    return (
      <div>
        <FieldLabel required>your photo</FieldLabel>
        <div style={{
          height: 120, borderRadius: 14,
          background: detailTokens.surface,
          border: `1.5px dashed ${error ? detailTokens.danger : detailTokens.borderStrong}`,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 8,
          color: detailTokens.inkSoft,
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: detailTokens.primarySoft,
            color: detailTokens.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IconImage size={20} sw={2}/>
          </div>
          <div style={{
            fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15,
            color: detailTokens.ink,
          }}>Tap to add photo</div>
          <div style={{
            fontFamily: 'Inter, sans-serif', fontSize: 12, color: detailTokens.muted,
          }}>JPG or PNG · under 10 MB</div>
        </div>
        {error && <FieldError>{error}</FieldError>}
      </div>
    );
  }
  return (
    <div>
      <FieldLabel required>your photo</FieldLabel>
      <div style={{
        height: 72, padding: '12px 14px 12px 12px',
        background: detailTokens.surface,
        border: `1.5px solid ${detailTokens.border}`,
        borderRadius: 14,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: `linear-gradient(135deg, ${photoColor}, ${detailTokens.accentDark})`,
          flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 18,
        }}>AA</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 14,
            color: detailTokens.ink,
          }}>aisha-portrait.jpg</div>
          <div style={{
            fontFamily: 'Inter, sans-serif', fontSize: 12, color: detailTokens.muted, marginTop: 2,
          }}>1.2 MB · cropped to circle</div>
        </div>
        <button style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600,
          color: detailTokens.primary,
          padding: '6px 10px',
        }}>Change</button>
      </div>
    </div>
  );
}

// ---- Section header ----
function GroupHeader({ index, title, subtitle }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 22, height: 22, borderRadius: '50%',
          background: detailTokens.primary, color: detailTokens.cream,
          fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{index}</div>
        <div style={{
          fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 16,
          color: detailTokens.ink, letterSpacing: '-0.01em',
        }}>{title}</div>
      </div>
      {subtitle && <div style={{
        fontFamily: 'Inter, sans-serif', fontSize: 13, color: detailTokens.muted,
        marginTop: 4, marginLeft: 32,
      }}>{subtitle}</div>}
    </div>
  );
}

// ---- Preview pill (used above card) ----
function LivePreviewLabel() {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px',
      background: detailTokens.primarySoft,
      borderRadius: 999,
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
      color: detailTokens.primary,
    }}>
      <IconEye size={11} sw={2.2}/>
      <span>Live preview</span>
    </div>
  );
}

// ---- Primary CTA ----
function PreviewCTA({ disabled, label = 'Preview my card', fullWidth = true }) {
  return (
    <button disabled={disabled} style={{
      width: fullWidth ? '100%' : 'auto',
      height: 56, padding: '0 28px',
      background: disabled ? detailTokens.primarySoft : detailTokens.primary,
      color: disabled ? detailTokens.muted : detailTokens.cream,
      border: 'none', borderRadius: 14,
      fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 16,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      cursor: disabled ? 'not-allowed' : 'pointer',
      boxShadow: disabled ? 'none' : '0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(31,77,58,0.18)',
    }}>
      <span>{label}</span>
      <DSvg size={18} sw={2.2}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></DSvg>
    </button>
  );
}

// ---- THE SCREEN ----
window.DetailsScreen = function DetailsScreen({ variant = 'mobile', width, height }) {
  const EventCardPreview = window.EventCardPreview;

  // State sets per variant (static, but representative)
  const states = {
    mobile: {
      name: '', title: '', email: '', country: '',
      photoFilled: false, focusedField: null,
      errors: {},
      submitDisabled: true,
    },
    tablet: {
      name: 'Aisha Ahmed', title: 'Climate Policy Lead', email: 'aisha.a@aupyf.org',
      country: 'Kenya · Nairobi',
      photoFilled: true, focusedField: 'title',
      errors: {},
      submitDisabled: false,
    },
    desktop: {
      name: 'Kwame Mensah', title: 'Founder, GreenLagos', email: 'kwame@greenlagos',
      country: 'Ghana · Accra',
      photoFilled: true, focusedField: null,
      errors: { email: 'Please enter a valid email address' },
      submitDisabled: false,
    },
  };
  const s = states[variant];

  // Card preview content reflects state
  const cardName = s.name || 'Your Name';
  const cardTitle = s.title || 'Your role or organization';

  // Reusable form body
  const FormBody = ({ compact }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 20 : 24 }}>
      <div>
        <GroupHeader index="1" title="About you" subtitle="This is what shows on your card."/>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <TextField
            label="your full name"
            required
            value={s.name}
            placeholder="e.g. Aisha Ahmed"
            focused={s.focusedField === 'name'}
          />
          <TextField
            label="title or organization"
            required
            value={s.title}
            placeholder="e.g. Climate Policy Lead"
            focused={s.focusedField === 'title'}
          />
          <TextField
            label="email"
            required
            value={s.email}
            placeholder="you@example.com"
            error={s.errors.email}
            hint="So we can send you a copy of your card."
          />
          <SelectField
            label="country"
            value={s.country}
            placeholder="Select your country"
          />
        </div>
      </div>

      <div>
        <GroupHeader index="2" title="Your photo" subtitle="Square photo crops best — we'll help you align it."/>
        <PhotoField filled={s.photoFilled}/>
      </div>

      <div>
        <GroupHeader index="3" title="Optional" subtitle="A short note for the organizer."/>
        <TextAreaField
          label="anything you'd like to share"
          value=""
          placeholder="Looking forward to the climate finance track…"
          hint="Visible only to the organizer. Not on your card."
        />
      </div>
    </div>
  );

  // ============== MOBILE ==============
  if (variant === 'mobile') {
    const cardScale = 0.78;
    return (
      <div style={{
        width, height, position: 'relative', overflow: 'hidden',
        background: detailTokens.cream,
        fontFamily: 'Inter, sans-serif', color: detailTokens.ink,
      }}>
        <div style={{
          padding: '16px 20px 0',
          display: 'flex', flexDirection: 'column', gap: 14,
          paddingBottom: 92, // space for sticky CTA
        }}>
          <MiniBrandStrip/>

          {/* Card hero */}
          <div style={{
            position: 'relative',
            background: detailTokens.surface,
            border: `1px solid ${detailTokens.border}`,
            borderRadius: 20,
            padding: '14px 14px 18px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          }}>
            <div style={{ alignSelf: 'flex-start' }}><LivePreviewLabel/></div>
            <div style={{ width: 400 * cardScale, height: 500 * cardScale }}>
              <EventCardPreview scale={cardScale}
                placeholder={!s.name && !s.title}
                name={cardName} title={cardTitle}/>
            </div>
          </div>

          <FormBody compact/>
        </div>

        {/* Sticky CTA */}
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          padding: '14px 20px 18px',
          background: 'rgba(250,246,238,0.92)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderTop: `1px solid ${detailTokens.border}`,
        }}>
          <PreviewCTA disabled={s.submitDisabled}/>
        </div>
      </div>
    );
  }

  // ============== TABLET ==============
  if (variant === 'tablet') {
    const cardScale = 0.92;
    return (
      <div style={{
        width, height, position: 'relative', overflow: 'hidden',
        background: detailTokens.cream,
        fontFamily: 'Inter, sans-serif', color: detailTokens.ink,
      }}>
        <div style={{
          maxWidth: 540, margin: '0 auto',
          padding: '28px 24px 92px',
          display: 'flex', flexDirection: 'column', gap: 22,
        }}>
          <MiniBrandStrip/>

          <div style={{
            background: detailTokens.surface,
            border: `1px solid ${detailTokens.border}`,
            borderRadius: 22,
            padding: '18px 18px 22px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          }}>
            <div style={{ alignSelf: 'flex-start' }}><LivePreviewLabel/></div>
            <div style={{ width: 400 * cardScale, height: 500 * cardScale }}>
              <EventCardPreview scale={cardScale}
                placeholder={false} name={cardName} title={cardTitle}/>
            </div>
          </div>

          <FormBody/>
        </div>

        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          padding: '16px 24px 20px',
          background: 'rgba(250,246,238,0.92)',
          backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
          borderTop: `1px solid ${detailTokens.border}`,
        }}>
          <div style={{ maxWidth: 540, margin: '0 auto' }}>
            <PreviewCTA disabled={s.submitDisabled}/>
          </div>
        </div>
      </div>
    );
  }

  // ============== DESKTOP ==============
  // Two-column: 60% card left (sticky), 40% form right
  const cardScale = 1.1;
  return (
    <div style={{
      width, height, position: 'relative', overflow: 'hidden',
      background: detailTokens.cream,
      fontFamily: 'Inter, sans-serif', color: detailTokens.ink,
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        height: '100%',
        display: 'grid', gridTemplateColumns: '58% 42%',
      }}>
        {/* Left column: brand strip + card */}
        <div style={{
          padding: '32px 40px',
          display: 'flex', flexDirection: 'column', gap: 24,
          background: 'linear-gradient(180deg, rgba(232,239,235,0.55) 0%, rgba(232,239,235,0) 100%)',
        }}>
          <div style={{ maxWidth: 460 }}><MiniBrandStrip/></div>

          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 16,
          }}>
            <LivePreviewLabel/>
            <div style={{ width: 400 * cardScale, height: 500 * cardScale }}>
              <EventCardPreview scale={cardScale}
                placeholder={false} name={cardName} title={cardTitle}/>
            </div>
            <div style={{
              fontFamily: 'Inter, sans-serif', fontSize: 13, color: detailTokens.muted,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <IconPencil size={13} sw={2}/> Updates as you type
            </div>
          </div>
        </div>

        {/* Right column: form, scrollable */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          background: detailTokens.cream,
          borderLeft: `1px solid ${detailTokens.border}`,
        }}>
          <div style={{
            padding: '36px 40px 24px',
          }}>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
              color: detailTokens.muted, letterSpacing: '0.1em',
              textTransform: 'uppercase', marginBottom: 8,
            }}>Step 1 of 2</div>
            <h1 style={{
              fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 28,
              letterSpacing: '-0.025em', lineHeight: 1.15,
              margin: 0, color: detailTokens.ink,
            }}>Tell us about you</h1>
            <p style={{
              fontFamily: 'Inter, sans-serif', fontSize: 14, lineHeight: 1.5,
              color: detailTokens.muted, margin: '8px 0 0',
            }}>The preview on the left updates as you type. Required fields are marked with <span style={{ color: detailTokens.primary }}>*</span>.</p>
          </div>

          <div style={{
            padding: '4px 40px 24px',
            overflowY: 'auto', flex: 1,
          }}>
            <FormBody/>
          </div>

          <div style={{
            padding: '16px 40px 24px',
            borderTop: `1px solid ${detailTokens.border}`,
            background: detailTokens.surface,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 16,
          }}>
            <div style={{
              fontFamily: 'Inter, sans-serif', fontSize: 13, color: detailTokens.muted,
            }}>You can edit anything before downloading.</div>
            <PreviewCTA disabled={s.submitDisabled} fullWidth={false}/>
          </div>
        </div>
      </div>
    </div>
  );
};
