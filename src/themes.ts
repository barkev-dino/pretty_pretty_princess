import { JEWELRY, JewelryId } from './types'
import { SPINNER_SECTIONS } from './spin'

export interface SectionVisual { emoji: string; label: string; color: string }

export interface GameTheme {
  id: 'princess' | 'warrior'
  name: string
  toggleLabel: string
  bgGradient: string
  accent: string
  accentDark: string
  spinnerRing: string
  needle: string
  cardBg: string
  cardText: string
  tableHeaderColor: string
  dimText: string
  items: readonly [SectionVisual, SectionVisual, SectionVisual, SectionVisual, SectionVisual]
  blackRing: SectionVisual
  leprechaun: SectionVisual
  lizard: SectionVisual
  pickAny: SectionVisual
  winSuffix: string
}

export const PRINCESS: GameTheme = {
  id: 'princess',
  name: '👑 Pretty Princess',
  toggleLabel: '⚔️ Famous Warriors',
  bgGradient: 'linear-gradient(135deg, #fce4ec 0%, #f3e5f5 50%, #e8eaf6 100%)',
  accent: '#9c27b0',
  accentDark: '#6a1b9a',
  spinnerRing: '#9c27b0',
  needle: '#c62828',
  cardBg: 'rgba(255,255,255,0.88)',
  cardText: '#6a1b9a',
  tableHeaderColor: '#7b1fa2',
  dimText: '#9c27b0',
  items: [
    { emoji: '👑', label: 'Crown',    color: '#f48fb1' },
    { emoji: '💍', label: 'Ring',     color: '#ce93d8' },
    { emoji: '📿', label: 'Necklace', color: '#90caf9' },
    { emoji: '💎', label: 'Bracelet', color: '#ffe082' },
    { emoji: '✨', label: 'Earrings', color: '#a5d6a7' },
  ],
  blackRing: { emoji: '⚫', label: 'Black Ring',  color: '#616161' },
  leprechaun: { emoji: '🧙', label: 'Leprechaun', color: '#c8e6c9' },
  lizard:     { emoji: '🦎', label: 'Lizard',     color: '#d7ccc8' },
  pickAny:    { emoji: '⭐', label: 'Pick Any',   color: '#fff9c4' },
  winSuffix: 'collected all the jewels! 👑',
}

export const WARRIOR: GameTheme = {
  id: 'warrior',
  name: '⚔️ Famous Warriors',
  toggleLabel: '👑 Pretty Princess',
  bgGradient: 'linear-gradient(135deg, #37474f 0%, #263238 50%, #1a2027 100%)',
  accent: '#e57373',
  accentDark: '#ffcdd2',
  spinnerRing: '#e57373',
  needle: '#ffd54f',
  cardBg: 'rgba(255,255,255,0.08)',
  cardText: '#ffcdd2',
  tableHeaderColor: '#ef9a9a',
  dimText: '#ef9a9a',
  items: [
    { emoji: '⚔️', label: 'Sword',   color: '#ef9a9a' },
    { emoji: '🛡️', label: 'Shield',  color: '#b0bec5' },
    { emoji: '🏗️', label: 'Catapult', color: '#a5d6a7' },
    { emoji: '🏹', label: 'Bow',     color: '#ffe082' },
    { emoji: '🔱', label: 'Trident', color: '#81d4fa' },
  ],
  blackRing: { emoji: '💀', label: 'Cursed Skull', color: '#424242' },
  leprechaun: { emoji: '🥷', label: 'Ninja',        color: '#546e7a' },
  lizard:     { emoji: '🐉', label: 'Dragon',        color: '#8d1515' },
  pickAny:    { emoji: '💰', label: 'Loot',          color: '#f9a825' },
  winSuffix: 'conquered the realm! ⚔️',
}

export function getSpinnerSections(theme: GameTheme) {
  return SPINNER_SECTIONS.map(s => {
    const jewelIdx = JEWELRY.indexOf(s.jewel as JewelryId)
    if (jewelIdx >= 0) {
      const item = theme.items[jewelIdx]
      return { ...s, emoji: item.emoji, color: item.color, label: item.label }
    }
    if (s.action === 'blackRing')     return { ...s, ...theme.blackRing }
    if (s.action === 'putBackChoice') return { ...s, ...theme.leprechaun }
    if (s.action === 'putBackRandom') return { ...s, ...theme.lizard }
    if (s.action === 'pickAny')       return { ...s, ...theme.pickAny }
    return s
  })
}
