# Spinner & Black Ring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an animated SVG spinner wheel and black ring mechanic to Pretty Pretty Princess, making it faithful to the physical board game.

**Architecture:** Rewrite `types.ts` with proper typed enums, extract a pure `applySpinResult` function for testable game logic, build a self-contained `Spinner.tsx` SVG component that fires `onSpinComplete`, and wire everything together in `App.tsx` and `GameScreen.tsx`.

**Tech Stack:** Vite 5, React 18, TypeScript 5, Vitest (added for logic tests)

**Spec:** `docs/superpowers/specs/2026-03-17-spinner-and-black-ring-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/types.ts` | Rewrite | All shared types, constants, and enums |
| `src/gameLogic.ts` | Create | Pure `applySpinResult` function (no React) |
| `src/Spinner.tsx` | Create | SVG animated wheel, fires `onSpinComplete` |
| `src/GameScreen.tsx` | Modify | Integrate Spinner, player colors, ⚫ indicator |
| `src/App.tsx` | Modify | Wire `handleSpin`, `spinning` state, `initGame` |
| `src/SetupScreen.tsx` | No change | Colors are auto-assigned, no UI change needed |
| `src/spin.ts` | Delete | Logic moved into `Spinner.tsx` and `gameLogic.ts` |
| `src/gameLogic.test.ts` | Create | Unit tests for `applySpinResult` |
| `vite.config.ts` | Modify | Add vitest config |
| `package.json` | Modify | Add vitest dev dependency |

---

## Task 1: Set up repo locally and install vitest

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`

- [ ] **Step 1: Clone repo if not already local**

```bash
cd /Users/b
git clone git@github.com:barkev-dino/pretty_pretty_princess.git pretty_pretty_princess
cd pretty_pretty_princess
npm install
```

- [ ] **Step 2: Install vitest**

```bash
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 3: Update `vite.config.ts` to add vitest config**

Replace contents of `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

- [ ] **Step 4: Add test script to `package.json`**

In the `"scripts"` section, add:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Verify vitest works**

```bash
npm test
```
Expected: "No test files found" (not an error — this is correct at this stage)

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vite.config.ts
git commit -m "chore: add vitest for unit testing"
```

---

## Task 2: Rewrite `src/types.ts`

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: Replace `src/types.ts` entirely**

```ts
export type JewelryId = 'crown' | 'ring' | 'necklace' | 'earrings' | 'bracelet'
export type SpinOutcome = JewelryId | 'black_ring'

export const JEWELRY: JewelryId[] = ['crown', 'ring', 'necklace', 'earrings', 'bracelet']
export const SPIN_OUTCOMES: SpinOutcome[] = [...JEWELRY, 'black_ring']

export const PLAYER_COLORS = ['#f48fb1', '#ce93d8', '#81d4fa'] as const
export const PLAYER_EMOJIS = ['🩷', '💜', '💙'] as const

export const JEWELRY_EMOJI: Record<JewelryId, string> = {
  crown: '👑',
  ring: '💍',
  necklace: '📿',
  earrings: '👂',
  bracelet: '💎',
}

export interface Player {
  name: string
  inventory: JewelryId[]
}

export interface GameState {
  players: Player[]          // length 2–3
  currentIndex: number
  blackRingHolder: number | null   // player index, or null = in supply
  phase: 'playing' | 'won'
  winner: number | null
  lastSpin: SpinOutcome | null     // null only before first spin
  spinning: boolean                // true during spinner animation
}
```

