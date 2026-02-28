import { useRef, useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { Play, Pause, Repeat, SkipForward, SkipBack, ChevronLeft, ChevronRight } from 'lucide-react'
import { useStore } from '@/store'
import { DEFAULT_GLOBAL_KEYFRAMES } from '@/lib/globalEffects'
import type { GlobalEffectKeyframeDither } from '@/types'
import { useLayout } from '@/context/LayoutContext'
import { EditorCanvas } from '@/components/EditorCanvas'
import { Sidebar } from '@/components/Sidebar'
import { RightSidebar } from '@/components/RightSidebar'
import { Timeline } from '@/components/Timeline'
import { ChangelogModal, useChangelog } from '@/components/ChangelogModal'
import { WelcomeModal, useWelcome } from '@/components/WelcomeModal'
import { AboutModal } from '@/components/AboutModal'
import { ProjectsDashboard } from '@/components/ProjectsDashboard'
import { saveCurrentProject } from '@/lib/storage/projectStorage'
import { TrimEditorSlot } from '@/components/TrimEditorSlot'
import { PerformanceOverlay } from '@/components/PerformanceOverlay'
import { ExportDialog } from '@/components/ExportDialog'
import { ScreenshotDialog } from '@/components/ScreenshotDialog'
import { VVideoLogo } from '@/components/VVideoLogo'
import { PresetDropdown } from '@/components/PresetDropdown'
import { StaticTextOverlay } from '@/components/StaticTextOverlay'
import { getPlaneMedia, getPanesForRender } from '@/types'
import { getFlyoverEditCamera } from '@/flyoverCameraRef'
import { getFlyoverKeyframes } from '@/lib/flyover'
import { FRAME_BY_FRAME_RESOLUTION_THRESHOLD, type ExportFormat } from '@/constants/export'
import { isWebCodecsSupported, WebCodecsRecorder } from '@/lib/exportWebCodecs'
import { waitForVideoSeeked } from '@/lib/exportVideoSync'

function isMediaDrag(e: React.DragEvent | DragEvent): boolean {
  if (!e.dataTransfer?.types.includes('Files')) return false
  const item = e.dataTransfer.items?.[0]
  if (item?.kind !== 'file') return false
  const t = item.type
  return t.startsWith('video/') || t.startsWith('image/')
}

function getPlaneMediaType(file: File): 'video' | 'image' {
  if (file.type.startsWith('video/')) return 'video'
  if (file.type.startsWith('image/')) return 'image'
  return 'image'
}

function MediaDropOverlay({
  onClose,
  onDrop,
}: {
  onClose: () => void
  onDrop: (file: File, type: 'background' | 'plane') => void
}) {
  const overlayRef = useRef<HTMLDivElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  const handleDragLeave = (e: React.DragEvent) => {
    const el = overlayRef.current
    if (!el) return
    const related = e.relatedTarget as Node | null
    if (related != null && el.contains(related)) return
    onClose()
  }

  const handleDrop = (e: React.DragEvent, type: 'background' | 'plane') => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file) {
      onClose()
      return
    }
    if (type === 'background' && !file.type.startsWith('video/')) return
    if (type === 'plane' && !file.type.startsWith('video/') && !file.type.startsWith('image/')) return
    onDrop(file, type)
    onClose()
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex bg-black/80 backdrop-blur-sm"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div
        className="flex-1 flex flex-col items-center justify-center gap-3 border-r border-white/20 bg-white/5 transition-colors hover:bg-white/10"
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, 'background')}
      >
        <span className="text-4xl opacity-60">▢</span>
        <span className="text-lg font-medium text-white/90">Background video</span>
        <span className="text-sm text-white/60">Drop video here</span>
      </div>
      <div
        className="flex-1 flex flex-col items-center justify-center gap-3 border-l border-white/20 bg-white/5 transition-colors hover:bg-white/10"
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, 'plane')}
      >
        <span className="text-4xl opacity-60">▢</span>
        <span className="text-lg font-medium text-white/90">Panel</span>
        <span className="text-sm text-white/60">Drop video or image here</span>
      </div>
    </div>
  )
}

