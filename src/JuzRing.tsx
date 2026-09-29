// One Juz as a ring that fills as it is memorised.
type Props = { juz: number; share: number; size?: number }

export default function JuzRing({ juz, share, size = 48 }: Props) {
  const stroke = size / 12
  const r = (size - stroke) / 2
  const length = 2 * Math.PI * r
  const full = share >= 0.995
  return (
    <svg
      className={`ring ${full ? 'full' : ''}`}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`Juz ${juz}: ${Math.round(share * 100)}% memorised`}
    >
      <circle className="track" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} />
      {share > 0 && (
        <circle
          className="fill"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeDasharray={`${share * length} ${length}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      )}
      {full && <circle className="core" cx={size / 2} cy={size / 2} r={r + stroke / 2} />}
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontSize={size * 0.34}>
        {juz}
      </text>
    </svg>
  )
}
