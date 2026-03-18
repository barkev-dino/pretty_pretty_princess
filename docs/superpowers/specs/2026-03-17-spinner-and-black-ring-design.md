# Pretty Pretty Princess — Spinner & Black Ring Design

**Date:** 2026-03-17  
**Status:** Approved  
**Scope:** Animated SVG spinner, black ring mechanic, player colors

---

## 1. Goals

Make the game as close to the physical Pretty Pretty Princess board game as possible, with a visually satisfying animated spinner that kids will enjoy watching spin. Prototype quality — no external dependencies, keep it lightweight.

---

## 2. Types (`src/types.ts`)

```ts
export type JewelryId = 'crown' | 'ring' | 'necklace' | 'earrings' | 'bracelet'
export type SpinOutcome = JewelryId | 'black_ring'
export const JEWELRY: JewelryId[] = ['crown', 'ring', 'necklace', 'earrings', 'bracelet']
export const SPIN_OUTCOMES: SpinOutcome[] = [...JEWELRY, 'black_ring']

export const PLAYER_COLORS = ['#f48fb1', '#ce93d8', '#81d4fa'] as const
export const PLAYER_EMOJIS = ['🩷', '💜', '💙'] as const  // used in inventory rows

export const JEWELRY_EMOJI: Record<JewelryId, string> = {
  crown: '👑', ring: '💍', necklace: '📿', earrings: '👂', bracelet: '💎'
}

export interface Player {
  name: string
  inventory: JewelryId[]
}

export interface GameState {
  players: Player[]          // length 2–3, validated at init
  currentIndex: number
  blackRingHolder: number | null   // player index, or null = in supply
  phase: 'playing' | 'won'
  winner: number | null
  lastSpin: SpinOutcome | null     // null only before first spin; never cleared
  spinning: boolean                // true during spinner animation; drives disabled prop
}
```

### Initial GameState
```ts
{
  players,           // from SetupScreen; must be length 2–3
  currentIndex: 0,
  blackRingHolder: null,
  phase: 'playing',
  winner: null,
  lastSpin: null,
  spinning: false,
}
```

---

## 3. Game Rules

### Jewelry Pieces (5)
| Emoji | Name | JewelryId |
|-------|------|-----------|
| 👑 | Crown | `crown` |
| 💍 | Ring | `ring` |
| 📿 | Necklace | `necklace` |
| 👂 | Earrings | `earrings` |
| 💎 | Bracelet | `bracelet` |

### Jewel Acquisition Rules
- Spun jewel **in supply** (no player holds it) → current player adds it to inventory
- Spun jewel **held by another player** → current player takes it from them (remove from their inventory, add to current player's)
- Current player **already holds** spun jewel → no-op; turn advances normally

### Black Ring Rules
- Spin `black_ring` → set `blackRingHolder = currentIndex` (regardless of whether it was `null`, another player's index, or already `currentIndex`)
- Special case: if `blackRingHolder === currentIndex` already → no-op; turn advances normally
- You **cannot win** while `blackRingHolder === currentIndex`

### Win Condition
`player.inventory.length === JEWELRY.length && blackRingHolder !== currentIndex`

### Turn Flow
```
1. Player taps Spin
   → set spinning = true

2. Spinner animates ~2.5s
   → lastSpin unchanged during animation

3. onSpinComplete(result: SpinOutcome) fires
   → apply result (jewel acquisition / black ring rules above)
   → set lastSpin = result
   → set spinning = false

4. Check win condition (using currentIndex BEFORE advancing)
   → if won: set phase = 'won', winner = currentIndex — STOP, do not advance turn

5. Advance turn
   → currentIndex = (currentIndex + 1) % players.length
```

**Important:** In ALL cases (jewel gained, jewel stolen, no-op, black ring received, black ring no-op) the turn advances to step 5 unless a win is detected at step 4.

---

## 4. Player Colors

Fixed by slot, auto-assigned at game start. No player choice.

| Slot | Hex | Emoji (inventory row) |
|------|-----|-----------------------|
| 0 | #f48fb1 | 🩷 |
| 1 | #ce93d8 | 💜 |
| 2 | #81d4fa | 💙 |

---

## 5. Spinner Component (`src/Spinner.tsx`)

### Props
```ts
interface SpinnerProps {
  onSpinComplete: (result: SpinOutcome) => void
  disabled: boolean   // set from GameState.spinning in parent
}
```

### Visual
- SVG circle (~260px), 6 equal wedges (60° each)
- Emoji label centered in each wedge
- Fixed triangular needle outside the top of the wheel, pointing downward into the rim — needle stays still, wheel rotates

### Wedge-to-outcome mapping
Wedge `i` (0-indexed, clockwise from 12 o'clock) = `SPIN_OUTCOMES[i]`:

| i | SpinOutcome | Emoji | Color |
|---|-------------|-------|-------|
| 0 | `crown` | 👑 | Rose pink |
| 1 | `ring` | 💍 | Lavender |
| 2 | `bracelet` | 💎 | Teal |
| 3 | `earrings` | 👂 | Gold |
| 4 | `necklace` | 📿 | Sky blue |
| 5 | `black_ring` | ⚫ | Black |

### Animation
- On spin: pick `result = SPIN_OUTCOMES[Math.floor(Math.random() * SPIN_OUTCOMES.length)]`
- Compute target angle: `wedgeIndex * 60 + 30` degrees (center of result wedge) + `N * 360` (N = 4–6 full rotations)
- Animate wheel rotation with CSS transition, ~2.5s ease-out
- Call `onSpinComplete(result)` after `transitionend`

---

## 6. State Ownership

`GameState` (including `spinning`) lives in `App.tsx`.  
`handleSpin(result: SpinOutcome)` defined in `App.tsx`, passed to `GameScreen` as prop, wired to `Spinner.onSpinComplete`.  
`spinning` is set to `true` when spin starts (before animation); set back to `false` inside `handleSpin`.

---

## 7. UI Layout

### SetupScreen
- Existing 2/3 player picker + name inputs (no changes)
- Colors auto-assigned — no UI needed

### GameScreen (top to bottom)
```
┌─────────────────────────┐
│   💜 Player 2's Turn     │  ← banner bg = PLAYER_COLORS[currentIndex]
├─────────────────────────┤
│      [SVG Spinner]       │  ← ~260px, disabled={game.spinning}
│         ▼ needle         │
├─────────────────────────┤
│   "Player 2 got 👑!"     │  ← result message (hidden when lastSpin null)
│      [ Spin! ✨ ]        │  ← disabled={game.spinning}
├─────────────────────────┤
│ 🩷 Alice    👑 💍 📿     │  ← PLAYER_EMOJIS[i] + name + jewel emojis
│ 💜 Bob ⚫   💎           │  ← ⚫ if blackRingHolder === i
│ 💙 Carol   📿 👂         │
└─────────────────────────┘
```

### WinScreen
- Crown celebration
- Winner name + their 5 jewelry pieces
- "Play Again" button → reset game

---

## 8. File Changes

| File | Change |
|------|--------|
| `src/types.ts` | Full rewrite per Section 2 |
| `src/spin.ts` | Removed — spin logic moved into `Spinner.tsx` |
| `src/Spinner.tsx` | **New** — SVG animated wheel |
| `src/GameScreen.tsx` | Integrate Spinner, ⚫ indicator, player colors/emojis |
| `src/App.tsx` | `handleSpin` + `spinning` state management |

---

## 9. Out of Scope

- Sound effects
- More than 3 players
- Persistent scores
- Animations beyond the spinner
- Player color selection
