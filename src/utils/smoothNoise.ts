/**
 * Smooth 3D noise for handheld camera shake (Perlin-like).
 * Uses simplex-noise for continuous, natural-looking motion.
 * Seeded so exports are deterministic.
 */
import { createNoise3D } from 'simplex-noise'

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const noise3D = createNoise3D(mulberry32(12345))

/**
 * Sample smooth noise at (t, channel) for consistent per-axis motion.
 * Use different channel offsets so x,y,z and rotation axes are uncorrelated.
 */
export function smoothNoise1D(t: number, channel: number): number {
  return noise3D(t * 0.7, channel * 17.3, 0)
}

/**
 * Get handheld camera offset for position (x,y,z) and rotation (pitch, yaw, roll)
 * at time t, with given intensity, rotationShake and speed.
 */
export function getHandheldOffsets(
  t: number,
  intensity: number,
  rotationShake: number,
  speed: number
): {
  position: [number, number, number]
  rotation: [number, number, number]
} {
  const s = speed * 0.5
  const px = smoothNoise1D(t * s, 0) * intensity
  const py = smoothNoise1D(t * s, 1) * intensity
  const pz = smoothNoise1D(t * s, 2) * intensity
  const rx = smoothNoise1D(t * s, 3) * rotationShake
  const ry = smoothNoise1D(t * s, 4) * rotationShake
  const rz = smoothNoise1D(t * s, 5) * rotationShake
  return {
    position: [px, py, pz],
    rotation: [rx, ry, rz],
  }
}
