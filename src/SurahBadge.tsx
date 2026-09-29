// The surah banner, after the builder's reference mushaf apps: a thin double frame, a pale band with a vine of small
// flowers on each side, and a rounded panel holding the name. With the exact fonts it's the mushaf's own calligraphy
// of "سورة" and the name (QCF4_QBSML); until then, the bundled font's words.

// Geometry in a 400 × 44 box, mirrored about the middle.
const W = 400
const MID = 22

function Flower({ x, r }: { x: number; r: number }) {
  return (
    <g className="flower">
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4
        const px = x + Math.cos(a) * r * 0.55
        const py = MID + Math.sin(a) * r * 0.55
        return <ellipse key={i} cx={px} cy={py} rx={r * 0.42} ry={r * 0.24} transform={`rotate(${i * 45} ${px} ${py})`} />
      })}
      <circle className="heart" cx={x} cy={MID} r={r * 0.28} />
    </g>
  )
}

// One side's vine and flowers, running from the outer edge (from) to the panel (to).
function Side({ from, to }: { from: number; to: number }) {
  const at = (t: number) => from + (to - from) * t
  const [a, b, c] = [at(0.2), at(0.5), at(0.8)]
  const dir = Math.sign(to - from)
  const leaf = (x: number, up: boolean) => {
    const y = up ? 15 : 29
    const bend = up ? -5 : 5
    return <path key={x} className="leaf" d={`M${x - 5} ${y} Q${x} ${y + bend} ${x + 5} ${y} Q${x} ${y - bend * 0.3} ${x - 5} ${y}Z`} />
  }
  return (
    <g>
      <path
        className="vine"
        d={`M${from} ${MID} C${from + 12 * dir} 12, ${a - 8 * dir} 12, ${a} ${MID} S${b - 8 * dir} 32, ${b} ${MID} S${c - 8 * dir} 12, ${c} ${MID} S${to - 12 * dir} 32, ${to} ${MID}`}
      />
      {[(from + a) / 2, (a + b) / 2, (b + c) / 2, (c + to) / 2].map((x, i) => leaf(x, i % 2 === 0))}
      <Flower x={a} r={7.5} />
      <Flower x={b} r={9} />
      <Flower x={c} r={7.5} />
    </g>
  )
}

type Props = { surah: number; name: string; glyph: string | null } // glyph: the QCF4 name glyph, once its font is loaded

export default function SurahBadge({ surah, name, glyph }: Props) {
  return (
    <div className="surah-badge" role="img" aria-label={`Surah ${surah}, ${name}`}>
      <svg viewBox={`0 0 ${W} 44`} aria-hidden="true">
        <rect className="frame" x="0.6" y="0.6" width={W - 1.2} height="42.8" />
        <rect className="band" x="2.6" y="2.6" width={W - 5.2} height="38.8" />
        <Side from={4} to={116} />
        <Side from={W - 4} to={W - 116} />
        <rect className="panel-edge" x="113" y="5.5" width={W - 226} height="33" rx="16.5" />
        <rect className="panel" x="115" y="7.5" width={W - 230} height="29" rx="14.5" />
      </svg>
      {glyph ? (
        <span className="b-name qcf-name" lang="ar">
          {glyph}
        </span>
      ) : (
        <span className="b-name" lang="ar">
          سُورَةُ {name}
        </span>
      )}
    </div>
  )
}
