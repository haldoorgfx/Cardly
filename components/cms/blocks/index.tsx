/**
 * components/cms/blocks/index.tsx
 *
 * Block component registry + BlockRenderer dispatcher.
 * Each block type maps to a React component that accepts typed content.
 */

import type { CmsBlock, BlockType } from '@/lib/cms/types';

// ── Block imports ─────────────────────────────────────────────────────────────
export { HeroBlock }           from './HeroBlock';
export { RichTextBlock }       from './RichTextBlock';
export { SectionHeaderBlock }  from './SectionHeaderBlock';
export { FeaturesGridBlock }   from './FeaturesGridBlock';
export { StepsGridBlock }      from './StepsGridBlock';
export { FaqAccordionBlock }   from './FaqAccordionBlock';
export { CtaBlock }            from './CtaBlock';
export { LogoStripBlock }      from './LogoStripBlock';
export { PricingCardsBlock }   from './PricingCardsBlock';
export { ComparisonTableBlock } from './ComparisonTableBlock';
export { TestimonialBlock }    from './TestimonialBlock';
export { TeamGridBlock }       from './TeamGridBlock';
export { PressSectionBlock }   from './PressSectionBlock';
export { UseCasesGridBlock }   from './UseCasesGridBlock';
export { TabInterfaceBlock }   from './TabInterfaceBlock';
export { ContactChannelsBlock } from './ContactChannelsBlock';
export { CategoryGridBlock }   from './CategoryGridBlock';
export { ProgramCardsBlock }   from './ProgramCardsBlock';
export { ProseSectionsBlock }  from './ProseSectionsBlock';
export { StatsStripBlock }     from './StatsStripBlock';
export { VideoDemoBlock }      from './VideoDemoBlock';

// ── BlockRenderer ─────────────────────────────────────────────────────────────

import { HeroBlock }           from './HeroBlock';
import { RichTextBlock }       from './RichTextBlock';
import { SectionHeaderBlock }  from './SectionHeaderBlock';
import { FeaturesGridBlock }   from './FeaturesGridBlock';
import { StepsGridBlock }      from './StepsGridBlock';
import { FaqAccordionBlock }   from './FaqAccordionBlock';
import { CtaBlock }            from './CtaBlock';
import { LogoStripBlock }      from './LogoStripBlock';
import { PricingCardsBlock }   from './PricingCardsBlock';
import { ComparisonTableBlock } from './ComparisonTableBlock';
import { TestimonialBlock }    from './TestimonialBlock';
import { TeamGridBlock }       from './TeamGridBlock';
import { PressSectionBlock }   from './PressSectionBlock';
import { UseCasesGridBlock }   from './UseCasesGridBlock';
import { TabInterfaceBlock }   from './TabInterfaceBlock';
import { ContactChannelsBlock } from './ContactChannelsBlock';
import { CategoryGridBlock }   from './CategoryGridBlock';
import { ProgramCardsBlock }   from './ProgramCardsBlock';
import { ProseSectionsBlock }  from './ProseSectionsBlock';
import { StatsStripBlock }     from './StatsStripBlock';
import { VideoDemoBlock }      from './VideoDemoBlock';

import type {
  HeroContent, RichTextContent, SectionHeaderContent, FeaturesGridContent,
  StepsGridContent, FaqAccordionContent, CtaContent, LogoStripContent,
  PricingCardsContent, ComparisonTableContent, TestimonialContent, TeamGridContent,
  PressSectionContent, UseCasesGridContent, TabInterfaceContent, ContactChannelsContent,
  CategoryGridContent, ProgramCardsContent, ProseSectionsContent, StatsStripContent,
  VideoDemoContent,
} from '@/lib/cms/types';

export function BlockRenderer({ block }: { block: CmsBlock }) {
  const c = block.content;

  switch (block.type as BlockType) {
    case 'hero':            return <HeroBlock           content={c as HeroContent} />;
    case 'richText':        return <RichTextBlock       content={c as RichTextContent} />;
    case 'sectionHeader':   return <SectionHeaderBlock  content={c as SectionHeaderContent} />;
    case 'featuresGrid':    return <FeaturesGridBlock   content={c as FeaturesGridContent} />;
    case 'stepsGrid':       return <StepsGridBlock      content={c as StepsGridContent} />;
    case 'faqAccordion':    return <FaqAccordionBlock   content={c as FaqAccordionContent} />;
    case 'cta':             return <CtaBlock            content={c as CtaContent} />;
    case 'logoStrip':       return <LogoStripBlock      content={c as LogoStripContent} />;
    case 'pricingCards':    return <PricingCardsBlock   content={c as PricingCardsContent} />;
    case 'comparisonTable': return <ComparisonTableBlock content={c as ComparisonTableContent} />;
    case 'testimonial':     return <TestimonialBlock    content={c as TestimonialContent} />;
    case 'teamGrid':        return <TeamGridBlock       content={c as TeamGridContent} />;
    case 'pressSection':    return <PressSectionBlock   content={c as PressSectionContent} />;
    case 'useCasesGrid':    return <UseCasesGridBlock   content={c as UseCasesGridContent} />;
    case 'tabInterface':    return <TabInterfaceBlock   content={c as TabInterfaceContent} />;
    case 'contactChannels': return <ContactChannelsBlock content={c as ContactChannelsContent} />;
    case 'categoryGrid':    return <CategoryGridBlock   content={c as CategoryGridContent} />;
    case 'programCards':    return <ProgramCardsBlock   content={c as ProgramCardsContent} />;
    case 'proseSections':   return <ProseSectionsBlock  content={c as ProseSectionsContent} />;
    case 'statsStrip':      return <StatsStripBlock     content={c as StatsStripContent} />;
    case 'videoDemo':       return <VideoDemoBlock      content={c as VideoDemoContent} />;
    default:
      return (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 font-mono">
          Unknown block type: {block.type}
        </div>
      );
  }
}
