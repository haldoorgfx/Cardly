# SYSTEM_MAP.md — Eventera End-to-End System Map

Reference document for refactoring. Generated 2026-07-05 from the live codebase. All paths relative to repo root (`C:\Users\cabda\cardly`).

---

## 1. Route map

Auth legend: **session** = Supabase auth cookie required (middleware redirects to /login) · **public** = no auth · **token** = capability URL (invite/QR token in path) · **admin** = platform_role admin/super_admin.

### 1.1 Marketing — `app/(marketing)` (public, shared marketing nav/footer)

| URL | File | Who |
|---|---|---|
| `/` | `app/(marketing)/page.tsx` | Everyone — landing |
| `/pricing` | `.../pricing/page.tsx` | Prospects |
| `/about`, `/careers`, `/contact`, `/partners` | matching dirs | Prospects |
| `/how-it-works`, `/use-cases`, `/help`, `/status`, `/whats-new` | matching dirs | Prospects |
| `/features/{agenda,analytics,check-in,eventera-card,gamification,networking,qa-polls,registration,speakers,sponsors}` | `.../features/*/page.tsx` | Prospects — 10 feature pages |
| `/blog`, `/blog/[slug]` | `.../blog/` | Prospects (CMS-backed) |
| `/terms`, `/privacy`, `/dmca` | matching dirs | Legal |

### 1.2 Auth — `app/(auth)` (public)

| URL | File | Purpose |
|---|---|---|
| `/login` | `app/(auth)/login/page.tsx` | Sign in |
| `/signup`, `/signup/check-email` | `app/(auth)/signup/` | Sign up + email-confirm interstitial |
| `/forgot-password` | `app/(auth)/forgot-password/page.tsx` | Reset request |

### 1.3 Public event surface — `app/(public)` (public unless noted)

| URL | File | Who / notes |
|---|---|---|
| `/discover` | `app/(public)/discover/page.tsx` | Attendees — discovery home |
| `/discover/categories/[category]`, `/discover/cities/[city]` | matching dirs | Attendees |
| `/events` | `app/(public)/events/page.tsx` | Public event feed |
| `/events/search`, `/events/cities`, `/events/city/[city]`, `/events/category/[category]`, `/events/series/[slug]` | matching dirs | Attendees |
| `/search` | `app/(public)/search/page.tsx` | Global search |
| `/e/[slug]` | `app/(public)/e/[slug]/page.tsx` | **Public event page** (slug via `lib/events/resolvePublicSlug`) |
| `/e/[slug]/register` → `/register/checkout` → `/register/confirm`; `/register/group` | `.../register/*` | Attendee registration + paid checkout + group reg |
| `/e/[slug]/apply` | `.../apply/` | Application-form events (pending_approval regs) |
| `/e/[slug]/cfp` | `.../cfp/` | Speaker call-for-papers submission |
| `/e/[slug]/waitlist` | `.../waitlist/` | Sold-out waitlist join |
| `/e/[slug]/schedule`, `/sessions/[sessionId]`, `/sessions/[sessionId]/watch`, `/my-agenda`, `/workshops` | matching dirs | Agenda browsing; watch = virtual stream; my-agenda needs registration identity |
| `/e/[slug]/speakers`, `/speakers/[speakerId]` | matching dirs | Speaker lineup |
| `/e/[slug]/sponsors`, `/sponsors/[boothId]` | matching dirs | Sponsor hall + booth |
| `/e/[slug]/people`, `/messages`, `/speed-networking`, `/community` | matching dirs | Registered-attendee networking (viewer resolved via `lib/attendee/resolveViewerRegistration`) |
| `/e/[slug]/q-and-a`, `/polls`, `/leaderboard`, `/feedback` | matching dirs | Live engagement |
| `/e/[slug]/check-in` | `.../check-in/` | Attendee self check-in surface |
| `/e/[slug]/leads` | `.../leads/` | Sponsor lead capture at event |
| `/o/[userId]`, `/o/[userId]/calendar` | `app/(public)/o/` | Organizer public profile + ICS calendar |
| `/s/[slug]/[speakerId]` | `app/(public)/s/` | Speaker public profile |
| `/x/[slug]/[sponsorId]` | `app/(public)/x/` | Sponsor/exhibitor public page |
| `/account/login`, `/account/setup`, `/account/profile`, `/account/following`, `/account/notifications` | `app/(public)/account/` | Attendee account (legacy attendee-portal; profile pages need session) |

### 1.4 Card flow — `app/c` (public)

| URL | File | Purpose |
|---|---|---|
| `/c/[slug]` | `app/c/[slug]/page.tsx` | Eventera Card attendee experience (legacy entry): fill zones → render card |
| `/c/[slug]/[variantSlug]` | `.../[variantSlug]/page.tsx` | Variant-specific card page |
| `/c/[slug]/card/[cardId]` | `.../card/[cardId]/page.tsx` | View/share a generated card |

### 1.5 Exhibitor token portal — `app/exhibitor` (token-gated via `sponsors.invite_token`, no login)

| URL | File | Purpose |
|---|---|---|
| `/exhibitor/[token]` | `app/exhibitor/[token]/page.tsx` | Portal home — resolves sponsor by `invite_token`; redirects logged-in owners to `/sponsoring/[sponsorId]` |
| `/exhibitor/[token]/booth` / `leads` / `resources` / `team` | matching dirs | Booth editor, lead list, file resources, team members |

