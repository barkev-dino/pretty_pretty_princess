# Turn Handoff Screen — Design Spec

**Jira:** KAN-19
**Date:** 2026-03-18
**Status:** Approved

---

## Goal

After each turn completes, show a full-screen interstitial asking the current player to pass the device to the next player. Only after they tap "I'm ready!" does the game screen for the next turn appear. This prevents players from seeing each other's jewel collections between turns.

---

## When to show

Show the handoff screen after **every** turn advance — after:
- A jewel is collected
- A jewel is lost (putBackRandom or putBackChoice)
- The black ring is received
- A duplicate jewel was spun (already has it — no change, turn still advances)
- Pick Any modal is completed
- You Choose modal is completed

Do **not** show it:
- When the game is won (go straight to win screen)
- At the very start (first turn, no previous player)

---

## Architecture

### New state in App.tsx

```ts
const [handoffPending, setHandoffPending] = useState(false)
const [handoffTo, setHandoffTo] = useState<{ name: string; character: Character } | null>(null)
```

### Where handoff is triggered

Every place that advances the turn should set `handoffPending = true` and capture the upcoming player.

Helper — call only when `game` is confirmed non-null:

```ts
function triggerHandoff(nextGame: GameState) {
  const next = nextGame.players[nextGame.currentIndex]
  setHandoffTo({ name: next.name, character: next.character })
  setHandoffPending(true)
}
```

**IMPORTANT:** `triggerHandoff` must be called **outside** any `setGame` updater function. React updater functions must be pure (no side effects); calling other state setters inside them causes double-fires in Strict Mode. Always call `setGame(nextState)` first, then call `triggerHandoff(nextState)` separately in the same event handler.

Replace the direct `setGame(...)` + `setIsSpinning(false)` calls in:
- `advanceTurn` — after setting the next game state
- `handleSpinComplete` — **only on the non-win return path** (when the resulting `phase` is `'playing'`). The win-path inside `handleSpinComplete`'s `setGame` block returns `phase: 'won'` — no handoff there.
- `handlePickAny` — after jewel collected and turn advanced (non-win path only)
- `handlePutBackChoice` — after jewel returned and turn advanced

**Win path** — no handoff: when `phase === 'won'`, call `setGame(nextState)` directly without triggering handoff.

**Wrap-around** — normal case: when the last player's turn ends and the next player is player 0, the handoff screen always appears. Wrap-around is treated identically to any other turn advance.

### Dismissal

New handler:
```ts
function handleHandoffDone() {
  setHandoffPending(false)
  setHandoffTo(null)
}
```

### Render in App.tsx

```tsx
if (handoffPending && handoffTo) {
  return <HandoffScreen player={handoffTo} onReady={handleHandoffDone} />
}
```

This check goes **after** the `if (!game)` check (setup) and **before** the `<GameScreen>` render.

### HandoffScreen component (new file: src/HandoffScreen.tsx)

Props — use the `Character` type from `src/types.ts`:
```ts
import { Character } from './types'

interface Props {
  player: { name: string; character: Character }
  onReady: () => void
}
```

Layout (full viewport, centered):
```
[large emoji — player's character]
"Pass the phone to"
[Player Name]  ← in player's color
[I'm ready! button]
```

The entire screen is also tappable (clicking anywhere = ready), as well as the explicit button, for ease with kids.

Style: same pastel gradient background as the rest of the game. Player color used for name text and button border/accent. Big font sizes.

---

## Data flow

```
turn completes
  ↓
setGame(nextState)       ← update game state first
triggerHandoff(nextState) ← then show handoff for upcoming player
  ↓
HandoffScreen renders (App.tsx gates on handoffPending)
  ↓
player taps anywhere / "I'm ready!"
  ↓
handleHandoffDone() → handoffPending = false
  ↓
GameScreen renders for new current player
```

---

## Edge case: advanceTurn refactor

`advanceTurn` currently calls `setGame` with a functional updater. Since we cannot call side-effecting state setters inside an updater, switch to a direct set using the current `game` snapshot (which is safe — `advanceTurn` is always called from an event handler, never from render):

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

The same pattern applies to the non-win path in `handleSpinComplete`: compute the full `nextGame` object, call `setGame(nextGame)`, then `triggerHandoff(nextGame)`, then `setIsSpinning(false)` — all outside the updater.

---

## Done means

- After every non-win turn advance, the handoff screen appears before the next player's game view
- The screen shows the next player's character emoji and name
- Tapping anywhere (or the button) dismisses it
- Win screen is never gated behind a handoff
