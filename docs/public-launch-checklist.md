# Public launch checklist

Everything to handle before releasing Hifz Tracker to the public. Written 12 Oct 2026 from a review of the whole
app; not started yet, since a public launch is still a while off. Ticked items are already done.

## Must do before release

### Legal and content

- [ ] **Permission for the exact mushaf font (QCF4).** ADR-0009 notes the KFGQPC QCF fonts may not be
      redistributed without permission. The app avoids storing them by downloading them from jsDelivr on request,
      which is a grey area for personal use but not for a public app. Get written permission from KFGQPC (they do
      grant it for Quran apps), or ship the public version with the bundled font only.
- [ ] **Quran text checked by a qualified person** (a hafiz or teacher) across all 604 pages. ADR-0007 records that
      the bundled layout puts one word on a neighbouring line on pages 345 and 577: fix it or say so clearly. Give
      people a way to report a text error.
- [ ] **Credits and licences.**
  - [x] A Credits section in Settings names the text and font sources.
  - [ ] Include the licence texts. The Quran text is CC BY 4.0, the bundled KFGQPC font must ship unmodified with
        its terms, Amiri and Figtree are under the SIL Open Font License, and quran-qcf4's page data is MIT.
  - [ ] Choose a licence for the app's own code.
- [ ] **Short privacy note.** No accounts, and nothing leaves the phone, except that the optional font download
      reveals the user's IP address to jsDelivr. This is a selling point, so say it plainly.

### Fitting people other than the builder

- [x] **First run starts empty**, with a short setup (what the app plans, what is memorised, where Hifz starts).
- [ ] **Memorisation direction.** Hifz runs only backwards from an-Nas (ADR-0003). Many people memorise forwards
      from al-Baqarah, or juz by juz. Either support forward order or state clearly who the app is for. This is the
      biggest product decision before launch.
- [ ] **The revision method is the builder's own.** The Rabt rules (ADR-0010) and Muraja'a slices (ADR-0005)
      follow one teacher's method. At least explain them in the app, including the other names people know them by
      (sabaq, sabqi, manzil).
- [ ] **Onboarding and help:** what Hifz, Rabt and Muraja'a mean, how ticking and undo work, and why to back up.
      The setup's welcome step covers the first part only.

### Data safety

- [ ] **Choose the app's final address now.** It shares `alicodemaker.github.io` with every other GitHub Pages
      project, and any of them can wipe its data (clearing that site's data, or a `localStorage.clear()`). Moving
      later means every user must back up and restore. Use an own domain, or an own Cloudflare Pages or Netlify site.
- [ ] **Safer restore.** Restore checks only a few fields, so a damaged or edited file could break the app after
      restoring. Validate fully, and plan how future versions will upgrade old saves and old backup files (the save
      format has a version number, but no upgrade code yet).
- [ ] **A safety net for crashes and full storage.** A fallback screen offering Back up and Restore instead of a
      blank page, and a message when saving fails because the phone is full.
- [x] **Backup reminder** two weeks after the last backup (or after two weeks of use without one), with a note in
      History on why a backup matters.

## Should do

- [ ] **Test on iPhone.** It has never been tested there. In a plain Safari tab (not installed), Safari deletes the
      data after 7 days without use. Backups go through the iOS share sheet; keep-screen-on and the 36 MB font
      download also need checking.
- [ ] **Test across devices and browsers:** small phones (320px), tablets, Samsung Internet, Firefox, landscape, and
      Android's "large text" setting.
- [ ] **Updates shouldn't interrupt memorising.** The app reloads itself when a new version arrives. Check that this
      can't happen mid-session, or switch to an "Update available" button.
- [ ] **Warn before the 36 MB font download** to use Wi-Fi.
- [ ] **Accessibility pass** with a screen reader (TalkBack) and large text.
- [ ] **A feedback channel:** an email link or GitHub Issues, especially for Quran text errors.

## Nice to have

- [ ] **Store-ready details:** check the name ("Hifz Tracker" is common), add screenshots and a richer install card
      in the manifest.
- [ ] **Distribution:** a web link only, or the Play Store as well. The Play Store needs a privacy policy, a
      data-safety form and a $25 fee. A native wrapper (e.g. Capacitor, not a Trusted Web Activity) would also allow
      showing the Mushaf page above the lock screen, as athkar apps do; a web app can't.
- [ ] **Arabic or Urdu interface**, for reach.

## Suggested order

1. Decide first: the font permission, the memorisation direction and the app's address. These change what gets
   built.
2. Then: onboarding and help, licences and privacy note, data-safety hardening, iPhone and device testing.
3. Start the Quran text review early, since it involves another person.
