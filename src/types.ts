export const JEWELRY = ['👑', '💍', '📿', '💎', '✨'] as const
export type JewelryId = typeof JEWELRY[number]

export const PLAYER_COLORS = ['#f06292', '#ab47bc', '#42a5f5']

export interface Player {
  name: string
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
