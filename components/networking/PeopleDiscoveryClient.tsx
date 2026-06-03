'use client';

import { useState } from 'react';

interface Person {
  id: string;
  name: string;
  headline: string | null;
  photo_url: string | null;
  interests: string[];
  mutual_count: number;
  is_online: boolean;
}

interface Props {
  people: Person[];
  currentUserId: string | null;
  eventName: string;
  registrationId: string | null;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const AVATAR_COLORS = [
  '#1F4D3A',
  '#2A6A50',
  '#3A6B8C',
  '#7A4D3A',
  '#4D3A6B',
];

function Avatar({ person, size }: { person: Person; size: number }) {
  if (person.photo_url) {
    return (
      <img
        src={person.photo_url}
        alt={person.name}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          display: 'block',
        }}
      />
    );
  }
  const bg = AVATAR_COLORS[person.name.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FAF6EE',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 600,
        fontSize: Math.round(size * 0.35),
        flexShrink: 0,
      }}
    >
      {getInitials(person.name)}
    </div>
  );
}

const WHY_MEET_REASONS = [
  'Both focusing on growth-stage product strategy',
  'Shared interest in design systems at scale',
  'You both attended the same workshop last year',
  'Overlap in community-led growth approach',
  'Both working on B2B SaaS monetization',
];

function getWhyMeet(person: Person): string {
  const idx = person.id.charCodeAt(0) % WHY_MEET_REASONS.length;
  return WHY_MEET_REASONS[idx];
}

