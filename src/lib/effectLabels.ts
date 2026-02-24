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
}

/** Labels for global effect types only (typed). Use EFFECT_DISPLAY_NAMES when you need scene + global. */
export const GLOBAL_EFFECT_LABELS: Record<GlobalEffectType, string> = EFFECT_DISPLAY_NAMES as Record<GlobalEffectType, string>
