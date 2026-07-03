# Eventera — Notifications & Push Setup

## What's already built (in code)

**In-app notifications — done.**
- Mobile Notifications screen groups New / Earlier, taps through to the event, and **updates live** (a Supabase realtime subscription reloads the moment a notification arrives).
- The web now **creates** attendee notifications at three moments (via the existing `createNotification` helper): **ticket confirmed** (free + every paid path: WaafiPay, Stripe, Flutterwave), **new event from a followed organizer** (on publish), and **event updates** (time/venue change → notifies confirmed attendees).

**Database — run this:** `supabase/049_notifications_realtime_and_devices.sql`
- Adds `notifications` to the realtime publication (so the live subscription fires).
- Creates `user_devices` (FCM token storage) with own-row RLS.

**Web changes need a Vercel deploy** to go live (the mobile realtime + 049 take effect immediately).

---

## Push notifications (Firebase Cloud Messaging) — your setup

Push can't be added to the app build until the Firebase config file exists (the Android build fails without it), so these are the steps only you can start. Everything after the config file, I can wire.

### Step 1 — Create the Firebase project (you)
1. Go to https://console.firebase.google.com → **Add project** → name it "Eventera".
2. **Add app → Android.** Package name: `com.example.eventera_mobile` (from `android/app/build.gradle` — confirm the `applicationId`).
3. Download **`google-services.json`** and place it at: `eventera_mobile/android/app/google-services.json`.
4. (iOS later: add an iOS app, download `GoogleService-Info.plist`.)

### Step 2 — Get the sender credential (you)
- Firebase Console → Project settings → **Cloud Messaging**, and → **Service accounts → Generate new private key** (a JSON). This is what the server uses to send pushes. Keep it secret.

### Step 3 — I wire the app (after Step 1)
Once `google-services.json` is in place, tell me and I'll apply:
- `pubspec.yaml`: add `firebase_core` + `firebase_messaging`.
- `android/build.gradle` + `android/app/build.gradle`: add the Google Services gradle plugin.
- A new `lib/push_service.dart`: request permission, get the FCM token, and upsert it to `user_devices` on sign-in; refresh on token change; handle taps that open the right screen.
- `main.dart`: initialize Firebase + the push service.

I'll keep it all behind a safe init so a missing config never crashes the app.

### Step 4 — The push sender (after Step 2)
A **Supabase Edge Function** triggered when a `notifications` row is inserted: it reads the recipient's `user_devices` tokens and calls the FCM HTTP v1 API with your service-account key. I'll write the function; you deploy it with the Supabase CLI and set the service-account key as a secret. (Alternative: send FCM directly from the web `createNotification` helper using the key in Vercel env — simpler, but only covers web-created notifications.)

---

## Event reminders (scheduled)

Reminders ("your event starts in 24h") need a job that runs on a schedule — nothing in the app can self-trigger this. Two options:

- **Supabase pg_cron** (recommended): a SQL function that, once an hour, inserts an `event_reminder` notification for confirmed attendees of events starting in the next 24h (and not already reminded). I can write this function; you enable the `pg_cron` extension and schedule it.
- **Vercel Cron**: a `/api/cron/reminders` route (protected by a secret) hitting the same logic, scheduled in `vercel.json`.

Say which you prefer and I'll write it.

---

## Recommended order

1. Run `049_notifications_realtime_and_devices.sql` in Supabase. ✅ in-app goes fully live.
2. Deploy the web app to Vercel. ✅ notifications start getting created.
3. Test in-app on the phone (rebuild): register for an event → you get a "ticket confirmed" notification; the bell updates live.
4. When ready for push: do Firebase Steps 1–2, tell me, and I'll wire Steps 3–4 + reminders.
