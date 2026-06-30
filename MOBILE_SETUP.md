# Eventera → Native Mobile (Flutter) — Setup

Goal of v1: a real Android app on your phone that logs into your **existing**
Supabase. No new backend. Build screens later.

Android-first on this Windows PC. iPhone comes later via a cloud Mac (Codemagic) —
the same code, no rewrite.

---

## Step 1 — Install Android Studio  ← YOU, do this first

This is the only thing blocking us. It carries the Android SDK + an emulator.

1. Download: https://developer.android.com/studio
2. Run the installer, accept the defaults (keep "Android Virtual Device" checked).
3. Launch Android Studio once. It runs a "Setup Wizard" that downloads the
   Android SDK — let it finish (a few minutes, needs internet).
4. Accept SDK licenses. In a fresh terminal run:
   ```
   flutter doctor --android-licenses
   ```
   Press `y` to all.
5. Confirm it worked:
   ```
   flutter doctor
   ```
   `[✓] Android toolchain` should now be green.

Tip: you can also just plug in your real Android phone with **USB debugging**
turned on instead of using the emulator — often faster.

---

## Step 2 — Create the project  ← YOU run, I prepped the rest

In a terminal, go to the Eventera folder and create the app *inside* it so I can
write code into it:

```
cd C:\Users\cabda\cardly
flutter create eventera_mobile
```

Tell me when that's done — then I write the Supabase wiring (Step 3) directly
into `eventera_mobile/`.

---

## Step 3 — Connect to Supabase  ← ME

I'll:
- add the `supabase_flutter` package,
- create a small config file (gitignored) with your existing Supabase URL +
  anon key,
- replace `lib/main.dart` with a starter that initializes Supabase and shows a
  "connected / signed in" test screen.

Your public Supabase URL + anon key are already in `.env.local` — I'll reuse
those exact values. (The anon key is the safe client key, made for shipping in
apps. The service-role key stays server-only and never goes in the app.)

---

## Step 4 — Run it  ← YOU

```
cd C:\Users\cabda\cardly\eventera_mobile
flutter run
```

Pick your phone or the emulator. You should see the app launch and report it
connected to Supabase. That's v1 of the foundation done — from there we build
screens (attendee flow first).

---

## What we are NOT doing yet (on purpose)
- Not rebuilding all 146 web features.
- Not touching the web app — it keeps running.
- Not setting up iOS yet — Android first, then Codemagic for iPhone.
