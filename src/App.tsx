import { useRef, useEffect, useState } from 'react'
import { useStore } from '@/store'
import { getFlyoverEditCamera } from '@/flyoverCameraRef'
import { EditorCanvas } from '@/components/EditorCanvas'
import { Sidebar } from '@/components/Sidebar'
import { RightSidebar } from '@/components/RightSidebar'
import { Timeline } from '@/components/Timeline'
import { ChangelogModal, useChangelog } from '@/components/ChangelogModal'
import { WelcomeModal, useWelcome } from '@/components/WelcomeModal'
import { AboutModal } from '@/components/AboutModal'
import { VVideoLogo } from '@/components/VVideoLogo'
import { StaticTextOverlay } from '@/components/StaticTextOverlay'
import { getPlaneMedia } from '@/types'

function isMediaDrag(e: React.DragEvent | DragEvent): boolean {
  if (!e.dataTransfer?.types.includes('Files')) return false
  const item = e.dataTransfer.items?.[0]
  if (item?.kind !== 'file') return false
  const t = item.type
  return t.startsWith('video/') || t.startsWith('image/') || t === 'image/svg+xml'
}

function getPlaneMediaType(file: File): 'video' | 'image' | 'svg' {
  if (file.type.startsWith('video/')) return 'video'
  if (file.type === 'image/svg+xml' || file.name?.toLowerCase().endsWith('.svg')) return 'svg'
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
    if (type === 'plane' && !file.type.startsWith('video/') && !file.type.startsWith('image/') && file.type !== 'image/svg+xml' && !file.name?.toLowerCase().endsWith('.svg')) return
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
        className="flex-1 flex flex-col items-center justify-center gap-3 border-r border-white/20 bg-white/5 transition-colors hover:bg-emerald-950/40"
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, 'background')}
      >
        <span className="text-4xl opacity-60">▢</span>
        <span className="text-lg font-medium text-white/90">Background video</span>
        <span className="text-sm text-white/60">Drop video here</span>
      </div>
      <div
        className="flex-1 flex flex-col items-center justify-center gap-3 border-l border-white/20 bg-white/5 transition-colors hover:bg-amber-950/40"
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, 'plane')}
      >
        <span className="text-4xl opacity-60">▢</span>
        <span className="text-lg font-medium text-white/90">Panel</span>
        <span className="text-sm text-white/60">Drop video, image or SVG here</span>
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
      const dt = (now - lastRef.current) / 1000
      lastRef.current = now
      const state = useStore.getState()
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
      const isMac = navigator.platform?.toLowerCase().startsWith('mac')
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
  const flyoverEditMode = useStore((s) => s.flyoverEditMode)
  const [showDropOverlay, setShowDropOverlay] = useState(false)
  const changelog = useChangelog()
  const welcome = useWelcome()
  const [aboutOpen, setAboutOpen] = useState(false)
  const currentSceneIndex = useStore((s) => s.currentSceneIndex)
  const setProjectBackgroundVideo = useStore((s) => s.setProjectBackgroundVideo)
  const setBackgroundTrim = useStore((s) => s.setBackgroundTrim)
  const setPlaneTrim = useStore((s) => s.setPlaneTrim)

  const setProjectPlaneMedia = useStore((s) => s.setProjectPlaneMedia)

  const handleBackgroundDragOver = (e: React.DragEvent) => {
    if (isMediaDrag(e)) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
      setShowDropOverlay(true)
    }
  }

  const handleDropOverlayDrop = (file: File, type: 'background' | 'plane') => {
    const url = URL.createObjectURL(file)
    if (type === 'background') {
      setProjectBackgroundVideo(url)
      setBackgroundTrim(currentSceneIndex, null)
    } else {
      const mediaType = getPlaneMediaType(file)
      setProjectPlaneMedia(mediaType === 'video' ? { type: 'video', url } : mediaType === 'svg' ? { type: 'svg', url } : { type: 'image', url })
      if (mediaType === 'video') setPlaneTrim(currentSceneIndex, null)
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
        release={changelog.release}
      />
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
      <PlaybackLoop />
      <SpacebarPlayback />
      <UndoRedoKeys />
      <header className="flex items-center justify-between px-4 py-2 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <VVideoLogo className="h-6 text-white" />
          <button
            type="button"
            onClick={changelog.open}
            className="text-xs text-white/50 hover:text-white/80 transition-colors"
          >
            What's new
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
          <UndoRedoButtons />
          <ResetProjectButton />
          <ExportButton />
        </div>
      </header>
      <div className="flex flex-1 min-h-0">
        <aside className="w-72 border-r border-white/10 overflow-y-auto shrink-0">
          <Sidebar />
        </aside>
        <main className="flex-1 flex flex-col items-center justify-center gap-4 p-4 min-h-0">
          <div
            className="relative rounded-lg overflow-hidden"
            style={flyoverEditMode ? { pointerEvents: 'none' } : undefined}
          >
            <div className="relative" style={flyoverEditMode ? { pointerEvents: 'auto' } : undefined}>
              <EditorCanvas />
              <CanvasStaticTextOverlay />
            </div>
          </div>
          <CameraKeyframeButtons />
        </main>
        <aside className="w-72 border-l border-white/10 overflow-y-auto shrink-0 bg-zinc-900/30">
          <RightSidebar />
        </aside>
      </div>
      <div className="shrink-0 border-t border-white/10">
        <Timeline />
      </div>
    </div>
  )
}

