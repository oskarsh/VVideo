/**
 * Easing for camera flyover: map linear time t in [0,1] to eased value in [0,1].
 * Supports presets and custom cubic Bezier (CSS-style).
 */

import type { EasingPresetName, FlyoverEasing } from '@/types'

// ----- Preset easing functions (t in [0,1] -> eased [0,1]) -----

const presets: Record<EasingPresetName, (t: number) => number> = {
  linear: (t) => t,

  easeIn: (t) => t * t,
  easeOut: (t) => t * (2 - t),
  easeInOut: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),

  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),

  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => (t - 1) * (t - 1) * (t - 1) + 1,
  easeInOutCubic: (t) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

  easeInQuart: (t) => t * t * t * t,
  easeOutQuart: (t) => 1 - (t - 1) * (t - 1) * (t - 1) * (t - 1),
  easeInOutQuart: (t) =>
    t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (t - 1) * (t - 1) * (t - 1) * (t - 1),

  easeInExpo: (t) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
  easeOutExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  easeInOutExpo: (t) =>
    t <= 0
      ? 0
      : t >= 1
        ? 1
        : t < 0.5
          ? Math.pow(2, 20 * t - 10) / 2
          : (2 - Math.pow(2, -20 * t + 10)) / 2,

  easeInBack: (t) => {
    const c1 = 1.70158
    const c3 = c1 + 1
    return c3 * t * t * t - c1 * t * t
  },
  easeOutBack: (t) => {
    const c1 = 1.70158
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
  },
  easeInOutBack: (t) => {
    const c1 = 1.70158
    const c2 = c1 * 1.525
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2
  },

  easeOutBounce: (t) => {
    const n1 = 7.5625
    const d1 = 2.75
    if (t < 1 / d1) return n1 * t * t
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375
    return n1 * (t -= 2.625 / d1) * t + 0.984375
  },
  easeInBounce: (t) => 1 - presets.easeOutBounce(1 - t),
  easeInOutBounce: (t) =>
    t < 0.5 ? (1 - presets.easeOutBounce(1 - 2 * t)) / 2 : (1 + presets.easeOutBounce(2 * t - 1)) / 2,

  easeOutElastic: (t) => {
    if (t <= 0) return 0
    if (t >= 1) return 1
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1
  },
  easeInElastic: (t) => 1 - presets.easeOutElastic(1 - t),
  easeInOutElastic: (t) =>
    t < 0.5
      ? (1 - presets.easeOutElastic(1 - 2 * t)) / 2
      : (1 + presets.easeOutElastic(2 * t - 1)) / 2,
}

/** Evaluate a preset easing at t in [0,1]. */
export function easePreset(name: EasingPresetName, t: number): number {
  const fn = presets[name]
  if (!fn) return t
  const clamped = Math.max(0, Math.min(1, t))
  return fn(clamped)
}

// ----- Cubic Bezier (CSS-style: P0=(0,0), P1=(x1,y1), P2=(x2,y2), P3=(1,1)) -----

function bezierCoord(t: number, a: number, b: number, c: number, d: number): number {
  return (1 - t) * (1 - t) * (1 - t) * a + 3 * (1 - t) * (1 - t) * t * b + 3 * (1 - t) * t * t * c + t * t * t * d
}

/** Get y for a given x on the cubic Bezier curve (find t such that x(t)=x, then return y(t)). */
export function cubicBezierY(x: number, x1: number, y1: number, x2: number, y2: number): number {
  const xClamped = Math.max(0, Math.min(1, x))
  if (xClamped <= 0) return 0
  if (xClamped >= 1) return 1
  // Binary search for t such that bezierCoord(t, 0, x1, x2, 1) === xClamped
  let lo = 0
  let hi = 1
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2
    const mx = bezierCoord(mid, 0, x1, x2, 1)
    if (Math.abs(mx - xClamped) < 1e-9) {
      return bezierCoord(mid, 0, y1, y2, 1)
    }
    if (mx < xClamped) lo = mid
    else hi = mid
  }
  const t = (lo + hi) / 2
  return bezierCoord(t, 0, y1, y2, 1)
}

