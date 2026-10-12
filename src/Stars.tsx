// A Surah rating as up to three stars; "last page missing" is one and a half.
const STAR = 'M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z'

export default function Stars({ count }: { count: number }) {
  return (
    <span className="stars" aria-hidden="true">
      {[0, 1, 2].map((i) => {
        const fill = Math.min(1, Math.max(0, count - i))
        return (
          <svg key={i} viewBox="0 0 24 24" className={fill === 0 ? 'empty' : ''}>
            {fill > 0 && fill < 1 && (
              <clipPath id={`half-star-${i}`}>
                <rect x="0" y="0" width="12" height="24" />
              </clipPath>
            )}
            <path d={STAR} className="star-outline" />
            {fill > 0 && <path d={STAR} className="star-fill" clipPath={fill < 1 ? `url(#half-star-${i})` : undefined} />}
          </svg>
        )
      })}
    </span>
  )
}
