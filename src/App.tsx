import { useState } from 'react'
import SetupScreen from './SetupScreen'
import GameScreen from './GameScreen'
import { GameState, JEWELRY, Player } from './types'
import { spin } from './spin'

function initGame(players: Player[]): GameState {
  return {
    players,
    currentIndex: 0,
    phase: 'playing',
    winner: null,
    lastSpin: null,
  }
}

export default function App() {
  const [game, setGame] = useState<GameState | null>(null)

  function handleStart(players: Player[]) {
    setGame(initGame(players))
  }

  function handleSpin() {
    setGame(prev => {
      if (!prev || prev.phase !== 'playing') return prev
      const players = prev.players.map(p => ({ ...p, inventory: [...p.inventory] }))
      const current = players[prev.currentIndex]
      const result = spin(current)

      let lastSpin: string
      if (result.type === 'gain') {
        current.inventory.push(result.piece)
        lastSpin = `${current.name} got ${result.piece}!`
      } else {
        lastSpin = result.message
      }

      // Check win (KAN-14)
      const won = current.inventory.length === JEWELRY.length
      if (won) {
        return { ...prev, players, phase: 'won', winner: prev.currentIndex, lastSpin }
      }

      // Advance turn (KAN-10)
      const nextIndex = (prev.currentIndex + 1) % prev.players.length
      return { ...prev, players, currentIndex: nextIndex, lastSpin }
    })
  }

  function handleNewGame() {
    setGame(null)
  }

  if (!game) {
    return <SetupScreen onStart={handleStart} />
  }

  return <GameScreen game={game} onSpin={handleSpin} onNewGame={handleNewGame} />
}
