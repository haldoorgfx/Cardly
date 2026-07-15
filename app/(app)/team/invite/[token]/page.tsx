/* eslint-disable @typescript-eslint/no-explicit-any */
export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Link2, CheckCircle2, Clock } from 'lucide-react';
import { AcceptInviteClient } from './AcceptInviteClient';

interface PageProps {
  params: { token: string };
}

export default async function AcceptInvitePage({ params }: PageProps) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If not logged in, redirect to login with return URL
  if (!user) {
    redirect(`/login?next=/team/invite/${params.token}`);
  }

  // Look up the invite by token (service role to bypass RLS)
  const db = createAdminClient();
  const { data: invite, error } = await (db as any)
    .from('team_invites')
    .select('id, team_id, email, role, accepted_at, expires_at, teams(name)')
    .eq('token', params.token)
    .single();

  if (error || !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAF6EE' }}>
        <div className="text-center max-w-sm px-6">
          <div className="h-14 w-14 rounded-2xl grid place-items-center text-white mx-auto mb-6" style={{ background: '#1F4D3A' }}>
            <Link2 size={24} strokeWidth={1.8} />
          </div>
          <h1 className="font-display font-bold text-[22px] text-[#0F1F18] mb-2">Invalid invite</h1>
          <p className="text-[14px] text-[#6B7A72] mb-6">This invite link doesn&apos;t exist or has been revoked.</p>
          <a href="/dashboard" className="text-[13px] font-medium text-[#1F4D3A] underline">Go to dashboard</a>
        </div>
      </div>
    );
  }

  const isExpired = new Date(invite.expires_at) < new Date();
  const isAccepted = !!invite.accepted_at;
  const teamName = invite.teams?.name ?? 'a team';

  if (isExpired || isAccepted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAF6EE' }}>
        <div className="text-center max-w-sm px-6">
          <div className="h-14 w-14 rounded-2xl grid place-items-center text-white mx-auto mb-6" style={{ background: '#1F4D3A' }}>
            {isAccepted ? <CheckCircle2 size={24} strokeWidth={1.8} /> : <Clock size={24} strokeWidth={1.8} />}
          </div>
          <h1 className="font-display font-bold text-[22px] text-[#0F1F18] mb-2">
            {isAccepted ? 'Already accepted' : 'Invite expired'}
          </h1>
          <p className="text-[14px] text-[#6B7A72] mb-6">
            {isAccepted
              ? 'This invite has already been used.'
              : 'This invite link has expired. Ask the team owner to send a new one.'}
          </p>
          <a href="/dashboard" className="text-[13px] font-medium text-[#1F4D3A] underline">Go to dashboard</a>
        </div>
      </div>
    );
  }

  return (
    <AcceptInviteClient
      token={params.token}
      teamName={teamName}
      inviteEmail={invite.email}
      role={invite.role}
      userEmail={user.email ?? ''}
    />
  );
}
