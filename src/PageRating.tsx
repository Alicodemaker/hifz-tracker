import { surahName } from './quran'
import { RATING_CHOICES, type Rating } from './ratings'
import Stars from './Stars'

type Props = {
  surahs: number[] // the memorised Surahs on this page
  ratings: Partial<Record<number, Rating>> | undefined
  onRate: (surah: number, rating: Rating) => void
}

// Rating the Surahs on a Mushaf page during Rabt or Muraja'a, from the stars button at the top right.
export default function PageRating({ surahs, ratings, onRate }: Props) {
  return (
    <div className="page-rating" role="dialog" aria-label="Rate surahs">
      {surahs.length === 0 && <p className="page-rating-empty">No memorised surah on this page.</p>}
      {surahs.map((surah) => (
        <div key={surah} className="page-rating-row">
          <p className="page-rating-name">{surahName(surah)}</p>
          <div className="page-rating-choices" role="group" aria-label={`Rate ${surahName(surah)}`}>
            {RATING_CHOICES.map(({ rating, stars, label }) => (
              <button key={rating} aria-pressed={ratings?.[surah] === rating} onClick={() => onRate(surah, rating)}>
                <Stars count={stars} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
