import Link from 'next/link';

export interface WorkspaceRole {
  key: string;
  label: string;
  href: string;
}

/**
 * The one control that makes the per-event workspaces feel like a single
 * place: the hats this account wears at THIS event.
 *
 * Before it, someone who attended an event and also spoke at it had two
 * unrelated destinations with no link between them and no sign the other
 * existed — you had to remember which sidebar entry held which half of your
 * own event.
 *
 * Renders nothing for a single role, which is most people. Nobody should pay
 * for a switcher they don't need.
 */
export function RoleBand({
  roles,
  activeRole,
  className = '',
}: {
  roles: WorkspaceRole[];
  activeRole: string;
  className?: string;
}) {
  if (roles.length < 2) return null;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      <span
        className="text-[11px] font-medium uppercase tracking-[0.12em] mr-1"
        style={{ color: '#65736B' }}
      >
        Your roles here
      </span>
      {roles.map(r => {
        const active = r.key === activeRole;
        return (
          <Link
            key={r.key}
            href={r.href}
            aria-current={active ? 'page' : undefined}
            className="h-8 px-3 inline-flex items-center rounded-full text-[13px] font-medium transition hover:opacity-85"
            style={{
              background: active ? '#1F4D3A' : '#FFFFFF',
              color: active ? '#FFFFFF' : '#3A4A42',
              border: `1px solid ${active ? '#1F4D3A' : '#E5E0D4'}`,
              textDecoration: 'none',
            }}
          >
            {r.label}
          </Link>
        );
      })}
    </div>
  );
}