### 1.6 Dashboard — `app/(app)` (session required; unified role-based shell `app/(app)/layout.tsx` + `getUserContext`)

| URL | File | Who |
|---|---|---|
| `/home` | `app/(app)/home/page.tsx` | All roles — unified dashboard home |
| `/onboarding` | `.../onboarding/page.tsx` | New accounts |
| `/notifications` | `.../notifications/page.tsx` | All — in-app inbox |
| `/my-tickets`, `/my-tickets/[id]/transfer` | `.../my-tickets/` | Attendee — ticket wallet + transfer |
| `/my-cards` | `.../my-cards/page.tsx` | Attendee — generated Eventera Cards |
| `/saved` | `.../saved/page.tsx` | Attendee — saved events |
| `/attending/[slug]` + `/agenda`, `/community`, `/feedback`, `/leaderboard`, `/messages`, `/networking`, `/polls`, `/q-and-a` | `.../attending/[slug]/*` | Attendee — in-dashboard event tools (9 pages) |
| `/speaking`, `/speaking/[speakerId]` | `.../speaking/` | Speaker workspace (ownership via `ownedSpeaker`) |
| `/sponsoring`, `/sponsoring/[sponsorId]` + `/booth`, `/leads`, `/resources`, `/team` | `.../sponsoring/` | Sponsor workspace (ownership via `ownedSponsor`) |
| `/dashboard` | `.../dashboard/page.tsx` | Organizer — events list + stats |
| `/events/new` | `.../events/new/page.tsx` | Organizer — creation wizard |
| `/events/[id]` | `.../events/[id]/page.tsx` | Organizer — event overview (owner-gated; layout at `events/[id]/layout.tsx`) |
| `/analytics` | `.../analytics/page.tsx` | Organizer — portfolio analytics |
| `/brand` | `.../brand/page.tsx` | Organizer — brand kit (`profiles.brand_kit`) |
| `/team`, `/team/invite/[token]` | `.../team/` | Organizer — team mgmt + invite acceptance |
| `/templates` | `.../templates/page.tsx` | Organizer — card template gallery |
| `/studio` | `.../studio/page.tsx` | Studio-plan tools |
| `/white-label` | `.../white-label/page.tsx` | Studio — white-label config |
| `/settings` + `/billing`, `/api-keys`, `/developer`, `/webhooks`, `/integrations`, `/white-label`, `/reset-password` | `.../settings/*` | Account settings (8 pages) |
| `/suspended` | `app/suspended/page.tsx` | Suspended accounts (outside group; middleware forces here) |

**Event management subroutes — `/events/[id]/...` (all organizer/staff, owner-checked):**

| Group | Routes |
|---|---|
| Setup & design | `setup`, `edit` (Card Studio), `eventera-card`, `event-page`, `form`, `publish`, `embed`, `settings`, `series` |
| Ticketing & money | `tickets`, `orders`, `promo-codes`, `promoter-links`, `revenue`, `revenue/print`, `waitlist`, `approvals` |
| People | `registrations`, `registrations/[regId]`, `staff`, `speakers`, `speakers/[speakerId]`, `sponsors`, `abstracts` |
| Program | `agenda`, `agenda/[sessionId]`, `agenda/print`, `sessions`, `roster/print` |
| On-site | `check-in`, `check-in/kiosk`, `check-in/walk-in`, `badges`, `downloads` |
| Engagement | `live`, `q-and-a`, `polls`, `community`, `newsfeed`, `engagement`, `gamification`, `photos`, `meetings`, `virtual` |
| Growth & insight | `analytics`, `source-analytics`, `reports`, `promote`, `communications`, `copilot`, `integrations`, `webhooks` |

### 1.7 Admin — `app/admin` (platform_role admin/super_admin; gate in `app/admin/layout.tsx` + `lib/auth/guards`)

| URL | Purpose |
|---|---|
| `/admin/analytics` | Platform stats, growth, plan distribution |
| `/admin/users`, `/admin/users/[id]` | User management (suspend, role, delete, impersonate) |
| `/admin/events` | All-events moderation |
| `/admin/billing` | Subscriptions, invoices, comps, refunds |
| `/admin/content`, `/admin/content/[id]/edit`, `/admin/content/[id]/preview` | CMS pages/blocks |
| `/admin/media`, `/admin/templates`, `/admin/collections`, `/admin/theme`, `/admin/changelog`, `/admin/flags`, `/admin/audit` | Media library, card templates, collections, site theme, changelog, feature flags, audit log |

---

## 2. API map

Auth legend: **session** = `supabase.auth.getUser()` cookie; **owner** = session + event/resource ownership check; **admin-role** = `getAuthorizedUser(permission)` from `lib/auth/guards` (platform admin); **apikey** = `x-api-key` via `lib/api-keys`; **sig** = webhook signature verification; **token** = capability token in body/path; **none** = open (rate-limited by middleware for all `/api/*`). "service" = uses `createAdminClient()` internally (bypasses RLS) — noted only when it's the *only* protection.

### Account & identity

