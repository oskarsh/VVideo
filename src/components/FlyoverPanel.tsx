import { useStore } from '@/store'
import { getFlyoverEditCamera, setFlyoverEditCamera } from '@/flyoverCameraRef'
import type { FlyoverKeyframe, FlyoverEasing } from '@/types'
import { CurveEditor } from '@/components/CurveEditor'

const PRESETS: { name: string; start: FlyoverKeyframe; end: FlyoverKeyframe }[] = [
  { name: 'Dolly in', start: { position: [0, 0, 6], rotation: [0, 0, 0], fov: 50 }, end: { position: [0, 0, 3.5], rotation: [0, 0, 0], fov: 50 } },
  { name: 'Orbit right', start: { position: [0, 0, 5], rotation: [0, 0, 0], fov: 50 }, end: { position: [1.2, 0, 4.8], rotation: [0, -0.24, 0], fov: 50 } },
  { name: 'Rise', start: { position: [0, -0.5, 5], rotation: [0, 0, 0], fov: 50 }, end: { position: [0, 0.5, 5], rotation: [0, 0, 0], fov: 50 } },
]

export function FlyoverPanel() {
  const currentSceneIndex = useStore((s) => s.currentSceneIndex)
  const scene = useStore((s) => s.project.scenes[currentSceneIndex])
  const flyoverEditMode = useStore((s) => s.flyoverEditMode)
  const setFlyoverEditMode = useStore((s) => s.setFlyoverEditMode)
  const setFlyoverKeyframes = useStore((s) => s.setFlyoverKeyframes)
  const updateScene = useStore((s) => s.updateScene)

  if (!scene?.flyover) return null
  const { start, end } = scene.flyover

  const setEasing = (easing: FlyoverEasing) => {
    updateScene(currentSceneIndex, {
      flyover: { ...scene.flyover!, easing },
    })
  }

  const handleSetStart = () => {
    const cam = getFlyoverEditCamera()
    if (!cam) return
    setFlyoverKeyframes(currentSceneIndex, {
      position: [...cam.position],
      rotation: [...cam.rotation],
      fov: cam.fov,
    }, end)
  }

  const handleSetEnd = () => {
    const cam = getFlyoverEditCamera()
    if (!cam) return
    setFlyoverKeyframes(currentSceneIndex, start, {
      position: [...cam.position],
      rotation: [...cam.rotation],
      fov: cam.fov,
    })
  }

  const handleResetCamera = () => {
    setFlyoverEditCamera({
      position: [...start.position],
      rotation: [...start.rotation],
      fov: start.fov ?? 50,
    })
  }

  const handleToggleEdit = (on: boolean) => {
    setFlyoverEditMode(on)
    if (on && scene?.flyover?.start) {
      const s = scene.flyover.start
      setFlyoverEditCamera({
        position: [...s.position],
        rotation: [...s.rotation],
        fov: s.fov ?? 50,
      })
    } else if (!on) {
      setFlyoverEditCamera(null)
    }
  }

  return (
    <section>
      <h2 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
        Camera flyover
      </h2>

      <div className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-3">
        <p className="text-xs text-white/70">
          Fly around: drag to orbit, scroll to zoom. <kbd className="px-1 py-0.5 rounded bg-white/10 text-[10px]">W A S D</kbd> move forward/left/back/right, <kbd className="px-1 py-0.5 rounded bg-white/10 text-[10px]">Q</kbd>/<kbd className="px-1 py-0.5 rounded bg-white/10 text-[10px]">E</kbd> down/up. <kbd className="px-1 py-0.5 rounded bg-white/10 text-[10px]">I J K L</kbd> (vim) rotate camera up/left/down/right.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={flyoverEditMode}
              onChange={(e) => handleToggleEdit(e.target.checked)}
              className="rounded border-white/20"
            />
            <span className="text-sm font-medium">Fly around</span>
          </label>
          {flyoverEditMode && (
            <button
              type="button"
              onClick={handleResetCamera}
              className="px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white text-sm"
            >
              Reset camera
            </button>
          )}
        </div>
        {flyoverEditMode && (
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleSetStart}
              className="flex-1 min-w-[120px] px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium"
            >
              Set as start point
            </button>
            <button
              type="button"
              onClick={handleSetEnd}
              className="flex-1 min-w-[120px] px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium"
            >
              Set as end point
            </button>
          </div>
        )}
      </div>

      <>
        <details className="mt-3 group">
          <summary className="text-xs text-white/50 cursor-pointer hover:text-white/70 list-none flex items-center gap-1">
            <span className="group-open:rotate-90 transition-transform">▶</span>
            Presets
          </summary>
          <div className="flex flex-wrap gap-1 mt-2 pl-4">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => setFlyoverKeyframes(currentSceneIndex, p.start, p.end)}
                className="px-2 py-1 rounded text-xs bg-white/10 hover:bg-white/20"
              >
                {p.name}
              </button>
            ))}
          </div>
        </details>
        <details className="mt-2 group">
          <summary className="text-xs text-white/50 cursor-pointer hover:text-white/70 list-none flex items-center gap-1">
            <span className="group-open:rotate-90 transition-transform">▶</span>
            Tweak numbers
          </summary>
          <div className="mt-2 pl-4 space-y-2">
            <KeyframeBlock
              label="Start"
              kf={start}
              onChange={(kf) => setFlyoverKeyframes(currentSceneIndex, kf, end)}
            />
            <KeyframeBlock
              label="End"
              kf={end}
              onChange={(kf) => setFlyoverKeyframes(currentSceneIndex, start, kf)}
            />
          </div>
        </details>
      </>

      <details className="mt-3 group" open>
        <summary className="text-xs text-white/50 cursor-pointer hover:text-white/70 list-none flex items-center gap-1">
          <span className="group-open:rotate-90 transition-transform">▶</span>
          Motion curve
        </summary>
        <div className="mt-2 pl-4">
          <CurveEditor value={scene.flyover.easing} onChange={setEasing} />
        </div>
      </details>
    </section>
  )
}