/** Apply flyover easing: linear t in [0,1] -> eased value in [0,1]. */
export function applyFlyoverEasing(t: number, easing?: FlyoverEasing | null): number {
  const clamped = Math.max(0, Math.min(1, t))
  if (!easing) return clamped
  if (easing.type === 'preset') return easePreset(easing.name, clamped)
  if (easing.type === 'cubic') {
    return cubicBezierY(
      clamped,
      easing.x1,
      easing.y1,
      easing.x2,
      easing.y2
    )
  }
  return clamped
}

/** Preset list for UI: label + preset name or cubic. */
export const EASING_PRESETS: { id: string; label: string; easing: FlyoverEasing }[] = [
  { id: 'linear', label: 'Linear', easing: { type: 'preset', name: 'linear' } },
  { id: 'easeIn', label: 'Ease In', easing: { type: 'preset', name: 'easeIn' } },
  { id: 'easeOut', label: 'Ease Out', easing: { type: 'preset', name: 'easeOut' } },
  { id: 'easeInOut', label: 'Ease In Out', easing: { type: 'preset', name: 'easeInOut' } },
  { id: 'easeInQuad', label: 'Ease In Quad', easing: { type: 'preset', name: 'easeInQuad' } },
  { id: 'easeOutQuad', label: 'Ease Out Quad', easing: { type: 'preset', name: 'easeOutQuad' } },
  { id: 'easeInOutQuad', label: 'Ease In Out Quad', easing: { type: 'preset', name: 'easeInOutQuad' } },
  { id: 'easeInCubic', label: 'Ease In Cubic', easing: { type: 'preset', name: 'easeInCubic' } },
  { id: 'easeOutCubic', label: 'Ease Out Cubic', easing: { type: 'preset', name: 'easeOutCubic' } },
  { id: 'easeInOutCubic', label: 'Ease In Out Cubic', easing: { type: 'preset', name: 'easeInOutCubic' } },
  { id: 'easeInQuart', label: 'Ease In Quart', easing: { type: 'preset', name: 'easeInQuart' } },
  { id: 'easeOutQuart', label: 'Ease Out Quart', easing: { type: 'preset', name: 'easeOutQuart' } },
  { id: 'easeInOutQuart', label: 'Ease In Out Quart', easing: { type: 'preset', name: 'easeInOutQuart' } },
  { id: 'easeInExpo', label: 'Ease In Expo', easing: { type: 'preset', name: 'easeInExpo' } },
  { id: 'easeOutExpo', label: 'Ease Out Expo', easing: { type: 'preset', name: 'easeOutExpo' } },
  { id: 'easeInOutExpo', label: 'Ease In Out Expo', easing: { type: 'preset', name: 'easeInOutExpo' } },
  { id: 'easeInBack', label: 'Ease In Back', easing: { type: 'preset', name: 'easeInBack' } },
  { id: 'easeOutBack', label: 'Ease Out Back', easing: { type: 'preset', name: 'easeOutBack' } },
  { id: 'easeInOutBack', label: 'Ease In Out Back', easing: { type: 'preset', name: 'easeInOutBack' } },
  { id: 'easeInBounce', label: 'Ease In Bounce', easing: { type: 'preset', name: 'easeInBounce' } },
  { id: 'easeOutBounce', label: 'Ease Out Bounce', easing: { type: 'preset', name: 'easeOutBounce' } },
  { id: 'easeInOutBounce', label: 'Ease In Out Bounce', easing: { type: 'preset', name: 'easeInOutBounce' } },
  { id: 'easeInElastic', label: 'Ease In Elastic', easing: { type: 'preset', name: 'easeInElastic' } },
  { id: 'easeOutElastic', label: 'Ease Out Elastic', easing: { type: 'preset', name: 'easeOutElastic' } },
  { id: 'easeInOutElastic', label: 'Ease In Out Elastic', easing: { type: 'preset', name: 'easeInOutElastic' } },
]

/** Default cubic Bezier for "custom" (ease-in-out style). */
export const DEFAULT_CUBIC = { x1: 0.42, y1: 0, x2: 0.58, y2: 1 }
