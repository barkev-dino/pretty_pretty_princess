# Pretty Pretty Princess — Spinner & Black Ring Design

**Date:** 2026-03-17  
**Status:** Approved  
**Scope:** Animated SVG spinner, black ring mechanic, player colors

---

## 1. Goals

Make the game as close to the physical Pretty Pretty Princess board game as possible, with a visually satisfying animated spinner that kids will enjoy watching spin. Prototype quality — no external dependencies, keep it lightweight.

---

## 2. Game Rules

### Jewelry Pieces (5)
| Emoji | Name | JewelryId |
|-------|------|-----------|
| 👑 | Crown | `crown` |
| 💍 | Ring | `ring` |
| 📿 | Necklace | `necklace` |
| 👂 | Earrings | `earrings` |
| 💎 | Bracelet | `bracelet` |

### Spinner Sections (6 equal wedges)
The spinner has 6 equally-weighted outcomes:

| SpinOutcome | Display | Wedge Color |
|-------------|---------|-------------|
| `crown` | 👑 | Rose pink |
| `ring` | 💍 | Lavender |
| `necklace` | 📿 | Sky blue |
| `earrings` | 👂 | Gold |
| `bracelet` | 💎 | Teal |
| `black_ring` | ⚫ | Black |

```ts
export type JewelryId = 'crown' | 'ring' | 'necklace' | 'earrings' | 'bracelet'
export type SpinOutcome = JewelryId | 'black_ring'
export const JEWELRY: JewelryId[] = ['crown', 'ring', 'necklace', 'earrings', 'bracelet']
export const SPIN_OUTCOMES: SpinOutcome[] = [...JEWELRY, 'black_ring']
```

### Jewel Acquisition Rules
- If the spun jewel is in the central supply (no one holds it), the current player takes it.
- If the spun jewel is already held by **another player**, the current player **takes it from them**.
- If the current player already holds the spun jewel, nothing happens and the turn passes.

### Black Ring Rules
- Landing on `black_ring` gives you the black ring, taken from wherever it currently is (supply or another player).
- If the **current player already holds** the black ring and spins `black_ring` again, nothing happens and the turn passes normally.
- You **cannot win** while holding the black ring, even with all 5 jewels.
- The black ring is displayed visibly (⚫) next to the holder's name in the inventory list.

### Win Condition
Current player holds all 5 `JewelryId` pieces AND `blackRingHolder !== currentIndex`.

### Turn Flow
1. Current player taps **Spin**
2. Wheel animates ~2.5 seconds (4–6 full rotations + lands on result wedge); `lastSpin` remains unchanged until animation completes
3. `onSpinComplete(result: SpinOutcome)` fires — result applied (see rules above); `lastSpin` updated
4. **Check win condition** — if current player holds all 5 jewels and `blackRingHolder !== currentIndex`, navigate to WinScreen immediately
5. Turn passes to next player

---

## 3. Player Colors

Fixed by slot, automatically assigned at game start. Defined as constants in `src/types.ts`. Players cannot choose their color.

| Slot | Color | Hex | Emoji |
|------|-------|-----|-------|
| Player 1 | Pink | #f48fb1 | 🩷 |
| Player 2 | Purple | #ce93d8 | 💜 |
| Player 3 | Blue | #81d4fa | 💙 |

`PLAYER_EMOJIS` is used in the **inventory rows** in `GameScreen` — displayed next to each player's name. `PLAYER_COLORS` is used for the turn banner background.

---

## 4. Spinner Component (`src/Spinner.tsx`)

### Props
```ts
interface SpinnerProps {
  onSpinComplete: (result: SpinOutcome) => void
  disabled: boolean
}
```

### Visual
- SVG circle (~260px), 6 equal wedges (60° each)
- Emoji label centered in each wedge
- Fixed triangular needle mounted **outside** the top of the wheel, pointing **downward into the rim** — needle does not move; wheel rotates beneath it
- Whatever wedge the needle points to when the wheel stops = the result

