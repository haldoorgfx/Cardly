import type { CSSProperties } from 'react';

function Skel({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={`animate-pulse rounded-lg bg-[#e5e5ea]/60 ${className ?? ''}`} style={style} />;
}

export default function EventDetailLoading() {
  return (
    <div className="px-8 py-8 max-w-[1200px]">
      <Skel className="h-3 w-48 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-[#e5e5ea] overflow-hidden">
            <div className="p-6 border-b border-[#e5e5ea] flex items-center justify-between">
              <div>
                <Skel className="h-7 w-48" />
                <Skel className="h-4 w-32 mt-2" />
              </div>
              <div className="flex gap-2">
                <Skel className="h-9 w-24 rounded-xl" />
                <Skel className="h-9 w-20 rounded-xl" />
              </div>
            </div>
            <Skel className="w-full rounded-none" style={{ aspectRatio: '1080/1350', maxHeight: 480 } as React.CSSProperties} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-[#e5e5ea] p-5">
              <Skel className="h-3 w-24 mb-3" />
              <Skel className="h-10 w-20" />
            </div>
            <div className="bg-white rounded-2xl border border-[#e5e5ea] p-5">
              <Skel className="h-3 w-16 mb-3" />
              <Skel className="h-10 w-20" />
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#e5e5ea] p-5">
            <Skel className="h-3 w-20 mb-4" />
            <Skel className="h-10 w-full rounded-xl mb-4" />
            <div className="flex gap-2">
              <Skel className="flex-1 h-10 rounded-xl" />
              <Skel className="flex-1 h-10 rounded-xl" />
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-[#e5e5ea] p-5">
            <Skel className="h-3 w-20 mb-4" />
            {[0, 1, 2].map(i => <Skel key={i} className="h-8 w-full mb-2" />)}
          </div>
        </div>
      </div>
    </div>
  );
}