function PlaybackLoop() {
  const isPlaying = useStore((s) => s.isPlaying)
  const currentSceneIndex = useStore((s) => s.currentSceneIndex)
  const setCurrentTime = useStore((s) => s.setCurrentTime)
  const setCurrentSceneIndex = useStore((s) => s.setCurrentSceneIndex)
  const setPlaying = useStore((s) => s.setPlaying)
  const scenes = useStore((s) => s.project.scenes)
  const scene = scenes[currentSceneIndex]
  const sceneStartTime = scenes
    .slice(0, currentSceneIndex)
    .reduce((acc, s) => acc + s.durationSeconds, 0)
  const rafRef = useRef<number>(0)
  const lastRef = useRef(0)

  useEffect(() => {
    if (!isPlaying || !scene) return
    const tick = (now: number) => {
      const state = useStore.getState()
      if (state.isFrameByFrameExporting) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }
      const dt = (now - lastRef.current) / 1000
      lastRef.current = now
      const time = state.currentTime
      const sceneStart = state.project.scenes
        .slice(0, state.currentSceneIndex)
        .reduce((acc, s) => acc + s.durationSeconds, 0)
      const curScene = state.project.scenes[state.currentSceneIndex]
      const localTime = time - sceneStart + dt
      if (localTime >= curScene.durationSeconds) {
        if (state.loopCurrentScene && !state.isExporting) {
          setCurrentTime(sceneStart)
        } else if (state.currentSceneIndex < state.project.scenes.length - 1) {
          setCurrentSceneIndex(state.currentSceneIndex + 1)
          setCurrentTime(sceneStart + curScene.durationSeconds)
        } else if (state.isExporting) {
          setPlaying(false)
        } else {
          setCurrentTime(0)
          setCurrentSceneIndex(0)
        }
      } else {
        setCurrentTime(time + dt)
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    lastRef.current = performance.now()
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [isPlaying, currentSceneIndex, scene, sceneStartTime, scenes, setCurrentTime, setCurrentSceneIndex, setPlaying])

  return null
}

function SpacebarPlayback() {
  const setPlaying = useStore((s) => s.setPlaying)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return
      e.preventDefault()
      const isPlaying = useStore.getState().isPlaying
      setPlaying(!isPlaying)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [setPlaying])

  return null
}

function UndoRedoKeys() {
  const undo = useStore((s) => s.undo)
  const redo = useStore((s) => s.redo)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return
      const isMac = /Mac/.test(navigator.userAgent)
      const mod = isMac ? e.metaKey : e.ctrlKey
      if (!mod || e.code !== 'KeyZ') return
      e.preventDefault()
      if (e.shiftKey) redo()
      else undo()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [undo, redo])

  return null
}

