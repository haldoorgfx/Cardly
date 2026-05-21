import { requirePermission } from '@/lib/auth/guards';
import { USER_VIEW, IMPERSONATE } from '@/lib/auth/permissions';
import { ROLE_PERMISSIONS } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getUserEventCount, getUserCardCount } from '@/lib/admin/queries';
import { ImpersonateButton } from './ImpersonateButton';

export const dynamic = 'force-dynamic';

function Badge({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full font-mono text-[11px] tracking-[0.1em] uppercase"
      style={style}
    >
      {children}
    </span>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-3 flex items-start gap-4 border-b border-[#E5E0D4] last:border-0">
      <span className="text-[12px] font-mono text-[#6B7A72] w-36 shrink-0 pt-0.5">{label}</span>
      <span className="text-[13px] text-[#0F1F18] flex-1">{value}</span>
    </div>
  );
}

export default async function UserDetailPage({ params }: { params: { id: string } }) {
  const sessionUser = await requirePermission(USER_VIEW);
  const canImpersonate = (ROLE_PERMISSIONS[sessionUser.role as keyof typeof ROLE_PERMISSIONS] ?? []).includes(IMPERSONATE);

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!profile) notFound();

  const [eventCount, cardCount] = await Promise.all([
    getUserEventCount(profile.id),
    getUserCardCount(profile.id),
  ]);

  // Last 5 audit entries for this user
  const { data: auditEntries } = await adminClient
    .from('audit_log')
    .select('action, created_at, actor_email')
    .or(`actor_id.eq.${profile.id},entity_id.eq.${profile.id}`)
    .order('created_at', { ascending: false })
    .limit(5);

  const planStyle =
    profile.plan === 'studio' ? { bg: 'rgba(31,77,58,0.12)', color: '#1F4D3A' } :
    profile.plan === 'pro'    ? { bg: 'rgba(232,197,126,0.15)', color: '#C9A45E' } :
                                 { bg: '#F5F5F4', color: '#6B7A72' };

  const roleStyle =
    profile.role === 'super_admin' ? { bg: 'rgba(184,66,60,0.10)', color: '#B8423C' } :
    profile.role === 'admin'       ? { bg: 'rgba(232,197,126,0.18)', color: '#C9A45E' } :
    profile.role === 'studio'      ? { bg: 'rgba(31,77,58,0.10)', color: '#1F4D3A' } :
                                      { bg: 'rgba(107,122,114,0.10)', color: '#6B7A72' };

  return (
    <div className="p-6 lg:p-10 max-w-[800px]">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-[12px] text-[#6B7A72] font-mono">
        <Link href="/admin/users" className="hover:text-[#1F4D3A] transition-colors">Users</Link>
        <span>/</span>
        <span className="text-[#0F1F18]">{profile.full_name ?? profile.email}</span>
      </div>

      <div className="mb-8 flex items-start gap-5">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-2xl grid place-items-center text-white font-bold text-xl shrink-0"
          style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 130%)' }}>
          {profile.full_name?.[0]?.toUpperCase() ?? profile.email?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-display font-bold text-[26px] text-[#0F1F18] tracking-tight">
                {profile.full_name ?? '(no name)'}
              </h1>
              <div className="text-[13px] font-mono text-[#6B7A72] mt-0.5">{profile.email}</div>
              <div className="flex items-center gap-2 mt-2.5">
                <Badge style={planStyle}>{profile.plan}</Badge>
                <Badge style={roleStyle}>{profile.role}</Badge>
                {profile.suspended && (
                  <Badge style={{ background: 'rgba(184,66,60,0.10)', color: '#B8423C' }}>
                    suspended
                  </Badge>
                )}
              </div>
            </div>
            {canImpersonate && (
              <ImpersonateButton userId={profile.id} userName={profile.full_name ?? profile.email ?? profile.id} />
            )}
          </div>
        </div>
      </div>

      {/* Details card */}
      <div className="bg-white border border-[#E5E0D4] rounded-2xl overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-[#E5E0D4] bg-[#FAF6EE]">
          <h2 className="text-[12px] font-mono text-[#6B7A72] uppercase tracking-[0.14em]">Account details</h2>
        </div>
        <div className="px-5">
          <Field label="User ID" value={<span className="font-mono text-[11px] break-all">{profile.id}</span>} />
          <Field label="Email" value={profile.email ?? '—'} />
          <Field label="Name" value={profile.full_name ?? '—'} />
          <Field label="Plan" value={<Badge style={planStyle}>{profile.plan}</Badge>} />
          <Field label="Role" value={<Badge style={roleStyle}>{profile.role}</Badge>} />
          <Field label="Joined" value={new Date(profile.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} />
          <Field label="Events created" value={eventCount} />
          <Field label="Cards generated" value={cardCount} />
          {profile.stripe_customer_id && (
            <Field label="Stripe customer" value={<span className="font-mono text-[11px]">{profile.stripe_customer_id}</span>} />
          )}
          {profile.stripe_subscription_id && (
            <Field label="Stripe subscription" value={<span className="font-mono text-[11px]">{profile.stripe_subscription_id}</span>} />
          )}
          <Field label="Subscription status" value={profile.subscription_status ?? 'none'} />
          {profile.suspended && (
            <>
              <Field label="Suspended at" value={profile.suspended_at ? new Date(profile.suspended_at).toLocaleString() : '—'} />
              <Field label="Suspension reason" value={profile.suspended_reason ?? '—'} />
            </>
          )}
        </div>
      </div>

      {/* Recent audit entries */}
      {auditEntries && auditEntries.length > 0 && (
        <div className="bg-white border border-[#E5E0D4] rounded-2xl overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-[#E5E0D4] bg-[#FAF6EE]">
            <h2 className="text-[12px] font-mono text-[#6B7A72] uppercase tracking-[0.14em]">Recent audit activity</h2>
          </div>
          <div className="divide-y divide-[#E5E0D4]">
            {auditEntries.map((entry, i) => (
              <div key={i} className="px-5 py-3 flex items-center gap-4">
                <span className="font-mono text-[11px] bg-[#FAF6EE] border border-[#E5E0D4] px-2 py-0.5 rounded-md text-[#3A4A42]">
                  {entry.action}
                </span>
                <span className="text-[11px] text-[#6B7A72] font-mono ml-auto">
                  {new Date(entry.created_at).toLocaleString()}
                </span>
                {entry.actor_email && (
                  <span className="text-[11px] text-[#6B7A72]">by {entry.actor_email}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <Link
        href="/admin/users"
        className="inline-flex items-center gap-2 text-[13px] text-[#1F4D3A] hover:underline font-mono"
      >
        ← Back to users
      </Link>
    </div>
  );
}
