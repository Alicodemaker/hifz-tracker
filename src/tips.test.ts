import { beforeEach, describe, expect, it } from 'vitest'
import { currentTip, dismissTip, resetTips, seeAllTips, tipOnce } from './tips'

// The tests run outside a browser: a stand-in for this phone's localStorage.
const stored = new Map<string, string>()
globalThis.localStorage = {
  getItem: (key: string) => stored.get(key) ?? null,
  setItem: (key: string, value: string) => void stored.set(key, value),
  removeItem: (key: string) => void stored.delete(key),
} as Storage

beforeEach(() => {
  stored.clear()
  while (currentTip()) dismissTip()
})

describe('tips', () => {
  it('shows a tip the first time only', () => {
    tipOnce('hide')
    expect(currentTip()).toBe('hide')
    dismissTip()
    tipOnce('hide')
    expect(currentTip()).toBe(null)
  })

  it('shows one tip at a time, in the order they came', () => {
    tipOnce('rabt-page')
    tipOnce('rate')
    tipOnce('rabt-page') // already waiting
    expect(currentTip()).toBe('rabt-page')
    dismissTip()
    expect(currentTip()).toBe('rate')
    dismissTip()
    expect(currentTip()).toBe(null)
  })

  it('shows tips again after a reset from Settings', () => {
    tipOnce('pen')
    dismissTip()
    resetTips()
    tipOnce('pen')
    expect(currentTip()).toBe('pen')
  })

  it('shows none once all are seen', () => {
    seeAllTips()
    tipOnce('ayah-by-ayah')
    expect(currentTip()).toBe(null)
  })
})
