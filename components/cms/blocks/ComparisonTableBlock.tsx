import { Check, Minus } from 'lucide-react';
import type { ComparisonTableContent } from '@/lib/cms/types';
import { SectionHeaderBlock } from './SectionHeaderBlock';

function Cell({ val }: { val: string | boolean }) {
  if (val === true) return <Check size={16} strokeWidth={2.5} style={{ color: '#1F4D3A' }} className="mx-auto" />;
  if (val === false) return <Minus size={16} strokeWidth={2} className="mx-auto text-[#C9C3B1]" />;
  return <span className="text-[13px] text-[#3A4A42]">{val}</span>;
}

export function ComparisonTableBlock({ content }: { content: ComparisonTableContent }) {
  // Defensive: free-form block JSON may omit `groups` — render empty, never throw.
  const { header } = content;
  const groups = content.groups ?? [];

  return (
    <section className="relative">
      <div className="mx-auto max-w-[1200px] px-5 lg:px-10 py-20 lg:py-28">
        {header && (
          <div className="max-w-[760px] mb-12">
            <SectionHeaderBlock content={header} compact />
          </div>
        )}

        <div className="rounded-2xl border border-[#E5E0D4] overflow-hidden">
          {/* Header row */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr] bg-[#FAF6EE] border-b border-[#E5E0D4]">
            <div className="px-5 py-4" />
            {['Free', 'Pro', 'Studio'].map((plan) => (
              <div key={plan} className="px-4 py-4 text-center font-display font-semibold text-[14px] text-[#0F1F18]">
                {plan}
              </div>
            ))}
          </div>

          {groups.map((group, gi) => (
            <div key={gi}>
              {/* Group label */}
              <div className="px-5 py-3 bg-[#F5F3EF] border-b border-[#E5E0D4]">
                <span className=" text-[11px] tracking-[0.18em] uppercase text-[#65736B]">
                  {group.label}
                </span>
              </div>
              {(group.rows ?? []).map((row, ri) => (
                <div key={ri} className={`grid grid-cols-[2fr_1fr_1fr_1fr] border-b border-[#E5E0D4] last:border-b-0 hover:bg-[#FAF6EE] transition-colors`}>
                  <div className="px-5 py-3.5 text-[13px] text-[#0F1F18] font-medium">{row.feature}</div>
                  <div className="px-4 py-3.5 text-center"><Cell val={row.free} /></div>
                  <div className="px-4 py-3.5 text-center"><Cell val={row.pro} /></div>
                  <div className="px-4 py-3.5 text-center"><Cell val={row.studio} /></div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
