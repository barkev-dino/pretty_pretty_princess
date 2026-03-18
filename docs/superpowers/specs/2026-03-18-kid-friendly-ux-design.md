# Kid Friendly UX and Celebration — Design Spec

**Jira:** KAN-5
**Date:** 2026-03-18
**Status:** Approved

---

## Goal

Make the win moment delightful and the touch experience snappy for kids on phones/tablets. Three focused improvements:

1. **Win confetti** — emoji particles rain down when the game is won
2. **Win sound** — triumphant audio jingle plays on win
3. **Touch UX polish** — eliminate tap delay and add active feedback on all buttons

---

## Feature 1: Win Confetti

### Where

`src/GameScreen.tsx` — rendered inside the win screen branch (`phase === 'won'`), overlaid on top of the win content.

### How

Render ~25 `<div>` particles with `position: fixed`, random `left` (0–100%), random animation `delay` (0–2s), random `duration` (2–4s), random `fontSize` (18–36px), random rotation. CSS `@keyframes confettiFall` moves each particle from `top: -10%` to `top: 110%` with a slight horizontal wobble (`translateX` sine-like alternation via separate `wobble` keyframe).

Since inline React styles don't support `@keyframes`, inject the CSS once via a `<style>` tag inside the component (a single `<style>` element rendered inside the JSX — valid in modern React + Vite).

```ts
const CONFETTI_EMOJIS = ['👑', '✨', '💍', '⭐', '🌟', '💫', '🎉', '🎊']
```

Generate 25 particles on mount (random values computed once, stored in a `useMemo` or just as a module-level constant since the win screen is only ever rendered once per game).

Each particle:
```tsx
<div style={{
  position: 'fixed',
  left: `${left}%`,
  top: '-10%',
  fontSize: `${size}px`,
  animation: `confettiFall ${duration}s ${delay}s linear infinite`,
  pointerEvents: 'none',
  zIndex: 200,
  userSelect: 'none',
}}>
  {emoji}
</div>
```

The keyframe:
```css
@keyframes confettiFall {
  0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(120vh) rotate(360deg); opacity: 0.3; }
}
```

### Particle generation

Generate once at module level (outside the component) — 25 particles with seeded random-enough values using `Math.random()` called once at load time. Because the win screen is only shown after a game ends and the page is not reloaded between games, this is fine — same confetti pattern every win, which is acceptable.

---

## Feature 2: Win Sound

### Where

`src/audio.ts` — new `playWinSound()` export.

`src/App.tsx` — call `playWinSound()` immediately when `phase === 'won'` is set (in `handleSpinComplete` and `handlePickAny` win paths).

### Sound design

A 6-note ascending fanfare using triangle wave oscillators (clean, bright, kid-friendly). Notes (in Hz): C5 (523), E5 (659), G5 (784), C6 (1047), E6 (1319), G6 (1568). Each note plays for 150ms with a 20ms gap, total ~1s. Each oscillator gets a short attack-release envelope (gain ramps from 0 → 0.4 in 10ms, sustains, then ramps to 0 in 50ms). All notes share the same AudioContext.

```ts
export function playWinSound() {
  const ctx = new AudioContext()
  const notes = [523, 659, 784, 1047, 1319, 1568]
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'triangle'
    osc.frequency.value = freq
    const start = ctx.currentTime + i * 0.17
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(0.4, start + 0.01)
    gain.gain.setValueAtTime(0.4, start + 0.13)
    gain.gain.linearRampToValueAtTime(0, start + 0.17)
    osc.start(start)
    osc.stop(start + 0.17)
  })
}
```

---

## Feature 3: Touch UX Polish

### Changes

**All interactive buttons** — add `touchAction: 'manipulation'` to every button's inline style. This eliminates the 300ms tap delay on mobile without requiring a viewport meta change or external library.

**Active feedback** — add `activeOpacity` via CSS `:active`. Since we use inline styles in React, add a global CSS rule to `src/index.css` (or `App.css` if it exists):

```css
button:active {
  opacity: 0.75;
  transform: scale(0.97);
}
```

This applies to all buttons game-wide and gives kids instant tactile feedback.

**Locations to add `touchAction: 'manipulation'`:**
- `SetupScreen.tsx`: player count buttons, character picker buttons, Start Game button, name inputs (for faster focus)
- `GameScreen.tsx`: Spin button, New Game link-button, modal jewel buttons, Play Again button
- `HandoffScreen.tsx`: the full-screen div and the "I'm ready!" button

---

## Files changed

| File | Change |
|------|--------|
| `src/audio.ts` | Add `playWinSound()` |
| `src/App.tsx` | Call `playWinSound()` on win in `handleSpinComplete` and `handlePickAny` |
| `src/GameScreen.tsx` | Add confetti overlay on win screen; add `touchAction` to buttons |
| `src/SetupScreen.tsx` | Add `touchAction` to buttons |
| `src/HandoffScreen.tsx` | Add `touchAction` to div and button |
| `src/index.css` | Add `button:active` rule |

---

## Done means

- Winning triggers confetti particles raining down and a 1-second fanfare
- All buttons respond immediately to touch (no 300ms delay)
- All buttons show a slight scale/opacity change on tap
- KAN-5 child tickets created in Jira and transitioned to Done
