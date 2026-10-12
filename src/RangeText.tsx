import { rangeParts } from './format'
import type { Range } from './plan'

// A range description that wraps only between surahs, so "Al-Ahqaf 6–35" never splits across lines.
export default function RangeText({ ranges }: { ranges: Range[] }) {
  return rangeParts(ranges).map((part, i) => (
    <span key={i}>
      {i > 0 && ', '}
      <span className="range-part">{part}</span>
    </span>
  ))
}
