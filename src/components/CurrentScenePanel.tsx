import { useStore } from '@/store'
import { sectionHeadingClass, smallLabelClass } from '@/constants/ui'
import { parseNum, clamp } from '@/utils/numbers'
import { getPlaneMedia } from '@/types'

export function CurrentScenePanel() {
  const project = useStore((s) => s.project)
  const currentSceneIndex = useStore((s) => s.currentSceneIndex)
  const clearScene = useStore((s) => s.clearScene)
  const setBackgroundTrim = useStore((s) => s.setBackgroundTrim)
  const setPlaneTrim = useStore((s) => s.setPlaneTrim)
  const updateScene = useStore((s) => s.updateScene)
  const setTrimEditorOpen = useStore((s) => s.setTrimEditorOpen)

  const scene = project.scenes[currentSceneIndex]
  const planeMedia = getPlaneMedia(project)
  const planeIsVideo = planeMedia?.type === 'video'

  if (!scene) return null

  const handleClearScene = () => {
    if (window.confirm('Clear this scene? Resets trim, text, and effects for this scene.')) {
      clearScene(currentSceneIndex)
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className={sectionHeadingClass}>Current scene</h2>
        <button
          type="button"
          onClick={handleClearScene}
          className="text-xs px-2 py-1 rounded bg-white/10 text-white/80 hover:bg-red-500/20 hover:text-red-400"
          title="Clear all content in this scene"
        >
          Clear
        </button>
      </div>
      <label className="block">
        <span className={smallLabelClass}>Duration (s)</span>
        <input
          type="number"
          min={0.5}
          step={0.5}
          value={scene.durationSeconds ?? 5}
          onChange={(e) =>
            updateScene(currentSceneIndex, {
              durationSeconds: clamp(parseNum(e.target.value, 5), 0.5, 360),
            })
          }
          className="w-full px-2 py-1.5 rounded bg-white/5 border border-white/10 text-sm text-white"
        />
      </label>
      {project.backgroundVideoUrl && !(project.backgroundVideoContinuous ?? false) && (
        <div className="pl-2 border-l-2 border-white/10 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-white/50 uppercase tracking-wider">Background trim</span>
            <button
              type="button"
              onClick={() => setTrimEditorOpen('background')}
              className="text-xs px-2 py-1 rounded bg-white/10 text-white/80 hover:bg-white/20 shrink-0"
            >
              Edit
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1">
            <label className="text-[10px]">
              Start
              <input
                type="number"
                min={0}
                step={0.1}
                value={scene.backgroundTrim?.start ?? ''}
                placeholder="0"
                onChange={(e) => {
                  const v = e.target.value === '' ? null : parseFloat(e.target.value)
                  if (v === null) {
                    setBackgroundTrim(currentSceneIndex, null)
                    return
                  }
                  const prev = scene.backgroundTrim
                  const end = scene.backgroundTrimEndClaimed ? (prev?.end ?? v) : v
                  setBackgroundTrim(currentSceneIndex, { start: v, end: Math.max(v, end) })
                }}
                className="block w-full mt-0.5 px-1.5 py-1 rounded bg-black/30 border border-white/10 text-white text-xs"
              />
            </label>
            <label className="text-[10px]">
              End
              <input
                type="number"
                min={0}
                step={0.1}
                value={scene.backgroundTrim?.end ?? ''}
                placeholder="full"
                onChange={(e) => {
                  const v = e.target.value === '' ? null : parseFloat(e.target.value)
                  if (v === null && !scene.backgroundTrim?.start) {
                    setBackgroundTrim(currentSceneIndex, null)
                    return
                  }
                  const start = scene.backgroundTrim?.start ?? 0
                  if (v === null) setBackgroundTrim(currentSceneIndex, null)
                  else setBackgroundTrim(currentSceneIndex, { start, end: Math.max(start, v) }, true)
                }}
                className="block w-full mt-0.5 px-1.5 py-1 rounded bg-black/30 border border-white/10 text-white text-xs"
              />
            </label>
          </div>
        </div>
      )}
      {planeMedia && planeIsVideo && (
        <div className="pl-2 border-l-2 border-white/10 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-white/50 uppercase tracking-wider">Panel trim</span>
            <button
              type="button"
              onClick={() => setTrimEditorOpen('plane')}
              className="text-xs px-2 py-1 rounded bg-white/10 text-white/80 hover:bg-white/20 shrink-0"
            >
              Edit
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1">
            <label className="text-[10px]">
              Start
              <input
                type="number"
                min={0}
                step={0.1}
                value={scene.planeTrim?.start ?? ''}
                placeholder="0"
                onChange={(e) => {
                  const v = e.target.value === '' ? null : parseFloat(e.target.value)
                  if (v === null) {
                    setPlaneTrim(currentSceneIndex, null)
                    return
                  }
                  const prev = scene.planeTrim
                  const end = scene.planeTrimEndClaimed ? (prev?.end ?? v) : v
                  setPlaneTrim(currentSceneIndex, { start: v, end: Math.max(v, end) })
                }}
                className="block w-full mt-0.5 px-1.5 py-1 rounded bg-black/30 border border-white/10 text-white text-xs"
              />
            </label>
            <label className="text-[10px]">
              End
              <input
                type="number"
                min={0}
                step={0.1}
                value={scene.planeTrim?.end ?? ''}
                placeholder="full"
                onChange={(e) => {
                  const v = e.target.value === '' ? null : parseFloat(e.target.value)
                  if (v === null && !scene.planeTrim?.start) {
                    setPlaneTrim(currentSceneIndex, null)
                    return
                  }
                  const start = scene.planeTrim?.start ?? 0
                  if (v === null) setPlaneTrim(currentSceneIndex, null)
                  else setPlaneTrim(currentSceneIndex, { start, end: Math.max(start, v) }, true)
                }}
                className="block w-full mt-0.5 px-1.5 py-1 rounded bg-black/30 border border-white/10 text-white text-xs"
              />
            </label>
          </div>
        </div>
      )}
    </section>
  )
}
