# Traceability DAG Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a self-contained HTML traceability tool that shows KAN-23 features as a clickable DAG with SE review gate badges, generates HTML review packages per gate, and provides a live audit checklist.

**Architecture:** Single HTML file (`docs/architecture/kan23-traceability.html`) with an embedded `PROJECT_DATA` config block, a pure-JS rendering engine, and Mermaid.js via CDN. No build step, no server — open directly in a browser. All project-specific data lives in `PROJECT_DATA`; the engine is generic.

**Tech Stack:** Vanilla HTML/CSS/JS, Mermaid.js 10 (CDN), no frameworks, no bundler.

**Jira:** KAN-41

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `docs/architecture/` | New directory for living architecture docs |
| Create | `docs/architecture/kan23-traceability.html` | Full traceability tool — data + engine + layout |

No other files are created or modified.

---

## Task 1: Scaffold + PROJECT_DATA

**Files:**
- Create: `docs/architecture/kan23-traceability.html`

### What we're building
The full `PROJECT_DATA` config for KAN-23 (all 8 features with real file paths, line numbers, commit hashes, Mermaid diagrams), plus the HTML/CSS skeleton. No JS engine yet — just the data and layout shell.

- [ ] **Step 1.1: Create the directory**

```bash
mkdir -p docs/architecture
```

- [ ] **Step 1.2: Create the file with PROJECT_DATA and skeleton**

