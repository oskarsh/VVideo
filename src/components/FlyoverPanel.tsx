import { useStore } from '@/store'
import { sectionHeadingClass, smallLabelClass } from '@/constants/ui'
import type { FlyoverEasing } from '@/types'
import { CurveEditor } from '@/components/CurveEditor'

export function FlyoverPanel() {
  const currentSceneIndex = useStore((s) => s.currentSceneIndex)
  const scene = useStore((s) => s.project.scenes[currentSceneIndex])
  const updateScene = useStore((s) => s.updateScene)

  if (!scene?.flyover) return null

  const setEasing = (easing: FlyoverEasing) => {
    updateScene(currentSceneIndex, {
      flyover: { ...scene.flyover!, easing },
    })
  }

  return (
    <section>
      <h2 className={`${sectionHeadingClass} mb-2`}>
        Bezier
      </h2>

      <div className="mt-3">
        <div className={smallLabelClass}>Motion curve</div>
        <CurveEditor value={scene.flyover.easing} onChange={setEasing} />
      </div>
    </section>
  )
}
