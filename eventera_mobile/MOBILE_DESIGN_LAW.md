# Mobile Design Law — Eventera (Flutter)

**This file is binding.** Any screen that violates it is wrong, no matter how good it looks in isolation. Read it fully before writing a single widget. It exists because earlier passes produced screens that looked like a web page shrunk onto a phone: too much dark green, too much text, too many colors.

---

## 1. The green rule (the one people get wrong)

`AppColors.forest` (`#1F4D3A`) is **structural**, not decorative. A screen may use forest as a *fill* in exactly these four places, and nowhere else:

1. **The top role header band** — the single forest strip at the top of a role surface (Organizer / Speaker / Sponsor). One per screen.
2. **Exactly ONE primary CTA** — the single most important action on the screen. Everything else is a text button, an outline button, or a plain list row.
3. **The single "tools" entry card** — the one card that opens a role's toolset. Not every card. One.
4. **Full-screen scanner surfaces** — camera screens and their result states use `AppColors.forestDark` as the page background. This is the only place a dark theme is permitted.

Everything else is `AppColors.surface` (white) on `AppColors.canvas` (cream), with `AppColors.border` hairlines.

**Concretely:** list rows are white. Session cards are white. Lead cards are white. Stat tiles are white. Section headers are ink text on cream — not green bands. A green icon on a `forestSoft` chip is fine; a green card is not.

If you find yourself painting a third or fourth thing forest, you have misread this section.

## 2. Gold

`AppColors.gold` appears **at most once per screen**, and only to mark something genuinely singular — the featured item, the live state, the earned thing. Gold is never a border color, never a background fill for a card, never used for two things on the same screen. If nothing on the screen is singular, the screen has no gold.

## 3. Color budget

A screen may show at most: ink, ink-soft, ink-muted, cream, white, border, **one** forest fill (per §1), **one** gold accent (per §2), and status colors only where a status genuinely exists (success / warning / danger / info). That is the whole palette. Invent no colors. Do not tint cards. Do not gradient anything except the branded hero on the splash.

## 4. Text

Phone screens are read, not studied. Every string earns its place.

- Screen title: 2–4 words.
- Section label: 1–3 words, `AppText.seclab`.
- A list row gets a title and **at most one** line of supporting text.
- No paragraph anywhere except empty states and the one-sentence explainer under a screen title.
- Never repeat in body copy what the title already said.
- No exclamation marks. No "Let's…", no "Oops", no motivational filler.
- Numbers speak for themselves — `1,204` beats "You have 1,204 attendees registered so far".

If a screen has more than ~40 words of chrome text, cut it.

## 5. Type

Two fonts. Ever.

- **Plus Jakarta Sans** — headings and display, via `AppText.h1/h2/h3/title/subhead/displayMd/btn`.
- **Inter** — body, labels, captions, and **all numbers, IDs, codes and timestamps**, via `AppText.body/bodySm/caption/seclab/label/numLg/numMd/numSm`.

There is **no monospace font** in this app. `AppText.mono()` still exists for API compatibility but renders Inter — do not reach for it in new code, and never add a monospace family. Uppercase + letter-spacing on a micro-label is fine; the *font* stays Inter.

## 6. Layout

- Screen padding: `AppSpace.lg` (20).
- Card radius: `AppRadius.card` (15). Buttons/inputs: 12. Sheets: 20. Pills: 999.
- Shadows: `AppShadow.soft` on cards, `AppShadow.lift` on raised/floating elements, `AppShadow.tabbar` on the bottom bar. Nothing else. No glows.
- Hairline borders (`AppColors.border`, 1px) do the separating work — not shadows, not color blocks.
- Minimum hit target 44×44. Respect iOS safe areas top and bottom; never let content sit under the bottom bar or the notch.
- Generous vertical rhythm. Whitespace is the design.

## 7. States are not optional

Every list, every detail screen, every scanner:

- **Loading** — a skeleton that matches the real layout (`AppColors.creamSoft` blocks), or a "camera initializing" frame on scanners. Never a bare centered spinner on a full screen.
- **Empty** — an icon in a `forestSoft` rounded square, a 2–4 word heading, one sentence, and (if there is one) a single action. Calm, not apologetic.
- **Error** — plain statement of what failed plus a Retry. Never a raw exception string. Never a red full-screen.
- **Permission denied** (camera) — explain in one sentence, offer "Open settings".

## 8. Scanners (the only dark surface)

- Page background `AppColors.forestDark`. Camera fills the frame; a rounded reticle marks the target.
- The result state takes over the full screen with a single dominant status color: success `#2D7A4F`, already-redeemed `#C97A2D`, not-entitled / outside-window `#B8423C`.
- Result screens show: status word, attendee name, ticket name, and **at most two** supporting facts. Nothing else.
- **Dietary information appears on meal scans only** (`entitlement.type == 'meal'`). Never on entry, transport, merch, or any other scan. This is a privacy rule, not a layout preference.
- A persistent connection indicator (online / offline+queued / syncing) sits at the top of every scanner.

## 9. Navigation

- The organizer shell's bottom bar has a **raised center Scan FAB**. Scan is the most important action in the field app and is reachable from every organizer screen.
- No Admin tab, no Admin screen, no admin affordance anywhere in the mobile app. Platform administration is web-only.
- The role switcher is **one component**, identical in layout wherever it appears — attendee, organizer, speaker, sponsor.
- Role chips sit under the username in the profile header, compact, same treatment on every role.

## 10. Attendee and organizer do not bleed

The attendee experience contains no organizer tooling. The organizer shell contains the professional roles (organizer / speaker / sponsor / staff). Switching between them is the Airbnb model: one account, no role choice at login, a "Switch to organizing" row in the profile, bidirectional, persisted in `lib/app_mode.dart`.

An organizer surface never renders an attendee tab bar, and vice versa.

## 11. Functionality is the design

A control that does not do the thing it says is a bug, not a placeholder. No "Coming soon". No toggles that save nothing. No stat tiles showing invented numbers. If the data isn't there yet, show the empty state — that is honest and it is also the design.

---

## Quick self-check before you call a screen done

1. Count the forest fills. Is it ≤ 1 (excluding the header band and a scanner background)?
2. Count the gold elements. Is it ≤ 1?
3. Count the words of chrome text. Under 40?
4. Are all cards white on cream?
5. Is every number in Inter? Is there any monospace? (There must not be.)
6. Does it have loading, empty, and error states?
7. Does every button actually do something?
8. Does it clear the notch and sit above the bottom bar?
9. Any Admin affordance? (There must not be.)

Nine yeses, or it isn't finished.