const CAMERA_MATCH_EPS = 2e-4
const FOV_MATCH_EPS = 1

function cameraMatchesKeyframe(
  cam: { position: [number, number, number]; rotation: [number, number, number]; fov: number } | null,
  kf: { position: [number, number, number]; rotation: [number, number, number]; fov?: number } | undefined
): boolean {
  if (!cam || !kf?.position) return false
  const [x, y, z] = cam.position
  const [kx, ky, kz] = kf.position
  if (Math.abs(x - kx) > CAMERA_MATCH_EPS || Math.abs(y - ky) > CAMERA_MATCH_EPS || Math.abs(z - kz) > CAMERA_MATCH_EPS) return false
  const [rx, ry, rz] = cam.rotation
  const [krx, kry, krz] = kf.rotation
  if (Math.abs(rx - krx) > CAMERA_MATCH_EPS || Math.abs(ry - kry) > CAMERA_MATCH_EPS || Math.abs(rz - krz) > CAMERA_MATCH_EPS) return false
  const kfFov = kf.fov ?? 50
  if (Math.abs(cam.fov - kfFov) > FOV_MATCH_EPS) return false
  return true
}

function CameraKeyframeButtons() {
  const currentSceneIndex = useStore((s) => s.currentSceneIndex)
  const scene = useStore((s) => s.project.scenes[currentSceneIndex])
  const flyoverEditMode = useStore((s) => s.flyoverEditMode)
  const flyoverEditCamera = useStore((s) => s.flyoverEditCamera)
  const setFlyoverKeyframes = useStore((s) => s.setFlyoverKeyframes)
  const setFlyoverJumpToStart = useStore((s) => s.setFlyoverJumpToStart)

  if (!scene?.flyover) return null
  const { start, end } = scene.flyover
  const defaultPos: [number, number, number] = [0, 0, 5]
  const defaultRot: [number, number, number] = [0, 0, 0]
  const hasStart = Boolean(
    start?.position &&
    (start.position[0] !== defaultPos[0] || start.position[1] !== defaultPos[1] || start.position[2] !== defaultPos[2] ||
      start.rotation.some((r, i) => r !== defaultRot[i]))
  )
  const hasEnd = Boolean(
    end?.position &&
    (end.position[0] !== defaultPos[0] || end.position[1] !== defaultPos[1] || end.position[2] !== defaultPos[2] ||
      end.rotation.some((r, i) => r !== defaultRot[i]))
  )
  const atStartPosition = flyoverEditMode && hasStart && cameraMatchesKeyframe(flyoverEditCamera, start)
  const atEndPosition = flyoverEditMode && hasEnd && cameraMatchesKeyframe(flyoverEditCamera, end)

  const handleSetStart = () => {
    const cam = getFlyoverEditCamera()
    if (!cam) return
    setFlyoverKeyframes(currentSceneIndex, {
      position: [...cam.position],
      rotation: [...cam.rotation],
      fov: cam.fov,
    }, end)
  }

  const handleSetEnd = () => {
    const cam = getFlyoverEditCamera()
    if (!cam) return
    setFlyoverKeyframes(currentSceneIndex, start, {
      position: [...cam.position],
      rotation: [...cam.rotation],
      fov: cam.fov,
    })
  }

  const accent = '#F6F572'

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={handleSetStart}
        disabled={!flyoverEditMode}
        title={flyoverEditMode ? 'Set current view as start keyframe' : 'Enable fly-around first'}
        className="flex flex-1 min-w-0 max-w-xs items-center justify-center gap-2 rounded-full border-2 py-2 px-5 text-sm font-medium text-white/80 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 bg-white/10 hover:bg-white/15 disabled:hover:bg-white/10 whitespace-nowrap"
        style={{
          borderColor: atStartPosition ? accent : 'transparent',
        }}
      >
        <span
          className="h-2 w-2 shrink-0 rounded-full transition-all duration-200"
          style={{ backgroundColor: hasStart ? accent : 'rgba(255,255,255,0.4)' }}
        />
        {hasStart ? 'Start' : 'Set start'}
      </button>
      <button
        type="button"
        onClick={handleSetEnd}
        disabled={!flyoverEditMode}
        title={flyoverEditMode ? 'Set current view as end keyframe' : 'Enable fly-around first'}
        className="flex flex-1 min-w-0 max-w-xs items-center justify-center gap-2 rounded-full border-2 py-2 px-5 text-sm font-medium text-white/80 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 bg-white/10 hover:bg-white/15 disabled:hover:bg-white/10 whitespace-nowrap"
        style={{
          borderColor: atEndPosition ? accent : 'transparent',
        }}
      >
        <span
          className="h-2 w-2 shrink-0 rounded-full transition-all duration-200"
          style={{ backgroundColor: hasEnd ? accent : 'rgba(255,255,255,0.4)' }}
        />
        {hasEnd ? 'End' : 'Set end'}
      </button>
      <button
        type="button"
        onClick={() => setFlyoverJumpToStart(true)}
        disabled={!flyoverEditMode || !hasStart}
        title="Move camera to start keyframe position"
        className="shrink-0 rounded-full border-2 border-transparent py-2 px-4 text-sm font-medium text-white/80 hover:bg-white/15 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed bg-white/10 whitespace-nowrap"
      >
        Jump to start
      </button>
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

const EXPORT_FRAMERATES = [24, 25, 30, 60] as const
const EXPORT_BITRATES = [
  { label: '4 Mbps', value: 4_000_000 },
  { label: '8 Mbps', value: 8_000_000 },
  { label: '12 Mbps', value: 12_000_000 },
  { label: '16 Mbps', value: 16_000_000 },
  { label: '24 Mbps', value: 24_000_000 },
  { label: '32 Mbps', value: 32_000_000 },
] as const
const EXPORT_RESOLUTIONS = [
  { label: '480p', value: 480 },
  { label: '720p', value: 720 },
  { label: '1080p', value: 1080 },
  { label: '2K', value: 1440 },
  { label: '4K', value: 2160 },
] as const
/** Resolutions that use frame-by-frame export (smooth, may be slower than real-time). */
const FRAME_BY_FRAME_RESOLUTION_THRESHOLD = 1440

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
  const setExporting = useStore((s) => s.setExporting)
  const setExportRenderMode = useStore((s) => s.setExportRenderMode)
  const setExportHeight = useStore((s) => s.setExportHeight)
  const setPlaying = useStore((s) => s.setPlaying)
  const project = useStore((s) => s.project)
  const setCurrentTime = useStore((s) => s.setCurrentTime)
  const setCurrentSceneIndex = useStore((s) => s.setCurrentSceneIndex)
  const hasPlaneMedia = !!getPlaneMedia(project)

  const runExport = async () => {
    setExportRenderMode(content)
    setExportHeight(resolution)
    setExporting(true)
    setExportDialogOpen(false)
    setCurrentSceneIndex(0)
    setCurrentTime(0)
    const totalDuration = project.scenes.reduce((acc, s) => acc + s.durationSeconds, 0)
    const useFrameByFrame = resolution >= FRAME_BY_FRAME_RESOLUTION_THRESHOLD || frameByFrame
    if (!useFrameByFrame) setPlaying(true)
    // Let canvas remount with alpha if plane-only
    await new Promise((r) => setTimeout(r, 100))
    const canvas = document.querySelector('canvas')
    if (!canvas) {
      setExporting(false)
      setExportRenderMode('full')
      setPlaying(false)
      return
    }
    const stream = canvas.captureStream(framerate)
    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm'
    const recorder = new MediaRecorder(stream, {
      mimeType: mime,
      videoBitsPerSecond: bitrate,
      audioBitsPerSecond: 0,
    })
    const chunks: Blob[] = []
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data)
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      const suffix = content === 'plane-only' ? '-panel' : ''
      a.download = `${project.name || 'export'}${suffix}.webm`
      a.click()
      URL.revokeObjectURL(a.href)
      setExporting(false)
      setExportRenderMode('full')
      setPlaying(false)
    }
    recorder.start(100)
    if (useFrameByFrame) {
      const frameDurationMs = 1000 / framerate
      const totalFrames = Math.ceil(totalDuration * framerate)
      for (let i = 0; i < totalFrames; i++) {
        const frameStart = performance.now()
        const t = Math.min(i / framerate, totalDuration)
        setCurrentSceneIndex(sceneIndexAtTime(project.scenes, t))
        setCurrentTime(t)
        await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))
        const elapsed = performance.now() - frameStart
        const wait = Math.max(0, frameDurationMs - elapsed)
        if (wait > 0) await new Promise((r) => setTimeout(r, wait))
      }
    } else {
      await new Promise((r) => setTimeout(r, totalDuration * 1000 + 500))
    }
    recorder.stop()
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
          hasPlaneMedia={hasPlaneMedia}
          onClose={() => setExportDialogOpen(false)}
          onExport={runExport}
        />
      )}
    </>
  )
}

