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

export const SPINNER_SECTIONS: SpinnerSection[] = [
  { emoji: '👑', color: '#f48fb1', label: 'Crown',       startDeg: 0,     endDeg: 45,    action: 'jewel',         jewel: '👑' },
  { emoji: '💍', color: '#ce93d8', label: 'Ring',        startDeg: 45,    endDeg: 90,    action: 'jewel',         jewel: '💍' },
  { emoji: '📿', color: '#90caf9', label: 'Necklace',    startDeg: 90,    endDeg: 135,   action: 'jewel',         jewel: '📿' },
  { emoji: '💎', color: '#ffe082', label: 'Bracelet',    startDeg: 135,   endDeg: 180,   action: 'jewel',         jewel: '💎' },
  { emoji: '✨', color: '#a5d6a7', label: 'Earrings',    startDeg: 180,   endDeg: 225,   action: 'jewel',         jewel: '✨' },
  { emoji: '⚫', color: '#616161', label: 'Black Ring',  startDeg: 225,   endDeg: 270,   action: 'blackRing',     jewel: null },
  { emoji: '⭐', color: '#fff9c4', label: 'Pick Any',    startDeg: 270,   endDeg: 315,   action: 'pickAny',       jewel: null },
  { emoji: '↩️', color: '#ffccbc', label: 'You Choose',  startDeg: 315,   endDeg: 337.5, action: 'putBackChoice', jewel: null },
  { emoji: '🎲', color: '#d7ccc8', label: 'Random Loss', startDeg: 337.5, endDeg: 360,   action: 'putBackRandom', jewel: null },
]

// Probability proportional to arc size (half-slices are half as likely)
export function randomSection(): number {
  const r = Math.random() * 360
  let cum = 0
  for (let i = 0; i < SPINNER_SECTIONS.length; i++) {
    cum += SPINNER_SECTIONS[i].endDeg - SPINNER_SECTIONS[i].startDeg
    if (r < cum) return i
  }
  return SPINNER_SECTIONS.length - 1
}