| Route | Methods | Purpose | Auth |
|---|---|---|---|
| `/api/account/profile` | PATCH | Update attendee profile | session |
| `/api/account/onboarding` | POST | Attendee onboarding fields | session |
| `/api/account/saved` | GET/POST/DELETE | Saved events | session |
| `/api/account/follows`, `.../[id]/notify` | GET/POST/DELETE, PATCH | Follow organizers, notify toggle | session |
| `/api/account/delete` | POST/DELETE | Delete own account | session |
| `/api/profile` | PATCH | Organizer profile update | session |
| `/api/onboarding` | POST | Organizer onboarding | session |
| `/api/me/roles` | GET | `getVisibleSections()` for AppShell nav | session |
| `/api/export-data` | GET | GDPR-style data export | session |
| `/api/notifications`, `/api/notifications/[id]` | GET/PATCH | In-app notifications list/mark-read | session |

### Events (organizer CRUD)

| Route | Methods | Purpose | Auth |
|---|---|---|---|
| `/api/events/create`, `/api/events/create-basic` | POST | Create event (wizard / quick) + plan limit check | session |
| `/api/events/[id]` | GET/PATCH/DELETE | Event CRUD | owner |
| `/api/events/[id]/duplicate` | POST | Clone event | owner |
| `/api/events/[id]/event-page` (+`/cover`) | GET/PUT, POST | Public page content + cover upload | owner |
| `/api/events/[id]/background` | POST | Card background upload | owner |
| `/api/events/[id]/variants`, `.../[variantId]`, `.../from-template` | GET/POST/PATCH/DELETE | Card design variants | owner |
| `/api/events/[id]/form` | GET/POST/PATCH/DELETE | Registration form fields | owner |
| `/api/events/[id]/features` | GET/PUT | Per-event feature toggles + custom menu | owner |
| `/api/events/[id]/settings`-ish: `/checkout-settings` | PATCH | Checkout config | owner |
| `/api/events/[id]/series` | POST | Attach to event series | owner |
| `/api/events/[id]/export` | GET | CSV export | owner |
| `/api/events/[id]/communicate` | POST | Email blast to attendees (Resend) | owner |
| `/api/events/[id]/promote` | POST | Promotion tools | owner |
| `/api/events/[id]/copilot` | POST | Claude AI Copilot (streams; 503 w/o `ANTHROPIC_API_KEY`) | owner |

### Registration & attendee-facing

| Route | Methods | Purpose | Auth |
|---|---|---|---|
| `/api/events/[id]/register` | POST | **Core registration** — free confirm or payment-intent creation | none (public, zod-validated, rate-limited) |
| `/api/events/[id]/group-register` | POST | Multi-attendee registration | none |
| `/api/events/[id]/apply` | POST | Application-form event → `pending_approval` registration | none |
| `/api/events/[id]/check-email` | GET | Duplicate-email pre-check | none |
| `/api/events/[id]/waitlist` | POST/PATCH | Join/promote waitlist | POST none; PATCH owner |
| `/api/events/[id]/unlock` | POST | Access-code gate for hidden tickets | none |
| `/api/events/[id]/promo/validate` | POST | Validate promo code at checkout | none |
| `/api/events/[id]/promo` | GET/POST/PATCH/DELETE | Promo code CRUD | owner |
| `/api/events/[id]/promoter-codes` (+`/[codeId]`) | GET/POST/DELETE | Promoter/affiliate links | owner |
| `/api/events/[id]/registrations` | GET/POST/PATCH/DELETE | Attendee list mgmt (manual add, edit, cancel) | owner |
| `/api/events/[id]/registrations/bulk` | POST | CSV import (`lib/import/csv`) | owner |
| `/api/registrations/[id]/approve` | POST | Approve/reject application | owner |
| `/api/registrations/[id]/transfer`, `/api/tickets/[id]/transfer` | POST | Ticket transfer to new attendee | session/owner |
| `/api/events/cfp` | POST | Public CFP abstract submission | none |
| `/api/events/[id]/abstracts` | PATCH | Accept/reject abstracts | owner |
| `/api/events/[id]/approvals` | GET/PATCH | Pending-approval queue | owner |

### Check-in & QR

| Route | Methods | Purpose | Auth |
|---|---|---|---|
| `/api/events/[id]/checkin` | GET/POST | Scan QR token → check in | owner/staff |
| `/api/events/[id]/walk-in` | POST | Walk-in registration at door | owner/staff |
| `/api/qr/[token]` | GET | Render QR PNG for a registration token | token (qr_code_token) |

### Card rendering

| Route | Methods | Purpose | Auth |
|---|---|---|---|
| `/api/render` | POST | **Sharp server-side card render** — zones+photo → PNG in Storage, `generated_cards` row, watermark on free plan, webhooks fire | none (public card flow; plan caps via `lib/billing/can`, idempotency key) |
| `/api/v1/render` | POST | Public API render endpoint | apikey (`x-api-key`, Studio plan) |
| `/api/apply-solid-bg`, `/api/apply-template-bg` | POST | Set solid/template card background | session |
| `/api/upload-zone-image` | POST | Zone image upload | session |
| `/api/view` | POST | Increment event view counter (RPC) | none |

### Program / engagement (per event)

