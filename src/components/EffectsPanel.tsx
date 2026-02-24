import { useStore } from '@/store'
import { CollapsibleSection } from './CollapsibleSection'
import type {
  SceneEffectZoom,
  SceneEffectGrain,
  SceneEffectDoF,
  SceneEffectHandheld,
  SceneEffectDither,
  SceneEffectChromaticAberration,
  SceneEffectLensDistortion,
  SceneEffectGlitch,
  SceneEffectVignette,
  SceneEffectScanline,
} from '@/types'

const inputClass =
  'block w-full mt-0.5 px-1.5 py-1 rounded bg-black/30 border border-white/10 text-xs text-white/80 focus:border-white/30 outline-none'

export function EffectsPanel() {
  const currentSceneIndex = useStore((s) => s.currentSceneIndex)
  const scene = useStore((s) => s.project.scenes[currentSceneIndex])
  const setEffect = useStore((s) => s.setEffect)

  if (!scene) return null

  return (
    <div className="space-y-0">
      {scene.effects.map((eff, i) => {
        if (eff.type === 'zoom')
          return (
            <CollapsibleSection key={i} title="Zoom" defaultOpen={false}>
              <div className="rounded bg-white/5 p-2 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-[11px] text-white/50">
                    Start
                    <input
                      type="number"
                      step={0.01}
                      min={0.5}
                      value={(eff as SceneEffectZoom).startScale}
                      onChange={(e) =>
                        setEffect(currentSceneIndex, i, {
                          startScale: parseFloat(e.target.value) || 1,
                        })
                      }
                      className={inputClass}
                    />
                  </label>
                  <label className="text-[11px] text-white/50">
                    End
                    <input
                      type="number"
                      step={0.01}
                      min={0.5}
                      value={(eff as SceneEffectZoom).endScale}
                      onChange={(e) =>
                        setEffect(currentSceneIndex, i, {
                          endScale: parseFloat(e.target.value) || 1,
                        })
                      }
                      className={inputClass}
                    />
                  </label>
                </div>
              </div>
            </CollapsibleSection>
          )
        if (eff.type === 'grain') {
          const g = eff as SceneEffectGrain & { opacity?: number }
          const startVal = g.startOpacity ?? g.opacity ?? 0.15
          const endVal = g.endOpacity ?? g.opacity ?? 0.15
          return (
            <CollapsibleSection key={i} title="Grain" defaultOpen={false}>
              <div className="rounded bg-white/5 p-2 space-y-2">
                <label className="block text-[11px] text-white/50">
                  Opacity
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <span className="text-white/40">S</span>
                      <input
                        type="range"
                        min={0}
                        max={0.5}
                        step={0.01}
                        value={startVal}
                        onChange={(e) =>
                          setEffect(currentSceneIndex, i, {
                            startOpacity: parseFloat(e.target.value),
                            endOpacity: g.endOpacity ?? g.opacity ?? 0.15,
                          })
                        }
                        className="w-full mt-0.5"
                      />
                      <span className="text-[10px] text-white/40">
                        {(startVal * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-white/40">E</span>
                      <input
                        type="range"
                        min={0}
                        max={0.5}
                        step={0.01}
                        value={endVal}
                        onChange={(e) =>
                          setEffect(currentSceneIndex, i, {
                            startOpacity: g.startOpacity ?? g.opacity ?? 0.15,
                            endOpacity: parseFloat(e.target.value),
                          })
                        }
                        className="w-full mt-0.5"
                      />
                      <span className="text-[10px] text-white/40">
                        {(endVal * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </label>
              </div>
            </CollapsibleSection>
          )
        }
        if (eff.type === 'dof')
          return (
            <CollapsibleSection key={i} title="Depth of field" defaultOpen={false}>
              <div className="rounded bg-white/5 p-2">
                <DoFControls
                  eff={eff as SceneEffectDoF}
                  sceneIndex={currentSceneIndex}
                  effectIndex={i}
                  setEffect={setEffect}
                />
              </div>
            </CollapsibleSection>
          )
        if (eff.type === 'handheld')
          return (
            <CollapsibleSection key={i} title="Handheld camera" defaultOpen={false}>
              <div className="rounded bg-white/5 p-2">
                <HandheldControls
                  eff={eff as SceneEffectHandheld}
                  sceneIndex={currentSceneIndex}
                  effectIndex={i}
                  setEffect={setEffect}
                />
              </div>
            </CollapsibleSection>
          )
        if (eff.type === 'dither')
          return (
            <CollapsibleSection key={i} title="Dither" defaultOpen={false}>
              <div className="rounded bg-white/5 p-2">
                <DitherControls
                  eff={eff as SceneEffectDither}
                  sceneIndex={currentSceneIndex}
                  effectIndex={i}
                  setEffect={setEffect}
                />
              </div>
            </CollapsibleSection>
          )
        if (eff.type === 'chromaticAberration')
          return (
            <CollapsibleSection key={i} title="Chromatic aberration" defaultOpen={false}>
              <div className="rounded bg-white/5 p-2">
                <ChromaticAberrationControls
                  eff={eff as SceneEffectChromaticAberration}
                  sceneIndex={currentSceneIndex}
                  effectIndex={i}
                  setEffect={setEffect}
                />
              </div>
            </CollapsibleSection>
          )
        if (eff.type === 'lensDistortion')
          return (
            <CollapsibleSection key={i} title="Lens distortion" defaultOpen={false}>
              <div className="rounded bg-white/5 p-2">
                <LensDistortionControls
                  eff={eff as SceneEffectLensDistortion}
                  sceneIndex={currentSceneIndex}
                  effectIndex={i}
                  setEffect={setEffect}
                />
              </div>
            </CollapsibleSection>
          )
        if (eff.type === 'glitch')
          return (
            <CollapsibleSection key={i} title="Glitch" defaultOpen={false}>
              <div className="rounded bg-white/5 p-2">
                <GlitchControls
                  eff={eff as SceneEffectGlitch}
                  sceneIndex={currentSceneIndex}
                  effectIndex={i}
                  setEffect={setEffect}
                />
              </div>
            </CollapsibleSection>
          )
        if (eff.type === 'vignette')
          return (
            <CollapsibleSection key={i} title="Vignette" defaultOpen={false}>
              <div className="rounded bg-white/5 p-2">
                <VignetteControls
                  eff={eff as SceneEffectVignette}
                  sceneIndex={currentSceneIndex}
                  effectIndex={i}
                  setEffect={setEffect}
                />
              </div>
            </CollapsibleSection>
          )
        if (eff.type === 'scanline')
          return (
            <CollapsibleSection key={i} title="Scanlines" defaultOpen={false}>
              <div className="rounded bg-white/5 p-2">
                <ScanlineControls
                  eff={eff as SceneEffectScanline}
                  sceneIndex={currentSceneIndex}
                  effectIndex={i}
                  setEffect={setEffect}
                />
              </div>
            </CollapsibleSection>
          )
        return null
      })}
    </div>
  )
}

function KeyframeSlider({
  label,
  start,
  end,
  min,
  max,
  step,
  format = (v) => String(v),
  onStart,
  onEnd,
}: {
  label: string
  start: number
  end: number
  min: number
  max: number
  step: number
  format?: (v: number) => string
  onStart: (v: number) => void
  onEnd: (v: number) => void
}) {
  return (
    <div className="space-y-1.5">
      <span className="text-[11px] text-white/50">{label}</span>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={start}
            onChange={(e) => onStart(parseFloat(e.target.value))}
            className="w-full"
          />
          <span className="text-[10px] text-white/40">{format(start)}</span>
        </div>
        <div>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={end}
            onChange={(e) => onEnd(parseFloat(e.target.value))}
            className="w-full"
          />
          <span className="text-[10px] text-white/40">{format(end)}</span>
        </div>
      </div>
    </div>
  )
}

type DoFLegacy = SceneEffectDoF & {
  focusDistance?: number
  focalLength?: number
  focusRange?: number
  bokehScale?: number
}

function DoFControls({
  eff,
  sceneIndex,
  effectIndex,
  setEffect,
}: {
  eff: SceneEffectDoF
  sceneIndex: number
  effectIndex: number
  setEffect: (sceneIndex: number, effectIndex: number, patch: object) => void
}) {
  const d = eff as DoFLegacy
  const fdS = d.focusDistanceStart ?? d.focusDistance ?? 0.015
  const fdE = d.focusDistanceEnd ?? d.focusDistance ?? 0.015
  const flS = d.focalLengthStart ?? d.focalLength ?? 0.02
  const flE = d.focalLengthEnd ?? d.focalLength ?? 0.02
  const frS = d.focusRangeStart ?? d.focusRange ?? 0.5
  const frE = d.focusRangeEnd ?? d.focusRange ?? 0.5
  const bS = d.bokehScaleStart ?? d.bokehScale ?? 6
  const bE = d.bokehScaleEnd ?? d.bokehScale ?? 6
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={eff.enabled}
          onChange={(e) => setEffect(sceneIndex, effectIndex, { enabled: e.target.checked })}
          className="rounded border-white/20"
        />
        <span className="text-[11px] text-white/60">Enabled</span>
      </label>
      {eff.enabled && (
        <div className="space-y-3">
          <KeyframeSlider
            label="Focus distance"
            start={fdS}
            end={fdE}
            min={0}
            max={0.1}
            step={0.001}
            format={(v) => v.toFixed(3)}
            onStart={(v) => setEffect(sceneIndex, effectIndex, { focusDistanceStart: v })}
            onEnd={(v) => setEffect(sceneIndex, effectIndex, { focusDistanceEnd: v })}
          />
          <KeyframeSlider
            label="Focal length"
            start={flS}
            end={flE}
            min={0.001}
            max={0.08}
            step={0.001}
            format={(v) => v.toFixed(3)}
            onStart={(v) => setEffect(sceneIndex, effectIndex, { focalLengthStart: v })}
            onEnd={(v) => setEffect(sceneIndex, effectIndex, { focalLengthEnd: v })}
          />
          <KeyframeSlider
            label="Focus range"
            start={frS}
            end={frE}
            min={0.05}
            max={2}
            step={0.05}
            format={(v) => v.toFixed(2)}
            onStart={(v) => setEffect(sceneIndex, effectIndex, { focusRangeStart: v })}
            onEnd={(v) => setEffect(sceneIndex, effectIndex, { focusRangeEnd: v })}
          />
          <KeyframeSlider
            label="Bokeh scale"
            start={bS}
            end={bE}
            min={0.5}
            max={15}
            step={0.5}
            format={(v) => v.toFixed(1)}
            onStart={(v) => setEffect(sceneIndex, effectIndex, { bokehScaleStart: v })}
            onEnd={(v) => setEffect(sceneIndex, effectIndex, { bokehScaleEnd: v })}
          />
        </div>
      )}
    </div>
  )
}

type HandheldLegacy = SceneEffectHandheld & {
  intensity?: number
  rotationShake?: number
  speed?: number
}

function HandheldControls({
  eff,
  sceneIndex,
  effectIndex,
  setEffect,
}: {
  eff: SceneEffectHandheld
  sceneIndex: number
  effectIndex: number
  setEffect: (sceneIndex: number, effectIndex: number, patch: object) => void
}) {
  const h = eff as HandheldLegacy
  const iS = h.intensityStart ?? h.intensity ?? 0.012
  const iE = h.intensityEnd ?? h.intensity ?? 0.012
  const rS = h.rotationShakeStart ?? h.rotationShake ?? 0.008
  const rE = h.rotationShakeEnd ?? h.rotationShake ?? 0.008
  const sS = h.speedStart ?? h.speed ?? 1.2
  const sE = h.speedEnd ?? h.speed ?? 1.2
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={eff.enabled}
          onChange={(e) => setEffect(sceneIndex, effectIndex, { enabled: e.target.checked })}
          className="rounded border-white/20"
        />
        <span className="text-[11px] text-white/60">Enabled</span>
      </label>
      {eff.enabled && (
        <div className="space-y-3">
          <KeyframeSlider
            label="Position shake"
            start={iS}
            end={iE}
            min={0}
            max={0.05}
            step={0.001}
            format={(v) => v.toFixed(3)}
            onStart={(v) => setEffect(sceneIndex, effectIndex, { intensityStart: v })}
            onEnd={(v) => setEffect(sceneIndex, effectIndex, { intensityEnd: v })}
          />
          <KeyframeSlider
            label="Rotation shake"
            start={rS}
            end={rE}
            min={0}
            max={0.03}
            step={0.001}
            format={(v) => v.toFixed(3)}
            onStart={(v) => setEffect(sceneIndex, effectIndex, { rotationShakeStart: v })}
            onEnd={(v) => setEffect(sceneIndex, effectIndex, { rotationShakeEnd: v })}
          />
          <KeyframeSlider
            label="Speed"
            start={sS}
            end={sE}
            min={0.2}
            max={3}
            step={0.1}
            format={(v) => v.toFixed(1)}
            onStart={(v) => setEffect(sceneIndex, effectIndex, { speedStart: v })}
            onEnd={(v) => setEffect(sceneIndex, effectIndex, { speedEnd: v })}
          />
        </div>
      )}
    </div>
  )
}

const DITHER_PRESETS: { value: SceneEffectDither['preset']; label: string }[] = [
  { value: 'subtle', label: 'Subtle' },
  { value: 'medium', label: 'Medium' },
  { value: 'strong', label: 'Strong' },
  { value: 'custom', label: 'Custom' },
]

const DITHER_MODES: { value: SceneEffectDither['mode']; label: string }[] = [
  { value: 'bayer2', label: 'Bayer 2×2' },
  { value: 'bayer4', label: 'Bayer 4×4' },
  { value: 'bayer8', label: 'Bayer 8×8' },
  { value: 'random', label: 'Random' },
]

function DitherControls({
  eff,
  sceneIndex,
  effectIndex,
  setEffect,
}: {
  eff: SceneEffectDither
  sceneIndex: number
  effectIndex: number
  setEffect: (sceneIndex: number, effectIndex: number, patch: object) => void
}) {
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={eff.enabled}
          onChange={(e) => setEffect(sceneIndex, effectIndex, { enabled: e.target.checked })}
          className="rounded border-white/20"
        />
        <span className="text-[11px] text-white/60">Enabled</span>
      </label>
      {eff.enabled && (
        <div className="space-y-3">
          <div>
            <span className="text-[11px] text-white/50 block mb-1">Preset</span>
            <select
              value={eff.preset}
              onChange={(e) =>
                setEffect(sceneIndex, effectIndex, {
                  preset: e.target.value as SceneEffectDither['preset'],
                })
              }
              className={inputClass}
            >
              {DITHER_PRESETS.map(({ value, label }) => (
                <option key={value} value={value} className="bg-zinc-900">
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <span className="text-[11px] text-white/50 block mb-1">Mode</span>
            <select
              value={eff.mode}
              onChange={(e) =>
                setEffect(sceneIndex, effectIndex, {
                  mode: e.target.value as SceneEffectDither['mode'],
                })
              }
              className={inputClass}
            >
              {DITHER_MODES.map(({ value, label }) => (
                <option key={value} value={value} className="bg-zinc-900">
                  {label}
                </option>
              ))}
            </select>
          </div>
          {eff.preset === 'custom' && (
            <div>
              <span className="text-[11px] text-white/50 block mb-1">
                Levels (2–32)
              </span>
              <input
                type="range"
                min={2}
                max={32}
                step={1}
                value={eff.levels}
                onChange={(e) =>
                  setEffect(sceneIndex, effectIndex, {
                    levels: parseInt(e.target.value, 10),
                  })
                }
                className="w-full mt-0.5"
              />
              <span className="text-[10px] text-white/40">{eff.levels}</span>
            </div>
          )}
          <label className="block text-[11px] text-white/50">
            Intensity (blend with original)
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={eff.intensity ?? 1}
              onChange={(e) =>
                setEffect(sceneIndex, effectIndex, {
                  intensity: parseFloat(e.target.value),
                })
              }
              className="w-full mt-0.5"
            />
            <span className="text-[10px] text-white/40">
              {((eff.intensity ?? 1) * 100).toFixed(0)}%
            </span>
          </label>
          <label className="block text-[11px] text-white/50">
            Threshold bias (lighter / darker)
            <input
              type="range"
              min={-0.3}
              max={0.3}
              step={0.02}
              value={eff.thresholdBias ?? 0}
              onChange={(e) =>
                setEffect(sceneIndex, effectIndex, {
                  thresholdBias: parseFloat(e.target.value),
                })
              }
              className="w-full mt-0.5"
            />
            <span className="text-[10px] text-white/40">
              {(eff.thresholdBias ?? 0).toFixed(2)}
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={eff.luminanceOnly ?? false}
              onChange={(e) =>
                setEffect(sceneIndex, effectIndex, { luminanceOnly: e.target.checked })
              }
              className="rounded border-white/20"
            />
            <span className="text-[11px] text-white/60">Luminance only (keep color)</span>
          </label>
        </div>
      )}
    </div>
  )
}

function ToggleControl({
  eff,
  sceneIndex,
  effectIndex,
  setEffect,
  children,
}: {
  eff: { enabled: boolean }
  sceneIndex: number
  effectIndex: number
  setEffect: (sceneIndex: number, effectIndex: number, patch: object) => void
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={eff.enabled}
          onChange={(e) => setEffect(sceneIndex, effectIndex, { enabled: e.target.checked })}
          className="rounded border-white/20"
        />
        <span className="text-[11px] text-white/60">Enabled</span>
      </label>
      {eff.enabled && children}
    </div>
  )
}

function ChromaticAberrationControls({
  eff,
  sceneIndex,
  effectIndex,
  setEffect,
}: {
  eff: SceneEffectChromaticAberration
  sceneIndex: number
  effectIndex: number
  setEffect: (sceneIndex: number, effectIndex: number, patch: object) => void
}) {
  return (
    <ToggleControl eff={eff} sceneIndex={sceneIndex} effectIndex={effectIndex} setEffect={setEffect}>
      <div className="space-y-2">
        <label className="block text-[11px] text-white/50">
          Offset (RGB shift)
          <input
            type="range"
            min={0}
            max={0.02}
            step={0.001}
            value={eff.offset}
            onChange={(e) =>
              setEffect(sceneIndex, effectIndex, { offset: parseFloat(e.target.value) })
            }
            className="w-full mt-0.5"
          />
          <span className="text-[10px] text-white/40">{(eff.offset * 1000).toFixed(1)}</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={eff.radialModulation}
            onChange={(e) =>
              setEffect(sceneIndex, effectIndex, { radialModulation: e.target.checked })
            }
            className="rounded border-white/20"
          />
          <span className="text-[11px] text-white/60">Radial (stronger at edges)</span>
        </label>
      </div>
    </ToggleControl>
  )
}

function LensDistortionControls({
  eff,
  sceneIndex,
  effectIndex,
  setEffect,
}: {
  eff: SceneEffectLensDistortion
  sceneIndex: number
  effectIndex: number
  setEffect: (sceneIndex: number, effectIndex: number, patch: object) => void
}) {
  return (
    <ToggleControl eff={eff} sceneIndex={sceneIndex} effectIndex={effectIndex} setEffect={setEffect}>
      <label className="block text-[11px] text-white/50">
        Distortion (barrel / pincushion)
        <input
          type="range"
          min={-0.2}
          max={0.2}
          step={0.01}
          value={eff.distortion}
          onChange={(e) =>
            setEffect(sceneIndex, effectIndex, { distortion: parseFloat(e.target.value) })
          }
          className="w-full mt-0.5"
        />
        <span className="text-[10px] text-white/40">{eff.distortion.toFixed(2)}</span>
      </label>
    </ToggleControl>
  )
}

const GLITCH_MODES: { value: SceneEffectGlitch['mode']; label: string }[] = [
  { value: 'sporadic', label: 'Sporadic' },
  { value: 'constantMild', label: 'Constant mild' },
]

// Map speed 0–1 to delay (min, max) in seconds. 0 = slow, 1 = fast.
function speedToDelay(speed: number): { delayMin: number; delayMax: number } {
  const t = 1 - Math.max(0, Math.min(1, speed))
  return {
    delayMin: 0.15 + t * 2.35,
    delayMax: 0.5 + t * 4.5,
  }
}
function delayToSpeed(delayMin: number): number {
  return 1 - (delayMin - 0.15) / 2.35
}
// Map length 0–1 to duration (min, max) in seconds.
function lengthToDuration(length: number): { durationMin: number; durationMax: number } {
  const t = Math.max(0, Math.min(1, length))
  return {
    durationMin: 0.2 + t * 0.6,
    durationMax: 0.4 + t * 1.1,
  }
}
function durationToLength(durationMin: number): number {
  return (durationMin - 0.2) / 0.6
}

function GlitchControls({
  eff,
  sceneIndex,
  effectIndex,
  setEffect,
}: {
  eff: SceneEffectGlitch
  sceneIndex: number
  effectIndex: number
  setEffect: (sceneIndex: number, effectIndex: number, patch: object) => void
}) {
  const delayMin = eff.delayMin ?? 1.5
  const durationMin = eff.durationMin ?? 0.6
  const speed = delayToSpeed(delayMin)
  const length = durationToLength(durationMin)

  return (
    <ToggleControl eff={eff} sceneIndex={sceneIndex} effectIndex={effectIndex} setEffect={setEffect}>
      <div className="space-y-2">
        <div>
          <span className="text-[11px] text-white/50 block mb-1">Mode</span>
          <select
            value={eff.mode}
            onChange={(e) =>
              setEffect(sceneIndex, effectIndex, {
                mode: e.target.value as SceneEffectGlitch['mode'],
              })
            }
            className={inputClass}
          >
            {GLITCH_MODES.map(({ value, label }) => (
              <option key={value} value={value} className="bg-zinc-900">
                {label}
              </option>
            ))}
          </select>
        </div>
        <label className="block text-[11px] text-white/50">
          Speed (how often glitches trigger)
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={speed}
            onChange={(e) => {
              const s = parseFloat(e.target.value)
              setEffect(sceneIndex, effectIndex, speedToDelay(s))
            }}
            className="w-full mt-0.5"
          />
          <span className="text-[10px] text-white/40">
            {speed < 0.35 ? 'Slow' : speed < 0.65 ? 'Medium' : 'Fast'}
          </span>
        </label>
        <label className="block text-[11px] text-white/50">
          Glitch length (duration of each glitch)
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={length}
            onChange={(e) => {
              const l = parseFloat(e.target.value)
              setEffect(sceneIndex, effectIndex, lengthToDuration(l))
            }}
            className="w-full mt-0.5"
          />
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={eff.monochrome ?? false}
            onChange={(e) =>
              setEffect(sceneIndex, effectIndex, { monochrome: e.target.checked })
            }
            className="rounded border-white/20"
          />
          <span className="text-[11px] text-white/60">Monochrome (no RGB fringing)</span>
        </label>
        <label className="block text-[11px] text-white/50">
          Ratio (weak ↔ strong glitches)
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={eff.ratio}
            onChange={(e) =>
              setEffect(sceneIndex, effectIndex, { ratio: parseFloat(e.target.value) })
            }
            className="w-full mt-0.5"
          />
        </label>
        <label className="block text-[11px] text-white/50">
          Columns
          <input
            type="range"
            min={0.01}
            max={0.2}
            step={0.01}
            value={eff.columns}
            onChange={(e) =>
              setEffect(sceneIndex, effectIndex, { columns: parseFloat(e.target.value) })
            }
            className="w-full mt-0.5"
          />
        </label>
      </div>
    </ToggleControl>
  )
}

function VignetteControls({
  eff,
  sceneIndex,
  effectIndex,
  setEffect,
}: {
  eff: SceneEffectVignette
  sceneIndex: number
  effectIndex: number
  setEffect: (sceneIndex: number, effectIndex: number, patch: object) => void
}) {
  return (
    <ToggleControl eff={eff} sceneIndex={sceneIndex} effectIndex={effectIndex} setEffect={setEffect}>
      <div className="space-y-2">
        <label className="block text-[11px] text-white/50">
          Offset
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={eff.offset}
            onChange={(e) =>
              setEffect(sceneIndex, effectIndex, { offset: parseFloat(e.target.value) })
            }
            className="w-full mt-0.5"
          />
        </label>
        <label className="block text-[11px] text-white/50">
          Darkness
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={eff.darkness}
            onChange={(e) =>
              setEffect(sceneIndex, effectIndex, { darkness: parseFloat(e.target.value) })
            }
            className="w-full mt-0.5"
          />
        </label>
      </div>
    </ToggleControl>
  )
}

function ScanlineControls({
  eff,
  sceneIndex,
  effectIndex,
  setEffect,
}: {
  eff: SceneEffectScanline
  sceneIndex: number
  effectIndex: number
  setEffect: (sceneIndex: number, effectIndex: number, patch: object) => void
}) {
  return (
    <ToggleControl eff={eff} sceneIndex={sceneIndex} effectIndex={effectIndex} setEffect={setEffect}>
      <div className="space-y-2">
        <label className="block text-[11px] text-white/50">
          Density
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.1}
            value={eff.density}
            onChange={(e) =>
              setEffect(sceneIndex, effectIndex, { density: parseFloat(e.target.value) })
            }
            className="w-full mt-0.5"
          />
        </label>
        <label className="block text-[11px] text-white/50">
          Scroll speed
          <input
            type="range"
            min={0}
            max={2}
            step={0.1}
            value={eff.scrollSpeed}
            onChange={(e) =>
              setEffect(sceneIndex, effectIndex, { scrollSpeed: parseFloat(e.target.value) })
            }
            className="w-full mt-0.5"
          />
        </label>
      </div>
    </ToggleControl>
  )
}

