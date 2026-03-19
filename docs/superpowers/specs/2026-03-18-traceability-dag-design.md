# Traceability DAG — Gate Badges, Review Packages, Audit Checklist

**Jira:** KAN-41
**Date:** 2026-03-18
**Status:** Approved

---

## Overview

A generalizable, standalone HTML tool that visualises a Jira project's epics and features as a clickable DAG, assigns review-readiness gate badges (SRR → PDR → CDR → TRR → PRR) to each node, generates self-contained HTML review packages per gate, and provides a manual audit checklist that drives live gate updates.

Pretty Pretty Princess (KAN project) is the proof-of-concept.

---

## Goals

- Make review readiness visible at a glance across all features
- Generate formal review packages (SRR / PDR / CDR / TRR / PRR) as self-contained HTML reports
- Provide a manual audit mechanism that updates gate status live without a build step
- Be generalizable — swapping projects requires only replacing one `PROJECT_DATA` config block

## Non-Goals

- Automated code scanning or test coverage analysis (future iteration)
- Live Jira API polling (data is baked in at generation time)
- Multi-epic view (scoped to one epic per HTML file for the POC)

---

## Architecture

### File Structure

```
docs/architecture/
  kan23-traceability.html    ← POC for KAN-23 epic
```

Single self-contained HTML file. No build step, no server, no dependencies except Mermaid.js via CDN.

### Sections of the file

```
PROJECT_DATA (config block)
  └─ project metadata (name, jiraUrl, repo, branch)
  └─ gateRequirements (which artifact types each gate requires)
  └─ features[] (per-feature: title, desc, diagram, artifacts{}, jira, files)

Rendering engine (pure JS)
  └─ computeGate(feature) → highest passing gate
  └─ computeEpicGate(features[]) → weakest-link gate
  └─ showFeature(id) → renders detail panel
  └─ generatePackage(gate) → opens review report in new tab
  └─ openAuditModal() → renders checklist, on confirm updates PROJECT_DATA live

Layout (HTML/CSS)
  └─ Topbar: title + Audit button + gate package buttons (SRR–PRR)
  └─ Left panel: Mermaid DAG (clickable nodes)
  └─ Right panel: detail panel (title, desc, Documents, Architecture, Impl files, Tests, Jira link)
```

---

## Data Layer

`PROJECT_DATA` is the only project-specific section. To use this tool on a new project, replace this block.

```js
const PROJECT_DATA = {
  project: {
    name: 'Pretty Pretty Princess',
    jiraUrl: 'https://barkev.atlassian.net/browse/',
    repo: 'https://github.com/barkev-dino/pretty_pretty_princess',
    branch: 'main',
  },

  // Epics are explicit entries; featureIds lists child feature keys
  epics: [
    { id: 'KAN-23', title: 'Core Game Mechanics & Spinner', featureIds: ['kan25','kan26','kan27','kan28','kan29','kan30','kan31','kan32'] }
  ],

  gateRequirements: {
    SRR: ['jira'],
    PDR: ['jira', 'spec'],
    CDR: ['jira', 'spec', 'plan', 'architecture'],
    TRR: ['jira', 'spec', 'plan', 'architecture', 'impl'],
    PRR: ['jira', 'spec', 'plan', 'architecture', 'impl', 'tests', 'audit'],
  },

  features: {
    kan28: {
      title: 'KAN-28 · Pick Any Modal',
      desc: 'Landing on Pick Any shows a modal...',
      diagram: `flowchart TD ...`,   // Mermaid source
      artifacts: {
        jira:         'KAN-28',                              // string (ticket key) = present
        spec:         'docs/superpowers/specs/2026-03-17-spinner-and-black-ring-design.md', // repo-relative path
        plan:         'docs/superpowers/plans/2026-03-17-spinner.md',                       // repo-relative path
        architecture: true,                                  // boolean true = inline diagram present (no external link)
        impl:         [{ file, lines, commit, desc }],       // array of file descriptors
        tests:        [{ file, lines, commit, desc }],       // array of file descriptors
        audit:        null,                                  // null = not done → blocks PRR; 'amber' = in progress
      }
      // Artifact value semantics:
      //   string / true / non-empty array  → passes gate check (green)
      //   'amber'                          → fails gate check (amber — partial/in-progress)
      //   null / false / empty array       → fails gate check (red — missing)
    }
  }
}
```

**Gate computation:**
`computeGate(feature)` iterates gates in order (SRR → PRR). Gate requirements are cumulative — each higher gate is a strict superset of the one below. A feature passes gate G if and only if every artifact key listed in `gateRequirements[G]` is non-null, non-false, and non-`'amber'`. Returns the highest passing gate, or `null` if even SRR fails.

**Amber semantics:** An amber artifact value (`'amber'`) means the artifact is partially complete or in-progress. It is treated as **failing** the gate check — amber does not satisfy a gate requirement. Amber is visually distinct from null (red = missing entirely, amber = exists but incomplete). In the audit modal, amber maps to the string `'amber'` in PROJECT_DATA; null maps to red; any other truthy value (string path, `true`, array) maps to green.

**Epic node:**
Each epic is defined explicitly in `PROJECT_DATA.epics` with an `id`, `title`, and `featureIds[]` array. The epic node is rendered as a synthetic top-level node in the DAG. `computeEpicGate(epic)` returns the minimum (weakest-link) gate across all child features — an epic is only as ready as its least-ready feature.

---

## Gate Badge Visual