| Route | Methods | Purpose | Auth |
|---|---|---|---|
| `/api/events/[id]/sessions` | GET/POST/PATCH/DELETE | Agenda sessions CRUD | owner |
| `/api/events/[id]/sessions/[sessionId]/book` | POST | Workshop seat booking | registration identity |
| `/api/events/[id]/tracks` | GET/POST/DELETE | Agenda tracks | owner |
| `/api/events/[id]/speakers` | GET/POST/PATCH/DELETE | Speakers CRUD (writes speaker role on email match) | owner |
| `/api/sessions/[sessionId]/agenda` | POST | Add session to attendee agenda | registration identity |
| `/api/sessions/[sessionId]/rate` | POST | Session rating | registration identity |
| `/api/sessions/[sessionId]/slides` | POST | Speaker slide upload | speaker ownership |
| `/api/events/[id]/q-and-a`, `/live/questions` | GET/POST/PATCH/PUT | Q&A submit/upvote/moderate | mixed: public submit, owner moderate |
| `/api/events/[id]/polls` | GET/POST/PATCH/PUT | Polls create/vote | mixed |
| `/api/events/[id]/leaderboard` | GET | Gamification standings | none (public read) |
| `/api/events/[id]/feedback` | POST | Event feedback (NPS) | registration identity |
| `/api/events/[id]/photos` | PATCH | Photo-wall moderation | owner |
| `/api/events/[id]/posts`, `/community` | POST, GET/POST | Newsfeed + community channels | owner / registration identity |
| `/api/events/[id]/people`, `/connections`, `/matches`, `/messages` | GET/POST/PATCH | Attendee directory, connections, ERA matchmaking, DMs | registration identity (service client + reg checks) |
| `/api/threads`, `/api/threads/[threadId]` | GET/POST | Message threads by registration_id | registration identity (service client) |
| `/api/events/[id]/staff` | GET/POST/PATCH | Event staff roles | owner |

### Payments & billing

| Route | Methods | Purpose | Auth |
|---|---|---|---|
| `/api/payments/webhook` | POST | Stripe ticket-payment webhook → confirm registration | sig (Stripe signature) |
| `/api/payments/confirm-intent` | POST | Client-side Stripe intent confirm fallback | token (intent id + reg) |
| `/api/payments/flutterwave-webhook`, `/flutterwave-confirm` | POST | Flutterwave webhook + redirect confirm | sig / tx-ref verify |
| `/api/payments/waafipay`, `/waafipay-webhook` | POST | WaafiPay initiate + webhook | none→verify / sig |
| `/api/webhooks/stripe` | POST | Stripe **subscription** webhook → `lib/billing/sync` | sig |
| `/api/billing/create-checkout`, `/create-portal`, `/current` | POST/GET | Stripe subscription checkout/portal/status | session |

### Speaker / sponsor / exhibitor

| Route | Methods | Purpose | Auth |
|---|---|---|---|
| `/api/speakers/[speakerId]/profile` | PATCH | Speaker self-edit | session + `ownedSpeaker` |
| `/api/sponsors/[sponsorId]/profile` | PATCH | Sponsor self-edit | session + `ownedSponsor` |
| `/api/events/sponsors` | POST/PATCH/DELETE | Organizer sponsor CRUD (writes sponsor role on email match) | owner |
| `/api/sponsors/claim` | POST | Logged-in user claims sponsor record by email | session |
| `/api/sponsors/upload-logo`, `/upload-resource` | POST | Sponsor asset uploads | token/ownership |
| `/api/exhibitor/booth`, `/leads`, `/resources`, `/team` | PATCH/POST/DELETE | Exhibitor portal writes | token (`sponsors.invite_token`) |

### ERA AI (`lib/ai/era.ts` + `lib/ai/gate.ts` plan gating)

| Route | Purpose | Auth |
|---|---|---|
| `/api/era/improve-description` | Rewrite event description (Pro) | session + gate |
| `/api/era/answer-question` | Public FAQ bot on event pages (Pro event) | none |
| `/api/era/match-attendees` | Networking matchmaking (Pro) | session + gate |
| `/api/era/narrate-analytics` | Analytics narration (Pro) | session + gate |
| `/api/era/generate-report`, `/write-campaign`, `/translate` | Studio-tier features | session + gate |

### Platform / misc

| Route | Methods | Purpose | Auth |
|---|---|---|---|
| `/api/admin/*` (analytics, users, events, billing, content+blocks, media, templates, theme, changelog, flags+overrides, impersonate, migrate, upload-logo) | various | Admin panel backend | admin-role (`getAuthorizedUser` + permission constants) |
| `/api/keys`, `/api/keys/[id]` | GET/POST/DELETE | API key management (Studio) | session |
| `/api/webhooks`, `/api/webhooks/[id]` | GET/POST/PATCH/DELETE | Organizer outbound webhook endpoints | session |
| `/api/teams`, `/api/teams/[id]`, `.../members/[userId]`, `.../invites`, `.../invites/[inviteId]`, `/api/teams/invites/[token]` | various | Teams CRUD, member roles, invites, invite acceptance | session (+invite token) |
| `/api/templates/published` | GET | Card template gallery (admin-managed templates) | session |
| `/api/brand`, `/api/brand/logo` | GET/PATCH/POST | Brand kit JSONB + logo upload | session |
| `/api/white-label` | GET/POST | White-label settings (Studio) | session |
| `/api/calendar/[pageId]` | GET | ICS file for event | none |
| `/api/contact`, `/api/newsletter`, `/api/report` | POST | Contact form, newsletter signup, abuse report | none |
| `/api/events/[id]/agenda/pdf`, `/revenue/pdf`, `/roster/pdf` | GET | pdf-lib exports | owner |

---

## 3. Database schema

