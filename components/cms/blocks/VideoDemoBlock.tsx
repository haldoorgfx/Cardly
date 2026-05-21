import { Play } from 'lucide-react';
import type { VideoDemoContent } from '@/lib/cms/types';

interface VideoDemoBlockProps {
  content: VideoDemoContent;
}

export function VideoDemoBlock({ content }: VideoDemoBlockProps) {
  return (
    <section className="relative">
      <div className="mx-auto max-w-[1100px] px-5 lg:px-10 py-16 lg:py-20">
        <div className="text-center mb-8 lg:mb-10">
          {content.label && (
            <div
              className="font-mono text-[11px] tracking-[0.22em] uppercase mb-4"
              style={{ color: '#1F4D3A' }}
            >
              {content.label}
            </div>
          )}
          <h2
            className="font-display font-bold text-[28px] sm:text-[38px] lg:text-[44px] leading-[1.02] tracking-tight"
            style={{ color: '#0F1F18' }}
          >
            {content.headline}
          </h2>
        </div>

        {content.videoUrl ? (
          <video
            src={content.videoUrl}
            controls
            className="w-full rounded-2xl border"
            style={{
              borderColor: '#E5E0D4',
              boxShadow: '0 8px 40px rgba(15,31,24,0.18)',
            }}
          />
        ) : (
          <div
            className="relative w-full rounded-2xl border overflow-hidden"
            style={{
              aspectRatio: '16 / 9',
              background: 'linear-gradient(135deg, #163828 0%, #1F4D3A 50%, #2A6A50 100%)',
              borderColor: '#E5E0D4',
              boxShadow: '0 8px 40px rgba(15,31,24,0.18)',
            }}
          >
            {/* Dot grid overlay */}
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.10]"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, #E8C57E 1px, transparent 0)',
                backgroundSize: '26px 26px',
              }}
            />

            {/* Placeholder label */}
            {content.placeholder && (
              <div className="absolute top-5 left-5">
                <span
                  className="font-mono text-[10px] tracking-[0.18em] uppercase"
                  style={{ color: '#E8C57E' }}
                >
                  {content.placeholder}
                </span>
              </div>
            )}

            {/* Play button */}
            <div className="absolute inset-0 grid place-items-center">
              <div
                className="w-20 h-20 rounded-full grid place-items-center"
                style={{
                  background: 'rgba(250,246,238,0.95)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <Play
                  size={26}
                  fill="#1F4D3A"
                  stroke="none"
                  style={{ marginLeft: 3 }}
                />
              </div>
            </div>
          </div>
        )}

        {content.caption && (
          <p
            className="mt-4 text-center font-mono text-[13px] tracking-[0.08em]"
            style={{ color: '#6B7A72' }}
          >
            {content.caption}
          </p>
        )}
      </div>
    </section>
  );
}
