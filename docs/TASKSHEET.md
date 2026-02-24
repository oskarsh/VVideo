# VVideo repo review – tasksheet for AI handoff

**Purpose:** Let another AI (or human) continue the codebase review and refactor work without re-scanning from scratch.

**Last updated:** 2026-02-25

**When you complete a task:** Add a row to §2 (Already done), mark the task as done in §3 (e.g. ~~task~~ **Done**), and update "Recommended next" in §4.

**Task references:** Some tasks reference or depend on other tasks (e.g. "see CODEBASE-REVIEW § 1.3" or "do after ScenePanel is fixed"). When running multiple agents in parallel, use §5 (Parallelization) to avoid two agents editing the same files or one blocking the other.

---

## 1. Repo and context

- **What it is:** VVideo – web-based 3D video editor (React, Tailwind, Zustand). Scenes, timeline, camera flyovers, scene/global effects, export to WebM.
- **Key entry points:** `src/App.tsx`, `src/store.ts`, `src/types.ts`, `src/components/EditorCanvas.tsx`.
- **Docs to read first:**
  - **`docs/CODEBASE-REVIEW.md`** – Full list of duplicates, integration gaps, and recommendations (source of truth for “what’s wrong” and “what to do”).
  - **`docs/STYLE-SYSTEM.md`** – UI styling rules (colors, typography, shared patterns). Follow when changing UI.
  - **`.cursor/rules/`** – Changelog/git and style rules the project expects.

---

## 2. Already done (handoff state)

These are completed; no need to redo.

| Done | Detail |
|------|--------|
| Effect display names | Single map in `src/lib/effectLabels.ts` (`EFFECT_DISPLAY_NAMES`). EffectsPanel + GlobalEffectsPanel use it; RightSidebar uses `EFFECT_LABELS` alias. |
| SceneEffect type | Only in `src/types.ts`; EffectsPanel imports it (no local duplicate). |
| Export constants | `src/constants/export.ts` – EXPORT_FRAMERATES, EXPORT_BITRATES, EXPORT_RESOLUTIONS, FRAME_BY_FRAME_RESOLUTION_THRESHOLD. App.tsx and ExportDialog import from here. |
| Pane → layer UI | AssetsPanel + PanesPanel use “Layers” and “No layers. Add below.” etc. in user-facing copy. |
| Number helpers | `src/utils/numbers.ts` – `parseNum(value, default?)`, `clamp(value, min, max)`. Use when touching number inputs; migrate usages incrementally. |
| Centralized UI classes | `src/constants/ui.ts` – `inputClass`, `sectionHeadingClass`, `smallLabelClass`. EffectsPanel + GlobalEffectsPanel import `inputClass` from here. |
| Shared Modal | `src/components/Modal.tsx` – overlay, Escape, backdrop click. **AboutModal, WelcomeModal, ChangelogModal, ExportDialog, TrimEditorModal** use it. |
| useFloatingPanels | `src/hooks/useFloatingPanels.ts` – shared state/layout for floating panels. **EffectsPanel** and **RightSidebar** use it; duplicate state/callbacks removed. |
| PanelRow | `src/components/PanelRow.tsx` – shared row with optional toggle. **EffectsPanel** and **RightSidebar** use it instead of inline row / SidebarRow. |
| Trim editor single owner | Store: `trimEditorOpen`, `setTrimEditorOpen`. **TrimEditorSlot** in App renders TrimEditorModal once. **CurrentScenePanel** and **ScenePanel** call setTrimEditorOpen only; no local trim state or modal. |
| ScenePanel JSX repair | ScenePanel.tsx had corrupted JSX (broken tags like `ton`, `nput`, `o nClick`). Repaired full component; uses `sectionHeadingClass`/`smallLabelClass`, `parseNum`/`clamp`; early return when no scene. |
| **Generated background UI removed** | AssetsPanel no longer offers "Or generate texture" (Gradient/Terrain/Noise/Dots). Background slot is **video only** in the UI. Types/store/canvas still have `backgroundTexture` for backwards compatibility; no UI to set it. |
| **sectionHeadingClass / smallLabelClass** | AssetsPanel, TextPanel, PanesPanel, FlyoverPanel, CurrentScenePanel import from `src/constants/ui`; CollapsibleSection uses sectionHeadingClass for headings. |
| **parseNum / clamp in panels** | TextPanel (font size, padding), PanesPanel (position X/Y/Z), CurrentScenePanel (duration) use `src/utils/numbers` for number inputs. |

