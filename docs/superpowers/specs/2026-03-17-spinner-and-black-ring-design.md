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

### Black Ring Rules
- Landing on ⚫ gives you the black ring
- If another player already holds it, it transfers to you
- You **cannot win** while holding the black ring, even with all 5 jewels
- The black ring is displayed visibly on the holder's inventory row

### Win Condition
Collect all 5 jewelry pieces **and** not be holding the black ring.

### Turn Flow
1. Current player taps **Spin**
2. Wheel animates ~2.5 seconds (4–6 full rotations + lands on result wedge)
3. Result is applied: gain jewel / receive black ring / already have it → nothing
4. Turn passes to next player

---

## 3. Player Colors

Automatically assigned at game start, max 3 players:

| Slot | Color | Emoji |
|------|-------|-------|
| Player 1 | Pink | 🩷 |
| Player 2 | Purple | 💜 |
| Player 3 | Blue | 💙 |

---

## 4. Spinner Component

### Visual
- SVG circle, 6 equal wedges (60° each)
- Emoji label centered in each wedge
- Fixed downward-pointing arrow/needle at top of wheel
- Wheel rotates; needle stays still

### Wedge order (clockwise from 12 o'clock)
1. 👑 rose pink
2. 💍 lavender
3. 💎 teal
4. 👂 gold
5. 📿 sky blue
6. ⚫ black

### Animation
- Result pre-determined on tap (random weighted equally across 6 sections)
- Wheel spins 4–6 full rotations + extra degrees to land on result wedge
- Duration: ~2.5s, ease-out curve
- Spin button disabled during animation
- Result message appears below spinner after settling

---

## 5. UI Layout

### SetupScreen
- Keep existing 2/3 player picker + name inputs
- Assign player colors automatically (pink → purple → blue)

### GameScreen (top to bottom)
```
┌─────────────────────────┐
│   💜 Player 2's Turn     │  ← turn banner in player's color
├─────────────────────────┤
│      [SVG Spinner]       │  ← centered, ~260px diameter
│         ▼ needle         │
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
- Same crown celebration as current
- Show winner's full jewelry collection
- "Play Again" button

---

## 6. File Changes

| File | Change |
|------|--------|
| `src/types.ts` | Add `blackRingHolder` to `GameState`, rename jewelry to match real names |
| `src/spin.ts` | Update to return 6 equally-weighted outcomes including black ring |
| `src/Spinner.tsx` | New component — SVG animated wheel |
| `src/GameScreen.tsx` | Integrate Spinner, show black ring indicator, player colors |
| `src/SetupScreen.tsx` | Assign player colors |
| `src/App.tsx` | Handle black ring transfer logic in `handleSpin` |

---

## 7. Out of Scope

- Sound effects
- More than 3 players
- Persistent scores across sessions
- Animations beyond the spinner wheel
