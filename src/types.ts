export const JEWELRY = ['👑', '💍', '📿', '💎', '✨'] as const
export type JewelryId = typeof JEWELRY[number]

export interface Player {
  name: string
  inventory: JewelryId[]
}

export interface GameState {
  players: Player[]
  currentIndex: number
  phase: 'setup' | 'playing' | 'won'
  winner: number | null
  lastSpin: string | null
}
