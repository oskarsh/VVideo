import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useStore } from '@/store'
import { DEFAULT_DITHER } from '@/types'
import { getGlobalEffectStateAtTime } from '@/lib/globalEffects'
import { GLOBAL_EFFECT_LABELS } from '@/lib/effectLabels'
import { FlyoverPanel } from './FlyoverPanel'
import {
  GlobalEffectsPanel,
  GLOBAL_EFFECT_TYPES,
  CAMERA_DISTORTION_TYPES,
  getSceneEffectStateAtTime,
} from './GlobalEffectsPanel'
import { CameraDistortionPanel } from './CameraDistortionPanel'
import type { GlobalEffectType } from '@/types'

export function RightSidebar() {
  const currentSceneIndex = useStore((s) => s.currentSceneIndex)
  const scene = useStore((s) => s.project.scenes[currentSceneIndex])
  const project = useStore((s) => s.project)
  const setProjectDither = useStore((s) => s.setProjectDither)

  const [selectedDistortionType, setSelectedDistortionType] = useState<GlobalEffectType>('swirl')
  const [flyoverOpen, setFlyoverOpen] = useState(true)

  const dither = project.dither ?? DEFAULT_DITHER
  const hasFlyover = Boolean(scene?.flyover)
  const setGlobalEffectTrack = useStore((s) => s.setGlobalEffectTrack)
  const currentTime = useStore((s) => s.currentTime)
  const sceneStartTime = project.scenes
    .slice(0, currentSceneIndex)
    .reduce((acc, s) => acc + s.durationSeconds, 0)
  const sceneLocalTime = scene ? currentTime - sceneStartTime : 0
  const sceneDuration = scene?.durationSeconds ?? 0

  const effectEnabledMap = useMemo(() => {
    const computeEnabled = (effectType: GlobalEffectType): boolean => {
      const track = project.globalEffects?.[effectType]
      if (track) {
        const state = getGlobalEffectStateAtTime(project, effectType, currentTime)
        return state != null && (state as Record<string, unknown>).enabled !== false
      }
      if (effectType === 'dither') return dither.enabled
      const state =
        getGlobalEffectStateAtTime(project, effectType, currentTime) ??
        (scene ? getSceneEffectStateAtTime(scene, effectType, sceneLocalTime, sceneDuration) : null)
      if (!state) return false
      const s = state as Record<string, unknown>
      if ('enabled' in s && typeof s.enabled === 'boolean') return s.enabled
      return true
    }
    return Object.fromEntries(
      [...GLOBAL_EFFECT_TYPES, ...CAMERA_DISTORTION_TYPES].map((t) => [t, computeEnabled(t)])
    ) as Record<GlobalEffectType, boolean>
  }, [project, currentTime, dither.enabled, scene, sceneLocalTime, sceneDuration])

  const getEffectEnabled = (effectType: GlobalEffectType) => effectEnabledMap[effectType]

  const handleEffectToggle = (effectType: GlobalEffectType) => {
    const track = project.globalEffects?.[effectType]
    if (track) {
      const currentlyEnabled = getEffectEnabled(effectType)
      const nextEnabled = !currentlyEnabled
      setGlobalEffectTrack(effectType, { ...track, enabled: nextEnabled })
      return
    }
    if (effectType === 'dither') {
      setProjectDither({ enabled: !dither.enabled })
      return
    }
    const currentlyEnabled = getEffectEnabled(effectType)
    setGlobalEffectTrack(effectType, { enabled: !currentlyEnabled, keyframes: [] })
  }

  return (
    <div className="space-y-0">
      {GLOBAL_EFFECT_TYPES.map((effectType) => {
        const enabled = getEffectEnabled(effectType)
        return (
          <EffectSection
            key={effectType}
            title={GLOBAL_EFFECT_LABELS[effectType]}
            enabled={enabled}
            onToggle={() => handleEffectToggle(effectType)}
          >
            <GlobalEffectsPanel singleEffectType={effectType} />
          </EffectSection>
        )
      })}

      <EffectSection
        title="Camera Distortion"
        enabled={effectEnabledMap[selectedDistortionType] ?? false}
        onToggle={() => handleEffectToggle(selectedDistortionType)}
      >
        <CameraDistortionPanel
          selectedType={selectedDistortionType}
          onTypeChange={setSelectedDistortionType}
        />
      </EffectSection>

      {scene && hasFlyover && (
        <div className="border-b border-white/10 last:border-b-0">
          <div
            role="button"
            tabIndex={0}
            onClick={() => setFlyoverOpen((v) => !v)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setFlyoverOpen((v) => !v)
              }
            }}
            className="flex cursor-pointer items-center gap-2 py-2 hover:bg-white/5"
          >
            <span className="flex-1 text-left text-xs font-semibold uppercase tracking-wider text-white/70">
              Bezier
            </span>
            {flyoverOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-white/40 shrink-0" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-white/40 shrink-0" />
            )}
          </div>
          {flyoverOpen && (
            <div className="pb-3 px-1">
              <FlyoverPanel />
            </div>
          )}
        </div>
      )}

      {!scene && (
        <div className="flex flex-col items-center justify-center py-6 px-2 text-white/40 text-sm text-center">
          Select a scene in the timeline to edit
        </div>
      )}
    </div>
  )
}

function EffectSection({
  title,
  enabled,
  onToggle,
  children,
}: {
  title: string
  enabled: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-white/10 last:border-b-0">
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onToggle()
          }
        }}
        className="flex cursor-pointer items-center gap-2 py-2 hover:bg-white/5"
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggle()
          }}
          className={`flex h-5 w-9 shrink-0 items-center rounded border transition-colors ${
            enabled ? 'border-emerald-500/50 bg-emerald-500/30' : 'border-white/20 bg-white/5'
          }`}
          aria-label={enabled ? 'Turn off' : 'Turn on'}
        >
          <span
            className={`block h-3 w-3 rounded-full transition-all ${
              enabled ? 'translate-x-1 bg-emerald-400' : 'translate-x-[20px] bg-white/30'
            }`}
          />
        </button>
        <span className="flex-1 text-left text-xs font-semibold uppercase tracking-wider text-white/70">
          {title}
        </span>
        {enabled ? (
          <ChevronDown className="w-3.5 h-3.5 text-white/40 shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-white/40 shrink-0" />
        )}
      </div>
      {enabled && <div className="pb-3 px-1">{children}</div>}
    </div>
  )
}

