/**
 * Global effect state at a given project time.
 * - If no track: return null (caller uses per-scene or project.dither).
 * - If track exists with no keyframes: return state from track.enabled + default params (toggle on/off only).
 * - If track has keyframes: interpolate at time and return state.
 */

import type {
  Project,
  GlobalEffectType,
  GlobalEffectKeyframe,
  GlobalEffectKeyframeCamera,
  GlobalEffectKeyframeDither,
  GlobalEffectKeyframeDoF,
  GlobalEffectKeyframeHandheld,
  GlobalEffectKeyframeChromatic,
  GlobalEffectKeyframeLens,
  GlobalEffectKeyframeGlitch,
  GlobalEffectKeyframeVignette,
  GlobalEffectKeyframeScanline,
  GlitchAlgorithm,
} from '@/types'

function lerpNum(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function lerpBool(a: boolean, b: boolean, t: number): boolean {
  return t < 0.5 ? a : b
}

function sampleNum(
  kfs: Array<Record<string, unknown>>,
  time: number,
  key: string,
  def: number
): number {
  if (kfs.length === 0) return def
  const times = [...new Set(kfs.map((k) => (k.time as number) ?? 0))].sort((a, b) => a - b)
  const first = kfs.find((k) => (k.time as number) === times[0])
  const last = kfs.find((k) => (k.time as number) === times[times.length - 1])
  if (time <= times[0]) return (first?.[key] as number) ?? def
  if (time >= times[times.length - 1]) return (last?.[key] as number) ?? def
  let i = 0
  while (i < times.length - 1 && times[i + 1] <= time) i++
  const t0 = times[i]
  const t1 = times[i + 1]
  const k0 = kfs.find((k) => (k.time as number) === t0)
  const k1 = kfs.find((k) => (k.time as number) === t1)
  const v0 = (k0?.[key] as number) ?? def
  const v1 = (k1?.[key] as number) ?? def
  const t = (time - t0) / Math.max(1e-9, t1 - t0)
  return lerpNum(v0, v1, t)
}

function sampleBool(
  kfs: Array<Record<string, unknown>>,
  time: number,
  key: string,
  def: boolean
): boolean {
  if (kfs.length === 0) return def
  const times = [...new Set(kfs.map((k) => (k.time as number) ?? 0))].sort((a, b) => a - b)
  if (time <= times[0])
    return (kfs.find((k) => (k.time as number) === times[0])?.[key] as boolean) ?? def
  if (time >= times[times.length - 1])
    return (kfs.find((k) => (k.time as number) === times[times.length - 1])?.[key] as boolean) ?? def
  let i = 0
  while (i < times.length - 1 && times[i + 1] <= time) i++
  const t0 = times[i]
  const t1 = times[i + 1]
  const k0 = kfs.find((k) => (k.time as number) === t0)
  const k1 = kfs.find((k) => (k.time as number) === t1)
  const v0 = (k0?.[key] as boolean) ?? def
  const v1 = (k1?.[key] as boolean) ?? def
  const t = (time - t0) / Math.max(1e-9, t1 - t0)
  return lerpBool(v0, v1, t)
}

function sampleNearest<T>(kfs: Array<Record<string, unknown>>, time: number, key: string, def: T): T {
  if (kfs.length === 0) return def
  const sorted = [...kfs].sort((a, b) => (a.time as number) - (b.time as number))
  let i = 0
  while (i < sorted.length && (sorted[i].time as number) < time) i++
  if (i >= sorted.length) return (sorted[sorted.length - 1]?.[key] as T) ?? def
  if (i === 0) return (sorted[0]?.[key] as T) ?? def
  const prev = sorted[i - 1].time as number
  const next = sorted[i].time as number
  return ((time - prev <= next - time ? sorted[i - 1] : sorted[i])?.[key] as T) ?? def
}

export function getGlobalEffectStateAtTime(
  project: Project,
  effectType: GlobalEffectType,
  time: number
): Record<string, unknown> | null {
  const track = project.globalEffects?.[effectType]
  if (!track) return null
  const kfs = track.keyframes as unknown as Array<Record<string, unknown>>
  const hasKeyframes = kfs?.length > 0
  // When track exists but has no keyframes: effect on/off is track.enabled only; use defaults for params.
  if (!hasKeyframes) {
    const enabled = track.enabled !== false
    const def = DEFAULT_GLOBAL_KEYFRAMES[effectType] as unknown as Record<string, unknown>
    switch (effectType) {
      case 'camera':
        return { enabled, fov: def.fov ?? 50 }
      case 'grain':
        return { type: 'grain', enabled, startOpacity: def.opacity ?? 0.06, endOpacity: def.opacity ?? 0.06 }
      case 'dither':
        return {
          type: 'dither',
          enabled,
          preset: def.preset ?? 'medium',
          mode: def.mode ?? 'bayer4',
          levels: def.levels ?? 8,
          intensity: def.intensity ?? 1,
          luminanceOnly: def.luminanceOnly ?? false,
          thresholdBias: def.thresholdBias ?? 0,
        }
      case 'dof':
        return {
          type: 'dof',
          enabled,
          focusDistanceStart: def.focusDistance ?? 0.015,
          focusDistanceEnd: def.focusDistance ?? 0.015,
          focalLengthStart: def.focalLength ?? 0.02,
          focalLengthEnd: def.focalLength ?? 0.02,
          focusRangeStart: def.focusRange ?? 0.22,
          focusRangeEnd: def.focusRange ?? 0.22,
          bokehScaleStart: def.bokehScale ?? 2.8,
          bokehScaleEnd: def.bokehScale ?? 2.8,
        }
      case 'handheld':
        return {
          type: 'handheld',
          enabled,
          intensityStart: def.intensity ?? 0.012,
          intensityEnd: def.intensity ?? 0.012,
          rotationShakeStart: def.rotationShake ?? 0.008,
          rotationShakeEnd: def.rotationShake ?? 0.008,
          speedStart: def.speed ?? 1.2,
          speedEnd: def.speed ?? 1.2,
        }
      case 'chromaticAberration':
        return {
          type: 'chromaticAberration',
          enabled,
          offsetStart: def.offset ?? 0.005,
          offsetEnd: def.offset ?? 0.005,
          radialModulation: true,
        }
      case 'lensDistortion':
        return {
          type: 'lensDistortion',
          enabled,
          distortionStart: def.distortion ?? 0.05,
          distortionEnd: def.distortion ?? 0.05,
        }
      case 'glitch':
        return {
          type: 'glitch',
          enabled,
          algorithm: (def as unknown as GlobalEffectKeyframeGlitch).algorithm ?? 'sporadic',
          ratio: def.ratio ?? 0.85,
          columns: def.columns ?? 0.05,
          delayMin: def.delayMin ?? 1.5,
          delayMax: def.delayMax ?? 3.5,
          durationMin: def.durationMin ?? 0.6,
          durationMax: def.durationMax ?? 1,
          monochrome: def.monochrome ?? false,
        }
      case 'vignette':
        return { type: 'vignette', enabled, offset: def.offset ?? 0.5, darkness: def.darkness ?? 0.5 }
      case 'scanline':
        return {
          type: 'scanline',
          enabled,
          density: def.density ?? 1.5,
          scrollSpeed: def.scrollSpeed ?? 0,
        }
      default:
        return null
    }
  }
  const enabled = track.enabled !== false && (sampleBool(kfs, time, 'enabled', true) ?? true)

  switch (effectType) {
    case 'camera':
      return {
        enabled,
        fov: sampleNum(kfs, time, 'fov', 50),
      }
    case 'grain':
      return {
        type: 'grain',
        enabled,
        startOpacity: sampleNum(kfs, time, 'opacity', 0.06),
        endOpacity: sampleNum(kfs, time, 'opacity', 0.06),
      }
    case 'dither':
      return {
        type: 'dither',
        enabled,
        preset: sampleNearest(kfs, time, 'preset', 'medium'),
        mode: sampleNearest(kfs, time, 'mode', 'bayer4'),
        levels: Math.round(sampleNum(kfs, time, 'levels', 8)),
        intensity: sampleNum(kfs, time, 'intensity', 1),
        luminanceOnly: sampleNearest(kfs, time, 'luminanceOnly', false),
        thresholdBias: sampleNum(kfs, time, 'thresholdBias', 0),
      }
    case 'dof':
      return {
        type: 'dof',
        enabled,
        focusDistanceStart: sampleNum(kfs, time, 'focusDistance', 0.015),
        focusDistanceEnd: sampleNum(kfs, time, 'focusDistance', 0.015),
        focalLengthStart: sampleNum(kfs, time, 'focalLength', 0.02),
        focalLengthEnd: sampleNum(kfs, time, 'focalLength', 0.02),
        focusRangeStart: sampleNum(kfs, time, 'focusRange', 0.22),
        focusRangeEnd: sampleNum(kfs, time, 'focusRange', 0.22),
        bokehScaleStart: sampleNum(kfs, time, 'bokehScale', 2.8),
        bokehScaleEnd: sampleNum(kfs, time, 'bokehScale', 2.8),
      }
    case 'handheld':
      return {
        type: 'handheld',
        enabled,
        intensityStart: sampleNum(kfs, time, 'intensity', 0.012),
        intensityEnd: sampleNum(kfs, time, 'intensity', 0.012),
        rotationShakeStart: sampleNum(kfs, time, 'rotationShake', 0.008),
        rotationShakeEnd: sampleNum(kfs, time, 'rotationShake', 0.008),
        speedStart: sampleNum(kfs, time, 'speed', 1.2),
        speedEnd: sampleNum(kfs, time, 'speed', 1.2),
      }
    case 'chromaticAberration':
      return {
        type: 'chromaticAberration',
        enabled,
        offsetStart: sampleNum(kfs, time, 'offset', 0.005),
        offsetEnd: sampleNum(kfs, time, 'offset', 0.005),
        radialModulation: true,
      }
    case 'lensDistortion':
      return {
        type: 'lensDistortion',
        enabled,
        distortionStart: sampleNum(kfs, time, 'distortion', 0.05),
        distortionEnd: sampleNum(kfs, time, 'distortion', 0.05),
      }
    case 'glitch':
      return {
        type: 'glitch',
        enabled,
        algorithm: sampleNearest(kfs, time, 'algorithm', 'sporadic'),
        ratio: sampleNum(kfs, time, 'ratio', 0.85),
        columns: sampleNum(kfs, time, 'columns', 0.05),
        delayMin: sampleNum(kfs, time, 'delayMin', 1.5),
        delayMax: sampleNum(kfs, time, 'delayMax', 3.5),
        durationMin: sampleNum(kfs, time, 'durationMin', 0.6),
        durationMax: sampleNum(kfs, time, 'durationMax', 1),
        monochrome: sampleNearest(kfs, time, 'monochrome', false),
      }
    case 'vignette':
      return {
        type: 'vignette',
        enabled,
        offset: sampleNum(kfs, time, 'offset', 0.5),
        darkness: sampleNum(kfs, time, 'darkness', 0.5),
      }
    case 'scanline':
      return {
        type: 'scanline',
        enabled,
        density: sampleNum(kfs, time, 'density', 1.5),
        scrollSpeed: sampleNum(kfs, time, 'scrollSpeed', 0),
      }
    default:
      return null
  }
}

/** Default keyframe payload for "add keyframe" at given time. */
export const DEFAULT_GLOBAL_KEYFRAMES: Record<GlobalEffectType, GlobalEffectKeyframe> = {
  camera: { time: 0, fov: 50 },
  grain: { time: 0, opacity: 0.06 },
  dither: {
    time: 0,
    enabled: false,
    preset: 'medium',
    mode: 'bayer4',
    levels: 8,
    intensity: 1,
    luminanceOnly: false,
    thresholdBias: 0,
  },
  dof: {
    time: 0,
    enabled: true,
    focusDistance: 0.015,
    focalLength: 0.02,
    focusRange: 0.22,
    bokehScale: 2.8,
  },
  handheld: {
    time: 0,
    enabled: false,
    intensity: 0.012,
    rotationShake: 0.008,
    speed: 1.2,
  },
  chromaticAberration: { time: 0, enabled: false, offset: 0.005 },
  lensDistortion: { time: 0, enabled: false, distortion: 0.05 },
  glitch: {
    time: 0,
    enabled: false,
    algorithm: 'sporadic',
    ratio: 0.85,
    columns: 0.05,
    delayMin: 1.5,
    delayMax: 3.5,
    durationMin: 0.6,
    durationMax: 1,
    monochrome: false,
  },
  vignette: { time: 0, enabled: false, offset: 0.5, darkness: 0.5 },
  scanline: { time: 0, enabled: false, density: 1.5, scrollSpeed: 0 },
}

/** Create a keyframe at time `time` with same values as current state (from scene or defaults). */
export function createKeyframeAtTime(
  effectType: GlobalEffectType,
  time: number,
  currentState?: Record<string, unknown> | null
): GlobalEffectKeyframe {
  const def = { ...DEFAULT_GLOBAL_KEYFRAMES[effectType], time } as Record<string, unknown>
  if (!currentState) return { ...def, time } as GlobalEffectKeyframe
  switch (effectType) {
    case 'camera':
      return {
        time,
        fov: (currentState.fov ?? (DEFAULT_GLOBAL_KEYFRAMES.camera as GlobalEffectKeyframeCamera).fov) as number,
      }
    case 'grain':
      return {
        time,
        opacity: (currentState.startOpacity ?? currentState.endOpacity ?? def.opacity) as number,
      }
    case 'dither':
      return {
        time,
        enabled: (currentState.enabled ?? def.enabled) as boolean,
        preset: (currentState.preset ?? (DEFAULT_GLOBAL_KEYFRAMES.dither as GlobalEffectKeyframeDither).preset) as 'subtle' | 'medium' | 'strong' | 'custom',
        mode: (currentState.mode ?? (DEFAULT_GLOBAL_KEYFRAMES.dither as GlobalEffectKeyframeDither).mode) as GlobalEffectKeyframeDither['mode'],
        levels: (currentState.levels ?? (DEFAULT_GLOBAL_KEYFRAMES.dither as GlobalEffectKeyframeDither).levels) as number,
        intensity: (currentState.intensity ?? (DEFAULT_GLOBAL_KEYFRAMES.dither as GlobalEffectKeyframeDither).intensity) as number,
        luminanceOnly: (currentState.luminanceOnly ?? (DEFAULT_GLOBAL_KEYFRAMES.dither as GlobalEffectKeyframeDither).luminanceOnly) as boolean,
        thresholdBias: (currentState.thresholdBias ?? (DEFAULT_GLOBAL_KEYFRAMES.dither as GlobalEffectKeyframeDither).thresholdBias) as number,
      }
    case 'dof':
      return {
        time,
        enabled: (currentState.enabled ?? def.enabled) as boolean,
        focusDistance: (currentState.focusDistanceStart ?? currentState.focusDistanceEnd ?? (DEFAULT_GLOBAL_KEYFRAMES.dof as GlobalEffectKeyframeDoF).focusDistance) as number,
        focalLength: (currentState.focalLengthStart ?? currentState.focalLengthEnd ?? (DEFAULT_GLOBAL_KEYFRAMES.dof as GlobalEffectKeyframeDoF).focalLength) as number,
        focusRange: (currentState.focusRangeStart ?? currentState.focusRangeEnd ?? (DEFAULT_GLOBAL_KEYFRAMES.dof as GlobalEffectKeyframeDoF).focusRange) as number,
        bokehScale: (currentState.bokehScaleStart ?? currentState.bokehScaleEnd ?? (DEFAULT_GLOBAL_KEYFRAMES.dof as GlobalEffectKeyframeDoF).bokehScale) as number,
      }
    case 'handheld':
      return {
        time,
        enabled: (currentState.enabled ?? def.enabled) as boolean,
        intensity: (currentState.intensityStart ?? currentState.intensityEnd ?? (DEFAULT_GLOBAL_KEYFRAMES.handheld as GlobalEffectKeyframeHandheld).intensity) as number,
        rotationShake: (currentState.rotationShakeStart ?? currentState.rotationShakeEnd ?? (DEFAULT_GLOBAL_KEYFRAMES.handheld as GlobalEffectKeyframeHandheld).rotationShake) as number,
        speed: (currentState.speedStart ?? currentState.speedEnd ?? (DEFAULT_GLOBAL_KEYFRAMES.handheld as GlobalEffectKeyframeHandheld).speed) as number,
      }
    case 'chromaticAberration':
      return {
        time,
        enabled: (currentState.enabled ?? def.enabled) as boolean,
        offset: (currentState.offsetStart ?? currentState.offsetEnd ?? (DEFAULT_GLOBAL_KEYFRAMES.chromaticAberration as GlobalEffectKeyframeChromatic).offset) as number,
      }
    case 'lensDistortion':
      return {
        time,
        enabled: (currentState.enabled ?? def.enabled) as boolean,
        distortion: (currentState.distortionStart ?? currentState.distortionEnd ?? (DEFAULT_GLOBAL_KEYFRAMES.lensDistortion as GlobalEffectKeyframeLens).distortion) as number,
      }
    case 'glitch':
      return {
        time,
        enabled: (currentState.enabled ?? def.enabled) as boolean,
        algorithm: (currentState.algorithm ?? (DEFAULT_GLOBAL_KEYFRAMES.glitch as GlobalEffectKeyframeGlitch).algorithm ?? 'sporadic') as GlitchAlgorithm,
        ratio: (currentState.ratio ?? (DEFAULT_GLOBAL_KEYFRAMES.glitch as GlobalEffectKeyframeGlitch).ratio) as number,
        columns: (currentState.columns ?? (DEFAULT_GLOBAL_KEYFRAMES.glitch as GlobalEffectKeyframeGlitch).columns) as number,
        delayMin: (currentState.delayMin ?? (DEFAULT_GLOBAL_KEYFRAMES.glitch as GlobalEffectKeyframeGlitch).delayMin) as number,
        delayMax: (currentState.delayMax ?? (DEFAULT_GLOBAL_KEYFRAMES.glitch as GlobalEffectKeyframeGlitch).delayMax) as number,
        durationMin: (currentState.durationMin ?? (DEFAULT_GLOBAL_KEYFRAMES.glitch as GlobalEffectKeyframeGlitch).durationMin) as number,
        durationMax: (currentState.durationMax ?? (DEFAULT_GLOBAL_KEYFRAMES.glitch as GlobalEffectKeyframeGlitch).durationMax) as number,
        monochrome: (currentState.monochrome ?? (DEFAULT_GLOBAL_KEYFRAMES.glitch as GlobalEffectKeyframeGlitch).monochrome) as boolean,
      }
    case 'vignette':
      return {
        time,
        enabled: (currentState.enabled ?? def.enabled) as boolean,
        offset: (currentState.offset ?? (DEFAULT_GLOBAL_KEYFRAMES.vignette as GlobalEffectKeyframeVignette).offset) as number,
        darkness: (currentState.darkness ?? (DEFAULT_GLOBAL_KEYFRAMES.vignette as GlobalEffectKeyframeVignette).darkness) as number,
      }
    case 'scanline':
      return {
        time,
        enabled: (currentState.enabled ?? def.enabled) as boolean,
        density: (currentState.density ?? (DEFAULT_GLOBAL_KEYFRAMES.scanline as GlobalEffectKeyframeScanline).density) as number,
        scrollSpeed: (currentState.scrollSpeed ?? (DEFAULT_GLOBAL_KEYFRAMES.scanline as GlobalEffectKeyframeScanline).scrollSpeed) as number,
      }
    default:
      return { ...def, time } as GlobalEffectKeyframe
  }
}
