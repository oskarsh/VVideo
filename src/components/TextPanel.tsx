import { X } from 'lucide-react'
import { useStore } from '@/store'
import { sectionHeadingClass, smallLabelClass } from '@/constants/ui'
import { parseNum, clamp } from '@/utils/numbers'
import type { SceneText, SceneTextMode } from '@/types'

const FONT_OPTIONS = [
  'IBM Plex Mono',
  'Inter',
  'Space Grotesk',
  'Outfit',
  'Syne',
]

/** Single-value slider with label and value readout. */
function SliderRow({
  label,
  value,
  min,
  max,
  step,
  format = (v: number) => String(v),
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  format?: (v: number) => string
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-white/50 uppercase tracking-wider">{label}</span>
        <span className="text-[10px] text-white/40 tabular-nums">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
    </div>
  )
}

function ensureTextDefaults(t: SceneText): SceneText {
  return {
    ...t,
    fontFamily: t.fontFamily ?? 'IBM Plex Mono',
    fontWeight: t.fontWeight ?? 400,
    color: t.color ?? '#ffffff',
    fontSize: t.fontSize ?? (t.mode === '3d' ? 0.15 : 24),
    position: t.position ?? [0, 0, 1.5],
    rotation: t.rotation ?? [0, 0, 0],
    scale: t.scale ?? 1,
    staticAlignX: t.staticAlignX ?? 'center',
    staticAlignY: t.staticAlignY ?? 'center',
    staticPadding: t.staticPadding ?? 24,
  }
}

export function TextPanel() {
  const currentSceneIndex = useStore((s) => s.currentSceneIndex)
  const scene = useStore((s) => s.project.scenes[currentSceneIndex])
  const updateScene = useStore((s) => s.updateScene)

  if (!scene) return null
  const texts: SceneText[] = (scene.texts ?? []).map(ensureTextDefaults)
  if (texts.length === 0) return null

  const setTexts = (next: SceneText[]) => {
    updateScene(currentSceneIndex, { texts: next })
  }

  const updateText = (id: string, patch: Partial<SceneText>) => {
    setTexts(
      texts.map((t) => (t.id === id ? { ...t, ...patch } : t))
    )
  }

  const removeText = (id: string) => {
    setTexts(texts.filter((t) => t.id !== id))
  }

  return (
    <section>
      <h2 className={`${sectionHeadingClass} mb-2`}>
        Text
      </h2>
      <p className="text-xs text-white/50 mb-2">
        3D: placed in the room. Static: always in front of camera.
      </p>
      <div className="space-y-3">
        {texts.map((t) => (
          <TextItem
            key={t.id}
            text={t}
            onChange={(patch) => updateText(t.id, patch)}
            onRemove={() => removeText(t.id)}
          />
        ))}
      </div>
    </section>
  )
}

