import { useState } from 'react'
import BackButton from './BackButton'
import type { Saved } from './day'
import { surahArabic, surahName } from './quran'
import { RATINGS, RATING_CHOICES, ratingGroups, type Rating } from './ratings'
import Stars from './Stars'

type Props = {
  saved: Saved
  onRate: (surah: number, rating: Rating) => void
  onOpen: (surah: number) => void // opens its first page in the Mushaf, as from Rabt or Muraja'a
  onBack: () => void
}

const starsOf = (rating: Rating) => RATINGS.find((r) => r.rating === rating)!.stars
const labelOf = (rating: Rating) => RATINGS.find((r) => r.rating === rating)!.label

// Memorised Surahs grouped by how well they are held, so a strong one for salah is quick to find.
export default function Surahs({ saved, onRate, onOpen, onBack }: Props) {
  const [open, setOpen] = useState<number | null>(null) // the Surah whose rating choices show
  const groups = ratingGroups(saved)

  const rate = (surah: number, rating: Rating) => {
    onRate(surah, rating)
    setOpen(null)
  }

  return (
    <main className="screen">
      <header className="screen-head">
        <div className="title-row">
          <BackButton onClick={onBack} label="Back to Today" />
          <h1>Surahs</h1>
        </div>
      </header>

      {groups.length === 0 ? (
        <p className="faded">Surahs appear here once they are memorised.</p>
      ) : (
        <p className="faded small surahs-intro">Tap a surah to rate how well you hold it, or its book to open it in the Mushaf.</p>
      )}

      {groups.map(({ rating, surahs }) => (
        <section key={rating ?? 'none'} className="rating-group">
          <h2 className="section-title rating-title">
            {rating ? (
              <>
                <Stars count={starsOf(rating)} />
                {labelOf(rating)}
              </>
            ) : (
              'Not rated'
            )}
          </h2>
          <ul className="surah-list">
            {surahs.map((surah) => {
              const current = saved.ratings?.[surah]
              return (
                <li key={surah} className={open === surah ? 'open' : ''}>
                  <div className="surah-line">
                    <button className="surah-row" onClick={() => setOpen(open === surah ? null : surah)} aria-expanded={open === surah}>
                      <span className="surah-number faded">{surah}</span>
                      <span className="surah-name">{surahName(surah)}</span>
                      <span lang="ar" className="arabic">
                        {surahArabic(surah)}
                      </span>
                    </button>
                    <button className="surah-open" onClick={() => onOpen(surah)} aria-label={`Open ${surahName(surah)} in the Mushaf`}>
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 6.5C10.2 5.2 7.6 4.6 4 4.8v13c3.6-.2 6.2.4 8 1.7 1.8-1.3 4.4-1.9 8-1.7v-13c-3.6-.2-6.2.4-8 1.7z" />
                        <path d="M12 6.5v13" />
                      </svg>
                    </button>
                  </div>
                  {open === surah && (
                    <div className="segmented rating-choices" role="group" aria-label={`Rate ${surahName(surah)}`}>
                      {RATING_CHOICES.map(({ rating: choice, stars, label }) => (
                        <button key={choice} aria-pressed={current === choice} onClick={() => rate(surah, choice)}>
                          <Stars count={stars} />
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </main>
  )
}
