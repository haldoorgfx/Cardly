# Dashboard Atom Spec — the ONE look (Phase 2 sweep reference)

Source of truth: `components/dash/index.tsx` + BRAND.md/DESIGN.md.
Every organizer component is swept to match these. When in doubt, match `dash`.

## Card surface
- `bg-white rounded-2xl border` (radius **16px** = `rounded-2xl`)
- border color `#E5E0D4`
- shadow `0 1px 2px rgba(15,31,24,0.04)` (hairline only — no heavy shadows)
- padding `p-5 sm:p-6`
- Rule: any white bordered container that holds content = `rounded-2xl`.

## Primary button
- `inline-flex items-center gap-1.5 h-10 px-4 rounded-lg text-[13.5px] font-medium text-white`
- bg forest `#1F4D3A`, `hover:opacity-90`, `disabled:opacity-50`
- radius **8px** = `rounded-lg` (NOT xl)

## Secondary button
- same box as primary but `bg-white border`, border `#E5E0D4`, text forest `#1F4D3A`
- `hover:bg-[#F5F3EE]`

## Input / select / textarea
- `h-10 rounded-lg border px-3 text-[13.5px]`, border `#E5E0D4`, `bg-white`
- radius **8px** = `rounded-lg`

## Badge / pill / status chip
- `rounded-full px-2.5 py-1 text-[11px] font-medium`

## Colors → always these hex (or tokens)
forest `#1F4D3A` · forestDark `#163828` · soft `#E8EFEB` · gold `#E8C57E`
ink `#0F1F18` · inkSoft `#3A4A42` · muted `#6B7A72` · cream `#FAF6EE`
border `#E5E0D4`. Forbidden: `#6c63ff`, `#f8a4d8`, `#fafafa`, `#e5e5ea`.

## The disambiguation rule (why we don't blind-sweep)
Cards, buttons, and inputs all share `bg-white` + `border` + `rounded-*`.
Classify by **fixed height / role**:
- has `h-9|h-10|h-11` or is a `<button>`/`<input>` → control → `rounded-lg`
- white bordered container with `p-4|p-5|p-6`, no fixed height → card → `rounded-2xl`
- small chip with `rounded-full` already → leave
