# Turn Handoff Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a "pass the device" interstitial between turns so players can't see each other's jewel boards.

**Architecture:** New `HandoffScreen` component. `handoffPending` + `handoffTo` state in `App.tsx`. Every non-win turn advance triggers the handoff; tapping dismisses it.

**Tech Stack:** React 18, TypeScript 5, Vite. No test framework — verify via `tsc --noEmit`.

**Spec:** `docs/superpowers/specs/2026-03-18-turn-handoff-screen-design.md`

---

### Task 1: Create HandoffScreen component

**Files:**
- Create: `src/HandoffScreen.tsx`

- [ ] **Step 1: Write the component**

```tsx
import { Character } from './types'

interface Props {
  player: { name: string; character: Character }
  onReady: () => void
}

export default function HandoffScreen({ player, onReady }: Props) {
  const { name, character } = player
  return (
    <div
      onClick={onReady}
      style={{
        position: 'fixed', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #fce4ec, #f3e5f5)',
        textAlign: 'center', cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <div style={{ fontSize: 96, marginBottom: 16 }}>{character.emoji}</div>
      <p style={{ fontSize: 20, color: '#9c27b0', marginBottom: 8 }}>Pass the phone to</p>
      <h2 style={{ fontSize: 36, fontWeight: 'bold', color: character.color, marginBottom: 40 }}>
        {name}
      </h2>
      <button
        onClick={e => { e.stopPropagation(); onReady() }}
        style={{
          fontSize: 22, padding: '18px 52px', borderRadius: 16,
          border: `3px solid ${character.color}`,
          background: `${character.color}22`,
          color: character.color, cursor: 'pointer',
          fontFamily: 'inherit', fontWeight: 'bold',
        }}
      >
        I'm ready! 🎮
      </button>
      <p style={{ marginTop: 24, fontSize: 13, color: '#ab47bc', opacity: 0.7 }}>
        (tap anywhere to continue)
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript (no errors expected)**

```bash
cd /Users/b/pretty_pretty_princess && npx tsc --noEmit 2>&1 | head -20
```

---

### Task 2: Add handoff state to App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Import HandoffScreen and Character**

Add to the import at the top of App.tsx:
```ts
import HandoffScreen from './HandoffScreen'
```

The `Character` type is already imported (added in KAN-15).

- [ ] **Step 2: Add state variables after existing useState declarations**

After the existing `useState` declarations (around line 20), add:
```ts
const [handoffPending, setHandoffPending] = useState(false)
const [handoffTo, setHandoffTo] = useState<{ name: string; character: Character } | null>(null)
```

- [ ] **Step 3: Add triggerHandoff helper**

After the existing state declarations, add:
```ts
function triggerHandoff(nextGame: GameState) {
  const next = nextGame.players[nextGame.currentIndex]
  setHandoffTo({ name: next.name, character: next.character })
  setHandoffPending(true)
}
```

- [ ] **Step 4: Refactor advanceTurn to use direct set and trigger handoff**

Replace current `advanceTurn`:
```ts
function advanceTurn(lastSpin: string) {
  setGame(prev => {
    if (!prev) return prev
    return { ...prev, currentIndex: (prev.currentIndex + 1) % prev.players.length, lastSpin }
  })
  setIsSpinning(false)
}
```

With:
```ts
function advanceTurn(lastSpin: string) {
  if (!game) return
  const nextIndex = (game.currentIndex + 1) % game.players.length
  const nextGame: GameState = { ...game, currentIndex: nextIndex, lastSpin }
  setGame(nextGame)
  triggerHandoff(nextGame)
  setIsSpinning(false)
}
```

- [ ] **Step 5: Update handleSpinComplete — non-win paths trigger handoff**

The main `setGame` block in `handleSpinComplete` (around lines 56-91) currently uses a functional updater. Refactor the non-win return path to use a direct set:

Find the block:
```ts
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
```

Replace with:
```ts
  if (!game) return
  const players = game.players.map(p => ({ ...p, inventory: [...p.inventory] }))
  const current = players[game.currentIndex]
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
    setGame({ ...game, players, phase: 'won', winner: game.currentIndex, lastSpin })
    setIsSpinning(false)
    return
  }
  const nextIndex = (game.currentIndex + 1) % game.players.length
  const nextGame: GameState = { ...game, players, currentIndex: nextIndex, lastSpin }
  setGame(nextGame)
  triggerHandoff(nextGame)
  setIsSpinning(false)
