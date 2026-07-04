# WaafiPay Sandbox — Setup & Test Guide

Everything needed to test mobile-money payments. The **secret keys live only on the server** (never in the phone app or client bundle), and the values below are WaafiPay's **public sandbox credentials** — no real money moves.

> ✅ **Verified working end-to-end** (web checkout → WaafiPay charge → confirmed ticket) with the exact steps below. If it stops working, re-check the four things in order: (1) endpoint TLDs, (2) env vars, (3) WaafiPay enabled on the event, (4) ticket currency.

---

## 1. Backend environment variables

Add these four to the deployment the app talks to (currently `karta.cre8so.com` on Vercel):

```
WAAFIPAY_MERCHANT_UID=M0912255
WAAFIPAY_API_USER_ID=1000312
WAAFIPAY_API_KEY=API-669892958AHX
WAAFIPAY_SANDBOX=1
```

**On Vercel:** Project → **Settings** → **Environment Variables** → add each key/value (mark them Sensitive), set them for **Production** and **Preview** → **Save** → redeploy (push to `master`, or Deployments → latest → ⋯ → Redeploy).

⚠️ `WAAFIPAY_SANDBOX=1` forces *every* WaafiPay charge into test mode against the sandbox endpoint. That's what we want while testing.

*(For local testing instead, put the same four lines in `cardly/.env.local` and run `pnpm dev`.)*

---

## 2. API endpoints (IMPORTANT — the TLDs are easy to get wrong)

These are hardcoded in `lib/payments/waafipay.ts` and selected automatically. **Do not change the domains** — getting the top-level domain wrong (`.com` vs `.net`) returns a misleading **"Authentication failed"** error even when the credentials are correct.

| Mode | Endpoint | When it's used |
|---|---|---|
| **Sandbox** | `https://sandbox.waafipay.net/asm` | `WAAFIPAY_SANDBOX` is set (any value) |
| **Production** | `https://api.waafipay.com/asm` | `NODE_ENV=production` **and** `WAAFIPAY_SANDBOX` is **unset** |

Note the split: sandbox is `waafipay.**net**`, production is `waafipay.**com**`. (Source: [WaafiPay Docs](https://docs.waafipay.com/api-introduction).)

---

## 3. Enable WaafiPay on the event (REQUIRED — the step that's easy to forget)

WaafiPay does **not** appear at checkout until the organizer turns it on for that specific event. Without this, the web checkout shows only "Credit / Debit Card," and the mobile app's WaafiPay request is silently ignored by the backend.

**Organizer dashboard → the event → Settings → Registration tab → Payment methods → tick "Mobile money (WaafiPay)" → Save changes.**

- You can enable Card + WaafiPay together (buyers pick at checkout).
- The ticket **currency must be USD, SOS, or DJF** — WaafiPay only offers itself for those. A ticket in any other currency won't show the Mobile Money option even when enabled.
- Under the hood this writes `waafipay` into `event_pages.payment_processors`. The register route only routes to WaafiPay when that array contains `waafipay`.

---

## 4. Test mobile-money wallets

Enter the **local part** in the payment field; the country-code picker adds the prefix. **The picker country must match the number** (a Somalia number under a Djibouti +253 code will fail).

| Wallet | Provider | Country in picker | Number to type | Proven |
|---|---|---|---|---|
| EVC Plus | Hormuud | 🇸🇴 +252 | `611111111` | ✅ verified success |
| ZAAD | Telesom | 🇸🇴 +252 | `631111111` | from WaafiPay sample |
| SAHAL | Golis | 🇸🇴 +252 | `901111111` | from WaafiPay sample |
| WAAFI Djibouti | WAAFI | 🇩🇯 +253 | `77111111` | from WaafiPay sample |

The sandbox returns success instantly — it does **not** actually prompt a phone. **`611111111` on 🇸🇴 +252 is the one confirmed working end-to-end.** To test a decline, use any random number not in this list.

---

## 5. How to test end-to-end (web)

1. Open the public event page → **Get tickets**.
2. Choose the paid ticket → **Continue** → fill details → **Continue** → **Pay** step.
3. Under **Payment method**, pick **Mobile Money (East Africa)** → **Pay**.
4. On the **"Pay with mobile money"** screen: country **🇸🇴 +252**, number **`611111111`** → **Pay $X**.
5. Sandbox approves instantly → you land on **"Registration Confirmed"** with a QR ticket.

**Mobile app:** the app already sends `preferred_processor: waafipay`, so once the event has WaafiPay enabled (step 3) and the env vars are set, the phone flow works the same way — no per-build change needed.

---

## 6. Going live (when you're ready to take real money)

1. Get your **live** WaafiPay merchant credentials (real `MERCHANT_UID`, `API_USER_ID`, `API_KEY`) from your WaafiPay merchant account.
2. In Vercel env vars: **delete `WAAFIPAY_SANDBOX`** and replace the three credential values with the live ones.
3. Redeploy. With sandbox off + `NODE_ENV=production`, the code automatically uses `https://api.waafipay.com/asm`.
4. Do one small **real** transaction (e.g. a $1 ticket) to confirm, then refund it from your WaafiPay dashboard.

---

## 7. What's already built (no code changes needed)

- **Web checkout:** `components/registration/RegistrationClient.tsx` — payment-method selector (Card / Mobile Money / Flutterwave, currency-aware), WaafiPay phone screen, success → confirmation.
- **Organizer control:** `components/events/EventSettingsView.tsx` — the "Payment methods" toggle (Settings → Registration).
- **Mobile app:** phone + country picker screen → `/api/events/[id]/register` (with `preferred_processor: waafipay`) → `/api/payments/waafipay`.
- **Backend:** `app/api/payments/waafipay/route.ts` (charge), `lib/payments/waafipay.ts` (gateway + endpoints), `app/api/payments/waafipay-webhook/route.ts` (webhook). Success flips the registration to `paid`/`confirmed` and issues the QR ticket.

---

## 8. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| **"Authentication failed"** | Wrong endpoint TLD, or bad/rotated credentials | Confirm endpoints in §2; re-check env var values for typos/whitespace. If endpoints are right and creds are the sample ones, the sample keys may have been rotated — get fresh sandbox creds from WaafiPay. |
| **Only "Credit / Debit Card" shows at checkout** | WaafiPay not enabled on the event, or ticket currency isn't USD/SOS/DJF | Do §3. |
| **Payment declines with a valid-looking number** | Picker country doesn't match the number | Match country to number (§4). |
| **"Payment service unavailable" (503)** | Env vars missing on the server | Add all four (§1) and redeploy. |
