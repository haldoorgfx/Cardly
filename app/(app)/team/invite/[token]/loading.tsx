import type { CSSProperties } from 'react';

function Skel({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={`animate-pulse rounded-lg bg-[#E5E0D4]/60 ${className ?? ''}`} style={style} />;
}

export default function TeamInviteLoading() {
  return (
    <div className="max-w-sm mx-auto mt-24 px-4">
      <div className="bg-white rounded-2xl border border-[#E5E0D4] p-8 flex flex-col items-center space-y-4 text-center">
        <Skel className="h-14 w-14 rounded-full" />
        <Skel className="h-7 w-48" />
        <div className="w-full space-y-2">
          <Skel className="h-4 w-full" />
          <Skel className="h-4 w-4/5 mx-auto" />
        </div>
        <Skel className="h-11 w-full rounded-xl mt-2" />
        <Skel className="h-4 w-32" />
      </div>
    </div>
  );
}
