# Eventera — Mobile App Store Submission Kit

Everything you need to submit the Eventera app to **Google Play** and the **Apple App Store**.
The app code is store-ready (bundle IDs `so.eventera.app`, permission strings, deep links, domain `eventera.so` all set). What remains is signing, listing content, and the console work below — most of it manual and yours to do, but this kit gives you the exact text and steps.

**Reality check:** you can build, sign, and *submit* in a day. Apple/Google **review** then takes ~1–7 days (sometimes longer for a first submission). Plan the public announcement around the **web** launch (already live at eventera.so); the app becomes publicly downloadable after they approve.

---

## 0. App identity (use these everywhere)

| Field | Value |
|---|---|
| App name | **Eventera** |
| Subtitle / short | The complete event platform |
| Bundle ID (iOS) / Application ID (Android) | `so.eventera.app` |
| Version | `1.0.0` (build `1`) |
| Category | Events (primary) · Business (secondary) |
| Website | https://eventera.so |
| Privacy policy URL | https://eventera.so/privacy |
| Support email | support@eventera.so |
| Marketing email | hello@eventera.so |
| Content rating | Everyone / 4+ |

> **Fix before building:** `pubspec.yaml` still has `description: "A new Flutter project."` — change it to
> `description: "Eventera — discover events, register, and get your personalized Eventera Card."`

---

## 1. Store listing copy

### Short description (Play, max 80 chars)
> Discover events, register in seconds, and get your own shareable Eventera Card.

### Promotional text (App Store, max 170 chars)
> Find events near you, register in seconds, and walk away with a personalized Eventera Card to share. QR check-in, tickets, and networking — all in one app.

### Full description (both stores)
```
Eventera is the complete event platform — and the only one where every attendee
gets a personalized card to share.

DISCOVER
• Find conferences, festivals, workshops and community events near you or anywhere.
• Search by city, category, and date.

REGISTER IN SECONDS
• Free and paid tickets, with a fast, mobile-first checkout.
• Pay your way — card, and mobile money (WaafiPay) where available.

YOUR EVENTERA CARD
• Every registration generates a personalized, branded card — your name, your photo, the event's brand.
• Share it to Instagram, WhatsApp, and X in one tap. No designer needed.

AT THE EVENT
• Your ticket and QR code live in the app.
• Fast QR check-in on the door.
• Meet people with attendee networking and 1:1 messaging.

FOR ORGANIZERS
• Run your event from your pocket: scan attendees in, register walk-ins, take cash at the door, and watch live stats.
• Multi-day check-in, meal and access passes, and an audit trail of every scan.

Built mobile-first for how events actually run — including offline-tolerant check-in for venues with patchy signal.

Made in Djibouti, for organizers everywhere.
```

### Keywords (App Store, max 100 chars, comma-separated)
```
events,tickets,event,conference,networking,rsvp,qr check-in,festival,meetup,registration,organizer
```

### Play tags / categorization
Primary category **Events**. Add tags: Events, Business, Productivity.

---

## 2. Data safety (Play) & Privacy nutrition (App Store)

Declare exactly what the app collects. Eventera collects:

| Data | Why | Linked to identity? | Used for tracking? |
|---|---|---|---|
| **Email address** | Account / auth | Yes | No |
| **Name** | Account, ticket, card | Yes | No |
| **Photos** (optional) | Personalizing the Eventera Card | Yes | No |
| **Camera** | Scanning QR codes at check-in (not stored) | No | No |
| **Precise location** (optional) | "Events near me" discovery | No | No |
| **Phone number** (optional) | Mobile-money payment (WaafiPay) | Yes | No |
| **Purchase history** | Your tickets/orders | Yes | No |

Key answers:
- **Is data encrypted in transit?** Yes.
- **Can users request deletion?** Yes — in-app account deletion + support@eventera.so.
- **Do you use data for tracking / advertising?** No.
- **Third parties:** Supabase (backend), Stripe/Flutterwave/WaafiPay (payments), Resend (email), Sentry (crash reporting). List these as processors.

---

## 3. Screenshots (required)

Take from the running app on these device classes. Show real, polished screens — no placeholder data.

