// Pen drawings on Mushaf pages, kept until cleared. Each page has its own for each font look, since the
// bundled font and the exact QCF4 font put the words in slightly different places.
import type { Saved } from './day'

// One stroke as x, y pairs: x as a share of the lines box's width, y of its full height.
export type Stroke = number[]

export const drawingKey = (look: 'bundled' | 'qcf', page: number) => `${look}:${page}`

export const addStroke = (saved: Saved, key: string, stroke: Stroke): Saved => ({
  ...saved,
  drawings: { ...saved.drawings, [key]: [...(saved.drawings?.[key] ?? []), stroke] },
})

export const clearDrawing = (saved: Saved, key: string): Saved => {
  const drawings = { ...saved.drawings }
  delete drawings[key]
  return { ...saved, drawings }
}