```

- [ ] **Step 6: Update handlePickAny — trigger handoff on non-win advance**

Replace current `handlePickAny`:
```ts
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
```

With:
```ts
function handlePickAny(jewel: JewelryId) {
  if (!game) return
  setPickAnyPending(false)
  const players = game.players.map(p => ({ ...p, inventory: [...p.inventory] }))
  const current = players[game.currentIndex]
  current.inventory.push(jewel)
  const lastSpin = `${current.name} chose ${jewel}! ⭐`
  if (current.inventory.length === JEWELRY.length && !current.hasBlackRing) {
    setGame({ ...game, players, phase: 'won', winner: game.currentIndex, lastSpin })
    setIsSpinning(false)
    return
  }
  const nextIndex = (game.currentIndex + 1) % game.players.length
  const nextGame: GameState = { ...game, players, currentIndex: nextIndex, lastSpin }
  setGame(nextGame)
  triggerHandoff(nextGame)
  setIsSpinning(false)
}
```

- [ ] **Step 7: Update handlePutBackChoice — trigger handoff**

Replace current `handlePutBackChoice`:
```ts
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
```

With:
```ts
function handlePutBackChoice(jewel: JewelryId) {
  if (!game) return
  setPutBackChoicePending(false)
  const players = game.players.map(p => ({ ...p, inventory: [...p.inventory] }))
  const current = players[game.currentIndex]
  current.inventory = current.inventory.filter(j => j !== jewel)
  const lastSpin = `${current.name} returned ${jewel}! ↩️`
  const nextIndex = (game.currentIndex + 1) % game.players.length
  const nextGame: GameState = { ...game, players, currentIndex: nextIndex, lastSpin }
  setGame(nextGame)
  triggerHandoff(nextGame)
  setIsSpinning(false)
}
```

- [ ] **Step 8: Add handleHandoffDone handler**

```ts
function handleHandoffDone() {
  setHandoffPending(false)
  setHandoffTo(null)
}
```

- [ ] **Step 9: Add handoff render gate and update handleNewGame**

In the render section, after `if (!game) return <SetupScreen ... />`, add:
```tsx
if (handoffPending && handoffTo) {
  return <HandoffScreen player={handoffTo} onReady={handleHandoffDone} />
}
```

Update `handleNewGame` to also clear handoff state:
```ts
function handleNewGame() {
  setGame(null); setIsSpinning(false); setSpinTrigger(0)
  setPickAnyPending(false); setPutBackChoicePending(false)
  setHandoffPending(false); setHandoffTo(null)
}
```

- [ ] **Step 10: Verify TypeScript compiles cleanly**

```bash
cd /Users/b/pretty_pretty_princess && npx tsc --noEmit 2>&1
```

Expected: **no errors**.

---

### Task 3: Verify in browser and commit

- [ ] **Step 1: Test in browser**

Server is already running at http://localhost:5173. Reload and verify:
- After a spin result, handoff screen appears with the correct next player's emoji and name
- Tapping the screen or the button advances to that player's game view
- Win screen is NOT gated behind a handoff
- New Game resets without showing handoff

- [ ] **Step 2: Commit**

```bash
cd /Users/b/pretty_pretty_princess && git add src/HandoffScreen.tsx src/App.tsx docs/superpowers/specs/2026-03-18-turn-handoff-screen-design.md docs/superpowers/plans/2026-03-18-turn-handoff-screen.md
git commit -m "KAN-19: turn handoff screen — pass the phone between turns"
```
