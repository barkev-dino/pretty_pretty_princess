import { useState } from 'react'
import SetupScreen from './SetupScreen'
import GameScreen from './GameScreen'
import { GameState, JEWELRY, JewelryId, Player, Character } from './types'
import { SPINNER_SECTIONS, randomSection } from './spin'
import { playSpinSound, playSadSound, playPickAnySound, playWinSound } from './audio'
import { PRINCESS, WARRIOR, GameTheme } from './themes'

type ReturnChoice = JewelryId | '⚫'

// Earrings need 2 copies; all others need 1
function hasFullSet(inv: JewelryId[]): boolean {
  return JEWELRY.every(j => inv.filter(i => i === j).length >= (j === '✨' ? 2 : 1))
}
function getMissingJewels(inv: JewelryId[]): JewelryId[] {
  return JEWELRY.filter(j => inv.filter(i => i === j).length < (j === '✨' ? 2 : 1))
}

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
  const [extraRotations, setExtraRotations] = useState(5)
  const [spinDuration, setSpinDuration] = useState(2500)
  const [pickAnyPending, setPickAnyPending] = useState(false)
  const [putBackChoicePending, setPutBackChoicePending] = useState(false)
  const [spinCounts, setSpinCounts] = useState<number[][]>([])
  const [theme, setTheme] = useState<GameTheme>(PRINCESS)

  function handleStart(selections: { name: string; character: Character }[]) {
    setGame(initGame(selections))
    setSpinCounts(selections.map(() => Array(SPINNER_SECTIONS.length).fill(0)))
    setIsSpinning(false); setSpinTrigger(0)
  }

  function handleSpinStart(power: number) {
    if (!game || isSpinning || game.phase !== 'playing') return
    const extra = Math.round(2 + power * 8)
    const duration = Math.round(1500 + power * 3000)
    setExtraRotations(extra)
    setSpinDuration(duration)

    // Magic spot: power > 0.85 gives 50% chance of landing on a positive
    // putBackChoice is also "positive" if the current player has the black ring
    let section: number
    const isMagic = power > 0.85
    if (isMagic && Math.random() < 0.5) {
      const current = game.players[game.currentIndex]
      const positives = SPINNER_SECTIONS
        .map((s, i) => ({ s, i }))
        .filter(({ s }) => {
          if (s.action === 'jewel' || s.action === 'pickAny') return true
          if (s.action === 'putBackChoice' && current.hasBlackRing) return true
          return false
        })
      const totalDeg = positives.reduce((sum, { s }) => sum + s.endDeg - s.startDeg, 0)
      const r = Math.random() * totalDeg
      let cum = 0
      section = positives[positives.length - 1].i
      for (const { s, i } of positives) {
        cum += s.endDeg - s.startDeg
        if (r < cum) { section = i; break }
      }
    } else {
      section = randomSection()
    }
    setPendingSection(section)
    setSpinTrigger(t => t + 1)
    setIsSpinning(true)
    playSpinSound()
  }

  function handleSpinComplete() {
    if (!game) return
    const section = SPINNER_SECTIONS[pendingSection]
    setSpinCounts(prev => {
      const next = prev.map(row => [...row])
      if (next[game.currentIndex]) next[game.currentIndex][pendingSection]++
      return next
    })

    if (section.action === 'pickAny') {
      playPickAnySound()
      const current = game.players[game.currentIndex]
      const missing = getMissingJewels(current.inventory)
      if (missing.length === 0) { advanceTurn(`${current.name} already has everything!`); return }
      setPickAnyPending(true)
      return
    }

    if (section.action === 'putBackChoice') {
      const current = game.players[game.currentIndex]
      if (current.inventory.length === 0 && !current.hasBlackRing) {
        advanceTurn(`${current.name} has nothing to return!`)
        return
      }
      setPutBackChoicePending(true)
      return
    }

    const players = game.players.map(p => ({ ...p, inventory: [...p.inventory] }))
    const current = players[game.currentIndex]
    let lastSpin: string

    if (section.action === 'blackRing') {
      playSadSound()
      players.forEach(p => { p.hasBlackRing = false })
      current.hasBlackRing = true
      lastSpin = `${current.name} got the ${theme.blackRing.emoji}!`
    } else if (section.action === 'putBackRandom') {
      playSadSound()
      if (current.inventory.length === 0) {
        lastSpin = `${current.name} has nothing to lose! ${theme.lizard.emoji}`
      } else {
        const lost = [...current.inventory]
        current.inventory = []
        lastSpin = `${current.name} lost EVERYTHING (${lost.join('')})! ${theme.lizard.emoji}`
      }
    } else {
      const jewel = section.jewel!
      if (jewel === '👑') {
        if (current.inventory.includes('👑')) {
          lastSpin = `${current.name} keeps the ${theme.items[0].emoji}!`
        } else {
          const prevOwner = players.find(p => p !== current && p.inventory.includes('👑'))
          players.forEach(p => { p.inventory = p.inventory.filter(j => j !== '👑') })
          current.inventory.push('👑')
          lastSpin = prevOwner
            ? `${current.name} took the ${theme.items[0].emoji} from ${prevOwner.name}!`
            : `${current.name} got the ${theme.items[0].emoji}!`
        }
      } else {
        const idx = JEWELRY.indexOf(jewel)
        const itemEmoji = theme.items[idx].emoji
        if (jewel === '✨') {
          const earCount = current.inventory.filter(j => j === '✨').length
          if (earCount >= 2) {
            lastSpin = `${current.name} already has both ${itemEmoji}!`
          } else {
            current.inventory.push('✨')
            lastSpin = earCount === 0
              ? `${current.name} got one ${itemEmoji}!`
              : `${current.name} got the 2nd ${itemEmoji}! ✨`
          }
        } else if (current.inventory.includes(jewel)) {
          lastSpin = `${current.name} already has ${itemEmoji}!`
        } else {
          current.inventory.push(jewel)
          lastSpin = `${current.name} got ${itemEmoji}!`
        }
      }
    }

    if (hasFullSet(current.inventory) && !current.hasBlackRing) {
      playWinSound()
      setGame({ ...game, players, phase: 'won', winner: game.currentIndex, lastSpin })
      setIsSpinning(false)
      return
    }
    const nextIndex = (game.currentIndex + 1) % game.players.length
    setGame({ ...game, players, currentIndex: nextIndex, lastSpin })
    setIsSpinning(false)
  }

  function handlePickAny(jewel: JewelryId) {
    if (!game) return
    setPickAnyPending(false)
    const players = game.players.map(p => ({ ...p, inventory: [...p.inventory] }))
    const current = players[game.currentIndex]
    current.inventory.push(jewel)
    const idx = JEWELRY.indexOf(jewel)
    const lastSpin = `${current.name} chose ${theme.items[idx].emoji}!`
    if (hasFullSet(current.inventory) && !current.hasBlackRing) {
      playWinSound()
      setGame({ ...game, players, phase: 'won', winner: game.currentIndex, lastSpin })
      setIsSpinning(false)
      return
    }
    const nextIndex = (game.currentIndex + 1) % game.players.length
    setGame({ ...game, players, currentIndex: nextIndex, lastSpin })
    setIsSpinning(false)
  }

  function handlePutBackChoice(item: ReturnChoice) {
    if (!game) return
    setPutBackChoicePending(false)
    const players = game.players.map(p => ({ ...p, inventory: [...p.inventory] }))
    const current = players[game.currentIndex]
    let lastSpin: string
    if (item === '⚫') {
      current.hasBlackRing = false
      lastSpin = `${current.name} got rid of the ${theme.blackRing.emoji}! ${theme.leprechaun.emoji}`
    } else {
      // Remove only ONE copy (important for earrings which can appear twice)
      const i = current.inventory.indexOf(item)
      if (i !== -1) current.inventory.splice(i, 1)
      const idx = JEWELRY.indexOf(item)
      lastSpin = `${current.name} returned ${theme.items[idx].emoji}! ${theme.leprechaun.emoji}`
    }
    const nextIndex = (game.currentIndex + 1) % game.players.length
    setGame({ ...game, players, currentIndex: nextIndex, lastSpin })
    setIsSpinning(false)
  }

  function advanceTurn(lastSpin: string) {
    if (!game) return
    const nextIndex = (game.currentIndex + 1) % game.players.length
    setGame({ ...game, currentIndex: nextIndex, lastSpin })
    setIsSpinning(false)
  }

  function handleNewGame() {
    setGame(null); setIsSpinning(false); setSpinTrigger(0)
    setPickAnyPending(false); setPutBackChoicePending(false); setSpinCounts([])
  }

  return (
    <div style={{ minHeight: '100vh', background: theme.bgGradient, padding: '16px 24px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Theme toggle */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <button
            onClick={() => setTheme(t => t.id === 'princess' ? WARRIOR : PRINCESS)}
            style={{
              fontSize: 14, padding: '9px 20px', borderRadius: 24,
              border: `2px solid ${theme.accent}`,
              background: 'rgba(255,255,255,0.18)',
              color: theme.accentDark,
              cursor: 'pointer', fontFamily: 'inherit', fontWeight: 800,
              backdropFilter: 'blur(6px)',
              boxShadow: `0 2px 10px ${theme.accent}33`,
              letterSpacing: 0.3,
            }}
          >
            {theme.toggleLabel}
          </button>
        </div>

        {!game
          ? <SetupScreen onStart={handleStart} theme={theme} />
          : <GameScreen
              theme={theme}
              game={game} isSpinning={isSpinning} spinTrigger={spinTrigger} pendingSection={pendingSection}
              extraRotations={extraRotations} spinDuration={spinDuration}
              pickAnyPending={pickAnyPending} putBackChoicePending={putBackChoicePending}
              spinCounts={spinCounts}
              onSpinStart={handleSpinStart} onSpinComplete={handleSpinComplete}
              onPickAny={handlePickAny} onPutBackChoice={handlePutBackChoice} onNewGame={handleNewGame}
            />
        }
      </div>
    </div>
  )
}
