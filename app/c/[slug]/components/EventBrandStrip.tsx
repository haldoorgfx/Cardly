'use client';

/** Compact organizer strip shown at the top of every attendee screen. */

interface Props {
  eventName: string;
  compact?: boolean;
}

export default function EventBrandStrip({ eventName, compact = false }: Props) {
  // Derive initials from event name (first 2 words, first letter each)
  const initials = eventName
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      gap: compact ? 10 : 14,
      padding: compact ? '10px 14px' : '14px 18px',
      background: '#FFFFFF',
      border: '1px solid #E5E0D4',
      borderRadius: compact ? 12 : 16,
      boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(15,31,24,0.06)',
    }}>
      {/* Avatar with initials */}
      <div style={{
        width: compact ? 32 : 40,
        height: compact ? 32 : 40,
        borderRadius: '50%',
        background: '#1F4D3A',
        color: '#E8C57E',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'DM Sans, sans-serif',
        fontWeight: 700,
        fontSize: compact ? 11 : 13,
        letterSpacing: '-0.01em',
        flexShrink: 0,
      }}>
        {initials || 'C'}
      </div>

      {/* Event name */}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontFamily: 'DM Sans, sans-serif',
          fontWeight: 700,
          fontSize: compact ? 13 : 15,
          lineHeight: 1.2,
          color: '#0F1F18',
          letterSpacing: '-0.01em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {eventName}
        </div>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10,
          color: '#6B7A72',
          letterSpacing: '0.04em',
          marginTop: 2,
        }}>
          powered by karta
        </div>
      </div>
    </div>
  );
}
