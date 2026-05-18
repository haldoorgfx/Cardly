# TESTING CHECKLIST

Manual test plan. Run this yourself, on a real phone, before calling it done. No exceptions.

---

## A. SIGN UP FLOW

1. - [ ] Open `/` on desktop Chrome
2. - [ ] Click "Start free" CTA in hero
3. - [ ] Land on `/signup`
4. - [ ] Fill in email + password with a brand new email address
5. - [ ] Submit the form
6. - [ ] If email verification is required: check inbox, click the link
7. - [ ] Land on `/dashboard` after confirming
8. - [ ] Dashboard shows empty state (no events yet)

---

## B. EVENT CREATION FLOW

Prepare: have a real card design ready as a PNG or JPG (at least 1080×1080px).

9.  - [ ] Click "New event" from dashboard
10. - [ ] Upload your design file
11. - [ ] Editor opens with your design as the canvas background
12. - [ ] Add a text zone: drag onto the name area, label it "Full Name"
13. - [ ] Set font and color on the text zone
14. - [ ] Add a photo zone: drag onto the photo area, label it "Photo", set to circle shape
15. - [ ] Drag a zone to reposition it
16. - [ ] Resize a zone using the handles
17. - [ ] Make a change, wait 2 seconds — check that "Saved" indicator appears
18. - [ ] Press Cmd+Z (Mac) or Ctrl+Z (Windows) — confirm last action undoes
19. - [ ] Click "Publish"
20. - [ ] Event status changes to "Published"
21. - [ ] Copy the public link (e.g., `cardly.app/c/your-event-slug`)

---

## C. ATTENDEE FLOW — incognito tab, on a real phone

Open a new incognito window (or use your actual phone — not a simulator).

22. - [ ] Paste the public link into the browser address bar
23. - [ ] Page loads without login prompt
24. - [ ] Your event design is visible
25. - [ ] The zone labels you defined are shown as input fields
26. - [ ] Type a name into the "Full Name" field
27. - [ ] Tap the photo zone — photo picker opens
28. - [ ] Select a photo from camera roll
29. - [ ] Photo cropping UI appears and works
30. - [ ] Confirm the crop
31. - [ ] Tap "Generate my card" (or equivalent button)
32. - [ ] Card is generated — preview appears
33. - [ ] **Visual check:** the name you typed appears in the card at the position you defined. The photo appears cropped correctly.
34. - [ ] Tap "Download"
35. - [ ] PNG downloads to the device (check the Photos app or Downloads folder)
36. - [ ] **Open the downloaded PNG** — confirm it matches the preview (no font shift, no missing image, no watermark if on a paid plan)
37. - [ ] Free tier: downloaded PNG has the Cardly watermark at the bottom
38. - [ ] Success screen appears after download

---

## D. SHARE BUTTONS (test from the success screen)

39. - [ ] WhatsApp button opens WhatsApp with a pre-filled message
40. - [ ] Instagram button works (opens Instagram or Stories on mobile)
41. - [ ] Twitter/X button opens Twitter with pre-filled text
42. - [ ] "Copy link" copies the event link to clipboard (paste into Notes to verify)

---

## E. MOBILE TESTS

Repeat sections B and C on:

43. - [ ] iPhone, iOS Safari
44. - [ ] Android phone, Chrome
45. - [ ] Slow network: open Chrome devtools → Network → set to "Slow 4G" and re-run the attendee flow

Specific mobile checks:
46. - [ ] All tap targets are large enough to hit with a thumb (nothing tiny)
47. - [ ] Form keyboard does not overlap input fields
48. - [ ] Page does not require horizontal scrolling at 375px width
49. - [ ] Photo upload from camera works (not just from gallery)

---

## F. EDGE CASES

50. - [ ] Attendee uploads a very large photo (>10MB) — what happens? Should show a useful error or compress automatically.
51. - [ ] Attendee submits the form without filling in a required field — should show a clear error
52. - [ ] Two people fill out the same event at the same time — both should get their own card, no conflict
53. - [ ] Visit a published event that was later deleted by the designer — should show a clear "not found" message, not a crash
54. - [ ] Visit an unpublished (draft) event URL — should not be publicly accessible
55. - [ ] Visit an archived event URL — check what the attendee sees

---

## G. DASHBOARD — DESIGNER

56. - [ ] Dashboard shows all your events
57. - [ ] Event count and status (draft / published / archived) display correctly
58. - [ ] Click into an event detail page — view count and download count shown
59. - [ ] Edit button opens the editor
60. - [ ] Archive event works
61. - [ ] Delete event works — associated attendee data is gone too (check Supabase)
62. - [ ] "Copy link" on a published event copies the correct URL

---

## H. MARKETING PAGES

63. - [ ] `/` loads, all sections visible, no layout breaks
64. - [ ] `/pricing` loads, billing toggle (monthly/yearly) works
65. - [ ] `/use-cases` loads, all 6 categories visible
66. - [ ] `/how-it-works` loads, all 4 steps visible
67. - [ ] `/about` loads
68. - [ ] `/privacy` loads
69. - [ ] `/terms` loads
70. - [ ] `/contact` loads, email link works
71. - [ ] All "Start free" CTAs link to `/signup`
72. - [ ] Mobile menu (hamburger) opens and works if visible
73. - [ ] Footer links all resolve (no `#` placeholders)

---

## Pass criteria

Every checkbox above is ticked. No crashes on the happy path. Edge cases degrade gracefully (error messages, not blank screens or 500s). The downloaded PNG matches the preview visually.

If any item fails, fix it before moving forward. Do not mark it "good enough to ship" if the attendee can't download their card.
