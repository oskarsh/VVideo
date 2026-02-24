import { useStore } from '@/store'
import { CollapsibleSection } from './CollapsibleSection'
import { EffectsPanel } from './EffectsPanel'

export function RightSidebar() {
  const currentSceneIndex = useStore((s) => s.currentSceneIndex)
  const scene = useStore((s) => s.project.scenes[currentSceneIndex])

  if (!scene) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-white/40 text-sm text-center">
        Select a scene in the timeline to edit camera effects
      </div>
    )
  }

  return (
    <div className="p-3 space-y-0">
      <CollapsibleSection title="Camera effects" defaultOpen={true}>
        <EffectsPanel />
      </CollapsibleSection>
    </div>
  )
}
