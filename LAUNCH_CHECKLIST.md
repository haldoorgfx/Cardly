# LAUNCH CHECKLIST

A real checklist for a real launch. Check every box yourself, on a real phone, before sending the URL to anyone.

---

## PRE-LAUNCH — Must be true before sending to anyone

### Content & Copy
- [ ] All placeholder testimonials removed (done — none remain)
- [ ] All footer links resolve (no `#` placeholders)
- [ ] `/privacy` page exists and loads
- [ ] `/terms` page exists and loads
- [ ] `/contact` page exists and loads
- [ ] Contact email (hello@cardly.app) actually receives email — test it
- [ ] WhatsApp number on `/contact` is your real number
- [ ] Footer city is correct (Djibouti, not Lagos)
- [ ] No fake stats on the landing page
- [ ] Pricing page only lists features that are built

### Auth
- [ ] Sign up with a new email works end-to-end
- [ ] Email confirmation (if enabled) works
- [ ] Login with existing account works
- [ ] Logout works
- [ ] Password reset works (if implemented)
- [ ] Redirect after login goes to dashboard

### Event Creation
- [ ] "New event" button on dashboard works
- [ ] PNG upload works (test a real design file)
- [ ] JPG upload works
- [ ] File too large (>10MB) shows a useful error, not a crash
- [ ] Editor opens with the uploaded design as background
- [ ] Adding a text zone works
- [ ] Adding a photo zone works
- [ ] Drag to reposition a zone works
- [ ] Resize a zone works
- [ ] Auto-save triggers after edits (watch for "Saved" indicator)
- [ ] Undo (Cmd+Z / Ctrl+Z) works
- [ ] Publish button works
- [ ] Published event gets a usable public URL

### Attendee Flow — Test in incognito, on a real phone
- [ ] Public link opens without login
- [ ] Event design loads correctly
- [ ] Name field accepts text
- [ ] Photo upload works on mobile (camera roll and camera)
- [ ] Photo cropping works
- [ ] "Generate" button produces a card
- [ ] Generated card visually matches what the designer set up
- [ ] PNG download works on iOS Safari
- [ ] PNG download works on Android Chrome
- [ ] Success screen appears after download
- [ ] Share buttons (WhatsApp, etc.) open correct apps

### Performance & Reliability
- [ ] Landing page loads in under 3 seconds on 4G (test with Chrome devtools throttling)
- [ ] Attendee page loads in under 3 seconds on 4G
- [ ] Card generation completes in under 10 seconds
- [ ] No console errors on landing page
- [ ] No console errors on attendee page

### Infrastructure
- [ ] Supabase project is on a paid plan or within free tier limits for launch
- [ ] Vercel deployment is live and not on a preview URL
- [ ] Custom domain set up (if using one)
- [ ] Environment variables are set in Vercel (not just local .env.local)
- [ ] Supabase RLS policies are active — test that one user cannot access another's events

### Payments (if live before launch)
- [ ] Stripe is connected
- [ ] Test card charges work in Stripe test mode
- [ ] Live mode tested with a real card
- [ ] Pro and Studio signup flows work end-to-end
- [ ] Downgrade/cancellation tested

### If payments are NOT live
- [ ] Pro and Studio CTAs either redirect to email or show "coming soon"
- [ ] Free tier works fully and is the only active plan

### Analytics & Monitoring
- [ ] Analytics installed (Vercel Analytics, Plausible, or similar)
- [ ] Error tracking installed (Sentry or similar) — OR you have a "report a bug" mailto link visible
- [ ] Vercel error logs checked — no server errors on deploy

---

## LAUNCH DAY

- [ ] Send the URL to 5 specific people via WhatsApp or email
- [ ] Each message is personal — not a blast, not a template
- [ ] You told each person specifically what you want them to try
- [ ] You are available to respond within 2 hours
- [ ] Vercel error logs monitored hourly for the first 6 hours
- [ ] Watch the first attendee complete the flow — record if possible (Loom, screen record)

---

## POST-LAUNCH — First 72 hours

- [ ] Reply to every message within 4 hours
- [ ] Fix any crash bugs same-day
- [ ] Take verbatim notes on what users say (write down their exact words)
- [ ] Do not add new features — only fix what is broken
- [ ] Check generated cards for visual accuracy (download a few from real attendees)
- [ ] Check Supabase storage usage — make sure large photo uploads aren't filling storage unexpectedly

---

## What this list does NOT cover

This list is for the technical launch. The product launch (marketing, press, community posts) is a separate decision. Ship to 5 people first, fix what breaks, then consider whether you're ready for a bigger push.
