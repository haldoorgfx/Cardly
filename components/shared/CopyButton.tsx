'use client';

import { useState } from 'react';

export default function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={className ?? 'h-7 px-2.5 rounded-lg text-[12px] font-medium transition bg-[#fafafa] border border-[#e5e5ea] hover:bg-white text-[#0f0f1a]/70'}
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}