function TextItem({
  text,
  onChange,
  onRemove,
}: {
  text: SceneText
  onChange: (patch: Partial<SceneText>) => void
  onRemove: () => void
}) {
  const t = ensureTextDefaults(text)
  const is3d = t.mode === '3d'

  return (
    <div className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <input
          type="text"
          value={t.content}
          onChange={(e) => onChange({ content: e.target.value })}
          placeholder="Enter text"
          className="flex-1 min-w-0 rounded px-2 py-1.5 bg-black/30 border border-white/10 text-white text-sm placeholder-white/40 focus:border-white/30 outline-none"
        />
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 p-1 rounded text-white/50 hover:text-red-400 hover:bg-white/10"
          title="Remove text"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex gap-2">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="radio"
            name={`mode-${t.id}`}
            checked={t.mode === '3d'}
            onChange={() => onChange({ mode: '3d' as SceneTextMode })}
            className="rounded border-white/20"
          />
          <span className="text-xs text-white/70">3D</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="radio"
            name={`mode-${t.id}`}
            checked={t.mode === 'static'}
            onChange={() => onChange({ mode: 'static' as SceneTextMode })}
            className="rounded border-white/20"
          />
          <span className="text-xs text-white/70">Static</span>
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={smallLabelClass}>Font</label>
          <select
            value={t.fontFamily}
            onChange={(e) => onChange({ fontFamily: e.target.value })}
            className="w-full rounded px-2 py-1.5 bg-black/30 border border-white/10 text-white text-xs focus:border-white/30 outline-none"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f} value={f} className="bg-zinc-900 text-white">
                {f}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={smallLabelClass}>Color</label>
          <div className="flex items-center gap-1.5">
            <input
              type="color"
              value={t.color}
              onChange={(e) => onChange({ color: e.target.value })}
              className="w-8 h-8 rounded border border-white/20 cursor-pointer bg-transparent"
            />
            <input
              type="text"
              value={t.color}
              onChange={(e) => onChange({ color: e.target.value })}
              className="flex-1 min-w-0 rounded px-2 py-1.5 bg-black/30 border border-white/10 text-white text-xs font-mono focus:border-white/30 outline-none"
            />
          </div>
        </div>
      </div>
      <div>
        {is3d ? (
          <SliderRow
            label="Size (world)"
            value={t.fontSize}
            min={0.05}
            max={20}
            step={0.01}
            format={(v) => v.toFixed(2)}
            onChange={(v) => onChange({ fontSize: v })}
          />
        ) : (
          <>
            <label className={smallLabelClass}>Font size (px)</label>
            <input
              type="number"
              min={8}
              max={200}
              value={t.fontSize}
              onChange={(e) => onChange({ fontSize: clamp(parseNum(e.target.value, 24), 8, 200) })}
              className="w-full rounded px-2 py-1.5 bg-black/30 border border-white/10 text-white text-xs focus:border-white/30 outline-none"
            />
          </>
        )}
      </div>
      {is3d ? (
        <>
          <div className={smallLabelClass + ' pt-0.5'}>Position</div>
          <div className="space-y-2">
            <SliderRow
              label="X"
              value={t.position[0]}
              min={-2}
              max={2}
              step={0.05}
              format={(v) => v.toFixed(2)}
              onChange={(v) => {
                const pos = [...t.position]
                pos[0] = v
                onChange({ position: pos as [number, number, number] })
              }}
            />
            <SliderRow
              label="Y"
              value={t.position[1]}
              min={-2}
              max={2}
              step={0.05}
              format={(v) => v.toFixed(2)}
              onChange={(v) => {
                const pos = [...t.position]
                pos[1] = v
                onChange({ position: pos as [number, number, number] })
              }}
            />
            <SliderRow
              label="Z"
              value={t.position[2]}
              min={-1}
              max={4}
              step={0.05}
              format={(v) => v.toFixed(2)}
              onChange={(v) => {
                const pos = [...t.position]
                pos[2] = v
                onChange({ position: pos as [number, number, number] })
              }}
            />
          </div>
          <div className={smallLabelClass + ' pt-1'}>Rotation</div>
          <div className="space-y-2">
            <SliderRow
              label="X (pitch)"
              value={t.rotation[0]}
              min={-Math.PI}
              max={Math.PI}
              step={0.05}
              format={(v) => `${(v * (180 / Math.PI)).toFixed(0)}°`}
              onChange={(v) => {
                const rot = [...t.rotation]
                rot[0] = v
                onChange({ rotation: rot as [number, number, number] })
              }}
            />
            <SliderRow
              label="Y (yaw)"
              value={t.rotation[1]}
              min={-Math.PI}
              max={Math.PI}
              step={0.05}
              format={(v) => `${(v * (180 / Math.PI)).toFixed(0)}°`}
              onChange={(v) => {
                const rot = [...t.rotation]
                rot[1] = v
                onChange({ rotation: rot as [number, number, number] })
              }}
            />
            <SliderRow
              label="Z (roll)"
              value={t.rotation[2]}
              min={-Math.PI}
              max={Math.PI}
              step={0.05}
              format={(v) => `${(v * (180 / Math.PI)).toFixed(0)}°`}
              onChange={(v) => {
                const rot = [...t.rotation]
                rot[2] = v
                onChange({ rotation: rot as [number, number, number] })
              }}
            />
          </div>
          <div className="pt-1">
            <SliderRow
              label="Scale"
              value={t.scale}
              min={0.2}
              max={20}
              step={0.05}
              format={(v) => v.toFixed(2)}
              onChange={(v) => onChange({ scale: v })}
            />
          </div>
        </>
      ) : (
        <>
          <div className="flex gap-2 flex-wrap">
            <div>
              <label className={smallLabelClass}>Align X</label>
              <select
                value={t.staticAlignX}
                onChange={(e) => onChange({ staticAlignX: e.target.value as 'left' | 'center' | 'right' })}
                className="rounded px-2 py-1.5 bg-black/30 border border-white/10 text-white text-xs focus:border-white/30 outline-none"
              >
                <option value="left" className="bg-zinc-900">Left</option>
                <option value="center" className="bg-zinc-900">Center</option>
                <option value="right" className="bg-zinc-900">Right</option>
              </select>
            </div>
            <div>
              <label className={smallLabelClass}>Align Y</label>
              <select
                value={t.staticAlignY}
                onChange={(e) => onChange({ staticAlignY: e.target.value as 'top' | 'center' | 'bottom' })}
                className="rounded px-2 py-1.5 bg-black/30 border border-white/10 text-white text-xs focus:border-white/30 outline-none"
              >
                <option value="top" className="bg-zinc-900">Top</option>
                <option value="center" className="bg-zinc-900">Center</option>
                <option value="bottom" className="bg-zinc-900">Bottom</option>
              </select>
            </div>
            <div>
              <label className={smallLabelClass}>Padding (px)</label>
              <input
                type="number"
                min={0}
                max={200}
                value={t.staticPadding}
                onChange={(e) => onChange({ staticPadding: clamp(parseNum(e.target.value, 24), 0, 200) })}
                className="w-20 rounded px-2 py-1.5 bg-black/30 border border-white/10 text-white text-xs focus:border-white/30 outline-none"
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
