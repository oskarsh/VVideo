// Single scene: background + optional video plane + effects + optional flyover
export interface FlyoverKeyframe {
  position: [number, number, number]
  rotation: [number, number, number] // euler in radians (optional; can derive from look-at)
  fov?: number
}

/** Keyframe at normalized time 0..1 within the scene. */
export interface FlyoverKeyframeWithTime extends FlyoverKeyframe {
  time: number
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
  enabled?: boolean
  startScale: number
  endScale: number
}

export interface SceneEffectGrain {
  type: 'grain'
  enabled?: boolean
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
  /** Dither mode: Bayer matrices, random, value noise, halftone, line screen */
  mode: 'bayer2' | 'bayer4' | 'bayer8' | 'bayer16' | 'random' | 'valueNoise' | 'halftone' | 'lines'
  /** Color levels (2–32). Used when preset is 'custom', or as base for presets. */
  levels: number
  /** Blend strength of dither with original (0–1). Default 1. */
  intensity: number
  /** When true, only luminance is dithered; chroma from original. */
  luminanceOnly: boolean
  /** Bias added to threshold (e.g. -0.2 to 0.2) for lighter/darker dither. */
  thresholdBias: number
}

/** How chromatic aberration RGB shift is oriented. */
export type ChromaticDirection = 'omnidirectional' | 'horizontal' | 'vertical' | 'diagonal'

