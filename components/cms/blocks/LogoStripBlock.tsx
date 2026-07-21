/* eslint-disable @next/next/no-img-element */
import type { LogoStripContent } from '@/lib/cms/types';
import { safeBlockSrc } from '@/lib/cms/href';

interface LogoStripBlockProps {
  content: LogoStripContent;
}

function getMonogram(name: string): string {
  // Authored JSON can leave `name` unset — .trim() on undefined would 500 the page.
  if (!name) return '';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return name.slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function LogoStripBlock({ content }: LogoStripBlockProps) {
  return (
    <section
      className="border-y"
      style={{ borderColor: '#E5E0D4', background: 'rgba(250,246,238,0.4)' }}
    >
      <div className="mx-auto max-w-[1200px] px-5 lg:px-10 py-10 lg:py-12">
        {content.label && (
          <p
            className="text-center  text-[11px] tracking-[0.22em] uppercase mb-8"
            style={{ color: '#65736B' }}
          >
            {content.label}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-10">
          {/* Defensive: free-form block JSON may omit `logos` — render empty, never throw. */}
          {(content.logos ?? []).map((logo, i) => {
            const logoUrl = safeBlockSrc(logo.logo_url);
            return logoUrl ? (
              <img
                key={i}
                src={logoUrl}
                alt={logo.name}
                className="h-8 w-auto object-contain"
                style={{ filter: 'grayscale(1)', opacity: 0.55 }}
              />
            ) : (
              <div
                key={i}
                className="flex items-center justify-center w-12 h-12 rounded-full border  text-[12px] font-semibold tracking-wider"
                style={{
                  borderColor: '#E5E0D4',
                  color: '#65736B',
                  background: '#FFFFFF',
                }}
                title={logo.name}
              >
                {getMonogram(logo.name)}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