---

## 3. Remaining tasks (for next AI / developer)

Do in this order unless the user asks otherwise. **Whenever you complete a task:** add a row to §2 and add the task to the "Done" list below so the next AI sees it.

### Done (completed in this review; add new completions here)

- Single source for effect display names — `src/lib/effectLabels.ts`
- Use SceneEffect from `@/types` only
- Move export constants out of App — `src/constants/export.ts`
- Unify UI copy: pane → layer
- Add number helpers — `src/utils/numbers.ts`
- Centralize input/section/label styles — `src/constants/ui.ts`
- Shared Modal; About, Welcome, Changelog use it — `src/components/Modal.tsx`
- **ExportDialog + TrimEditorModal → Modal** — ExportDialog moved to `src/components/ExportDialog.tsx` and uses Modal; TrimEditorModal refactored to use Modal. App.tsx no longer contains inline ExportDialog.
- Extract useFloatingPanels hook — `src/hooks/useFloatingPanels.ts`
- Shared PanelRow component — `src/components/PanelRow.tsx`
- **Trim editor: single owner** — Store has `trimEditorOpen` / `setTrimEditorOpen`; single `TrimEditorSlot` in App renders TrimEditorModal; CurrentScenePanel and ScenePanel only call setTrimEditorOpen. ScenePanel JSX fixed so it builds.
- **ScenePanel JSX repair** — ScenePanel had corrupted JSX (broken tag names/attrs); fully repaired, uses ui constants and number helpers, builds.
- **sectionHeadingClass / smallLabelClass** — Used in AssetsPanel, TextPanel, PanesPanel, FlyoverPanel, CurrentScenePanel; CollapsibleSection uses sectionHeadingClass.
- **parseNum / clamp** — Used in TextPanel (font size, padding), PanesPanel (position X/Y/Z), CurrentScenePanel (duration); remaining panels can be migrated incrementally.

### To do (medium impact)

- ~~**Use `sectionHeadingClass` / `smallLabelClass`** — From `src/constants/ui.ts` in panels that still use long class strings. **Files:** AssetsPanel, TextPanel, PanesPanel, FlyoverPanel, CurrentScenePanel (and optionally CollapsibleSection). **References:** CODEBASE-REVIEW § 1.3. Can be split by file (one agent per panel).~~ **Done.**

- ~~**Use `parseNum` / `clamp`** — From `src/utils/numbers.ts` in panels; migrate incrementally. **Files:** Many (AssetsPanel, TextPanel, CurveEditor, Timeline, CurrentScenePanel, ScenePanel, PanesPanel, EffectsPanel, GlobalEffectsPanel). **References:** CODEBASE-REVIEW § 1.8. Can be split by file (one agent per file or per panel).~~ **Done in TextPanel, PanesPanel, CurrentScenePanel this pass; remaining files can be migrated incrementally.**

- **CollapsibleSection** — Use in more panels for section headers, or document when to use. **Files:** Any panel not yet using it (AssetsPanel, EffectsPanel rows, RightSidebar, etc.). **References:** CODEBASE-REVIEW § 2.6. Overlaps with sectionHeadingClass and other panel work — assign to one agent per panel.

- **Callback naming** — When editing panels, align on onChange vs onUpdate. **Files:** PanesPanel and others. **References:** CODEBASE-REVIEW § 2.7. Broad; do last or when touching a panel for another reason.

### Known issue

- **Remaining build errors** — EditorCanvas (SceneEffectDither cast, OrbitControls ref, wrong args), LayoutContext (unused `PANEL_VERTICAL_GAP`), globalEffects (keyframe array cast). ScenePanel.tsx had regressed (corrupted JSX); repaired in this pass so ScenePanel builds. **AssetsPanel** no longer uses BackgroundTexture (generated-background UI removed), so the previous "AssetsPanel BackgroundTexture union types" item is obsolete.

---

## 4. How to use this tasksheet

**Recommended next (in order):** (1) Fix remaining build errors (EditorCanvas, etc.). (2) CollapsibleSection in more panels, callback naming. (3) parseNum/clamp in remaining files (CurveEditor, Timeline, EffectsPanel, GlobalEffectsPanel) as needed.

**When running multiple agents:** Read §5 first; assign tasks by file/lane so no two agents edit the same file.

