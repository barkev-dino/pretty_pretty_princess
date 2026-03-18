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

// 9 equal slices at 40° each = 360°
export const SPINNER_SECTIONS: SpinnerSection[] = [
  { emoji: '👑', color: '#f48fb1', label: 'Crown',       startDeg: 0,   endDeg: 40,  action: 'jewel',         jewel: '👑' },
  { emoji: '💍', color: '#ce93d8', label: 'Ring',        startDeg: 40,  endDeg: 80,  action: 'jewel',         jewel: '💍' },
  { emoji: '📿', color: '#90caf9', label: 'Necklace',    startDeg: 80,  endDeg: 120, action: 'jewel',         jewel: '📿' },
  { emoji: '💎', color: '#ffe082', label: 'Bracelet',    startDeg: 120, endDeg: 160, action: 'jewel',         jewel: '💎' },
  { emoji: '✨', color: '#a5d6a7', label: 'Earrings',    startDeg: 160, endDeg: 200, action: 'jewel',         jewel: '✨' },
  { emoji: '⚫', color: '#616161', label: 'Black Ring',  startDeg: 200, endDeg: 240, action: 'blackRing',     jewel: null },
  { emoji: '⭐', color: '#fff9c4', label: 'Pick Any',    startDeg: 240, endDeg: 280, action: 'pickAny',       jewel: null },
  { emoji: '↩️', color: '#ffccbc', label: 'You Choose',  startDeg: 280, endDeg: 320, action: 'putBackChoice', jewel: null },
  { emoji: '🎲', color: '#d7ccc8', label: 'Random Loss', startDeg: 320, endDeg: 360, action: 'putBackRandom', jewel: null },
]

export function randomSection(): number {
  return Math.floor(Math.random() * SPINNER_SECTIONS.length)
}