Migrations: `supabase/migrations/001–046` plus root-level `supabase/047–057` (applied by hand; **never re-run 001–043**). Notation: table — purpose; key columns; surfaces.

### Core identity & billing

- **profiles** (001,003,004,005,024,026,002c,048,055) — one row per auth.user (trigger `handle_new_user`). `plan` (free/pro/studio), legacy `role`, new `platform_role` (user/admin/super_admin), Stripe cols (`stripe_customer_id`, `stripe_subscription_id`, `subscription_status`, `billing_cycle`, `current_period_end`, `cards_this_month`), `brand_kit` jsonb, `bio`, onboarding/preferences. Read everywhere; written by `/api/profile`, `/api/account/*`, `/api/webhooks/stripe` (billing sync), admin.
- **user_event_roles** (055) — **role backbone**: (user_id, event_id, role attendee/speaker/sponsor/organizer/staff, status active/pending/revoked), unique per triple. Written by `lib/rbac/assign.upsertEventRole` from register/create/speaker-add/sponsor-link flows; read by `lib/rbac/roles` for the whole unified dashboard.
- **user_devices** (049) — push-notification device tokens per user (mobile). `/api/notifications` ecosystem.
- **notifications** (early platform migration; realtime+RLS in 046/049/050) — in-app notification rows per user; written via `lib/notifications.ts`, read by `/notifications` page and `/api/notifications`.

### Events & card design

- **events** (001,011,038,040,045) — root entity. `user_id`→profiles (owner), `name`, unique `slug`, card `background_url/width/height`, `zones` jsonb (Card Studio), `status` draft/published/archived, `view_count`, `download_count`, discovery cols (`city`,`country`,`category`,`price_from`), `features` jsonb + `custom_menu` jsonb, `fee_bearer`, `payment_processors[]`. Written by `/api/events/create*`, `[id]` PATCH, Card Studio; read by every surface.
- **event_pages** (017) — one-to-one public page content: `title`, `tagline`, `description`, `cover_image_url`, venue+lat/lng, `starts_at/ends_at/timezone`, `is_online/online_url`, `registration_deadline`, `max_capacity`, `is_public`, `custom_slug`, SEO, `payment_processor`. Written by `/api/events/[id]/event-page`; read by `/e/[slug]`, discover, dashboard context.
- **event_variants** (002,016,044) — multiple card designs per event (own zones/background, `variant_slug`, optional ticket-type link). `/api/events/[id]/variants*`, `/c/[slug]/[variantSlug]`.
- **generated_cards** (001,014) — output of card render: `event_id`, `attendee_name`, `attendee_data` jsonb, `output_url`, idempotency key. Written by `/api/render` + `/api/v1/render`; read by `/my-cards`, `/c/[slug]/card/[cardId]`, organizer downloads.
- **templates** (admin panels/006) — platform card template gallery; `/api/templates/*`, `/admin/templates`, `/templates` page.
- **event_series** (030) — recurring/series grouping; `/events/series/[slug]`, `/api/events/[id]/series`.

### Ticketing & registration

- **ticket_types** (017,031) — per event: `name`, `price`, `currency`, `quantity`/`quantity_sold`, sales window, min/max per order, visibility, position, ticketing-depth extras (031: tiers/access codes/donation pricing). Written via `/api/events/[id]/tickets`; read at `/e/[slug]/register`.
- **registrations** (017,033,034,035,042,047) — the attendee record: `event_id`, `ticket_type_id`, `attendee_name/email/phone`, `custom_fields` jsonb, `status` (pending/confirmed/checked_in/cancelled/refunded + pending_approval), `payment_status`, `stripe_payment_intent_id`/`flutterwave_tx_ref`, `amount_paid`, `platform_fee`/`organizer_net` (040), unique `qr_code_token`, `checked_in_at/by`, card url cols, `source`, `chosen_price` (034), `user_id` (035 — links to account when known), unique email per event (033). Written by `/api/events/[id]/register|group-register|apply|walk-in|registrations`, payment webhooks; read by `/my-tickets`, `getUserContext`, registrations tab, check-in, analytics.
- **registration_form_fields** (017/041) — custom registration form schema per event; `/api/events/[id]/form`.
- **promo_codes** (017) — discount codes (usage counters); `/api/events/[id]/promo*`.
- **promoter_codes** (032) — affiliate/promoter tracking links; `/api/events/[id]/promoter-codes`, source-analytics.
- **waitlist_entries** (030) — sold-out waitlist; `/api/events/[id]/waitlist`.
- **ticket_transfers** (031/047) — transfer audit trail; `/api/tickets/[id]/transfer`.
- **check_in_sessions** (019) — per-device check-in session counters; check-in kiosk.
- **checkout settings** (046) — checkout config columns/table for `/api/events/[id]/checkout-settings`.

### Program (speakers/agenda)

- **tracks**, **sessions**, **session_speakers**, **speakers** (020,039) — agenda model. `speakers.email` (039) is the identity hook for speaker accounts; `sessions` carry times/room/track; `session_speakers` joins. Written by organizer agenda/speaker tabs; read by `/e/[slug]/schedule|speakers`, `/speaking`.
- **attendee_agendas** (020) — attendee's saved sessions ("my agenda"); `/api/sessions/[sessionId]/agenda`, `/e/[slug]/my-agenda`.
- **session_ratings** (020) — per-session stars; `/api/sessions/[sessionId]/rate`.
- **event_feedback** (020) — event-level NPS/feedback; `/api/events/[id]/feedback`, feedback pages.
- **call_for_papers**, **abstracts** (023) — CFP config + submissions; `/e/[slug]/cfp`, `/api/events/cfp`, `/events/[id]/abstracts`.

