import { rangePart, rangeParts } from './format'
import type { Range } from './plan'
import ListenLink from './ListenLink'

// A range description that wraps only between surahs, so "Al-Ahqaf 6–35" never splits across lines.
// With listen, every surah is named, even in a long run, and each name ends with its ListenLink instead of a comma.
export default function RangeText({ ranges, listen = false }: { ranges: Range[]; listen?: boolean }) {
  if (listen)
    return ranges.map((r, i) => (
      <span key={i}>
        {i > 0 && ' '}
        <span className="range-part with-listen">
          {rangePart(r)}
          <ListenLink surah={r.surah} />
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
