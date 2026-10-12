import { useState } from 'react'
import BackButton from './BackButton'
import type { Saved } from './day'
import { surahArabic, surahName } from './quran'
import { RATINGS, RATING_CHOICES, ratingGroups, type Rating } from './ratings'
import Stars from './Stars'

type Props = { saved: Saved; onRate: (surah: number, rating: Rating) => void; onBack: () => void }

const starsOf = (rating: Rating) => RATINGS.find((r) => r.rating === rating)!.stars
const labelOf = (rating: Rating) => RATINGS.find((r) => r.rating === rating)!.label

// Memorised Surahs grouped by how well they are held, so a strong one for salah is quick to find.
export default function Surahs({ saved, onRate, onBack }: Props) {
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
        <p className="faded small surahs-intro">Tap a surah to rate how well you hold it.</p>
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
                  <button className="surah-row" onClick={() => setOpen(open === surah ? null : surah)} aria-expanded={open === surah}>
                    <span className="surah-number faded">{surah}</span>
                    <span className="surah-name">{surahName(surah)}</span>
                    <span lang="ar" className="arabic">
                      {surahArabic(surah)}
                    </span>
                  </button>
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
