# Player Identity Selection — Design Spec

**Jira:** KAN-15
**Date:** 2026-03-18
**Status:** Approved

---

## Goal

Let each player pick a character (emoji + color pair) during setup instead of being silently assigned a color by slot order. Characters are preset pairs — no separate color/emoji pickers — so the choice is fast and kid-friendly.

---

## Architecture

### New data

`CHARACTERS` constant in `src/types.ts` — 6 preset objects:

```ts
export const CHARACTERS = [
  { emoji: '👸', color: '#f06292' },
  { emoji: '🤴', color: '#ab47bc' },
  { emoji: '🦄', color: '#42a5f5' },
  { emoji: '🦊', color: '#ff7043' },
  { emoji: '🐱', color: '#66bb6a' },
  { emoji: '⭐', color: '#ffd54f' },
] as const
export type Character = typeof CHARACTERS[number]
```

`Player` interface gains one field:

```ts
export interface Player {
  name: string
  character: Character   // ← new
  color: string          // still kept (= character.color, set at init)
  inventory: JewelryId[]
  hasBlackRing: boolean
}
```

### SetupScreen changes

`onStart` callback signature changes from `(names: string[]) => void` to `(selections: { name: string; character: Character }[]) => void`.

After player count is selected, for each player slot render:
- A name input (existing)
- A row of 6 character buttons (emoji in a circle). Selected character gets a colored ring. Characters already chosen by another player are disabled/greyed.

Uniqueness: track `selectedChars: (Character | null)[]` in state. Initial value: `[null, null, null]` (length 3, matching the `names` array pattern — only slots `0..count-1` are active). When player A picks character X, it is removed from the available set for players B and C.

Default selection: when `handleCountSelect(n)` is called, set defaults for all `n` slots. For each slot `i` in `0..n-1`: if `selectedChars[i]` already holds a valid character that is not taken by a lower-index slot, keep it; otherwise assign the first `CHARACTERS` entry not already taken by slots `0..i-1`. For slots `i >= n`, set `selectedChars[i] = null` — this ensures out-of-range slots do not pollute the "taken" set, and that if count goes 3→2→3 the previously-set slot-2 value is wiped and re-defaulted, giving a predictable fresh default rather than silently re-using a stale choice.

### App.tsx changes

`initGame` accepts `{ name: string; character: Character }[]` instead of `string[]`. Player object is built with `character` and `color: character.color`.

`handleStart` passes the selections through.

The import line in `App.tsx` must be updated: remove `PLAYER_COLORS` from the import (it will no longer exist in `types.ts`). The updated import is:
```ts
import { GameState, JEWELRY, JewelryId, Player, Character } from './types'
```

### GameScreen changes

Player rows: replace the hardcoded color dot with the player's `character.emoji` (font size 18).

Turn banner: show `{current.character.emoji} {current.name}` instead of just the name.

Win screen: show `{winner.character.emoji}` instead of the hardcoded 👑.

`PLAYER_COLORS` in `types.ts` is no longer needed once characters carry colors — remove it.

---

## Component layout (SetupScreen character picker)

For each player slot, the character picker row appears **above** the name input (intentional — choose your character first, then name them):

```
[ 👸 ] [ 🤴 ] [ 🦄 ] [ 🦊 ] [ 🐱 ] [ ⭐ ]   ← 6 character buttons
  [_______Name input_______]
```

Selected button: border 3px solid `character.color`, background `character.color + '33'`.
Taken (by another player): opacity 0.3, pointer-events none.
Active: scale(1.15) on tap.

---

## Error handling

- `canStart` requires every slot has a non-empty name AND a selected character. Since characters are auto-defaulted, the Start button is enabled as soon as a name is typed.

---

## Testing

Manual:
1. Select 3 players — verify each slot defaults to a unique character.
2. Pick a character in slot 1 — verify it becomes unavailable in slots 2 and 3.
3. Start game — verify turn banner and player rows show correct emoji + color.
4. Win game — verify win screen shows winner's emoji.

---

## Done means

- Each player has a distinct emoji+color that they chose.
- The GameScreen visually reflects each player's chosen character throughout.
- `PLAYER_COLORS` constant is removed.
- KAN-15 is transitioned to Done in Jira with a comment linking the commit.
