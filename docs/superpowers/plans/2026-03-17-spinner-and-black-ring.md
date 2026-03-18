# Spinner & Black Ring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an animated SVG spinner wheel and black ring mechanic to Pretty Pretty Princess, making it faithful to the physical board game.

**Architecture:** Rewrite `types.ts` with typed enums and a `lastSpinMessage` string for display, extract a pure `applySpinResult` function in `gameLogic.ts` for unit-tested game logic, build a self-contained `Spinner.tsx` SVG component that fires `onSpinComplete` via `transitionend`, and wire everything in `App.tsx` + `GameScreen.tsx`. Delete `spin.ts` only after `App.tsx` no longer imports it.

**Tech Stack:** Vite 5, React 18, TypeScript 5, Vitest (added for logic tests)

**Spec:** `docs/superpowers/specs/2026-03-17-spinner-and-black-ring-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/types.ts` | Rewrite | All shared types, constants, enums |
| `src/gameLogic.ts` | Create | Pure `applySpinResult` function (no React) |
| `src/Spinner.tsx` | Create | SVG animated wheel, fires `onSpinComplete` via transitionend |
| `src/GameScreen.tsx` | Modify | Integrate Spinner, player colors, ⚫ indicator, result message |
| `src/App.tsx` | Modify | Wire `handleSpinStart`, `handleSpinComplete`, `spinning` state, `initGame` |
| `src/SetupScreen.tsx` | Minor | Update subtitle emoji to match new jewelry set |
| `src/spin.ts` | Delete | **Only after App.tsx is rewritten (Task 5)** |
| `src/gameLogic.test.ts` | Create | Unit tests for `applySpinResult` |
| `vite.config.ts` | Modify | Add vitest config |
| `package.json` | Modify | Add vitest dev dependency + test script |

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
npm install -D vitest jsdom
```

- [ ] **Step 3: Update `vite.config.ts`**

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

- [ ] **Step 4: Add test script to `package.json` scripts section**

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Verify vitest works**

```bash
npm test
```
Expected: "No test files found" — not an error.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vite.config.ts
git commit -m "chore: add vitest"
```

---

## Task 2: Rewrite `src/types.ts`

**Files:**
- Modify: `src/types.ts`

Note: `JEWELRY` changes from emoji strings to string IDs. Every place the old code renders inventory as `.join(' ')` breaks — fixed in Task 6. Do Tasks 2 and 6 before running the dev server.

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
  players: Player[]              // length 2–3, validated at init
  currentIndex: number
  blackRingHolder: number | null // player index, or null = in supply
  phase: 'playing' | 'won'
  winner: number | null
  lastSpin: SpinOutcome | null   // null only before first spin; never cleared
  lastSpinMessage: string | null // pre-rendered display string, e.g. "Alice got 👑!"
  spinning: boolean              // true while Spinner is animating
}
```

- [ ] **Step 2: Verify TypeScript (errors in App.tsx/GameScreen.tsx expected — fixed later)**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "refactor: rewrite types with SpinOutcome, blackRingHolder, lastSpinMessage"
```

---

## Task 3: Create `src/gameLogic.ts` with `applySpinResult` (TDD)

**Files:**
- Create: `src/gameLogic.test.ts`
- Create: `src/gameLogic.ts`

`applySpinResult` is a pure function: takes a `GameState` and a `SpinOutcome`, returns the next `GameState`. All game rules live here.

### 3a — Write failing tests first, commit them red

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
    lastSpinMessage: null,
    spinning: true,
    ...overrides,
  }
}

