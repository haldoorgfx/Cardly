/**
 * lib/cms/types.ts
 *
 * Type definitions for the Content CMS (Phase 3).
 * Block content shapes are typed per block type.
 */

// ── Core DB row types ──────────────────────────────────────────

export type CmsPageStatus = 'draft' | 'published';

export interface CmsPage {
  id: string;
  slug: string;
  title: string;
  status: CmsPageStatus;
  seo: PageSeo;
  published_version: number | null;
  created_by: string | null;
  updated_at: string;
}

export interface CmsBlock {
  id: string;
  page_id: string;
  type: BlockType;
  content: BlockContent;
  position: number;
  created_at: string;
}

export interface NavItem {
  label: string;
  href?: string;
  children?: NavItem[];
}

export interface CmsNavigation {
  id: string;
  location: 'header' | 'footer';
  items: NavItem[];
  updated_at: string;
}

export interface CmsMedia {
  id: string;
  url: string;
  filename: string | null;
  alt: string | null;
  width: number | null;
  height: number | null;
  size_bytes: number | null;
  mime: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface CmsPageVersion {
  id: string;
  page_id: string;
  version_num: number;
  snapshot: PageSnapshot;
  created_by: string | null;
  created_at: string;
}

// ── SEO ───────────────────────────────────────────────────────

export interface PageSeo {
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
}

// ── Version snapshot ──────────────────────────────────────────

export interface PageSnapshot {
  page: CmsPage;
  blocks: CmsBlock[];
}

// ── Block type registry ───────────────────────────────────────

export type BlockType =
  | 'hero'
  | 'richText'
  | 'sectionHeader'
  | 'featuresGrid'
  | 'stepsGrid'
  | 'faqAccordion'
  | 'cta'
  | 'logoStrip'
  | 'pricingCards'
  | 'comparisonTable'
  | 'testimonial'
  | 'teamGrid'
  | 'pressSection'
  | 'useCasesGrid'
  | 'tabInterface'
  | 'contactChannels'
  | 'categoryGrid'
  | 'programCards'
  | 'proseSections'
  | 'statsStrip'
  | 'videoDemo';

// ── Block content shapes ──────────────────────────────────────

export interface CtaButton {
  label: string;
  href: string;
  variant: 'primary' | 'secondary' | 'outline' | 'link';
}

export interface HeroContent {
  eyebrow?: string;
  headline: string;
  headlineAccent?: string; // portion of headline to render in accent color
  subheadline?: string;
  buttons?: CtaButton[];
  imageUrl?: string;
  imageAlt?: string;
  layout?: 'split' | 'centered' | 'left';
  statsStrip?: StatItem[];
  trustBadges?: string[];
}

export interface RichTextContent {
  markdown: string;
}

export interface SectionHeaderContent {
  eyebrow?: string;
  headline: string;
  subtext?: string;
  align?: 'center' | 'left';
}

export interface FeatureCard {
  icon?: string;        // lucide icon name or emoji
  label?: string;
  title: string;
  body: string;
}

export interface FeaturesGridContent {
  header?: SectionHeaderContent;
  cards: FeatureCard[];
  background?: 'light' | 'dark';
  columns?: 2 | 3;
}

export interface StepItem {
  step: number;
  icon?: string;
  title: string;
  body: string;
  duration?: string;
  bullets?: string[];
}

export interface StepsGridContent {
  header?: SectionHeaderContent;
  steps: StepItem[];
  layout?: 'horizontal' | 'alternating';
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqAccordionContent {
  header?: SectionHeaderContent;
  items: FaqItem[];
  defaultOpen?: number;
}

export interface CtaContent {
  headline: string;
  subtext?: string;
  buttons?: CtaButton[];
  background?: 'default' | 'dark' | 'gradient';
}

export interface LogoItem {
  name: string;
  logo_url?: string;
}

export interface LogoStripContent {
  label?: string;
  logos: LogoItem[];
}

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface PlanCard {
  id: string;         // 'free' | 'pro' | 'studio'
  name: string;
  headline: string;
  price: string;
  period: string;
  blurb: string;
  features: PlanFeature[];
  ctaLabel: string;
  ctaHref: string;
  highlighted?: boolean;
  badge?: string;
}

export interface PricingCardsContent {
  header?: SectionHeaderContent;
  plans: PlanCard[];
  showToggle?: boolean;
  trialBanner?: string;
  trustItems?: string[];
  teaser?: boolean;   // true = show only 3 cards, no toggle (landing page version)
}

export interface ComparisonRow {
  feature: string;
  free: string | boolean;
  pro: string | boolean;
  studio: string | boolean;
}

export interface ComparisonGroup {
  label: string;
  rows: ComparisonRow[];
}

export interface ComparisonTableContent {
  header?: SectionHeaderContent;
  groups: ComparisonGroup[];
}

export interface TestimonialContent {
  quote: string;
  authorName: string;
  authorRole: string;
  avatarUrl?: string;
}

export interface TeamMember {
  name: string;
  role: string;
  location?: string;
  avatar_url?: string;
  is_open_role?: boolean;
  apply_href?: string;
}

export interface TeamGridContent {
  header?: SectionHeaderContent;
  members: TeamMember[];
  ctaButton?: CtaButton;
}

export interface PressMention {
  publication: string;
  date: string;
  quote: string;
}

export interface PressSectionContent {
  label?: string;
  mentions: PressMention[];
}

export interface UseCaseItem {
  id: string;
  label: string;
  title: string;
  body: string;
  icon?: string;
  href?: string;
  thumbnail_url?: string;
}

export interface UseCasesGridContent {
  header?: SectionHeaderContent;
  cases: UseCaseItem[];
  columns?: 2 | 3 | 6;
}

export interface TabExample {
  title: string;
  role?: string;
}

export interface TabProblem {
  text: string;
}

export interface TabItem {
  id: string;
  label: string;
  icon?: string;
  headline: string;
  blurb: string;
  color?: string;
  problems?: TabProblem[];
  examples?: TabExample[];
}

export interface TabInterfaceContent {
  tabs: TabItem[];
}

export interface ContactChannel {
  icon: string;
  label: string;
  href: string;
  description: string;
}

export interface ContactChannelsContent {
  header?: SectionHeaderContent;
  channels: ContactChannel[];
  reasons?: string[];
}

export interface HelpArticle {
  title: string;
  href: string;
}

export interface HelpCategory {
  icon: string;
  title: string;
  description: string;
  articles: HelpArticle[];
}

export interface CategoryGridContent {
  header?: SectionHeaderContent;
  categories: HelpCategory[];
}

export interface ProgramItem {
  icon?: string;
  tag?: string;
  title: string;
  description: string;
  bullets: string[];
}

export interface ProgramCardsContent {
  header?: SectionHeaderContent;
  programs: ProgramItem[];
}

export interface ProseSection {
  h2: string;
  paragraphs: string[];
}

export interface ProseSectionsContent {
  eyebrow?: string;
  headline: string;
  updatedAt?: string;
  sections: ProseSection[];
  warningBanner?: string;
}

export interface StatItem {
  label: string;
  value: string;
}

export interface StatsStripContent {
  stats: StatItem[];
  variant?: 'light' | 'dark' | 'inline';
}

export interface VideoDemoContent {
  label?: string;
  headline: string;
  videoUrl?: string;
  caption?: string;
  placeholder?: string;
}

// ── Discriminated union for type-safe block content ───────────

export type BlockContent =
  | HeroContent
  | RichTextContent
  | SectionHeaderContent
  | FeaturesGridContent
  | StepsGridContent
  | FaqAccordionContent
  | CtaContent
  | LogoStripContent
  | PricingCardsContent
  | ComparisonTableContent
  | TestimonialContent
  | TeamGridContent
  | PressSectionContent
  | UseCasesGridContent
  | TabInterfaceContent
  | ContactChannelsContent
  | CategoryGridContent
  | ProgramCardsContent
  | ProseSectionsContent
  | StatsStripContent
  | VideoDemoContent;

// ── Page with blocks (hydrated) ───────────────────────────────

export interface CmsPageWithBlocks extends CmsPage {
  blocks: CmsBlock[];
}