| Gate | Border colour | Label colour | Meaning |
|------|--------------|--------------|---------|
| PRR  | 🟢 `#22c55e` | green  | Ship-ready — all artifacts present |
| TRR  | 🟡 `#eab308` | yellow | Code + tests done, audit missing |
| CDR  | 🟠 `#f97316` | orange | Design complete, not yet built |
| PDR  | 🔵 `#3b82f6` | blue   | Spec exists, no plan/arch yet |
| SRR  | ⚫ `#475569` | grey   | Jira ticket only |
| None | 🔴 `#ef4444` | red    | Missing even a Jira ticket |

DAG node label format:
```
🎡 KAN-25
Animated SVG Spinner
● TRR
```

---

## Detail Panel

Sections rendered when a DAG node is clicked:

1. **Header** — feature title + description
2. **Documents** — spec and plan file links. URL constructed as: `PROJECT_DATA.project.repo + '/blob/' + PROJECT_DATA.project.branch + '/' + artifactPath`. No commit permalink for docs (they are living documents, not code snapshots). If artifact value is `null`/`'amber'`, show a dimmed placeholder instead of a link.
3. **Architecture** — inline Mermaid diagram (rendered dynamically via `mermaid.render()`). Shown when `artifacts.architecture` is truthy. If `false`/`null`, show a "No diagram yet" placeholder.
4. **Implementation** — file cards: `type badge | path:lines | [View ↗] [📌 hash]`
5. **Tests** — same card pattern, green badge
6. **Jira link** — `🔗 View Jira ticket` constructed as `PROJECT_DATA.project.jiraUrl + artifacts.jira`

---

## Gate Package Report

Triggered by clicking `[CDR Package]` etc. in the topbar. Opens a new tab via `window.open` + `document.write`.

Report structure:
```
Cover page
  Project name, gate name, generated date

Executive Summary
  N/M features at this gate or above
  Table: feature name | gate achieved | gap (missing artifacts for requested gate)
  Note: ALL features appear in the summary table regardless of gate level.
        Features below the requested gate show their actual gate and the gap.

Feature sections
  Only features that have reached AT LEAST the requested gate get a full feature section.
  Features below the requested gate appear in the summary table only, with a
  "Not yet at [GATE] — currently at [LOWER_GATE]" note. They are not given a body section.

Per feature section (for features at or above requested gate):
  Feature title + gate badge
  Artifacts relevant to this gate level only
    (CDR report shows jira + spec + plan + architecture — not impl or tests)
  Inline architecture diagram (if architecture artifact is truthy)
```

Only artifacts required by the requested gate are shown — a CDR package does not include impl or test files (those aren't required at CDR).

---

## Audit Checklist Modal

Triggered by `[⚙ Run Audit]` button in topbar.

- Grid: rows = features, columns = artifact types (`jira`, `spec`, `plan`, `architecture`, `impl`, `tests`, `audit`)
- Each cell cycles through three states on click: ✅ green (artifact present) → 🟡 amber (partial/in-progress) → ❌ red (missing) → ✅ green
- **Amber fails gate checks** — a feature with an amber `spec` does not pass PDR
- Pre-populated from current `PROJECT_DATA` state: truthy non-amber value → green; `'amber'` → amber; null/false/empty array → red
- On **Confirm**: updates `PROJECT_DATA` in memory, re-renders all DAG node badges live
- For POC: in-memory only (refreshing the page resets to the baked-in state)
- Future: serialize to `localStorage` or exportable JSON

---

## Generalizing to a New Project

To use this tool on any other Jira project:

1. Copy `docs/architecture/kan23-traceability.html`
2. Replace the `PROJECT_DATA` block:
   - Update `project` metadata (name, jiraUrl, repo, branch)
   - Update `gateRequirements` if the project uses different gates or artifact types
   - Replace `epics` and `features` with the new project's data
   - **Author Mermaid source strings** for each feature's `diagram` field — this is manual work. Each `diagram` value is a Mermaid `flowchart` or `sequenceDiagram` string describing that feature's architecture. There is no automatic generation from code.
3. Open in browser — no other changes needed

The rendering engine, layout, gate logic, package generator, and audit modal are all project-agnostic. The only manual authoring required per project is: artifact metadata and Mermaid diagram source strings.

---

## Acceptance Criteria

- [ ] `PROJECT_DATA` is the only project-specific section — clearly delimited with comments
- [ ] DAG nodes show correct gate badge colour and label
- [ ] Epic node shows weakest-link gate of its children
- [ ] Clicking a node opens detail panel with Documents, Architecture, Impl, Tests, Jira link sections
- [ ] Gate package buttons (SRR–PRR) open a new tab with a correctly filtered HTML report
- [ ] Report executive summary shows correct feature counts and gap analysis
- [ ] Audit modal pre-populates from current state; Confirm updates DAG badges live
- [ ] File is self-contained — works by opening directly in a browser with no server
- [ ] Amber artifact cells fail gate computation; red = missing entirely; both block gate advancement
- [ ] Audit modal pre-populates amber cells correctly from `PROJECT_DATA` `'amber'` string values
- [ ] Epic node is defined in `PROJECT_DATA.epics` and rendered as a synthetic top-level DAG node
- [ ] Epic gate badge reflects weakest-link gate across all child features
- [ ] Documents section links constructed as `repo/blob/branch/path`; missing docs show dimmed placeholder
- [ ] Gate package summary table includes ALL features; only at-or-above-gate features get full body sections
- [ ] All commits reference `KAN-41:`
