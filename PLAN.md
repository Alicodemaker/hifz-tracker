# PLAN: Hifz Tracker v1.1 (Mushaf page, Hifz amount, pace)

The finished v1 plan is in `docs/plans/PLAN-v1.md`.

## What we're doing

Three changes from using the live app. Tapping the Hifz, Rabt or Muraja'a area opens the exact Mushaf page (KFGQPC text and 15-line layout, ADR-0007), so I can memorise without switching apps. The Hifz − / + now changes my daily Hifz amount in ¼-page steps (starting at ½), and the "End ayah" text becomes estimates of when I'll finish the surah and the Quran at my real pace (ADR-0008). A hide mode on the page lets me test myself ayah by ayah. The installed app's navigation bar stops being white in dark mode.

## Steps

1. **Navigation bar**: set the manifest's theme and background colours to the dark paper colour, and check the built manifest.
2. **Hifz amount** (test-first): progress remembers a Hifz amount (default ½ page, ¼-page steps, from ¼ up to 5 pages). Today's Hifz ends at the ayah closest to it, and older saves load with ½.
3. **Pace estimates in Today's Hifz row** (test-first): Hifz days per week from the last 4 weeks of history (every day until 4 weeks exist) give the time to finish the current surah and the Quran, as friendly durations. The − / + change the Hifz amount by ¼ page, and the middle text shows the two estimates. Everything else stays as it is now.
4. **Mushaf data**: a build script turns `@quran.ws/text` into a compact per-page file of 15 lines (with surah headers and bismillah), with each line split into its ayah pieces. The KFGQPC font ships unmodified with its licence. Tests check pages 1, 467 and 604 line by line.
5. **Mushaf page screen**: light paper even in dark mode; header with English surah name, page number and juz; each line justified; surah header bands; lapis ayah markers; thin margin marks where today's portion starts and ends. Offline.
6. **Opening and moving**: tapping an area (not its buttons) opens the page where that portion starts. Swiping right goes to the next page, across all 604. The back link and the phone's back gesture return to Today.
7. **Hide mode**: a medium-sized round button floats at the bottom right and fades out after about 10 seconds without a touch; any touch brings it back. It turns hide mode on or off across all pages: ayah text becomes faint blank shapes in exactly its place and width, while headers, the bismillah and ayah markers stay visible. Tapping an ayah reveals it, tapping again hides it, and each page starts fully hidden whenever it is shown.

## What we're NOT doing

- No search, bookmarks, audio, translation or tafsir
- No tapping on the page except to reveal or hide an ayah in hide mode (no word lookup, no word-by-word reveal)
- No hizb or rub' fractions in the page header
- No dark-mode page (the Mushaf page stays light, by choice)
- No pixel-identical glyph fonts or page images (ADR-0007), and no other mushaf editions
- No ayah-by-ayah end adjustment: the ¼-page amount is the only control
- No settings screen for Rabt size or Muraja'a slice size; they stay 5 and 10 pages
- No changes to the Rabt and Muraja'a rules, Setup, History or Backup

## How we'll know it works

1. Today shows Ghafir 1–5 at ½ page. Tapping + gives about ¾ page (e.g. Ghafir 1–7) with shorter finish estimates, and tomorrow's plan keeps ¾ page.
2. Tapping the Rabt area opens page 478 with the same 15 lines as the printed page. Swiping right shows page 479, and the phone's back gesture returns to Today. The same works in airplane mode.
3. Turning hide mode on blanks the ayahs but keeps the headers and markers. Tapping an ayah shows it, and tapping again hides it. On the next page everything starts hidden, and after 10 seconds without a touch the button fades out.
4. After reinstalling, the navigation bar is dark, not white, when the phone is in dark mode.
