// Default option sets for the two "care" registration field kinds added in
// 067_dietary_accessibility.sql (G6 · D01).
//
// WHY THIS FILE EXISTS
//   An organizer can add a `dietary` or `accessibility` field without editing its
//   option list, in which case `registration_form_fields.options` is empty and the
//   clients render these defaults. The registration API validates submitted tags
//   against the field's options — so if it did not fall back to the SAME defaults,
//   every answer an attendee gave would be silently discarded on insert.
//
//   Keep these in sync with:
//     • components/events/RegistrationFormBuilder.tsx   (DIETARY_TAGS / ACCESSIBILITY_TAGS)
//     • components/registration/RegistrationClient.tsx
//     • eventera_mobile/lib/attendee/register/needs_field.dart

export const DEFAULT_DIETARY_OPTIONS: readonly string[] = [
  'Halal',
  'Vegetarian',
  'Vegan',
  'Gluten-free',
  'Nut allergy',
  'Dairy-free',
  'Kosher',
  'No restrictions',
];

export const DEFAULT_ACCESSIBILITY_OPTIONS: readonly string[] = [
  'Wheelchair access',
  'Step-free route',
  'Sign language',
  'Hearing loop',
  'Large print',
  'Quiet space',
  'Assistance animal',
  'Other',
];

/**
 * The tags a submission may legitimately carry for one field kind.
 * `configured` is whatever the organizer saved on the field; when they saved
 * nothing, the clients showed the defaults, so the defaults are what's allowed.
 */
export function allowedNeedsTags(
  kind: 'dietary' | 'accessibility',
  configured: string[],
): string[] {
  if (configured.length > 0) return configured;
  return Array.from(
    kind === 'dietary' ? DEFAULT_DIETARY_OPTIONS : DEFAULT_ACCESSIBILITY_OPTIONS,
  );
}
