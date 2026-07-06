# Karta — Implementation Brief (apply the new design onto the existing Cardly codebase)

**Audience:** Claude Code, running **inside the `cardly/` repo**.
**Goal:** Evolve the existing Cardly app into **Karta — a full event-management SaaS** — by implementing the new design across the routes that already exist, removing card-only framing, and adding the new surfaces. **Same tech. No new stack. No fork. No broken features.**

---

## 0. Read first, then plan, then wait
1. Read this file fully.
2. Read the existing `CLAUDE.md`, `BRAND.md`, `tailwind.config.ts`, and skim `app/`, `components/`, `lib/`.
3. Read the new design prototypes in `design-reference/karta/` (folders: `site/`, `directory/`, `support/`, `dashboard/`, `onboarding/`, `studio/`, `emails/`, `speaker/`, `attendee/`, `index.html`). **These are the visual contract** — match layout, spacing, type, components.
4. Produce a short plan for **Milestone A only** (below) and **wait for review**. Do not run ahead.

---

## 1. The reposition (what changes conceptually)
Cardly was framed as a *card tool*. Karta is a **full event-management platform**: registration, tickets, agenda, speakers, check-in, networking, Q&A/polls, sponsors, analytics — **and** the personalized **Karta Card** as the signature differentiator (not the whole product).

- Keep the Karta Card as a **first-class feature**, not the headline of the whole app.
- The codebase **already has** most platform features scaffolded (`components/{events,registration,networking,qa,polls,check-in}`, `lib/{billing,payments,matchmaking,teams,webhooks,…}`, `app/admin/*`). This is mostly **design + wiring + repositioning**, not green-field.

## 2. Tech — LOCKED (do not change, no conflicts)
Next.js 14 App Router · TypeScript · **Supabase** (Postgres + Auth + Storage + RLS) · Tailwind v3 · shadcn/ui · `sharp` (server render) · react-hook-form + zod · pnpm · Vercel.
**Do not** introduce Prisma, Auth.js, Tailwind v4, Redux/Zustand, tRPC, or any new dependency. If a prototype implies one, express it with the existing stack.

## 3. Brand — already correct, just enforce
`tailwind.config.ts` is already forest/cream/gold (`primary #1F4D3A`, `accent #E8C57E`, `cream #FAF6EE`, DM Sans / Inter / JetBrains Mono) and theme-able via CSS vars. The new prototypes use the **same tokens** — so there is no palette migration. Only ensure any remaining old purple/pink (`#6c63ff`, `#f8a4d8`) is gone.

---

## 4. Route-by-route map (design source → target → action)
> Work **behind the existing route structure**. Re-skin/fill in place. `[new]` = create; `[fill]` = exists, bring to spec; `[reskin]` = exists, restyle; `[retire]` = remove/redirect.

**Marketing** — source `design-reference/karta/site/` + `support/`
- `app/(marketing)/page.tsx` — `[reskin]` new platform landing (hero = product shot + Karta Card differentiator).
- `app/(marketing)/pricing/` — `[fill]` Free $0 / Pro $19 / Studio $49.
- `app/(marketing)/{how-it-works,use-cases,about,whats-new,help,status,privacy,terms,dmca,contact,blog,partners}` — `[reskin/fill]` from `site/` + `support/`.

**Public** — source `directory/` + `attendee/` *(responsive web — **no native mobile app**; attendees use the phone browser)*
- `app/(public)/events/` — `[fill]` public event directory (browse/search/categories).
- `app/c/[slug]/` & `app/(public)/e/` — `[fill]` attendee registration → **Karta Card reveal** → event experience (schedule, networking, Q&A, wallet/QR) from `attendee/`. Build mobile-first responsive web, not an app.

