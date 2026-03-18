import { JewelryId } from './types'

export const SPINNER_SECTIONS: { emoji: string; color: string; jewel: JewelryId | null }[] = [
  { emoji: '👑', color: '#f48fb1', jewel: '👑' },
  { emoji: '💍', color: '#ce93d8', jewel: '💍' },
  { emoji: '📿', color: '#90caf9', jewel: '📿' },
  { emoji: '💎', color: '#ffe082', jewel: '💎' },
  { emoji: '✨', color: '#a5d6a7', jewel: '✨' },
  { emoji: '⚫', color: '#616161', jewel: null },
]

export function randomSection(): number {
  return Math.floor(Math.random() * 6)
}
