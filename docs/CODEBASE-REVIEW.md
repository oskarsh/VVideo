# VVideo codebase review: duplicates, integration gaps, recommendations

Review date: 2025-02-24. Many contributors have touched this codebase; this doc highlights where to streamline.

**Low-hanging fruits (done):** Single source for effect names (`src/lib/effectLabels.ts`), `SceneEffect` from `@/types` only, export constants in `src/constants/export.ts`, pane-to-layer UI copy in AssetsPanel/PanesPanel, number helpers in `src/utils/numbers.ts`, centralized `inputClass`/section/smallLabel in `src/constants/ui.ts`, shared `Modal` in `src/components/Modal.tsx` with AboutModal refactored to use it.

---

## 1. Duplicates

### 1.1 Floating-panel state and layout (high impact)

**Where:** `src/components/EffectsPanel.tsx` and `src/components/RightSidebar.tsx`

**What:** Both use the same pattern:

- `useState<Set<string>>(new Set())` for `openPanels`
- `useState<Record<string, { x: number; y: number }>>({})` for `panelPositions`
- Nearly identical `togglePanel`, `closePanel` (RightSidebar), and `setPanelPosition` callbacks
- Both call `getFloatingPanelPositions(openOrder.length, previewBounds, contentBounds, …)` from `LayoutContext`
- Both render draggable floating windows via `createPortal` + `DraggableEffectWindow`

**Recommendation:** Extract a hook, e.g. `useFloatingPanels(panelKeys, options)`, in `src/hooks/useFloatingPanels.ts` (or under `context/`). Return `openPanels`, `panelPositions`, `togglePanel`, `closePanel`, `setPanelPosition`, and computed `positionByKey`. Use it in both components and delete the duplicated state/callbacks.

---

### 1.2 Effect display names (two maps)

**Where:**

- `src/components/EffectsPanel.tsx`: `EFFECT_TITLES` (lines 22–31) for scene effects
- `src/components/GlobalEffectsPanel.tsx`: `EFFECT_LABELS` (lines 9–20) for global effects; re-exported and used by `RightSidebar.tsx`

**What:** Same idea — human-readable names for effect types — but two different maps and names. Overlap in types (e.g. grain, dof, handheld, chromaticAberration, lensDistortion, glitch, vignette, scanline).

**Recommendation:** Single source of truth, e.g. `src/lib/effectLabels.ts` (or in `types.ts`), with one map covering both scene and global effect types. Have `EffectsPanel` and `GlobalEffectsPanel` (and RightSidebar) import it. Remove `EFFECT_TITLES` and keep one name, e.g. `EFFECT_DISPLAY_NAMES`.

---

### 1.3 Input and label styles

**Where:**

- `inputClass`: defined identically in `EffectsPanel.tsx` (lines 19–20) and `GlobalEffectsPanel.tsx` (lines 153–154). Same long input string (with small variations) appears in `TextPanel.tsx`, `CurrentScenePanel.tsx`, `ScenePanel.tsx`, `AssetsPanel.tsx`, `CurveEditor.tsx`, `PresetDropdown.tsx`, `PanesPanel.tsx` (e.g. `px-2 py-1.5` vs `px-1.5 py-1`, `text-sm` vs `text-xs`).
- Section heading: `text-xs font-semibold text-white/60 uppercase tracking-wider` (with/without `mb-2`) in many files — e.g. `AssetsPanel`, `TextPanel`, `PanesPanel`, `FlyoverPanel`, `CurrentScenePanel`, `CollapsibleSection`.
- Small label: `text-[10px] text-white/50 uppercase tracking-wider block mb-1.5` (or `mb-0.5`) in several places.

**Recommendation:** Centralize in one place, e.g. `src/styles.ts` or `src/constants/ui.ts`: export `inputClass`, `sectionHeadingClass`, `smallLabelClass` (aligned with `docs/STYLE-SYSTEM.md`). Use them everywhere. Optionally add thin wrappers (`Label`, `Input`) that apply these classes.

---

### 1.4 Modal shell (backdrop + Escape + overlay click)

**Where:**

