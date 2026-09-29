// The ornate surah header: a floral band in green with small red buds, a pale central panel with the
// surah name, and a round medallion reading سورة at each end. Drawn for this app, in the style of printed mushafs.
const W = 360
const H = 52
const MID = H / 2

// Leaves along a wavy vine, above and below the central panel.
const LEAVES = Array.from({ length: 22 }, (_, i) => 58 + i * 11.2)

function Medallion({ cx }: { cx: number }) {
  return (
    <g>
      <circle className="b-leaf" cx={cx} cy={MID} r="23" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * 2 * Math.PI
        return <circle key={i} className="b-leaf" cx={cx + 23 * Math.cos(a)} cy={MID + 23 * Math.sin(a)} r="3" />
      })}
      <circle className="b-panel" cx={cx} cy={MID} r="19" />
      <circle className="b-line" cx={cx} cy={MID} r="16.5" />
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * 2 * Math.PI + Math.PI / 6
        return <circle key={i} className="b-accent" cx={cx + 21 * Math.cos(a)} cy={MID + 21 * Math.sin(a)} r="1.4" />
      })}
      <text className="b-word" x={cx} y={MID + 1} textAnchor="middle" dominantBaseline="central">
        سورة
      </text>
    </g>
  )
}

export default function SurahBadge({ name }: { name: string }) {
  return (
    <svg className="surah-badge" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Surah ${name}`}>
      <rect className="b-frame" x="1" y="1" width={W - 2} height={H - 2} rx="5" />
      <rect className="b-line" x="4" y="4" width={W - 8} height={H - 8} rx="3" />
      {/* The vine: a wavy stem with leaves and red buds, top and bottom */}
      <path className="b-stem" d={`M52 9 ${LEAVES.map((x, i) => `Q${x + 5.6} ${i % 2 ? 5 : 13} ${x + 11.2} 9`).join(' ')}`} />
      <path className="b-stem" d={`M52 ${H - 9} ${LEAVES.map((x, i) => `Q${x + 5.6} ${i % 2 ? H - 5 : H - 13} ${x + 11.2} ${H - 9}`).join(' ')}`} />
      {LEAVES.map((x, i) => (
        <g key={x}>
          <path className="b-leaf" d={`M${x} 9 q5 ${i % 2 ? -6 : 6} 10 0 q-5 ${i % 2 ? 3 : -3} -10 0z`} />
          <path className="b-leaf" d={`M${x} ${H - 9} q5 ${i % 2 ? 6 : -6} 10 0 q-5 ${i % 2 ? -3 : 3} -10 0z`} />
          {i % 3 === 1 && <circle className="b-accent" cx={x + 5} cy="9" r="1.6" />}
          {i % 3 === 1 && <circle className="b-accent" cx={x + 5} cy={H - 9} r="1.6" />}
        </g>
      ))}
      <Medallion cx={30} />
      <Medallion cx={W - 30} />
      {/* Central panel with cusped ends */}
      <path className="b-panel" d="M84 15 H276 Q286 15 290 21 L294 26 L290 31 Q286 37 276 37 H84 Q74 37 70 31 L66 26 L70 21 Q74 15 84 15Z" />
      <path className="b-line" d="M86 17.5 H274 Q282 17.5 286 22.5 L289 26 L286 29.5 Q282 34.5 274 34.5 H86 Q78 34.5 74 29.5 L71 26 L74 22.5 Q78 17.5 86 17.5Z" />
      <text className="b-name" x={W / 2} y={MID + 1} textAnchor="middle" dominantBaseline="central">
        سُورَةُ {name}
      </text>
    </svg>
  )
}
