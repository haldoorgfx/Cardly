'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const OPTIONS = [
  { value: '90d',  label: 'Last 90 days' },
  { value: '6m',   label: 'Last 6 months' },
  { value: '1y',   label: 'Last year' },
];

export function PeriodSelector({ current }: { current: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('period', e.target.value);
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="relative">
      <select
        value={current}
        onChange={handleChange}
        className="h-9 text-[13px] rounded-xl pl-3 pr-8 cursor-pointer outline-none font-medium appearance-none"
        style={{ background: 'white', border: '1px solid #E5E0D4', color: '#3A4A42' }}
      >
        {OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7A72]">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </span>
    </div>
  );
}
