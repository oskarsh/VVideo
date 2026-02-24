import { createPortal } from 'react-dom'
import { useStore } from '@/store'
import { useFloatingPanels } from '@/hooks/useFloatingPanels'
import { DEFAULT_DITHER } from '@/types'
import { getGlobalEffectStateAtTime } from '@/lib/globalEffects'
import { DraggableEffectWindow } from './DraggableEffectWindow'
import { FlyoverPanel } from './FlyoverPanel'
import { PanelRow } from './PanelRow'
import {
  GlobalEffectsPanel,
  GLOBAL_EFFECT_TYPES,
  EFFECT_LABELS,
  getSceneEffectStateAtTime,
} from './GlobalEffectsPanel'
import type { GlobalEffectType } from '@/types'

const PANEL_TITLES: Record<string, string> = {
  'camera-flyover': 'Bezier',
}

const PANEL_ORDER: string[] = [
  ...GLOBAL_EFFECT_TYPES,
  'camera-flyover',
]

export function RightSidebar() {
  const currentSceneIndex = useStore((s) => s.currentSceneIndex)
  const scene = useStore((s) => s.project.scenes[currentSceneIndex])
  const project = useStore((s) => s.project)
  const setProjectDither = useStore((s) => s.setProjectDither)

  const {
    openPanels,
    panelPositions,
    togglePanel,
    closePanel,
    setPanelPosition,
    positionByKey,
  } = useFloatingPanels(PANEL_ORDER, { panelWidth: 340 })

  const dither = project.dither ?? DEFAULT_DITHER
  const hasFlyover = Boolean(scene?.flyover)
  const setGlobalEffectTrack = useStore((s) => s.setGlobalEffectTrack)
  const currentTime = useStore((s) => s.currentTime)
  const sceneStartTime = project.scenes
    .slice(0, currentSceneIndex)
    .reduce((acc, s) => acc + s.durationSeconds, 0)
  const sceneLocalTime = scene ? currentTime - sceneStartTime : 0
  const sceneDuration = scene?.durationSeconds ?? 0

  const getEffectEnabled = (effectType: GlobalEffectType) => {
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
    <div className="p-2 lg:p-3 space-y-0">
      {/* Global effect rows — each opens floating window; on/off toggles effect only (keyframes added via panel sliders) */}
      {GLOBAL_EFFECT_TYPES.map((effectType) => (
        <PanelRow
          key={effectType}
          title={EFFECT_LABELS[effectType]}
          enabled={getEffectEnabled(effectType)}
          onToggleEnabled={() => handleEffectToggle(effectType)}
          onClick={() => togglePanel(effectType)}
        />
      ))}

      {!scene ? (
        <div className="flex flex-col items-center justify-center py-6 px-2 text-white/40 text-sm text-center">
          Select a scene in the timeline to edit
        </div>
      ) : (
        <>
          {hasFlyover && (
            <PanelRow
              title={PANEL_TITLES['camera-flyover']}
              enabled={true}
              toggleDisabled
              onClick={() => togglePanel('camera-flyover')}
            />
          )}
        </>
      )}

      {/* Floating panels */}
      {typeof document !== 'undefined' &&
        createPortal(
          <>
            {GLOBAL_EFFECT_TYPES.map((effectType) =>
              openPanels.has(effectType) ? (
                <DraggableEffectWindow
                  key={effectType}
                  id={`panel-${effectType}`}
                  title={EFFECT_LABELS[effectType]}
                  defaultX={(panelPositions[effectType] ?? positionByKey[effectType] ?? { x: 320, y: 60 }).x}
                  defaultY={(panelPositions[effectType] ?? positionByKey[effectType] ?? { x: 320, y: 60 }).y}
                  width={320}
                  onPositionChange={(x, y) => setPanelPosition(effectType, x, y)}
                  onClose={() => closePanel(effectType)}
                >
                  <GlobalEffectsPanel singleEffectType={effectType} />
                </DraggableEffectWindow>
              ) : null
            )}
            {openPanels.has('camera-flyover') && scene?.flyover && (() => {
              const key = 'camera-flyover'
              const pos = panelPositions[key] ?? positionByKey[key] ?? { x: 380, y: 120 }
              return (
                <DraggableEffectWindow
                  id="panel-camera-flyover"
                  title={PANEL_TITLES['camera-flyover']}
                  defaultX={pos.x}
                  defaultY={pos.y}
                  onPositionChange={(x, y) => setPanelPosition(key, x, y)}
                  onClose={() => closePanel('camera-flyover')}
                >
                  <FlyoverPanel />
                </DraggableEffectWindow>
              )
            })()}
          </>,
          document.body
        )}
    </div>
  )
}
