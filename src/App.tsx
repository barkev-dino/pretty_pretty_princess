import { useState } from 'react'
import SetupScreen from './SetupScreen'
import GameScreen from './GameScreen'
import { GameState, JEWELRY, JewelryId, Player, Character } from './types'
import { SPINNER_SECTIONS, randomSection } from './spin'
import { playSpinSound, playSadSound, playPickAnySound } from './audio'

function initGame(selections: { name: string; character: Character }[]): GameState {
  const players: Player[] = selections.map(({ name, character }) => ({
    name, character, color: character.color, inventory: [], hasBlackRing: false,
  }))
  return { players, currentIndex: 0, phase: 'playing', winner: null, lastSpin: null }
}

export default function App() {
  const [game, setGame] = useState<GameState | null>(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [pendingSection, setPendingSection] = useState(0)
  const [spinTrigger, setSpinTrigger] = useState(0)
  const [pickAnyPending, setPickAnyPending] = useState(false)
  const [putBackChoicePending, setPutBackChoicePending] = useState(false)

  function handleStart(selections: { name: string; character: Character }[]) {
    setGame(initGame(selections))
    setIsSpinning(false); setSpinTrigger(0)
  }

  function handleSpinStart() {
    if (!game || isSpinning || game.phase !== 'playing') return
    const section = randomSection()
    setPendingSection(section)
    setSpinTrigger(t => t + 1)
    setIsSpinning(true)
    playSpinSound()
  }

  function handleSpinComplete() {
    const section = SPINNER_SECTIONS[pendingSection]

    if (section.action === 'pickAny') {
      playPickAnySound()
      const current = game!.players[game!.currentIndex]
      const missing = JEWELRY.filter(j => !current.inventory.includes(j))
      if (missing.length === 0) { advanceTurn(`${current.name} already has everything! ⭐`); return }
      setPickAnyPending(true)
      return
    }

    if (section.action === 'putBackChoice') {
      const current = game!.players[game!.currentIndex]
      if (current.inventory.length === 0) { advanceTurn(`${current.name} has nothing to return! ↩️`); return }
      setPutBackChoicePending(true)
      return
    }

    setGame(prev => {
      if (!prev) return prev
      const players = prev.players.map(p => ({ ...p, inventory: [...p.inventory] }))
      const current = players[prev.currentIndex]
      let lastSpin: string

      if (section.action === 'blackRing') {
        playSadSound()
        players.forEach(p => { p.hasBlackRing = false })
        current.hasBlackRing = true
        lastSpin = `${current.name} got the Black Ring! ⚫`
      } else if (section.action === 'putBackRandom') {
        if (current.inventory.length === 0) {
          lastSpin = `${current.name} has nothing to lose! 🎲`
        } else {
          const idx = Math.floor(Math.random() * current.inventory.length)
          const lost = current.inventory.splice(idx, 1)[0]
          lastSpin = `${current.name} lost ${lost}! 🎲`
        }
      } else {
        const jewel = section.jewel!
        if (current.inventory.includes(jewel)) {
          lastSpin = `${current.name} already has ${jewel}!`
        } else {
          current.inventory.push(jewel)
          lastSpin = `${current.name} got ${jewel}!`
        }
      }

      if (current.inventory.length === JEWELRY.length && !current.hasBlackRing) {
        return { ...prev, players, phase: 'won', winner: prev.currentIndex, lastSpin }
      }
      return { ...prev, players, currentIndex: (prev.currentIndex + 1) % prev.players.length, lastSpin }
    })
    setIsSpinning(false)
  }

  function handlePickAny(jewel: JewelryId) {
    setPickAnyPending(false)
    setGame(prev => {
      if (!prev) return prev
      const players = prev.players.map(p => ({ ...p, inventory: [...p.inventory] }))
      const current = players[prev.currentIndex]
      current.inventory.push(jewel)
      const lastSpin = `${current.name} chose ${jewel}! ⭐`
      if (current.inventory.length === JEWELRY.length && !current.hasBlackRing) {
        return { ...prev, players, phase: 'won', winner: prev.currentIndex, lastSpin }
      }
      return { ...prev, players, currentIndex: (prev.currentIndex + 1) % prev.players.length, lastSpin }
    })
    setIsSpinning(false)
  }

  function handlePutBackChoice(jewel: JewelryId) {
    setPutBackChoicePending(false)
    setGame(prev => {
      if (!prev) return prev
      const players = prev.players.map(p => ({ ...p, inventory: [...p.inventory] }))
      const current = players[prev.currentIndex]
      current.inventory = current.inventory.filter(j => j !== jewel)
      const lastSpin = `${current.name} returned ${jewel}! ↩️`
      return { ...prev, players, currentIndex: (prev.currentIndex + 1) % prev.players.length, lastSpin }
    })
    setIsSpinning(false)
  }

  function advanceTurn(lastSpin: string) {
    setGame(prev => {
      if (!prev) return prev
      return { ...prev, currentIndex: (prev.currentIndex + 1) % prev.players.length, lastSpin }
    })
    setIsSpinning(false)
  }

  function handleNewGame() {
    setGame(null); setIsSpinning(false); setSpinTrigger(0)
    setPickAnyPending(false); setPutBackChoicePending(false)
  }

  if (!game) return <SetupScreen onStart={handleStart} />

  return (
    <GameScreen
      game={game} isSpinning={isSpinning} spinTrigger={spinTrigger} pendingSection={pendingSection}
      pickAnyPending={pickAnyPending} putBackChoicePending={putBackChoicePending}
      onSpinStart={handleSpinStart} onSpinComplete={handleSpinComplete}
      onPickAny={handlePickAny} onPutBackChoice={handlePutBackChoice} onNewGame={handleNewGame}
    />
  )
}