### Networking & engagement

- **attendee_connections** (021) — connection requests between registrations; `/api/events/[id]/connections`, people pages.
- **message_threads**, **messages** (021) — DMs keyed by registration ids (`participant_a/b`); `/api/threads*`, `/api/events/[id]/messages`, messages pages.
- **qa_questions**, **qa_upvotes** (021) — Q&A with upvotes; q-and-a surfaces.
- **polls**, **poll_options**, **poll_votes** (021) — live polls.
- **leaderboard_points** (021) — gamification points; `lib/events/leaderboard`.
- **match_suggestions** (022) — ERA matchmaking output; `/api/events/[id]/matches`.
- **community_channels**, **community_messages** (051) — event community chat channels; community pages.
- **event_photos** (037) — photo wall (moderated); `/api/events/[id]/photos`.

### Sponsors & exhibitors

- **sponsors** (023,025,027) — sponsor/exhibitor record per event: tier, logo, booth fields, `contact_email` (identity hook), `invite_token` (025 — exhibitor portal capability URL). Written by `/api/events/sponsors`, exhibitor APIs; read by `/e/[slug]/sponsors`, `/x/...`, `/sponsoring`, `/exhibitor/[token]`.
- **sponsor_leads** (023,027) — captured leads (+company/role/captured_at); `/api/exhibitor/leads`, leads pages.
- **sponsor_resources** (027) — booth file resources.
- **sponsor_members** (027) — exhibitor team members.
- **event_staff** (036) — staff assignments (check-in crew etc.); `/api/events/[id]/staff`.

### Teams, platform, CMS

- **teams**, **team_members**, **team_invites** (008,012) — organizer teams; `/api/teams/*`, `/team`.
- **api_keys** (010) — hashed Studio API keys; `lib/api-keys`, `/api/keys`, used by `/api/v1/render`.
- **webhooks** (010) — organizer outbound webhook endpoints (fired by `lib/webhooks` on card render etc.).
- **white_label_settings** (023) — Studio white-label config; `/api/white-label`.
- **feature_flags**, **feature_flag_overrides** (009) — platform flags; `lib/flags`, `/admin/flags`.
- **audit_log** (005/006) — admin action trail; `lib/audit/log`, `/admin/audit`.
- **cms_pages**, **cms_blocks**, **cms_page_versions**, **cms_navigation**, **cms_media** (007) — marketing/blog CMS; `/admin/content`, `/blog`.
- **changelog_entries** (006) — `/whats-new`, `/admin/changelog`.
- **site_settings** (006/theme) — platform theme; `lib/theme/settings`, `/admin/theme`.
- **saved_events** (010_attendee_accounts) — user↔event bookmarks; `/api/account/saved`, `/saved`.
- **organizer_follows** (010_attendee_accounts/026) — attendee follows organizer; `/api/account/follows`, `/account/following`.
- **newsletter_subscribers** (057) — `/api/newsletter`.
- **promo_banners** (root sql) — admin-managed site banners.

**RLS:** enabled on all tables. Owners read/write own rows; public reads published events/event_pages by slug; public inserts registrations; SECURITY DEFINER helpers avoid recursion (054/055); attendee-security hardening in 050/052/053. Server code frequently bypasses RLS with the service-role client (`createAdminClient`) and enforces authorization in TypeScript instead — this is the dominant pattern in `/api`.

---

## 4. Identity & roles

**Chain:** `auth.users` → (trigger `handle_new_user`) → `profiles` (email, plan, `platform_role`) → `user_event_roles` (many event-scoped hats per account).

- **Platform role:** `profiles.platform_role` ∈ user/admin/super_admin (055; backfilled from legacy `profiles.role`). Admin surface + `/api/admin/*` gate on it via `lib/auth/guards.getAuthorizedUser(permission)` with permission constants in `lib/auth/permissions.ts`.
- **Event roles:** `user_event_roles` rows (attendee/speaker/sponsor/organizer/staff, status active/pending/revoked). Written going forward by `lib/rbac/assign.ts` (`upsertEventRole` — best-effort, never throws, called after registration confirm, event create, speaker add w/ email, sponsor link) plus `resolveAccountIdByEmail` to attach roles to existing accounts by email.

**lib/rbac modules:**

| File | Exports | Job |
|---|---|---|
| `roles.ts` | `getUserRoles`, `hasRole`, `isOrganizerOf/isSpeakerAt/isSponsorAt`, `isAdmin`, `roleKinds`, `eventsWithRole` | Single read-side resolver over `user_event_roles` + `profiles.platform_role`. Service-role client; SERVER-ONLY. |
| `sections.ts` | `getVisibleSections` | Turns roles into nav flags {tickets, speaking, sponsoring, organizing, admin} + event-id lists. Adds **registration-by-email fallback** for `tickets` so pre-055 attendees still see "My tickets". Served to the client shell via `/api/me/roles`. |
| `context.ts` | `getUserContext` | The ONE dashboard entry point: roles + sections + events grouped `asOrganizer/asAttendee/asSpeaker/asSponsor` (event rows enriched from `event_pages`). Attendee list unions role rows with `registrations` matched by `user_id` OR profile email. |
| `ownership.ts` | `ownedSpeaker`, `ownedSponsor` | "Is this account THIS speaker/sponsor?" — strong signal: `speakers.email` / `sponsors.contact_email` case-insensitive == profile email; fallback: record has no email AND account holds the matching active event role. Shared by `/speaking/*`, `/sponsoring/*` pages AND the profile PATCH APIs so gates can't drift. |
| `assign.ts` | `upsertEventRole`, `resolveAccountIdByEmail` | Write path; idempotent upsert on (user_id,event_id,role). |
| `sponsorWorkspace.ts`, `exhibitor-viewer.ts` | workspace/viewer resolvers | Sponsor dashboard data assembly; resolve exhibitor-portal viewer (logged-in owner vs anonymous token holder). |

