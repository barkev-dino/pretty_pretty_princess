# KAN-19: Turn Handoff — In-Place Banner Animation

**Date:** 2026-03-18
**Status:** Ready for implementation
**Replaces:** `2026-03-18-turn-handoff-screen-design.md` (rejected: full-screen takeover)

---

## Problem

When the active player changes, the turn banner silently swaps from one name to another. Players sharing a device may miss the change and spin on the wrong turn. A clear "pass the phone" cue is needed — without hiding the game state.

**Constraint (hard):** The game screen must remain visible at all times. No full-screen takeover, no overlay, no blocking UI.

---

## Design

### Approach: React `key` re-mount + CSS animation

The turn banner in `GameScreen.tsx` receives `key={game.currentIndex}`. When `currentIndex` changes, React unmounts and remounts the banner element, which restarts its CSS animation from scratch. No new JS state, no `useEffect`, no `setTimeout`.

### Animation 1: `turnIn` (banner entry)

```css
@keyframes turnIn {
  0%   { opacity: 0.4; transform: translateY(-8px) scale(0.97); }
  60%  { transform: translateY(2px) scale(1.03); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
```

- Applied to: the turn banner `<div>` via inline `style.animation`
- Duration: `0.45s ease-out`
- Effect: banner slides in from slightly above with a subtle scale-up bounce, drawing the eye

### Animation 2: `passTextFade` (pass instruction)

```css
@keyframes passTextFade {
  0%   { opacity: 0; }
  15%  { opacity: 1; }
  65%  { opacity: 1; }
  100% { opacity: 0; }
}
```

- Applied to: a subtitle line inside the banner: `👋 Pass to [name]!`
- Duration: `2s linear`, `animation-fill-mode: forwards`
- Effect: the subtitle fades in quickly, holds, then fades out — leaving only "It's your turn!" visible after ~2 seconds
- The element is always in the DOM but ends at `opacity: 0` (via `fill-mode: forwards`), so it never shows outside the animation window

### Banner structure (after change)

```tsx
<div
  key={game.currentIndex}   {/* triggers re-mount on turn change */}
  style={{
    background: `linear-gradient(135deg, ${current.color}cc, ${current.color}88)`,
    borderRadius: 20, padding: '14px 24px', marginBottom: 12, color: '#fff',
    animation: 'turnIn 0.45s ease-out',
  }}
>
  <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 2, animation: 'passTextFade 2s linear forwards' }}>
    👋 Pass to {current.name}!
  </div>
  <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 4 }}>It's your turn!</div>
  <div style={{ fontSize: 26, fontWeight: 'bold' }}>{current.character.emoji} {current.name}</div>
</div>
```

---

## Scope

### Files changed

| File | Change |
|---|---|
| `src/GameScreen.tsx` | Add `@keyframes` to `<style>` block, add `key` + animation to banner, add pass-text subtitle |

### Files unchanged

`App.tsx`, `types.ts`, `audio.ts`, `spin.ts`, `SetupScreen.tsx`, `Spinner.tsx` — no changes.

---

## Where the `<style>` block lives

`WinScreen` already contains a `<style>` block for `confettiFall`. The two new keyframes go in a **second `<style>` block at the top of `GameScreen`** (outside `WinScreen`), so they are available whenever the game screen is mounted, not just on win.

```tsx
export default function GameScreen({ ... }: Props) {
  // ...
  return (
    <div style={{ textAlign: 'center' }}>
      <style>{`
        @keyframes turnIn {
          0%   { opacity: 0.4; transform: translateY(-8px) scale(0.97); }
          60%  { transform: translateY(2px) scale(1.03); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes passTextFade {
          0%   { opacity: 0; }
          15%  { opacity: 1; }
          65%  { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
      ...
    </div>
  )
}
```

---

## Behaviour summary

| Moment | What happens |
|---|---|
| Game starts (first turn) | Banner animates in — doubles as a "here's who goes first" signal |
| Turn advances | Banner re-mounts, `turnIn` plays, "Pass to X!" subtitle fades in then out |
| Same player again (edge case) | `key` unchanged → no animation re-trigger (correct) |
| Win screen shown | `GameScreen` returns early with `WinScreen`; banner not rendered |

---

## Not in scope

- Sound on turn change (existing spin sound already plays; no additional audio needed)
- Disabling the Spin button until the animation completes (too restrictive; fast players can tap through)
- Vibration / haptic (not available via web API on all devices)
- Any state in `App.tsx`

---

## Done criteria

- Turn banner animates visibly when `currentIndex` changes
- "Pass to [name]!" subtitle appears and self-dismisses without user interaction
- Game content (spinner, player rows, last spin result) remains fully visible during the transition
- No new JS state added
- `npm run build` passes
- `npm test` passes
