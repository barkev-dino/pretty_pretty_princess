import { JewelryId } from './types'

export type SpinAction = 'jewel' | 'blackRing' | 'pickAny' | 'putBackChoice' | 'putBackRandom'

export interface SpinnerSection {
  emoji: string
  color: string
  label: string
  startDeg: number
  endDeg: number
  action: SpinAction
  jewel: JewelryId | null
}

// 7 positive slices × 45° + 2 negative slices × 22.5° = 360°
// Negatives are interleaved at ~146° and ~304° (roughly opposite sides)
export const SPINNER_SECTIONS: SpinnerSection[] = [
  { emoji: '👑', color: '#f48fb1', label: 'Crown',      startDeg: 0,     endDeg: 45,    action: 'jewel',         jewel: '👑' },
  { emoji: '💍', color: '#ce93d8', label: 'Ring',       startDeg: 45,    endDeg: 90,    action: 'jewel',         jewel: '💍' },
  { emoji: '📿', color: '#90caf9', label: 'Necklace',   startDeg: 90,    endDeg: 135,   action: 'jewel',         jewel: '📿' },
  { emoji: '🧙', color: '#c8e6c9', label: 'Leprechaun', startDeg: 135,   endDeg: 157.5, action: 'putBackChoice', jewel: null },
  { emoji: '💎', color: '#ffe082', label: 'Bracelet',   startDeg: 157.5, endDeg: 202.5, action: 'jewel',         jewel: '💎' },
  { emoji: '✨', color: '#a5d6a7', label: 'Earrings',   startDeg: 202.5, endDeg: 247.5, action: 'jewel',         jewel: '✨' },
  { emoji: '⚫', color: '#616161', label: 'Black Ring', startDeg: 247.5, endDeg: 292.5, action: 'blackRing',     jewel: null },
  { emoji: '🦎', color: '#d7ccc8', label: 'Lizard',     startDeg: 292.5, endDeg: 315,   action: 'putBackRandom', jewel: null },
  { emoji: '⭐', color: '#fff9c4', label: 'Pick Any',   startDeg: 315,   endDeg: 360,   action: 'pickAny',       jewel: null },
]

// Angle-weighted: thinner slices have proportionally lower probability
export function randomSection(): number {
  const r = Math.random() * 360
  let cum = 0
  for (let i = 0; i < SPINNER_SECTIONS.length; i++) {
    cum += SPINNER_SECTIONS[i].endDeg - SPINNER_SECTIONS[i].startDeg
    if (r < cum) return i
  }
  return SPINNER_SECTIONS.length - 1
}
