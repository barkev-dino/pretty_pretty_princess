import { useState } from 'react'
import SetupScreen from './SetupScreen'
import GameScreen from './GameScreen'
import { GameState, JEWELRY, Player, PLAYER_COLORS } from './types'
import { SPINNER_SECTIONS, randomSection } from './spin'

function initGame(names: string[]): GameState {
  const players: Player[] = names.map((name, i) => ({
    name,
    color: PLAYER_COLORS[i],
    inventory: [],
    hasBlackRing: false,
  }))
  return { players, currentIndex: 0, phase: 'playing', winner: null, lastSpin: null }
}

export default function App() {
  const [game, setGame] = useState<GameState | null>(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [pendingSection, setPendingSection] = useState(0)
  const [spinTrigger, setSpinTrigger] = useState(0)

  function handleStart(names: string[]) {
    setGame(initGame(names))
    setIsSpinning(false)
    setSpinTrigger(0)
  }

  function handleSpinStart() {
    if (!game || isSpinning || game.phase !== 'playing') return
    const section = randomSection()
    setPendingSection(section)
    setSpinTrigger(t => t + 1)
    setIsSpinning(true)
  }

  function handleSpinComplete() {
    setGame(prev => {
      if (!prev) return prev
      const players = prev.players.map(p => ({ ...p, inventory: [...p.inventory] }))
      const current = players[prev.currentIndex]
      const section = SPINNER_SECTIONS[pendingSection]
      let lastSpin: string

      if (section.jewel === null) {
        // Black ring: take from whoever has it (or center)
        players.forEach(p => { p.hasBlackRing = false })
        current.hasBlackRing = true
        lastSpin = `${current.name} got the Black Ring! ⚫`
      } else {
        if (current.inventory.includes(section.jewel)) {
          lastSpin = `${current.name} already has ${section.jewel}!`
        } else {
          current.inventory.push(section.jewel)
          lastSpin = `${current.name} got ${section.jewel}!`
        }
      }

      // Win: all 5 jewels + no black ring
      if (current.inventory.length === JEWELRY.length && !current.hasBlackRing) {
        return { ...prev, players, phase: 'won', winner: prev.currentIndex, lastSpin }
      }

      return { ...prev, players, currentIndex: (prev.currentIndex + 1) % prev.players.length, lastSpin }
    })
    setIsSpinning(false)
  }

  function handleNewGame() {
    setGame(null)
    setIsSpinning(false)
    setSpinTrigger(0)
  }

  if (!game) return <SetupScreen onStart={handleStart} />

  return (
    <GameScreen
      game={game}
      isSpinning={isSpinning}
      spinTrigger={spinTrigger}
      pendingSection={pendingSection}
      onSpinStart={handleSpinStart}
      onSpinComplete={handleSpinComplete}
      onNewGame={handleNewGame}
    />
  )
}