describe('applySpinResult — jewel acquisition', () => {
  it('takes jewel from supply', () => {
    const next = applySpinResult(makeGame(), 'crown')
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

  it('is a no-op if current player already has the jewel — turn still advances', () => {
    const state = makeGame({
      players: [
        { name: 'Alice', inventory: ['crown'] },
        { name: 'Bob', inventory: [] },
        { name: 'Carol', inventory: [] },
      ],
    })
    const next = applySpinResult(state, 'crown')
    expect(next.players[0].inventory.filter(j => j === 'crown')).toHaveLength(1)
    expect(next.currentIndex).toBe(1)
  })
})

describe('applySpinResult — black ring', () => {
  it('gives black ring from supply', () => {
    const next = applySpinResult(makeGame(), 'black_ring')
    expect(next.blackRingHolder).toBe(0)
    expect(next.currentIndex).toBe(1)
  })

  it('transfers black ring from another player', () => {
    const next = applySpinResult(makeGame({ blackRingHolder: 1 }), 'black_ring')
    expect(next.blackRingHolder).toBe(0)
  })

  it('is a no-op if current player already holds black ring — state unchanged except turn advance', () => {
    const state = makeGame({ blackRingHolder: 0 })
    const next = applySpinResult(state, 'black_ring')
    expect(next.blackRingHolder).toBe(0)
    expect(next.players).toEqual(state.players)
    expect(next.currentIndex).toBe(1) // turn still advances
  })
})

describe('applySpinResult — turn advancement', () => {
  it('advances turn after spin', () => {
    const next = applySpinResult(makeGame({ currentIndex: 1 }), 'ring')
    expect(next.currentIndex).toBe(2)
  })

  it('wraps turn index', () => {
    const next = applySpinResult(makeGame({ currentIndex: 2 }), 'ring')
    expect(next.currentIndex).toBe(0)
  })
})

describe('applySpinResult — win condition', () => {
  it('wins when all 5 jewels collected and no black ring', () => {
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
    expect(next.currentIndex).toBe(1) // turn advances normally
  })

  it('wins when player steals 5th jewel from another player', () => {
    const state = makeGame({
      players: [
        { name: 'Alice', inventory: ['ring', 'necklace', 'earrings', 'bracelet'] },
        { name: 'Bob', inventory: ['crown'] },
        { name: 'Carol', inventory: [] },
      ],
    })
    const next = applySpinResult(state, 'crown')
    expect(next.phase).toBe('won')
    expect(next.winner).toBe(0)
    expect(next.players[1].inventory).not.toContain('crown')
  })
})
```

- [ ] **Step 2: Run tests — expect all to fail**

```bash
npm test
```
Expected: all tests fail with "Cannot find module './gameLogic'"

- [ ] **Step 3: Commit failing tests (TDD red)**

```bash
git add src/gameLogic.test.ts
git commit -m "test: add failing tests for applySpinResult"
```

### 3b — Implement until tests pass

- [ ] **Step 4: Create `src/gameLogic.ts`**

```ts
import { GameState, JEWELRY, JEWELRY_EMOJI, SpinOutcome } from './types'

export function applySpinResult(state: GameState, result: SpinOutcome): GameState {
  const players = state.players.map(p => ({ ...p, inventory: [...p.inventory] }))
  const current = players[state.currentIndex]
  let { blackRingHolder } = state
  let lastSpinMessage: string

  if (result === 'black_ring') {
    if (blackRingHolder !== state.currentIndex) {
      blackRingHolder = state.currentIndex
    }
    lastSpinMessage = `⚫ ${current.name} has the black ring!`
  } else {
    const alreadyOwned = current.inventory.includes(result)
    if (!alreadyOwned) {
      for (const player of players) {
        const idx = player.inventory.indexOf(result)
        if (idx !== -1) {
          player.inventory.splice(idx, 1)
          break
        }
      }
      current.inventory.push(result)
    }
    lastSpinMessage = `${current.name} got ${JEWELRY_EMOJI[result]}!`
  }

  // Check win BEFORE advancing currentIndex
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
      lastSpinMessage,
      spinning: false,
    }
  }

  const nextIndex = (state.currentIndex + 1) % state.players.length
  return {
    ...state,
    players,
    blackRingHolder,
    currentIndex: nextIndex,
    lastSpin: result,
    lastSpinMessage,
    spinning: false,
  }
}
```

- [ ] **Step 5: Run tests — expect all to pass**

```bash
npm test
```
Expected: 12 tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/gameLogic.ts
git commit -m "feat: implement applySpinResult"
```

