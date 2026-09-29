import badge from './assets/surah-badge.webp'

// The surah header: the builder's own ornamental badge (green arabesque with a سورة medallion at each end),
// with the surah name written in its central panel, as on the reference page.
export default function SurahBadge({ name }: { name: string }) {
  return (
    <div className="surah-badge" role="img" aria-label={`Surah ${name}`}>
      <img src={badge} alt="" />
      <span className="b-name" lang="ar">
        سُورَةُ {name}
      </span>
    </div>
  )
}
