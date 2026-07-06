# Mobile Check-in Scanner — Integration Spec

The one mobile-appropriate organizer gap from `MOBILE_GAP_AUDIT.md`. Drop-in ready;
needs the Flutter build loop (Android Studio) to verify.

**Status:** code written, **not build-tested** (no Dart toolchain in the authoring
environment). Treat as a working draft — build, run, and click through it before trusting.

---

## Files added
- `supabase/058_checkin_rpc.sql` — `checkin_registration(event_id, qr_token)` RPC
  (SECURITY DEFINER; enforces event ownership; returns a jsonb result). Mirrors the
  web `/api/events/[id]/checkin` logic so both surfaces behave the same.
- `eventera_mobile/lib/screens/organizer/checkin_scanner_screen.dart` — the scanner
  screen. Camera reticle, torch/flip, live result banner (green/amber/red), session
  counter. Calls the RPC via `Supabase.instance.client.rpc(...)`.

## 1. Apply the RPC (Supabase SQL editor)
Paste `supabase/058_checkin_rpc.sql` and run. Verify:
```sql
select public.checkin_registration('<an-event-id>', '<a-real-qr-token>');
```
It should return `{"result":"success", ...}` the first time and
`{"result":"already_checked_in", ...}` the second.

## 2. Add the scanner package (`eventera_mobile/pubspec.yaml`)
Under `dependencies:` (alongside the existing `qr_flutter`, which only *generates* QR):
```yaml
  mobile_scanner: ^5.2.3
```
Then `flutter pub get`.

## 3. Camera permission
**Android** — `eventera_mobile/android/app/src/main/AndroidManifest.xml`, above `<application>`:
```xml
<uses-permission android:name="android.permission.CAMERA" />
```
**iOS** — `eventera_mobile/ios/Runner/Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>Scan attendee QR codes to check them in.</string>
```

## 4. Wire it into the organizer event screen
In `eventera_mobile/lib/screens/organizer/event_detail_screen.dart`, add an action tile
next to the existing "Edit fields" / "Share link" tiles (only meaningful once the event
is published):
```dart
import 'checkin_scanner_screen.dart';
// ...
_actionTile(
  icon: Icons.qr_code_scanner,
  title: 'Check in attendees',
  subtitle: 'Scan QR codes at the door',
  onTap: () => Navigator.of(context).push(MaterialPageRoute(
    builder: (_) => CheckinScannerScreen(
      eventId: widget.eventId,
      eventName: widget.initialName,
    ),
  )),
),
```
(Match the exact `_actionTile(...)` signature already used in that file.)

## 5. Test loop (device or emulator with a camera)
1. Publish a test event; register a test attendee (get their QR from My Tickets).
2. Open the event on mobile → **Check in attendees** → grant camera → scan the QR.
3. Expect a green banner with the attendee name + ticket. Scan again → amber
   "Already checked in". Scan a random QR → red "not recognised".
4. Confirm the web Registrations tab shows the attendee as checked in (same DB).

## Unverified caveats (check during the build)
- **`mobile_scanner` API version.** Written against v5.x (`MobileScannerController`,
  `onDetect: (BarcodeCapture)`, `toggleTorch`, `switchCamera`). If you pin a different
  major version the controller API may differ slightly.
- **RPC column names.** Assumes `registrations` has `ticket_type_id`, `payment_status`,
  `amount_paid`, `checked_in_by` (per migrations 017/031/040). If a name differs, the
  `select * ... %rowtype` still works but the payment guard may need a tweak.
- **RLS.** The RPC is SECURITY DEFINER so it runs regardless of RLS; ownership is
  enforced inside the function. Don't remove that ownership check.
- **Token format.** `extractCheckinToken` mirrors `lib/qr/token.ts` (raw token or
  `?token=` URL). If your attendee QR encodes a different format, adjust that one function.
