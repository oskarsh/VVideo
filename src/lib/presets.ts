import type { Project, Scene } from '@/types'
import { createDefaultScene, DEFAULT_ASPECT, DEFAULT_DITHER } from '@/types'

const PRESETS_STORAGE_KEY = 'vvideo_presets'

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
    planeVideoUrl: null,
    planeMedia: null,
    dither: project.dither ?? DEFAULT_DITHER,
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
    planeVideoUrl: currentProject.planeVideoUrl,
    planeMedia: currentProject.planeMedia,
    planeExtrusionDepth: currentProject.planeExtrusionDepth,
    planeSvgColor: currentProject.planeSvgColor,
    dither: preset.project.dither ?? currentProject.dither ?? DEFAULT_DITHER,
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

function buildDefaultPresets(): Preset[] {
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

  const ditherOff = { ...DEFAULT_DITHER }
  const ditherVhs = { ...DEFAULT_DITHER, enabled: true, preset: 'strong' as const, levels: 4, intensity: 0.9 }
  const ditherContrast = { ...DEFAULT_DITHER, enabled: true, preset: 'strong' as const, levels: 4, intensity: 1 }

  return [
    { id: 'preset-clean', name: 'Clean', project: { id: 'p1', name: 'Clean', aspectRatio: DEFAULT_ASPECT, backgroundVideoUrl: null, planeVideoUrl: null, dither: ditherOff, scenes: [scene1] } },
    { id: 'preset-cinematic', name: 'Cinematic', project: { id: 'p2', name: 'Cinematic', aspectRatio: DEFAULT_ASPECT, backgroundVideoUrl: null, planeVideoUrl: null, dither: ditherOff, scenes: [scene2] } },
    { id: 'preset-vhs', name: 'VHS / Retro', project: { id: 'p3', name: 'VHS', aspectRatio: DEFAULT_ASPECT, backgroundVideoUrl: null, planeVideoUrl: null, dither: ditherVhs, scenes: [scene3] } },
    { id: 'preset-glitch', name: 'Glitch', project: { id: 'p4', name: 'Glitch', aspectRatio: DEFAULT_ASPECT, backgroundVideoUrl: null, planeVideoUrl: null, dither: ditherOff, scenes: [scene4] } },
    { id: 'preset-contrast', name: 'High contrast', project: { id: 'p5', name: 'High contrast', aspectRatio: DEFAULT_ASPECT, backgroundVideoUrl: null, planeVideoUrl: null, dither: ditherContrast, scenes: [scene5] } },
  ]
}

export function getPresets(): Preset[] {
  try {
    const raw = localStorage.getItem(PRESETS_STORAGE_KEY)
    if (!raw) {
      const defaults = buildDefaultPresets()
      setPresets(defaults)
      return defaults
    }
    const parsed = JSON.parse(raw) as Preset[]
    return Array.isArray(parsed) ? parsed : buildDefaultPresets()
  } catch {
    return buildDefaultPresets()
  }
}

export function setPresets(presets: Preset[]): void {
  try {
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets))
  } catch {
    // quota or disabled
  }
}

export function savePreset(name: string, project: Project): Preset {
  const presets = getPresets()
  const preset: Preset = {
    id: `preset-${crypto.randomUUID()}`,
    name: name.trim() || 'Unnamed',
    project: projectForPreset(project),
  }
  presets.push(preset)
  setPresets(presets)
  return preset
}

export function deletePreset(id: string): void {
  const presets = getPresets().filter((p) => p.id !== id)
  setPresets(presets)
}
