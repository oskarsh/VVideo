import type { Project, Scene } from '@/types'
import { createDefaultScene, createDefaultProject, DEFAULT_ASPECT, DEFAULT_DITHER } from '@/types'

const BUILTIN_PRESET_IDS = new Set([
  'preset-default',
  'preset-clean',
  'preset-cinematic',
  'preset-vhs',
  'preset-glitch',
  'preset-contrast',
  'preset-psychedelic',
  'preset-acid-trip',
  'preset-dream-state',
])
const CUSTOM_PRESETS_STORAGE_KEY = 'vvideo_presets_custom'
const SELECTED_PRESET_ID_KEY = 'vvideo_selected_preset_id'

export const DEFAULT_PRESET_ID = 'preset-default'

export interface Preset {
  id: string
  name: string
  /** Project state (video URLs are stripped when saving). */
  project: Project
}

/** Strip blob URLs so presets are serializable and portable. */
export function projectForPreset(project: Project): Project {
  return {
    ...project,
    id: project.id,
    name: project.name,
    aspectRatio: project.aspectRatio,
    backgroundVideoUrl: null,
    backgroundTexture: null,
    planeVideoUrl: null,
    planeMedia: null,
    dither: project.dither ?? DEFAULT_DITHER,
    globalEffects: project.globalEffects ? { ...project.globalEffects } : undefined,
    scenes: project.scenes.map((s) => ({ ...s })),
  }
}

/** Apply a preset to current project, keeping existing video URLs and trim. */
export function applyPreset(preset: Preset, currentProject: Project): Project {
  return {
    ...preset.project,
    id: currentProject.id,
    name: currentProject.name,
    aspectRatio: preset.project.aspectRatio,
    backgroundVideoUrl: currentProject.backgroundVideoUrl,
    backgroundTexture: currentProject.backgroundTexture,
    planeVideoUrl: currentProject.planeVideoUrl,
    planeMedia: currentProject.planeMedia,
    planeExtrusionDepth: currentProject.planeExtrusionDepth,
    planeSvgColor: currentProject.planeSvgColor,
    dither: preset.project.dither ?? currentProject.dither ?? DEFAULT_DITHER,
    globalEffects: preset.project.globalEffects ?? currentProject.globalEffects,
    scenes: preset.project.scenes.map((s, i) => {
      const existing = currentProject.scenes[i]
      return {
        ...s,
        id: existing?.id ?? s.id,
        backgroundTrim: existing?.backgroundTrim ?? s.backgroundTrim,
        planeTrim: existing?.planeTrim ?? s.planeTrim,
      }
    }),
  }
}

/** Apply preset look (dither, aspect, per-scene effects) but keep current keyframes and scene structure. */
export function applyPresetKeepKeyframes(preset: Preset, currentProject: Project): Project {
  const presetScenes = preset.project.scenes
  const templateScene = presetScenes[0]
  return {
    ...currentProject,
    aspectRatio: preset.project.aspectRatio,
    dither: preset.project.dither ?? currentProject.dither ?? DEFAULT_DITHER,
    globalEffects: currentProject.globalEffects,
    scenes: currentProject.scenes.map((cur, i) => {
      const from = presetScenes[i] ?? templateScene
      return {
        ...cur,
        effects: from.effects,
        flyover: from.flyover ?? cur.flyover,
      }
    }),
  }
}

