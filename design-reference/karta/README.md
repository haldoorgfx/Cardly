# Karta — Design & Engineering Handoff

A complete, multi-tenant **event-management SaaS**, designed end to end. This bundle is the handoff package for a developer (Claude Code) to implement it in a real codebase.

## Read these first
1. **`docs/KARTA_HANDOFF.md`** — the full engineering spec: tech stack, **database schema (Prisma)**, relationships, RBAC, plan-gating, domain logic, the Karta Card pipeline, APIs, user-journey flows, integrations, env vars, and a milestone-based go-live plan. **Start here.**
2. **`index.html`** — the live hub linking every prototype surface. Open it to navigate the whole product.
3. This README — what the files are, fidelity, surfaces, and design tokens.

## What these files are
The HTML/JSX files in this bundle are **high-fidelity design references** — interactive prototypes (React + Tailwind via CDN) showing the intended look, copy, and behavior. They are **not** production code to ship as-is.

**The task:** recreate these designs in the target codebase using its established framework and patterns (the spec recommends **Next.js + TypeScript + Postgres/Prisma**). Lift the visuals pixel-faithfully; replace mock data with real data per the schema in `docs/KARTA_HANDOFF.md`. **Strip the prototype-only devices:** the demo plan/role switcher and "show empty state" toggle in the dashboard, and all hardcoded mock arrays.

## Fidelity: **High-fidelity.** 
Final colors, typography, spacing, components, and interactions. Recreate the UI pixel-perfectly, then wire real data/auth/payments.

## Surfaces (each = a folder of prototypes)
| Folder | Surface | Audience |
|---|---|---|
| `site/` | Marketing landing + pricing | Public |
| `directory/` | Public event directory (browse/search) | Public |
| `support/` | Help center · status · changelog · legal | Public |
| `dashboard/` | Organizer dashboard **+** super-admin/operator console (role-gated) **+** `auth.html` | Organizer / Karta staff |
| `onboarding/` | Post-signup setup wizard | New org owner |
| `studio/` | Karta Card design studio (canvas editor) | Organizer |
| `emails/` | Email template designer | Organizer |
| `speaker/` | Speaker portal | Speaker |
| `attendee/` | Full attendee app (discover → register → card → event experience) | Attendee |

**Routing/IA source of truth:** `dashboard/data.jsx` (nav maps + plan logic) and `dashboard/app.jsx` (context-aware shell + gating). Each prototype screen maps to one page/component; its mock-data array shows exactly which fields that view needs → map to the Prisma models in the spec.

## Design tokens (Tailwind `theme.extend` — copy verbatim from any prototype `<head>`)
- **Colors:** primary `#1F4D3A` · primary-dark `#163828` · primary-soft `#E8EFEB` · accent `#E8C57E` · accent-dark `#C9A45E` · ink `#0F1F18` · ink-soft `#3A4A42` · muted `#6B7A72` · cream `#FAF6EE` · surface `#FFFFFF` · border `#E5E0D4` · success `#2D7A4F` · danger `#B8423C`
- **Fonts:** DM Sans (display/headings) · Inter (body/UI) · JetBrains Mono (numbers, labels, code)
- **Radius:** cards `rounded-2xl` (16px) · inputs/buttons `rounded-lg`/`rounded-xl` · pills `rounded-full`
- **Texture:** cream dotted-grid page background; forest→gold mesh/halo washes on heroes; thin hairline borders; mono micro-labels with `tracking` (uppercase).
- **Shared primitives:** `dashboard/dash-ui.jsx`, `attendee/att-ui.jsx`, and `*/icons.jsx` — port these into a shared `ui` package first; class names are production-ready.

## Shared building blocks already designed
- **Karta Card** component (the signature feature) — `attendee/att-ui.jsx` (`KartaCard`) and `studio/` define its exact look + the template element schema.
- **Icon set** — `icons.jsx` (thin-stroke, `currentColor`).
- **Charts** — dependency-free inline SVG (`dash-ui.jsx`: AreaChart/Donut/BarsChart/Funnel) — swap for recharts/visx if preferred; data contracts are trivial.

## Build order (see spec §13)
M1 Foundation → M2 Event spine → M3 Karta Card → **M4 Check-in = shippable MVP** → M5 engagement → M6 scale/ops. Build vertically; keep everything org-scoped and plan-gated from day one.

---
*Everything is consistent in the forest/cream/gold system. The engineering spec (`docs/KARTA_HANDOFF.md`) is the authoritative implementation document; these prototypes are the design contract.*
