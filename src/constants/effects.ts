import type { SceneEffectDither } from '@/types'

export const DITHER_MODES: { value: SceneEffectDither['mode']; label: string }[] = [
  { value: 'bayer2', label: 'Bayer 2×2' },
  { value: 'bayer4', label: 'Bayer 4×4' },
  { value: 'bayer8', label: 'Bayer 8×8' },
  { value: 'bayer16', label: 'Bayer 16×16' },
  { value: 'random', label: 'Random' },
  { value: 'valueNoise', label: 'Value noise' },
  { value: 'halftone', label: 'Halftone (dot)' },
  { value: 'lines', label: 'Line screen' },
]