function CanvasStaticTextOverlay() {
  const project = useStore((s) => s.project)
  const currentSceneIndex = useStore((s) => s.currentSceneIndex)
  const isExporting = useStore((s) => s.isExporting)
  const exportHeight = useStore((s) => s.exportHeight)
  const [w, h] = project.aspectRatio
  const aspect = w / h
  const height = isExporting ? exportHeight : 480
  const width = Math.round(height * aspect)
  const scene = project.scenes[currentSceneIndex]
  const texts = scene?.texts ?? []
  return <StaticTextOverlay width={width} height={height} texts={texts} />
}

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const { setPreviewRef, setContentRef } = useLayout()
  const flyoverEditMode = useStore((s) => s.flyoverEditMode)
  const [showDropOverlay, setShowDropOverlay] = useState(false)
  const changelog = useChangelog()
  const welcome = useWelcome()
  const [aboutOpen, setAboutOpen] = useState(false)
  const [dashboardOpen, setDashboardOpen] = useState(false)
  const currentSceneIndex = useStore((s) => s.currentSceneIndex)
  const setProjectBackgroundVideo = useStore((s) => s.setProjectBackgroundVideo)
  const setBackgroundTrim = useStore((s) => s.setBackgroundTrim)
  const addPaneWithMedia = useStore((s) => s.addPaneWithMedia)
  const project = useStore((s) => s.project)

  useEffect(() => {
    setContentRef(contentRef.current)
    return () => setContentRef(null)
  }, [setContentRef])

  // Auto-save: debounce 800ms on every project change
  useEffect(() => {
    const timer = setTimeout(() => {
      const canvas = document.querySelector('[data-canvas-root] canvas') as HTMLCanvasElement | null
      saveCurrentProject(project, canvas)
    }, 800)
    return () => clearTimeout(timer)
  }, [project])

  /** SCREENSHOT_PROTOTYPE: when ?screenshot=2.0.8, add keyframes so timeline shows keyframe lane */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const version = params.get('screenshot')
    if (version !== '2.0.8') return
    const { setGlobalEffectTrack } = useStore.getState()
    const def = DEFAULT_GLOBAL_KEYFRAMES.dither as GlobalEffectKeyframeDither
    const kf1: GlobalEffectKeyframeDither = { ...def, time: 0 }
    const kf2: GlobalEffectKeyframeDither = { ...def, time: 1.5 }
    setGlobalEffectTrack('dither', { enabled: true, keyframes: [kf1, kf2] })
  }, [])
  useEffect(() => {
    setPreviewRef(previewRef.current)
    return () => setPreviewRef(null)
  }, [setPreviewRef])

  const handleBackgroundDragOver = (e: React.DragEvent) => {
    if (isMediaDrag(e)) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
      setShowDropOverlay(true)
    }
  }

  const handleDropOverlayDrop = (file: File, type: 'background' | 'plane') => {
    if (type === 'background') {
      const oldUrl = project.backgroundVideoUrl
      if (oldUrl?.startsWith('blob:')) URL.revokeObjectURL(oldUrl)
      const url = URL.createObjectURL(file)
      setProjectBackgroundVideo(url)
      setBackgroundTrim(currentSceneIndex, null)
    } else {
      const url = URL.createObjectURL(file)
      const mediaType = getPlaneMediaType(file)
      addPaneWithMedia(mediaType === 'video' ? { type: 'video', url } : { type: 'image', url })
    }
    setShowDropOverlay(false)
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-screen"
      onDragOver={handleBackgroundDragOver}
    >
      {showDropOverlay && (
        <MediaDropOverlay
          onClose={() => setShowDropOverlay(false)}
          onDrop={handleDropOverlayDrop}
        />
      )}
      <WelcomeModal open={welcome.show} onClose={welcome.close} />
      <ChangelogModal
        open={changelog.show}
        onClose={changelog.close}
      />
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
      <ProjectsDashboard open={dashboardOpen} onClose={() => setDashboardOpen(false)} />
      <PerformanceOverlay />
      <TrimEditorSlot />
      <PlaybackLoop />
      <SpacebarPlayback />
      <UndoRedoKeys />
      <header className="flex items-center justify-between px-3 py-2 lg:px-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <VVideoLogo className="h-6 text-white" />
          <button
            type="button"
            onClick={() => setDashboardOpen(true)}
            className="text-xs text-white/50 hover:text-white/80 transition-colors"
          >
            Projects
          </button>
          <button
            type="button"
            onClick={changelog.open}
            className="text-xs text-white/50 hover:text-white/80 transition-colors"
          >
            Changelog
          </button>
          <button
            type="button"
            onClick={() => setAboutOpen(true)}
            className="text-xs text-white/50 hover:text-white/80 transition-colors"
          >
            About
          </button>
        </div>
        <div className="flex items-center gap-2">
          <PresetDropdown />
          <UndoRedoButtons />
          <ResetProjectButton />
          <ScreenshotButton />
          <ExportButton />
        </div>
      </header>
      <div className="flex flex-1 min-h-0">
        <aside className="w-56 lg:w-64 xl:w-72 border-r border-white/10 overflow-y-auto shrink-0">
          <Sidebar />
        </aside>
        <main
          ref={contentRef}
          className="flex-1 flex flex-col items-center justify-center gap-3 p-3 min-h-0 relative lg:gap-4 lg:p-4"
        >
          <div
            ref={previewRef}
            data-canvas-root
            className="relative rounded-lg overflow-hidden"
            style={flyoverEditMode ? { pointerEvents: 'none' } : undefined}
          >
            <div className="relative" style={flyoverEditMode ? { pointerEvents: 'auto' } : undefined}>
              <EditorCanvas />
              <CanvasStaticTextOverlay />
            </div>
          </div>
          <FloatingTransportBar />
        </main>
        <aside className="w-56 lg:w-64 xl:w-72 border-l border-white/10 overflow-y-auto shrink-0 bg-zinc-900/30">
          <RightSidebar />
        </aside>
      </div>
      <div className="shrink-0 min-w-0 border-t border-white/10">
        <Timeline />
      </div>
    </div>
  )
}

const KEYFRAME_SNAP_EPS = 0.008