function ExportDialog({
  framerate,
  setFramerate,
  bitrate,
  setBitrate,
  resolution,
  setResolution,
  frameByFrame,
  setFrameByFrame,
  content,
  setContent,
  hasPlaneMedia,
  onClose,
  onExport,
}: {
  framerate: number
  setFramerate: (n: number) => void
  bitrate: number
  setBitrate: (n: number) => void
  resolution: number
  setResolution: (n: number) => void
  frameByFrame: boolean
  setFrameByFrame: (v: boolean) => void
  content: 'full' | 'plane-only'
  setContent: (c: 'full' | 'plane-only') => void
  hasPlaneMedia: boolean
  onClose: () => void
  onExport: () => void
}) {
  const useFrameByFrameForRes = resolution >= FRAME_BY_FRAME_RESOLUTION_THRESHOLD
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-white/10 bg-zinc-900 p-5 shadow-xl">
        <h2 className="text-lg font-semibold text-white mb-4">Export options</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-1.5">
              Resolution
            </label>
            <div className="flex gap-2">
              {EXPORT_RESOLUTIONS.map(({ label, value }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setResolution(value)}
                  className={`flex-1 px-2 py-2 rounded text-sm font-medium ${resolution === value ? 'bg-white text-black' : 'bg-white/10 text-white/80 hover:bg-white/20'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {useFrameByFrameForRes && (
              <p className="text-xs text-white/50 mt-1.5">
                2K/4K always use frame-by-frame for a smooth result.
              </p>
            )}
          </div>
          <div>
            <label className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10">
              <input
                type="checkbox"
                checked={frameByFrame || useFrameByFrameForRes}
                onChange={(e) => setFrameByFrame(e.target.checked)}
                disabled={useFrameByFrameForRes}
                className="rounded text-white"
              />
              <div>
                <span className="text-sm font-medium text-white">Smooth export (frame-by-frame)</span>
                <p className="text-xs text-white/50 mt-0.5">
                  {useFrameByFrameForRes
                    ? 'Always on for 2K/4K.'
                    : 'No dropped frames; export may take longer than real-time.'}
                </p>
              </div>
            </label>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-1.5">
              Framerate
            </label>
            <div className="flex gap-2">
              {EXPORT_FRAMERATES.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFramerate(f)}
                  className={`flex-1 px-2 py-2 rounded text-sm font-medium ${framerate === f ? 'bg-white text-black' : 'bg-white/10 text-white/80 hover:bg-white/20'
                    }`}
                >
                  {f} fps
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-1.5">
              Bitrate
            </label>
            <select
              value={bitrate}
              onChange={(e) => setBitrate(Number(e.target.value))}
              className="w-full px-3 py-2 rounded bg-white/10 border border-white/10 text-white text-sm"
            >
              {EXPORT_BITRATES.map(({ label, value }) => (
                <option key={value} value={value} className="bg-zinc-900">
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-1.5">
              Export content
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10">
                <input
                  type="radio"
                  name="export-content"
                  checked={content === 'full'}
                  onChange={() => setContent('full')}
                  className="text-white"
                />
                <div>
                  <span className="text-sm font-medium text-white">Full composite</span>
                  <p className="text-xs text-white/50 mt-0.5">
                    Background + panel video, camera, effects (WebM)
                  </p>
                </div>
              </label>
              <label
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${hasPlaneMedia
                  ? 'bg-white/5 border-white/10 hover:bg-white/10'
                  : 'border-white/5 bg-white/5 opacity-60 cursor-not-allowed'
                  }`}
              >
                <input
                  type="radio"
                  name="export-content"
                  checked={content === 'plane-only'}
                  onChange={() => hasPlaneMedia && setContent('plane-only')}
                  disabled={!hasPlaneMedia}
                  className="text-white"
                />
                <div>
                  <span className="text-sm font-medium text-white">Panel only (transparent)</span>
                  <p className="text-xs text-white/50 mt-0.5">
                    {hasPlaneMedia
                      ? 'Panel + effects, transparent background (WebM with alpha)'
                      : 'Add a panel video, image or SVG in the sidebar to use this'}
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-white/80 bg-white/10 hover:bg-white/20"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onExport}
            className="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-white text-black hover:bg-gray-200"
          >
            Start export
          </button>
        </div>
      </div>
    </div>
  )
}
