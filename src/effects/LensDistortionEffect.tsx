import { LensDistortionEffect } from 'postprocessing'
import { wrapEffect } from '@react-three/postprocessing'

/**
 * LensDistortion is not exported by @react-three/postprocessing.
 * Pass distortion as Vector2 (e.g. radial strength as x, 0).
 */
export const LensDistortion = wrapEffect(LensDistortionEffect)
