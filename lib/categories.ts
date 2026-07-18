/**
 * Canonical event categories.
 *
 * `category` on an event is a free-text field, but every UI that lets an
 * organizer pick one — and every discovery surface that browses by one —
 * draws from this single list so the options stay consistent across the app.
 * Alphabetical; `Other` is offered only at creation time (see below), never
 * as a browse target.
 */
import { slugifyBase } from '@/lib/slug';

export const EVENT_CATEGORIES = [
  'Arts',
  'Business',
  'Comedy',
  'Community',
  'Conference',
  'Culture',
  'Design',
  'Education',
  'Faith',
  'Fashion',
  'Film',
  'Finance',
  'Food',
  'Gaming',
  'Health',
  'Kids & Family',
  'Marketing',
  'Music',
  'Networking',
  'Nightlife',
  'Nonprofit',
  'Photography',
  'Science',
  'Sports',
  'Startup',
  'Tech',
  'Travel',
  'Wellness',
  'Workshop',
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

/** Catch-all offered at creation only — not a discovery category. */
export const OTHER_CATEGORY = 'Other';

/** Full option list for the create/edit form (canonical set + `Other` last). */
export const CATEGORY_OPTIONS = [...EVENT_CATEGORIES, OTHER_CATEGORY];

/** URL slug for a category label, e.g. `"Kids & Family"` → `"kids-family"`. */
export function categorySlug(label: string): string {
  return slugifyBase(label);
}

const SLUG_TO_LABEL = new Map(EVENT_CATEGORIES.map(c => [categorySlug(c), c]));

/** Canonical label for a URL slug, or `null` if the slug isn't a category. */
export function labelFromSlug(slug: string): EventCategory | null {
  return SLUG_TO_LABEL.get(slug.toLowerCase().trim()) ?? null;
}

/** Every valid category slug — for route validation. */
export const CATEGORY_SLUGS = EVENT_CATEGORIES.map(categorySlug);
