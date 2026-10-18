import { surahName } from './quran'

// Experiment: a quick way to hear a Surah recited, by opening a YouTube search for it. Needs a connection.
const searchUrl = (surah: number) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(`Surah ${surahName(surah)}`)}`

export default function PlayLink({ surah }: { surah: number }) {
  return (
    <a
      className="play-link"
      href={searchUrl(surah)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Search YouTube for Surah ${surahName(surah)}`}
    >
      {/* The triangle is centred by its box, then nudged right by a twelfth of its width so it reads as centred. */}
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8.25 6.5v11l9-5.5z" />
      </svg>
    </a>
  )
}
