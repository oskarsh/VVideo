import { useStore } from '@/store'
import { setFlyoverEditCamera } from '@/flyoverCameraRef'
import type { FlyoverEasing } from '@/types'
import { CurveEditor } from '@/components/CurveEditor'

export function FlyoverPanel() {
  const currentSceneIndex = useStore((s) => s.currentSceneIndex)
  const scene = useStore((s) => s.project.scenes[currentSceneIndex])
  const flyoverEditMode = useStore((s) => s.flyoverEditMode)
  const setFlyoverEditMode = useStore((s) => s.setFlyoverEditMode)
  const updateScene = useStore((s) => s.updateScene)

  if (!scene?.flyover) return null
  const { start } = scene.flyover

  const setEasing = (easing: FlyoverEasing) => {
    updateScene(currentSceneIndex, {
      flyover: { ...scene.flyover!, easing },
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
          Fly around: drag to orbit, scroll to zoom. <kbd className="px-1 py-0.5 rounded bg-white/10 text-[10px]">W A S D</kbd> move, <kbd className="px-1 py-0.5 rounded bg-white/10 text-[10px]">Q</kbd>/<kbd className="px-1 py-0.5 rounded bg-white/10 text-[10px]">E</kbd> down/up. <kbd className="px-1 py-0.5 rounded bg-white/10 text-[10px]">I J K L</kbd> rotate. Use the buttons on the canvas to set start and end.
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
      </div>

      <div className="mt-3">
        <div className="text-xs text-white/50 mb-1.5">Motion curve</div>
        <CurveEditor value={scene.flyover.easing} onChange={setEasing} />
      </div>
    </section>
  )
}