function buildDefaultPresets(): Preset[] {
  const defaultProject = projectForPreset(createDefaultProject())
  const defaultPreset: Preset = {
    id: 'preset-default',
    name: 'Default',
    project: defaultProject,
  }

  const baseScene = createDefaultScene(crypto.randomUUID())

  const sceneWith = (patch: Partial<Scene> | ((s: Scene) => Scene)): Scene => {
    const s = { ...baseScene, id: crypto.randomUUID() }
    return typeof patch === 'function' ? patch(s) : { ...s, ...patch }
  }

  const setGrain = (opacity: number) =>
    (sc: Scene) => ({
      ...sc,
      effects: sc.effects.map((e) =>
        e.type === 'grain' ? { ...e, startOpacity: opacity, endOpacity: opacity } : e
      ),
    })

  const setDoF = (enabled: boolean) =>
    (sc: Scene) => ({
      ...sc,
      effects: sc.effects.map((e) => (e.type === 'dof' ? { ...e, enabled } : e)),
    })

  const setVignette = (enabled: boolean, offset = 0.5, darkness = 0.5) =>
    (sc: Scene) => ({
      ...sc,
      effects: sc.effects.map((e) =>
        e.type === 'vignette' ? { ...e, enabled, offset, darkness } : e
      ),
    })

  const setChromatic = (enabled: boolean, offset = 0.008) =>
    (sc: Scene) => ({
      ...sc,
      effects: sc.effects.map((e) =>
        e.type === 'chromaticAberration'
          ? { ...e, enabled, offsetStart: offset, offsetEnd: offset }
          : e
      ),
    })

  const setScanline = (enabled: boolean, density = 1.5, scrollSpeed = 0) =>
    (sc: Scene) => ({
      ...sc,
      effects: sc.effects.map((e) =>
        e.type === 'scanline' ? { ...e, enabled, density, scrollSpeed } : e
      ),
    })

  const setGlitch = (enabled: boolean, mode: 'sporadic' | 'constantMild' = 'sporadic') =>
    (sc: Scene) => ({
      ...sc,
      effects: sc.effects.map((e) =>
        e.type === 'glitch' ? { ...e, enabled, mode } : e
      ),
    })

  const setLensDistortion = (enabled: boolean, distortion = 0.08) =>
    (sc: Scene) => ({
      ...sc,
      effects: sc.effects.map((e) =>
        e.type === 'lensDistortion'
          ? { ...e, enabled, distortionStart: distortion, distortionEnd: distortion }
          : e
      ),
    })

  const setHandheld = (
    enabled: boolean,
    intensity = 0.018,
    rotationShake = 0.012,
    speed = 1.4
  ) =>
    (sc: Scene) => ({
      ...sc,
      effects: sc.effects.map((e) =>
        e.type === 'handheld'
          ? {
              ...e,
              enabled,
              intensityStart: intensity,
              intensityEnd: intensity,
              rotationShakeStart: rotationShake,
              rotationShakeEnd: rotationShake,
              speedStart: speed,
              speedEnd: speed,
            }
          : e
      ),
    })

  const compose = (...fns: ((s: Scene) => Scene)[]) =>
    (s: Scene) => fns.reduce((acc, f) => f(acc), s)

  const scene1 = compose(
    setGrain(0.08),
    setDoF(true),
    setVignette(false)
  )(sceneWith({}))

  const scene2 = compose(
    setGrain(0.12),
    setDoF(true),
    setVignette(true, 0.6, 0.6)
  )(sceneWith({}))

  const scene3 = compose(
    setGrain(0.25),
    setDoF(false),
    setChromatic(true, 0.012),
    setScanline(true, 2, 0.3),
    setVignette(true, 0.45, 0.55)
  )(sceneWith({}))

  const scene4 = compose(
    setGrain(0.1),
    setGlitch(true, 'sporadic'),
    setChromatic(true, 0.01)
  )(sceneWith({}))

  const scene5 = compose(
    setGrain(0.18),
    setVignette(true, 0.4, 0.75)
  )(sceneWith({}))

  // Psychedelic presets: chromatic + lens distortion + vignette + grain; some add glitch, scanlines, handheld, dither
  const scenePsychedelic = compose(
    setGrain(0.2),
    setDoF(false),
    setChromatic(true, 0.015),
    setLensDistortion(true, 0.08),
    setVignette(true, 0.4, 0.6),
    setScanline(true, 2, 0.2)
  )(sceneWith({}))

  const sceneAcidTrip = compose(
    setGrain(0.25),
    setDoF(false),
    setChromatic(true, 0.02),
    setLensDistortion(true, 0.12),
    setGlitch(true, 'constantMild'),
    setScanline(true, 2.5, 0.5),
    setVignette(true, 0.35, 0.7),
    setHandheld(true, 0.02, 0.01, 1.3)
  )(sceneWith({}))

  const sceneDreamState = compose(
    setGrain(0.15),
    setDoF(true),
    setChromatic(true, 0.01),
    setLensDistortion(true, 0.04),
    setVignette(true, 0.5, 0.5)
  )(sceneWith({}))

  const ditherOff = { ...DEFAULT_DITHER }
  const ditherVhs = { ...DEFAULT_DITHER, enabled: true, preset: 'strong' as const, levels: 4, intensity: 0.9 }
  const ditherContrast = { ...DEFAULT_DITHER, enabled: true, preset: 'strong' as const, levels: 4, intensity: 1 }
  const ditherPsychedelic = { ...DEFAULT_DITHER, enabled: true, preset: 'strong' as const, levels: 5, intensity: 0.95 }

  return [
    defaultPreset,
    { id: 'preset-clean', name: 'Clean', project: { id: 'p1', name: 'Clean', aspectRatio: DEFAULT_ASPECT, backgroundVideoUrl: null, planeVideoUrl: null, dither: ditherOff, scenes: [scene1] } },
    { id: 'preset-cinematic', name: 'Cinematic', project: { id: 'p2', name: 'Cinematic', aspectRatio: DEFAULT_ASPECT, backgroundVideoUrl: null, planeVideoUrl: null, dither: ditherOff, scenes: [scene2] } },
    { id: 'preset-vhs', name: 'VHS / Retro', project: { id: 'p3', name: 'VHS', aspectRatio: DEFAULT_ASPECT, backgroundVideoUrl: null, planeVideoUrl: null, dither: ditherVhs, scenes: [scene3] } },
    { id: 'preset-glitch', name: 'Glitch', project: { id: 'p4', name: 'Glitch', aspectRatio: DEFAULT_ASPECT, backgroundVideoUrl: null, planeVideoUrl: null, dither: ditherOff, scenes: [scene4] } },
    { id: 'preset-contrast', name: 'High contrast', project: { id: 'p5', name: 'High contrast', aspectRatio: DEFAULT_ASPECT, backgroundVideoUrl: null, planeVideoUrl: null, dither: ditherContrast, scenes: [scene5] } },
    { id: 'preset-psychedelic', name: 'Psychedelic', project: { id: 'p6', name: 'Psychedelic', aspectRatio: DEFAULT_ASPECT, backgroundVideoUrl: null, planeVideoUrl: null, dither: ditherPsychedelic, scenes: [scenePsychedelic] } },
    { id: 'preset-acid-trip', name: 'Acid Trip', project: { id: 'p7', name: 'Acid Trip', aspectRatio: DEFAULT_ASPECT, backgroundVideoUrl: null, planeVideoUrl: null, dither: ditherPsychedelic, scenes: [sceneAcidTrip] } },
    { id: 'preset-dream-state', name: 'Dream State', project: { id: 'p8', name: 'Dream State', aspectRatio: DEFAULT_ASPECT, backgroundVideoUrl: null, planeVideoUrl: null, dither: ditherOff, scenes: [sceneDreamState] } },
  ]
}