**Organizer dashboard** — source `dashboard/`
- `app/(app)/dashboard` — `[fill]` events home + context-aware shell.
- `app/(app)/events/[id]/*` — `[fill]` event overview + sub-tabs: registration, tickets, agenda/sessions, speakers, check-in, networking, Q&A/polls, sponsors, analytics, **Karta Card**. Wire to existing `components/{registration,events,networking,qa,polls,check-in}`.
- `app/(app)/{analytics,team,templates,brand,settings}` — `[fill]`.
- **Onboarding** `[new]` — post-signup wizard (org → brand → first event) from `onboarding/`. Add as `app/(app)/onboarding/` or gate first-run.

**Card Studio** — source `studio/`
- `app/(app)/events/[id]/edit` + `components/editor/*` — `[reskin]` the canvas editor to the new Studio design. **Port logic, restyle only** — keep drag/resize/zoom, debounced autosave, `zones` JSON, `sharp` render.

**Operator / super-admin** — source `dashboard/` operator screens
- `app/admin/*` (analytics, audit, billing, changelog, content, events, flags, media, templates, theme, users) — `[fill]` moderation, support, finance, refunds, plans & flags, system health. Role-gated (super-admin).

**Speaker portal** `[new]` — source `speaker/` → `app/(app)/speaker/` or a `/s/[token]` route.
**Email templates** — source `emails/` → `lib/email/` templates (reskin existing).
**Integrations hub** — `app/(app)/settings` or developer area: categorized connect-your-account (Stripe, Paystack, Flutterwave, Slack, Zapier, Mailchimp, Google, etc.). **Integrate, don't rebuild** — OAuth/connection entries, not custom builds.

## 5. Remove / retire (de-clutter)
- Card-only **positioning/copy** in marketing, metadata, OG, footer (reframe to platform).
- Any leftover **purple/pink tokens** and old hero/upload art tied to the card-tool story.
- MVP-only **"static cards only / no teams / no platform"** language in `CLAUDE.md` & `ROADMAP.md` — rewrite to the platform.
- Dead/duplicate marketing sections that don't fit the platform narrative (confirm before deleting).
- **Do NOT remove** working logic: editor, render pipeline, auth, RLS, payments, existing event/registration/admin code.

## 6. Database (Supabase) — extend, don't replace
Existing core: `profiles`, `events`, `generated_cards`. The platform needs more (tickets, registrations, sessions, speakers, sponsors, connections, messages, questions, polls, orders, teams/members, organizations). **Add tables via new `supabase/migrations/` files** with RLS, scoped by owner/org. Reuse existing `lib/registration`, `lib/teams`, etc. where present. Never rewrite the data layer onto another ORM.

## 7. No-conflict rules
1. One branch per milestone; **STOP for review** after each (§8).
2. Never change the stack or add deps (§2).
3. Edit **in place** behind existing routes; don't create parallel `-v2` routes.
4. Keep Supabase auth + **RLS** patterns; enforce plan/role limits **server-side** (UI gating is cosmetic).
5. Match the prototype's layout/spacing/components exactly; pull colors from `BRAND.md`/config.
6. Keep loading / empty / error states and validated forms (prototypes show the pattern).
7. If a prototype conflicts with working code, **flag it — don't silently rewrite.**

## 8. Build order (vertical, review-gated)
- **Milestone A — Reposition & shell:** rewrite `CLAUDE.md`/`ROADMAP.md`; marketing landing + pricing + nav/footer; dashboard app shell + nav. **STOP.**
- **Milestone B — Organizer core:** dashboard events home, event overview + tabs wired to existing components, onboarding wizard. **STOP.**
- **Milestone C — Attendee + Card:** public event page, registration → **Karta Card reveal**, directory. **STOP.**
- **Milestone D — Engagement & ops:** networking, Q&A/polls, sponsors, check-in, analytics; operator console fills; integrations hub; speaker portal; email templates. **STOP.**
- Each milestone: migrations first, then UI, then wire, then states.

## 9. Definition of done
Existing flows still work (signup → create event → editor → publish → attendee personalizes → downloads card). New: organizer runs a full event (tickets, agenda, check-in, networking, analytics); attendees get the platform experience; operator console + integrations live. Deployed on Vercel, mobile-responsive throughout.
