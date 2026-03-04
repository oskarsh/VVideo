# VVideo — Agent Instructions

## What this project is

VVideo is a web-based 3D video editor built with React, TypeScript, Vite, Zustand, and React Three Fiber. It supports scenes, a timeline, camera flyovers, per-scene and global effects, and WebM export.

## Build commands

```bash
npm run dev        # dev server at localhost:5173
npm run build      # tsc + vite build (must pass cleanly before committing)
npm run preview    # preview production build at localhost:4173
```

Always run `npm run build` after code changes and fix all errors before marking a task done.

## Key entry points

| File | Purpose |
|------|---------|
| `src/App.tsx` | Root layout, export logic (`runExport`), keyboard shortcuts |
| `src/store.ts` | Zustand store — all project state and actions |
| `src/types.ts` | All TypeScript types; `Project`, `Scene`, `Pane`, effect interfaces |
| `src/components/EditorCanvas.tsx` | React Three Fiber canvas; video planes, camera, effects |
| `src/lib/presets.ts` | `applyPreset`, `applyPresetKeepKeyframes`, built-in presets |

## Docs to read (in order of priority)

1. **`docs/TASKSHEET.md`** — Current task list, what's done, what's next, how to run agents in parallel. Update it when you complete a task.
2. **`docs/STYLE-SYSTEM.md`** — UI styling rules. Follow when touching any component.
3. **`docs/PRESET-SYSTEM.md`** — How presets work, effect registry checklist. Follow when adding or modifying effects.
4. **`docs/EXPORT-PIPELINE.md`** — Export architecture, known constraints, and optimization directions.
5. **`docs/SCREENSHOT-WORKFLOW.md`** — How to add changelog screenshots.

## Key patterns

- **`withHistory(update)`** — wraps store mutations that should be undoable. Return `{}` to no-op.
- **`parseNum` / `clamp`** — number helpers in `src/utils/numbers.ts`. Use in all number inputs.
- **`inputClass` / `sectionHeadingClass` / `smallLabelClass`** — shared Tailwind strings in `src/constants/ui.ts`. Use in all panels.
- **`Modal`** — shared modal shell at `src/components/Modal.tsx`. All modals use it.
- **`useFloatingPanels`** — shared floating-panel state at `src/hooks/useFloatingPanels.ts`.
- **Blob URLs** — always revoke the old URL before replacing. Wrap `revokeObjectURL` in `setTimeout(..., 1000)` after download triggers.
- **Export cleanup** — wrap `runExport` body in `try/finally { setExporting(false); ... }`.

## Shared utilities / constants (quick reference)

| Concern | Location |
|---------|---------|
| Effect display names | `src/lib/effectLabels.ts` |
| Export constants | `src/constants/export.ts` |
| UI class names | `src/constants/ui.ts` |
| Number helpers | `src/utils/numbers.ts` |
| Shared modal shell | `src/components/Modal.tsx` |
| Export dialog | `src/components/ExportDialog.tsx` |
| useFloatingPanels hook | `src/hooks/useFloatingPanels.ts` |
| Shared panel row | `src/components/PanelRow.tsx` |
| Changelog (code) | `src/changelog.ts` |
| Changelog (markdown) | `CHANGELOG.md` |

## Style rules (summary — read `docs/STYLE-SYSTEM.md` for full detail)

- **Styling:** Tailwind CSS only. No inline styles except unavoidable layout hacks.
- **Font:** IBM Plex Mono everywhere (body default).
- **Surfaces:** `bg-white/5`, `bg-white/10`, `bg-black/30`. Dropdowns: `bg-zinc-900`.
- **Borders:** `border-white/10` default, `/20` for inputs, `/30` on focus.
- **Emerald:** Only for toggle-on state and at most one primary CTA per view.
- **Destructive:** `hover:bg-red-500/20 hover:text-red-300`.
- **Selected:** `bg-white text-black` (inverted).

## Adding a new effect — checklist

When adding any new effect type, it must appear in **all four** locations:

1. `src/types.ts` — interface + union entries
2. `src/lib/globalEffects.ts` — `DEFAULT_GLOBAL_KEYFRAMES` + `getGlobalEffectStateAtTime` cases
3. `src/lib/effectLabels.ts` — display name + param labels
4. `src/lib/presets.ts` — optional `setFoo()` helper for built-in presets

See `docs/PRESET-SYSTEM.md` for the full checklist with field-level detail.

## Changelog

When making a meaningful change, add an entry to **both** `src/changelog.ts` and `CHANGELOG.md` (keep them in sync). Dates use the `YYYY-MM-DD` format.

## Task handoff

Read `docs/TASKSHEET.md` before starting work. When you finish a task:
1. Add a row to §2 (Already done).
2. Mark the task done in §3.
3. Update "Recommended next" in §4.
4. Run `npm run build` to confirm no regressions.
