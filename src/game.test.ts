import { describe, it, expect } from 'vitest'
import { JEWELRY, CHARACTERS } from './types'
import { SPINNER_SECTIONS, randomSection } from './spin'

// ─────────────────────────────────────────────
// types.ts
// ─────────────────────────────────────────────

describe('JEWELRY', () => {
  it('has exactly 5 items (win condition depends on this)', () => {
    expect(JEWELRY.length).toBe(5)
  })

  it('contains no duplicates', () => {
    expect(new Set(JEWELRY).size).toBe(JEWELRY.length)
  })
})

describe('CHARACTERS', () => {
  it('has at least 3 entries (one per max player count)', () => {
    expect(CHARACTERS.length).toBeGreaterThanOrEqual(3)
  })

  it('has 6 entries total', () => {
    expect(CHARACTERS.length).toBe(6)
  })

  it('has unique emojis', () => {
    const emojis = CHARACTERS.map(c => c.emoji)
    expect(new Set(emojis).size).toBe(emojis.length)
  })

  it('has unique colors', () => {
    const colors = CHARACTERS.map(c => c.color)
    expect(new Set(colors).size).toBe(colors.length)
  })

  it('each color is a valid hex color', () => {
    for (const { color } of CHARACTERS) {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })
})

// ─────────────────────────────────────────────
// spin.ts
// ─────────────────────────────────────────────

describe('SPINNER_SECTIONS', () => {
  it('has exactly 9 sections', () => {
    expect(SPINNER_SECTIONS.length).toBe(9)
  })

  it('each section spans exactly 40°', () => {
    for (const s of SPINNER_SECTIONS) {
      expect(s.endDeg - s.startDeg).toBe(40)
    }
  })

  it('sections cover 0–360° without gaps or overlaps', () => {
    const sorted = [...SPINNER_SECTIONS].sort((a, b) => a.startDeg - b.startDeg)
    expect(sorted[0].startDeg).toBe(0)
    expect(sorted[sorted.length - 1].endDeg).toBe(360)
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].startDeg).toBe(sorted[i - 1].endDeg)
    }
  })

  it('contains exactly 5 jewel sections (one per jewelry piece)', () => {
    const jewelSections = SPINNER_SECTIONS.filter(s => s.action === 'jewel')
    expect(jewelSections.length).toBe(5)
  })

  it('every jewel section references a valid jewelry piece', () => {
    const jewelSections = SPINNER_SECTIONS.filter(s => s.action === 'jewel')
    for (const s of jewelSections) {
      expect(JEWELRY).toContain(s.jewel)
    }
  })

  it('each jewelry piece appears exactly once across all sections', () => {
    for (const piece of JEWELRY) {
      const count = SPINNER_SECTIONS.filter(s => s.jewel === piece).length
      expect(count).toBe(1)
    }
  })

  it('non-jewel sections have jewel === null', () => {
    const nonJewel = SPINNER_SECTIONS.filter(s => s.action !== 'jewel')
    for (const s of nonJewel) {
      expect(s.jewel).toBeNull()
    }
  })

  it('has exactly 1 blackRing section', () => {
    expect(SPINNER_SECTIONS.filter(s => s.action === 'blackRing').length).toBe(1)
  })

  it('has exactly 1 pickAny section', () => {
    expect(SPINNER_SECTIONS.filter(s => s.action === 'pickAny').length).toBe(1)
  })

  it('has exactly 1 putBackChoice section', () => {
    expect(SPINNER_SECTIONS.filter(s => s.action === 'putBackChoice').length).toBe(1)
  })

  it('has exactly 1 putBackRandom section', () => {
    expect(SPINNER_SECTIONS.filter(s => s.action === 'putBackRandom').length).toBe(1)
  })

  it('every section has a non-empty emoji and label', () => {
    for (const s of SPINNER_SECTIONS) {
      expect(s.emoji.length).toBeGreaterThan(0)
      expect(s.label.length).toBeGreaterThan(0)
    }
  })
})

describe('randomSection', () => {
  it('always returns a valid index (0 to SPINNER_SECTIONS.length - 1)', () => {
    for (let i = 0; i < 200; i++) {
      const idx = randomSection()
      expect(idx).toBeGreaterThanOrEqual(0)
      expect(idx).toBeLessThan(SPINNER_SECTIONS.length)
      expect(Number.isInteger(idx)).toBe(true)
    }
  })

  it('returns every section index at least once in 500 calls (distribution check)', () => {
    const seen = new Set<number>()
    for (let i = 0; i < 500; i++) seen.add(randomSection())
    expect(seen.size).toBe(SPINNER_SECTIONS.length)
  })
})
