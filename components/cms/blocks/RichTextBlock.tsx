import type { RichTextContent } from '@/lib/cms/types';

interface RichTextBlockProps {
  content: RichTextContent;
}

export function RichTextBlock({ content }: RichTextBlockProps) {
  const paragraphs = content.markdown
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="prose max-w-[760px] mx-auto px-5 lg:px-10 py-16 text-[16px] text-[#3A4A42] leading-[1.8]">
      {paragraphs.map((para, i) => (
        <p key={i} className="mb-6 last:mb-0">
          {para}
        </p>
      ))}
    </div>
  );
}
