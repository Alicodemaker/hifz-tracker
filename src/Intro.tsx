import type { ReactNode } from 'react'
import mushaf from './assets/intro/mushaf.webp'
import surahsDark from './assets/intro/surahs-dark.webp'
import surahsLight from './assets/intro/surahs-light.webp'
import CardNav from './CardNav'
import { AyahByAyahIcon, EyeIcon, PenIcon } from './icons'
import { useSwipe } from './swipe'
import Tick from './Tick'

type Card = { title: string; picture: ReactNode; body: ReactNode }

// Little pictures for the three kinds: something new growing, going back over what is recent, and a stack of old.
const KINDS = [
  {
    name: 'Hifz',
    what: 'New memorisation',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 21v-8" />
        <path d="M12 13c0-4-3-6.5-7.5-6.5 0 4 3 6.5 7.5 6.5z" />
        <path d="M12 11c0-3.5 2.5-6.5 7.5-6.5 0 4-3 6.5-7.5 6.5z" />
      </svg>
    ),
  },
  {
    name: 'Rabt',
    what: 'Recent revision',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
        <path d="M4.5 3.8v4.5H9" />
      </svg>
    ),
  },
  {
    name: "Muraja'a",
    what: 'Older revision',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3.5" y="15" width="17" height="4.5" rx="1" />
        <rect x="5" y="9.75" width="14" height="4.5" rx="1" />
        <rect x="6.5" y="4.5" width="11" height="4.5" rx="1" />
      </svg>
    ),
  },
]

// The intro: one idea a card, a few concise words, and a big picture (a sketch from the app's
// own pieces, or a screenshot taken by `npm run screenshots`). The sketches come in with a short animation, once.
const CARDS: Card[] = [
  {
    title: 'Your daily plan',
    picture: (
      <div className="intro-kinds">
        {KINDS.map((kind) => (
          <div key={kind.name}>
            <span className="intro-kind-icon">{kind.icon}</span>
            <strong>{kind.name}</strong>
            <span className="small">{kind.what}</span>
          </div>
        ))}
      </div>
    ),
    body: <p>The app plans all three for you each day.</p>,
  },
  {
    title: 'Tick each one done',
    picture: (
      <div className="intro-ticking">
        <div className="intro-done">
          {['Hifz', 'Rabt', "Muraja'a"].map((kind) => (
            <span key={kind} className="on">
              <Tick /> {kind}
            </span>
          ))}
        </div>
        <p className="intro-tomorrow">Next day's plan ready</p>
      </div>
    ),
    body: <p>When all three are done, the next day's plan appears.</p>,
  },
  {
    title: 'Open the Mushaf',
    picture: <img className="intro-crop" src={mushaf} alt="Surah al-Ikhlas on a page of the Madani mushaf" />,
    body: <p>Tap Hifz, Rabt or Muraja'a on Today to open its page.</p>,
  },
  {
    title: 'Tools on the page',
    picture: (
      <ul className="intro-tools">
        <li>
          <span className="intro-tool pill">
            <AyahByAyahIcon />
            Ayah by ayah
          </span>
          One ayah at a time
        </li>
        <li>
          <span className="intro-tool">
            <EyeIcon struck />
          </span>
          Hide the text to test yourself
        </li>
        <li>
          <span className="intro-tool">
            <PenIcon />
          </span>
          Mark weak spots
        </li>
      </ul>
    ),
    body: <p>They sit at the bottom of the page. If they fade, tap the screen.</p>,
  },
  {
    title: 'Know your strong Surahs',
    picture: (
      <picture>
        <source srcSet={surahsDark} media="(prefers-color-scheme: dark)" />
        <img className="intro-crop faded-end" src={surahsLight} alt="The Surahs screen, grouped by rating" />
      </picture>
    ),
    body: <p>Rate each Surah from one to three stars and see which are ready for salah.</p>,
  },
]

type Props = {
  card: number
  onCard: (card: number) => void
  onDone: () => void // after the last card, or on Skip
  doneLabel: string // the last card's button: "Set up" on the first run, "Done" when replayed from Settings
  notice?: ReactNode // a message from Restore
  restore?: ReactNode // the Restore link, for a moved phone (first run only)
}

// The intro: five cards on what the app does, by Next and Back or by swiping. On the first run it leads into setup;
// Settings can replay it.
export default function Intro({ card, onCard, onDone, doneLabel, notice, restore }: Props) {
  const { title, picture, body } = CARDS[card]
  const last = card === CARDS.length - 1
  const swipe = useSwipe(
    () => !last && onCard(card + 1),
    () => card > 0 && onCard(card - 1),
  )
  return (
    <main className="screen setup intro" {...swipe}>
      <header className="screen-head intro-head">
        <span className="faded small">Hifz Tracker</span>
        {!last && (
          <button className="link" onClick={onDone}>
            Skip
          </button>
        )}
      </header>
      {notice}
      <div key={card} className="card-in">
        <div className="intro-picture">{picture}</div>
        <h1 className="intro-title">{title}</h1>
        <div className="intro-body">{body}</div>
      </div>

      <CardNav
        count={CARDS.length}
        index={card}
        onIndex={onCard}
        doneLabel={doneLabel}
        onDone={onDone}
        hint={restore && <>Moving from another phone? {restore}</>}
      />
    </main>
  )
}