function FloatingTransportBar() {
  const project = useStore((s) => s.project)
  const currentSceneIndex = useStore((s) => s.currentSceneIndex)
  const currentTime = useStore((s) => s.currentTime)
  const setCurrentTime = useStore((s) => s.setCurrentTime)
  const setCurrentSceneIndex = useStore((s) => s.setCurrentSceneIndex)
  const setPlaying = useStore((s) => s.setPlaying)
  const isPlaying = useStore((s) => s.isPlaying)
  const loopCurrentScene = useStore((s) => s.loopCurrentScene)
  const setLoopCurrentScene = useStore((s) => s.setLoopCurrentScene)
  const flyoverEditCamera = useStore((s) => s.flyoverEditCamera)
  const flyoverEditMode = useStore((s) => s.flyoverEditMode)
  const addFlyoverKeyframe = useStore((s) => s.addFlyoverKeyframe)
  const updateFlyoverKeyframe = useStore((s) => s.updateFlyoverKeyframe)
  const setSelectedCameraKeyframe = useStore((s) => s.setSelectedCameraKeyframe)
  const scene = project.scenes[currentSceneIndex]
  const sceneStarts = project.scenes.reduce<number[]>(
    (acc, s, i) => [...acc, (acc[i] ?? 0) + s.durationSeconds],
    [0]
  )
  const sceneStart = sceneStarts[currentSceneIndex] ?? 0
  const sceneDuration = scene?.durationSeconds ?? 0
  const sceneLocalTime = Math.max(0, Math.min(sceneDuration, currentTime - sceneStart))
  const normalizedTime = sceneDuration > 0 ? sceneLocalTime / sceneDuration : 0
  const keyframes = scene ? getFlyoverKeyframes(scene) : []
  const hasKeyframes = keyframes.length > 0
  const isOnKeyframe = hasKeyframes && keyframes.some((kf) => Math.abs(kf.time - normalizedTime) < KEYFRAME_SNAP_EPS)

  const scenesCount = project.scenes.length
  const hasMultipleScenes = scenesCount > 1
  const canGoNextScene = currentSceneIndex < scenesCount - 1

  const jumpToNextScene = () => {
    if (!canGoNextScene) return
    const next = currentSceneIndex + 1
    setCurrentSceneIndex(next)
    setCurrentTime(sceneStarts[next] ?? 0)
    setPlaying(false)
  }

  const jumpToSceneStart = () => {
    setCurrentTime(sceneStarts[currentSceneIndex] ?? 0)
    setPlaying(false)
  }

  // Camera keyframes for current scene only (normalized 0..1)
  const sceneKeyframes = keyframes
  const canPrevKeyframe = hasKeyframes && sceneKeyframes.some((kf) => kf.time < normalizedTime - KEYFRAME_SNAP_EPS)
  const canNextKeyframe = hasKeyframes && sceneKeyframes.some((kf) => kf.time > normalizedTime + KEYFRAME_SNAP_EPS)

  const jumpToPrevKeyframe = () => {
    if (!canPrevKeyframe || !scene) return
    const prev = [...sceneKeyframes].reverse().find((kf) => kf.time < normalizedTime - KEYFRAME_SNAP_EPS)
    if (!prev) return
    const projectTime = sceneStart + prev.time * sceneDuration
    setCurrentTime(projectTime)
    setCurrentSceneIndex(currentSceneIndex)
    setPlaying(false)
    setSelectedCameraKeyframe({ sceneIndex: currentSceneIndex, time: projectTime })
  }

  const jumpToNextKeyframe = () => {
    if (!canNextKeyframe || !scene) return
    const next = sceneKeyframes.find((kf) => kf.time > normalizedTime + KEYFRAME_SNAP_EPS)
    if (!next) return
    const projectTime = sceneStart + next.time * sceneDuration
    setCurrentTime(projectTime)
    setCurrentSceneIndex(currentSceneIndex)
    setPlaying(false)
    setSelectedCameraKeyframe({ sceneIndex: currentSceneIndex, time: projectTime })
  }

  const handleSetKeyframe = () => {
    const cam = getFlyoverEditCamera()
    if (!cam) return
    const clampedTime = Math.max(0, Math.min(1, normalizedTime))
    const existingIdx = keyframes.findIndex((kf) => Math.abs(kf.time - clampedTime) < KEYFRAME_SNAP_EPS)
    if (existingIdx >= 0) {
      updateFlyoverKeyframe(currentSceneIndex, existingIdx, {
        position: [...cam.position],
        rotation: [...cam.rotation],
        fov: cam.fov,
      })
    } else {
      addFlyoverKeyframe(currentSceneIndex, {
        time: clampedTime,
        position: [...cam.position],
        rotation: [...cam.rotation],
        fov: cam.fov,
      })
    }
  }

  const [x, y, z] = flyoverEditCamera?.position ?? [0, 0, 2]
  const fmt = (n: number) => n.toFixed(2)

  const btnClass =
    'w-9 h-9 rounded-md flex items-center justify-center text-sm bg-white/10 hover:bg-white/20 text-white/90 disabled:opacity-50 disabled:pointer-events-none'
  const btnActiveClass = 'bg-white/20 text-white'

  return (
    <div
      className="flex flex-wrap items-center justify-center gap-2 w-full max-w-2xl mx-auto px-3 py-2 rounded-lg border border-white/10 bg-zinc-900/95 shadow-xl lg:max-w-3xl lg:px-4 lg:py-3"
      role="toolbar"
      aria-label="Playback and camera"
    >
      <button
        type="button"
        onClick={() => setPlaying(!isPlaying)}
        className={btnClass}
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </button>
      <button
        type="button"
        onClick={() => setLoopCurrentScene(!loopCurrentScene)}
        className={`${btnClass} ${loopCurrentScene ? btnActiveClass : 'text-white/60'}`}
        title={loopCurrentScene ? 'Loop current scene (on)' : 'Loop current scene (off)'}
      >
        <Repeat className="w-4 h-4" />
      </button>
      {hasMultipleScenes && (
        <button
          type="button"
          onClick={jumpToNextScene}
          disabled={!canGoNextScene}
          className={btnClass}
          title="Jump to next scene"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      )}
      <button
        type="button"
        onClick={jumpToSceneStart}
        className={btnClass}
        title="Jump to start of current scene"
      >
        <SkipBack className="w-4 h-4" />
      </button>

      {scene?.flyover && (
        <>
          <div className="w-px h-6 bg-white/10" aria-hidden />
          {hasKeyframes && (
            <>
              <button
                type="button"
                onClick={jumpToPrevKeyframe}
                disabled={!canPrevKeyframe}
                className={btnClass}
                title="Previous camera keyframe"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={jumpToNextKeyframe}
                disabled={!canNextKeyframe}
                className={btnClass}
                title="Next camera keyframe"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={handleSetKeyframe}
            disabled={!flyoverEditMode}
            title={flyoverEditMode ? 'Set camera keyframe at playhead' : 'Enable fly-around to add keyframes'}
            className="flex items-center justify-center gap-2 rounded-md py-2 px-3 text-xs font-medium text-white/80 bg-white/10 hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <span
              className="h-2 w-2 rounded-full shrink-0 transition-colors"
              style={{
                backgroundColor: isOnKeyframe ? '#F6F572' : hasKeyframes ? 'rgba(246,245,114,0.6)' : 'rgba(255,255,255,0.4)',
              }}
              title={isOnKeyframe ? 'Playhead on a keyframe' : hasKeyframes ? 'Scene has keyframes' : 'No keyframes yet'}
            />
            Set keyframe
          </button>
        </>
      )}

      <div className="flex items-center gap-2 text-white/50 ml-auto" title="Camera position (x, y, z)">
        <svg
          className="h-4 w-4 shrink-0 opacity-70"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
        <span className="font-mono text-xs tabular-nums">
          {fmt(x)}, {fmt(y)}, {fmt(z)}
        </span>
      </div>
    </div>
  )
}

function UndoRedoButtons() {
  const undo = useStore((s) => s.undo)
  const redo = useStore((s) => s.redo)
  const canUndo = useStore((s) => (s.historyPast?.length ?? 0) > 0)
  const canRedo = useStore((s) => (s.historyFuture?.length ?? 0) > 0)

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={undo}
        disabled={!canUndo}
        className="px-2.5 py-1.5 rounded-md text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Undo (Ctrl+Z)"
      >
        Undo
      </button>
      <button
        type="button"
        onClick={redo}
        disabled={!canRedo}
        className="px-2.5 py-1.5 rounded-md text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Redo (Ctrl+Shift+Z)"
      >
        Redo
      </button>
    </div>
  )
}

function ResetProjectButton() {
  const resetProject = useStore((s) => s.resetProject)

  const handleReset = () => {
    if (window.confirm('Reset entire project? All scenes and videos will be cleared.')) {
      resetProject()
    }
  }

  return (
    <button
      type="button"
      onClick={handleReset}
      className="px-3 py-1.5 rounded-md text-sm font-medium text-white/80 hover:text-white hover:bg-white/10"
      title="Clear all and start over"
    >
      Reset project
    </button>
  )
}

function sceneIndexAtTime(scenes: { durationSeconds: number }[], t: number): number {
  let acc = 0
  for (let i = 0; i < scenes.length; i++) {
    if (t < acc + scenes[i].durationSeconds) return i
    acc += scenes[i].durationSeconds
  }
  return Math.max(0, scenes.length - 1)
}

function ExportButton() {
  const isExporting = useStore((s) => s.isExporting)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [framerate, setFramerate] = useState(30)
  const [bitrate, setBitrate] = useState(8_000_000)
  const [content, setContent] = useState<'full' | 'plane-only'>('full')
  const [resolution, setResolution] = useState(720)
  const [frameByFrame, setFrameByFrame] = useState(false)
  const [exportPerScene, setExportPerScene] = useState(false)
  const [format, setFormat] = useState<ExportFormat>('webm')
  useEffect(() => {
    if (content === 'plane-only' && format === 'mp4') setFormat('webm')
  }, [content, format])
  const setExporting = useStore((s) => s.setExporting)
  const setExportRenderMode = useStore((s) => s.setExportRenderMode)
  const setExportHeight = useStore((s) => s.setExportHeight)
  const setPlaying = useStore((s) => s.setPlaying)
  const project = useStore((s) => s.project)
  const setCurrentTime = useStore((s) => s.setCurrentTime)
  const setCurrentSceneIndex = useStore((s) => s.setCurrentSceneIndex)
  const setFrameByFrameExporting = useStore((s) => s.setFrameByFrameExporting)
  const hasPlaneMedia = !!getPlaneMedia(project)

  const runExport = async () => {
    setExportRenderMode(content)
    setExportHeight(resolution)
    setExporting(true)
    setExportDialogOpen(false)
    const isPlaneOnly = content === 'plane-only'
    let useFrameByFrame = resolution >= FRAME_BY_FRAME_RESOLUTION_THRESHOLD || frameByFrame
    setPlaying(true)
    try {
      await new Promise((r) => setTimeout(r, 100))
      const canvasEl = document.querySelector('[data-canvas-root] canvas') as HTMLCanvasElement | null
      if (!canvasEl) return

      const suffix = isPlaneOnly ? '-panel' : ''
      const baseName = project.name || 'export'

      // Number of video elements that need to seek each frame (used for seek-wait).
      const videoCount = (project.backgroundVideoUrl ? 1 : 0) +
        getPanesForRender(project).filter((p) => p.media?.type === 'video').length

      const rafCount = 2
      const waitForRender = () =>
        new Promise<void>((r) => {
          let n = 0
          const next = () => {
            n++
            if (n >= rafCount) r()
            else requestAnimationFrame(next)
          }
          requestAnimationFrame(next)
        })

      const downloadBlob = (blob: Blob, name: string) => {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = name
        a.click()
        setTimeout(() => URL.revokeObjectURL(a.href), 1000)
      }

      // ── WebCodecs path ────────────────────────────────────────────────────────
      // Uses VideoEncoder with explicit per-frame timestamps so output duration
      // always matches content duration regardless of render/seek latency.
      // waitForVideoSeeked() is re-enabled here to keep plane/bg video synced.
      const useWebCodecs = useFrameByFrame && !isPlaneOnly && isWebCodecsSupported()

      if (useWebCodecs) {
        setFrameByFrameExporting(true)

        // Per-frame advancement + seek-wait helper.
        const advanceFrame = async (t: number) => {
          const { promise: seekedPromise } = waitForVideoSeeked(videoCount)
          flushSync(() => {
            setCurrentSceneIndex(sceneIndexAtTime(project.scenes, t))
            setCurrentTime(t)
          })
          await waitForRender()
          if (videoCount > 0) await seekedPromise
        }

        if (exportPerScene && project.scenes.length > 1) {
          let sceneStartTime = 0
          for (let s = 0; s < project.scenes.length; s++) {
            const scene = project.scenes[s]
            const wc = await WebCodecsRecorder.create(canvasEl.width, canvasEl.height, framerate, bitrate, format)
            if (!wc) throw new Error('WebCodecs recorder unavailable for scene ' + s)
            const segFrames = Math.ceil(scene.durationSeconds * framerate)
            for (let i = 0; i < segFrames; i++) {
              const t = sceneStartTime + Math.min(i / framerate, scene.durationSeconds)
              await advanceFrame(t)
              wc.captureFrame(canvasEl, i)
            }
            const blob = await wc.finish()
            downloadBlob(blob, `${baseName}${suffix}-scene-${s + 1}${wc.fileExt}`)
            sceneStartTime += scene.durationSeconds
          }
        } else {
          const totalDuration = project.scenes.reduce((acc, s) => acc + s.durationSeconds, 0)
          const wc = await WebCodecsRecorder.create(canvasEl.width, canvasEl.height, framerate, bitrate, format)
          if (!wc) throw new Error('WebCodecs recorder unavailable')
          const totalFrames = Math.ceil(totalDuration * framerate)
          for (let i = 0; i < totalFrames; i++) {
            const t = Math.min(i / framerate, totalDuration)
            await advanceFrame(t)
            wc.captureFrame(canvasEl, i)
          }
          const blob = await wc.finish()
          downloadBlob(blob, `${baseName}${suffix}${wc.fileExt}`)
        }
        return
      }

      // ── MediaRecorder fallback ────────────────────────────────────────────────
      // Used for plane-only (alpha) exports and browsers without VideoEncoder.
      // No seek-wait: output duration is driven by wall-clock delivery timing.
      if (useFrameByFrame) {
        const testStream = canvasEl.captureStream(0)
        const testTrack = testStream.getVideoTracks()[0] as { requestFrame?: () => void } | undefined
        if (typeof testTrack?.requestFrame !== 'function') useFrameByFrame = false
        testStream.getTracks().forEach((t) => t.stop())
      }
      if (useFrameByFrame) setFrameByFrameExporting(true)

      const stream = canvasEl.captureStream(useFrameByFrame ? 0 : framerate)
      const captureTrack = useFrameByFrame
        ? (stream.getVideoTracks()[0] as { requestFrame?: () => void })
        : undefined
      const useMp4 = format === 'mp4' && !isPlaneOnly && MediaRecorder.isTypeSupported('video/mp4')
      const mime = useMp4
        ? 'video/mp4'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm'
      const ext = useMp4 ? '.mp4' : '.webm'
      const frameDurationMs = 1000 / framerate

      const recordSegment = async (
        startTime: number,
        durationSeconds: number,
        downloadName: string,
        track: { requestFrame?: () => void } | undefined
      ): Promise<void> => {
        setCurrentSceneIndex(sceneIndexAtTime(project.scenes, startTime))
        setCurrentTime(startTime)
        await new Promise((r) => setTimeout(r, 50))
        const recorder = new MediaRecorder(stream, {
          mimeType: mime,
          videoBitsPerSecond: bitrate,
          audioBitsPerSecond: 0,
        })
        const chunks: Blob[] = []
        recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data)
        recorder.start(100)
        if (useFrameByFrame) {
          const segmentFrames = Math.ceil(durationSeconds * framerate)
          for (let i = 0; i < segmentFrames; i++) {
            const frameStart = performance.now()
            const t = startTime + Math.min(i / framerate, durationSeconds)
            flushSync(() => {
              setCurrentSceneIndex(sceneIndexAtTime(project.scenes, t))
              setCurrentTime(t)
            })
            await waitForRender()
            track?.requestFrame?.()
            const elapsed = performance.now() - frameStart
            const wait = Math.max(0, frameDurationMs - elapsed)
            if (wait > 0) await new Promise((r) => setTimeout(r, wait))
          }
        } else {
          await new Promise((r) => setTimeout(r, durationSeconds * 1000 + 500))
        }
        recorder.stop()
        await new Promise<void>((resolve) => {
          recorder.onstop = () => {
            downloadBlob(new Blob(chunks, { type: mime }), downloadName)
            resolve()
          }
        })
      }

      if (exportPerScene && project.scenes.length > 1) {
        let sceneStartTime = 0
        for (let i = 0; i < project.scenes.length; i++) {
          const scene = project.scenes[i]
          await recordSegment(
            sceneStartTime,
            scene.durationSeconds,
            `${baseName}${suffix}-scene-${i + 1}${ext}`,
            captureTrack
          )
          sceneStartTime += scene.durationSeconds
        }
      } else {
        setCurrentSceneIndex(0)
        setCurrentTime(0)
        const totalDuration = project.scenes.reduce((acc, s) => acc + s.durationSeconds, 0)
        const recorder = new MediaRecorder(stream, {
          mimeType: mime,
          videoBitsPerSecond: bitrate,
          audioBitsPerSecond: 0,
        })
        const chunks: Blob[] = []
        recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data)
        recorder.start(100)
        if (useFrameByFrame) {
          const totalFrames = Math.ceil(totalDuration * framerate)
          for (let i = 0; i < totalFrames; i++) {
            const frameStart = performance.now()
            const t = Math.min(i / framerate, totalDuration)
            flushSync(() => {
              setCurrentSceneIndex(sceneIndexAtTime(project.scenes, t))
              setCurrentTime(t)
            })
            await waitForRender()
            captureTrack?.requestFrame?.()
            const elapsed = performance.now() - frameStart
            const wait = Math.max(0, frameDurationMs - elapsed)
            if (wait > 0) await new Promise((r) => setTimeout(r, wait))
          }
        } else {
          await new Promise((r) => setTimeout(r, totalDuration * 1000 + 500))
        }
        recorder.stop()
        await new Promise<void>((resolve) => {
          recorder.onstop = () => {
            downloadBlob(new Blob(chunks, { type: mime }), `${baseName}${suffix}${ext}`)
            resolve()
          }
        })
      }
    } finally {
      setExporting(false)
      setExportRenderMode('full')
      setPlaying(false)
      setFrameByFrameExporting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setExportDialogOpen(true)}
        disabled={isExporting}
        className="px-3 py-1.5 rounded-md bg-white text-black text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
      >
        {isExporting ? 'Exporting…' : 'Export'}
      </button>
      {exportDialogOpen && (
        <ExportDialog
          open={exportDialogOpen}
          framerate={framerate}
          setFramerate={setFramerate}
          bitrate={bitrate}
          setBitrate={setBitrate}
          resolution={resolution}
          setResolution={setResolution}
          frameByFrame={frameByFrame}
          setFrameByFrame={setFrameByFrame}
          content={content}
          setContent={setContent}
          format={format}
          setFormat={setFormat}
          hasPlaneMedia={hasPlaneMedia}
          exportPerScene={exportPerScene}
          setExportPerScene={setExportPerScene}
          sceneCount={project.scenes.length}
          onClose={() => setExportDialogOpen(false)}
          onExport={runExport}
        />
      )}
    </>
  )
}

