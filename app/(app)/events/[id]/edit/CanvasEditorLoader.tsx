'use client';

import nextDynamic from 'next/dynamic';
import type { CanvasEditorProps } from '@/components/editor/CanvasEditor';

// Dynamic import keeps the 2,700-line CanvasEditor out of the initial JS bundle.
// It only loads when the user actually navigates to the edit page.
// Next.js 15 requires `ssr: false` dynamic imports to live in a Client
// Component rather than directly in the (Server Component) page — this file
// exists solely to own that call.
const CanvasEditor = nextDynamic(() => import('@/components/editor/CanvasEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 grid place-items-center bg-[#FAF6EE]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#1F4D3A] border-t-transparent animate-spin" />
        <span className="text-[13px] text-[#65736B] font-medium">Loading editor…</span>
      </div>
    </div>
  ),
});

export default function CanvasEditorLoader(props: CanvasEditorProps) {
  return <CanvasEditor {...props} />;
}
