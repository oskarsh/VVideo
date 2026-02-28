import type { GlobalEffectType } from '@/types'

/** Single source of truth for human-readable effect names (scene + global). */
export const EFFECT_DISPLAY_NAMES: Record<string, string> = {
  zoom: 'Zoom',
  camera: 'Camera',
  grain: 'Grain',
  dither: 'Dither',
  dof: 'Depth of field',
  handheld: 'Handheld camera',
  chromaticAberration: 'Chromatic aberration',
  lensDistortion: 'Lens distortion',
  glitch: 'Glitch',
  vignette: 'Vignette',
  scanline: 'Scanlines',
  swirl: 'Swirl',
  wave: 'Wave',
  pinch: 'Pinch / Bulge',
  kaleidoscope: 'Kaleidoscope',
  melt: 'Melt',
  radialChromatic: 'Radial chromatic',
  fisheye: 'Fisheye',
  pixelShatter: 'Pixel shatter',
  tunnel: 'Tunnel',
  noiseWarp: 'Noise warp',
}

/** Labels for global effect types only (typed). Use EFFECT_DISPLAY_NAMES when you need scene + global. */
export const GLOBAL_EFFECT_LABELS: Record<GlobalEffectType, string> = EFFECT_DISPLAY_NAMES as Record<GlobalEffectType, string>

/** Per-parameter labels for global effects (for timeline lanes). Order = display order. */
export const GLOBAL_EFFECT_PARAM_LABELS: Record<GlobalEffectType, Array<{ key: string; label: string }>> = {
  camera: [{ key: 'fov', label: 'FOV' }],
  grain: [{ key: 'opacity', label: 'Opacity' }],
  dither: [
    { key: 'levels', label: 'Levels' },
    { key: 'intensity', label: 'Intensity' },
    { key: 'thresholdBias', label: 'Threshold bias' },
  ],
  dof: [
    { key: 'focusDistance', label: 'Focus distance' },
    { key: 'focusRange', label: 'Focus range' },
    { key: 'bokehScale', label: 'Bokeh scale' },
    { key: 'focalLength', label: 'Focal length' },
  ],
  handheld: [
    { key: 'intensity', label: 'Intensity' },
    { key: 'rotationShake', label: 'Rotation shake' },
    { key: 'speed', label: 'Speed' },
  ],
  chromaticAberration: [{ key: 'offset', label: 'Offset' }],
  lensDistortion: [{ key: 'distortion', label: 'Distortion' }],
  glitch: [
    { key: 'ratio', label: 'Ratio' },
    { key: 'columns', label: 'Columns' },
  ],
  vignette: [
    { key: 'offset', label: 'Offset' },
    { key: 'darkness', label: 'Darkness' },
  ],
  scanline: [
    { key: 'density', label: 'Density' },
    { key: 'scrollSpeed', label: 'Scroll speed' },
  ],
  swirl: [
    { key: 'strength', label: 'Strength' },
    { key: 'radius', label: 'Radius' },
  ],
  wave: [
    { key: 'amplitudeX', label: 'Amplitude X' },
    { key: 'amplitudeY', label: 'Amplitude Y' },
    { key: 'frequencyX', label: 'Frequency X' },
    { key: 'frequencyY', label: 'Frequency Y' },
  ],
  pinch: [
    { key: 'strength', label: 'Strength' },
    { key: 'radius', label: 'Radius' },
  ],
  kaleidoscope: [
    { key: 'segments', label: 'Segments' },
    { key: 'rotation', label: 'Rotation' },
  ],
  melt: [
    { key: 'strength', label: 'Strength' },
    { key: 'frequency', label: 'Frequency' },
  ],
  radialChromatic: [
    { key: 'strength', label: 'Strength' },
    { key: 'exponent', label: 'Exponent' },
  ],
  fisheye: [{ key: 'strength', label: 'Strength' }],
  pixelShatter: [
    { key: 'scale', label: 'Scale' },
    { key: 'strength', label: 'Strength' },
  ],
  tunnel: [{ key: 'strength', label: 'Strength' }],
  noiseWarp: [
    { key: 'strength', label: 'Strength' },
    { key: 'scale', label: 'Scale' },
  ],
}