function ScreenshotButton() {
  const isExporting = useStore((s) => s.isExporting)
  const [screenshotDialogOpen, setScreenshotDialogOpen] = useState(false)
  const [scale, setScale] = useState(480)
  const [isCapturing, setIsCapturing] = useState(false)
  const setExporting = useStore((s) => s.setExporting)
  const setExportHeight = useStore((s) => s.setExportHeight)
  const project = useStore((s) => s.project)

  const captureScreenshot = async () => {
    if (isExporting) return
    setIsCapturing(true)
    setScreenshotDialogOpen(false)

    const needsResize = scale !== 480
    if (needsResize) {
      setExportHeight(scale)
      setExporting(true)
      await new Promise((r) => setTimeout(r, 150))
    }

    const canvas = document.querySelector('canvas')
    if (!canvas) {
      if (needsResize) {
        setExporting(false)
        setExportHeight(720)
      }
      setIsCapturing(false)
      return
    }

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          if (needsResize) {
            setExporting(false)
            setExportHeight(720)
          }
          setIsCapturing(false)
          return
        }
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `${project.name || 'screenshot'}.png`
        a.click()
        URL.revokeObjectURL(a.href)
        if (needsResize) {
          setExporting(false)
          setExportHeight(720)
        }
        setIsCapturing(false)
      },
      'image/png',
      1
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setScreenshotDialogOpen(true)}
        disabled={isExporting || isCapturing}
        className="px-3 py-1.5 rounded-md text-sm font-medium bg-white/10 text-white/80 hover:bg-white/20 disabled:opacity-50"
      >
        {isCapturing ? 'Capturing…' : 'Screenshot'}
      </button>
      {screenshotDialogOpen && (
        <ScreenshotDialog
          open={screenshotDialogOpen}
          onClose={() => setScreenshotDialogOpen(false)}
          scale={scale}
          setScale={setScale}
          onCapture={captureScreenshot}
          isCapturing={isCapturing}
        />
      )}
    </>
  )
}



