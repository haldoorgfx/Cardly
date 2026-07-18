'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye } from 'lucide-react';
import { useConfirm } from '@/components/ui/ConfirmProvider';

interface Props {
  userId: string;
  userName: string;
}

export function ImpersonateButton({ userId, userName }: Props) {
  const confirm = useConfirm();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function start() {
    if (!(await confirm({
      title: 'Impersonate this user?',
      body: `You’ll view the app as "${userName}". A banner will appear so you can exit at any time.`,
      confirmLabel: 'Impersonate',
    }))) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        router.push('/dashboard');
        return;
      }
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? 'Failed to start impersonation.');
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <button
        onClick={start}
        disabled={loading}
        className="inline-flex items-center gap-2 h-10 px-4 text-[13px] font-semibold rounded-xl border transition hover:bg-[#FAF6EE] disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F4D3A]"
        style={{ borderColor: '#E5E0D4', color: '#3A4A42' }}
      >
        <Eye size={14} strokeWidth={2} />
        {loading ? 'Starting…' : 'View as user'}
      </button>
      {error && (
        <p role="alert" className="text-[12px]" style={{ color: '#B8423C' }}>{error}</p>
      )}
    </div>
  );
}
