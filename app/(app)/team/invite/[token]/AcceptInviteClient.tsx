'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users } from 'lucide-react';

interface Props {
  token: string;
  teamName: string;
  inviteEmail: string;
  role: string;
  userEmail: string;
}

export function AcceptInviteClient({ token, teamName, inviteEmail, role, userEmail }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function accept() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/teams/invites/${token}`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? 'Failed to accept invite.'); return; }
      router.push('/team');
    } catch {
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  const emailMismatch = inviteEmail && userEmail && inviteEmail.toLowerCase() !== userEmail.toLowerCase();

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#FAF6EE' }}>
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'white', border: '1px solid #E5E0D4', boxShadow: '0 4px 12px rgba(15,31,24,0.08), 0 24px 60px rgba(31,77,58,0.08)' }}
      >
        {/* Top gradient strip */}
        <div style={{ height: 3, background: 'linear-gradient(90deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)' }} />

        <div className="p-8">
          {/* Icon */}
          <div
            className="h-14 w-14 rounded-2xl grid place-items-center text-white mx-auto mb-6"
            style={{ background: '#1F4D3A' }}
          >
            <Users size={24} strokeWidth={1.8} />
          </div>

          {/* Text */}
          <h1 className="font-display font-bold text-[22px] text-[#0F1F18] text-center mb-1">
            You&apos;re invited!
          </h1>
          <p className="text-[14px] text-[#65736B] text-center mb-6">
            Join <span className="font-semibold text-[#0F1F18]">{teamName}</span> as a{' '}
            <span className="font-medium text-[#0F1F18]">{role}</span>.
          </p>

          {/* Email mismatch warning */}
          {emailMismatch && (
            <div
              className="rounded-xl p-3 mb-5 text-[12.5px] text-[#C97A2D] leading-relaxed"
              style={{ background: 'rgba(201,122,45,0.08)', border: '1px solid rgba(201,122,45,0.2)' }}
            >
              <strong>Note:</strong> This invite was sent to <strong>{inviteEmail}</strong>, but you&apos;re
              signed in as <strong>{userEmail}</strong>. You can still accept, but check with the team owner if you&apos;re unsure.
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              className="rounded-xl p-3 mb-4 text-[12.5px] text-[#B8423C]"
              style={{ background: 'rgba(184,66,60,0.07)', border: '1px solid rgba(184,66,60,0.2)' }}
            >
              {error}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={accept}
            disabled={loading}
            className="w-full h-11 text-[14px] font-semibold text-white rounded-xl transition disabled:opacity-60 hover:bg-[#163828]"
            style={{ background: '#1F4D3A' }}
          >
            {loading ? 'Joining…' : 'Accept & join team'}
          </button>

          <a
            href="/dashboard"
            className="block text-center mt-4 text-[12.5px] text-[#65736B] hover:text-[#3A4A42] transition"
          >
            Decline
          </a>
        </div>
      </div>
    </div>
  );
}
