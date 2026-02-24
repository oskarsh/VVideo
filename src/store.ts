import { create } from 'zustand'
import type { Project, Scene, FlyoverKeyframe, SceneEffectDither } from '@/types'
import { createDefaultProject, createDefaultScene, DEFAULT_DITHER } from '@/types'

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
  /** Export output height in pixels (e.g. 480, 720, 1080). Used when isExporting. */
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
  setProjectPlaneVideo: (url: string | null) => void
  setBackgroundTrim: (sceneIndex: number, trim: { start: number; end: number } | null, endClaimed?: boolean) => void
  setPlaneTrim: (sceneIndex: number, trim: { start: number; end: number } | null, endClaimed?: boolean) => void
  setFlyoverEnabled: (sceneIndex: number, enabled: boolean) => void
  setFlyoverKeyframes: (sceneIndex: number, start: FlyoverKeyframe, end: FlyoverKeyframe) => void
  flyoverEditMode: boolean
  setFlyoverEditMode: (v: boolean) => void
  setEffect: (sceneIndex: number, effectIndex: number, patch: object) => void
  setProjectDither: (patch: Partial<SceneEffectDither>) => void
  resetProject: () => void
  /** When trim editor is open: which video is being edited and time to show in main canvas. */
  trimScrub: { video: 'background' | 'plane'; time: number } | null
  setTrimScrub: (value: { video: 'background' | 'plane'; time: number } | null) => void
  /** Current camera in flyover edit mode; used to show if Start/End buttons are "at" keyframe. */
  flyoverEditCamera: { position: [number, number, number]; rotation: [number, number, number]; fov: number } | null
  setFlyoverEditCamera: (v: { position: [number, number, number]; rotation: [number, number, number]; fov: number } | null) => void
  /** When true, canvas snaps camera to start keyframe once then clears. */
  flyoverJumpToStart: boolean
  setFlyoverJumpToStart: (v: boolean) => void
}

export const useStore = create<EditorState>((set) => ({
  project: createDefaultProject(),
  currentSceneIndex: 0,
  currentTime: 0,
  isPlaying: false,
  isExporting: false,
  loopCurrentScene: true,
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
        project: { ...s.project, backgroundVideoUrl: url },
      }))
    ),
  setProjectPlaneVideo: (url) =>
    set(
      withHistory((s) => ({
        project: { ...s.project, planeVideoUrl: url },
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
  setFlyoverKeyframes: (sceneIndex, start, end) =>
    set(
      withHistory((s) => ({
        project: {
          ...s.project,
          scenes: s.project.scenes.map((sc, i) =>
            i === sceneIndex && sc.flyover
              ? { ...sc, flyover: { ...sc.flyover, start, end } }
              : sc
          ),
        },
      }))
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
  resetProject: () =>
    set({
      project: createDefaultProject(),
      currentSceneIndex: 0,
      currentTime: 0,
      historyPast: [],
      historyFuture: [],
    }),
  trimScrub: null,
  setTrimScrub: (value) => set({ trimScrub: value }),
  flyoverEditCamera: null,
  setFlyoverEditCamera: (v) => set({ flyoverEditCamera: v }),
  flyoverJumpToStart: false,
  setFlyoverJumpToStart: (v) => set({ flyoverJumpToStart: v }),
}))
