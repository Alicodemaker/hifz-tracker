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
One verse within a Surah. The finest position a Sabaq can start or end at.
_Avoid_: Verse, line

**Juz**:
One of the 30 standard divisions of the Quran; in the Mushaf, exactly 20 Pages.
_Avoid_: Para, part, sipara

## The three kinds of work

**Sabaq**:
The new portion being memorised for the first time today: an Ayah range within one Surah. Its size is expressed in Pages (default ½).
_Avoid_: Lesson, new work

**Memorisation order**:
The sequence new material is memorised in: Surahs from last to first (an-Nas, al-Falaq, al-Ikhlas, …), each Surah from its first Ayah to its last.
_Avoid_: Direction, progress order

**Sabqi**:
Revision of the most recently memorised 5 Pages' worth of material (by Memorisation order), revised in full each day. Material older than that belongs to the Manzil.
_Avoid_: Recent revision, dhor (ambiguous between regions)

**Manzil**:
Revision of all memorised material outside the Sabqi, worked through one Manzil slice a day in rotation so everything is revisited regularly.
_Avoid_: Old revision, dhor

**Manzil slice**:
One day's portion of the Manzil, taken in Mushaf order from where the last slice ended, wrapping around after the last memorised Surah. It is made of whole Surahs totalling at most 10 Pages. A Surah longer than 10 Pages is split at Page boundaries into pieces of about 10 Pages. Juz 30 is always two fixed slices: an-Naba to al-Layl, and ad-Duha to an-Nas.
_Avoid_: Portion, chunk, daily manzil

## Days

**Today's plan**:
The Sabaq, Sabqi and Manzil the app suggests for today. A suggestion, not an obligation: the person confirms or adjusts each part.
_Avoid_: Schedule, assignment, target

**Log**:
The record of what was actually done on a given Day, per kind of work. A revision slice that was only partly done counts as not done, and is suggested again in full. Any kind may be absent (e.g. a revision-only day with no Sabaq).
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
