import type { ReactNode } from 'react'
import ayahByAyah from './assets/intro/ayah-by-ayah.webp'
import hideAndPen from './assets/intro/hide-and-pen.webp'
import mushaf from './assets/intro/mushaf.webp'
import surahsDark from './assets/intro/surahs-dark.webp'
import surahsLight from './assets/intro/surahs-light.webp'
import Tick from './Tick'

type Card = { title: string; picture: ReactNode; body: ReactNode; note?: string }

// Each card has a picture of what it talks about: a sketch from the app's own pieces, or a screenshot of the app
// taken by `npm run intro-shots`.
const CARDS: Card[] = [
  {
    title: 'Your hifz, planned each day',
    picture: (
      <div className="intro-kinds">
        <span>Hifz</span>
        <span>Rabt</span>
        <span>Muraja'a</span>
      </div>
    ),
    body: (
      <ul className="setup-kinds">
        <li>
          <strong>Hifz</strong>: the new portion to memorise today.
        </li>
        <li>
          <strong>Rabt</strong>: revision of what you memorised recently.
        </li>
        <li>
          <strong>Muraja'a</strong>: revision of everything older, in rotation.
        </li>
      </ul>
    ),
    note: 'Memorisation runs from an-Nas back towards al-Fatiha, in the 15-line Madani mushaf.',
  },
  {
    title: 'Tick each one done',
    picture: (
      <div className="intro-done">
        <span className="on">
          <Tick /> Hifz
        </span>
        <span className="on">
          <Tick /> Rabt
        </span>
        <span>Muraja'a</span>
      </div>
    ),
    body: (
      <p>
        When all three are done, the day goes into History and tomorrow's plan shows straight away. Change how much Hifz
        you take each day, and the app tells you when you will finish.
      </p>
    ),
  },
  {
    title: 'Memorise from the Mushaf',
    picture: <img className="intro-crop" src={mushaf} alt="Surah al-Ikhlas on a page of the Madani mushaf" />,
    body: (
      <p>
        Tap a portion on Today to open its page in the 15-line Madani mushaf. Download the exact mushaf font once
        (36 MB) from any page to see it like this.
      </p>
    ),
  },
  {
    title: 'Tools on the page',
    picture: (
      <div className="intro-phones">
        <img src={ayahByAyah} alt="A page going ayah by ayah, three ayahs in" />
        <img src={hideAndPen} alt="A page with its ayahs hidden, one shown and underlined with the pen" />
      </div>
    ),
    body: (
      <p>
        Go ayah by ayah, adding one at a time. Hide the text and tap an ayah to test yourself, and mark weak spots with
        the pen.
      </p>
    ),
  },
  {
    title: 'Know your strong Surahs',
    picture: (
      <picture>
        <source srcSet={surahsDark} media="(prefers-color-scheme: dark)" />
        <img className="intro-crop faded-end" src={surahsLight} alt="The Surahs screen, grouped by rating" />
      </picture>
    ),
    body: (
      <p>
        Rate each memorised Surah from weak to strong, and see at a glance which are ready for salah. Everything stays
        on this phone, so make a Backup from History now and then.
      </p>
    ),
  },
]

type Props = {
  card: number
  onCard: (card: number) => void
  onSetUp: () => void
  notice: ReactNode // a message from Restore
  restore: ReactNode // the Restore link, for a moved phone
}

// The first-run intro: five cards on what the app does, then on to setting it up. Skip goes straight there.
export default function Intro({ card, onCard, onSetUp, notice, restore }: Props) {
  const { title, picture, body, note } = CARDS[card]
  const last = card === CARDS.length - 1
  return (
    <main className="screen setup intro">
      <header className="screen-head intro-head">
        <span className="faded small">Hifz Tracker</span>
        {!last && (
          <button className="link" onClick={onSetUp}>
            Skip
          </button>
        )}
      </header>
      {notice}
      <div className="intro-picture">{picture}</div>
      <h1 className="intro-title">{title}</h1>
      <div className="intro-body">{body}</div>
      {note && <p className="faded small">{note}</p>}

      <div className="action-bar">
        <div className="intro-dots" role="img" aria-label={`${card + 1} of ${CARDS.length}`}>
          {CARDS.map((_, i) => (
            <span key={i} className={i === card ? 'on' : ''} />
          ))}
        </div>
        <div className="row">
          {card > 0 && (
            <button className="button quiet" onClick={() => onCard(card - 1)}>
              Back
            </button>
          )}
          <button className="button primary" onClick={last ? onSetUp : () => onCard(card + 1)}>
            {last ? 'Set up' : 'Next'}
          </button>
        </div>
        <p className="faded small hint">Moving from another phone? {restore}</p>
      </div>
    </main>
  )
}