**Suggested 5 screens (in order):**
1. **Discover** — event feed with search/filters.
2. **Event page** — a rich event with the "Register & get your Eventera Card" CTA.
3. **The Eventera Card** — the reveal/share moment (your differentiator — lead with it).
4. **My ticket** — ticket + QR in the wallet.
5. **Organizer check-in** — the live scan screen with stats.

**Required sizes:**
- **Play:** phone 1080×1920 (min 2, up to 8). Optional 7" & 10" tablet.
- **App Store:** 6.7" iPhone (1290×2796) **and** 6.5" (1242×2688). iPad 12.9" if you enable iPad.
- Feature graphic (Play): 1024×500.

---

## 4. Android — sign & build (Play)

Currently the release build uses a scaffolded `signingConfig`; Play rejects debug-signed AABs, so create an upload keystore.

```powershell
# 1) Generate an upload keystore (keep the password safe — you cannot recover it)
keytool -genkey -v -keystore $env:USERPROFILE\eventera-upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias eventera

# 2) Create android/key.properties (NOT committed) with:
#    storePassword=...
#    keyPassword=...
#    keyAlias=eventera
#    storeFile=C:/Users/cabda/eventera-upload.jks

# 3) Confirm android/app/build.gradle.kts reads key.properties and wires a real
#    release signingConfig (replace any debug signing in the release buildType).

# 4) Build the app bundle
cd C:\Users\cabda\cardly\eventera_mobile
flutter clean
flutter build appbundle --release
# → build/app/outputs/bundle/release/app-release.aab
```

In **Play Console:** create the app (Application ID `so.eventera.app`) → complete the listing (copy above) → Data safety → content rating questionnaire → upload the `.aab` to Production (or Closed testing first) → roll out.

> Enable **Play App Signing** when prompted — Google manages the app signing key and you keep the upload key.

---

## 5. iOS — sign & build (App Store) — needs a Mac

iOS builds **cannot** be produced on Windows. Use a Mac (or a Mac cloud/CI like Codemagic).

```bash
# On a Mac with Xcode:
# 1) Apple Developer portal → register App ID so.eventera.app
# 2) Create a Distribution certificate + App Store provisioning profile
# 3) Open the project
cd eventera_mobile
open ios/Runner.xcworkspace
#    In Xcode: select the Runner target → Signing & Capabilities → set your Team.
# 4) Build the archive
flutter build ipa --release
#    → build/ios/ipa/*.ipa
# 5) Upload via Xcode Organizer or Transporter to App Store Connect
```

In **App Store Connect:** create the app → fill the listing (copy above) → App Privacy (nutrition labels from §2) → upload build → submit for review.

> First-time review can ask for a **demo account** — create a test attendee login and provide it in "App Review Information," plus a note that organizer features are reached by switching mode in the profile.

---

## 6. Pre-submission checklist

- [ ] `pubspec.yaml` description updated (see §0).
- [ ] `eventera.so` is live and serving `/api/render`, `/privacy`, `/api/payments/waafipay` (app hardcodes the domain — it must resolve). ✅ live.
- [ ] Android: real release keystore + `key.properties` + release `signingConfig`.
- [ ] `flutter build appbundle --release` succeeds; `.aab` produced.
- [ ] iOS: App ID + cert + profile; `flutter build ipa --release` succeeds on a Mac.
- [ ] Screenshots captured for all required sizes.
- [ ] Data safety / privacy labels completed (§2).
- [ ] Demo attendee account created for reviewers.
- [ ] `flutter analyze` shows 0 errors.
- [ ] Deep links: host `/.well-known/assetlinks.json` (Android) and AASA (iOS) on eventera.so for verified links (optional; app works without it via chooser).

---

## 7. After you submit

- Play: review usually hours–2 days; a first app can take longer.
- App Store: typically 1–3 days; be responsive to any reviewer questions.
- Announce the **web** launch now; say the app is "coming to the App Store & Google Play." Flip to "download now" once approved.

---

## What I can't do for you (and why)
- **Keystore / certificate passwords** and **account creation** — these are credentials; you must generate and enter them.
- **iOS build** — requires a Mac.
- **Store console submission** — done in your Play/Apple accounts.
Everything else (app code, domain, permissions, deep links, listing copy above) is ready.
