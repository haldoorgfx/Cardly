import type { CSSProperties } from 'react';

function Skel({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={`animate-pulse rounded-lg bg-[#E5E0D4]/60 ${className ?? ''}`} style={style} />;
}

export default function TeamInviteLoading() {
  return (
    <div className="max-w-sm mx-auto mt-24 px-6">
      <div className="bg-white rounded-2xl border border-[#E5E0D4] p-8 text-center">
        <Skel className="w-14 h-14 rounded-full mx-auto mb-5" />
        <Skel className="h-6 w-48 mx-auto mb-3" />
        <Skel className="h-4 w-full mb-1" />
        <Skel className="h-4 w-3/4 mx-auto mb-6" />
        <Skel className="h-11 w-full rounded-xl mb-3" />
        <Skel className="h-4 w-24 mx-auto" />
      </div>
    </div>
  );
}