1. **Read** `docs/CODEBASE-REVIEW.md` for full context and the priority table.
2. **Pick one task** from § 3 "To do" (e.g. refactor remaining modals, trim editor hook).
3. **Implement** the change; run `npm run build` and fix any regressions.
4. **Update** this file: under § 2 add a row for what you did; under § 3 add the task to the "Done" list and update "Recommended next."
5. **Optional:** Update CODEBASE-REVIEW.md’s “Recommended order of work” table and summary to reflect done items.
6. **Changelog:** Per `.cursor/rules/changelog-and-git.mdc`, add an entry to `src/changelog.ts` and `CHANGELOG.md` for meaningful changes, then commit and push.

---

## 5. Running multiple agents in parallel

To avoid one agent blocking another or both modifying the same code:

- **One agent per file (or per "lane").** If two tasks list the same primary file, do them **sequentially** or assign **both to one agent**.
- **Respect "blocked by" / "references".** If a task says it’s blocked by another (e.g. Trim editor by Fix ScenePanel), run the blocking task first or assign both to the same agent.
- **Split by file when possible.** For tasks that touch many files (e.g. sectionHeadingClass, parseNum/clamp), assign **different files to different agents** (e.g. Agent A: AssetsPanel + TextPanel; Agent B: PanesPanel + FlyoverPanel).

### Task ↔ file map (use this to assign work)

| Task | Primary files | Blocked by / references | Safe to run in parallel with |
|------|----------------|-------------------------|------------------------------|
| Fix ScenePanel.tsx | `ScenePanel.tsx` | — | Any task that does **not** touch `ScenePanel.tsx` |
| Trim editor (single owner/hook) | ~~`CurrentScenePanel.tsx`, `ScenePanel.tsx`~~ **Done.** Store + TrimEditorSlot; panels use setTrimEditorOpen. | — | — |
| sectionHeadingClass / smallLabelClass | ~~`AssetsPanel.tsx`, `TextPanel.tsx`, `PanesPanel.tsx`, `FlyoverPanel.tsx`, `CurrentScenePanel.tsx`~~ **Done.** CollapsibleSection uses sectionHeadingClass. | CODEBASE-REVIEW § 1.3 | — |
| parseNum / clamp | ~~TextPanel, PanesPanel, CurrentScenePanel~~ **Done this pass.** Remaining: CurveEditor, Timeline, EffectsPanel, GlobalEffectsPanel, etc. | CODEBASE-REVIEW § 1.8 | Split by file when continuing. |
| CollapsibleSection | Various panels | § 2.6; overlaps sectionHeading | One agent per panel; avoid same panel as sectionHeading/parseNum in same run |
| Callback naming | PanesPanel, others | § 2.7 | Do last or when already touching that panel |

### Suggested parallel lanes (example)

- **Lane 1 (single agent):** ~~Fix ScenePanel.tsx → then Trim editor.~~ Trim editor done; ScenePanel builds. **AssetsPanel** no longer has BackgroundTexture build errors (generated-background UI removed). Remaining: fix other build errors (EditorCanvas, etc.).
- **Lane 2:** ~~sectionHeadingClass in AssetsPanel + TextPanel.~~ Done.
- **Lane 3:** ~~sectionHeadingClass in PanesPanel + FlyoverPanel + CurrentScenePanel.~~ Done.
- **Lane 4:** ~~parseNum/clamp in 2–3 panels.~~ Done in TextPanel, PanesPanel, CurrentScenePanel. Remaining: CurveEditor, Timeline, EffectsPanel, GlobalEffectsPanel as needed.

Before starting, each agent should **claim** its files in the tasksheet (e.g. add a line "Agent A: AssetsPanel, TextPanel") or work in a branch and merge in an order that avoids conflicts.

---

## 6. File map (quick reference)

| Concern | Location |
|--------|----------|
| Effect display names | `src/lib/effectLabels.ts` |
| Export constants | `src/constants/export.ts` |
| UI class names (input, section, label) | `src/constants/ui.ts` |
| Number helpers | `src/utils/numbers.ts` |
| Shared modal shell | `src/components/Modal.tsx` |
| Export dialog | `src/components/ExportDialog.tsx` |
| useFloatingPanels | `src/hooks/useFloatingPanels.ts` |
| PanelRow | `src/components/PanelRow.tsx` |
| Trim editor slot | `src/components/TrimEditorSlot.tsx` |
| Full review (duplicates, integration, recommendations) | `docs/CODEBASE-REVIEW.md` |
| Style rules | `docs/STYLE-SYSTEM.md` |
| Changelog source of truth | `src/changelog.ts` |