/** Chromatic aberration (RGB shift) at edges. Keyframed start/end. */
export interface SceneEffectChromaticAberration {
  type: 'chromaticAberration'
  enabled: boolean
  /** Shift intensity (0–0.02 typical). Start keyframe. */
  offsetStart: number
  /** Shift intensity. End keyframe. */
  offsetEnd: number
  /** Radial falloff from center (stronger at edges). */
  radialModulation: boolean
  /** Direction of the RGB shift. */
  direction?: ChromaticDirection
  /** When radial: distance from center where effect starts (0–0.5). */
  modulationOffset?: number
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

/** Glitch algorithm: library modes or custom block/noise. */
export type GlitchAlgorithm = 'sporadic' | 'constantMild' | 'constantWild' | 'block' | 'noise'

/** Glitch: algorithm choice + timing/strength. */
export interface SceneEffectGlitch {
  type: 'glitch'
  enabled: boolean
  /** Which glitch style to use. */
  algorithm: GlitchAlgorithm
  /** @deprecated Use algorithm. Kept for backward compat. */
  mode?: 'sporadic' | 'constantMild'
  /** 0 = more weak glitches, 1 = more strong. */
  ratio: number
  /** Column slice width (slice-based algorithms). */
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

/** Swirl/vortex rotation around a focal point. Keyframed start/end. */
export interface SceneEffectSwirl {
  type: 'swirl'
  enabled: boolean
  strengthStart: number
  strengthEnd: number
  radiusStart: number
  radiusEnd: number
  centerXStart: number
  centerXEnd: number
  centerYStart: number
  centerYEnd: number
}

/** Sinusoidal UV wave ripple. Animates over time. Keyframed start/end. */
export interface SceneEffectWave {
  type: 'wave'
  enabled: boolean
  amplitudeXStart: number
  amplitudeXEnd: number
  amplitudeYStart: number
  amplitudeYEnd: number
  frequencyXStart: number
  frequencyXEnd: number
  frequencyYStart: number
  frequencyYEnd: number
  speedStart: number
  speedEnd: number
}

/** Pinch/bulge from a focal point. Keyframed start/end. */
export interface SceneEffectPinch {
  type: 'pinch'
  enabled: boolean
  strengthStart: number
  strengthEnd: number
  radiusStart: number
  radiusEnd: number
  centerXStart: number
  centerXEnd: number
  centerYStart: number
  centerYEnd: number
}

/** Polar-coordinate mirror kaleidoscope folding. Keyframed start/end. */
export interface SceneEffectKaleidoscope {
  type: 'kaleidoscope'
  enabled: boolean
  segmentsStart: number
  segmentsEnd: number
  rotationStart: number
  rotationEnd: number
}

/** Dalí-style dripping/melting downward. Animates over time. Keyframed start/end. */
export interface SceneEffectMelt {
  type: 'melt'
  enabled: boolean
  strengthStart: number
  strengthEnd: number
  frequencyStart: number
  frequencyEnd: number
  speedStart: number
  speedEnd: number
}

/** R/G/B channels radially separated from center. Keyframed start/end. */
export interface SceneEffectRadialChromatic {
  type: 'radialChromatic'
  enabled: boolean
  strengthStart: number
  strengthEnd: number
  exponentStart: number
  exponentEnd: number
}

/** Extreme barrel fisheye (atan model, no black border). Keyframed start/end. */
export interface SceneEffectFisheye {
  type: 'fisheye'
  enabled: boolean
  strengthStart: number
  strengthEnd: number
}

/** Voronoi cell UV offsets — cracked-glass look. Keyframed start/end. */
export interface SceneEffectPixelShatter {
  type: 'pixelShatter'
  enabled: boolean
  scaleStart: number
  scaleEnd: number
  strengthStart: number
  strengthEnd: number
}

/** Radial zoom-tunnel from center. Keyframed start/end. */
export interface SceneEffectTunnel {
  type: 'tunnel'
  enabled: boolean
  strengthStart: number
  strengthEnd: number
  centerXStart: number
  centerXEnd: number
  centerYStart: number
  centerYEnd: number
}

/** Organic 2D value-noise UV displacement. Animates over time. Keyframed start/end. */
export interface SceneEffectNoiseWarp {
  type: 'noiseWarp'
  enabled: boolean
  strengthStart: number
  strengthEnd: number
  scaleStart: number
  scaleEnd: number
  speedStart: number
  speedEnd: number
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
  | SceneEffectSwirl
  | SceneEffectWave
  | SceneEffectPinch
  | SceneEffectKaleidoscope
  | SceneEffectMelt
  | SceneEffectRadialChromatic
  | SceneEffectFisheye
  | SceneEffectPixelShatter
  | SceneEffectTunnel
  | SceneEffectNoiseWarp

/** Effect types that can be driven by global keyframes (timeline). */
export type GlobalEffectType =
  | 'camera'
  | 'grain'
  | 'dither'
  | 'dof'
  | 'handheld'
  | 'chromaticAberration'
  | 'lensDistortion'
  | 'glitch'
  | 'vignette'
  | 'scanline'
  | 'swirl'
  | 'wave'
  | 'pinch'
  | 'kaleidoscope'
  | 'melt'
  | 'radialChromatic'
  | 'fisheye'
  | 'pixelShatter'
  | 'tunnel'
  | 'noiseWarp'

/** One keyframe for a global effect: time in seconds (project timeline) + interpolatable params. */
export interface GlobalEffectKeyframeGrain {
  time: number
  opacity: number
}
export interface GlobalEffectKeyframeDither {
  time: number
  enabled?: boolean
  preset: 'subtle' | 'medium' | 'strong' | 'custom'
  mode: 'bayer2' | 'bayer4' | 'bayer8' | 'bayer16' | 'random' | 'valueNoise' | 'halftone' | 'lines'
  levels: number
  intensity: number
  luminanceOnly: boolean
  thresholdBias: number
}
export interface GlobalEffectKeyframeDoF {
  time: number
  enabled?: boolean
  focusDistance: number
  focalLength: number
  focusRange: number
  bokehScale: number
}
export interface GlobalEffectKeyframeHandheld {
  time: number
  enabled?: boolean
  intensity: number
  rotationShake: number
  speed: number
}
export interface GlobalEffectKeyframeChromatic {
  time: number
  enabled?: boolean
  offset: number
}
export interface GlobalEffectKeyframeLens {
  time: number
  enabled?: boolean
  distortion: number
}
export interface GlobalEffectKeyframeGlitch {
  time: number
  enabled?: boolean
  algorithm?: GlitchAlgorithm
  mode?: 'sporadic' | 'constantMild'
  ratio: number
  columns: number
  delayMin: number
  delayMax: number
  durationMin: number
  durationMax: number
  monochrome: boolean
}
export interface GlobalEffectKeyframeVignette {
  time: number
  enabled?: boolean
  offset: number
  darkness: number
}
export interface GlobalEffectKeyframeScanline {
  time: number
  enabled?: boolean
  density: number
  scrollSpeed: number
}

/** Global camera: FOV (field of view) in degrees. Affects the perspective camera globally. */
export interface GlobalEffectKeyframeCamera {
  time: number
  /** Vertical field of view in degrees (e.g. 10–120). */
  fov: number
}

export interface GlobalEffectKeyframeSwirl {
  time: number
  enabled?: boolean
  strength: number
  radius: number
  centerX: number
  centerY: number
}
export interface GlobalEffectKeyframeWave {
  time: number
  enabled?: boolean
  amplitudeX: number
  amplitudeY: number
  frequencyX: number
  frequencyY: number
  speed: number
}
export interface GlobalEffectKeyframePinch {
  time: number
  enabled?: boolean
  strength: number
  radius: number
  centerX: number
  centerY: number
}
export interface GlobalEffectKeyframeKaleidoscope {
  time: number
  enabled?: boolean
  segments: number
  rotation: number
}
export interface GlobalEffectKeyframeMelt {
  time: number
  enabled?: boolean
  strength: number
  frequency: number
  speed: number
}
export interface GlobalEffectKeyframeRadialChromatic {
  time: number
  enabled?: boolean
  strength: number
  exponent: number
}
export interface GlobalEffectKeyframeFisheye {
  time: number
  enabled?: boolean
  strength: number
}
export interface GlobalEffectKeyframePixelShatter {
  time: number
  enabled?: boolean
  scale: number
  strength: number
}
export interface GlobalEffectKeyframeTunnel {
  time: number
  enabled?: boolean
  strength: number
  centerX: number
  centerY: number
}
export interface GlobalEffectKeyframeNoiseWarp {
  time: number
  enabled?: boolean
  strength: number
  scale: number
  speed: number
}

export type GlobalEffectKeyframe =
  | GlobalEffectKeyframeCamera
  | GlobalEffectKeyframeGrain
  | GlobalEffectKeyframeDither
  | GlobalEffectKeyframeDoF
  | GlobalEffectKeyframeHandheld
  | GlobalEffectKeyframeChromatic
  | GlobalEffectKeyframeLens
  | GlobalEffectKeyframeGlitch
  | GlobalEffectKeyframeVignette
  | GlobalEffectKeyframeScanline
  | GlobalEffectKeyframeSwirl
  | GlobalEffectKeyframeWave
  | GlobalEffectKeyframePinch
  | GlobalEffectKeyframeKaleidoscope
  | GlobalEffectKeyframeMelt
  | GlobalEffectKeyframeRadialChromatic
  | GlobalEffectKeyframeFisheye
  | GlobalEffectKeyframePixelShatter
  | GlobalEffectKeyframeTunnel
  | GlobalEffectKeyframeNoiseWarp

export interface GlobalEffectTrack {
  enabled: boolean
  keyframes: GlobalEffectKeyframe[]
  /** Non-keyframe base values (used when keyframes is empty). Keys match GlobalEffectKeyframe param names. */
  params?: Record<string, unknown>
}

/** Global post-processing effects with keyframes on project timeline (not per-scene). */
export type GlobalEffectsMap = Partial<Record<GlobalEffectType, GlobalEffectTrack>>

/** How video time is driven: normal = real-time with optional speed; fitScene = stretch/compress to fill scene duration. */
export type VideoPlaybackMode = 'normal' | 'fitScene'

/** Text overlay: either placed in 3D space or static in front of camera. */
export type SceneTextMode = '3d' | 'static'

export interface SceneText {
  id: string
  mode: SceneTextMode
  content: string
  /** Google Font family name, e.g. "IBM Plex Mono" */
  fontFamily: string
  /** Font weight (number 100–900 or "normal"/"bold"). */
  fontWeight?: number | string
  /** Hex color, e.g. "#ffffff" */
  color: string
  /** For 3D: world-space scale. For static: font size in px. */
  fontSize: number
  /** 3D only: position [x, y, z] in world space. */
  position: [number, number, number]
  /** 3D only: rotation [x, y, z] in radians. */
  rotation: [number, number, number]
  /** 3D only: uniform scale multiplier. */
  scale: number
  /** Static only: horizontal alignment. */
  staticAlignX: 'left' | 'center' | 'right'
  /** Static only: vertical alignment. */
  staticAlignY: 'top' | 'center' | 'bottom'
  /** Static only: padding from edge in px. */
  staticPadding: number
}

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
  /** Per-pane trim (for video panes). Key = pane id. When absent, pane uses full media or scene.planeTrim for legacy single plane. */
  paneTrims?: Record<string, { start: number; end: number } | null>
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
    /** Keyframes at normalized time 0..1. Empty = no camera animation. */
    keyframes: FlyoverKeyframeWithTime[]
    preset?: string // e.g. 'orbit-in', 'dolly'
    /** Easing curve for camera motion between keyframes. Defaults to linear if omitted. */
    easing?: FlyoverEasing
    /** @deprecated Legacy: migrated to keyframes. */
    start?: FlyoverKeyframe
    /** @deprecated Legacy: migrated to keyframes. */
    end?: FlyoverKeyframe
  } | null
  effects: SceneEffect[]
  /** Text overlays: 3D in scene or static in front of camera. */
  texts: SceneText[]
}

/** Panel content: video on plane or image on plane. */
export type PlaneMedia =
  | { type: 'video'; url: string }
  | { type: 'image'; url: string }

/** Per-pane animation: lerp from start to end over scene duration. */
export interface PaneAnimation {
  positionStart: [number, number, number]
  positionEnd: [number, number, number]
  scaleStart: number
  scaleEnd: number
  rotationStart: [number, number, number]
  rotationEnd: [number, number, number]
}

/** A single pane (video or image) in 3D space. Multiple panes can be layered by zIndex. */
export interface Pane {
  id: string
  media: PlaneMedia
  /** Render order: higher = in front. Also used as base Z position when position[2] is not overridden. */
  zIndex: number
  /** World position [x, y, z]. */
  position: [number, number, number]
  /** Uniform scale in world. */
  scale: number
  /** Rotation [x, y, z] in radians (euler). */
  rotation: [number, number, number]
  extrusionDepth: number
  /** When set, position/scale/rotation are lerped from start to end over the scene duration. */
  animation?: PaneAnimation | null
}

/** Generated background texture (gradient, terrain, noise, or dots). Mutually exclusive with backgroundVideoUrl. */
export type BackgroundTexture =
  | { type: 'gradient'; colors: [string, string]; angle?: number; speed?: number }
  | {
    type: 'terrain'
    colors: string[]
    seed?: number
    scale?: number
    speed?: number
  }
  | {
    type: 'noise'
    /** Two colors to blend with noise. */
    colors: [string, string]
    /** Noise scale (detail). */
    scale?: number
    seed?: number
    speed?: number
  }
  | {
    type: 'dots'
    backgroundColor: string
    dotColor: string
    /** Spacing between dot centers (0–1). */
    spacing?: number
    /** Dot radius (0–1). */
    size?: number
    speed?: number
  }

export interface Project {
  id: string
  name: string
  aspectRatio: [number, number] // e.g. [16, 9] or [9, 16]
  /** One shared background video for all scenes; each scene defines its own trim (cut). */
  backgroundVideoUrl: string | null
  /** Generated background texture (gradient/terrain). When set, used instead of backgroundVideoUrl. */
  backgroundTexture?: BackgroundTexture | null
  /** When true, background video plays continuously from global timeline (no reset per scene); pane still changes per scene. */
  backgroundVideoContinuous?: boolean
  /** One shared plane video for all scenes; each scene defines its own trim (cut). @deprecated Use planeMedia instead. */
  planeVideoUrl?: string | null
  /** Panel media: video or image. When set, takes precedence over planeVideoUrl. */
  planeMedia?: PlaneMedia | null
  /** Extrusion depth for panel (video/image plane). 0 = flat. */
  planeExtrusionDepth?: number
  /** Multiple panes (video/image) with z-order and optional animation. When non-empty, used instead of single planeMedia. */
  panes?: Pane[]
  /** Global dither applied to all scenes. */
  dither: SceneEffectDither
  /** Global effect tracks with keyframes on project timeline (grain, dof, handheld, etc.). When set, override per-scene effects. */
  globalEffects?: GlobalEffectsMap
  scenes: Scene[]
}

/** Resolve current panel media from project (supports legacy planeVideoUrl). */
export function getPlaneMedia(project: Project): PlaneMedia | null {
  if (project.planeMedia != null) return project.planeMedia
  const url = project.planeVideoUrl
  return url ? { type: 'video', url } : null
}

/** Default values for a new pane. */
export function createDefaultPane(id: string): Pane {
  return {
    id,
    media: { type: 'image', url: '' },
    zIndex: 0,
    position: [0, 0, 0],
    scale: 1,
    rotation: [0, 0, 0],
    extrusionDepth: 0,
    animation: null,
  }
}

/** Panes to render: either project.panes (sorted by zIndex) or a single virtual pane from legacy planeMedia. */
export function getPanesForRender(project: Project): Pane[] {
  const panes = project.panes ?? []
  if (panes.length > 0) {
    return [...panes]
      .filter((p) => p.media.url !== '')
      .sort((a, b) => a.zIndex - b.zIndex)
  }
  const media = getPlaneMedia(project)
  if (!media || !media.url) return []
  return [
    {
      id: 'legacy',
      media,
      zIndex: 0,
      position: [0, 0, 0],
      scale: 1,
      rotation: [0, 0, 0],
      extrusionDepth: project.planeExtrusionDepth ?? 0,
      animation: null,
    },
  ]
}

export const DEFAULT_ASPECT: [number, number] = [16, 9]

/** Default values for a new scene text. */
export function createDefaultSceneText(id: string): SceneText {
  return {
    id,
    mode: '3d',
    content: 'Text',
    fontFamily: 'IBM Plex Mono',
    fontWeight: 400,
    color: '#ffffff',
    fontSize: 0.15,
    position: [0, 0, 1.5],
    rotation: [0, 0, 0],
    scale: 1,
    staticAlignX: 'center',
    staticAlignY: 'center',
    staticPadding: 24,
  }
}

export function createDefaultScene(id: string): Scene {
  return {
    id,
    durationSeconds: 5,
    backgroundTrim: null,
    planeTrim: null,
    flyover: {
      enabled: true,
      keyframes: [],
    },
    effects: [
      { type: 'grain', startOpacity: 0.06, endOpacity: 0.06 },
      { type: 'zoom', startScale: 1, endScale: 1.05 },
      {
        type: 'dof',
        enabled: true,
        focusDistanceStart: 0.015,
        focusDistanceEnd: 0.015,
        focalLengthStart: 0.02,
        focalLengthEnd: 0.02,
        focusRangeStart: 0.22,
        focusRangeEnd: 0.22,
        bokehScaleStart: 2.8,
        bokehScaleEnd: 2.8,
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
        direction: 'omnidirectional',
        modulationOffset: 0.15,
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
        algorithm: 'sporadic',
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
      {
        type: 'swirl',
        enabled: false,
        strengthStart: 2.0,
        strengthEnd: 2.0,
        radiusStart: 0.5,
        radiusEnd: 0.5,
        centerXStart: 0.5,
        centerXEnd: 0.5,
        centerYStart: 0.5,
        centerYEnd: 0.5,
      },
      {
        type: 'wave',
        enabled: false,
        amplitudeXStart: 0.02,
        amplitudeXEnd: 0.02,
        amplitudeYStart: 0.02,
        amplitudeYEnd: 0.02,
        frequencyXStart: 5.0,
        frequencyXEnd: 5.0,
        frequencyYStart: 5.0,
        frequencyYEnd: 5.0,
        speedStart: 1.0,
        speedEnd: 1.0,
      },
      {
        type: 'pinch',
        enabled: false,
        strengthStart: 0.5,
        strengthEnd: 0.5,
        radiusStart: 0.5,
        radiusEnd: 0.5,
        centerXStart: 0.5,
        centerXEnd: 0.5,
        centerYStart: 0.5,
        centerYEnd: 0.5,
      },
      {
        type: 'kaleidoscope',
        enabled: false,
        segmentsStart: 6,
        segmentsEnd: 6,
        rotationStart: 0,
        rotationEnd: 0,
      },
      {
        type: 'melt',
        enabled: false,
        strengthStart: 0.1,
        strengthEnd: 0.1,
        frequencyStart: 5.0,
        frequencyEnd: 5.0,
        speedStart: 1.0,
        speedEnd: 1.0,
      },
      {
        type: 'radialChromatic',
        enabled: false,
        strengthStart: 0.05,
        strengthEnd: 0.05,
        exponentStart: 2.0,
        exponentEnd: 2.0,
      },
      {
        type: 'fisheye',
        enabled: false,
        strengthStart: 3.0,
        strengthEnd: 3.0,
      },
      {
        type: 'pixelShatter',
        enabled: false,
        scaleStart: 20.0,
        scaleEnd: 20.0,
        strengthStart: 0.05,
        strengthEnd: 0.05,
      },
      {
        type: 'tunnel',
        enabled: false,
        strengthStart: 0.3,
        strengthEnd: 0.3,
        centerXStart: 0.5,
        centerXEnd: 0.5,
        centerYStart: 0.5,
        centerYEnd: 0.5,
      },
      {
        type: 'noiseWarp',
        enabled: false,
        strengthStart: 0.05,
        strengthEnd: 0.05,
        scaleStart: 5.0,
        scaleEnd: 5.0,
        speedStart: 1.0,
        speedEnd: 1.0,
      },
    ],
    texts: [],
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
    backgroundTexture: null,
    planeVideoUrl: null,
    planeMedia: null,
    planeExtrusionDepth: 0,
    dither: { ...DEFAULT_DITHER },
    scenes: [createDefaultScene(crypto.randomUUID())],
  }
}
