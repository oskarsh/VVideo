# Preset System — Architecture & Effect Checklist

> **For agents:** When you add a new effect or project-level feature, use the checklist at the bottom to stay in sync.

## How Presets Work

A **preset** is a full `Project` snapshot with blob URLs stripped. It stores:
- `project.dither` (project-level dither settings)
- `project.globalEffects` (global timeline effect tracks)
- `project.scenes[]` (each scene carries its `effects[]` array + flyover + texts)
- `project.aspectRatio`, `project.backgroundTexture`

It deliberately **does not store** media URLs (blob: or otherwise), pane content, or per-scene trims — those stay from the current project when a preset is applied.

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/presets.ts` | Preset save/load/apply logic; built-in preset definitions |
| `src/types.ts` | All effect type interfaces; `createDefaultScene`; `createDefaultProject` |
| `src/lib/globalEffects.ts` | Global effect interpolation; `DEFAULT_GLOBAL_KEYFRAMES` |
| `src/lib/effectLabels.ts` | Display names + timeline param labels for every effect type |

## Data Flow

```
createDefaultScene()         ← defines the full effects[] array with all defaults
      ↓
sceneWith({})                ← copies default scene (presets.ts buildDefaultPresets)
      ↓
setGrain/setDoF/...          ← mutate specific effects via spread
      ↓
Preset.project.scenes[]      ← stored in preset

On apply:
applyPreset()                ← spreads preset look, keeps current media/panes/trims
applyPresetKeepKeyframes()   ← same but also keeps current scene camera keyframes
```

## What Is and Isn't Captured

### Captured in a preset
- All scene `effects[]` parameters (all 20 types — see below)
- `project.dither` (SceneEffectDither)
- `project.globalEffects` (GlobalEffectsMap — all 20 global effect types + camera)
- `project.aspectRatio`
- `project.backgroundTexture` (gradient/terrain/noise/dots)
- Scene `flyover` keyframes and `texts[]`

### Kept from the current project on apply
- `id`, `name`
- `backgroundVideoUrl`, `planeVideoUrl`, `planeMedia`, `backgroundTexture`
- `panes[]` (all pane content and transforms)
- `planeExtrusionDepth`
- `backgroundVideoContinuous`
- Per-scene: `id`, `backgroundTrim`, `planeTrim`, `paneTrims`, trim end-claimed flags
- Per-scene camera keyframes (only in `applyPresetKeepKeyframes`)

## Complete Effect Registry

Every effect must appear in **all four** of these locations:

### 1. `src/types.ts`
- [ ] `interface SceneEffectFoo { type: 'foo'; ... }` — scene effect params (use `Start`/`End` suffix for keyframeable values)
- [ ] Added to `SceneEffect` union type
- [ ] Added to `GlobalEffectType` union (if it supports global timeline)
- [ ] `interface GlobalEffectKeyframeFoo { time: number; ... }` — flattened (no Start/End) keyframe params
- [ ] Added to `GlobalEffectKeyframe` union
- [ ] Default entry added to `createDefaultScene().effects[]`

### 2. `src/lib/globalEffects.ts`
- [ ] Entry in `DEFAULT_GLOBAL_KEYFRAMES` with all params and sensible defaults
- [ ] Case in `getGlobalEffectStateAtTime` — **no-keyframe path** (expands flat keyframe params into `Start`/`End` scene effect fields)
- [ ] Case in `getGlobalEffectStateAtTime` — **keyframe path** (same expansion, using `sampleNum`/`sampleNearest`)
- [ ] Case in `createKeyframeAtTime` (reads `currentState.fooStart ?? currentState.fooEnd`)

### 3. `src/lib/effectLabels.ts`
- [ ] Entry in `EFFECT_DISPLAY_NAMES`
- [ ] Entry in `GLOBAL_EFFECT_PARAM_LABELS` with all keyframeable params listed

### 4. `src/lib/presets.ts` (optional but recommended)
- [ ] Add a `setFoo(...)` helper if the effect is useful for built-in presets
- [ ] Use the helper in one or more preset scenes to showcase the effect

## Naming Convention for Keyframeable Params

Scene effect interface uses `fooStart` / `fooEnd` for animated values:
```ts
interface SceneEffectSwirl {
  type: 'swirl'
  strengthStart: number
  strengthEnd: number
  ...
}
```

Global keyframe interface uses flat names (no Start/End):
```ts
interface GlobalEffectKeyframeSwirl {
  time: number
  strength: number
  ...
}
```

`getGlobalEffectStateAtTime` bridges them:
```ts
case 'swirl': {
  const s = sampleNum(kfs, time, 'strength', 2.0)
  return { type: 'swirl', enabled, strengthStart: s, strengthEnd: s, ... }
}
```

## Known Gaps (as of 2026-02-28)

### Bug: `projectForPreset` strips `backgroundTexture`
`presets.ts:37` hardcodes `backgroundTexture: null`. Generated backgrounds (gradient/terrain/noise/dots) are not blob URLs and can be safely preserved. Fix:
```ts
// change:
backgroundTexture: null,
// to:
backgroundTexture: project.backgroundTexture ?? null,
```

### Bug: `applyPreset` loses `backgroundVideoContinuous`
Built-in preset project objects don't include `backgroundVideoContinuous`, so `...preset.project` spreads it as `undefined`, silently resetting the current project's value. Fix: add an explicit override in `applyPreset`:
```ts
backgroundVideoContinuous: preset.project.backgroundVideoContinuous ?? currentProject.backgroundVideoContinuous,
```
Note: `applyPresetKeepKeyframes` is not affected — it starts from `{...preset.project, ...currentProject}` so currentProject fields always survive.

### No built-in preset setters for newer effects
The 10 newer effects (swirl, wave, pinch, kaleidoscope, melt, radialChromatic, fisheye, pixelShatter, tunnel, noiseWarp) have no `setFoo()` helper in `presets.ts`. They work fine via `createDefaultScene` defaults; add helpers when you want to feature them in a built-in preset.
