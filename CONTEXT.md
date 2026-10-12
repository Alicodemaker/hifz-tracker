# Hifz Tracker

Tracks one person's Quran memorisation (hifz): the new lesson each day, and the revision that keeps what is already memorised strong.

## Quran structure

**Mushaf**:
The printed layout of the Quran that page numbers refer to. Always the 15-line Madani mushaf: 604 pages, 20 pages per juz.
_Avoid_: Quran copy, edition

**Page**:
One page of the Mushaf, numbered 1–604. The unit that all progress and all amounts are measured in, including fractions (¼, ½).
_Avoid_: Sheet, side

**Surah**:
One of the 114 chapters of the Quran. Surahs are the order in which new memorisation moves.
_Avoid_: Chapter, sura

**Ayah**:
One verse within a Surah. The finest position a Hifz can start or end at.
_Avoid_: Verse, line

**Mushaf page**:
One Page shown in the app as it appears in the printed 15-line Madani mushaf: the same words on each of its 15 lines, with Surah headers, the bismillah and Ayah markers, always on light paper.
_Avoid_: Reader, viewer, page view

**Hide mode**:
A way of testing memorisation on the Mushaf page, like a scratch card: the Ayah text is covered by blank shapes of the same size and place, while Surah headers, the bismillah and Ayah markers stay visible. Dragging a finger over the cover rubs it away where the finger passes; a tap reveals nothing. While it is on, a drag never turns the page (buttons do). Once switched on it stays on across pages until switched off, and every page starts fully covered each time it is shown.
_Avoid_: Test mode, quiz, blur mode

**Juz**:
One of the 30 standard divisions of the Quran; in the Mushaf, exactly 20 Pages.
_Avoid_: Para, part, sipara

## The three kinds of work

The app uses the Arab-world halaqa terms, written in the English alphabet.

**Hifz**:
The new portion being memorised for the first time today: a run of Ayahs in Memorisation order, about one Hifz amount long. It may combine several short Surahs, and it ends at a Surah's last Ayah if less than one Hifz amount of that Surah would be left.
_Avoid_: Sabaq, lesson, new work. (Hifz here means the day's new portion; the overall practice is "memorisation".)

**Hifz amount**:
The size of the daily Hifz the person has chosen, in quarter-Page steps (¼, ½, ¾, 1, 1¼ …). It starts at ½ Page and stays until they choose another. Today's Hifz ends at the Ayah that brings it closest to the Hifz amount, so changing the amount is also how today's end is adjusted.
_Avoid_: Daily target, quota, sabaq size

**Pace**:
How fast memorisation moves: the Hifz amount multiplied by how many times a week a Hifz is actually logged (two rounds on one date count twice). It is used to estimate when the current Surah and the whole Quran will be finished.
_Avoid_: Speed, rate, velocity

**Memorisation order**:
The sequence new material is memorised in: Surahs from last to first (an-Nas, al-Falaq, al-Ikhlas, …), each Surah from its first Ayah to its last.
_Avoid_: Direction, progress order

**Rabt**:
Revision of the Surahs memorised just before the current Hifz, one a day in rotation: the memorised Surahs after the Hifz's Surah (in Mushaf order) that start in the juz the next Hifz is in, looping back after the last. A Surah longer than 10 Pages is taken in pieces of about 10 Pages, cut at Page boundaries. With no such Surah, the Rabt is the Surah memorised just before. The rotation moves on only when the Rabt is ticked, and starts again when Hifz moves to the next Surah. Earlier Pages of the Surah being memorised are not part of it.
_Avoid_: Sabqi, recent revision, dhor

**Muraja'a**:
Revision of every memorised Surah outside the Rabt rotation, worked through one Muraja'a slice a day in rotation so everything is revisited regularly. A Surah joins the Muraja'a once it has left the Rabt rotation, usually when Hifz moves to another juz.
_Avoid_: Manzil, old revision, dhor

**Muraja'a slice**:
One day's portion of the Muraja'a, taken in Mushaf order from where the last slice ended, wrapping around after the last memorised Surah. It is made of whole Surahs totalling at most the chosen Muraja'a size (5, 10, 15 or 20 Pages; 10 unless changed in Settings). A Surah longer than that is split at Page boundaries into pieces of about that size. Juz 30 is always two fixed slices: an-Naba to al-Layl, and ad-Duha to an-Nas.
_Avoid_: Manzil slice, portion, chunk

## Days

**Today's plan**:
The Hifz, Rabt and Muraja'a the app suggests for today. A suggestion, not an obligation: the person confirms or adjusts each part. Once every planned part is ticked, the Log is kept and the next plan follows at once, on the same date (with an undo until anything else is ticked).
_Avoid_: Schedule, assignment, target

**Log**:
The record of what was actually done on a given Day, per kind of work. A revision slice that was only partly done counts as not done, and is suggested again in full. Any kind may be absent (e.g. a revision-only day with no Hifz).
_Avoid_: Entry, session, check-in

**Gap**:
One or more days with nothing logged. A Gap never creates overdue work: the next Today's plan continues from where the last Log left off.
_Avoid_: Missed day, streak break, backlog

**Backup**:
A single file holding all of a person's Logs and settings, which they save wherever they choose (e.g. Google Drive) and can restore from.
_Avoid_: Sync, export, cloud save

**Day**:
A local calendar date, midnight to midnight.
_Avoid_: Session
