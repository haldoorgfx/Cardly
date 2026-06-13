/* eslint-disable @next/next/no-img-element */
import { Quote } from 'lucide-react';
import type { TestimonialContent } from '@/lib/cms/types';

interface TestimonialBlockProps {
  content: TestimonialContent;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function TestimonialBlock({ content }: TestimonialBlockProps) {
  const initials = getInitials(content.authorName);

  return (
    <section
      className="relative border-y overflow-hidden"
      style={{ borderColor: '#E5E0D4' }}
    >
      {/* subtle dot grid background */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #1F4D3A 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative mx-auto max-w-[760px] px-5 lg:px-10 py-20 lg:py-24 text-center">
        {/* Quote icon */}
        <div
          className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-8"
          style={{ background: '#E8EFEB', color: '#E8C57E' }}
        >
          <Quote size={22} strokeWidth={2} />
        </div>

        {/* Quote text */}
        <blockquote
          className="font-display italic text-[22px] sm:text-[28px] lg:text-[32px] leading-[1.3] tracking-tight"
          style={{ color: '#0F1F18' }}
        >
          &ldquo;{content.quote}&rdquo;
        </blockquote>

        {/* Author */}
        <figcaption className="mt-10 flex flex-col items-center gap-3">
          {content.avatarUrl ? (
            <img
              src={content.avatarUrl}
              alt={content.authorName}
              className="w-12 h-12 rounded-full object-cover border-2"
              style={{ borderColor: '#E5E0D4' }}
            />
          ) : (
            <div
              className="w-12 h-12 rounded-full grid place-items-center font-display font-semibold text-[15px]"
              style={{
                background:
                  'radial-gradient(120% 120% at 30% 25%, #f3e4c1 0%, #c9a45e 55%, #8a6f3a 100%)',
                color: '#163828',
                boxShadow: '0 0 0 3px rgba(232, 197, 126, 0.25)',
              }}
            >
              {initials}
            </div>
          )}
          <div>
            <div
              className="font-display font-semibold text-[15px] tracking-tight"
              style={{ color: '#0F1F18' }}
            >
              {content.authorName}
            </div>
            <div
              className=" text-[10px] tracking-[0.16em] uppercase mt-1"
              style={{ color: '#6B7A72' }}
            >
              {content.authorRole}
            </div>
          </div>
        </figcaption>
      </div>
    </section>
  );
}
