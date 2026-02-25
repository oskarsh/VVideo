import { create } from 'zustand'
import type { Project, Scene, FlyoverKeyframeWithTime, SceneEffectDither, PlaneMedia, Pane, GlobalEffectType, GlobalEffectTrack, GlobalEffectKeyframe, BackgroundTexture } from '@/types'
import { createDefaultProject, createDefaultScene, createDefaultPane, createDefaultSceneText, DEFAULT_DITHER, getPlaneMedia } from '@/types'
import { DEFAULT_GLOBAL_KEYFRAMES } from '@/lib/globalEffects'
import { getPresets, getSelectedPresetId, DEFAULT_PRESET_ID, applyPresetKeepKeyframes } from '@/lib/presets'

function getInitialProject(): Project {
  const empty = createDefaultProject()
  const presets = getPresets()
  const selectedId = getSelectedPresetId()
  const preset = presets.find((p) => p.id === selectedId) ?? presets.find((p) => p.id === DEFAULT_PRESET_ID) ?? presets[0]
  return preset ? applyPresetKeepKeyframes(preset, empty) : empty
}

/** Snapshot of undoable state for history. */
export interface HistorySnapshot {
  project: Project
  currentSceneIndex: number
  currentTime: number
}

const HISTORY_LIMIT = 50

function snapshot(s: { project: Project; currentSceneIndex: number; currentTime: number }): HistorySnapshot {
  return {
    project: s.project,
    currentSceneIndex: s.currentSceneIndex,
    currentTime: s.currentTime,
  }
}

/** Wraps an update so we push current state to past and clear future before applying. */
function withHistory(
  update: (s: EditorState) => Partial<EditorState>
): (s: EditorState) => Partial<EditorState> {
  return (s) => {
    const next = update(s)
    const touchesUndoable = 'project' in next || 'currentSceneIndex' in next || 'currentTime' in next
    if (!touchesUndoable) return next
    const past = (s.historyPast ?? []).slice(-(HISTORY_LIMIT - 1))
    return {
      historyPast: [...past, snapshot(s)],
      historyFuture: [],
      ...next,
    }
  }
}

interface EditorState {
  project: Project
  currentSceneIndex: number
  currentTime: number
  isPlaying: boolean
  isExporting: boolean
  loopCurrentScene: boolean
  /** Only used during export: 'full' = composite, 'plane-only' = transparent background */
  exportRenderMode: 'full' | 'plane-only'
  /** Export output height in pixels (e.g. 480, 720, 1080, 1440, 2160). Used when isExporting. */
  exportHeight: number
  setExportHeight: (h: number) => void
  historyPast: HistorySnapshot[]
  historyFuture: HistorySnapshot[]

  setProject: (p: Project | ((prev: Project) => Project)) => void
  setCurrentSceneIndex: (i: number) => void
  setCurrentTime: (t: number) => void
  setPlaying: (v: boolean) => void
  setExporting: (v: boolean) => void
  setLoopCurrentScene: (v: boolean) => void
  setExportRenderMode: (m: 'full' | 'plane-only') => void
  undo: () => void
  redo: () => void

