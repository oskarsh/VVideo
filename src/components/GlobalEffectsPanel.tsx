import { useState } from 'react'
import { useStore } from '@/store'
import { CollapsibleSection } from './CollapsibleSection'
import {
  getGlobalEffectStateAtTime,
  createKeyframeAtTime,
  DEFAULT_GLOBAL_KEYFRAMES,
} from '@/lib/globalEffects'
import type { Scene, GlobalEffectType, Project } from '@/types'
import { getFlyoverStateAt } from '@/lib/flyover'
import { GLOBAL_EFFECT_LABELS } from '@/lib/effectLabels'
import { inputClass } from '@/constants/ui'
import { DITHER_MODES } from '@/constants/effects'

export const GLOBAL_EFFECT_TYPES: GlobalEffectType[] = [
  'camera',
  'grain',
  'dither',
  'dof',
  'handheld',
  'chromaticAberration',
  'lensDistortion',
  'glitch',
  'vignette',
  'scanline',
]

/** Build effect state at time from scene (for "add keyframe" when no global track yet). */
export function getSceneEffectStateAtTime(
  scene: Scene,
  effectType: GlobalEffectType,
  sceneLocalTime: number,
  sceneDuration: number
): Record<string, unknown> | null {
  const t = sceneDuration > 0 ? Math.min(1, sceneLocalTime / sceneDuration) : 0
  const lerp = (a: number, b: number) => a + (b - a) * t
  if (effectType === 'camera') {
    const state = getFlyoverStateAt(scene, t)
    return { fov: state?.fov ?? 50 }
  }
  const eff = scene.effects.find((e) => e.type === effectType)
  if (!eff) return null
  switch (effectType) {
    case 'grain': {
      const g = eff as { startOpacity?: number; endOpacity?: number; opacity?: number }
      const s = g.startOpacity ?? g.opacity ?? 0.15
      const e = g.endOpacity ?? g.opacity ?? 0.15
      return { type: 'grain', startOpacity: lerp(s, e), endOpacity: lerp(s, e) }
    }
    case 'dof': {
      const d = eff as {
        enabled?: boolean
        focusDistanceStart?: number
        focusDistanceEnd?: number
        focalLengthStart?: number
        focalLengthEnd?: number
        focusRangeStart?: number
        focusRangeEnd?: number
        bokehScaleStart?: number
        bokehScaleEnd?: number
      }
      return {
        type: 'dof',
        enabled: d.enabled,
        focusDistanceStart: lerp(d.focusDistanceStart ?? 0.015, d.focusDistanceEnd ?? 0.015),
        focusDistanceEnd: lerp(d.focusDistanceStart ?? 0.015, d.focusDistanceEnd ?? 0.015),
        focalLengthStart: lerp(d.focalLengthStart ?? 0.02, d.focalLengthEnd ?? 0.02),
        focalLengthEnd: lerp(d.focalLengthStart ?? 0.02, d.focalLengthEnd ?? 0.02),
        focusRangeStart: lerp(d.focusRangeStart ?? 0.5, d.focusRangeEnd ?? 0.5),
        focusRangeEnd: lerp(d.focusRangeStart ?? 0.5, d.focusRangeEnd ?? 0.5),
        bokehScaleStart: lerp(d.bokehScaleStart ?? 6, d.bokehScaleEnd ?? 6),
        bokehScaleEnd: lerp(d.bokehScaleStart ?? 6, d.bokehScaleEnd ?? 6),
      }
    }
    case 'handheld': {
      const h = eff as {
        enabled?: boolean
        intensityStart?: number
        intensityEnd?: number
        rotationShakeStart?: number
        rotationShakeEnd?: number
        speedStart?: number
        speedEnd?: number
      }
      return {
        type: 'handheld',
        enabled: h.enabled,
        intensityStart: lerp(h.intensityStart ?? 0.012, h.intensityEnd ?? 0.012),
        intensityEnd: lerp(h.intensityStart ?? 0.012, h.intensityEnd ?? 0.012),
        rotationShakeStart: lerp(h.rotationShakeStart ?? 0.008, h.rotationShakeEnd ?? 0.008),
        rotationShakeEnd: lerp(h.rotationShakeStart ?? 0.008, h.rotationShakeEnd ?? 0.008),
        speedStart: lerp(h.speedStart ?? 1.2, h.speedEnd ?? 1.2),
        speedEnd: lerp(h.speedStart ?? 1.2, h.speedEnd ?? 1.2),
      }
    }
    case 'chromaticAberration': {
      const c = eff as { enabled?: boolean; offsetStart?: number; offsetEnd?: number; offset?: number }
      const s = c.offsetStart ?? c.offset ?? 0.005
      const e = c.offsetEnd ?? c.offset ?? 0.005
      return {
        type: 'chromaticAberration',
        enabled: c.enabled,
        offsetStart: lerp(s, e),
        offsetEnd: lerp(s, e),
        radialModulation: true,
      }
    }
    case 'lensDistortion': {
      const l = eff as { enabled?: boolean; distortionStart?: number; distortionEnd?: number; distortion?: number }
      const s = l.distortionStart ?? l.distortion ?? 0.05
      const e = l.distortionEnd ?? l.distortion ?? 0.05
      return {
        type: 'lensDistortion',
        enabled: l.enabled,
        distortionStart: lerp(s, e),
        distortionEnd: lerp(s, e),
      }
    }
    case 'glitch': {
      const g = eff as unknown as Record<string, unknown>
      return { ...g, type: 'glitch' }
    }
    case 'vignette': {
      const v = eff as { enabled?: boolean; offset?: number; darkness?: number }
      return { type: 'vignette', enabled: v.enabled, offset: v.offset ?? 0.5, darkness: v.darkness ?? 0.5 }
    }
    case 'scanline': {
      const s = eff as { enabled?: boolean; density?: number; scrollSpeed?: number }
      return {
        type: 'scanline',
        enabled: s.enabled,
        density: s.density ?? 1.5,
        scrollSpeed: s.scrollSpeed ?? 0,
      }
    }
    default:
      return null
  }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}:${s.toFixed(1)}` : s.toFixed(1) + 's'
}

/** State at playhead for sliders: from keyframes, or project.dither / scene, or defaults. Never null. */
function getStateAtPlayhead(
  project: Project,
  effectType: GlobalEffectType,
  currentTime: number,
  scene: Scene | null,
  sceneLocalTime: number,
  sceneDuration: number
): Record<string, unknown> {
  const fromTrack = getGlobalEffectStateAtTime(project, effectType, currentTime)
  if (fromTrack) return fromTrack
  if (effectType === 'dither' && project.dither)
    return project.dither as unknown as Record<string, unknown>
  if (scene) {
    const fromScene = getSceneEffectStateAtTime(scene, effectType, sceneLocalTime, sceneDuration)
    if (fromScene) return fromScene
  }
  return getDefaultEffectState(effectType)
}

function getDefaultEffectState(effectType: GlobalEffectType): Record<string, unknown> {
  const kf = DEFAULT_GLOBAL_KEYFRAMES[effectType] as unknown as Record<string, unknown>
  switch (effectType) {
    case 'camera':
      return { fov: kf.fov ?? 50 }
    case 'grain':
      return { startOpacity: kf.opacity ?? 0.15, endOpacity: kf.opacity ?? 0.15 }
    case 'dither':
      return { preset: kf.preset, mode: kf.mode, levels: kf.levels, intensity: kf.intensity, luminanceOnly: kf.luminanceOnly, thresholdBias: kf.thresholdBias }
    case 'dof':
      return {
        focusDistanceStart: kf.focusDistance, focusDistanceEnd: kf.focusDistance,
        focalLengthStart: kf.focalLength, focalLengthEnd: kf.focalLength,
        focusRangeStart: kf.focusRange, focusRangeEnd: kf.focusRange,
        bokehScaleStart: kf.bokehScale, bokehScaleEnd: kf.bokehScale,
      }
    case 'handheld':
      return {
        intensityStart: kf.intensity, intensityEnd: kf.intensity,
        rotationShakeStart: kf.rotationShake, rotationShakeEnd: kf.rotationShake,
        speedStart: kf.speed, speedEnd: kf.speed,
      }
    case 'chromaticAberration':
      return { offsetStart: kf.offset, offsetEnd: kf.offset }
    case 'lensDistortion':
      return { distortionStart: kf.distortion, distortionEnd: kf.distortion }
    case 'glitch':
      return { ratio: kf.ratio, columns: kf.columns }
    case 'vignette':
      return { offset: kf.offset, darkness: kf.darkness }
    case 'scanline':
      return { density: kf.density, scrollSpeed: kf.scrollSpeed }
    default:
      return { ...kf }
  }
}

/** Single slider with a keyframe dot button on the right.
 *  - `onChange`          — slider drag; never creates a keyframe
 *  - `onKeyframe`        — button click when NOT on a keyframe; commits a keyframe
 *  - `onRemoveKeyframe`  — button click when ON a keyframe; removes it
 *  - `isOnKeyframe`      — dot is filled when true, outlined when false
 */
function SliderWithKeyframe({
  label,
  paramKey,
  value,
  min,
  max,
  step,
  format = (v) => String(v),
  onChange,
  onKeyframe,
  onRemoveKeyframe,
  isOnKeyframe = false,
}: {
  label: string
  paramKey: string
  value: number
  min: number
  max: number
  step: number
  format?: (v: number) => string
  onChange: (v: number) => void
  onKeyframe: (patch: Record<string, number>) => void
  onRemoveKeyframe?: () => void
  isOnKeyframe?: boolean
}) {
  const handleButtonClick = () => {
    if (isOnKeyframe && onRemoveKeyframe) {
      onRemoveKeyframe()
    } else {
      onKeyframe({ [paramKey]: value })
    }
  }

  return (
    <div className="flex items-center gap-1 group">
      <div className="flex-1 min-w-0">
        <span className="text-[11px] text-white/50 block">{label}</span>
        <div className="flex items-center gap-1 mt-0.5 min-h-8">
          <div className="flex-1 min-w-0 flex items-center" style={{ minHeight: 24 }}>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={value}
              onChange={(e) => onChange(parseFloat(e.target.value))}
              className="w-full block"
              style={{ minWidth: 60 }}
            />
          </div>
          <span className="text-[10px] text-white/40 w-8 shrink-0">{format(value)}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={handleButtonClick}
        className="w-6 h-6 rounded flex items-center justify-center shrink-0 hover:bg-white/10"
        title={isOnKeyframe ? 'Remove keyframe at playhead' : 'Set keyframe at playhead'}
      >
        <svg viewBox="0 0 10 10" className="w-2.5 h-2.5">
          {isOnKeyframe
            ? <circle cx="5" cy="5" r="4.5" fill="white" />
            : <circle cx="5" cy="5" r="3.5" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
          }
        </svg>
      </button>
    </div>
  )
}

export function GlobalEffectsPanel({ singleEffectType }: { singleEffectType?: GlobalEffectType } = {}) {
  const project = useStore((s) => s.project)
  const currentTime = useStore((s) => s.currentTime)
  const currentSceneIndex = useStore((s) => s.currentSceneIndex)
  const setCurrentTime = useStore((s) => s.setCurrentTime)
  const setGlobalEffectTrack = useStore((s) => s.setGlobalEffectTrack)
  const removeGlobalEffectKeyframe = useStore((s) => s.removeGlobalEffectKeyframe)
  const setGlobalEffectKeyframeAtTime = useStore((s) => s.setGlobalEffectKeyframeAtTime)
  const setGlobalEffectParams = useStore((s) => s.setGlobalEffectParams)

  // Draft values per effect — held locally until the user clicks a keyframe button.
  // Once a keyframe is committed the draft is cleared and the store becomes the source of truth.
  const [drafts, setDrafts] = useState<Record<string, Record<string, unknown>>>({})

  const scene = project.scenes[currentSceneIndex] ?? null
  const sceneStartTime = project.scenes
    .slice(0, currentSceneIndex)
    .reduce((acc, s) => acc + s.durationSeconds, 0)
  const sceneLocalTime = scene ? currentTime - sceneStartTime : 0
  const sceneDuration = scene?.durationSeconds ?? 0

  const effectTypesToRender = singleEffectType ? [singleEffectType] : GLOBAL_EFFECT_TYPES

  return (
    <div className="space-y-1">
      {!singleEffectType && (
        <p className="text-xs text-white/50 mb-2">
          Drag a slider to preview. Click the play button next to a slider to commit it as a keyframe. Once keyframes exist, dragging a slider updates the keyframe at the playhead.
        </p>
      )}
      {effectTypesToRender.map((effectType) => {
        const track = project.globalEffects?.[effectType]
        const hasTrack = track && track.keyframes.length > 0
        const label = GLOBAL_EFFECT_LABELS[effectType]
        const state = getStateAtPlayhead(project, effectType, currentTime, scene, sceneLocalTime, sceneDuration)

        // When no track at all, merge in any local draft so sliders show the dragged value.
        // When track exists (even with no keyframes), the store already reflects params, so no draft needed.
        const draft = !track ? (drafts[effectType] ?? {}) : {}
        const displayState: Record<string, unknown> = track ? state : { ...state, ...draft }

        // Whether the playhead sits on an existing keyframe for this effect (±50 ms snap).
        const SNAP_EPS = 0.05
        const isOnKeyframe = Boolean(
          hasTrack && track!.keyframes.some((kf) => Math.abs(kf.time - currentTime) < SNAP_EPS)
        )

        // Remove the keyframe closest to the current playhead position.
        const removeKeyframeAtCurrentTime = () => {
          if (!hasTrack) return
          const idx = track!.keyframes.findIndex((kf) => Math.abs(kf.time - currentTime) < SNAP_EPS)
          if (idx >= 0) removeGlobalEffectKeyframe(effectType, idx)
        }

        // Slider drag:
        //   draftPatch — keys matching what displayState reads (start/end variants where needed)
        //   kfPatch    — keys for the global keyframe store (simple paramKey names); defaults to draftPatch
        //   - has keyframe track → write kfPatch to keyframe at playhead
        //   - track exists, no keyframes → write kfPatch to track.params (canvas updates immediately, no keyframe created)
        //   - no track → write draftPatch to local draft only
        const onSliderChange = (
          draftPatch: Record<string, unknown>,
          kfPatch: Record<string, unknown> = draftPatch
        ) => {
          if (hasTrack) {
            setGlobalEffectKeyframeAtTime(effectType, currentTime, kfPatch as Partial<import('@/types').GlobalEffectKeyframe>)
          } else if (track) {
            setGlobalEffectParams(effectType, { ...(track.params ?? {}), ...kfPatch })
          } else {
            setDrafts((prev) => ({
              ...prev,
              [effectType]: { ...(prev[effectType] ?? {}), ...draftPatch },
            }))
          }
        }

        // Select / checkbox change (field names are the same for draft and keyframe store).
        const onControlChange = (patch: Record<string, unknown>) => {
          if (hasTrack) {
            setGlobalEffectKeyframeAtTime(effectType, currentTime, patch as Partial<import('@/types').GlobalEffectKeyframe>)
          } else if (track) {
            setGlobalEffectParams(effectType, { ...(track.params ?? {}), ...patch })
          } else {
            setDrafts((prev) => ({
              ...prev,
              [effectType]: { ...(prev[effectType] ?? {}), ...patch },
            }))
          }
        }

        // Keyframe button click (when NOT on a keyframe): always commits.
        // Merges state + draft + the button's param value, then clears the draft.
        const onKf = (patch: Record<string, unknown>) => {
          if (hasTrack) {
            setGlobalEffectKeyframeAtTime(effectType, currentTime, patch as Partial<import('@/types').GlobalEffectKeyframe>)
          } else {
            const kf = createKeyframeAtTime(effectType, currentTime, { ...state, ...draft, ...patch })
            setGlobalEffectTrack(effectType, { enabled: true, keyframes: [kf] })
            setDrafts((prev) => {
              const next = { ...prev }
              delete next[effectType]
              return next
            })
          }
        }

        const inner = (
          <div className="rounded bg-white/5 p-2 space-y-2">
            {/* Sliders always visible — reflect current state at playhead (keyframes, project.dither, or scene). */}
            {(() => {
              // Shared props for every SliderWithKeyframe in this effect section.
              const kfProps = { isOnKeyframe, onRemoveKeyframe: removeKeyframeAtCurrentTime }

              if (effectType === 'camera') {
                const fov = (displayState.fov ?? 50) as number
                return (
                  <div className="space-y-2">
                    <SliderWithKeyframe
                      label="FOV (field of view) °"
                      paramKey="fov"
                      value={fov}
                      min={10}
                      max={120}
                      step={1}
                      format={(x) => `${Math.round(x)}°`}
                      onChange={(v) => onSliderChange({ fov: v })}
                      onKeyframe={(p) => onKf(p)}
                      {...kfProps}
                    />
                  </div>
                )
              }
              if (effectType === 'grain') {
                const v = (displayState.startOpacity ?? displayState.endOpacity ?? 0.15) as number
                return (
                  <div className="space-y-2">
                    <SliderWithKeyframe
                      label="Opacity"
                      paramKey="opacity"
                      value={v}
                      min={0}
                      max={0.5}
                      step={0.01}
                      format={(x) => `${(x * 100).toFixed(0)}%`}
                      onChange={(v) => onSliderChange({ startOpacity: v, endOpacity: v }, { opacity: v })}
                      onKeyframe={(p) => onKf(p)}
                      {...kfProps}
                    />
                  </div>
                )
              }
              if (effectType === 'dither') {
                const d = displayState
                return (
                  <div className="space-y-2">
                    <div>
                      <span className="text-[11px] text-white/50 block mb-1">Preset</span>
                      <select
                        value={(d.preset as string) ?? 'medium'}
                        onChange={(e) => onControlChange({ preset: e.target.value })}
                        className={inputClass}
                      >
                        {['subtle', 'medium', 'strong', 'custom'].map((v) => (
                          <option key={v} value={v} className="bg-zinc-900">{v}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <span className="text-[11px] text-white/50 block mb-1">Mode</span>
                      <select
                        value={(d.mode as string) ?? 'bayer4'}
                        onChange={(e) => onControlChange({ mode: e.target.value })}
                        className={inputClass}
                      >
                        {DITHER_MODES.map(({ value, label }) => (
                          <option key={value} value={value} className="bg-zinc-900">{label}</option>
                        ))}
                      </select>
                    </div>
                    {((d.preset as string) ?? 'medium') === 'custom' && (
                      <SliderWithKeyframe label="Levels" paramKey="levels" value={(d.levels ?? 8) as number} min={2} max={32} step={1} onChange={(v) => onSliderChange({ levels: v })} onKeyframe={(p) => onKf(p)} {...kfProps} />
                    )}
                    <SliderWithKeyframe label="Intensity" paramKey="intensity" value={(d.intensity ?? 1) as number} min={0} max={1} step={0.05} format={(x) => `${(x * 100).toFixed(0)}%`} onChange={(v) => onSliderChange({ intensity: v })} onKeyframe={(p) => onKf(p)} {...kfProps} />
                    <SliderWithKeyframe label="Threshold bias" paramKey="thresholdBias" value={(d.thresholdBias ?? 0) as number} min={-0.3} max={0.3} step={0.02} onChange={(v) => onSliderChange({ thresholdBias: v })} onKeyframe={(p) => onKf(p)} {...kfProps} />
                    <label className="flex items-center gap-2 text-[11px] text-white/60 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(d.luminanceOnly as boolean) ?? false}
                        onChange={(e) => onControlChange({ luminanceOnly: e.target.checked })}
                        className="rounded border-white/20"
                      />
                      Luminance only
                    </label>
                  </div>
                )
              }
              if (effectType === 'dof') {
                const d = displayState
                return (
                  <div className="space-y-2">
                    <SliderWithKeyframe label="Focus distance" paramKey="focusDistance" value={(d.focusDistanceStart ?? d.focusDistanceEnd ?? 0.015) as number} min={0} max={0.1} step={0.001} format={(x) => x.toFixed(3)} onChange={(v) => onSliderChange({ focusDistanceStart: v, focusDistanceEnd: v }, { focusDistance: v })} onKeyframe={(p) => onKf(p)} {...kfProps} />
                    <SliderWithKeyframe label="Focus range" paramKey="focusRange" value={(d.focusRangeStart ?? d.focusRangeEnd ?? 0.5) as number} min={0.05} max={2} step={0.05} onChange={(v) => onSliderChange({ focusRangeStart: v, focusRangeEnd: v }, { focusRange: v })} onKeyframe={(p) => onKf(p)} {...kfProps} />
                    <SliderWithKeyframe label="Bokeh scale" paramKey="bokehScale" value={(d.bokehScaleStart ?? d.bokehScaleEnd ?? 6) as number} min={0.5} max={15} step={0.5} onChange={(v) => onSliderChange({ bokehScaleStart: v, bokehScaleEnd: v }, { bokehScale: v })} onKeyframe={(p) => onKf(p)} {...kfProps} />
                  </div>
                )
              }
              if (effectType === 'handheld') {
                const h = displayState
                return (
                  <div className="space-y-2">
                    <SliderWithKeyframe label="Intensity" paramKey="intensity" value={(h.intensityStart ?? h.intensityEnd ?? 0.012) as number} min={0} max={0.05} step={0.001} format={(x) => x.toFixed(3)} onChange={(v) => onSliderChange({ intensityStart: v, intensityEnd: v }, { intensity: v })} onKeyframe={(p) => onKf(p)} {...kfProps} />
                    <SliderWithKeyframe label="Rotation shake" paramKey="rotationShake" value={(h.rotationShakeStart ?? h.rotationShakeEnd ?? 0.008) as number} min={0} max={0.03} step={0.001} format={(x) => x.toFixed(3)} onChange={(v) => onSliderChange({ rotationShakeStart: v, rotationShakeEnd: v }, { rotationShake: v })} onKeyframe={(p) => onKf(p)} {...kfProps} />
                    <SliderWithKeyframe label="Speed" paramKey="speed" value={(h.speedStart ?? h.speedEnd ?? 1.2) as number} min={0.2} max={3} step={0.1} onChange={(v) => onSliderChange({ speedStart: v, speedEnd: v }, { speed: v })} onKeyframe={(p) => onKf(p)} {...kfProps} />
                  </div>
                )
              }
              if (effectType === 'chromaticAberration') {
                const c = displayState
                return (
                  <div className="space-y-2">
                    <SliderWithKeyframe label="Offset" paramKey="offset" value={(c.offsetStart ?? c.offsetEnd ?? 0.005) as number} min={0} max={0.02} step={0.001} format={(x) => (x * 1000).toFixed(1)} onChange={(v) => onSliderChange({ offsetStart: v, offsetEnd: v }, { offset: v })} onKeyframe={(p) => onKf(p)} {...kfProps} />
                  </div>
                )
              }
              if (effectType === 'lensDistortion') {
                const l = displayState
                return (
                  <div className="space-y-2">
                    <SliderWithKeyframe label="Distortion" paramKey="distortion" value={(l.distortionStart ?? l.distortionEnd ?? 0.05) as number} min={-0.2} max={0.2} step={0.01} onChange={(v) => onSliderChange({ distortionStart: v, distortionEnd: v }, { distortion: v })} onKeyframe={(p) => onKf(p)} {...kfProps} />
                  </div>
                )
              }
              if (effectType === 'glitch') {
                const g = displayState
                return (
                  <div className="space-y-2">
                    <SliderWithKeyframe label="Ratio" paramKey="ratio" value={(g.ratio ?? 0.85) as number} min={0} max={1} step={0.05} onChange={(v) => onSliderChange({ ratio: v })} onKeyframe={(p) => onKf(p)} {...kfProps} />
                    <SliderWithKeyframe label="Columns" paramKey="columns" value={(g.columns ?? 0.05) as number} min={0.01} max={0.2} step={0.01} onChange={(v) => onSliderChange({ columns: v })} onKeyframe={(p) => onKf(p)} {...kfProps} />
                  </div>
                )
              }
              if (effectType === 'vignette') {
                const v = displayState
                return (
                  <div className="space-y-2">
                    <SliderWithKeyframe label="Offset" paramKey="offset" value={(v.offset ?? 0.5) as number} min={0} max={1} step={0.05} onChange={(x) => onSliderChange({ offset: x })} onKeyframe={(p) => onKf(p)} {...kfProps} />
                    <SliderWithKeyframe label="Darkness" paramKey="darkness" value={(v.darkness ?? 0.5) as number} min={0} max={1} step={0.05} onChange={(x) => onSliderChange({ darkness: x })} onKeyframe={(p) => onKf(p)} {...kfProps} />
                  </div>
                )
              }
              if (effectType === 'scanline') {
                const s = displayState
                return (
                  <div className="space-y-2">
                    <SliderWithKeyframe label="Density" paramKey="density" value={(s.density ?? 1.5) as number} min={0.5} max={4} step={0.1} onChange={(v) => onSliderChange({ density: v })} onKeyframe={(p) => onKf(p)} {...kfProps} />
                    <SliderWithKeyframe label="Scroll speed" paramKey="scrollSpeed" value={(s.scrollSpeed ?? 0) as number} min={0} max={2} step={0.1} onChange={(v) => onSliderChange({ scrollSpeed: v })} onKeyframe={(p) => onKf(p)} {...kfProps} />
                  </div>
                )
              }
              return null
            })()}
            {hasTrack && (
              <>
                <div className="space-y-1 max-h-32 overflow-y-auto border-t border-white/10 pt-2">
                  {[...track!.keyframes]
                    .sort((a, b) => a.time - b.time)
                    .map((kf) => {
                      const originalIndex = track!.keyframes.indexOf(kf)
                      return (
                        <div
                          key={`${kf.time}-${originalIndex}`}
                          className="flex items-center justify-between gap-2 text-[11px] bg-black/20 rounded px-2 py-1"
                        >
                          <button
                            type="button"
                            onClick={() => setCurrentTime(kf.time)}
                            className="text-white/80 hover:text-white truncate min-w-0"
                            title="Seek to keyframe"
                          >
                            {formatTime(kf.time)}
                          </button>
                          <span className="text-white/40 shrink-0">
                            {effectType === 'camera' && 'fov' in kf
                              ? `${Math.round((kf as { fov: number }).fov)}°`
                              : effectType === 'grain' && 'opacity' in kf
                                ? `${((kf as { opacity: number }).opacity * 100).toFixed(0)}%`
                                : effectType === 'dither' && 'intensity' in kf
                                  ? `${((kf as { intensity: number }).intensity * 100).toFixed(0)}%`
                                  : effectType === 'dof' && 'focusDistance' in kf
                                    ? `focus ${(kf as { focusDistance: number }).focusDistance.toFixed(3)}`
                                    : effectType === 'vignette' && 'darkness' in kf
                                      ? `dark ${(kf as { darkness: number }).darkness.toFixed(2)}`
                                      : ''}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeGlobalEffectKeyframe(effectType, originalIndex)}
                            className="text-red-400/80 hover:text-red-400 shrink-0"
                            title="Remove keyframe"
                          >
                            ×
                          </button>
                        </div>
                      )
                    })}
                </div>
                {track!.keyframes.length <= 1 && (
                  <button
                    type="button"
                    onClick={() => setGlobalEffectTrack(effectType, null)}
                    className="text-xs text-white/50 hover:text-white"
                  >
                    Remove all keyframes (hide lane)
                  </button>
                )}
              </>
            )}
          </div>
        )

        return singleEffectType ? (
          <div key={effectType}>{inner}</div>
        ) : (
          <CollapsibleSection key={effectType} title={label} defaultOpen={false} singleItem>
            {inner}
          </CollapsibleSection>
        )
      })}
    </div>
  )
}
