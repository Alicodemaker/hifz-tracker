import { rangePart, rangeParts } from './format'
import type { Range } from './plan'
import PlayLink from './PlayLink'

// A range description that wraps only between surahs, so "Al-Ahqaf 6–35" never splits across lines.
// With play, every surah is named, even in a long run, and each name ends with its PlayLink instead of a comma.
export default function RangeText({ ranges, play = false }: { ranges: Range[]; play?: boolean }) {
  if (play)
    return ranges.map((r, i) => (
      <span key={i}>
        {i > 0 && ' '}
        <span className="range-part with-play">
          {rangePart(r)}
          <PlayLink surah={r.surah} />
        </span>
      </span>
    ))
  return rangeParts(ranges).map((part, i) => (
    <span key={i}>
      {i > 0 && ', '}
      <span className="range-part">{part}</span>
    </span>
  ))
}