### Wedge order (clockwise from 12 o'clock)
1. 👑 `crown` — rose pink
2. 💍 `ring` — lavender
3. 💎 `bracelet` — teal
4. 👂 `earrings` — gold
5. 📿 `necklace` — sky blue
6. ⚫ `black_ring` — black

### Animation
- On spin: pre-determine `result: SpinOutcome` immediately (random, equally weighted across `SPIN_OUTCOMES`)
- Rotate wheel: 4–6 full rotations + extra degrees to land on result wedge's center
- Duration: ~2.5s, ease-out (`cubic-bezier(0.17, 0.67, 0.12, 0.99)`)
- Call `onSpinComplete(result)` after animation settles
- Spinner is internally disabled during animation; also respects `disabled` prop

---

## 5. State Ownership & Types

`GameState` lives in `App.tsx`. `handleSpin(result: SpinOutcome)` is defined in `App.tsx` and passed as prop to `GameScreen`, which wires it to the `Spinner`'s `onSpinComplete`.

### Types (`src/types.ts`)

```ts
export type JewelryId = 'crown' | 'ring' | 'necklace' | 'earrings' | 'bracelet'
export type SpinOutcome = JewelryId | 'black_ring'
export const JEWELRY: JewelryId[] = ['crown', 'ring', 'necklace', 'earrings', 'bracelet']
export const SPIN_OUTCOMES: SpinOutcome[] = [...JEWELRY, 'black_ring']

export const PLAYER_COLORS = ['#f48fb1', '#ce93d8', '#81d4fa'] as const
export const PLAYER_EMOJIS = ['🩷', '💜', '💙'] as const

export const JEWELRY_EMOJI: Record<JewelryId, string> = {
  crown: '👑', ring: '💍', necklace: '📿', earrings: '👂', bracelet: '💎'
}

export interface Player {
  name: string
  inventory: JewelryId[]
}

export interface GameState {
  players: Player[]
  currentIndex: number
  blackRingHolder: number | null   // player index, or null = supply
  phase: 'playing' | 'won'
  winner: number | null
  lastSpin: SpinOutcome | null
}
```

### Initial GameState
```ts
{
  players,           // from SetupScreen
  currentIndex: 0,
  blackRingHolder: null,
  phase: 'playing',
  winner: null,
  lastSpin: null,
}
```

---

## 6. UI Layout

### SetupScreen
- Keep existing 2/3 player picker + name inputs
- No color selection — auto-assigned by slot index

### GameScreen (top to bottom)
```
┌─────────────────────────┐
│   💜 Player 2's Turn     │  ← turn banner in PLAYER_COLORS[currentIndex]
├─────────────────────────┤
│      [SVG Spinner]       │  ← centered, ~260px
│         ▼ needle         │  ← fixed outside top, points into rim
├─────────────────────────┤
│   "Player 2 got 👑!"     │  ← result message (from lastSpin, null = hidden)
│      [ Spin! ✨ ]        │  ← disabled while spinning
├─────────────────────────┤
│ 🩷 Alice    👑 💍 📿     │  ← PLAYER_EMOJIS[i] + name + jewels
│ 💜 Bob ⚫   💎           │  ← ⚫ shown next to name if blackRingHolder === i
│ 💙 Carol   📿 👂         │
└─────────────────────────┘
```

### WinScreen
- Crown celebration
- Winner's name + their 5 collected jewelry pieces (emoji)
- "Play Again" button

---

## 7. File Changes

| File | Change |
|------|--------|
| `src/types.ts` | Full rewrite with new types above |
| `src/spin.ts` | Return random `SpinOutcome` equally weighted across `SPIN_OUTCOMES` |
| `src/Spinner.tsx` | **New** — SVG animated wheel, `onSpinComplete: (result: SpinOutcome) => void` |
| `src/GameScreen.tsx` | Integrate Spinner, ⚫ indicator, player colors/emojis from constants |
| `src/App.tsx` | `handleSpin(result)` applies jewel/black ring transfer + win check |

---

## 8. Out of Scope

- Sound effects
- More than 3 players
- Persistent scores across sessions
- Animations beyond the spinner wheel
- Player color selection
