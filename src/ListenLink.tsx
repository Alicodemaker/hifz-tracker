import { surahName } from './quran'

// Experiment: a quick way to hear a Surah recited, by opening a YouTube search for it. Needs a connection.
// Headphones, not a play triangle, so it doesn't read as opening the Surah to read.
const searchUrl = (surah: number) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(`Surah ${surahName(surah)}`)}`

export default function ListenLink({ surah }: { surah: number }) {
  return (
    <a
      className="listen-link"
      href={searchUrl(surah)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Listen to Surah ${surahName(surah)} on YouTube`}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path className="band" d="M5.5 14.5V12a6.5 6.5 0 0 1 13 0v2.5" />
        <rect x="3.5" y="13" width="4.5" height="6.5" rx="1.5" />
        <rect x="16" y="13" width="4.5" height="6.5" rx="1.5" />
      </svg>
    </a>
  )
}