export function getBuiltInPresets(): Preset[] {
  return buildDefaultPresets()
}

export function getCustomPresets(): Preset[] {
  try {
    const raw = localStorage.getItem(CUSTOM_PRESETS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Preset[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/** All presets: built-in (Default, Clean, …) first, then user-saved custom presets. */
export function getPresets(): Preset[] {
  return [...getBuiltInPresets(), ...getCustomPresets()]
}

function setCustomPresets(presets: Preset[]): void {
  try {
    localStorage.setItem(CUSTOM_PRESETS_STORAGE_KEY, JSON.stringify(presets))
  } catch {
    // quota or disabled
  }
}

export function savePreset(name: string, project: Project): Preset {
  const custom = getCustomPresets()
  const preset: Preset = {
    id: `preset-${crypto.randomUUID()}`,
    name: name.trim() || 'Unnamed',
    project: projectForPreset(project),
  }
  custom.push(preset)
  setCustomPresets(custom)
  return preset
}

/** Returns true if the preset is built-in (Default, Clean, etc.) and cannot be deleted. */
export function isBuiltInPreset(id: string): boolean {
  return BUILTIN_PRESET_IDS.has(id)
}

export function getSelectedPresetId(): string {
  try {
    const id = localStorage.getItem(SELECTED_PRESET_ID_KEY)
    return id ?? DEFAULT_PRESET_ID
  } catch {
    return DEFAULT_PRESET_ID
  }
}

export function setSelectedPresetId(id: string): void {
  try {
    localStorage.setItem(SELECTED_PRESET_ID_KEY, id)
  } catch {
    // ignore
  }
}

export function deletePreset(id: string): void {
  if (isBuiltInPreset(id)) return
  const custom = getCustomPresets().filter((p) => p.id !== id)
  setCustomPresets(custom)
}