- [ ] **Step 2: Verify TypeScript compiles (expect errors in App.tsx and GameScreen.tsx — that's fine for now)**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "refactor: rewrite types with SpinOutcome, blackRingHolder, spinning"
```

---

## Task 3: Create `src/gameLogic.ts` with `applySpinResult` (TDD)

**Files:**
- Create: `src/gameLogic.ts`
- Create: `src/gameLogic.test.ts`

The entire turn-resolution logic lives here as a pure function — no React, no side effects. This is the most testable part of the app.

### 3a: Write failing tests

- [ ] **Step 1: Create `src/gameLogic.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { applySpinResult } from './gameLogic'
import { GameState } from './types'

function makeGame(overrides: Partial<GameState> = {}): GameState {
  return {
    players: [
      { name: 'Alice', inventory: [] },
      { name: 'Bob', inventory: [] },
      { name: 'Carol', inventory: [] },
    ],
    currentIndex: 0,
    blackRingHolder: null,
    phase: 'playing',
    winner: null,
    lastSpin: null,
    spinning: true,
    ...overrides,
  }
}

describe('applySpinResult', () => {
  it('adds jewel from supply to current player', () => {
    const state = makeGame()
    const next = applySpinResult(state, 'crown')
    expect(next.players[0].inventory).toContain('crown')
    expect(next.lastSpin).toBe('crown')
    expect(next.spinning).toBe(false)
  })

  it('steals jewel from another player', () => {
    const state = makeGame({
      players: [
        { name: 'Alice', inventory: [] },
        { name: 'Bob', inventory: ['crown'] },
        { name: 'Carol', inventory: [] },
      ],
    })
    const next = applySpinResult(state, 'crown')
    expect(next.players[0].inventory).toContain('crown')
    expect(next.players[1].inventory).not.toContain('crown')
  })

  it('is a no-op if current player already has the jewel', () => {
    const state = makeGame({
      players: [
        { name: 'Alice', inventory: ['crown'] },
        { name: 'Bob', inventory: [] },
        { name: 'Carol', inventory: [] },
      ],
    })
    const next = applySpinResult(state, 'crown')
    expect(next.players[0].inventory.filter(j => j === 'crown')).toHaveLength(1)
    expect(next.currentIndex).toBe(1) // turn still advances
  })

  it('gives black ring from supply', () => {
    const state = makeGame()
    const next = applySpinResult(state, 'black_ring')
    expect(next.blackRingHolder).toBe(0)
    expect(next.currentIndex).toBe(1)
  })

  it('transfers black ring from another player', () => {
    const state = makeGame({ blackRingHolder: 1 })
    const next = applySpinResult(state, 'black_ring')
    expect(next.blackRingHolder).toBe(0)
  })

  it('is a no-op if current player already holds black ring', () => {
    const state = makeGame({ blackRingHolder: 0 })
    const next = applySpinResult(state, 'black_ring')
    expect(next.blackRingHolder).toBe(0)
    expect(next.currentIndex).toBe(1) // turn still advances
  })

  it('advances turn after each spin', () => {
    const state = makeGame({ currentIndex: 1 })
    const next = applySpinResult(state, 'ring')
    expect(next.currentIndex).toBe(2)
  })

  it('wraps turn index around player count', () => {
    const state = makeGame({ currentIndex: 2 })
    const next = applySpinResult(state, 'ring')
    expect(next.currentIndex).toBe(0)
  })

  it('detects win when all 5 jewels collected and no black ring', () => {
    const state = makeGame({
      players: [
        { name: 'Alice', inventory: ['ring', 'necklace', 'earrings', 'bracelet'] },
        { name: 'Bob', inventory: [] },
        { name: 'Carol', inventory: [] },
      ],
    })
    const next = applySpinResult(state, 'crown')
    expect(next.phase).toBe('won')
    expect(next.winner).toBe(0)
    expect(next.currentIndex).toBe(0) // NOT advanced on win
  })

  it('does NOT win while holding black ring even with all 5 jewels', () => {
    const state = makeGame({
      players: [
        { name: 'Alice', inventory: ['ring', 'necklace', 'earrings', 'bracelet'] },
        { name: 'Bob', inventory: [] },
        { name: 'Carol', inventory: [] },
      ],
      blackRingHolder: 0,
    })
    const next = applySpinResult(state, 'crown')
    expect(next.phase).toBe('playing')
    expect(next.winner).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests — expect all to fail**

```bash
npm test
```
Expected: all tests fail with "Cannot find module './gameLogic'"

### 3b: Implement `gameLogic.ts`

- [ ] **Step 3: Create `src/gameLogic.ts`**

```ts
import { GameState, JEWELRY, SpinOutcome } from './types'

export function applySpinResult(state: GameState, result: SpinOutcome): GameState {
  // Deep copy players
  const players = state.players.map(p => ({ ...p, inventory: [...p.inventory] }))
  const current = players[state.currentIndex]
  let { blackRingHolder } = state

  if (result === 'black_ring') {
    // No-op if current player already holds it
    if (blackRingHolder !== state.currentIndex) {
      blackRingHolder = state.currentIndex
    }
  } else {
    // Jewel logic
    const alreadyOwned = current.inventory.includes(result)
    if (!alreadyOwned) {
      // Remove from another player if they have it
      for (const player of players) {
        const idx = player.inventory.indexOf(result)
        if (idx !== -1) {
          player.inventory.splice(idx, 1)
          break
        }
      }
      current.inventory.push(result)
    }
  }

  // Check win BEFORE advancing turn
  const hasAllJewels = JEWELRY.every(j => current.inventory.includes(j))
  const holdsBlackRing = blackRingHolder === state.currentIndex
  if (hasAllJewels && !holdsBlackRing) {
    return {
      ...state,
      players,
      blackRingHolder,
      phase: 'won',
      winner: state.currentIndex,
      lastSpin: result,
      spinning: false,
    }
  }

  // Advance turn
  const nextIndex = (state.currentIndex + 1) % state.players.length
  return {
    ...state,
    players,
    blackRingHolder,
    currentIndex: nextIndex,
    lastSpin: result,
    spinning: false,
  }
}
```

- [ ] **Step 4: Run tests — expect all to pass**

```bash
npm test
```
Expected: all 10 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/gameLogic.ts src/gameLogic.test.ts
git commit -m "feat: add applySpinResult with full jewel transfer + black ring logic"
```

---

## Task 4: Create `src/Spinner.tsx` (SVG animated wheel)

**Files:**
- Create: `src/Spinner.tsx`

No tests for this task — it is a pure visual component. Verify manually in the browser.

- [ ] **Step 1: Create `src/Spinner.tsx`**

```tsx
import { useRef, useState } from 'react'
import { SPIN_OUTCOMES, SpinOutcome, JEWELRY_EMOJI } from './types'

interface SpinnerProps {
  onSpinComplete: (result: SpinOutcome) => void
  disabled: boolean
}

// Wedge colors match SPIN_OUTCOMES order
const WEDGE_COLORS = [
  '#f48fb1', // crown — rose pink
  '#ce93d8', // ring — lavender
  '#4db6ac', // bracelet — teal
  '#ffd54f', // earrings — gold
  '#81d4fa', // necklace — sky blue
  '#424242', // black_ring — dark
]

const WEDGE_EMOJI = SPIN_OUTCOMES.map(o =>
  o === 'black_ring' ? '⚫' : JEWELRY_EMOJI[o]
)

const SIZE = 260
const CX = SIZE / 2
const CY = SIZE / 2
const R = SIZE / 2 - 4
const WEDGE_ANGLE = 360 / SPIN_OUTCOMES.length // 60°

function polarToCart(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  }
}

function wedgePath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCart(cx, cy, r, startAngle)
  const end = polarToCart(cx, cy, r, endAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M${cx},${cy} L${start.x},${start.y} A${r},${r} 0 ${largeArc} 1 ${end.x},${end.y} Z`
}

export default function Spinner({ onSpinComplete, disabled }: SpinnerProps) {
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const wheelRef = useRef<SVGGElement>(null)

  function handleSpin() {
    if (spinning || disabled) return

    // Pre-determine result
    const resultIndex = Math.floor(Math.random() * SPIN_OUTCOMES.length)
    const result = SPIN_OUTCOMES[resultIndex]

    // Target angle: land on center of result wedge
    // Needle is at top (0°). Wedge i starts at i*60°.
    // Center of wedge i = i*60 + 30°
    // We want that center under the needle (top).
    // Rotation needed = 360 - (wedgeCenter) so it comes to top
    const wedgeCenter = resultIndex * WEDGE_ANGLE + WEDGE_ANGLE / 2
    const spinAmount = (5 * 360) + (360 - wedgeCenter)
    const targetRotation = rotation + spinAmount

    setSpinning(true)
    setRotation(targetRotation)

    // Match CSS transition duration (2500ms)
    setTimeout(() => {
      setSpinning(false)
      onSpinComplete(result)
    }, 2500)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      {/* Needle */}
      <div style={{
        width: 0,
        height: 0,
        borderLeft: '10px solid transparent',
        borderRight: '10px solid transparent',
        borderTop: '24px solid #7b1fa2',
        marginBottom: -8,
        zIndex: 1,
      }} />

      {/* SVG Wheel */}
      <svg width={SIZE} height={SIZE} style={{ display: 'block' }}>
        <g
          ref={wheelRef}
          style={{
            transformOrigin: `${CX}px ${CY}px`,
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? 'transform 2.5s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
          }}
        >
          {SPIN_OUTCOMES.map((_, i) => {
            const startAngle = i * WEDGE_ANGLE
            const endAngle = startAngle + WEDGE_ANGLE
            const midAngle = startAngle + WEDGE_ANGLE / 2
            const labelPos = polarToCart(CX, CY, R * 0.65, midAngle)
            return (
              <g key={i}>
                <path
                  d={wedgePath(CX, CY, R, startAngle, endAngle)}
                  fill={WEDGE_COLORS[i]}
                  stroke="#fff"
                  strokeWidth={2}
                />
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={28}
                >
                  {WEDGE_EMOJI[i]}
                </text>
              </g>
            )
          })}
          {/* Center circle */}
          <circle cx={CX} cy={CY} r={18} fill="#fff" stroke="#ce93d8" strokeWidth={3} />
        </g>
      </svg>

      {/* Spin button */}
      <button
        onClick={handleSpin}
        disabled={spinning || disabled}
        style={{
          fontSize: 22,
          padding: '16px 52px',
          borderRadius: 16,
          border: 'none',
          cursor: spinning || disabled ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          fontWeight: 'bold',
          background: spinning || disabled
            ? '#e0e0e0'
            : 'linear-gradient(135deg, #f48fb1, #ce93d8)',
          color: spinning || disabled ? '#bbb' : '#fff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          transition: 'background 0.2s',
        }}
      >
        {spinning ? 'Spinning…' : 'Spin! ✨'}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit 2>&1 | grep Spinner
```
Expected: no errors for `Spinner.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/Spinner.tsx
git commit -m "feat: add SVG animated spinner wheel"
```

---

## Task 5: Update `src/App.tsx`

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Rewrite `src/App.tsx`**

```tsx
import { useState } from 'react'
import SetupScreen from './SetupScreen'
import GameScreen from './GameScreen'
import { GameState, Player, SpinOutcome } from './types'
import { applySpinResult } from './gameLogic'

function initGame(players: Player[]): GameState {
  return {
    players,
    currentIndex: 0,
    blackRingHolder: null,
    phase: 'playing',
    winner: null,
    lastSpin: null,
    spinning: false,
  }
}

export default function App() {
  const [game, setGame] = useState<GameState | null>(null)

  function handleStart(players: Player[]) {
    setGame(initGame(players))
  }

  function handleSpinStart() {
    setGame(prev => prev ? { ...prev, spinning: true } : prev)
  }

  function handleSpinComplete(result: SpinOutcome) {
    setGame(prev => {
      if (!prev || prev.phase !== 'playing') return prev
      return applySpinResult(prev, result)
    })
  }

  function handleNewGame() {
    setGame(null)
  }

  if (!game) {
    return <SetupScreen onStart={handleStart} />
  }

  return (
    <GameScreen
      game={game}
      onSpinStart={handleSpinStart}
      onSpinComplete={handleSpinComplete}
      onNewGame={handleNewGame}
    />
  )
}
```

- [ ] **Step 2: Verify TypeScript (expect errors in GameScreen — that's fine)**

```bash
npx tsc --noEmit 2>&1 | grep -v GameScreen
```

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire applySpinResult into App handleSpin"
```

---

## Task 6: Update `src/GameScreen.tsx`

**Files:**
- Modify: `src/GameScreen.tsx`

- [ ] **Step 1: Rewrite `src/GameScreen.tsx`**

```tsx
import { GameState, JEWELRY_EMOJI, PLAYER_COLORS, PLAYER_EMOJIS, SpinOutcome } from './types'
import Spinner from './Spinner'

interface Props {
  game: GameState
  onSpinStart: () => void
  onSpinComplete: (result: SpinOutcome) => void
  onNewGame: () => void
}

export default function GameScreen({ game, onSpinStart, onSpinComplete, onNewGame }: Props) {
  if (game.phase === 'won' && game.winner !== null) {
    const winner = game.players[game.winner]
    return (
      <div style={{ textAlign: 'center', paddingTop: 40 }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>👑</div>
        <h2 style={{ fontSize: 32, color: '#7b1fa2', marginBottom: 8 }}>
          {winner.name} Wins!
        </h2>
        <p style={{ fontSize: 18, color: '#9c27b0', marginBottom: 24 }}>
          Collected all the jewels!
        </p>
        <div style={{ fontSize: 32, marginBottom: 32 }}>
          {winner.inventory.map(j => JEWELRY_EMOJI[j]).join(' ')}
        </div>
        <button onClick={onNewGame} style={bigBtn('#ce93d8')}>
          Play Again
        </button>
      </div>
    )
  }

  const current = game.players[game.currentIndex]
  const playerColor = PLAYER_COLORS[game.currentIndex]

  function handleSpinComplete(result: SpinOutcome) {
    onSpinComplete(result)
  }

  return (
    <div style={{ textAlign: 'center' }}>
      {/* Turn banner */}
      <div style={{
        background: `linear-gradient(135deg, ${playerColor}, #f48fb1)`,
        borderRadius: 20,
        padding: '16px 24px',
        marginBottom: 24,
        color: '#fff',
      }}>
        <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>It's your turn!</div>
        <div style={{ fontSize: 28, fontWeight: 'bold' }}>
          {PLAYER_EMOJIS[game.currentIndex]} {current.name}
        </div>
      </div>

      {/* Spinner */}
      <Spinner
        onSpinComplete={handleSpinComplete}
        disabled={game.spinning}
      />

      {/* Last spin result */}
      {game.lastSpin && (
        <div style={{
          marginTop: 16,
          background: 'rgba(255,255,255,0.7)',
          borderRadius: 12,
          padding: '10px 20px',
          fontSize: 17,
          color: '#7b1fa2',
        }}>
          {game.lastSpin === 'black_ring'
            ? `⚫ ${game.players.find((_, i) => i === game.blackRingHolder)?.name ?? ''} has the black ring!`
            : `${current.name} ${game.players[game.currentIndex === 0 ? game.players.length - 1 : game.currentIndex - 1]?.name ?? ''} spun ${JEWELRY_EMOJI[game.lastSpin]}!`}
        </div>
      )}

      {/* Inventory */}
      <div style={{ marginTop: 28 }}>
        {game.players.map((p, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 16px',
            marginBottom: 10,
            borderRadius: 12,
            background: i === game.currentIndex
              ? 'rgba(206,147,216,0.25)'
              : 'rgba(255,255,255,0.5)',
            border: `2px solid ${i === game.currentIndex ? PLAYER_COLORS[i] : 'transparent'}`,
          }}>
            <span style={{ fontSize: 20 }}>{PLAYER_EMOJIS[i]}</span>
            {game.blackRingHolder === i && (
              <span style={{ fontSize: 18 }}>⚫</span>
            )}
            <span style={{ fontWeight: 'bold', color: '#7b1fa2', minWidth: 70, textAlign: 'left' }}>
              {p.name}
            </span>
            <span style={{ fontSize: 20, letterSpacing: 3, flex: 1, textAlign: 'left' }}>
              {p.inventory.length === 0
                ? <span style={{ color: '#ccc', fontSize: 13 }}>no jewels yet</span>
                : p.inventory.map(j => JEWELRY_EMOJI[j]).join(' ')}
            </span>
            <span style={{ color: '#ab47bc', fontSize: 13 }}>
              {p.inventory.length}/5
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={onNewGame}
        style={{ marginTop: 20, background: 'none', border: 'none', color: '#ab47bc', cursor: 'pointer', fontSize: 14, textDecoration: 'underline' }}
      >
        New Game
      </button>
    </div>
  )
}

function bigBtn(bg: string): React.CSSProperties {
  return {
    fontSize: 22,
    padding: '18px 56px',
    borderRadius: 16,
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontWeight: 'bold',
    background: bg,
    color: '#fff',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  }
}
```

- [ ] **Step 2: Run TypeScript check — should be clean**

```bash
npx tsc --noEmit
```
Expected: 0 errors

- [ ] **Step 3: Run tests — still passing**

```bash
npm test
```
Expected: 10 tests PASS

- [ ] **Step 4: Commit**

```bash
git add src/GameScreen.tsx
git commit -m "feat: update GameScreen with Spinner, player colors, black ring indicator"
```

---

## Task 7: Delete `src/spin.ts` and verify app

**Files:**
- Delete: `src/spin.ts`

- [ ] **Step 1: Delete `src/spin.ts`**

```bash
git rm src/spin.ts
```

- [ ] **Step 2: Full TypeScript check**

```bash
npx tsc --noEmit
```
Expected: 0 errors

- [ ] **Step 3: Run all tests**

```bash
npm test
```
Expected: 10 tests PASS

- [ ] **Step 4: Start dev server and manually verify the game**

```bash
npm run dev
```

Open browser at `http://localhost:5173`. Check:
- [ ] Setup screen loads, 2/3 player selection works, names editable
- [ ] Game starts, turn banner shows player color
- [ ] Spin button triggers wheel animation (~2.5s)
- [ ] Wheel lands on a wedge, result message appears
- [ ] Jewel appears in the spinning player's inventory row
- [ ] Spinning another player's jewel steals it from them
- [ ] Landing on ⚫ shows black ring next to that player's name
- [ ] Landing on ⚫ when you already hold it does nothing
- [ ] Winning player (all 5 jewels, no black ring) triggers win screen
- [ ] Play Again resets to setup

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove spin.ts (logic moved to gameLogic.ts + Spinner.tsx)"
```

---

## Task 8: Push to GitHub

- [ ] **Step 1: Push**

```bash
git push origin main
```

Expected: branch pushed, all commits visible at https://github.com/barkev-dino/pretty_pretty_princess
