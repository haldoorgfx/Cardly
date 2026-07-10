import Link from 'next/link';
import type { CategoryGridContent } from '@/lib/cms/types';
import { SectionHeaderBlock } from './SectionHeaderBlock';

export function CategoryGridBlock({ content }: { content: CategoryGridContent }) {
  const { header, categories } = content;

  return (
    <section className="relative">
      <div className="mx-auto max-w-[1200px] px-5 lg:px-10 py-20 lg:py-28">
        {header && (
          <div className="mb-12">
            <SectionHeaderBlock content={header} compact />
          </div>
        )}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((cat, i) => (
            <div key={i} className="bg-white border border-[#E5E0D4] rounded-2xl p-6 lg:p-7">
              <div className="flex items-center gap-3 mb-5">
                <span className="w-10 h-10 rounded-xl bg-[#E8EFEB] text-[#1F4D3A] grid place-items-center  text-[15px]">
                  {cat.icon}
                </span>
                <h3 className="font-display font-semibold text-[#0F1F18] text-[17px] tracking-tight">
                  {cat.title}
                </h3>
              </div>
              <p className="text-[14px] text-[#3A4A42] leading-[1.6] mb-5">{cat.description}</p>
              <ul className="space-y-1.5">
                {cat.articles.map((article) => (
                  <li key={article.title}>
                    <Link href={article.href}
                      className="text-[13px] text-[#1F4D3A] hover:underline hover:text-[#163828] transition-colors">
                      {article.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
