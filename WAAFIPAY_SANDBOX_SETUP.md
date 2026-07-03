# WaafiPay Sandbox — Setup & Test Guide

Everything needed to test mobile-money payments in the app. The **secret keys live only on the server** (never in the phone app), and these are WaafiPay's **public sandbox (staging) credentials** — no real money moves.

---

## 1. Backend environment variables

Add these four to the backend that the app talks to (the deployment serving `eventera.app`):

```
WAAFIPAY_MERCHANT_UID=M0912255
WAAFIPAY_API_USER_ID=1000312
WAAFIPAY_API_KEY=API-669892958AHX
WAAFIPAY_SANDBOX=1
```

*(Source: WaafiPay's own public sample — github.com/waafipay/sdk-php-sample. Staging environment.)*

**On Vercel:** Project → **Settings** → **Environment Variables** → add each key/value → **Save** → **redeploy** (Deployments → latest → ⋯ → Redeploy).

⚠️ **Important:** `WAAFIPAY_SANDBOX=1` forces *every* WaafiPay charge into test mode. That's exactly what we want now. **Before you take real payments, delete `WAAFIPAY_SANDBOX` and swap in your live WaafiPay merchant credentials.**

*(For local testing instead, put the same four lines in `cardly/.env.local` and run `pnpm dev`.)*

---

## 2. Test mobile-money wallets

Use any of these in the app's payment screen. All PINs are `1212` (the sandbox never really prompts your phone — it just returns success).

| Wallet | Provider | Number to enter | Country in picker |
|---|---|---|---|
| WAAFI Djibouti | WAAFI | `77 11 11 11` | 🇩🇯 +253 |
| EVC Plus | Hormuud | `61 111 1111` | 🇸🇴 +252 |
| ZAAD | Telesom | `63 111 1111` | 🇸🇴 +252 |
| SAHAL | Golis | `90 111 1111` | 🇸🇴 +252 |

*(Enter the local part in the field; the app adds the country code. Full numbers: 25377111111, 252611111111, 252631111111, 252901111111.)*

Test cards (if you later add card checkout): Visa `4111 1111 1111 1111`, exp `12/26`, CVV `123`.

---

## 3. How to test end-to-end

1. In the app, open a **paid** event whose ticket price is set and whose organizer has **WaafiPay enabled** (currency USD, SOS, or DJF).
2. Register → the app shows the **Pay with mobile money** screen.
3. Pick the country (🇩🇯 default), enter a test number above, tap **Pay**.
4. Sandbox returns success instantly → you land on your **ticket + card**.
5. To test a decline, use any random number not in the table.

---

## 4. What's already built

- **App:** phone-number + country picker payment screen, calls `register` (with `preferred_processor: waafipay`) → `/api/payments/waafipay`, waiting state, success → confirmation, friendly decline messages.
- **Backend (already in your repo):** `/api/payments/waafipay` charge route, `lib/payments/waafipay.ts`, and the webhook — all done. It only needed the env vars above.
