import type { Scene, FlyoverKeyframeWithTime, FlyoverKeyframe } from '@/types'
import { applyFlyoverEasing } from '@/easing'

/**
 * Returns sorted flyover keyframes for a scene.
 * Migrates legacy start/end to keyframes when keyframes array is empty.
 */
export function getFlyoverKeyframes(scene: Scene | null | undefined): FlyoverKeyframeWithTime[] {
  const flyover = scene?.flyover
  if (!flyover) return []

  const list = flyover.keyframes ?? []
  if (list.length > 0) {
    return [...list].sort((a, b) => a.time - b.time)
  }

  // Legacy: start/end without keyframes
  const start = (flyover as { start?: FlyoverKeyframe }).start
  const end = (flyover as { end?: FlyoverKeyframe }).end
  if (start?.position && end?.position) {
    return [
      { ...start, time: 0 },
      { ...end, time: 1 },
    ]
  }
  if (start?.position) {
    return [{ ...start, time: 0 }]
  }
  return []
}

const FOV_DEFAULT = 50

/** Sample flyover camera state at normalized time t in [0,1]. */
export function getFlyoverStateAt(
  scene: Scene | null | undefined,
  t: number
): { position: [number, number, number]; rotation: [number, number, number]; fov: number } | null {
  const keyframes = getFlyoverKeyframes(scene)
  const flyover = scene?.flyover
  if (keyframes.length === 0) {
    return { position: [0, 0, 2], rotation: [0, 0, 0], fov: FOV_DEFAULT }
  }
  if (keyframes.length === 1) {
    const k = keyframes[0]
    return {
      position: [...k.position],
      rotation: [...k.rotation],
      fov: k.fov ?? FOV_DEFAULT,
    }
  }
  let i = 0
  for (; i < keyframes.length - 1 && keyframes[i + 1].time <= t; i++) { }
  const k0 = keyframes[i]
  const k1 = keyframes[Math.min(i + 1, keyframes.length - 1)]
  const segDuration = k1.time - k0.time
  const segmentU = segDuration > 1e-9 ? (t - k0.time) / segDuration : 1
  const easedU = applyFlyoverEasing(Math.max(0, Math.min(1, segmentU)), flyover?.easing)
  return {
    position: [
      k0.position[0] + (k1.position[0] - k0.position[0]) * easedU,
      k0.position[1] + (k1.position[1] - k0.position[1]) * easedU,
      k0.position[2] + (k1.position[2] - k0.position[2]) * easedU,
    ],
    rotation: [
      k0.rotation[0] + (k1.rotation[0] - k0.rotation[0]) * easedU,
      k0.rotation[1] + (k1.rotation[1] - k0.rotation[1]) * easedU,
      k0.rotation[2] + (k1.rotation[2] - k0.rotation[2]) * easedU,
    ],
    fov: (k0.fov ?? FOV_DEFAULT) + ((k1.fov ?? FOV_DEFAULT) - (k0.fov ?? FOV_DEFAULT)) * easedU,
  }
}
