# Turn Handoff Banner Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Animate the turn banner in `GameScreen.tsx` so players get a clear "pass the phone" cue whenever the active player changes, without hiding the game.

**Architecture:** Add `key={game.currentIndex}` to the turn banner `<div>` so React re-mounts it on every turn change, triggering a CSS entry animation (`turnIn`) automatically. A second animation (`passTextFade`) fades in/out a "Pass to [name]!" subtitle inside the banner. Both keyframes live in a `<style>` block at the top of `GameScreen`'s render. No new JS state or effects needed.

**Tech Stack:** React 18, TypeScript 5, Vite, CSS `@keyframes` via JSX `<style>` tag

---

## File Map

| File | Change |
|---|---|
| `src/GameScreen.tsx` | Add `<style>` block with 2 keyframes, add `key` + `animation` to banner div, add pass-text subtitle div |

No other files change.

---

### Task 1: Add keyframe `<style>` block to `GameScreen`

**Files:**
- Modify: `src/GameScreen.tsx` (inside the `GameScreen` default export's return)

The `<style>` block goes as the **first child** inside the outermost `<div style={{ textAlign: 'center' }}>` of `GameScreen`'s return (line ~80). `WinScreen` already has a separate `<style>` block for `confettiFall` — these are different keyframes for a different component, so they stay separate.

- [ ] **Step 1: Add `<style>` block with both keyframes**

In `src/GameScreen.tsx`, inside `GameScreen`'s return `<div style={{ textAlign: 'center' }}>`, add as the first child:

```tsx
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/b/pretty_pretty_princess && npx tsc --noEmit
```

Expected: no errors.

---

### Task 2: Animate the turn banner

**Files:**
- Modify: `src/GameScreen.tsx` (the `{/* Turn banner */}` section, lines ~88-95)

The current banner:
```tsx
{/* Turn banner */}
<div style={{
  background: `linear-gradient(135deg, ${current.color}cc, ${current.color}88)`,
  borderRadius: 20, padding: '14px 24px', marginBottom: 12, color: '#fff',
}}>
  <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 4 }}>It's your turn!</div>
  <div style={{ fontSize: 26, fontWeight: 'bold' }}>{current.character.emoji} {current.name}</div>
</div>
```

Replace with:

```tsx
{/* Turn banner */}
<div
  key={game.currentIndex}
  style={{
    background: `linear-gradient(135deg, ${current.color}cc, ${current.color}88)`,
    borderRadius: 20, padding: '14px 24px', marginBottom: 12, color: '#fff',
    animation: 'turnIn 0.45s ease-out',
  }}
>
  <div style={{ fontSize: 13, marginBottom: 2, animation: 'passTextFade 2s linear forwards' }}>
    👋 Pass to {current.name}!
  </div>
  <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 4 }}>It's your turn!</div>
  <div style={{ fontSize: 26, fontWeight: 'bold' }}>{current.character.emoji} {current.name}</div>
</div>
```

Key changes:
- `key={game.currentIndex}` — forces re-mount on turn change, restarting the animation
- `animation: 'turnIn 0.45s ease-out'` — entry animation on the banner wrapper
- New pass-text subtitle div with `passTextFade 2s linear forwards` — fades in, holds, then fades to 0 and stays there (no static `opacity` on this div; the keyframe fully controls it)
- Removed `opacity: 0.9` from the pass-text div (the keyframe controls opacity); the existing "It's your turn!" div keeps its `opacity: 0.9`

- [ ] **Step 1: Make the replacement**

Apply the exact diff above to `src/GameScreen.tsx`.

- [ ] **Step 2: TypeScript check**

```bash
cd /Users/b/pretty_pretty_princess && npx tsc --noEmit
```

Expected: no errors. (`animation` is a valid `React.CSSProperties` key.)

- [ ] **Step 3: Run tests**

```bash
cd /Users/b/pretty_pretty_princess && npm test
```

Expected: 21 tests pass. (Tests cover pure game logic in `game.test.ts`; no new test needed for a CSS animation.)

- [ ] **Step 4: Build**

```bash
cd /Users/b/pretty_pretty_princess && npm run build
```

Expected: build succeeds, no TypeScript or Vite errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/b/pretty_pretty_princess
git add src/GameScreen.tsx
git commit -m "KAN-19 KAN-5 KAN-15 KAN-25 KAN-26 KAN-27 KAN-28 KAN-29 KAN-30 KAN-31 KAN-32 KAN-33 KAN-34 KAN-35: turn handoff banner animation — in-place pulse on turn change, no full-screen takeover"
git push
```

The extra issue keys (`KAN-5`, `KAN-15`, etc.) in the commit message are intentional: they act as a retroactive link for all issues whose original commits pre-date the GitHub for Jira integration setup, so they appear in those issues' development panels.

---

### Task 3: Update Jira

- [ ] **Step 1: Transition KAN-19 to Done**

Use Jira MCP: `transitionJiraIssue` for KAN-19 with transition ID `41` (Done) on cloudId `barkev.atlassian.net`.

- [ ] **Step 2: Add implementation comment to KAN-19**

Add a comment: "Implemented as in-place turn banner animation. `key={game.currentIndex}` on the banner div forces a React re-mount on turn change, triggering `@keyframes turnIn` (0.45s slide-in) and a 'Pass to [name]!' subtitle with `@keyframes passTextFade` (2s fade-in-hold-fade-out). No new JS state. Single file change: `src/GameScreen.tsx`."

- [ ] **Step 3: Transition KAN-4 epic to Done**

KAN-4 (Item Collection & Win Rules) has all children Done. Transition it with ID `41`.

- [ ] **Step 4: Transition KAN-2 epic to Done**

KAN-2 is the parent epic of KAN-19 (Turn Handoff). Now that KAN-19 is Done, transition KAN-2 with ID `41`.

- [ ] **Step 5: Transition KAN-3 epic to Done**

Transition KAN-3 with ID `41`. Add a comment noting all children are Done.
