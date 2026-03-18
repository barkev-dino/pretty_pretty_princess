export const JEWELRY = ['👑', '💍', '📿', '💎', '✨'] as const
export type JewelryId = typeof JEWELRY[number]

export const CHARACTERS = [
  { emoji: '👸', color: '#f06292' },
  { emoji: '🤴', color: '#ab47bc' },
  { emoji: '🦄', color: '#42a5f5' },
  { emoji: '🦊', color: '#ff7043' },
  { emoji: '🐱', color: '#66bb6a' },
  { emoji: '⭐', color: '#ffd54f' },
] as const
export type Character = typeof CHARACTERS[number]

export interface Player {
  name: string
  character: Character
  color: string
  inventory: JewelryId[]
  hasBlackRing: boolean
}

export interface GameState {
  players: Player[]
  currentIndex: number
  phase: 'playing' | 'won'
  winner: number | null
  lastSpin: string | null
}
