/**
 * Client-safe constants for the platform feature kill-switch system — no
 * server-only imports (no next/headers, no supabase server client) so this
 * file can be imported directly from 'use client' components. The server-only
 * enforcement functions (isPlatformFeatureEnabled, getAllPlatformFeatureFlags)
 * live in lib/features/platform.ts, which re-exports everything here too —
 * server code should keep importing from '@/lib/features/platform'.
 */

export const PLATFORM_FEATURE_KEYS = [
  'qa',
  'polls',
  'networking',
  'speed_networking',
  'community',
  'photos',
  'gamification',
  'speakers',
  'sponsors',
  'exhibitors',
  'catering',
  'entitlements',
  'multi_day',
  'communications',
  'waitlist',
  'promote',
  'ai_copilot',
  'developer_api',
  'white_label',
  'card_studio',
  'analytics',
  'teams',
  'feedback',
] as const;

export type PlatformFeatureKey = typeof PLATFORM_FEATURE_KEYS[number];

export interface PlatformFeatureGroup {
  title: string;
  keys: PlatformFeatureKey[];
}

/** Grouping + display order for the admin toggle UI only — not used for enforcement. */
export const PLATFORM_FEATURE_GROUPS: PlatformFeatureGroup[] = [
  // Round 2 (2026-08): the flagship card feature + org-wide analytics get
  // their own group up top, ahead of Engagement, since they're the two most
  // likely to matter to a founder trying to launch with "only the basics".
  { title: 'Core extras', keys: ['card_studio', 'analytics'] },
  { title: 'Engagement', keys: ['qa', 'polls', 'networking', 'speed_networking', 'community', 'photos', 'gamification', 'feedback'] },
  { title: 'Program', keys: ['speakers', 'sponsors', 'exhibitors'] },
  { title: 'Operations', keys: ['catering', 'entitlements', 'multi_day', 'communications', 'waitlist', 'promote'] },
  { title: 'Platform', keys: ['ai_copilot', 'developer_api', 'white_label', 'teams'] },
];

export function platformFlagName(key: PlatformFeatureKey): string {
  return `platform:${key}`;
}

/** Label + description fallback, mirroring migration 122's seed data — used
 * when a key has no row yet (new key shipped before its row exists, or the
 * migration hasn't been pasted in). Keeps getAllPlatformFeatureFlags() and
 * the admin PATCH route's insert-on-first-toggle path from ever showing/
 * writing a raw key instead of a real label. */
export const PLATFORM_FEATURE_META: Record<PlatformFeatureKey, { label: string; description: string }> = {
  qa:                { label: 'Q&A',                     description: 'Live audience questions on the event page + organizer moderation' },
  polls:             { label: 'Polls',                   description: 'Live polls on the event page + organizer results view' },
  networking:        { label: 'Attendee networking',     description: 'Attendee-to-attendee messaging and connection requests' },
  speed_networking:  { label: 'Speed networking',        description: 'Timed 1:1 attendee matchmaking sessions' },
  community:         { label: 'Community',               description: 'Event-wide attendee post feed / discussion wall' },
  photos:            { label: 'Photo wall',               description: 'Attendee photo uploads + moderated public wall' },
  gamification:      { label: 'Gamification',            description: 'Leaderboard and point-scoring for Q&A/polls/networking' },
  speakers:          { label: 'Speakers & CFP',           description: 'Call-for-papers submissions + public speaker profiles' },
  sponsors:          { label: 'Sponsors',                 description: 'Sponsor listings on the public event page' },
  exhibitors:        { label: 'Exhibitors',               description: 'Exhibitor booth portal, products, and lead capture' },
  catering:          { label: 'Catering & dietary',       description: 'Attendee dietary/accessibility capture + catering counts' },
  entitlements:      { label: 'Entitlements',             description: 'Add-on entitlements (meals, swag, sessions) per registration' },
  multi_day:         { label: 'Multi-day events',         description: 'Multiple event days/sessions under one event' },
  communications:    { label: 'Communications',           description: 'Organizer broadcast email/WhatsApp to attendees' },
  waitlist:          { label: 'Waitlist',                 description: 'Attendee waitlist + organizer invite-to-register' },
  promote:           { label: 'Promote & promoter links', description: 'Promo codes, promoter links, and promoted listings' },
  ai_copilot:        { label: 'AI Copilot',               description: 'Claude-powered organizer chat assistant' },
  developer_api:     { label: 'Developer API',            description: 'API keys, webhooks, and the public v1 API' },
  white_label:       { label: 'White-label branding',     description: 'Custom domain + branding removal for Studio organizers' },
  card_studio:       { label: 'Card Studio',               description: 'Eventera Card design & generation — canvas editor, public claim flow, and PNG rendering' },
  analytics:         { label: 'Analytics & reports',       description: 'Event analytics, reports, revenue, roster, and source-analytics dashboards' },
  teams:             { label: 'Studio team accounts',      description: 'Multi-user team accounts with shared, role-based access to Studio-plan events' },
  feedback:          { label: 'Event feedback',            description: 'Post-event attendee feedback surveys and organizer ratings' },
};

export interface PlatformFeatureFlagRow {
  key: PlatformFeatureKey;
  flag: string;
  label: string;
  description: string | null;
  enabled: boolean;
}
