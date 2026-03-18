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
| Emoji | Name |
|-------|------|
| 👑 | Crown |
| 💍 | Ring |
| 📿 | Necklace |
| 👂 | Earrings |
| 💎 | Bracelet |

### Spinner Sections (6 equal wedges)
| Section | Color |
|---------|-------|
| 👑 Crown | Rose pink |
| 💍 Ring | Lavender |
| 📿 Necklace | Sky blue |
| 👂 Earrings | Gold |
| 💎 Bracelet | Teal |
| ⚫ Black Ring | Dark / black |

### Jewel Acquisition Rules
- If the spun jewel is in the central supply (no one holds it), the current player takes it.
- If the spun jewel is already held by **another player**, the current player **takes it from them**.
- If the current player already holds the spun jewel, nothing happens and the turn passes.

### Black Ring Rules
- Landing on ⚫ gives you the black ring, taken from wherever it currently is (supply or another player).
- If the **current player already holds** the black ring and spins ⚫ again, nothing happens and the turn passes normally.
- You **cannot win** while holding the black ring, even with all 5 jewels.
- The black ring is displayed visibly (⚫) next to the holder's name in the inventory list.

### Win Condition
Collect all 5 jewelry pieces **and** not be holding the black ring.

### Turn Flow
1. Current player taps **Spin**
2. Wheel animates ~2.5 seconds (4–6 full rotations + lands on result wedge)
3. Result is applied (see Jewel Acquisition Rules / Black Ring Rules above)
4. **Check win condition** — if current player holds all 5 jewels and does not hold the black ring, navigate to WinScreen immediately
5. Turn passes to next player

---

## 3. Player Colors

Fixed by slot, automatically assigned at game start:

| Slot | Color | Hex | Emoji |
|------|-------|-----|-------|
| Player 1 | Pink | #f48fb1 | 🩷 |
| Player 2 | Purple | #ce93d8 | 💜 |
| Player 3 | Blue | #81d4fa | 💙 |

Colors are defined as a `PLAYER_COLORS` constant in `src/types.ts`. Players cannot choose their color — it is determined by their slot index.

---

## 4. Spinner Component

### Visual
- SVG circle (~260px), 6 equal wedges (60° each)
- Emoji label centered in each wedge
- Fixed triangular needle mounted **outside** the top of the wheel, pointing **downward into the rim** — the needle does not move; the wheel rotates beneath it
- Whatever wedge edge the needle points to when the wheel stops = the result

### Wedge order (clockwise from 12 o'clock)
1. 👑 rose pink
2. 💍 lavender
3. 💎 teal
4. 👂 gold
5. 📿 sky blue
6. ⚫ black

### Animation
- Result pre-determined on tap (random, equally weighted across 6 sections)
- Wheel spins 4–6 full rotations + extra degrees to land on the result wedge's center
- Duration: ~2.5s, ease-out curve (`cubic-bezier(0.17, 0.67, 0.12, 0.99)`)
- Spin button disabled during animation
- Result message appears below the spinner after the wheel settles

---

## 5. State Ownership & Component Architecture

`GameState` lives in `App.tsx`. `handleSpin` is defined in `App.tsx` and passed as a prop to `GameScreen`. `GameScreen` passes it further to the `Spinner` component as `onSpinComplete(result: SpinResult)`.

### Types (`src/types.ts`)

```ts
export const JEWELRY = ['👑', '💍', '📿', '👂', '💎'] as const
export type JewelryId = typeof JEWELRY[number]

export const PLAYER_COLORS = ['#f48fb1', '#ce93d8', '#81d4fa'] as const
export const PLAYER_EMOJIS = ['🩷', '💜', '💙'] as const

export interface Player {
  name: string
  inventory: JewelryId[]
}

export interface GameState {
  players: Player[]
  currentIndex: number
  blackRingHolder: number | null   // player index, or null if in supply
  phase: 'playing' | 'won'
  winner: number | null
  lastSpin: string | null
}
```

---

## 6. UI Layout

### SetupScreen
- Keep existing 2/3 player picker + name inputs
- No color selection — colors are auto-assigned by slot index

### GameScreen (top to bottom)
```
┌─────────────────────────┐
│   💜 Player 2's Turn     │  ← turn banner in player's color
├─────────────────────────┤
│      [SVG Spinner]       │  ← centered, ~260px diameter
│         ▼ needle         │  ← fixed outside top, points into rim
├─────────────────────────┤
│   "Player 2 got 👑!"     │  ← result message
│      [ Spin! ✨ ]        │  ← disabled during spin
├─────────────────────────┤
│ 🩷 Alice    👑 💍 📿     │
│ 💜 Bob ⚫   💎           │  ← ⚫ shown next to name if holding black ring
│ 💙 Carol   📿 👂         │
└─────────────────────────┘
```

### WinScreen
- Crown celebration animation
- Winner's name + their 5 collected jewelry pieces displayed
- "Play Again" button

---

## 7. File Changes

| File | Change |
|------|--------|
| `src/types.ts` | Add `blackRingHolder`, `PLAYER_COLORS`, `PLAYER_EMOJIS`; update `GameState` |
| `src/spin.ts` | Return 6 equally-weighted outcomes including black ring |
| `src/Spinner.tsx` | **New** — SVG animated wheel component, accepts `onSpinComplete` callback |
| `src/GameScreen.tsx` | Integrate Spinner, show ⚫ indicator, apply player colors from constants |
| `src/App.tsx` | `handleSpin` applies jewel transfer + black ring transfer + win check |

---

## 8. Out of Scope

- Sound effects
- More than 3 players
- Persistent scores across sessions
- Animations beyond the spinner wheel
- Player color selection
