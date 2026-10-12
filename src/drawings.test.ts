import { describe, expect, it } from 'vitest'
import { startDay, type Saved } from './day'
import { addStroke, clearDrawing, drawingKey } from './drawings'

const base: Saved = { version: 1, progress: { memorised: [114], hifzNext: { surah: 113, ayah: 1 }, murajaNext: null }, today: null, history: [] }

describe('drawings', () => {
  it('keeps strokes per page and font look until the page is cleared', () => {
    const key = drawingKey('qcf', 562)
    let saved = addStroke(base, key, [0.1, 0.2, 0.3, 0.2])
    saved = addStroke(saved, key, [0.5, 0.5, 0.6, 0.6])
    saved = addStroke(saved, drawingKey('bundled', 562), [0.1, 0.1, 0.2, 0.2])
    expect(saved.drawings?.[key]).toHaveLength(2)
    expect(startDay(saved, '2026-10-13').drawings).toEqual(saved.drawings)
    const cleared = clearDrawing(saved, key)
    expect(cleared.drawings?.[key]).toBeUndefined()
    expect(cleared.drawings?.[drawingKey('bundled', 562)]).toHaveLength(1)
  })
})
