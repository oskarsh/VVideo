import { useRef, useCallback, useEffect, useState } from 'react'
import { Copy, X, SkipBack, TrendingUp } from 'lucide-react'
import { useStore } from '@/store'
import type { Scene, GlobalEffectType } from '@/types'
import { getFlyoverKeyframes } from '@/lib/flyover'

/** First-frame preview for a scene; updates when trim start or video changes. */
function SceneClipPreview({
  videoUrl,
  seekTime,
  className,
}: {
  videoUrl: string | null
  seekTime: number
  className?: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !videoUrl) return
    video.src = videoUrl
    video.load()
  }, [videoUrl])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !videoUrl) return
    const seek = () => {
      video.currentTime = seekTime
    }
    if (video.readyState >= 2) {
      seek()
      return
    }
    video.addEventListener('canplay', seek)
    return () => video.removeEventListener('canplay', seek)
  }, [videoUrl, seekTime])

  if (!videoUrl) {
    return (
      <div
        className={`bg-zinc-800/80 ${className ?? ''}`}
        aria-hidden
      />
    )
  }

  return (
    <div className={`overflow-hidden ${className ?? ''}`} aria-hidden>
      <video
        ref={videoRef}
        src={videoUrl}
        muted
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover"
        crossOrigin="anonymous"
      />
    </div>
  )
}

/** One automation curve: start/end value over 0..1 time, with display range and update keys. */
export interface AutomationCurve {
  label: string
  startVal: number
  endVal: number
  min: number
  max: number
  /** For drag-to-edit: scene index, effect index, and patch keys. */
  sceneIndex: number
  effectIndex: number
  startKey: string
  endKey: string
  step: number
}

/** Collect all effect params that have different start vs end (keyframe automation) for a scene. */
function getSceneAutomationCurves(scene: Scene, sceneIndex: number): AutomationCurve[] {
  const curves: AutomationCurve[] = []
  scene.effects.forEach((e, effectIndex) => {
    switch (e.type) {
      case 'zoom':
        if (e.startScale !== e.endScale) {
          curves.push({
            label: 'Zoom',
            startVal: e.startScale,
            endVal: e.endScale,
            min: 0.5,
            max: 2,
            sceneIndex,
            effectIndex,
            startKey: 'startScale',
            endKey: 'endScale',
            step: 0.01,
          })
        }
        break
      case 'grain':
        if (e.startOpacity !== e.endOpacity) {
          curves.push({
            label: 'Grain',
            startVal: e.startOpacity,
            endVal: e.endOpacity,
            min: 0,
            max: 1,
            sceneIndex,
            effectIndex,
            startKey: 'startOpacity',
            endKey: 'endOpacity',
            step: 0.01,
          })
        }
        break
      case 'dof':
        if (!e.enabled) break
        if (e.focusDistanceStart !== e.focusDistanceEnd)
          curves.push({
            label: 'DoF focus',
            startVal: e.focusDistanceStart,
            endVal: e.focusDistanceEnd,
            min: 0,
            max: 0.1,
            sceneIndex,
            effectIndex,
            startKey: 'focusDistanceStart',
            endKey: 'focusDistanceEnd',
            step: 0.001,
          })
        if (e.focusRangeStart !== e.focusRangeEnd)
          curves.push({
            label: 'DoF range',
            startVal: e.focusRangeStart,
            endVal: e.focusRangeEnd,
            min: 0.05,
            max: 2,
            sceneIndex,
            effectIndex,
            startKey: 'focusRangeStart',
            endKey: 'focusRangeEnd',
            step: 0.05,
          })
        if (e.bokehScaleStart !== e.bokehScaleEnd)
          curves.push({
            label: 'DoF bokeh',
            startVal: e.bokehScaleStart,
            endVal: e.bokehScaleEnd,
            min: 0.5,
            max: 15,
            sceneIndex,
            effectIndex,
            startKey: 'bokehScaleStart',
            endKey: 'bokehScaleEnd',
            step: 0.5,
          })
        break
      case 'handheld':
        if (!e.enabled) break
        if (e.intensityStart !== e.intensityEnd)
          curves.push({
            label: 'Shake pos',
            startVal: e.intensityStart,
            endVal: e.intensityEnd,
            min: 0,
            max: 0.05,
            sceneIndex,
            effectIndex,
            startKey: 'intensityStart',
            endKey: 'intensityEnd',
            step: 0.001,
          })
        if (e.rotationShakeStart !== e.rotationShakeEnd)
          curves.push({
            label: 'Shake rot',
            startVal: e.rotationShakeStart,
            endVal: e.rotationShakeEnd,
            min: 0,
            max: 0.03,
            sceneIndex,
            effectIndex,
            startKey: 'rotationShakeStart',
            endKey: 'rotationShakeEnd',
            step: 0.001,
          })
        if (e.speedStart !== e.speedEnd)
          curves.push({
            label: 'Shake speed',
            startVal: e.speedStart,
            endVal: e.speedEnd,
            min: 0.2,
            max: 3,
            sceneIndex,
            effectIndex,
            startKey: 'speedStart',
            endKey: 'speedEnd',
            step: 0.1,
          })
        break
      case 'chromaticAberration':
        if (e.enabled && e.offsetStart !== e.offsetEnd)
          curves.push({
            label: 'Chromatic',
            startVal: e.offsetStart,
            endVal: e.offsetEnd,
            min: 0,
            max: 0.02,
            sceneIndex,
            effectIndex,
            startKey: 'offsetStart',
            endKey: 'offsetEnd',
            step: 0.001,
          })
        break
      case 'lensDistortion':
        if (e.enabled && e.distortionStart !== e.distortionEnd)
          curves.push({
            label: 'Lens distort',
            startVal: e.distortionStart,
            endVal: e.distortionEnd,
            min: -0.2,
            max: 0.2,
            sceneIndex,
            effectIndex,
            startKey: 'distortionStart',
            endKey: 'distortionEnd',
            step: 0.01,
          })
        break
      default:
        break
    }
  })
  return curves
}