function KeyframeBlock({
  label,
  kf,
  onChange,
}: {
  label: string
  kf: FlyoverKeyframe
  onChange: (kf: FlyoverKeyframe) => void
}) {
  return (
    <div className="rounded bg-black/20 p-2 space-y-1">
      <span className="text-xs text-white/60">{label}</span>
      <div className="grid grid-cols-3 gap-1 text-xs">
        {(['x', 'y', 'z'] as const).map((axis, i) => (
          <input
            key={axis}
            type="number"
            step={0.1}
            placeholder={axis}
            value={kf.position[i]}
            onChange={(e) => {
              const v = parseFloat(e.target.value) || 0
              const pos = [...kf.position] as [number, number, number]
              pos[i] = v
              onChange({ ...kf, position: pos })
            }}
            className="w-full px-1.5 py-1 rounded bg-black/30 border border-white/10"
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1 text-xs">
        {(['pitch', 'yaw', 'roll'] as const).map((name, i) => (
          <input
            key={name}
            type="number"
            step={0.01}
            placeholder={name}
            value={kf.rotation[i]}
            onChange={(e) => {
              const v = parseFloat(e.target.value) || 0
              const rot = [...kf.rotation] as [number, number, number]
              rot[i] = v
              onChange({ ...kf, rotation: rot })
            }}
            className="w-full px-1.5 py-1 rounded bg-black/30 border border-white/10"
          />
        ))}
      </div>
      <input
        type="number"
        step={1}
        placeholder="FOV"
        value={kf.fov ?? 50}
        onChange={(e) =>
          onChange({ ...kf, fov: Math.max(10, Math.min(120, parseFloat(e.target.value) || 50)) })
        }
        className="w-full px-1.5 py-1 rounded bg-black/30 border border-white/10 text-xs"
      />
    </div>
  )
}
