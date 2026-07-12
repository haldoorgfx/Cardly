# Eventera — UI/UX · Accessibility · Parity · Flows Audit (2026-07-07, round 2)

Three parallel audits: (1) responsiveness/a11y/consistency, (2) web↔mobile feature parity, (3) public-page user-flow simplicity. Verified against code. `flows.md` and `parity.md` sit beside this file.

Legend: ✅ fixed this pass · 🟡 partial/started · ⬜ backlog.

---

## A. UI/UX · Accessibility · Responsiveness

### Fixed this pass ✅
- **Settings "infinite scroll" → sub-tabs.** The General settings page stacked an 820-line profile editor + workspace prefs + notifications + danger in one scroll. Now split into **Profile · Preferences · Notifications · Account** sub-tabs (`app/(app)/settings/GeneralSettings.tsx`, `SettingsClient.tsx` renders one section, shared save/state preserved).
- **Toggle a11y** — both switch components (`ProfileSettings.tsx`, `SettingsClient.tsx`) now have `role="switch"`, `aria-checked`, and a visible `focus-visible` ring.
- **Registrations table mobile overflow** — wrapped in `overflow-x-auto` (`components/events/RegistrationsTable.tsx`); no longer breaks the page < 375px.

### Verified NOT a bug (agent was wrong)
- CanvasEditor `.prop-input` focus ring — the audit claimed `outline:none` with no replacement, but line 2356 already defines a `:focus` outline. No change needed.

### Backlog ⬜ (real, from the audit)
| Sev | Issue | Where | Fix |
|-----|-------|-------|-----|
| High | Muted text `#6B7A72` on cream borders on WCAG-AA contrast (~4:1) for small body text | widespread | Use `#3A4A42` (ink-soft) for small secondary text; keep muted for ≥16px / decorative |
| High | Gold `#E8C57E` as text on white fails AA | buttons/badges | Use `#C9A45E` for gold *text*; keep `#E8C57E` for fills |
| High | Profile editor still 8 stacked sections | `components/account/ProfileSettings.tsx` | Same sub-tab treatment as Settings (Profile / Work / Preferences) |
| Med | Event overview + analytics use hardcoded `max-w-[1200px]` not `PageShell` | `app/(app)/events/[id]/page.tsx` etc. | Wrap in `PageShell width="wide"` for consistent gutters |
| Med | Icon-only buttons missing `aria-label` (real subset — not the inflated "279") | various | Add `aria-label` per icon button |
| Med | Some inputs/buttons < 44px tap target on mobile | various | Min 44px height on touch |
| Low | ~9 distinct page max-widths in use; standardize to the 4 `PageShell` variants (760/900/1200/1400) | global | Migrate stragglers to `PageShell` |

**Width consistency verdict:** the system is good (`PageShell` has narrow/default/wide/full) — the problem is *pages that bypass it*, not the system. Fix = adopt `PageShell` everywhere.

---

## B. Web ↔ Mobile Feature Parity

**Mobile organizer mode is effectively a check-in kiosk, not an event manager.** Matrix in `parity.md`.

| Role | Mobile functional? | Biggest gaps |
|------|--------------------|--------------|
| Attendee | ~87% ✅ | no ticket transfer/cancel; Stripe/Flutterwave checkout dead-ends (WaafiPay only) |
| Organizer | ~35% ❌ | **cannot publish, manage tickets, approve, see analytics, send comms** on mobile — all web-only |
| Speaker | ~60% ⚠️ | profile edit + Q&A answering punt to web (read-only) |
| Sponsor/Exhibitor | ~30% ❌ | **16 DRAFT/stub screens**; lead list/export web-only; dead "Request meeting" button (`directory_preview_screen.dart:77`) |

**16 non-functional mobile screens** (all under `lib/roles/**` + `lib/screens/organizer/zone_editor_screen.dart`), self-labelled DRAFT. Zero mobile-only features (nothing exists on mobile that's missing on web).

Backlog priorities: mobile ticket management + publish + approvals (organizer), finish or hide the sponsor/speaker DRAFT screens, add Stripe to mobile checkout.

---

## C. Public pages & user flows (see `flows.md`)

### Fixed this pass ✅
- **Ticket-lookup privacy bug** — `.or(attendee_email.eq.${email}...)` with a null account email became `attendee_email.eq.` and matched blank-email rows (could show another person's ticket). New `lib/registration/ownership.ts` omits the email clause when empty and strips `.or()`-breaking chars. Applied to both `my-tickets/page.tsx` and `my-tickets/[id]/page.tsx`.

### Flows that don't end in a clear success state ⬜
1. **Duplicate registration** — user fills the whole form, then is rejected at payment ("already registered") with no next-step link. Fix: check at step 0 + show a "You're registered" badge on the event page.
2. **Card-generation failure** — error shown, **no retry**; the card lives in sessionStorage and is lost on tab close.
3. **Payment-processor mismatch** — organizer enabled Flutterwave but event is USD → silent fallback to Stripe; user expecting mobile-money gets a card form. Fix: pick processor *before* the form.
4. **Auth has no `?next=`** on some entry points → user can't return to the event after signing up.
5. **Missing data = blank pages** (no speakers/tickets → empty, not "coming soon").

Top simplifications: move duplicate + processor checks before the form; surface the platform fee at step 1 (not checkout); add a "Verifying payment…" state on gateway return; add empty states.

---

## Fix summary

### Pass 1
✅ Settings → sub-tabs · Toggle a11y (role/aria-checked/focus) · Registrations table mobile overflow · Ticket-lookup null-email privacy bug (+ shared ownership helper).

### Pass 2 (continued)
✅ **Checkout fee is now honest** — client showed a hardcoded 3.5% fee the server never charged. Now passes the real fee model (`feeBearer` + plan `feePercent`) so the displayed total == `splitTicketAmount`'s charged amount. Absorb mode shows no added fee (attendee pays face); pass mode shows the true 5/2/0%. (`RegistrationClient.tsx`, `register/page.tsx`)
✅ **Card-generation retry** — failed Eventera Card render now shows a "Try again" button + reassuring copy instead of a dead error. (`ConfirmPage.tsx`)
✅ **Toast dismiss** got an `aria-label`.
✅ **Mobile guest approvals (parity)** — approval-gated registrations now appear on the mobile Attendees tab with inline Approve/Decline (+ a confirm sheet), backed by a new `approve_registration` RPC (`supabase/075_approve_registration_rpc.sql`, owner/staff-scoped, capacity-checked). Depends on `074` (status column) + `075` being pasted.
✅ **Dead "Request meeting" button** in the exhibitor directory preview now explains it's a preview instead of doing nothing.

**Verified-not-bugs** (agents overstated): registration "fill form then rejected" — the register page already short-circuits `alreadyRegistered` up-front with the correct null-email guard; Modal/dialog/MarketingNav close+hamburger buttons already have `aria-label`s; CanvasEditor already has a focus ring.

### Still backlog (biggest remaining)
Profile editor → sub-tabs · mobile organizer ticket-management + publish + walk-in · finish/hide the sponsor & speaker DRAFT screens · Stripe on mobile checkout · muted/gold text contrast sweep · adopt PageShell on the pages that bypass it.

All changes type-check + lint clean; web production build passes.
