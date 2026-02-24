// Single scene: background + optional video plane + text + effects + optional flyover
export interface FlyoverKeyframe {
  position: [number, number, number]
  rotation: [number, number, number] // euler in radians (optional; can derive from look-at)
  fov?: number
}

/** Easing for camera flyover: preset name or custom cubic Bezier (CSS-style control points). */
export type FlyoverEasing =
  | { type: 'preset'; name: EasingPresetName }
  | { type: 'cubic'; x1: number; y1: number; x2: number; y2: number }

export type EasingPresetName =
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'easeInQuad'
  | 'easeOutQuad'
  | 'easeInOutQuad'
  | 'easeInCubic'
  | 'easeOutCubic'
  | 'easeInOutCubic'
  | 'easeInQuart'
  | 'easeOutQuart'
  | 'easeInOutQuart'
  | 'easeInExpo'
  | 'easeOutExpo'
  | 'easeInOutExpo'
  | 'easeInBack'
  | 'easeOutBack'
  | 'easeInOutBack'
  | 'easeOutBounce'
  | 'easeInBounce'
  | 'easeInOutBounce'
  | 'easeOutElastic'
  | 'easeInElastic'
  | 'easeInOutElastic'

export interface SceneEffectZoom {
  type: 'zoom'
  startScale: number
  endScale: number
}

export interface SceneEffectGrain {
  type: 'grain'
  startOpacity: number
  endOpacity: number
}

/** Depth of field: focus distance (0–1), focal length, focus range, bokeh size. Keyframed start/end. */
export interface SceneEffectDoF {
  type: 'dof'
  enabled: boolean
  focusDistanceStart: number
  focusDistanceEnd: number
  focalLengthStart: number
  focalLengthEnd: number
  focusRangeStart: number
  focusRangeEnd: number
  bokehScaleStart: number
  bokehScaleEnd: number
}

/** Handheld-style camera: Perlin-based smooth position/rotation shake. Keyframed start/end. */
export interface SceneEffectHandheld {
  type: 'handheld'
  enabled: boolean
  intensityStart: number
  intensityEnd: number
  rotationShakeStart: number
  rotationShakeEnd: number
  speedStart: number
  speedEnd: number
}

/** Dithering post-processing: presets and modes (Bayer, etc.). Not animated. */
export interface SceneEffectDither {
  type: 'dither'
  enabled: boolean
  /** Preset: subtle, medium, strong, custom (custom uses levels) */
  preset: 'subtle' | 'medium' | 'strong' | 'custom'
  /** Dither mode: bayer2, bayer4, bayer8, random */
  mode: 'bayer2' | 'bayer4' | 'bayer8' | 'random'
  /** Color levels (2–32). Used when preset is 'custom', or as base for presets. */
  levels: number
  /** Blend strength of dither with original (0–1). Default 1. */
  intensity: number
  /** When true, only luminance is dithered; chroma from original. */
  luminanceOnly: boolean
  /** Bias added to threshold (e.g. -0.2 to 0.2) for lighter/darker dither. */
  thresholdBias: number
}

/** Chromatic aberration (RGB shift) at edges. Keyframed start/end. */
export interface SceneEffectChromaticAberration {
  type: 'chromaticAberration'
  enabled: boolean
  /** Shift intensity (0–0.02 typical). Start keyframe. */
  offsetStart: number
  /** Shift intensity. End keyframe. */
  offsetEnd: number
  /** Radial falloff from center. */
  radialModulation: boolean
}

/** Lens distortion (barrel/pincushion). Keyframed start/end. */
export interface SceneEffectLensDistortion {
  type: 'lensDistortion'
  enabled: boolean
  /** Radial distortion strength, e.g. -0.1 to 0.1. Start keyframe. */
  distortionStart: number
  /** Radial distortion. End keyframe. */
  distortionEnd: number
}

/** Glitch: sporadic or constant. */
export interface SceneEffectGlitch {
  type: 'glitch'
  enabled: boolean
  /** sporadic | constantMild */
  mode: 'sporadic' | 'constantMild'
  /** 0 = more weak glitches, 1 = more strong. */
  ratio: number
  /** Column slice width. */
  columns: number
  /** Min/max delay between glitches (seconds). Lower = faster. */
  delayMin: number
  delayMax: number
  /** Min/max duration of each glitch (seconds). */
  durationMin: number
  durationMax: number
  /** When true, no RGB fringing (more monochrome). */
  monochrome: boolean
}

/** Vignette darkening at edges. */
export interface SceneEffectVignette {
  type: 'vignette'
  enabled: boolean
  /** Offset (0–1). */
  offset: number
  /** Darkness (0–1). */
  darkness: number
}

/** Scanlines overlay. */
export interface SceneEffectScanline {
  type: 'scanline'
  enabled: boolean
  /** Line density. */
  density: number
  /** Scroll speed (0 = static). */
  scrollSpeed: number
}

