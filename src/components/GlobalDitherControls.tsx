import type { SceneEffectDither } from '@/types'
import { DitherControls } from './EffectsPanel'

export function GlobalDitherControls({
  dither,
  onPatch,
}: {
  dither: SceneEffectDither
  onPatch: (patch: Partial<SceneEffectDither>) => void
}) {
  return (
    <DitherControls
      eff={dither}
      sceneIndex={0}
      effectIndex={0}
      setEffect={(_s, _e, patch) => onPatch(patch as Partial<SceneEffectDither>)}
    />
  )
}