- `WelcomeModal.tsx`, `AboutModal.tsx`, `ChangelogModal.tsx`: each has `fixed inset-0 z-[100]`, `bg-black/70 backdrop-blur-sm`, overlay click → close, `useEffect` with Escape → close, and similar dialog container classes.
- `ExportDialog` in `App.tsx` (lines 628–818): same pattern inline (`fixed inset-0 z-50`, `bg-black/70 backdrop-blur-sm`, etc.).
- `TrimEditorModal.tsx`: same overlay/backdrop idea with `z-50` and `bg-black/80 backdrop-blur-sm`.

**Recommendation:** Add a single `Modal` component (e.g. `src/components/Modal.tsx`) that handles overlay, backdrop click, Escape, and shared dialog container. Use it in Welcome, About, Changelog, and Export (move ExportDialog to its own file and use `Modal`). Use the same shell in `TrimEditorModal` for consistency.

---

### 1.5 Clickable sidebar row with toggle

**Where:**

- `RightSidebar.tsx`: `SidebarRow` (lines 26–80) — toggle, `role="button"`, `onKeyDown` for Enter/Space, `border-b border-white/10 py-2 … hover:bg-white/5`.
- `EffectsPanel.tsx`: inline `<div role="button" …>` (lines 111–145) with the same toggle + row pattern.

**Recommendation:** Extract a shared component, e.g. `PanelRow` or `EffectRow`, with title, enabled toggle, onClick, optional key. Use it in both RightSidebar and EffectsPanel so toggle and a11y live in one place.

---

### 1.6 SceneEffect type defined twice

**Where:**

- `src/components/EffectsPanel.tsx` (lines 186–196): local `type SceneEffect = SceneEffectZoom | … | SceneEffectScanline`
- `src/types.ts` (line 160): `export type SceneEffect = …` (same union)

**Recommendation:** Remove the local type in `EffectsPanel.tsx` and import `SceneEffect` from `@/types` everywhere it’s needed.

---

### 1.7 Trim editor state and UI in two panels

**Where:** `CurrentScenePanel.tsx` and `ScenePanel.tsx`

**What:** Both use `useState<'background' | 'plane' | null>(null)` for trim editor, both render `TrimEditorModal` for background and plane with `onClose={() => setTrimEditor(null)}`, and both contain overlapping “current scene” / video / trim UI.

**Recommendation:** Either (a) lift trim-editor state to a shared hook, e.g. `useTrimEditor()`, used by both panels, or (b) have one panel own the trim modal and the other trigger it via callback or store. Reduces duplicate state and wiring.

---

### 1.8 Number parsing and clamping

**Where:** `parseFloat(e.target.value) || default` and `Math.max(min, Math.min(max, …))` (or equivalent) in `AssetsPanel.tsx`, `TextPanel.tsx`, `CurveEditor.tsx`, `Timeline.tsx`, `CurrentScenePanel.tsx`, `ScenePanel.tsx`, `PanesPanel.tsx`, and throughout `EffectsPanel.tsx` and `GlobalEffectsPanel.tsx`.

**Recommendation:** Add a small util, e.g. `src/utils/numbers.ts`, with `parseNum(value, default?)` and `clamp(value, min, max)`. Optionally a controlled `NumberInput` that uses them. Replace repeated parsing/clamping with these helpers.

---

## 2. Systems not working together

### 2.1 Pane vs layer in UI

**What:** Data and code use “pane” (`Pane`, `panes`, `getPanesForRender`, “Panes” section in AssetsPanel). PanesPanel section title is “Layers” and the button is “Add layer”; AssetsPanel says “No panes. Add in Layers below.” So the same concept is shown as both “Panes” and “Layers”.

**Recommendation:** Pick one user-facing term (e.g. “Layers” everywhere). Update PanesPanel, AssetsPanel (“No panes. Add in Layers below” → e.g. “No layers. Add below.”), and any other copy. Keep internal names as “pane” if desired.

---

### 2.2 Effect labels/titles split

**What:** Scene effects use `EFFECT_TITLES` in EffectsPanel; global effects use `EFFECT_LABELS` in GlobalEffectsPanel (and RightSidebar). Same effect types appear in both; no single source of truth for “display name for effect type.” (Tied to duplicate section 1.2.)

---

### 2.3 Modals: components vs inline

**What:** Welcome, About, and Changelog are separate components with their own Escape/backdrop logic. Export is an inline `ExportDialog` in `App.tsx` with the same behavior. Trim editor is a separate `TrimEditorModal` used from two panels. Inconsistent: some modals are components, one is a large inline function in App.

