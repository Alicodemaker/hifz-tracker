import { rangeParts } from './format'
import type { Range } from './plan'
import PlayLink from './PlayLink'

// A range description that wraps only between surahs, so "Al-Ahqaf 6–35" never splits across lines.
// With play, each surah's part leads with a PlayLink; a long run ("An-Naba to Al-Layl") gets one, for its first surah.
export default function RangeText({ ranges, play = false }: { ranges: Range[]; play?: boolean }) {
  const parts = rangeParts(ranges)
  const surahs = parts.length === ranges.length ? ranges.map((r) => r.surah) : [ranges[0].surah]
  return parts.map((part, i) => (
    <span key={i}>
      {i > 0 && ', '}
      <span className="range-part">
        {play && surahs[i] !== undefined && <PlayLink surah={surahs[i]} />}
        {part}
      </span>
    </span>
  ))
}