**Email-matching fallbacks (pre-055 continuity):**
- `registrations.attendee_email` ↔ profile email → attendee surface (`/my-tickets`, `getUserContext`, sections.tickets).
- `speakers.email` ↔ profile email → speaker ownership (`ownedSpeaker`).
- `sponsors.contact_email` ↔ profile email → sponsor ownership (`ownedSponsor`) + `/api/sponsors/claim`.
- `lib/attendee-identity.ts` / `lib/attendee/resolveViewerRegistration.ts` resolve the acting registration on public `/e/[slug]` tools (session user OR stored registration identity).

**Middleware (`middleware.ts`):** rate-limits all `/api/*` (Upstash or in-memory), refreshes the Supabase session (`lib/supabase/middleware.updateSession` — redirects unauthenticated users off protected pages to `/login`), then runs suspension/admin checks except on listed public prefixes (`/c/`, `/e/`, `/exhibitor/`, `/events*`, `/discover*`, `/search*`, `/o/`, marketing, auth). Suspended users are forced to `/suspended`.

---

## 5. Data flow diagrams (text)

### (a) Stranger registers for an event
```
/e/[slug] (public page; view counted via POST /api/view)
  → /e/[slug]/register (form from registration_form_fields + ticket_types)
  → POST /api/events/[id]/register  [zod validation, dedupe by attendee_email (033), capacity/deadline checks]
      ├─ INSERT registrations (status per path; qr_code_token generated)
      ├─ promo_codes usage++ (if code)
      ├─ FREE ticket:
      │    status=confirmed → sendRegistrationConfirmEmail (lib/registration/email, Resend)
      │      with QR link /api/qr/[token] + card link
      │    OR pending_approval → sendPendingApprovalEmail; organizer approves via
      │      POST /api/registrations/[id]/approve
      ├─ PAID ticket: create Stripe intent / Flutterwave link / WaafiPay session
      │    → /e/[slug]/register/checkout → provider →
      │    webhook (/api/payments/webhook | flutterwave-webhook | waafipay-webhook)
      │      → registrations.payment_status=paid, status=confirmed, platform_fee/organizer_net
      │      → confirm email → /e/[slug]/register/confirm
      └─ upsertEventRole(attendee) if account matched by user_id or resolveAccountIdByEmail
Card: attendee opens /c/[slug] (or link in email) → fills zones → POST /api/render
  → sharp composes background+zones+photo (+watermark if organizer plan=free)
  → Supabase Storage upload → INSERT generated_cards → fireWebhooks → PNG url
```

### (b) Attendee logs in → dashboard
```
/login → Supabase auth cookie → middleware.updateSession
  → /home: getUserContext(userId)
      profiles.platform_role + user_event_roles
      + registrations WHERE user_id=me OR attendee_email=profile.email  → asAttendee[]
  → AppShell nav via GET /api/me/roles (getVisibleSections) → "My tickets" lights up
  → /my-tickets  (registrations by user_id/email; QR via /api/qr/[token]; transfer via
     /my-tickets/[id]/transfer → POST /api/tickets/[id]/transfer)
  → /my-cards (generated_cards), /saved (saved_events)
  → /attending/[slug]/{agenda,polls,q-and-a,networking,messages,community,feedback,leaderboard}
     — same event tools as /e/[slug]/* but inside the auth shell, viewer registration
     resolved via lib/attendee identity helpers
```

### (c) Organizer creates event → publishes → manages
```
/events/new → POST /api/events/create  [plan limit via lib/billing/can]
  → INSERT events (slug = name + 4-char suffix, lib/slug) + upsertEventRole(organizer)
→ /events/[id]/setup + /event-page (PUT /api/events/[id]/event-page → event_pages)
→ /events/[id]/edit  (Card Studio: zones jsonb, 800ms autosave PATCH /api/events/[id],
   variants via /api/events/[id]/variants, background upload)
→ /events/[id]/tickets → ticket_types ; /form → registration_form_fields ; /promo-codes
→ /events/[id]/publish → events.status='published' → live at /e/[slug]
→ manage: /registrations (GET/PATCH /api/events/[id]/registrations, bulk CSV import),
   /agenda + /speakers (sessions/tracks/speakers tables), /sponsors, /staff,
   /check-in (POST /api/events/[id]/checkin scans qr_code_token → status=checked_in),
   /communications (POST /api/events/[id]/communicate → Resend blast),
   /analytics + /revenue (+ PDF exports), /copilot (Claude), ERA tools (plan-gated)
```

