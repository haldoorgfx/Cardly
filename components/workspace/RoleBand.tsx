import Link from 'next/link';

export interface WorkspaceRole {
  key: string;
  label: string;
  href: string;
}

/**
 * The hats this account wears at THIS event, as a compact chip row.
 *
 * Deliberately NOT its own strip. The first version sat in a band above the
 * hero with a "YOUR ROLES HERE" caption — which read as placeholder text and
 * stole a whole row from the page for two chips. Every workspace already
 * announces the current role somewhere ("You're attending", the LIVE badge,
 * "You're speaking"), so the chips belong in that spot: same line, no extra
 * furniture, and the active chip states what you're looking at.
 *
 * Renders nothing for a single role, which is most people — nobody should pay
 * for a switcher they don't need.
 */
export function RoleBand({
  roles,
  activeRole,
  tone = 'light',
  className = '',
}: {
  roles: WorkspaceRole[];
  activeRole: string;
  /** 'onDark' for the forest hero; 'light' for cream/white surfaces. */
  tone?: 'light' | 'onDark';
  className?: string;
}) {
  if (roles.length < 2) return null;

  const dark = tone === 'onDark';

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {roles.map(r => {
        const active = r.key === activeRole;
        const style = dark
          ? {
              background: active ? 'rgba(250,246,238,0.95)' : 'rgba(255,255,255,0.12)',
              color: active ? '#0F1F18' : '#FAF6EE',
              border: `1px solid ${active ? 'transparent' : 'rgba(250,246,238,0.25)'}`,
            }
          : {
              background: active ? '#1F4D3A' : '#FFFFFF',
              color: active ? '#FFFFFF' : '#3A4A42',
              border: `1px solid ${active ? '#1F4D3A' : '#E5E0D4'}`,
            };
        return (
          <Link
            key={r.key}
            href={r.href}
            aria-current={active ? 'page' : undefined}
            className="h-7 px-2.5 inline-flex items-center rounded-full text-[12px] font-semibold transition hover:opacity-85"
            style={{ ...style, textDecoration: 'none' }}
          >
            {r.label}
          </Link>
        );
      })}
    </div>
  );
}
