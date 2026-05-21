'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useCallback, useState } from 'react';
import { Search, X } from 'lucide-react';

export function AuditFiltersClient({
  defaultAction,
  defaultActor,
}: {
  defaultAction: string;
  defaultActor: string;
}) {
  const router    = useRouter();
  const pathname  = usePathname();
  const [action, setAction] = useState(defaultAction);
  const [actor,  setActor]  = useState(defaultActor);

  const apply = useCallback(() => {
    const params = new URLSearchParams();
    if (action.trim()) params.set('action', action.trim());
    if (actor.trim())  params.set('actor',  actor.trim());
    router.push(`${pathname}?${params.toString()}`);
  }, [action, actor, pathname, router]);

  const clear = useCallback(() => {
    setAction('');
    setActor('');
    router.push(pathname);
  }, [pathname, router]);

  const hasFilters = defaultAction || defaultActor;

  return (
    <div className="mb-5 flex flex-wrap items-center gap-3">
      {/* Action filter */}
      <div
        className="flex items-center gap-2 h-9 px-3 rounded-lg border text-[13px]"
        style={{ borderColor: '#E5E0D4', background: '#FFFFFF' }}
      >
        <Search size={13} strokeWidth={2} className="text-[#6B7A72] shrink-0" />
        <input
          value={action}
          onChange={e => setAction(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && apply()}
          placeholder="Filter by action…"
          className="outline-none bg-transparent w-[160px] placeholder-[#6B7A72]/60 text-[#0F1F18]"
        />
      </div>

      {/* Actor filter */}
      <div
        className="flex items-center gap-2 h-9 px-3 rounded-lg border text-[13px]"
        style={{ borderColor: '#E5E0D4', background: '#FFFFFF' }}
      >
        <Search size={13} strokeWidth={2} className="text-[#6B7A72] shrink-0" />
        <input
          value={actor}
          onChange={e => setActor(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && apply()}
          placeholder="Filter by email…"
          className="outline-none bg-transparent w-[160px] placeholder-[#6B7A72]/60 text-[#0F1F18]"
        />
      </div>

      <button
        onClick={apply}
        className="h-9 px-4 rounded-lg text-[13px] font-medium text-white transition hover:opacity-90"
        style={{ background: '#1F4D3A' }}
      >
        Apply
      </button>

      {hasFilters && (
        <button
          onClick={clear}
          className="h-9 px-3 rounded-lg text-[13px] text-[#6B7A72] hover:text-[#0F1F18] flex items-center gap-1.5 transition border"
          style={{ borderColor: '#E5E0D4' }}
        >
          <X size={13} strokeWidth={2} />
          Clear
        </button>
      )}
    </div>
  );
}