### (d) Sponsor / speaker invited → role → workspace
```
Speaker: organizer adds via /events/[id]/speakers → POST /api/events/[id]/speakers
  → INSERT speakers (email set) → resolveAccountIdByEmail(email) → upsertEventRole(speaker)
  → account logs in → sections.speaking=true → /speaking → /speaking/[speakerId]
     (page + PATCH /api/speakers/[speakerId]/profile both gated by ownedSpeaker)
  → public profile at /s/[slug]/[speakerId]; slides via /api/sessions/[id]/slides
Sponsor: organizer adds via /events/[id]/sponsors → POST /api/events/sponsors
  → INSERT sponsors (contact_email, invite_token auto-generated)
  → path 1 (no account): exhibitor portal /exhibitor/[token]/{booth,leads,resources,team}
     — pure capability URL, writes via /api/exhibitor/* keyed on invite_token
  → path 2 (account): email match or /api/sponsors/claim → upsertEventRole(sponsor)
     → /sponsoring/[sponsorId]/{booth,leads,resources,team} gated by ownedSponsor;
     /exhibitor/[token] redirects logged-in owners here
  → public booth at /x/[slug]/[sponsorId] and /e/[slug]/sponsors/[boothId];
     leads captured into sponsor_leads at /e/[slug]/leads
```

---

## 6. Shared libraries

### `lib/`

| Module | Purpose |
|---|---|
| `supabase/` (client, server, middleware) | Browser client, server client + `createAdminClient` (service role), session-refresh middleware helper |
| `rbac/` | Role resolver / sections / context / ownership / assign (see §4) |
| `auth/` (guards, permissions) | Admin-panel authorization: `getAuthorizedUser(permission)` + permission constants |
| `attendee/`, `attendee-identity.ts` | Resolve acting registration/viewer on attendee surfaces (`requireAttendeeContext`, `resolveViewerRegistration`) |
| `billing/` (plans, can, fees, stripe, sync) | Plan definitions + limits, `canGenerateCard` caps, platform fee math, Stripe SDK, subscription webhook sync |
| `payments/` (stripe, flutterwave, waafipay) | Ticket-payment provider adapters |
| `ai/` (era, gate) | ERA Gemini client with graceful no-key fallback; plan gating |
| `email/` + `registration/email.ts` | Resend templates (milestones, cap-reached) + registration confirm/pending emails |
| `api-keys/` | Studio API key hash/verify for `/api/v1/*` |
| `webhooks/` (index, ssrf) | Fire organizer webhooks with SSRF protection |
| `qr/` (generate, token, validate) | QR PNG generation + token validation for check-in |
| `pdf/` (agenda, revenue, roster, brand, helpers) | pdf-lib exports with brand styling |
| `events/` (format, geocode, leaderboard, placeholder, resolveEventRef, resolvePublicSlug) | Event helpers: date formatting, venue geocoding, gamification, slug/custom_slug resolution |
| `ratelimit.ts` | Upstash Redis or in-memory fallback; wired in middleware for all `/api/*` |
| `notifications.ts`, `notifications/prefs.ts` | Create in-app notifications + user prefs |
| `teams/`, `templates/`, `theme/`, `cms/`, `admin/`, `flags/`, `audit/`, `import/`, `matchmaking/` | Team queries, card-template SVGs, site theme settings, CMS queries/types, admin dashboards queries, feature flags, audit logging, CSV import, ERA matchmaking |
| `fonts/embedded-font-data.ts` | Base64 fonts written to /tmp for sharp text rendering |
| `slug.ts`, `errors.ts`, `utils.ts`, `utils/fetch-retry.ts` | Slug generation (`name-xxxx`), error helpers, cn/misc, retrying fetch |

### `components/`

| Group | Files | Contents |
|---|---|---|
| `ui/` | 11 | shadcn primitives (button, input, card, dialog, dropdown, tabs, badge, toast, avatar…) |
| `app/` | 2 | Unified dashboard shell (AppShell + nav driven by /api/me/roles) |
| `events/` | 60 | Largest group — organizer event-management tab components + public event page pieces |
| `editor/` | 8 | Card Studio canvas editor (zones, undo/redo, autosave) |
| `registration/` | 11 | Registration form, checkout, confirm widgets |
| `discovery/` | 13 | Discover/search cards, filters, city/category grids |
| `marketing/` | 11 | Marketing nav, footer, landing sections |
| `cms/` | 23 | Admin CMS block editors + public block renderers |
| `exhibitor/` | 7 | Exhibitor portal booth/leads/resources/team UIs (shared by /exhibitor and /sponsoring) |
| `check-in/` | 4 | QR scanner, kiosk, walk-in |
| `admin/` | 4 | Admin panel widgets |
| `analytics/` | 3 | Charts/stat cards |
| `account/` | 3 | Attendee account forms |
| `tickets/` | 2 | Ticket wallet cards |
| `shared/` | 9 | Cross-feature (empty states, confirm dialogs, uploaders…) |
| `abstracts/`, `ai/`, `messaging/`, `networking/`, `polls/`, `qa/`, `sessions/`, `settings/`, `speaker/`, `studio/` | 1–2 each | Feature-specific single components |

Other top-level: `hooks/` (client hooks), `types/database.ts` (frozen Supabase types — new tables cast to `any` at query boundaries), `middleware.ts`, Sentry configs, `scripts/`, `eventera_mobile/` (mobile companion, out of web scope).
