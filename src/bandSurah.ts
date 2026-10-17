// Both page layouts mark a surah banner as "h<surah>" and its bismillah as a "b…" line just after it.

// The Surah a banner or bismillah line opens, so it shows only once that Surah's first ayah does.
export const bandSurah = (lines: (string | unknown[])[], i: number): number | null => {
  for (let j = i; j >= 0; j--) {
    const line = lines[j]
    if (typeof line === 'string' && line.startsWith('h')) return Number(line.slice(1))
  }
  return null
}
