import { GlobalEffectsPanel, CAMERA_DISTORTION_TYPES } from './GlobalEffectsPanel'
import { GLOBAL_EFFECT_LABELS } from '@/lib/effectLabels'
import { inputClass } from '@/constants/ui'
import type { GlobalEffectType } from '@/types'

export function CameraDistortionPanel({
  selectedType,
  onTypeChange,
}: {
  selectedType: GlobalEffectType
  onTypeChange: (t: GlobalEffectType) => void
}) {
  return (
    <div className="space-y-3">
      <div>
        <span className="text-[11px] text-white/50 block mb-1">Effect type</span>
        <select
          value={selectedType}
          onChange={(e) => onTypeChange(e.target.value as GlobalEffectType)}
          className={inputClass}
        >
          {CAMERA_DISTORTION_TYPES.map((t) => (
            <option key={t} value={t} className="bg-zinc-900">
              {GLOBAL_EFFECT_LABELS[t]}
            </option>
          ))}
        </select>
      </div>
      <GlobalEffectsPanel singleEffectType={selectedType} />
    </div>
  )
}