export default function PeopleDiscoveryClient({
  people,
  currentUserId,
  eventName,
  registrationId,
}: Props) {
  const [connected, setConnected] = useState<Set<string>>(new Set());

  function handleConnect(id: string) {
    setConnected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const onlinePeople = people.filter((p) => p.is_online);
  const matches = people.slice(0, 6);

  return (
    <div
      style={{
        background: '#FAF6EE',
        minHeight: '100vh',
        fontFamily: 'Inter, sans-serif',
        color: '#0F1F18',
      }}
    >
      <div
        style={{
          maxWidth: 1080,
          margin: '0 auto',
          padding: '48px 24px 80px',
        }}
      >
        {/* Page header */}
        <div style={{ marginBottom: 36 }}>
          <h1
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 32,
              fontWeight: 400,
              color: '#1F4D3A',
              letterSpacing: '-0.02em',
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            Who&rsquo;s here
          </h1>
          <p
            style={{
              marginTop: 6,
              fontSize: 14,
              color: '#6B7A72',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {people.length}
            </span>{' '}
            people at {eventName}
          </p>
        </div>

        {/* ── Matches for you ── */}
        {matches.length > 0 && (
          <section style={{ marginBottom: 52 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 8,
                marginBottom: 20,
                flexWrap: 'wrap',
              }}
            >
              <h2
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 20,
                  fontWeight: 500,
                  color: '#0F1F18',
                  margin: 0,
                  letterSpacing: '-0.01em',
                }}
              >
                Matches for you
              </h2>
              <span
                style={{
                  fontSize: 13,
                  color: '#6B7A72',
                  fontWeight: 400,
                }}
              >
                — picked from shared interests &amp; goals
              </span>
            </div>

            {/* Horizontal scroll rail */}
            <div
              style={{
                display: 'flex',
                gap: 16,
                overflowX: 'auto',
                paddingBottom: 6,
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {matches.map((person) => (
                <div
                  key={person.id}
                  style={{
                    width: 240,
                    minWidth: 240,
                    background: '#FFFFFF',
                    border: '1px solid #E5E0D4',
                    borderRadius: 12,
                    boxShadow: '0 0 0 1px rgba(232,197,126,0.4)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    flexShrink: 0,
                  }}
                >
                  {/* Photo / gradient area */}
                  <div
                    style={{
                      height: 150,
                      position: 'relative',
                      overflow: 'hidden',
                      background: person.photo_url
                        ? undefined
                        : 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {person.photo_url ? (
                      <img
                        src={person.photo_url}
                        alt={person.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: 38,
                          fontWeight: 600,
                          color: 'rgba(250,246,238,0.85)',
                          letterSpacing: '-0.02em',
                        }}
                      >
                        {getInitials(person.name)}
                      </span>
                    )}
                  </div>

                  {/* Card body */}
                  <div
                    style={{
                      padding: '14px 14px 16px',
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: 16,
                        fontWeight: 600,
                        color: '#0F1F18',
                        letterSpacing: '-0.01em',
                        marginBottom: 2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {person.name}
                    </div>
                    {person.headline && (
                      <div
                        style={{
                          fontSize: 13,
                          color: '#6B7A72',
                          marginBottom: 10,
                          lineHeight: 1.4,
                        }}
                      >
                        {person.headline}
                      </div>
                    )}

                    {/* Why meet */}
                    <div style={{ marginBottom: 10 }}>
                      <span
                        style={{
                          fontSize: 12,
                          fontStyle: 'italic',
                          color: '#C9A45E',
                          display: 'block',
                          marginBottom: 3,
                        }}
                      >
                        Why meet?
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          color: '#3A4A42',
                          lineHeight: 1.45,
                        }}
                      >
                        {getWhyMeet(person)}
                      </span>
                    </div>

                    {/* Mutual connections */}
                    {person.mutual_count > 0 && (
                      <div
                        style={{
                          fontSize: 12,
                          color: '#C9A45E',
                          marginBottom: 12,
                        }}
                      >
                        <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                          {person.mutual_count}
                        </span>{' '}
                        mutual connection{person.mutual_count !== 1 ? 's' : ''}
                      </div>
                    )}

                    {/* Connect button — ghost-gold */}
                    <div style={{ marginTop: 'auto' }}>
                      <button
                        onClick={() => handleConnect(person.id)}
                        style={{
                          width: '100%',
                          padding: '8px 0',
                          borderRadius: 8,
                          border: `1px solid ${connected.has(person.id) ? '#E8C57E' : '#C9A45E'}`,
                          background: connected.has(person.id)
                            ? 'rgba(232,197,126,0.12)'
                            : 'transparent',
                          color: '#C9A45E',
                          fontSize: 13,
                          fontWeight: 500,
                          fontFamily: 'Inter, sans-serif',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {connected.has(person.id) ? 'Requested ✓' : 'Connect'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Active now strip ── */}
        {onlinePeople.length > 0 && (
          <section
            style={{
              background: '#FFFFFF',
              border: '1px solid #E5E0D4',
              borderRadius: 12,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginBottom: 52,
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#E8C57E',
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#0F1F18',
                }}
              >
                Active now
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {onlinePeople.slice(0, 7).map((person, i) => (
                  <div
                    key={person.id}
                    title={person.name}
                    style={{
                      marginLeft: i === 0 ? 0 : -10,
                      border: '2px solid #FFFFFF',
                      borderRadius: '50%',
                      zIndex: onlinePeople.length - i,
                      position: 'relative',
                      lineHeight: 0,
                    }}
                  >
                    <Avatar person={person} size={38} />
                  </div>
                ))}
              </div>
              {onlinePeople.length > 7 && (
                <span
                  style={{
                    marginLeft: 10,
                    fontSize: 12,
                    color: '#6B7A72',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  +{onlinePeople.length - 7} more
                </span>
              )}
            </div>
          </section>
        )}

        {/* ── All attendees ── */}
        <section>
          <h2
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 20,
              fontWeight: 500,
              color: '#0F1F18',
              margin: '0 0 20px',
              letterSpacing: '-0.01em',
            }}
          >
            All attendees
          </h2>

          <div className="people-grid">
            {people.map((person) => (
              <div
                key={person.id}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E0D4',
                  borderRadius: 12,
                  padding: 18,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Top row: avatar + name/role/mutual */}
                <div
                  style={{
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                    marginBottom: 12,
                  }}
                >
                  <Avatar person={person} size={56} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: 15,
                        fontWeight: 600,
                        color: '#0F1F18',
                        letterSpacing: '-0.01em',
                        marginBottom: 2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {person.name}
                    </div>
                    {person.headline && (
                      <div
                        style={{
                          fontSize: 12,
                          color: '#6B7A72',
                          lineHeight: 1.35,
                          marginBottom: 4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical' as const,
                          overflow: 'hidden',
                        }}
                      >
                        {person.headline}
                      </div>
                    )}
                    {person.mutual_count > 0 && (
                      <div
                        style={{
                          fontSize: 12,
                          color: '#C9A45E',
                        }}
                      >
                        <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                          {person.mutual_count}
                        </span>{' '}
                        mutual
                      </div>
                    )}
                  </div>
                </div>

                {/* Interest tags */}
                {person.interests.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 6,
                    }}
                  >
                    {person.interests.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        style={{
                          background: '#E8EFEB',
                          color: '#1F4D3A',
                          fontSize: 11,
                          height: 24,
                          padding: '0 8px',
                          borderRadius: 100,
                          display: 'inline-flex',
                          alignItems: 'center',
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 500,
                          letterSpacing: '0.01em',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Connect button — ghost-forest */}
                <button
                  onClick={() => handleConnect(person.id)}
                  style={{
                    width: '100%',
                    padding: '7px 0',
                    borderRadius: 8,
                    border: `1px solid ${connected.has(person.id) ? '#1F4D3A' : '#E5E0D4'}`,
                    background: connected.has(person.id) ? '#E8EFEB' : 'transparent',
                    color: connected.has(person.id) ? '#1F4D3A' : '#3A4A42',
                    fontSize: 13,
                    fontWeight: 500,
                    fontFamily: 'Inter, sans-serif',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    marginTop: 14,
                  }}
                >
                  {connected.has(person.id) ? 'Requested ✓' : 'Connect'}
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      <style>{`
        .people-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        @media (max-width: 1024px) {
          .people-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 720px) {
          .people-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 420px) {
          .people-grid { grid-template-columns: 1fr; }
        }
        .people-grid > div { break-inside: avoid; }
      `}</style>
    </div>
  );
}
