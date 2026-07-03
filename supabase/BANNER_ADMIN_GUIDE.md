# Discover banner — admin control

The sliding banner at the top of the Discover tab is now admin-controlled. You manage it in Supabase — no code, no app update needed.

## One-time setup (2 minutes)

1. Open your Supabase project → **SQL Editor** → **New query**.
2. Open `supabase/promo_banners.sql`, copy everything, paste it in, click **Run**.

That creates the `promo_banners` table, locks it down (public can only read active banners), and seeds the default Eventera promo. The app already falls back to that default if the table is empty, so nothing breaks either way.

## Managing banners

Go to **Table Editor → promo_banners**. Each row is one banner in the carousel.

| Field | What it does |
|---|---|
| `title` | Big headline (keep it short) |
| `subtitle` | One line under the title (optional) |
| `image_url` | Background image. Leave empty to use a gradient instead |
| `bg_start` / `bg_end` | Gradient colors (hex, e.g. `#163828`). Only used when there's no image |
| `text_color` | Text color (hex). Default white |
| `cta_label` | Button text, e.g. "Explore events". Empty = no button |
| `cta_type` | `none`, `event`, or `url` |
| `cta_target` | If `event`: the event slug. If `url`: a full `https://…` link |
| `active` | `true` to show it, `false` to hide |
| `sort_order` | Lower numbers show first |
| `starts_at` / `ends_at` | Optional schedule window. Leave empty for "always on" |

## Examples

- **Promote an event:** set `cta_type = event`, `cta_target = your-event-slug`, `active = true`.
- **Run an ad / external link:** set `cta_type = url`, `cta_target = https://…`.
- **Seasonal banner:** set `starts_at` and `ends_at` — it appears and disappears on its own.

Changes are live the next time the Discover tab loads. If you delete every row or set them all inactive, the app quietly shows the built-in Eventera promo.
