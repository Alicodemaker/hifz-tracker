# Hifz Tracker

A mobile-first web app (PWA) for people memorising the Quran (hifz) to track their daily lessons and revision.

## Users and domain

- Users are people memorising the Quran, or someone tracking on their behalf.
- Work is tracked in three kinds:
  - **Hifz**: the new portion being memorised today (called *sabaq* in South Asia).
  - **Rabt**: daily revision of recently memorised material (*sabqi*).
  - **Muraja'a**: revision of older memorisation, rotated so the whole memorised portion stays fresh (*manzil*).
- Use these three terms, in the English alphabet, in the UI, code and docs. `CONTEXT.md` is the glossary.
- The Quran is divided into surahs, ayahs, juz and pages. Progress is expressed in these units.

## Product constraints

- **Mobile-first, one-handed use.** Put primary actions in large tap targets near the bottom of the screen, within thumb reach. Design for a phone first; larger screens are secondary.
- **Works offline.** The app is an installable PWA and must work fully without a connection.
- **No runtime API calls.** Quran structure data (surahs, ayahs, juz, pages) ships with the app as local data. User progress is stored on the device. One exception: the optional one-time download of the QCF4 Mushaf fonts (ADR-0009).
- **Keep it simple.** Version 1 has no backend, no accounts and no sync. Don't add them without an explicit decision.

## Status

Version 1.1 is built. See `PLAN.md` for the current plan.
