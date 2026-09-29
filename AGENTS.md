# Hifz Tracker

A mobile-first web app (PWA) for people memorising the Quran (hifz) to track their daily lessons and revision.

## Users and domain

- Users are people memorising the Quran, or someone tracking on their behalf.
- Work is tracked in three kinds:
  - **Sabaq**: the new lesson being memorised today.
  - **Sabqi**: recent revision of what was memorised in the last few days or weeks.
  - **Manzil**: revision of older memorisation, rotated so the whole memorised portion stays fresh.
- The Quran is divided into surahs, ayahs, juz and pages. Progress is expressed in these units.

## Product constraints

- **Mobile-first, one-handed use.** Put primary actions in large tap targets near the bottom of the screen, within thumb reach. Design for a phone first; larger screens are secondary.
- **Works offline.** The app is an installable PWA and must work fully without a connection.
- **No runtime API calls.** Quran structure data (surahs, ayahs, juz, pages) ships with the app as local data. User progress is stored on the device.
- **Keep it simple.** Version 1 has no backend, no accounts and no sync. Don't add them without an explicit decision.

## Status

No app code yet. Plan before building.
