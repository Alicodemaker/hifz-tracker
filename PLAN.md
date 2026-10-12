# PLAN: Hifz Tracker v1.2 (Surah ratings, day done, page tools)

The finished plans are in `docs/plans/` (`PLAN-v1.md`, `PLAN-v1.1.md`).

## What we're doing

Changes from my note cards. I rate each Surah myself (★ weak, ★½ last page missing, ★★ holes, ★★★ strong) and see at a glance which ones are strong enough for salah. Rabt becomes one Surah from the current juz. When all three kinds are ticked, the app moves straight on to the next day's plan, with an undo. On the Mushaf page, the Done button and the counter go. Hifz opens one ayah at a time, hide mode becomes a scratch card, and a drawing pen marks weak spots.

## Steps

1. ✅ **Mushaf page clean-up**: remove the floating Done button and the read-through counter, and the count on Today's Hifz card. Hide and back stay; older saves with a count still load.
2. ✅ **Surah ratings and Surahs screen**: a Surahs screen (linked from Today) lists memorised Surahs grouped by rating, strongest first, with unrated ones last. Tapping a Surah's stars sets its rating, and tapping the same rating again clears it. Ratings are kept on the phone and go into the Backup. Planning never reads them.
3. ✅ **Rabt is one Surah** (test-first): each day's Rabt is one Surah, or 10 Pages of a Surah longer than 10 Pages (split at Page boundaries). It starts at the Surah after the current Hifz Surah in Mushaf order (Hifz in al-Mulk → Rabt starts at al-Qalam) and moves one Surah (or piece) on each time Rabt is ticked. After the end of the current Hifz's juz, it loops back to the start. Whole Surahs that start in that juz count, even when they run into the next juz. When nothing qualifies, it is the most recently finished Surah. Surahs outside the current juz are Muraja'a. Update `CONTEXT.md` and add an ADR.
4. ✅ **All three done → next day** (test-first): ticking the last kind (a kind with nothing planned counts as done) logs the day to History, moves progress on and shows the next plan at once, after the big celebration. An "Undo" button brings back the day as it was, with that last kind unticked, until something else is ticked or the date changes. Several rounds on one date show as separate History entries, and Pace counts each round.
5. ✅ **Ayah by ayah**: opened from Hifz, the page shows only the first ayah of today's Hifz, zoomed in to fill the page (at the builder's request, instead of blank shapes for the rest). A "+1 ayah" button adds the next ayah, and only the ayahs shown so far fill the page, until the page's last ayah; then the whole page shows as usual and the button goes. Every time the page is opened from Hifz, it starts at one ayah again. There is no new mode button.
6. ✅ **Scratch to reveal**: hide mode no longer reveals on tap. With hide mode on, dragging a finger over a blank ayah rubs it away where the finger passes, like a scratch card. A tap only shows or hides the floating buttons, as now. While hide mode or the pen is on, a drag never turns the page, and small ‹ › buttons with the other floating buttons do it instead. Update hide mode in `CONTEXT.md`.
7. ✅ **Drawing pen**: a pen button the same size as hide sits beside it. When it's on, a finger draws over the page in red, and a "Clear page" button appears. Drawings are kept for each page and each font look (they don't line up across looks), stay until cleared, and go into the Backup.
8. ✅ **Rating on the page and a smaller title** (added at the builder's request): opened from Muraja'a, a star button at the top right, opposite the back button, opens a panel to rate the memorised Surahs on that page. The Hifz surah name on Today is smaller, so its vowel marks clear the double rule above.
9. ✅ **Fixes from the builder's phone**: on Today, the Rabt and Muraja'a surah names in Arabic sit flush right, with no gap before them. Ayah by ayah in the exact font reads right to left (it showed each line's words reversed). Opened from Hifz, the page turns only through the pages of the Hifz Surah. Hide mode goes back to tap-to-reveal: tapping an ayah shows it and tapping again hides it (this replaces step 6's scratch card); with the pen on, a drag still draws and the ‹ › buttons turn the page.

## What we're NOT doing

- No hasanat counter for now (still a maybe; it would lift v1's "no stats" rule)
- No rating prompt after Muraja'a, no automatic rating changes over time, and ratings never change the plan
- No juz checklist for Muraja'a, and no change to how Muraja'a slices work
- No revision of earlier pages of the current Hifz Surah in the app (done by hand during Hifz)
- No colours, pen sizes or eraser for drawing; only Clear page
- No tomorrow preview before all three are done
- No separate ayah-by-ayah button
- No Arabic-script labels or new settings

## How we'll know it works

1. Rate al-Mulk ★★★ and al-Qalam ★: the Surahs screen shows al-Mulk under strong and al-Qalam under weak, and both are still there after a Backup and restore.
2. Tick Hifz, Rabt and Muraja'a: Today shows the next Hifz, a different single Rabt Surah and the next Muraja'a slice, and History shows the finished round. Undo removes that History entry and brings back the ticks with Muraja'a unticked.
3. Opened from Hifz, the page shows only the first Hifz ayah, and "+1 ayah" adds the next until the whole page shows. With hide mode on, tapping an ayah does nothing, rubbing it reveals it, and the page doesn't turn. With the pen on, a line drawn on page 562 is still there after going back and reopening the page.
