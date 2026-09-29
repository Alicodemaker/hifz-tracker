# PLAN: Hifz Tracker version 1

## What we're doing

A phone-first, offline PWA that tells me each morning what to do today (Hifz, Rabt and Muraja'a) and lets me log it with one tap. It follows the rules in `CONTEXT.md` and `docs/adr/`: pages of the Madani mushaf, surahs memorised backwards, a 5-page Rabt, Muraja'a slices of at most 10 pages, and gaps that pause instead of piling up. Everything is stored on the phone, with a backup file I can save to Google Drive. I use it myself for two weeks before adding anything else.

## Steps

1. ✅ **Scaffold**: Vite + React + TypeScript, set up as an installable PWA that loads offline, deployed to GitHub Pages so it can be installed on the phone from day one.
2. ✅ **Quran data**: a local data file (generated from the `quran-meta` and `quran-json` npm packages, because tanzil.net is blocked from the build environment; attribution in the file) covering the 114 surahs, their ayah counts, the page each ayah is on, the juz boundaries and ayah lengths for estimating sizes. Tests check known facts (604 pages, Juz 30 starts at page 582, Fussilat starts at page 477).
3. ✅ **Planning rules**, written test-first as plain functions with no UI:
   - Hifz: about ½ page, combining short surahs and finishing a surah if less than ½ page of it would be left.
   - Rabt: the last 5 pages' worth of material.
   - Muraja'a slices: whole surahs, at most 10 pages, long surahs split by page, Juz 30 in two fixed halves, wrapping around at the end.
   - Gaps and partial days: the plan pauses, and a partly done slice comes back in full.
4. ✅ **Setup screen**: tick memorised surahs, or whole juz, and set the next Hifz position. The defaults are my real state: an-Nas → Fussilat memorised, next Hifz Ghafir 1.
5. ✅ **Today screen**: three cards (Hifz, Rabt, Muraja'a) showing surah and ayah ranges with sizes in pages. Big "Done" buttons sit at the bottom within thumb reach, and I can adjust the Hifz end ayah before tapping. Logs are saved to on-device storage.
6. **History and backup**: a list of logged days. "Back up" creates one file and opens the phone's share sheet (so I can pick Save to Drive), and "Restore" loads that file back.

## What we're NOT doing

- No accounts, backend, sync or direct Google Drive integration (ADR-0004)
- No streaks, stats, charts, badges or progress percentages
- No reminders or notifications
- No weak-juz marking or extra revision for weaker juz
- No multiple people, parent mode or teacher mode
- No other mushaf layouts (Indo-Pak) and no switching between them (ADR-0001)
- No Quran text, audio or tafsir, only surah and ayah references
- No settings screen: Hifz size ½ page, Rabt 5 pages and slice size 10 pages are fixed, and you adjust on the day instead
- No Arabic-script labels (the English alphabet only), and no day start based on Fajr or a custom time
- No catch-up or backlog after missed days (ADR-0002)

## How we'll know it works

1. On first launch, setup is pre-filled with an-Nas → Fussilat. Today's plan shows Hifz = Ghafir 1–n (about ½ page), a 5-page Rabt ending at Fussilat, and a Muraja'a slice of at most 10 pages.
2. Put the phone in airplane mode, reopen the installed app, tap Done on all three cards and reopen: the logs are still there, and tomorrow's plan moves forward correctly. After skipping two days, the plan picks up exactly where it stopped.
3. Tap Back up, save to Drive, clear the site data, Restore from Drive: all history is back.
