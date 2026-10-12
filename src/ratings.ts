// Surah ratings: how well the person says each memorised Surah is held. Planning never reads them.
import type { Saved } from './day'

export type Rating = 'strong' | 'holes' | 'lastPage' | 'weak'

// Strongest first, with each rating's stars (a half for "last page missing") and meaning.
export const RATINGS: { rating: Rating; stars: number; label: string }[] = [
  { rating: 'strong', stars: 3, label: 'Strong' },
  { rating: 'holes', stars: 2, label: 'Holes' },
  { rating: 'lastPage', stars: 1.5, label: 'Last page missing' },
  { rating: 'weak', stars: 1, label: 'Weak' },
]

// Choosing the rating a Surah already has clears it.
export const setRating = (saved: Saved, surah: number, rating: Rating): Saved => {
  const ratings = { ...saved.ratings }
  if (ratings[surah] === rating) delete ratings[surah]
  else ratings[surah] = rating
  return { ...saved, ratings }
}

export type RatingGroup = { rating: Rating | null; surahs: number[] }

// Memorised Surahs by rating, strongest first and unrated last; empty groups are left out.
export const ratingGroups = (saved: Saved): RatingGroup[] => {
  const memorised = [...saved.progress.memorised].sort((a, b) => a - b)
  const of = (rating: Rating | null) => memorised.filter((s) => (saved.ratings?.[s] ?? null) === rating)
  return [...RATINGS.map(({ rating }) => rating), null]
    .map((rating) => ({ rating, surahs: of(rating) }))
    .filter((group) => group.surahs.length > 0)
}
