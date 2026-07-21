# Pricing claims vs what actually ships — 2026-07-21

What the public pricing page promises, checked against what the code enforces.
Every row below was verified by reading the route, not inferred.

**Nothing here has been changed.** Pricing is a business decision, and every fix
has a cost in one direction or the other — either you take a feature away from
people using it today, or you change what the page says. That is Abdalla's call.

Sources: `components/marketing/Pricing.tsx`, `components/marketing/PricingContent.tsx`
(the comparison table), `lib/billing/plans.ts` (the canonical limits).

---

## 1. Seven paid features have no server-side plan gate at all

Method: collect every file containing a plan check (`getUserPlan`,
`getEventOwnerPlan`, `canCreateEvent`, `canGenerateCard`, `hasERA`, `PLANS[…]`,
`canRegisterForEvent`, …) — 53 files — then, for each paid row of the comparison
table, ask whether ANY file in that feature contains one.

A hit does not prove the gate is *correct*. A zero is strong evidence there is no
gate, and the three most surprising were confirmed by opening the route.

| Sold as | Claim | Files | Gated | Verified |
|---|---|---:|---:|---|
| Pro+ | Early-bird, VIP & promo codes | 24 | **0** | `promo/route.ts` — no plan reference |
| Pro+ | Custom registration forms | 5 | **0** | `form/route.ts` — no plan reference |
| Pro+ | Multi-track agenda builder | 17 | **0** | `sessions/route.ts` — no plan reference |
| Pro+ | Speaker directory & portals | 12 | **0** | |
| Pro+ | Attendee profiles & directory | 5 | **0** | |
| Studio | Multiple brand kits | 3 | **0** | `PLANS.brandKits` (0/1/5) is **never read anywhere** |
| Studio | CSV export | 5 | **0** | `events/[id]/export/route.ts` — no plan reference |

Gating *is* present for: Live Q&A & polls, gamification, 1:1 messaging, AI
matchmaking, hi-res card download, sponsor tools, API access, basic analytics.

**The consequence:** a Free account can build a multi-track agenda, run a speaker
directory, issue promo codes, build custom registration forms and export the
attendee CSV. Those are five of the seven reasons the page gives to pay $19, and
one of the reasons to pay $49.

**The catch, and why this is not a simple fix:** every Free organizer using these
today would lose them the moment a gate lands. That is a customer-facing
regression, not a bug fix.

---

## 2. Studio team seats: the page says 3, the code allows 10

- `components/marketing/Pricing.tsx:90` — "Multiple brand kits · 3 team seats"
- `components/marketing/PricingContent.tsx:90` — `['Team seats', '1', '1', '3']`
- `lib/billing/plans.ts` — `studio.teamSeats: 10`

The code is the generous one, so nobody is short-changed — but the two disagree
and one of them is wrong. Worth deciding which number is the real product.

(Related: Teams granted no event access at all until this session; that is fixed,
but migration 116 must be applied for the database half.)

---

## 3. Pro's "500 registrations / month" is not enforced, so Studio's
## "Unlimited registrations" is not a real upgrade

`lib/billing/plans.ts` sets `pro.registrationsPerEvent: null` and says so plainly
in its own comment: the monthly cross-event figure "has no counter infra built
yet — left null (unenforced) rather than half-modeled as a lifetime-per-event cap
it isn't."

That comment is honest engineering. The pricing page is the problem: it sells
"500 / mo" on Pro and "Unlimited" on Studio as a differentiator, when Pro is
already unlimited in practice. **A customer could upgrade to $49 specifically to
buy something $19 already gives them.** Of everything in this document, this is
the one with the clearest path to a refund request.

Free's 50-registration cap **is** enforced (`registrationsPerEvent: 50`).

---

## 4. "QR check-in (offline-ready)" — the web app has no offline queue

The comparison table markets offline-ready check-in on **every** plan including
Free. The check-in audit this session confirmed: no offline queue exists on web,
and a scan made while the network is down is simply lost. The scanner is honest
about it in the moment (it locks the banner and says "NOT checked in") — but the
page promised the opposite before the organizer got to the venue.

The **mobile app does** have a real offline scanning subsystem. So the claim is
true of the phone app and false of the web app, and the page does not distinguish.

Options: qualify the claim ("offline check-in in the mobile app"), or build the
web queue — which needs dedupe on reconnect, since the POST is idempotent but the
client is not.

---

## 5. The AI Copilot appears nowhere on the pricing page

It is not in the plan cards, not in the comparison table, not in `PLANS`. It is
also the single most expensive feature per call — Claude, where everything else
is Gemini Flash.

It had no plan gate at all until this session; it is now gated at Pro+, because
CLAUDE.md says "Free: ERA locked" and that was the documented policy rather than a
new pricing decision. Studio is the defensible home for it. Either way it needs a
line on the page: customers currently cannot discover a feature they are paying
for.

---

## 6. White-label: what a Studio customer actually gets

From the white-label audit this session. Full detail in that commit; summary:

| Setting | Reality |
|---|---|
| `brand_name` | works in emails and on card routes; **not** on the public event page |
| `primary_color` | works in emails only |
| `from_name`, `reply_to_email` | work |
| `hide_powered_by` | works (was silently ignored in every email until this session) |
| `logo_url` | **dead** — no upload UI, no consumer, cannot be set |
| `custom_domain` | verifies DNS correctly, but middleware never routes it |

The public event page — the flagship attendee surface — consumes no white-label
settings at all.

---

## Suggested order, if you want one

1. **§3 first.** It is the only item where a customer can pay $49 for something
   $19 already provides. Cheapest fix: change the page.
2. **§4** — a factual claim about the product that is false on web.
3. **§2** — pick a number.
4. **§5** — one line on the page.
5. **§1** is the largest and the least urgent: it is revenue you are not
   collecting, not a promise you are breaking. Gating it is a migration of
   expectations for existing Free users and deserves its own plan.