**Recommendation:** Unify with a shared `Modal` shell (see 1.4) and move ExportDialog to a dedicated file.

---

### 2.4 Scene / current-scene UI split

**What:** `ScenePanel.tsx` handles full scene setup (aspect ratio, background/plane videos, trims, clear, etc.). `CurrentScenePanel.tsx` handles duration, background/plane trim edit, and clear with its own `trimEditor` state. Both use the store but duplicate trim-editor opening and similar inputs.

**Recommendation:** Consider one source of truth for “current scene” UI (e.g. one panel or a shared hook) and have the other panel delegate to it or trigger the same trim flow.

---

### 2.5 Config/constants spread

**What:** Export options (`EXPORT_FRAMERATES`, `EXPORT_BITRATES`, `EXPORT_RESOLUTIONS`, `FRAME_BY_FRAME_RESOLUTION_THRESHOLD`) live in `App.tsx`. Panel layout constants are in `LayoutContext.tsx`. Effect-related defaults are in `types.ts`, `lib/globalEffects.ts`, and `lib/presets.ts`. No single place for “app constants” or “export constants.”

**Recommendation:** Move export-related constants to e.g. `src/constants/export.ts` or `src/config.ts`. Optionally group other app-wide constants (panel sizes, default durations, etc.) so config is easier to find and change.

---

### 2.6 CollapsibleSection usage

**What:** Only `PresetsPanel.tsx` and `GlobalEffectsPanel.tsx` use `CollapsibleSection`. Other panels (AssetsPanel, EffectsPanel rows, RightSidebar rows) use custom headers or plain divs. Same “section with optional collapse” need, different implementations.

**Recommendation:** Where it fits, use `CollapsibleSection` for consistent section headers and collapse behavior; or document when to use it vs custom headers.

---

### 2.7 Callback naming

**What:** PanesPanel uses `onUpdate` for pane updates; other panels use `onChange` or direct store setters. EffectsPanel uses `setEffect(sceneIndex, effectIndex, patch)`; GlobalEffectsPanel uses keyframe helpers and different props. Similar “update a thing” actions use different naming and patterns.

**Recommendation:** Not critical, but when touching these areas, consider aligning to a convention (e.g. `onChange` for value changes, `onUpdate` for full object updates, or standardize on one).

---

## 3. Recommended order of work

| Priority | Item | Effort | Impact |
|----------|------|--------|--------|
| 1 | Single source for effect display names (1.2, 2.2) | Low | Medium – less confusion, one place to edit |
| 2 | Use `SceneEffect` from `@/types` only (1.6) | Low | Low – removes type drift risk |
| 3 | Centralize input/section/label styles (1.3) | Medium | Medium – consistency, aligns with STYLE-SYSTEM.md |
| 4 | Unify modal shell + move ExportDialog (1.4, 2.3) | Medium | Medium – less duplication, consistent modals |
| 5 | Extract `useFloatingPanels` (1.1) | Medium | High – removes largest state/code duplicate |
| 6 | Shared PanelRow/EffectRow (1.5) | Low–Medium | Medium – one place for toggle + a11y |
| 7 | Pane vs layer copy (2.1) | Low | Low – clearer UI language |
| 8 | Number parsing/clamping util (1.8) | Low | Medium – fewer bugs, cleaner code |
| 9 | Trim editor single owner or hook (1.7, 2.4) | Medium | Medium – less duplicate scene/trim logic |
| 10 | Export/panel constants in one place (2.5) | Low | Low – easier config and onboarding |

---

## 4. Summary

- **Duplicates:** Largest wins are floating-panel state (EffectsPanel + RightSidebar), effect display names (two maps), input/label styles, modal shell, and row+toggle pattern. Smaller wins: single `SceneEffect` type, trim editor state, number parsing/clamping.
- **Integration:** Align “pane” vs “layer” in UI, single source for effect labels, unified modal pattern, and optional consolidation of scene/trim UI and constants.
- **Streamline:** Introduce shared hooks (`useFloatingPanels`, optional `useTrimEditor`), shared components (`Modal`, `PanelRow`), shared constants (`effectLabels`, `inputClass`/section/label classes, export constants), and shared utils (`numbers`). Then refactor existing components onto these one step at a time.

This doc can be used as a refactor roadmap; tick off items as they’re done and update the table if priorities change.