Create `docs/architecture/kan23-traceability.html` with this exact content:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>KAN-23 · Traceability Map</title>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
<style>
/* ── Reset ── */
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #0f1117; color: #e2e8f0;
  height: 100vh; display: flex; flex-direction: column; overflow: hidden;
}
/* ── Topbar ── */
.topbar {
  padding: 10px 20px; border-bottom: 1px solid #1e2433;
  display: flex; align-items: center; gap: 12px; flex-shrink: 0; flex-wrap: wrap;
}
.topbar-title { flex: 1; min-width: 200px; }
.topbar-title h1 { font-size: 15px; font-weight: 700; color: #fff; }
.topbar-title p  { font-size: 12px; color: #475569; margin-top: 2px; }
.badge-epic {
  background: #1e3a5f; border: 1px solid #3b82f6;
  border-radius: 6px; padding: 2px 10px; font-size: 12px; color: #93c5fd;
}
/* Gate package buttons */
.gate-btn {
  border: 1px solid; border-radius: 6px; padding: 4px 12px;
  font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap;
}
.gate-btn:hover { opacity: 0.8; }
.gate-btn.SRR { background: #1a1f2e; border-color: #475569; color: #94a3b8; }
.gate-btn.PDR { background: #1e3a5f; border-color: #3b82f6; color: #93c5fd; }
.gate-btn.CDR { background: #2d1f0a; border-color: #f97316; color: #fdba74; }
.gate-btn.TRR { background: #2d2a0a; border-color: #eab308; color: #fde047; }
.gate-btn.PRR { background: #0a2d1a; border-color: #22c55e; color: #86efac; }
.audit-btn {
  background: #1e2433; border: 1px solid #374151; color: #94a3b8;
  border-radius: 6px; padding: 4px 12px; font-size: 12px; cursor: pointer;
}
.audit-btn:hover { border-color: #60a5fa; color: #93c5fd; }
/* ── Layout ── */
.layout { display: flex; flex: 1; overflow: hidden; }
.left {
  width: 50%; border-right: 1px solid #1e2433;
  display: flex; flex-direction: column; overflow: hidden;
}
.left-header { padding: 10px 18px; font-size: 11px; color: #475569; border-bottom: 1px solid #1e2433; flex-shrink: 0; }
.dag-wrap { flex: 1; overflow: auto; padding: 20px; display: flex; justify-content: center; }
.right { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
/* ── Placeholder ── */
.placeholder { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #334155; gap: 8px; }
.placeholder .arrow { font-size: 36px; }
/* ── Detail panel ── */
.detail { display: none; flex-direction: column; height: 100%; overflow: hidden; }
.detail.visible { display: flex; }
.detail-header { padding: 14px 18px 10px; border-bottom: 1px solid #1e2433; flex-shrink: 0; }
.detail-header h2 { font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 4px; }
.detail-header p  { font-size: 12px; color: #64748b; line-height: 1.5; }
.detail-body { flex: 1; overflow-y: auto; padding: 14px 18px; display: flex; flex-direction: column; gap: 14px; }
.section-label { font-size: 10px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 6px; }
/* Diagram box */
.diagram-box { background: #1e2433; border: 1px solid #2d3748; border-radius: 8px; padding: 14px; overflow-x: auto; min-height: 60px; }
.diagram-box svg { max-width: 100%; height: auto; }
.dim-placeholder { font-size: 12px; color: #374151; font-style: italic; padding: 8px 0; }
/* File cards */
.file-cards { display: flex; flex-direction: column; gap: 6px; }
.file-card { background: #1a1f2e; border: 1px solid #2d3748; border-radius: 7px; padding: 8px 12px; display: flex; align-items: center; gap: 8px; }
.file-card:hover { border-color: #3b82f6; }
.type-badge { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; flex-shrink: 0; }
.type-badge.impl { background: #1e3a5f; color: #60a5fa; }
.type-badge.test { background: #1a3a2a; color: #34d399; }
.type-badge.doc  { background: #2d1a3a; color: #c084fc; }
.file-info { flex: 1; min-width: 0; }
.file-info .path { font-size: 12px; font-family: monospace; color: #e2e8f0; }
.file-info .desc { font-size: 11px; color: #64748b; margin-top: 1px; }
.file-links { display: flex; gap: 5px; flex-shrink: 0; }
.btn-main   { background: #1e3a5f; border: 1px solid #3b82f6; color: #93c5fd; border-radius: 5px; padding: 3px 9px; font-size: 11px; text-decoration: none; white-space: nowrap; }
.btn-commit { background: #1a1f2e; border: 1px solid #374151; color: #64748b; border-radius: 5px; padding: 3px 7px; font-size: 11px; text-decoration: none; font-family: monospace; white-space: nowrap; }
.btn-main:hover   { background: #1e4a7f; }
.btn-commit:hover { border-color: #60a5fa; color: #93c5fd; }
.jira-link { display: inline-flex; align-items: center; gap: 6px; background: #1e2433; border: 1px solid #2d3748; border-radius: 6px; padding: 6px 12px; font-size: 12px; color: #60a5fa; text-decoration: none; }
.jira-link:hover { border-color: #3b82f6; }
/* ── Gate badge inline ── */
.gate-badge {
  display: inline-block; font-size: 10px; font-weight: 700;
  padding: 1px 7px; border-radius: 4px; border: 1px solid;
}
/* ── Audit modal ── */
.modal-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 100; align-items: center; justify-content: center; }
.modal-overlay.open { display: flex; }
.modal { background: #141820; border: 1px solid #2d3748; border-radius: 12px; padding: 20px; max-width: 90vw; max-height: 85vh; overflow: auto; min-width: 600px; }
.modal h2 { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
.modal .subtitle { font-size: 12px; color: #475569; margin-bottom: 16px; }
.audit-grid { border-collapse: collapse; width: 100%; font-size: 11px; }
.audit-grid th { padding: 6px 10px; text-align: center; color: #475569; font-weight: 600; text-transform: uppercase; font-size: 10px; border-bottom: 1px solid #1e2433; }
.audit-grid th.feature-col { text-align: left; }
.audit-grid td { padding: 5px 8px; text-align: center; border-bottom: 1px solid #1a1f2e; }
.audit-grid td.feature-name { text-align: left; font-size: 12px; color: #e2e8f0; white-space: nowrap; padding-right: 16px; }
.audit-cell { cursor: pointer; border-radius: 4px; padding: 3px 8px; font-size: 13px; user-select: none; }
.audit-cell:hover { opacity: 0.8; }
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
.btn-confirm { background: #22c55e; color: #000; border: none; border-radius: 6px; padding: 6px 20px; font-size: 13px; font-weight: 700; cursor: pointer; }
.btn-cancel  { background: #1e2433; color: #94a3b8; border: 1px solid #374151; border-radius: 6px; padding: 6px 16px; font-size: 13px; cursor: pointer; }
</style>
</head>
<body>

<!-- ═══════════════════════════════════════════════════
     PROJECT DATA — replace this block for a new project
     ═══════════════════════════════════════════════════ -->
<script>
const PROJECT_DATA = {
  project: {
    name: 'Pretty Pretty Princess',
    jiraUrl: 'https://barkev.atlassian.net/browse/',
    repo: 'https://github.com/barkev-dino/pretty_pretty_princess',
    branch: 'main',
  },

  epics: [
    {
      id: 'KAN-23',
      title: 'Core Game Mechanics & Spinner',
      featureIds: ['kan25','kan26','kan27','kan28','kan29','kan30','kan31','kan32'],
    }
  ],

  gateRequirements: {
    SRR: ['jira'],
    PDR: ['jira', 'spec'],
    CDR: ['jira', 'spec', 'plan', 'architecture'],
    TRR: ['jira', 'spec', 'plan', 'architecture', 'impl'],
    PRR: ['jira', 'spec', 'plan', 'architecture', 'impl', 'tests', 'audit'],
  },

  features: {
    kan25: {
      title: 'KAN-25 · Animated SVG Spinner',
      desc: 'SVG pie wheel with 9 equal 40° slices. CSS transform rotation with cubic-bezier easing for fast-burst then suspenseful-crawl. Fixed red needle. Fires onSpinComplete after 2.5s transition.',
      diagram: `flowchart LR
  A["handleSpinStart()\nApp.tsx:28"] -->|"setSpinTrigger(t+1)"| B["&lt;Spinner&gt;\nSpinner.tsx:28"]
  B -->|"watches spinTrigger\nuseEffect:33"| C["animate 2.5s\ncubic-bezier\nSpinner.tsx:56"]
  C -->|"transitionend\n→ onSpinComplete()"| D["handleSpinComplete()\nApp.tsx:37"]`,
      artifacts: {
        jira: 'KAN-25',
        spec: 'docs/superpowers/specs/2026-03-17-spinner-and-black-ring-design.md',
        plan: 'docs/superpowers/plans/2026-03-17-spinner-and-black-ring.md',
        architecture: true,
        impl: [
          { file: 'src/Spinner.tsx', lines: '1-76',  commit: '596345b', desc: 'Full spinner component — SVG slices, needle, animation' },
          { file: 'src/App.tsx',     lines: '28-35', commit: '596345b', desc: 'handleSpinStart — triggers spin, plays sound' },
        ],
        tests: [
          { file: 'src/game.test.ts', lines: '69-90', commit: '596345b', desc: 'SPINNER_SECTIONS shape and coverage tests' },
        ],
        audit: null,
      }
    },

    kan26: {
      title: 'KAN-26 · 9 Slice Action Definitions',
      desc: 'SPINNER_SECTIONS array defines 9 equal slices: 5 jewels, black ring, pick any, you choose, random loss. randomSection() picks a weighted-random index.',
      diagram: `flowchart LR
  A["SPINNER_SECTIONS[]\nspin.ts:16"] -->|"randomSection()\nspin.ts:28"| B["sectionIndex\nApp.tsx:30"]
  B -->|"stored in\npendingSection"| C["handleSpinComplete()\nApp.tsx:39"]
  A -->|"section.action\nsection.jewel"| C`,
      artifacts: {
        jira: 'KAN-26',
        spec: 'docs/superpowers/specs/2026-03-17-spinner-and-black-ring-design.md',
        plan: 'docs/superpowers/plans/2026-03-17-spinner-and-black-ring.md',
        architecture: true,
        impl: [
          { file: 'src/spin.ts', lines: '16-30', commit: '9ee9744', desc: 'SPINNER_SECTIONS array + randomSection()' },
          { file: 'src/App.tsx', lines: '39-40',  commit: '9ee9744', desc: 'Action resolution — SPINNER_SECTIONS[pendingSection]' },
        ],
        tests: [
          { file: 'src/game.test.ts', lines: '69-100', commit: '9ee9744', desc: '9 slice definitions, jewel coverage, uniqueness' },
        ],
        audit: null,
      }
    },

    kan27: {
      title: 'KAN-27 · Black Ring Mechanic',
      desc: 'Landing on Black Ring clears hasBlackRing from all players and sets it on the current player. A player holding the black ring cannot win even with all 5 jewels.',
      diagram: `flowchart LR
  A["section.action\n=== blackRing\nApp.tsx:61"] -->|"clear all"| B["players.forEach\np.hasBlackRing=false\nApp.tsx:63"]
  B -->|"set current"| C["current.hasBlackRing\n= true\nApp.tsx:64"]
  C -->|"blocks win\ncheck L84"| D["!hasBlackRing\nguard\nApp.tsx:84"]
  D --> E["⚫ indicator\nGameScreen.tsx:178"]`,
      artifacts: {
        jira: 'KAN-27',
        spec: 'docs/superpowers/specs/2026-03-17-spinner-and-black-ring-design.md',
        plan: 'docs/superpowers/plans/2026-03-17-spinner-and-black-ring.md',
        architecture: true,
        impl: [
          { file: 'src/App.tsx',       lines: '61-65', commit: '596345b', desc: 'Black ring state mutation' },
          { file: 'src/App.tsx',       lines: '84',    commit: '596345b', desc: 'Win check — !hasBlackRing guard' },
          { file: 'src/GameScreen.tsx', lines: '178',  commit: '596345b', desc: '⚫ indicator on player row' },
        ],
        tests: [
          { file: 'src/game.test.ts', lines: '95-134', commit: '596345b', desc: 'Black ring blocks win, transfers correctly' },
        ],
        audit: null,
      }
    },

    kan28: {
      title: 'KAN-28 · Pick Any Modal',
      desc: 'Landing on Pick Any shows a modal with missing jewels. Player selects one → added to inventory → win check runs. If already complete, turn auto-advances.',
      diagram: `flowchart TD
  A["section.action\n=== pickAny\nApp.tsx:41"] -->|"missing.length === 0"| B["advanceTurn()\nApp.tsx:45"]
  A -->|"has missing jewels\nsetPickAnyPending(true)"| C["PickAny Modal\nGameScreen.tsx"]
  C -->|"onPickAny(jewel)"| D["handlePickAny()\nApp.tsx:95"]
  D -->|"push jewel L100"| E["checkWin\nApp.tsx:102"]
  E -->|"5 jewels &&\n!blackRing"| F["phase='won'\nApp.tsx:104"]
  E -->|"game continues"| G["advanceTurn\nApp.tsx:108"]`,
      artifacts: {
        jira: 'KAN-28',
        spec: 'docs/superpowers/specs/2026-03-17-spinner-and-black-ring-design.md',
        plan: 'docs/superpowers/plans/2026-03-17-spinner-and-black-ring.md',
        architecture: true,
        impl: [
          { file: 'src/App.tsx',       lines: '41-48',  commit: '9ee9744', desc: 'pickAny branch in handleSpinComplete' },
          { file: 'src/App.tsx',       lines: '95-111', commit: '9ee9744', desc: 'handlePickAny — add jewel, win check, advance' },
          { file: 'src/GameScreen.tsx', lines: '80-130', commit: '9ee9744', desc: 'Pick Any modal UI — missing jewel buttons' },
        ],
        tests: [
          { file: 'src/game.test.ts', lines: '69-90', commit: '9ee9744', desc: 'Jewel section coverage (Pick Any preconditions)' },
        ],
        audit: null,
      }
    },

    kan29: {
      title: 'KAN-29 · You Choose — Put Back Modal',
      desc: 'Landing on You Choose shows a modal of collected jewels. Player selects one → removed from inventory → turn advances. If nothing to return, auto-advances.',
      diagram: `flowchart TD
  A["section.action\n=== putBackChoice\nApp.tsx:50"] -->|"inventory.length === 0"| B["advanceTurn()\nApp.tsx:52"]
  A -->|"has jewels\nsetPutBackChoicePending(true)"| C["You Choose Modal\nGameScreen.tsx"]
  C -->|"onPutBackChoice(jewel)"| D["handlePutBackChoice()\nApp.tsx:113"]
  D -->|"filter out jewel L118"| E["advanceTurn\nApp.tsx:120"]`,
      artifacts: {
        jira: 'KAN-29',
        spec: 'docs/superpowers/specs/2026-03-17-spinner-and-black-ring-design.md',
        plan: 'docs/superpowers/plans/2026-03-17-spinner-and-black-ring.md',
        architecture: true,
        impl: [
          { file: 'src/App.tsx',       lines: '50-55',   commit: '9ee9744', desc: 'putBackChoice branch in handleSpinComplete' },
          { file: 'src/App.tsx',       lines: '113-123', commit: '9ee9744', desc: 'handlePutBackChoice — remove jewel, advance' },
          { file: 'src/GameScreen.tsx', lines: '130-165', commit: '9ee9744', desc: 'You Choose modal UI — inventory buttons' },
        ],
        tests: [
          { file: 'src/game.test.ts', lines: '69-90', commit: '9ee9744', desc: 'Jewel uniqueness tests (put-back preconditions)' },
        ],
        audit: null,
      }
    },

    kan30: {
      title: 'KAN-30 · Random Loss Mechanic',
      desc: "Landing on Random Loss removes a random jewel from the current player's inventory via splice. If the player has nothing, turn advances with a message.",
      diagram: `flowchart LR
  A["section.action\n=== putBackRandom\nApp.tsx:66"] -->|"inventory.length === 0"| B["no-op message\nApp.tsx:68"]
  A -->|"has jewels"| C["splice random\nidx = rand*len\nApp.tsx:70"]
  C -->|"lastSpin = lost msg"| D["advanceTurn\nApp.tsx:91"]`,
      artifacts: {
        jira: 'KAN-30',
        spec: 'docs/superpowers/specs/2026-03-17-spinner-and-black-ring-design.md',
        plan: 'docs/superpowers/plans/2026-03-17-spinner-and-black-ring.md',
        architecture: true,
        impl: [
          { file: 'src/App.tsx', lines: '66-73', commit: '9ee9744', desc: 'putBackRandom — random splice from inventory' },
        ],
        tests: [
          { file: 'src/game.test.ts', lines: '69-90', commit: '9ee9744', desc: 'Jewel count tests (random loss preconditions)' },
        ],
        audit: null,
      }
    },

    kan31: {
      title: 'KAN-31 · Win Detection & Win Screen',
      desc: "After every jewel gain, checks if current player has all 5 jewels AND does not hold the black ring. Sets phase='won'. WinScreen shows player name, emoji, jewels, Play Again button.",
      diagram: `flowchart TD
  A["After jewel change\nApp.tsx:84"] -->|"inventory.length === 5\n&& !hasBlackRing"| B["phase='won'\nwinner=currentIndex\nApp.tsx:86"]
  B -->|"phase === 'won'\nGameScreen.tsx:72"| C["&lt;WinScreen&gt;\nGameScreen.tsx:22"]
  C --> D["emoji, name, jewels\nL54-57"]
  C -->|"Play Again"| E["handleNewGame()\nApp.tsx:132"]`,
      artifacts: {
        jira: 'KAN-31',
        spec: 'docs/superpowers/specs/2026-03-17-spinner-and-black-ring-design.md',
        plan: 'docs/superpowers/plans/2026-03-17-spinner-and-black-ring.md',
        architecture: true,
        impl: [
          { file: 'src/App.tsx',       lines: '84-89',  commit: 'b386a41', desc: 'Win condition check — 5 jewels + no black ring' },
          { file: 'src/GameScreen.tsx', lines: '22-74', commit: 'b386a41', desc: 'WinScreen component + phase routing' },
          { file: 'src/App.tsx',       lines: '132-135', commit: 'b386a41', desc: 'handleNewGame — full reset' },
        ],
        tests: [
          { file: 'src/game.test.ts', lines: '9-17', commit: 'b386a41', desc: 'JEWELRY has exactly 5 items (win condition basis)' },
        ],
        audit: null,
      }
    },

    kan32: {
      title: 'KAN-32 · Player Jewel Board & Turn Display',
      desc: 'Shows a row per player: color dot, name, 5 jewel slots (bright if collected, faded if missing), black ring indicator. Active player row highlighted. Animated turn banner at top.',
      diagram: `flowchart TD
  A["&lt;GameScreen&gt;\nGameScreen.tsx"] --> B["Turn Banner\nkey=currentIndex\nanimated re-mount"]
  A --> C["players.map\n→ PlayerRow"]
  C -->|"p === active"| D["colored border\nhighlight"]
  C -->|"p.inventory"| E["jewel slots\nbright / faded"]
  C -->|"p.hasBlackRing"| F["⚫ indicator\nL178"]`,
      artifacts: {
        jira: 'KAN-32',
        spec: 'docs/superpowers/specs/2026-03-17-spinner-and-black-ring-design.md',
        plan: 'docs/superpowers/plans/2026-03-17-spinner-and-black-ring.md',
        architecture: true,
        impl: [
          { file: 'src/GameScreen.tsx', lines: '70-226', commit: 'b386a41', desc: 'Full GameScreen — board, turn banner, player rows' },
          { file: 'src/types.ts',       lines: '1-30',   commit: '596345b', desc: 'Player, GameState, JewelryId types' },
        ],
        tests: [
          { file: 'src/game.test.ts', lines: '19-45', commit: 'b386a41', desc: 'CHARACTERS — unique emojis, colors, hex validation' },
        ],
        audit: null,
      }
    },
  }
}
</script>
<!-- ═══════════════════════════════════════════════════
     END PROJECT DATA
     ═══════════════════════════════════════════════════ -->

<!-- ── Topbar ── -->
<div class="topbar">
  <span class="badge-epic">EPIC</span>
  <div class="topbar-title">
    <h1 id="epic-title">KAN-23 · Core Game Mechanics &amp; Spinner</h1>
    <p>Click a feature node to explore — then generate a review package</p>
  </div>
  <button class="audit-btn" onclick="openAuditModal()">⚙ Run Audit</button>
  <button class="gate-btn SRR" onclick="generatePackage('SRR')">SRR Package</button>
  <button class="gate-btn PDR" onclick="generatePackage('PDR')">PDR Package</button>
  <button class="gate-btn CDR" onclick="generatePackage('CDR')">CDR Package</button>
  <button class="gate-btn TRR" onclick="generatePackage('TRR')">TRR Package</button>
  <button class="gate-btn PRR" onclick="generatePackage('PRR')">PRR Package</button>
</div>

<!-- ── Main layout ── -->
<div class="layout">
  <div class="left">
    <div class="left-header">Dependency graph — logical build order · click a node to explore</div>
    <div class="dag-wrap" id="dag-wrap"><!-- DAG rendered by JS --></div>
  </div>
  <div class="right">
    <div class="placeholder" id="placeholder">
      <div class="arrow">←</div>
      <p>Click any feature node to explore</p>
    </div>
    <div class="detail" id="detail-panel">
      <div class="detail-header">
        <h2 id="d-title"></h2>
        <p  id="d-desc"></p>
      </div>
      <div class="detail-body">
        <div>
          <div class="section-label">Documents</div>
          <div class="file-cards" id="d-docs"></div>
        </div>
        <div>
          <div class="section-label">Architecture</div>
          <div class="diagram-box" id="d-diagram"></div>
        </div>
        <div>
          <div class="section-label">Implementation</div>
          <div class="file-cards" id="d-impl"></div>
        </div>
        <div>
          <div class="section-label">Tests</div>
          <div class="file-cards" id="d-tests"></div>
        </div>
        <div>
          <a id="d-jira" class="jira-link" href="#" target="_blank">🔗 View Jira ticket</a>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- ── Audit modal ── -->
<div class="modal-overlay" id="audit-modal">
  <div class="modal">
    <h2>⚙ Artifact Audit</h2>
    <p class="subtitle">Click each cell to cycle: ✅ present → 🟡 partial → ❌ missing. Confirm to update gate badges.</p>
    <div id="audit-grid-wrap"></div>
    <div class="modal-actions">
      <button class="btn-cancel" onclick="closeAuditModal()">Cancel</button>
      <button class="btn-confirm" onclick="confirmAudit()">Confirm</button>
    </div>
  </div>
</div>

<script>
// ── Engine injected in Task 2 ──
</script>
</body>
</html>
```

- [ ] **Step 1.3: Open in browser and verify skeleton loads**

```bash
open docs/architecture/kan23-traceability.html
```

Expected: Dark page with topbar (title + 6 buttons), two-panel layout, placeholder "← Click any feature node". No JS errors in console. DAG area is empty (engine not wired yet).

- [ ] **Step 1.4: Commit**

```bash
git add docs/architecture/kan23-traceability.html
git commit -m "KAN-41: traceability DAG — scaffold, PROJECT_DATA, layout skeleton"
```

---

## Task 2: Gate Computation Engine + DAG Rendering

**Files:**
- Modify: `docs/architecture/kan23-traceability.html` — replace `// ── Engine injected in Task 2 ──` comment with full engine

### What we're building
The pure-JS functions: `computeGate`, `computeEpicGate`, `getGateStyle`, `buildDagSource`, `initDag`. After this task the DAG renders with colored, gate-badged nodes.

- [ ] **Step 2.1: Replace the engine comment with the gate logic + DAG init**

Find the line `// ── Engine injected in Task 2 ──` in the file and replace the entire `<script>` block it lives in with:

```html
<script>
// ── Gate logic ──────────────────────────────────────────────

const GATES = ['SRR', 'PDR', 'CDR', 'TRR', 'PRR']

const GATE_STYLE = {
  PRR:  { border: '#22c55e', bg: '#0a2d1a', label: '#86efac' },
  TRR:  { border: '#eab308', bg: '#2d2a0a', label: '#fde047' },
  CDR:  { border: '#f97316', bg: '#2d1f0a', label: '#fdba74' },
  PDR:  { border: '#3b82f6', bg: '#1e3a5f', label: '#93c5fd' },
  SRR:  { border: '#475569', bg: '#1a1f2e', label: '#94a3b8' },
  null: { border: '#ef4444', bg: '#2d0a0a', label: '#fca5a5' },
}

function artifactPasses(value) {
  if (value === null || value === false || value === 'amber') return false
  if (Array.isArray(value)) return value.length > 0
  return Boolean(value)
}

function computeGate(feature) {
  let highest = null
  for (const gate of GATES) {
    const required = PROJECT_DATA.gateRequirements[gate]
    const passes = required.every(key => artifactPasses(feature.artifacts[key]))
    if (passes) highest = gate
    else break  // gates are cumulative — stop at first failure
  }
  return highest
}

function computeEpicGate(epic) {
  const gates = epic.featureIds.map(id => computeGate(PROJECT_DATA.features[id]))
  const order = [...GATES].reverse() // PRR first
  for (const g of order) {
    if (gates.every(fg => fg !== null && GATES.indexOf(fg) >= GATES.indexOf(g))) return g
  }
  // Check if all features have at least SRR
  if (gates.every(fg => fg !== null)) return 'SRR'
  return null
}

// ── DAG rendering ────────────────────────────────────────────

function nodeLabel(id, feature) {
  const gate = computeGate(feature)
  const s = GATE_STYLE[gate] || GATE_STYLE[null]
  const badge = gate || 'NONE'
  // Mermaid node label — newlines via \n in quoted string
  return `["${feature.title.replace(/'/g, '&#39;')}\n● ${badge}"]`
}

function buildDagSource() {
  const epic = PROJECT_DATA.epics[0]
  const feats = PROJECT_DATA.features
  const lines = ['%%{init:{"theme":"base","themeVariables":{"primaryColor":"#1e2a3a","primaryTextColor":"#e2e8f0","primaryBorderColor":"#3b82f6","lineColor":"#374151","background":"#0f1117","fontFamily":"-apple-system,sans-serif","fontSize":"12px"}}}%%']
  lines.push('flowchart TD')

  // Epic node
  const epicGate = computeEpicGate(epic)
  const es = GATE_STYLE[epicGate] || GATE_STYLE[null]
  lines.push(`  EPIC["🏔️ ${epic.id}\n${epic.title}\n● ${epicGate || 'NONE'}"]`)

  // Feature nodes
  for (const id of epic.featureIds) {
    const f = feats[id]
    const gate = computeGate(f)
    const s = GATE_STYLE[gate] || GATE_STYLE[null]
    const shortTitle = f.title.split(' · ')[1] || f.title
    const nodeId = id.toUpperCase()
    lines.push(`  ${nodeId}["${f.title.split('·')[0].trim()}\n${shortTitle}\n● ${gate || 'NONE'}"]`)
  }

  // Edges
  const edges = [
    ['EPIC','KAN25'],['EPIC','KAN26'],
    ['KAN25','KAN26'],
    ['KAN26','KAN27'],['KAN26','KAN28'],['KAN26','KAN29'],['KAN26','KAN30'],
    ['KAN27','KAN31'],['KAN28','KAN31'],['KAN29','KAN31'],['KAN30','KAN31'],
    ['KAN31','KAN32'],
  ]
  for (const [a,b] of edges) lines.push(`  ${a} --> ${b}`)

  // Styles
  const epicStyle = `fill:${es.bg},stroke:${es.border},stroke-width:3px,color:${es.label}`
  lines.push(`  style EPIC ${epicStyle}`)
  for (const id of epic.featureIds) {
    const gate = computeGate(feats[id])
    const s = GATE_STYLE[gate] || GATE_STYLE[null]
    const nodeId = id.toUpperCase()
    lines.push(`  style ${nodeId} fill:${s.bg},stroke:${s.border},stroke-width:2px,color:${s.label}`)
  }

  // Click handlers
  for (const id of epic.featureIds) {
    const nodeId = id.toUpperCase()
    lines.push(`  click ${nodeId} call showFeature("${id}")`)
  }

  return lines.join('\n')
}

async function initDag() {
  mermaid.initialize({
    startOnLoad: false, theme: 'base', securityLevel: 'loose',
    themeVariables: {
      primaryColor: '#1e2a3a', primaryTextColor: '#e2e8f0',
      primaryBorderColor: '#3b82f6', lineColor: '#374151',
      background: '#0f1117', fontFamily: '-apple-system,sans-serif', fontSize: '12px',
    }
  })
  const source = buildDagSource()
  const { svg } = await mermaid.render('main-dag', source)
  document.getElementById('dag-wrap').innerHTML = svg
}

initDag()

// ── Detail panel ──────────────────────────────────────────────
// (injected in Task 3)

// ── Package generator ─────────────────────────────────────────
// (injected in Task 4)

// ── Audit modal ───────────────────────────────────────────────
// (injected in Task 5)
</script>
```

- [ ] **Step 2.2: Reload in browser and verify DAG renders**

Reload `docs/architecture/kan23-traceability.html`.

Expected:
- DAG renders with colored nodes (all nodes should be SRR color ⚫ since `audit: null` on all features, so PRR fails, TRR fails, CDR fails — but actually SRR, PDR, CDR should pass since jira/spec/plan/architecture are all present)
- Verify the KAN-25 node shows `● CDR` or `● TRR` depending on whether impl arrays count
- Epic node is at top with weakest-link badge
- Clicking a node does nothing yet (detail panel wired in Task 3)
- No JS errors in console

- [ ] **Step 2.3: Commit**

```bash
git add docs/architecture/kan23-traceability.html
git commit -m "KAN-41: traceability DAG — gate engine, DAG rendering with gate badge colors"
```

---

## Task 3: Detail Panel

**Files:**
- Modify: `docs/architecture/kan23-traceability.html` — replace `// ── Detail panel ──` comment

### What we're building
`showFeature(id)` — renders the right panel with Documents, Architecture diagram, Impl file cards, Tests, and Jira link when a DAG node is clicked.

- [ ] **Step 3.1: Replace the detail panel comment**

Find `// ── Detail panel ──` and the line after it `// (injected in Task 3)` and replace both with:

```js
// ── Detail panel ──────────────────────────────────────────────

function ghLink(file, lines) {
  const { repo, branch } = PROJECT_DATA.project
  return `${repo}/blob/${branch}/${file}#L${lines}`
}
function ghCommit(commit, file, lines) {
  const { repo } = PROJECT_DATA.project
  return `${repo}/blob/${commit}/${file}#L${lines}`
}
function docLink(path) {
  const { repo, branch } = PROJECT_DATA.project
  return `${repo}/blob/${branch}/${path}`
}

function renderFileCards(containerId, files, type) {
  const el = document.getElementById(containerId)
  if (!files || files.length === 0) { el.innerHTML = '<p class="dim-placeholder">None</p>'; return }
  el.innerHTML = files.map(f => `
    <div class="file-card">
      <span class="type-badge ${type}">${type}</span>
      <div class="file-info">
        <div class="path">${f.file}${f.lines ? ':' + f.lines : ''}</div>
        <div class="desc">${f.desc}</div>
      </div>
      <div class="file-links">
        <a class="btn-main"   href="${ghLink(f.file, f.lines)}" target="_blank">View ↗</a>
        ${f.commit ? `<a class="btn-commit" href="${ghCommit(f.commit, f.file, f.lines)}" target="_blank" title="Frozen at ${f.commit}">📌 ${f.commit.slice(0,7)}</a>` : ''}
      </div>
    </div>`).join('')
}

function renderDocCards(containerId, artifacts) {
  const el = document.getElementById(containerId)
  const cards = []
  for (const key of ['spec', 'plan']) {
    const val = artifacts[key]
    if (val && val !== 'amber') {
      cards.push(`
        <div class="file-card">
          <span class="type-badge doc">${key}</span>
          <div class="file-info">
            <div class="path">${val}</div>
          </div>
          <div class="file-links">
            <a class="btn-main" href="${docLink(val)}" target="_blank">View ↗</a>
          </div>
        </div>`)
    } else {
      const label = val === 'amber' ? '🟡 In progress' : '❌ Missing'
      cards.push(`<div class="file-card"><span class="type-badge doc">${key}</span><div class="file-info"><div class="path dim-placeholder">${label}</div></div></div>`)
    }
  }
  el.innerHTML = cards.join('')
}

async function showFeature(id) {
  const f = PROJECT_DATA.features[id]
  if (!f) return

  document.getElementById('placeholder').style.display = 'none'
  const panel = document.getElementById('detail-panel')
  panel.classList.add('visible')

  document.getElementById('d-title').textContent = f.title
  document.getElementById('d-desc').textContent  = f.desc

  // Documents
  renderDocCards('d-docs', f.artifacts)

  // Architecture diagram
  const diagEl = document.getElementById('d-diagram')
  if (f.artifacts.architecture && f.diagram) {
    diagEl.innerHTML = '<div class="dim-placeholder">Rendering…</div>'
    try {
      const { svg } = await mermaid.render('diag-' + id + '-' + Date.now(), f.diagram)
      diagEl.innerHTML = svg
    } catch(e) {
      diagEl.innerHTML = `<pre class="dim-placeholder">${e.message}</pre>`
    }
  } else {
    diagEl.innerHTML = '<p class="dim-placeholder">No diagram yet</p>'
  }

  // Impl + tests
  renderFileCards('d-impl',  f.artifacts.impl,  'impl')
  renderFileCards('d-tests', f.artifacts.tests, 'test')

  // Jira link
  const jiraEl = document.getElementById('d-jira')
  jiraEl.href = PROJECT_DATA.project.jiraUrl + f.artifacts.jira
  jiraEl.textContent = '🔗 View Jira ticket — ' + f.artifacts.jira
}
```

- [ ] **Step 3.2: Reload and verify detail panel**

Reload in browser. Click the KAN-28 node.

Expected:
- Right panel opens with "KAN-28 · Pick Any Modal" header and description
- Documents section shows two cards: spec (purple badge, View ↗ link) and plan (purple badge, View ↗ link). Both links should point to valid GitHub URLs.
- Architecture section shows the flowchart Mermaid diagram
- Implementation section shows 3 file cards with blue badges. Each has "View ↗" and "📌 9ee97" commit links.
- Tests section shows 1 file card with green badge
- Jira link at bottom: "🔗 View Jira ticket — KAN-28"

- [ ] **Step 3.3: Verify missing artifact placeholder**

Temporarily set `audit: null` on kan25 (it already is). Click KAN-25 node. Verify no "audit" card appears in any section (audit is not shown in docs/impl/tests panels — it's only used for gate computation).

- [ ] **Step 3.4: Commit**

```bash
git add docs/architecture/kan23-traceability.html
git commit -m "KAN-41: traceability DAG — detail panel with Documents, Architecture, Impl, Tests"
```

---

## Task 4: Gate Package Report Generator

**Files:**
- Modify: `docs/architecture/kan23-traceability.html` — replace `// ── Package generator ──` comment

### What we're building
`generatePackage(gate)` — opens a new tab with a self-contained HTML review package report.

- [ ] **Step 4.1: Replace the package generator comment**

Find `// ── Package generator ──` and the line after it `// (injected in Task 4)` and replace both with:

```js
// ── Package generator ─────────────────────────────────────────

function gateColor(gate) {
  return (GATE_STYLE[gate] || GATE_STYLE[null]).border
}

function generatePackage(requestedGate) {
  const { project, features, gateRequirements, epics } = PROJECT_DATA
  const allFeatureIds = epics[0].featureIds
  const gateIndex = GATES.indexOf(requestedGate)
  const date = new Date().toISOString().split('T')[0]

  // Compute gate for each feature
  const featureGates = {}
  for (const id of allFeatureIds) featureGates[id] = computeGate(features[id])

  const atOrAbove = allFeatureIds.filter(id => {
    const fg = featureGates[id]
    return fg !== null && GATES.indexOf(fg) >= gateIndex
  })
  const below = allFeatureIds.filter(id => !atOrAbove.includes(id))

  // Required artifacts for this gate
  const required = gateRequirements[requestedGate]

  // Gap analysis helper
  function gapFor(id) {
    return required.filter(key => !artifactPasses(features[id].artifacts[key]))
  }

  // Build feature body section (only for at-or-above features)
  function featureSection(id) {
    const f = features[id]
    const gate = featureGates[id]
    const s = GATE_STYLE[gate] || GATE_STYLE[null]
    let html = `<div style="margin:24px 0;padding:16px;background:#1a1f2e;border:1px solid ${s.border};border-radius:10px;">`
    html += `<h3 style="color:#fff;margin-bottom:4px;">${f.title}</h3>`
    html += `<span style="background:${s.bg};color:${s.label};border:1px solid ${s.border};border-radius:4px;padding:2px 8px;font-size:11px;font-weight:700;">● ${gate}</span>`

    // Show only artifacts required for this gate
    for (const key of required) {
      const val = f.artifacts[key]
      html += `<div style="margin-top:10px;"><span style="font-size:10px;font-weight:700;color:#475569;text-transform:uppercase;">${key}</span> `
      if (key === 'architecture' && val && f.diagram) {
        html += `<span style="color:#34d399;font-size:12px;">✅ Inline diagram present</span>`
      } else if (key === 'impl' || key === 'tests') {
        if (val && val.length > 0) {
          html += val.map(fv =>
            `<div style="font-size:12px;font-family:monospace;color:#93c5fd;margin-top:4px;">` +
            `<a href="${ghLink(fv.file, fv.lines)}" style="color:#93c5fd;">${fv.file}:${fv.lines}</a> ` +
            `<a href="${ghCommit(fv.commit, fv.file, fv.lines)}" style="color:#64748b;font-size:11px;">📌 ${fv.commit.slice(0,7)}</a></div>`
          ).join('')
        }
      } else if ((key === 'spec' || key === 'plan') && typeof val === 'string') {
        html += `<div style="margin-top:4px;"><a href="${docLink(val)}" style="color:#93c5fd;font-size:12px;">${val}</a></div>`
      } else if (typeof val === 'string') {
        html += `<span style="color:#34d399;font-size:12px;">✅ ${val}</span>`
      }
      html += '</div>'
    }
    html += '</div>'
    return html
  }

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<title>${project.name} — ${requestedGate} Review Package</title>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f1117;color:#e2e8f0;max-width:900px;margin:0 auto;padding:40px 24px;}
h1{font-size:26px;color:#fff;margin-bottom:4px;}
h2{font-size:16px;color:#fff;margin:32px 0 12px;}
table{width:100%;border-collapse:collapse;font-size:13px;}
th{text-align:left;padding:8px 12px;border-bottom:2px solid #1e2433;color:#475569;font-weight:600;}
td{padding:8px 12px;border-bottom:1px solid #1e2433;}
.tag{display:inline-block;border-radius:4px;border:1px solid;padding:1px 8px;font-size:11px;font-weight:700;}
</style>
</head><body>
<div style="border-bottom:2px solid ${gateColor(requestedGate)};padding-bottom:20px;margin-bottom:32px;">
  <p style="color:#64748b;font-size:13px;margin-bottom:8px;">${project.name} · Jira: ${project.jiraUrl.replace('https://','')}</p>
  <h1>${requestedGate} Review Package</h1>
  <p style="color:#64748b;font-size:13px;">Generated: ${date} · ${atOrAbove.length}/${allFeatureIds.length} features at or above ${requestedGate}</p>
</div>
<h2>Executive Summary</h2>
<table>
<tr><th>Feature</th><th>Gate Achieved</th><th>Gap (for ${requestedGate})</th></tr>
${allFeatureIds.map(id => {
  const f = features[id]
  const gate = featureGates[id]
  const s = GATE_STYLE[gate] || GATE_STYLE[null]
  const gap = gapFor(id)
  const gapText = gap.length === 0 ? '—' : gap.join(', ')
  const status = atOrAbove.includes(id)
    ? `<span class="tag" style="background:${s.bg};border-color:${s.border};color:${s.label};">● ${gate}</span>`
    : `<span class="tag" style="background:#2d0a0a;border-color:#ef4444;color:#fca5a5;">● ${gate || 'NONE'}</span> Not yet at ${requestedGate}`
  return `<tr><td>${f.title}</td><td>${status}</td><td style="color:${gap.length?'#f97316':'#64748b'};font-size:12px;">${gapText}</td></tr>`
}).join('')}
</table>
<h2>Feature Details <span style="font-size:13px;color:#475569;">(${atOrAbove.length} features at or above ${requestedGate})</span></h2>
${atOrAbove.map(id => featureSection(id)).join('')}
${below.length > 0 ? `<div style="margin-top:24px;padding:12px 16px;background:#1a1f2e;border:1px solid #374151;border-radius:8px;color:#64748b;font-size:13px;">
  <strong style="color:#94a3b8;">Not yet at ${requestedGate}:</strong> ${below.map(id => features[id].title.split('·')[0].trim()).join(', ')}
</div>` : ''}
</body></html>`

  const w = window.open('', '_blank')
  w.document.write(html)
  w.document.close()
}
```

- [ ] **Step 4.2: Reload and verify CDR package**

Reload in browser. Click "CDR Package" button.

Expected: New tab opens with a report titled "CDR Review Package". Executive summary table shows all 8 features. Features with jira + spec + plan + architecture all present should show `● CDR` or higher. Gap column should show `impl, tests, audit` for features stuck at CDR. Feature body sections only include jira, spec, plan, architecture artifacts — no impl or test file cards.

- [ ] **Step 4.3: Verify TRR package**

Click "TRR Package". Expected: Same structure but feature sections now include impl file cards. Features without impl show them as a gap.

- [ ] **Step 4.4: Commit**

```bash
git add docs/architecture/kan23-traceability.html
git commit -m "KAN-41: traceability DAG — gate package report generator (SRR–PRR)"
```

---

## Task 5: Audit Checklist Modal

**Files:**
- Modify: `docs/architecture/kan23-traceability.html` — replace `// ── Audit modal ──` comment

### What we're building
`openAuditModal()`, `closeAuditModal()`, `confirmAudit()` — the grid checklist modal that lets you cycle artifact states and push updates to the live DAG.

- [ ] **Step 5.1: Replace the audit modal comment**

Find `// ── Audit modal ──` and `// (injected in Task 5)` and replace both with:

```js
// ── Audit modal ───────────────────────────────────────────────

const ARTIFACT_KEYS = ['jira', 'spec', 'plan', 'architecture', 'impl', 'tests', 'audit']
const AUDIT_STATES  = ['green', 'amber', 'red']
const AUDIT_ICONS   = { green: '✅', amber: '🟡', red: '❌' }

// In-memory audit overlay (doesn't mutate PROJECT_DATA until Confirm)
let auditOverlay = {}

function artifactToState(value) {
  if (value === 'amber') return 'amber'
  if (value === null || value === false || (Array.isArray(value) && value.length === 0)) return 'red'
  return 'green'
}

function openAuditModal() {
  const epic = PROJECT_DATA.epics[0]
  auditOverlay = {}

  // Pre-populate from current PROJECT_DATA
  for (const id of epic.featureIds) {
    auditOverlay[id] = {}
    for (const key of ARTIFACT_KEYS) {
      auditOverlay[id][key] = artifactToState(PROJECT_DATA.features[id].artifacts[key])
    }
  }

  // Build grid
  const header = `<tr>
    <th class="feature-col">Feature</th>
    ${ARTIFACT_KEYS.map(k => `<th>${k}</th>`).join('')}
  </tr>`

  const rows = epic.featureIds.map(id => {
    const f = PROJECT_DATA.features[id]
    const cells = ARTIFACT_KEYS.map(key => {
      const state = auditOverlay[id][key]
      return `<td><span class="audit-cell" data-fid="${id}" data-key="${key}" onclick="cycleAuditCell(this)">${AUDIT_ICONS[state]}</span></td>`
    }).join('')
    return `<tr><td class="feature-name">${f.title.split('·')[0].trim()}</td>${cells}</tr>`
  }).join('')

  document.getElementById('audit-grid-wrap').innerHTML =
    `<table class="audit-grid"><thead>${header}</thead><tbody>${rows}</tbody></table>`
  document.getElementById('audit-modal').classList.add('open')
}

function cycleAuditCell(el) {
  const { fid, key } = el.dataset
  const current = AUDIT_STATES.indexOf(
    Object.keys(AUDIT_ICONS).find(s => AUDIT_ICONS[s] === el.textContent)
  )
  const next = AUDIT_STATES[(current + 1) % AUDIT_STATES.length]
  auditOverlay[fid][key] = next
  el.textContent = AUDIT_ICONS[next]
}

function closeAuditModal() {
  document.getElementById('audit-modal').classList.remove('open')
}

async function confirmAudit() {
  // Apply overlay to PROJECT_DATA artifacts
  for (const [id, keys] of Object.entries(auditOverlay)) {
    for (const [key, state] of Object.entries(keys)) {
      const current = PROJECT_DATA.features[id].artifacts[key]
      if (state === 'green') {
        // Keep existing value if already truthy; set a placeholder string if currently null
        if (!artifactPasses(current)) PROJECT_DATA.features[id].artifacts[key] = 'confirmed'
      } else if (state === 'amber') {
        PROJECT_DATA.features[id].artifacts[key] = 'amber'
      } else {
        PROJECT_DATA.features[id].artifacts[key] = null
      }
    }
  }
  closeAuditModal()
  // Re-render DAG with updated gate badges
  await initDag()
}
```

- [ ] **Step 5.2: Reload and verify audit modal opens**

Reload. Click "⚙ Run Audit".

Expected: Modal opens with a grid. Rows = 8 features, columns = 7 artifact types. All cells pre-populated: jira/spec/plan/architecture/impl/tests should show ✅ (they have values), audit should show ❌ (null). Click a cell — it cycles ✅ → 🟡 → ❌ → ✅.

- [ ] **Step 5.3: Verify Confirm updates DAG**

In the modal, change one feature's `audit` cell to ✅ (click twice: ❌ → ✅). Click Confirm.

Expected: Modal closes. DAG re-renders. The node for that feature should now show `● PRR` (all artifacts present). The epic node should still show its previous gate unless all features are PRR.

- [ ] **Step 5.4: Verify Cancel doesn't change anything**

Reopen modal. Change several cells. Click Cancel. DAG should be unchanged.

- [ ] **Step 5.5: Commit**

```bash
git add docs/architecture/kan23-traceability.html
git commit -m "KAN-41: traceability DAG — audit checklist modal with live gate badge updates"
```

---

## Task 6: Final Polish + Jira Close

**Files:**
- Modify: `docs/architecture/kan23-traceability.html` — minor fixes
- Update: Jira KAN-41 → Done

- [ ] **Step 6.1: Verify all acceptance criteria**

Open `docs/architecture/kan23-traceability.html` in a browser (no server needed) and check each AC:

| AC | How to verify |
|----|--------------|
| PROJECT_DATA is the only project-specific section | Check file — confirm `<!-- PROJECT DATA -->` comment block wraps all data |
| DAG nodes show correct gate badge colour | All 8 nodes visible with colored borders matching gate |
| Epic node shows weakest-link gate | EPIC node badge ≤ weakest feature gate |
| Clicking a node opens detail panel | Click each feature node — panel opens with all 5 sections |
| Documents section constructs GitHub URLs | Click "View ↗" on a spec link — URL should be `github.com/.../blob/main/docs/superpowers/specs/...` |
| Gate package buttons generate HTML report | Click each of SRR–PRR — new tab opens with correctly filtered content |
| Summary table includes all features | PRR package summary shows all 8 features (7 with gaps) |
| Sub-gate features body-section excluded | PRR package — features without audit show in summary only |
| Audit modal pre-populates correctly | Open modal — audit column all ❌, others all ✅ |
| Amber fails gate check | Set one feature's spec to amber via audit modal, Confirm — feature should drop to SRR |
| Confirm updates DAG live | Set audit to ✅ for one feature — that node turns green |
| File works with no server | Open via `file://` URL — everything works |

- [ ] **Step 6.2: Final commit**

```bash
git add docs/architecture/kan23-traceability.html
git commit -m "KAN-41: traceability DAG — complete, all ACs verified"
```

- [ ] **Step 6.3: Verify git log contains KAN-41 in all commits**

```bash
git log --oneline | head -6 | grep KAN-41
```

Expected: All 5 commits from this feature visible with `KAN-41:` prefix.

- [ ] **Step 6.4: Transition KAN-41 to Done in Jira**

Use the Jira MCP: `transitionJiraIssue` with cloudId `barkev.atlassian.net`, issueKey `KAN-41`, transition ID `41` (Done).

---

## Summary

| Task | Deliverable |
|------|-------------|
| 1 | File skeleton + full PROJECT_DATA for KAN-23 |
| 2 | Gate engine + colored DAG with badge nodes |
| 3 | Detail panel — Documents, Architecture, Impl, Tests |
| 4 | Gate package report (SRR–PRR) in new tab |
| 5 | Audit checklist modal with live DAG updates |
| 6 | AC verification + Jira close |