export type SceneEffect =
  | SceneEffectZoom
  | SceneEffectGrain
  | SceneEffectDoF
  | SceneEffectHandheld
  | SceneEffectDither
  | SceneEffectChromaticAberration
  | SceneEffectLensDistortion
  | SceneEffectGlitch
  | SceneEffectVignette
  | SceneEffectScanline

/** How video time is driven: normal = real-time with optional speed; fitScene = stretch/compress to fill scene duration. */
export type VideoPlaybackMode = 'normal' | 'fitScene'

export interface Scene {
  id: string
  durationSeconds: number
  /** Trim into project background video (seconds). Null = use full video. */
  backgroundTrim: { start: number; end: number } | null
  /** Trim into project plane video (seconds). Null = use full video. */
  planeTrim: { start: number; end: number } | null
  /** True when user has explicitly set background trim end (end then stays when start changes). */
  backgroundTrimEndClaimed?: boolean
  /** True when user has explicitly set plane trim end (end then stays when start changes). */
  planeTrimEndClaimed?: boolean
  /** Background video: normal = 1x (or speed), fitScene = fit trim to scene length. Default normal. */
  backgroundVideoPlaybackMode?: VideoPlaybackMode
  /** Plane video: normal = 1x (or speed), fitScene = fit trim to scene length. Default normal. */
  planeVideoPlaybackMode?: VideoPlaybackMode
  /** Background video playback speed multiplier. Default 1. */
  backgroundVideoSpeed?: number
  /** Plane video playback speed multiplier. Default 1. */
  planeVideoSpeed?: number
  flyover: {
    enabled: boolean
    start: FlyoverKeyframe
    end: FlyoverKeyframe
    preset?: string // e.g. 'orbit-in', 'dolly'
    /** Easing curve for camera motion. Defaults to linear if omitted. */
    easing?: FlyoverEasing
  } | null
  effects: SceneEffect[]
}

export interface Project {
  id: string
  name: string
  aspectRatio: [number, number] // e.g. [16, 9] or [9, 16]
  /** One shared background video for all scenes; each scene defines its own trim (cut). */
  backgroundVideoUrl: string | null
  /** One shared plane video for all scenes; each scene defines its own trim (cut). */
  planeVideoUrl: string | null
  /** Global dither applied to all scenes. */
  dither: SceneEffectDither
  scenes: Scene[]
}

export const DEFAULT_ASPECT: [number, number] = [16, 9]

export function createDefaultScene(id: string): Scene {
  return {
    id,
    durationSeconds: 5,
    backgroundTrim: null,
    planeTrim: null,
    flyover: {
      enabled: true,
      start: { position: [0, 0, 5], rotation: [0, 0, 0], fov: 50 },
      end: { position: [0, 0, 5], rotation: [0, 0, 0], fov: 50 },
    },
    effects: [
      { type: 'grain', startOpacity: 0.15, endOpacity: 0.15 },
      { type: 'zoom', startScale: 1, endScale: 1.05 },
      {
        type: 'dof',
        enabled: true,
        focusDistanceStart: 0.015,
        focusDistanceEnd: 0.015,
        focalLengthStart: 0.02,
        focalLengthEnd: 0.02,
        focusRangeStart: 0.5,
        focusRangeEnd: 0.5,
        bokehScaleStart: 6,
        bokehScaleEnd: 6,
      },
      {
        type: 'handheld',
        enabled: false,
        intensityStart: 0.012,
        intensityEnd: 0.012,
        rotationShakeStart: 0.008,
        rotationShakeEnd: 0.008,
        speedStart: 1.2,
        speedEnd: 1.2,
      },
      {
        type: 'chromaticAberration',
        enabled: false,
        offsetStart: 0.005,
        offsetEnd: 0.005,
        radialModulation: true,
      },
      {
        type: 'lensDistortion',
        enabled: false,
        distortionStart: 0.05,
        distortionEnd: 0.05,
      },
      {
        type: 'glitch',
        enabled: false,
        mode: 'sporadic',
        ratio: 0.85,
        columns: 0.05,
        delayMin: 1.5,
        delayMax: 3.5,
        durationMin: 0.6,
        durationMax: 1,
        monochrome: false,
      },
      {
        type: 'vignette',
        enabled: false,
        offset: 0.5,
        darkness: 0.5,
      },
      {
        type: 'scanline',
        enabled: false,
        density: 1.5,
        scrollSpeed: 0,
      },
    ],
  }
}

export const DEFAULT_DITHER: SceneEffectDither = {
  type: 'dither',
  enabled: false,
  preset: 'medium',
  mode: 'bayer4',
  levels: 8,
  intensity: 1,
  luminanceOnly: false,
  thresholdBias: 0,
}

export function createDefaultProject(): Project {
  return {
    id: crypto.randomUUID(),
    name: 'Untitled',
    aspectRatio: DEFAULT_ASPECT,
    backgroundVideoUrl: null,
    planeVideoUrl: null,
    dither: { ...DEFAULT_DITHER },
    scenes: [createDefaultScene(crypto.randomUUID())],
  }
}