  addScene: () => void
  addSceneAfter: (index: number) => void
  removeScene: (index: number) => void
  duplicateScene: (index: number) => void
  reorderScenes: (fromIndex: number, toIndex: number) => void
  clearScene: (index: number) => void
  updateScene: (index: number, patch: Partial<Scene>) => void
  setProjectAspectRatio: (ratio: [number, number]) => void
  setProjectBackgroundVideo: (url: string | null) => void
  setProjectBackgroundTexture: (t: BackgroundTexture | null) => void
  setProjectBackgroundVideoContinuous: (v: boolean) => void
  setProjectPlaneVideo: (url: string | null) => void
  setProjectPlaneMedia: (media: PlaneMedia | null) => void
  setProjectPlaneExtrusionDepth: (depth: number) => void
  setBackgroundTrim: (sceneIndex: number, trim: { start: number; end: number } | null, endClaimed?: boolean) => void
  setPlaneTrim: (sceneIndex: number, trim: { start: number; end: number } | null, endClaimed?: boolean) => void
  addPane: () => void
  addPaneWithMedia: (media: PlaneMedia) => void
  removePane: (paneId: string) => void
  updatePane: (paneId: string, patch: Partial<Pane>) => void
  reorderPanes: (fromIndex: number, toIndex: number) => void
  setPaneTrim: (sceneIndex: number, paneId: string, trim: { start: number; end: number } | null, endClaimed?: boolean) => void
  addSceneText: (sceneIndex: number) => void
  setFlyoverEnabled: (sceneIndex: number, enabled: boolean) => void
  addFlyoverKeyframe: (sceneIndex: number, keyframe: FlyoverKeyframeWithTime) => void
  removeFlyoverKeyframe: (sceneIndex: number, index: number) => void
  updateFlyoverKeyframe: (sceneIndex: number, index: number, patch: Partial<FlyoverKeyframeWithTime>) => void
  flyoverEditMode: boolean
  setFlyoverEditMode: (v: boolean) => void
  setEffect: (sceneIndex: number, effectIndex: number, patch: object) => void
  setProjectDither: (patch: Partial<SceneEffectDither>) => void
  /** Global effect tracks (keyframes on project timeline). */
  setGlobalEffectTrack: (effectType: GlobalEffectType, track: GlobalEffectTrack | null) => void
  addGlobalEffectKeyframe: (effectType: GlobalEffectType, keyframe: GlobalEffectKeyframe) => void
  removeGlobalEffectKeyframe: (effectType: GlobalEffectType, index: number) => void
  updateGlobalEffectKeyframe: (effectType: GlobalEffectType, index: number, patch: Partial<GlobalEffectKeyframe>) => void
  /** Add or update keyframe at given time (merge patch into existing or create new). */
  setGlobalEffectKeyframeAtTime: (effectType: GlobalEffectType, time: number, patch: Partial<GlobalEffectKeyframe>) => void
  /** Update non-keyframe base params on an existing track (no history entry). Used for live slider preview. */
  setGlobalEffectParams: (effectType: GlobalEffectType, params: Record<string, unknown>) => void
  resetProject: () => void
  /** When trim editor is open: which video is being edited and time to show in main canvas. */
  trimScrub:
  | { video: 'background'; time: number }
  | { video: 'plane'; time: number }
  | { video: 'pane'; paneId: string; time: number }
  | null
  setTrimScrub: (
    value:
      | { video: 'background'; time: number }
      | { video: 'plane'; time: number }
      | { video: 'pane'; paneId: string; time: number }
      | null
  ) => void
  /** Which trim editor modal is open (single owner). null = closed. */
  trimEditorOpen: 'background' | 'plane' | { type: 'pane'; paneId: string } | null
  setTrimEditorOpen: (v: 'background' | 'plane' | { type: 'pane'; paneId: string } | null) => void
  /** Current camera in flyover edit mode; used to show if Start/End buttons are "at" keyframe. */
  flyoverEditCamera: { position: [number, number, number]; rotation: [number, number, number]; fov: number } | null
  setFlyoverEditCamera: (v: { position: [number, number, number]; rotation: [number, number, number]; fov: number } | null) => void
  /** When true, canvas snaps camera to start keyframe once then clears. */
  flyoverJumpToStart: boolean
  setFlyoverJumpToStart: (v: boolean) => void
  /** When true, timeline shows automation curves for effect keyframes (start/end params). */
  timelineShowAutomation: boolean
  setTimelineShowAutomation: (v: boolean) => void
  /** Frames per second for timeline frame display and export. Default 30. */
  projectFps: number
  setProjectFps: (fps: number) => void
}