const AUTOMATION_LANE_HEIGHT = 28
const AUTOMATION_LANE_HEIGHT_COLLAPSED = 20
const AUTOMATION_LANE_HEIGHT_EXPANDED = 120
/** Keyframe marker lanes: collapsed height (all lanes), expanded (selected lane only). */
const KEYFRAME_LANE_HEIGHT_COLLAPSED = 24
const KEYFRAME_LANE_HEIGHT_EXPANDED = 80
const KEYFRAME_DRAG_TIME_EPS = 0.001
const AUTOMATION_CURVE_COLORS = [
  'rgb(34, 211, 238)',   // cyan
  'rgb(251, 191, 36)',   // amber
  'rgb(74, 222, 128)',   // green
  'rgb(192, 132, 252)',  // violet
  'rgb(248, 113, 113)',  // red
]

function roundToStep(value: number, step: number): number {
  if (step <= 0) return value
  return Math.round(value / step) * step
}

export function Timeline() {
  const project = useStore((s) => s.project)
  const currentSceneIndex = useStore((s) => s.currentSceneIndex)
  const currentTime = useStore((s) => s.currentTime)
  const setCurrentSceneIndex = useStore((s) => s.setCurrentSceneIndex)
  const setCurrentTime = useStore((s) => s.setCurrentTime)
  const setPlaying = useStore((s) => s.setPlaying)
  const addScene = useStore((s) => s.addScene)
  const removeScene = useStore((s) => s.removeScene)
  const duplicateScene = useStore((s) => s.duplicateScene)
  const reorderScenes = useStore((s) => s.reorderScenes)
  const timelineShowAutomation = useStore((s) => s.timelineShowAutomation)
  const setTimelineShowAutomation = useStore((s) => s.setTimelineShowAutomation)
  const setEffect = useStore((s) => s.setEffect)
  const updateScene = useStore((s) => s.updateScene)
  const projectFps = useStore((s) => s.projectFps)
  const setProjectFps = useStore((s) => s.setProjectFps)
  const updateGlobalEffectKeyframe = useStore((s) => s.updateGlobalEffectKeyframe)
  const updateFlyoverKeyframe = useStore((s) => s.updateFlyoverKeyframe)
  const removeGlobalEffectKeyframe = useStore((s) => s.removeGlobalEffectKeyframe)
  const removeFlyoverKeyframe = useStore((s) => s.removeFlyoverKeyframe)

  const [automationDrag, setAutomationDrag] = useState<{
    curve: AutomationCurve
    which: 'start' | 'end'
    segmentRect: DOMRect
  } | null>(null)

  const [expandedAutomationLane, setExpandedAutomationLane] = useState<number | null>(null)

  /** Which keyframe lane is expanded (global effect markers vs camera markers). Click lane to select. */
  const [expandedKeyframeLane, setExpandedKeyframeLane] = useState<'global' | 'camera' | null>(null)

  /** Dragging a keyframe horizontally to change its time. initialTime = project time for seek-on-click. */
  const [keyframeDrag, setKeyframeDrag] = useState<
    | { kind: 'global'; effectType: GlobalEffectType; keyframeTime: number; initialTime: number; trackRect: DOMRect; hasMoved?: boolean }
    | { kind: 'camera'; sceneIndex: number; keyframeTime: number; initialTime: number; trackRect: DOMRect; hasMoved?: boolean }
    | null
  >(null)

  const totalDuration = project.scenes.reduce((acc, s) => acc + s.durationSeconds, 0)
  const sceneStarts = project.scenes.reduce<number[]>(
    (acc, s, i) => [...acc, acc[i] + s.durationSeconds],
    [0]
  )
  const trackRef = useRef<HTMLDivElement>(null)
  const keyframeTrackRef = useRef<HTMLDivElement>(null)

  const handleScrub = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = (trackRef.current ?? e.currentTarget).getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const t = Math.max(0, Math.min(totalDuration, x * totalDuration))
      setCurrentTime(t)
      const idx = sceneStarts.findIndex((start, i) => {
        const end = sceneStarts[i + 1] ?? totalDuration
        return t >= start && t < end
      })
      if (idx >= 0) setCurrentSceneIndex(idx)
    },
    [totalDuration, sceneStarts, setCurrentTime, setCurrentSceneIndex]
  )

  const rulerTicks = getRulerTicks(totalDuration)
  const scenesCount = project.scenes.length

  const handleDuplicate = useCallback(() => {
    duplicateScene(currentSceneIndex)
  }, [currentSceneIndex, duplicateScene])

  const handleDelete = useCallback(() => {
    if (scenesCount <= 1) return
    if (window.confirm('Delete this scene?')) removeScene(currentSceneIndex)
  }, [scenesCount, currentSceneIndex, removeScene])

  const handleClipDragStart = useCallback((e: React.DragEvent, index: number) => {
    e.stopPropagation()
    e.dataTransfer.setData('text/plain', String(index))
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleClipDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleClipDrop = useCallback(
    (e: React.DragEvent, toIndex: number) => {
      e.preventDefault()
      e.stopPropagation()
      const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10)
      if (Number.isFinite(fromIndex) && fromIndex !== toIndex) {
        reorderScenes(fromIndex, toIndex)
      }
    },
    [reorderScenes]
  )

  // Global mouse move/up for automation handle drag
  useEffect(() => {
    if (!automationDrag) return
    const { curve, which, segmentRect } = automationDrag
    const key = which === 'start' ? curve.startKey : curve.endKey
    const onMove = (e: MouseEvent) => {
      const t = Math.max(0, Math.min(1, (segmentRect.bottom - e.clientY) / segmentRect.height))
      const value = roundToStep(
        curve.min + t * (curve.max - curve.min),
        curve.step
      )
      setEffect(curve.sceneIndex, curve.effectIndex, { [key]: value })
    }
    const onUp = () => setAutomationDrag(null)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [automationDrag, setEffect])

  // Global mouse move/up for keyframe time drag (horizontal); click-without-drag seeks to keyframe
  useEffect(() => {
    if (!keyframeDrag || !keyframeTrackRef.current) return
    const trackRect = keyframeDrag.trackRect
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX - trackRect.left) / trackRect.width
      const time = Math.max(0, Math.min(totalDuration, x * totalDuration))
      if (keyframeDrag.kind === 'global') {
        const track = project.globalEffects?.[keyframeDrag.effectType]
        const keyframes = track?.keyframes ?? []
        const idx = keyframes.findIndex((k) => Math.abs(k.time - keyframeDrag.keyframeTime) < KEYFRAME_DRAG_TIME_EPS)
        if (idx >= 0) updateGlobalEffectKeyframe(keyframeDrag.effectType, idx, { time })
        setKeyframeDrag((prev) => (prev && prev.kind === 'global' ? { ...prev, keyframeTime: time, hasMoved: true } : prev))
      } else {
        const scene = project.scenes[keyframeDrag.sceneIndex]
        const duration = scene?.durationSeconds ?? 1
        const sceneStart = sceneStarts[keyframeDrag.sceneIndex] ?? 0
        const localTime = time - sceneStart
        const normalized = Math.max(0, Math.min(1, localTime / duration))
        const keyframes = scene?.flyover?.keyframes ?? []
        const idx = keyframes.findIndex((k) => Math.abs(k.time - keyframeDrag.keyframeTime) < KEYFRAME_DRAG_TIME_EPS)
        if (idx >= 0) updateFlyoverKeyframe(keyframeDrag.sceneIndex, idx, { time: normalized })
        setKeyframeDrag((prev) => (prev && prev.kind === 'camera' ? { ...prev, keyframeTime: normalized, hasMoved: true } : prev))
      }
    }
    const onUp = () => {
      if (keyframeDrag && !keyframeDrag.hasMoved) {
        setCurrentTime(keyframeDrag.initialTime)
        if (keyframeDrag.kind === 'camera') setCurrentSceneIndex(keyframeDrag.sceneIndex)
      }
      setKeyframeDrag(null)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [keyframeDrag, totalDuration, sceneStarts, project.scenes, project.globalEffects, updateGlobalEffectKeyframe, updateFlyoverKeyframe, setCurrentTime, setCurrentSceneIndex])

  const curvesPerScene = project.scenes.map((sc, i) => getSceneAutomationCurves(sc, i))
  const maxLanes = Math.max(1, ...curvesPerScene.map((c) => c.length))
  const laneHeights = Array.from({ length: maxLanes }, (_, i) =>
    expandedAutomationLane === i
      ? AUTOMATION_LANE_HEIGHT_EXPANDED
      : expandedAutomationLane != null
        ? AUTOMATION_LANE_HEIGHT_COLLAPSED
        : AUTOMATION_LANE_HEIGHT
  )
  const laneTops = laneHeights.reduce<number[]>((acc, _h, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + laneHeights[i - 1])
    return acc
  }, [])
  const automationHeight = laneHeights.reduce((a, b) => a + b, 0)

  const globalKeyframeMarkers: { time: number; type: GlobalEffectType }[] = []
  const globalEffects = project.globalEffects ?? {}
    ; (Object.keys(globalEffects) as GlobalEffectType[]).forEach((type) => {
      const track = globalEffects[type]
      if (track?.keyframes?.length) {
        track.keyframes.forEach((kf) => {
          globalKeyframeMarkers.push({ time: kf.time, type })
        })
      }
    })
  const hasGlobalKeyframes = globalKeyframeMarkers.length > 0

  // Per-scene camera (flyover) keyframes for keyframe editor
  const cameraKeyframeMarkers: { time: number; sceneIndex: number }[] = []
  project.scenes.forEach((sc, sceneIndex) => {
    const kfs = getFlyoverKeyframes(sc)
    const start = sceneStarts[sceneIndex] ?? 0
    const duration = sc.durationSeconds
    kfs.forEach((kf) => {
      cameraKeyframeMarkers.push({ time: start + kf.time * duration, sceneIndex })
    })
  })
  const hasCameraKeyframes = cameraKeyframeMarkers.length > 0

  const currentScene = project.scenes[currentSceneIndex]
  const sceneStartTime = sceneStarts[currentSceneIndex] ?? 0
  const sceneLocalTime = currentTime - sceneStartTime
  const currentFrame = Math.floor(currentTime * projectFps)
  const totalFrames = Math.floor(totalDuration * projectFps)
  const sceneDurationFrames = currentScene ? Math.floor(currentScene.durationSeconds * projectFps) : 0
  const sceneLocalFrame = Math.floor(sceneLocalTime * projectFps)

  const globalEffectLabel: Record<GlobalEffectType, string> = {
    camera: 'Camera',
    grain: 'Grain',
    dither: 'Dither',
    dof: 'DoF',
    handheld: 'Handheld',
    chromaticAberration: 'Chromatic',
    lensDistortion: 'Lens',
    glitch: 'Glitch',
    vignette: 'Vignette',
    scanline: 'Scanline',
  }

  return (
    <div className="flex flex-col min-w-0 overflow-x-hidden border-t border-white/10 bg-zinc-900/95">
      {/* Transport */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-white/10 min-w-0">
        <button
          type="button"
          onClick={handleDuplicate}
          className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-sm"
          title="Duplicate current scene"
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={scenesCount <= 1}
          className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-sm text-red-400/90 disabled:opacity-50 disabled:pointer-events-none"
          title="Delete current scene"
        >
          <X className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            setCurrentTime(sceneStarts[currentSceneIndex])
            setPlaying(false)
          }}
          className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-sm"
          title="Jump to start of current scene"
        >
          <SkipBack className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setTimelineShowAutomation(!timelineShowAutomation)}
          className={`w-8 h-8 rounded flex items-center justify-center text-sm ${timelineShowAutomation ? 'bg-white/20 text-white' : 'bg-white/10 hover:bg-white/20 text-white/60'}`}
          title={timelineShowAutomation ? 'Hide effect automation curves' : 'Show effect automation curves'}
        >
          <TrendingUp className="w-4 h-4" />
        </button>
        <span className="text-xs text-white/60 tabular-nums ml-1" title={`${formatTime(currentTime)} / ${formatTime(totalDuration)}`}>
          Frame {currentFrame} / {totalFrames}
        </span>
        <span className="text-[10px] text-white/40 tabular-nums">
          {formatTime(currentTime)} / {formatTime(totalDuration)}
        </span>
        {currentScene && (
          <>
            <span className="text-[10px] text-white/40 ml-2">Scene duration</span>
            <input
              type="number"
              min={0.5}
              step={0.5}
              value={currentScene.durationSeconds}
              onChange={(e) =>
                updateScene(currentSceneIndex, {
                  durationSeconds: Math.max(0.5, parseFloat(e.target.value) || 0.5),
                })
              }
              className="w-14 px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-[10px] text-white tabular-nums"
              title="Current scene duration (seconds)"
            />
            <span className="text-[10px] text-white/40">s</span>
            <span className="text-[10px] text-white/30 ml-1" title="Frames in current scene">
              ({sceneLocalFrame} / {sceneDurationFrames} frames)
            </span>
          </>
        )}
        <div className="ml-2 flex items-center gap-0.5">
          <span className="text-[10px] text-white/40">fps</span>
          {[24, 30, 60].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setProjectFps(f)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium tabular-nums ${projectFps === f ? 'bg-white/20 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
              title={`${f} fps`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Ruler */}
      <div
        className="h-6 px-2 flex items-end border-b border-white/10 relative bg-zinc-800/80 cursor-pointer"
        style={{ minHeight: 24 }}
        onClick={handleScrub}
        role="slider"
        aria-valuenow={currentTime}
        aria-valuemin={0}
        aria-valuemax={totalDuration}
        title="Click to move playhead"
      >
        {rulerTicks.map(({ time, isMajor }) => (
          <div
            key={time}
            className="absolute top-0 bottom-0 flex flex-col justify-end"
            style={{ left: `${(time / totalDuration) * 100}%`, transform: 'translateX(-50%)' }}
          >
            <div
              className={`w-px bg-white/40 ${isMajor ? 'h-2' : 'h-1'}`}
              style={{ minWidth: 1 }}
            />
            {isMajor && (
              <span className="text-[10px] text-white/50 tabular-nums mt-0.5 whitespace-nowrap">
                {formatTime(time)}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Track: clips + add; optional automation row below */}
      <div className="px-2 py-2 flex items-stretch gap-2 bg-zinc-800/60">
        <div ref={keyframeTrackRef} className="flex-1 min-w-0 flex flex-col gap-2">
          <div
            ref={trackRef}
            className="h-16 rounded-lg cursor-pointer relative bg-zinc-900/80"
            onClick={handleScrub}
            onKeyDown={() => { }}
            role="slider"
            aria-valuenow={currentTime}
            aria-valuemin={0}
            aria-valuemax={totalDuration}
            tabIndex={0}
          >
            {project.scenes.map((sc, i) => (
              <div
                key={sc.id}
                draggable
                onDragStart={(e) => handleClipDragStart(e, i)}
                onDragOver={handleClipDragOver}
                onDrop={(e) => handleClipDrop(e, i)}
                className={`absolute top-1.5 bottom-1.5 rounded-lg flex flex-col justify-end border cursor-grab active:cursor-grabbing transition-all duration-150 overflow-hidden shadow-lg ${i === currentSceneIndex
                  ? 'border-white/50 ring-1 ring-white/30 shadow-white/5'
                  : 'border-white/15 hover:border-white/25 hover:shadow-md'
                  }`}
                style={{
                  left: `${(sceneStarts[i] / totalDuration) * 100}%`,
                  width: `${(sc.durationSeconds / totalDuration) * 100}%`,
                  marginLeft: i === 0 ? 0 : 3,
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  handleScrub(e)
                }}
                title={`Scene ${i + 1} · ${formatTime(sc.durationSeconds)} — click to seek, drag to reorder`}
              >
                {/* Base scene color for most of the clip */}
                <div
                  className="absolute inset-0 bg-zinc-800/90 pointer-events-none"
                  aria-hidden
                />
                {/* Small preview strip at start with quick fade to scene color */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-[22%] max-w-[88px] overflow-hidden pointer-events-none"
                  aria-hidden
                >
                  <SceneClipPreview
                    videoUrl={project.backgroundVideoUrl}
                    seekTime={sc.backgroundTrim?.start ?? 0}
                    className="absolute inset-0"
                  />
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'linear-gradient(to right, transparent 0%, transparent 50%, rgba(39,39,42,0.92) 100%)',
                    }}
                    aria-hidden
                  />
                </div>
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none"
                  aria-hidden
                />
                <div className="relative z-10 px-2 py-1.5 flex items-center justify-between gap-1">
                  <span className="text-xs font-semibold text-white drop-shadow-md truncate">
                    Scene {i + 1}
                  </span>
                  <span className="text-[10px] text-white/70 tabular-nums shrink-0">
                    {formatTime(sc.durationSeconds)}
                  </span>
                </div>
              </div>
            ))}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white pointer-events-none z-10"
              style={{
                left: `${(currentTime / totalDuration) * 100}%`,
              }}
            />
          </div>

          {/* Keyframe lanes: one for global effects, one for camera. Click lane to expand; only expanded lane has more height. All markers draggable left/right. */}
          {hasGlobalKeyframes && (
            <div
              role="button"
              tabIndex={0}
              className={`rounded border border-white/5 relative flex items-center transition-all duration-200 cursor-pointer ${expandedKeyframeLane === 'global' ? 'ring-1 ring-cyan-400/50 z-10' : ''}`}
              style={{ minHeight: expandedKeyframeLane === 'global' ? KEYFRAME_LANE_HEIGHT_EXPANDED : KEYFRAME_LANE_HEIGHT_COLLAPSED }}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('[data-keyframe-marker]')) return
                e.stopPropagation()
                setExpandedKeyframeLane((prev) => (prev === 'global' ? null : 'global'))
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setExpandedKeyframeLane((prev) => (prev === 'global' ? null : 'global'))
                }
              }}
              title={expandedKeyframeLane === 'global' ? 'Global effect keyframes — click lane to collapse; drag markers to move' : 'Global effect keyframes — click to expand; drag markers to move time'}
            >
              <div className="absolute inset-0 bg-zinc-900/70 rounded pointer-events-none" aria-hidden />
              {globalKeyframeMarkers.map(({ time, type }, idx) => {
                const track = project.globalEffects?.[type]
                const kfIndex = track?.keyframes.findIndex((k) => Math.abs(k.time - time) < KEYFRAME_DRAG_TIME_EPS) ?? -1
                return (
                  <button
                    key={`${type}-${time}-${idx}`}
                    type="button"
                    data-keyframe-marker
                    className="absolute w-2 h-2 rounded-full bg-cyan-500/90 hover:bg-cyan-400 hover:scale-125 z-10 border border-white/30 -translate-x-1/2 cursor-grab active:cursor-grabbing"
                    style={{ left: `${(time / totalDuration) * 100}%` }}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (kfIndex < 0) return
                      const rect = keyframeTrackRef.current?.getBoundingClientRect()
                      if (rect) setKeyframeDrag({ kind: 'global', effectType: type, keyframeTime: time, initialTime: time, trackRect: rect })
                    }}
                    onDoubleClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (kfIndex >= 0) removeGlobalEffectKeyframe(type, kfIndex)
                    }}
                    title={`${globalEffectLabel[type]} @ ${formatTime(time)} — drag to move, double-click to remove`}
                  />
                )
              })}
            </div>
          )}

          {hasCameraKeyframes && (
            <div
              role="button"
              tabIndex={0}
              className={`rounded border border-white/5 relative flex items-center transition-all duration-200 cursor-pointer ${expandedKeyframeLane === 'camera' ? 'ring-1 ring-amber-400/50 z-10' : ''}`}
              style={{ minHeight: expandedKeyframeLane === 'camera' ? KEYFRAME_LANE_HEIGHT_EXPANDED : KEYFRAME_LANE_HEIGHT_COLLAPSED }}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('[data-keyframe-marker]')) return
                e.stopPropagation()
                setExpandedKeyframeLane((prev) => (prev === 'camera' ? null : 'camera'))
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setExpandedKeyframeLane((prev) => (prev === 'camera' ? null : 'camera'))
                }
              }}
              title={expandedKeyframeLane === 'camera' ? 'Camera keyframes — click lane to collapse; drag markers to move' : 'Camera keyframes — click to expand; drag markers to move time'}
            >
              <div className="absolute inset-0 bg-zinc-900/70 rounded pointer-events-none" aria-hidden />
              {cameraKeyframeMarkers.map(({ time: projectTime, sceneIndex }, idx) => {
                const scene = project.scenes[sceneIndex]
                const duration = scene?.durationSeconds ?? 1
                const sceneStart = sceneStarts[sceneIndex] ?? 0
                const normalizedTime = (projectTime - sceneStart) / duration
                const kfs = scene?.flyover?.keyframes ?? []
                const kfIndex = kfs.findIndex((k) => Math.abs(k.time - normalizedTime) < KEYFRAME_DRAG_TIME_EPS)
                return (
                  <button
                    key={`cam-${sceneIndex}-${projectTime}-${idx}`}
                    type="button"
                    data-keyframe-marker
                    className="absolute w-2 h-2 rounded-full bg-amber-400/90 hover:bg-amber-300 hover:scale-125 z-10 border border-white/30 -translate-x-1/2 cursor-grab active:cursor-grabbing"
                    style={{ left: `${(projectTime / totalDuration) * 100}%` }}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (kfIndex < 0) return
                      const rect = keyframeTrackRef.current?.getBoundingClientRect()
                      if (rect) setKeyframeDrag({ kind: 'camera', sceneIndex, keyframeTime: normalizedTime, initialTime: projectTime, trackRect: rect })
                    }}
                    onDoubleClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (kfIndex >= 0) removeFlyoverKeyframe(sceneIndex, kfIndex)
                    }}
                    title={`Camera @ ${formatTime(projectTime)} — drag to move, double-click to remove`}
                  />
                )
              })}
            </div>
          )}

          {/* Automation curves: multiple lanes, one per curve; drag handles at start/end */}
          <div
            className="overflow-hidden rounded-lg transition-all duration-300 ease-out"
            style={{
              maxHeight: timelineShowAutomation ? automationHeight : 0,
              opacity: timelineShowAutomation ? 1 : 0,
            }}
            aria-hidden={!timelineShowAutomation}
          >
            <div
              className="rounded-lg bg-zinc-900/90 relative cursor-pointer"
              style={{ height: automationHeight }}
              onClick={handleScrub}
            >
              {Array.from({ length: maxLanes }, (_, laneIndex) => (
                <div
                  key={laneIndex}
                  role="button"
                  tabIndex={0}
                  className={`absolute left-0 right-0 border-b border-white/5 last:border-0 transition-all duration-200 ${expandedAutomationLane === laneIndex ? 'ring-1 ring-amber-400/50 rounded z-10' : ''}`}
                  style={{
                    top: laneTops[laneIndex],
                    height: laneHeights[laneIndex],
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setExpandedAutomationLane((prev) => (prev === laneIndex ? null : laneIndex))
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setExpandedAutomationLane((prev) => (prev === laneIndex ? null : laneIndex))
                    }
                  }}
                  title={expandedAutomationLane === laneIndex ? 'Click to collapse lane' : 'Click to expand lane for detail'}
                >
                  {project.scenes.map((sc, i) => {
                    const curves = curvesPerScene[i]
                    const curve = curves[laneIndex]
                    if (!curve) {
                      return (
                        <div
                          key={sc.id}
                          className="absolute top-0 bottom-0 bg-zinc-800/30"
                          style={{
                            left: `${(sceneStarts[i] / totalDuration) * 100}%`,
                            width: `${(sc.durationSeconds / totalDuration) * 100}%`,
                            marginLeft: i === 0 ? 0 : 3,
                          }}
                        />
                      )
                    }
                    const range = curve.max - curve.min
                    const n: (v: number) => number =
                      range === 0 ? () => 0.5 : (v) => (v - curve.min) / range
                    const y0Pct = 100 - n(curve.startVal) * 100
                    const y1Pct = 100 - n(curve.endVal) * 100
                    const stroke = AUTOMATION_CURVE_COLORS[laneIndex % AUTOMATION_CURVE_COLORS.length]
                    return (
                      <div
                        key={sc.id}
                        className="absolute top-0 bottom-0 rounded overflow-visible"
                        style={{
                          left: `${(sceneStarts[i] / totalDuration) * 100}%`,
                          width: `${(sc.durationSeconds / totalDuration) * 100}%`,
                          marginLeft: i === 0 ? 0 : 3,
                        }}
                      >
                        <svg
                          className="absolute inset-0 w-full h-full pointer-events-none"
                          viewBox="0 0 100 100"
                          preserveAspectRatio="none"
                        >
                          <polyline
                            fill="none"
                            stroke={stroke}
                            strokeWidth={1.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity={0.9}
                            points={`0,${y0Pct} 100,${y1Pct}`}
                          />
                        </svg>
                        {/* Start handle (left) — same Y convention as SVG: high value = top (0%), low = bottom (100%) */}
                        <button
                          type="button"
                          className="absolute w-3 h-3 -ml-1.5 rounded-full border-2 border-white bg-zinc-700 shadow cursor-grab active:cursor-grabbing hover:scale-110 z-20"
                          style={{
                            left: 0,
                            top: `${(1 - n(curve.startVal)) * 100}%`,
                            transform: 'translateY(-50%)',
                            backgroundColor: stroke,
                          }}
                          title={`${curve.label} start — drag to tweak`}
                          onMouseDown={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            const segmentRect = (e.currentTarget as HTMLElement).parentElement?.getBoundingClientRect()
                            if (segmentRect)
                              setAutomationDrag({ curve, which: 'start', segmentRect })
                          }}
                        />
                        {/* End handle (right) — same Y convention as SVG */}
                        <button
                          type="button"
                          className="absolute w-3 h-3 -mr-1.5 rounded-full border-2 border-white bg-zinc-700 shadow cursor-grab active:cursor-grabbing hover:scale-110 z-20"
                          style={{
                            left: '100%',
                            top: `${(1 - n(curve.endVal)) * 100}%`,
                            transform: 'translate(-50%, -50%)',
                            backgroundColor: stroke,
                          }}
                          title={`${curve.label} end — drag to tweak`}
                          onMouseDown={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            const segmentRect = (e.currentTarget as HTMLElement).parentElement?.getBoundingClientRect()
                            if (segmentRect)
                              setAutomationDrag({ curve, which: 'end', segmentRect })
                          }}
                        />
                        <span
                          className="absolute left-1 top-0.5 text-[9px] font-medium text-white/70 truncate max-w-[60%] pointer-events-none"
                          title={curve.label}
                        >
                          {curve.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ))}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white/70 pointer-events-none z-10"
                style={{
                  left: `${(currentTime / totalDuration) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={addScene}
          className="h-16 w-10 shrink-0 rounded-lg border-2 border-dashed border-white/25 bg-zinc-800/80 hover:bg-zinc-700/80 hover:border-white/40 flex items-center justify-center text-white/50 hover:text-white text-lg transition-colors"
          title="Add scene"
        >
          +
        </button>
      </div>
    </div>
  )
}

function getRulerTicks(totalDuration: number): { time: number; isMajor: boolean }[] {
  if (totalDuration <= 0) return []
  const step = totalDuration <= 1 ? 0.25 : totalDuration <= 5 ? 0.5 : totalDuration <= 30 ? 1 : 5
  const ticks: { time: number; isMajor: boolean }[] = []
  for (let t = 0; t < totalDuration; t += step) {
    const isMajor = t === 0 || (step >= 1 ? t === Math.floor(t) : (t * 2) % 1 < 0.001)
    ticks.push({ time: t, isMajor })
  }
  ticks.push({ time: totalDuration, isMajor: true })
  return ticks
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)
  const ss = String(s).padStart(2, '0')
  const mss = String(ms).padStart(3, '0')
  return m > 0 ? `${m}:${ss}.${mss}` : `${s}.${mss}`
}