---

## Task 4: Create `src/Spinner.tsx`

**Files:**
- Create: `src/Spinner.tsx`

Key implementation notes:
- Uses `transitionend` event (not `setTimeout`) so it fires exactly when the animation finishes
- Rotation math accounts for accumulated rotation state to ensure correct wedge targeting
- Local `spinning` state prevents double-tap regardless of parent re-render timing
- `unmountedRef` prevents calling `onSpinComplete` after component unmounts
- `onSpinStart` prop is called immediately on tap so parent can set `spinning: true` in GameState

- [ ] **Step 1: Create `src/Spinner.tsx`**

```tsx
import { useRef, useState, useEffect } from 'react'
import { SPIN_OUTCOMES, SpinOutcome, JEWELRY_EMOJI } from './types'

interface SpinnerProps {
  onSpinStart: () => void
  onSpinComplete: (result: SpinOutcome) => void
  disabled: boolean
}

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
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function wedgePath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCart(cx, cy, r, startAngle)
  const end = polarToCart(cx, cy, r, endAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M${cx},${cy} L${start.x},${start.y} A${r},${r} 0 ${largeArc} 1 ${end.x},${end.y} Z`
}

export default function Spinner({ onSpinStart, onSpinComplete, disabled }: SpinnerProps) {
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const wheelRef = useRef<SVGGElement>(null)
  const unmountedRef = useRef(false)

  useEffect(() => {
    return () => { unmountedRef.current = true }
  }, [])

  function handleSpin() {
    if (spinning || disabled) return

    const resultIndex = Math.floor(Math.random() * SPIN_OUTCOMES.length)
    const result = SPIN_OUTCOMES[resultIndex]

    // Wedge i center sits at (i * 60 + 30)° in wheel-space (0° = 12 o'clock).
    // Needle is fixed at 12 o'clock. We need wedge center to land at 0°.
    // Account for accumulated rotation so each spin builds on the last.
    const wedgeCenter = resultIndex * WEDGE_ANGLE + WEDGE_ANGLE / 2
    const currentAngle = rotation % 360
    const degreesToTarget = (360 - ((wedgeCenter + currentAngle) % 360)) % 360
    const targetRotation = rotation + 5 * 360 + degreesToTarget

    setSpinning(true)
    onSpinStart()
    setRotation(targetRotation)

    const el = wheelRef.current
    if (!el) return

    const onEnd = () => {
      el.removeEventListener('transitionend', onEnd)
      if (unmountedRef.current) return
      setSpinning(false)
      onSpinComplete(result)
    }
    el.addEventListener('transitionend', onEnd)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      {/* Needle — fixed triangle pointing down into the wheel rim */}
      <div style={{
        width: 0,
        height: 0,
        borderLeft: '10px solid transparent',
        borderRight: '10px solid transparent',
        borderTop: '24px solid #7b1fa2',
        marginBottom: -8,
        zIndex: 1,
        position: 'relative',
      }} />

      {/* Wheel */}
      <svg width={SIZE} height={SIZE} style={{ display: 'block' }}>
        <g
          ref={wheelRef}
          style={{
            transformOrigin: `${CX}px ${CY}px`,
            transform: `rotate(${rotation}deg)`,
            transition: spinning
              ? 'transform 2.5s cubic-bezier(0.17, 0.67, 0.12, 0.99)'
              : 'none',
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

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep Spinner
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/Spinner.tsx
git commit -m "feat: add SVG animated spinner with transitionend"
```

---

## Task 5: Update `src/App.tsx`

**Files:**
- Modify: `src/App.tsx`

This removes the `spin` import from `./spin`. Do **not** delete `spin.ts` yet — that is Task 7.

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
    lastSpinMessage: null,
    spinning: false,
  }
}

export default function App() {
  const [game, setGame] = useState<GameState | null>(null)

  function handleStart(players: Player[]) {
    setGame(initGame(players))
  }

  // Called immediately on tap — sets spinning:true so Spinner's disabled prop updates
  function handleSpinStart() {
    setGame(prev => prev ? { ...prev, spinning: true } : prev)
  }

  // Called after animation completes via transitionend
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

- [ ] **Step 2: Verify TypeScript (GameScreen prop errors expected — fixed in Task 6)**

```bash
npx tsc --noEmit 2>&1 | grep -v GameScreen
```

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire applySpinResult and handleSpinStart into App.tsx"
```

---

## Task 6: Update `src/GameScreen.tsx` + fix `src/SetupScreen.tsx`

**Files:**
- Modify: `src/GameScreen.tsx`
- Modify: `src/SetupScreen.tsx`

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

  const playerColor = PLAYER_COLORS[game.currentIndex]

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
          {PLAYER_EMOJIS[game.currentIndex]} {game.players[game.currentIndex].name}
        </div>
      </div>

      {/* Spinner */}
      <Spinner
        onSpinStart={onSpinStart}
        onSpinComplete={onSpinComplete}
        disabled={game.spinning}
      />

      {/* Last spin result — pre-rendered in gameLogic, safe to display directly */}
      {game.lastSpinMessage && (
        <div style={{
          marginTop: 16,
          background: 'rgba(255,255,255,0.7)',
          borderRadius: 12,
          padding: '10px 20px',
          fontSize: 17,
          color: '#7b1fa2',
        }}>
          {game.lastSpinMessage}
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

- [ ] **Step 2: Update subtitle in `src/SetupScreen.tsx`**

Find this line:
```tsx
Collect all 5 jewels to win! 💍📿💎✨
```
Replace with:
```tsx
Collect all 5 jewels to win! 👑💍📿👂💎
```

- [ ] **Step 3: Full TypeScript check — expect 0 errors**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Run all tests**

```bash
npm test
```
Expected: 12 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/GameScreen.tsx src/SetupScreen.tsx
git commit -m "feat: update GameScreen with Spinner, player colors, black ring indicator"
```

---

## Task 7: Delete `src/spin.ts` and verify in browser

**Files:**
- Delete: `src/spin.ts`

Safe to delete — `App.tsx` no longer imports it after Task 5.

- [ ] **Step 1: Delete `src/spin.ts`**

```bash
git rm src/spin.ts
```

- [ ] **Step 2: Final TypeScript check**

```bash
npx tsc --noEmit
```
Expected: 0 errors

- [ ] **Step 3: Run all tests**

```bash
npm test
```
Expected: 12 tests PASS

- [ ] **Step 4: Start dev server and manually verify**

```bash
npm run dev
```

Open `http://localhost:5173` and check:
- [ ] Setup screen loads; 2/3 player picker works; names editable
- [ ] Game starts; turn banner shows correct player color
- [ ] Tapping Spin triggers wheel animation (~2.5s)
- [ ] Button shows "Spinning…" and is disabled during animation
- [ ] Result message appears after wheel settles (correct player name, correct jewel emoji)
- [ ] Jewel appears in the spinning player's inventory row
- [ ] Spinning a jewel another player holds steals it from them
- [ ] Landing on ⚫ shows ⚫ next to that player's name
- [ ] Landing on ⚫ when already holding it does nothing
- [ ] Winning player (all 5 jewels, no ⚫) triggers win screen immediately
- [ ] Win screen shows correct winner name + 5 jewelry emojis
- [ ] Play Again resets to setup screen

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove spin.ts"
```

---

## Task 8: Push to GitHub

- [ ] **Step 1: Push all commits**

```bash
git push origin main
```

Expected: all commits visible at https://github.com/barkev-dino/pretty_pretty_princess
