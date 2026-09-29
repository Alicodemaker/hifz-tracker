// A filled ayah-end rosette with the ayah number, as in printed mushafs and the reference page.
const toArabicDigits = (n: number) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)])

const PETALS = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * 2 * Math.PI
  return { cx: 20 + 16 * Math.cos(angle), cy: 20 + 16 * Math.sin(angle) }
})

export default function Rosette({ ayah }: { ayah: number }) {
  const label = toArabicDigits(ayah)
  return (
    <svg className="rosette" viewBox="0 0 40 40" role="img" aria-label={`Ayah ${ayah}`}>
      {PETALS.map((p, i) => (
        <circle key={i} className="petal" cx={p.cx} cy={p.cy} r="3.6" />
      ))}
      <circle className="ring" cx="20" cy="20" r="16.5" />
      <circle className="field" cx="20" cy="20" r="14" />
      <circle className="inner" cx="20" cy="20" r="12.3" />
      <text x="20" y="21" textAnchor="middle" dominantBaseline="central" fontSize={label.length > 2 ? 14 : 17}>
        {label}
      </text>
    </svg>
  )
}
