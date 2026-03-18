import { JEWELRY, JewelryId, Player } from './types'

export type SpinResult =
  | { type: 'gain'; piece: JewelryId }
  | { type: 'nothing'; message: string }

export function spin(player: Player): SpinResult {
  const missing = JEWELRY.filter(j => !player.inventory.includes(j))
  if (missing.length === 0) return { type: 'nothing', message: 'Already has everything!' }

  // 75% chance to gain a missing piece, 25% nothing
  if (Math.random() < 0.75) {
    const piece = missing[Math.floor(Math.random() * missing.length)]
    return { type: 'gain', piece }
  }
  return { type: 'nothing', message: 'No luck this turn...' }
}
