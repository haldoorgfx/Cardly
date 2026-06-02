import type { CSSProperties } from 'react';

function Skel({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={`animate-pulse rounded-lg bg-[#E5E0D4]/60 ${className ?? ''}`} style={style} />;
}

export default function ResetPasswordLoading() {
  return (
    <div className="max-w-md mx-auto mt-20 px-6">
      <div className="bg-white rounded-2xl border border-[#E5E0D4] p-8">
        <Skel className="h-7 w-48 mb-2" />
        <Skel className="h-4 w-64 mb-6" />
        <div className="space-y-4">
          <div>
            <Skel className="h-3 w-28 mb-2" />
            <Skel className="h-10 w-full rounded-xl" />
          </div>
          <div>
            <Skel className="h-3 w-36 mb-2" />
            <Skel className="h-10 w-full rounded-xl" />
          </div>
        </div>
        <Skel className="h-10 w-full rounded-xl mt-6" />
      </div>
    </div>
  );
}