export const useStore = create<EditorState>((set) => ({
  project: getInitialProject(),
  currentSceneIndex: 0,
  currentTime: 0,
  isPlaying: false,
  isExporting: false,
  loopCurrentScene: false,
  exportRenderMode: 'full',
  exportHeight: 720,
  setExportHeight: (h) => set({ exportHeight: h }),
  historyPast: [],
  historyFuture: [],

  setProject: (p) =>
    set(
      withHistory((s) => ({
        project: typeof p === 'function' ? p(s.project) : p,
      }))
    ),
  setCurrentSceneIndex: (i) => set({ currentSceneIndex: i }),
  setCurrentTime: (t) => set({ currentTime: t }),
  setPlaying: (v) => set({ isPlaying: v }),
  setExporting: (v) => set({ isExporting: v }),
  setLoopCurrentScene: (v) => set({ loopCurrentScene: v }),
  setExportRenderMode: (m) => set({ exportRenderMode: m }),

  undo: () =>
    set((s) => {
      if (s.historyPast.length === 0) return s
      const snap = s.historyPast[s.historyPast.length - 1]
      return {
        project: snap.project,
        currentSceneIndex: snap.currentSceneIndex,
        currentTime: snap.currentTime,
        historyPast: s.historyPast.slice(0, -1),
        historyFuture: [snapshot(s), ...s.historyFuture],
      }
    }),
  redo: () =>
    set((s) => {
      if (s.historyFuture.length === 0) return s
      const snap = s.historyFuture[0]
      return {
        project: snap.project,
        currentSceneIndex: snap.currentSceneIndex,
        currentTime: snap.currentTime,
        historyPast: [...s.historyPast, snapshot(s)],
        historyFuture: s.historyFuture.slice(1),
      }
    }),

  addScene: () =>
    set(
      withHistory((s) => ({
        project: {
          ...s.project,
          scenes: [...s.project.scenes, createDefaultScene(crypto.randomUUID())],
        },
      }))
    ),
  addSceneAfter: (index) =>
    set(
      withHistory((s) => {
        const newScene = createDefaultScene(crypto.randomUUID())
        const scenes = [...s.project.scenes]
        scenes.splice(index + 1, 0, newScene)
        return {
          project: { ...s.project, scenes },
          currentSceneIndex: index + 1,
        }
      })
    ),
  removeScene: (index) =>
    set(
      withHistory((s) => ({
        project: {
          ...s.project,
          scenes: s.project.scenes.filter((_, i) => i !== index),
        },
        currentSceneIndex: Math.max(0, Math.min(s.currentSceneIndex, s.project.scenes.length - 2)),
      }))
    ),
  duplicateScene: (index) =>
    set(
      withHistory((s) => {
        const scene = s.project.scenes[index]
        const duplicate: Scene = {
          ...scene,
          id: crypto.randomUUID(),
          texts: (scene.texts ?? []).map((t) => ({ ...t, id: crypto.randomUUID() })),
        }
        const scenes = [...s.project.scenes]
        scenes.splice(index + 1, 0, duplicate)
        return {
          project: { ...s.project, scenes },
          currentSceneIndex: index + 1,
        }
      })
    ),
  reorderScenes: (fromIndex, toIndex) =>
    set(
      withHistory((s) => {
        if (fromIndex === toIndex) return s
        const scenes = [...s.project.scenes]
        const [removed] = scenes.splice(fromIndex, 1)
        scenes.splice(toIndex, 0, removed)
        const selectedId = s.project.scenes[s.currentSceneIndex]?.id
        const newCurrentIndex = selectedId
          ? Math.max(0, scenes.findIndex((sc) => sc.id === selectedId))
          : 0
        return {
          project: { ...s.project, scenes },
          currentSceneIndex: newCurrentIndex,
        }
      })
    ),
  clearScene: (index) =>
    set(
      withHistory((s) => ({
        project: {
          ...s.project,
          scenes: s.project.scenes.map((sc, i) =>
            i === index ? createDefaultScene(sc.id) : sc
          ),
        },
      }))
    ),
  updateScene: (index, patch) =>
    set(
      withHistory((s) => ({
        project: {
          ...s.project,
          scenes: s.project.scenes.map((sc, i) => (i === index ? { ...sc, ...patch } : sc)),
        },
      }))
    ),
  setProjectAspectRatio: (ratio) =>
    set(
      withHistory((s) => ({
        project: { ...s.project, aspectRatio: ratio },
      }))
    ),
  setProjectBackgroundVideo: (url) =>
    set(
      withHistory((s) => ({
        project: { ...s.project, backgroundVideoUrl: url, backgroundTexture: null },
      }))
    ),
  setProjectBackgroundTexture: (t) =>
    set(
      withHistory((s) => ({
        project: { ...s.project, backgroundTexture: t ?? undefined, backgroundVideoUrl: t ? null : s.project.backgroundVideoUrl },
      }))
    ),
  setProjectBackgroundVideoContinuous: (v) =>
    set(
      withHistory((s) => ({
        project: { ...s.project, backgroundVideoContinuous: v },
      }))
    ),
  setProjectPlaneVideo: (url) =>
    set(
      withHistory((s) => ({
        project: {
          ...s.project,
          planeVideoUrl: url ?? undefined,
          planeMedia: url ? { type: 'video', url } : null,
        },
      }))
    ),
  setProjectPlaneMedia: (media) =>
    set(
      withHistory((s) => ({
        project: {
          ...s.project,
          planeMedia: media,
          planeVideoUrl: media?.type === 'video' ? media.url : undefined,
        },
      }))
    ),
  setProjectPlaneExtrusionDepth: (depth) =>
    set(
      withHistory((s) => ({
        project: { ...s.project, planeExtrusionDepth: Math.max(0, depth) },
      }))
    ),
  setBackgroundTrim: (sceneIndex, trim, endClaimed) =>
    set(
      withHistory((s) => ({
        project: {
          ...s.project,
          scenes: s.project.scenes.map((sc, i) =>
            i !== sceneIndex
              ? sc
              : {
                ...sc,
                backgroundTrim: trim,
                ...(trim === null
                  ? { backgroundTrimEndClaimed: false }
                  : endClaimed === true
                    ? { backgroundTrimEndClaimed: true }
                    : {}),
              }
          ),
        },
      }))
    ),
  setPlaneTrim: (sceneIndex, trim, endClaimed) =>
    set(
      withHistory((s) => ({
        project: {
          ...s.project,
          scenes: s.project.scenes.map((sc, i) =>
            i !== sceneIndex
              ? sc
              : {
                ...sc,
                planeTrim: trim,
                ...(trim === null
                  ? { planeTrimEndClaimed: false }
                  : endClaimed === true
                    ? { planeTrimEndClaimed: true }
                    : {}),
              }
          ),
        },
      }))
    ),
  addPane: () =>
    set(
      withHistory((s) => {
        const panes = s.project.panes ?? []
        const newPane = createDefaultPane(crypto.randomUUID())
        newPane.zIndex = panes.length
        if (panes.length === 0) {
          const legacy = getPlaneMedia(s.project)
          if (legacy) {
            newPane.media = legacy
            newPane.extrusionDepth = s.project.planeExtrusionDepth ?? 0
          }
        }
        return {
          project: {
            ...s.project,
            panes: [...panes, newPane],
          },
        }
      })
    ),
  addPaneWithMedia: (media) =>
    set(
      withHistory((s) => {
        const panes = s.project.panes ?? []
        const newPane = createDefaultPane(crypto.randomUUID())
        newPane.zIndex = panes.length
        newPane.media = media
        newPane.extrusionDepth = s.project.planeExtrusionDepth ?? 0
        return {
          project: {
            ...s.project,
            panes: [...panes, newPane],
          },
        }
      })
    ),
  removePane: (paneId) =>
    set(
      withHistory((s) => {
        const panes = (s.project.panes ?? []).filter((p) => p.id !== paneId)
        const scenes = s.project.scenes.map((sc) => {
          const trims = { ...(sc.paneTrims ?? {}) }
          delete trims[paneId]
          return { ...sc, paneTrims: Object.keys(trims).length ? trims : undefined }
        })
        return {
          project: {
            ...s.project,
            panes,
            scenes,
          },
        }
      })
    ),
  updatePane: (paneId, patch) =>
    set(
      withHistory((s) => ({
        project: {
          ...s.project,
          panes: (s.project.panes ?? []).map((p) =>
            p.id === paneId ? { ...p, ...patch } : p
          ),
        },
      }))
    ),
  reorderPanes: (fromIndex, toIndex) =>
    set(
      withHistory((s) => {
        const panes = [...(s.project.panes ?? [])]
        if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= panes.length || toIndex >= panes.length)
          return s
        const [removed] = panes.splice(fromIndex, 1)
        panes.splice(toIndex, 0, removed)
        const withZ = panes.map((p, i) => ({ ...p, zIndex: i }))
        return {
          project: { ...s.project, panes: withZ },
        }
      })
    ),
  setPaneTrim: (sceneIndex, paneId, trim, endClaimed) =>
    set(
      withHistory((s) => ({
        project: {
          ...s.project,
          scenes: s.project.scenes.map((sc, i) =>
            i !== sceneIndex
              ? sc
              : {
                ...sc,
                paneTrims: {
                  ...(sc.paneTrims ?? {}),
                  [paneId]: trim,
                },
                ...(trim === null
                  ? {}
                  : endClaimed === true
                    ? {}
                    : {}),
              }
          ),
        },
      }))
    ),
  addSceneText: (sceneIndex) =>
    set(
      withHistory((s) => {
        const scene = s.project.scenes[sceneIndex]
        if (!scene) return s
        const texts = scene.texts ?? []
        return {
          project: {
            ...s.project,
            scenes: s.project.scenes.map((sc, i) =>
              i === sceneIndex
                ? { ...sc, texts: [...texts, createDefaultSceneText(crypto.randomUUID())] }
                : sc
            ),
          },
        }
      })
    ),
  setFlyoverEnabled: (sceneIndex, enabled) =>
    set(
      withHistory((s) => ({
        project: {
          ...s.project,
          scenes: s.project.scenes.map((sc, i) =>
            i === sceneIndex && sc.flyover
              ? { ...sc, flyover: { ...sc.flyover, enabled } }
              : sc
          ),
        },
      }))
    ),
  addFlyoverKeyframe: (sceneIndex, keyframe) =>
    set(
      withHistory((s) => {
        const sc = s.project.scenes[sceneIndex]
        const flyover = sc?.flyover ?? { enabled: true, keyframes: [] }
        const keyframes = [...(flyover.keyframes ?? []), keyframe].sort((a, b) => a.time - b.time)
        return {
          project: {
            ...s.project,
            scenes: s.project.scenes.map((scene, i) =>
              i === sceneIndex
                ? { ...scene, flyover: { ...flyover, keyframes } }
                : scene
            ),
          },
        }
      })
    ),
  removeFlyoverKeyframe: (sceneIndex, index) =>
    set(
      withHistory((s) => {
        const sc = s.project.scenes[sceneIndex]
        const flyover = sc?.flyover
        if (!flyover?.keyframes?.length) return {}
        const keyframes = flyover.keyframes.filter((_, i) => i !== index)
        return {
          project: {
            ...s.project,
            scenes: s.project.scenes.map((scene, i) =>
              i === sceneIndex ? { ...scene, flyover: { ...flyover, keyframes } } : scene
            ),
          },
        }
      })
    ),
  updateFlyoverKeyframe: (sceneIndex, index, patch) =>
    set(
      withHistory((s) => {
        const sc = s.project.scenes[sceneIndex]
        const flyover = sc?.flyover
        if (!flyover?.keyframes?.[index]) return {}
        const keyframes = flyover.keyframes.map((k, i) =>
          i === index ? { ...k, ...patch } : k
        )
        if ('time' in patch && typeof patch.time === 'number') {
          keyframes.sort((a, b) => a.time - b.time)
        }
        return {
          project: {
            ...s.project,
            scenes: s.project.scenes.map((scene, i) =>
              i === sceneIndex ? { ...scene, flyover: { ...flyover, keyframes } } : scene
            ),
          },
        }
      })
    ),
  flyoverEditMode: true,
  setFlyoverEditMode: (v) => set({ flyoverEditMode: v, ...(v ? {} : { flyoverEditCamera: null }) }),
  setEffect: (sceneIndex, effectIndex, patch) =>
    set(
      withHistory((s) => ({
        project: {
          ...s.project,
          scenes: s.project.scenes.map((sc, i) =>
            i === sceneIndex
              ? {
                ...sc,
                effects: sc.effects.map((e, j) =>
                  j === effectIndex ? { ...e, ...patch } : e
                ),
              }
              : sc
          ),
        },
      }))
    ),
  setProjectDither: (patch) =>
    set(
      withHistory((s) => ({
        project: {
          ...s.project,
          dither: { ...(s.project.dither ?? DEFAULT_DITHER), ...patch },
        },
      }))
    ),
  setGlobalEffectTrack: (effectType, track) =>
    set(
      withHistory((s) => ({
        project: {
          ...s.project,
          globalEffects: {
            ...(s.project.globalEffects ?? {}),
            [effectType]: track ?? undefined,
          } as Project['globalEffects'],
        },
      }))
    ),
  addGlobalEffectKeyframe: (effectType, keyframe) =>
    set(
      withHistory((s) => {
        const prev = s.project.globalEffects?.[effectType]
        const keyframes = prev?.keyframes ?? []
        const next = [...keyframes, keyframe].sort((a, b) => a.time - b.time)
        return {
          project: {
            ...s.project,
            globalEffects: {
              ...(s.project.globalEffects ?? {}),
              [effectType]: {
                enabled: prev?.enabled ?? true,
                keyframes: next,
              },
            } as Project['globalEffects'],
          },
        }
      })
    ),
  removeGlobalEffectKeyframe: (effectType, index) =>
    set(
      withHistory((s) => {
        const prev = s.project.globalEffects?.[effectType]
        if (!prev?.keyframes?.length) return s
        const keyframes = prev.keyframes.filter((_, i) => i !== index)
        return {
          project: {
            ...s.project,
            globalEffects: {
              ...(s.project.globalEffects ?? {}),
              [effectType]:
                keyframes.length > 0
                  ? { enabled: prev.enabled, keyframes }
                  : undefined,
            } as Project['globalEffects'],
          },
        }
      })
    ),
  updateGlobalEffectKeyframe: (effectType, index, patch) =>
    set(
      withHistory((s) => {
        const prev = s.project.globalEffects?.[effectType]
        if (!prev?.keyframes?.[index]) return s
        let keyframes = prev.keyframes.map((k, i) =>
          i === index ? { ...k, ...patch } : k
        )
        if ('time' in patch) keyframes = [...keyframes].sort((a, b) => a.time - b.time)
        return {
          project: {
            ...s.project,
            globalEffects: {
              ...(s.project.globalEffects ?? {}),
              [effectType]: { enabled: prev.enabled, keyframes },
            } as Project['globalEffects'],
          },
        }
      })
    ),
  setGlobalEffectKeyframeAtTime: (effectType, time, patch) =>
    set(
      withHistory((s) => {
        const prev = s.project.globalEffects?.[effectType]
        const keyframes = [...(prev?.keyframes ?? [])]
        const TIME_EPS = 0.001
        const idx = keyframes.findIndex((k) => Math.abs(k.time - time) < TIME_EPS)
        const defaultKf = { ...DEFAULT_GLOBAL_KEYFRAMES[effectType], time } as GlobalEffectKeyframe
        if (idx >= 0) {
          keyframes[idx] = { ...keyframes[idx], ...patch } as GlobalEffectKeyframe
        } else {
          keyframes.push({ ...defaultKf, ...patch, time } as GlobalEffectKeyframe)
          keyframes.sort((a, b) => a.time - b.time)
        }
        return {
          project: {
            ...s.project,
            globalEffects: {
              ...(s.project.globalEffects ?? {}),
              [effectType]: {
                enabled: prev?.enabled ?? true,
                keyframes,
              },
            } as Project['globalEffects'],
          },
        }
      })
    ),
  setGlobalEffectParams: (effectType, params) =>
    set((s) => {
      const prev = s.project.globalEffects?.[effectType]
      if (!prev) return s
      return {
        project: {
          ...s.project,
          globalEffects: {
            ...(s.project.globalEffects ?? {}),
            [effectType]: { ...prev, params },
          } as Project['globalEffects'],
        },
      }
    }),
  resetProject: () =>
    set({
      project: getInitialProject(),
      currentSceneIndex: 0,
      currentTime: 0,
      historyPast: [],
      historyFuture: [],
    }),
  trimScrub: null,
  setTrimScrub: (value) => set({ trimScrub: value }),
  trimEditorOpen: null,
  setTrimEditorOpen: (v) => set({ trimEditorOpen: v }),
  flyoverEditCamera: null,
  setFlyoverEditCamera: (v) => set({ flyoverEditCamera: v }),
  flyoverJumpToStart: false,
  setFlyoverJumpToStart: (v) => set({ flyoverJumpToStart: v }),
  timelineShowAutomation: false,
  setTimelineShowAutomation: (v) => set({ timelineShowAutomation: v }),
  projectFps: 30,
  setProjectFps: (fps) => set({ projectFps: Math.max(1, Math.min(120, Math.round(fps))) }),
}))
