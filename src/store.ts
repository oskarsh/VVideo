import { create } from 'zustand'
import type { Project, Scene, FlyoverKeyframe, SceneEffectDither } from '@/types'
import { createDefaultProject, createDefaultScene, DEFAULT_DITHER } from '@/types'

interface EditorState {
  project: Project
  currentSceneIndex: number
  currentTime: number
  isPlaying: boolean
  isExporting: boolean
  loopCurrentScene: boolean
  /** Only used during export: 'full' = composite, 'plane-only' = transparent background */
  exportRenderMode: 'full' | 'plane-only'

  setProject: (p: Project | ((prev: Project) => Project)) => void
  setCurrentSceneIndex: (i: number) => void
  setCurrentTime: (t: number) => void
  setPlaying: (v: boolean) => void
  setExporting: (v: boolean) => void
  setLoopCurrentScene: (v: boolean) => void
  setExportRenderMode: (m: 'full' | 'plane-only') => void

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
}

export const useStore = create<EditorState>((set) => ({
  project: createDefaultProject(),
  currentSceneIndex: 0,
  currentTime: 0,
  isPlaying: false,
  isExporting: false,
  loopCurrentScene: true,
  exportRenderMode: 'full',

  setProject: (p) =>
    set((s) => ({
      project: typeof p === 'function' ? p(s.project) : p,
    })),
  setCurrentSceneIndex: (i) => set({ currentSceneIndex: i }),
  setCurrentTime: (t) => set({ currentTime: t }),
  setPlaying: (v) => set({ isPlaying: v }),
  setExporting: (v) => set({ isExporting: v }),
  setLoopCurrentScene: (v) => set({ loopCurrentScene: v }),
  setExportRenderMode: (m) => set({ exportRenderMode: m }),

  addScene: () =>
    set((s) => ({
      project: {
        ...s.project,
        scenes: [...s.project.scenes, createDefaultScene(crypto.randomUUID())],
      },
    })),
  addSceneAfter: (index) =>
    set((s) => {
      const newScene = createDefaultScene(crypto.randomUUID())
      const scenes = [...s.project.scenes]
      scenes.splice(index + 1, 0, newScene)
      return {
        project: { ...s.project, scenes },
        currentSceneIndex: index + 1,
      }
    }),
  removeScene: (index) =>
    set((s) => ({
      project: {
        ...s.project,
        scenes: s.project.scenes.filter((_, i) => i !== index),
      },
      currentSceneIndex: Math.max(0, Math.min(s.currentSceneIndex, s.project.scenes.length - 2)),
    })),
  duplicateScene: (index) =>
    set((s) => {
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
    }),
  reorderScenes: (fromIndex, toIndex) =>
    set((s) => {
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
    }),
  clearScene: (index) =>
    set((s) => ({
      project: {
        ...s.project,
        scenes: s.project.scenes.map((sc, i) =>
          i === index ? createDefaultScene(sc.id) : sc
        ),
      },
    })),
  updateScene: (index, patch) =>
    set((s) => ({
      project: {
        ...s.project,
        scenes: s.project.scenes.map((sc, i) => (i === index ? { ...sc, ...patch } : sc)),
      },
    })),
  setProjectAspectRatio: (ratio) =>
    set((s) => ({
      project: { ...s.project, aspectRatio: ratio },
    })),
  setProjectBackgroundVideo: (url) =>
    set((s) => ({
      project: { ...s.project, backgroundVideoUrl: url },
    })),
  setProjectPlaneVideo: (url) =>
    set((s) => ({
      project: { ...s.project, planeVideoUrl: url },
    })),
  setBackgroundTrim: (sceneIndex, trim, endClaimed) =>
    set((s) => ({
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
    })),
  setPlaneTrim: (sceneIndex, trim, endClaimed) =>
    set((s) => ({
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
    })),
  setFlyoverEnabled: (sceneIndex, enabled) =>
    set((s) => ({
      project: {
        ...s.project,
        scenes: s.project.scenes.map((sc, i) =>
          i === sceneIndex && sc.flyover
            ? { ...sc, flyover: { ...sc.flyover, enabled } }
            : sc
        ),
      },
    })),
  setFlyoverKeyframes: (sceneIndex, start, end) =>
    set((s) => ({
      project: {
        ...s.project,
        scenes: s.project.scenes.map((sc, i) =>
          i === sceneIndex && sc.flyover
            ? { ...sc, flyover: { ...sc.flyover, start, end } }
            : sc
        ),
      },
    })),
  flyoverEditMode: true,
  setFlyoverEditMode: (v) => set({ flyoverEditMode: v, ...(v ? {} : { flyoverEditCamera: null }) }),
  setEffect: (sceneIndex, effectIndex, patch) =>
    set((s) => ({
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
    })),
  setProjectDither: (patch) =>
    set((s) => ({
      project: {
        ...s.project,
        dither: { ...(s.project.dither ?? DEFAULT_DITHER), ...patch },
      },
    })),
  resetProject: () => set({ project: createDefaultProject(), currentSceneIndex: 0, currentTime: 0 }),
  trimScrub: null,
  setTrimScrub: (value) => set({ trimScrub: value }),
  flyoverEditCamera: null,
  setFlyoverEditCamera: (v) => set({ flyoverEditCamera: v }),
}))
