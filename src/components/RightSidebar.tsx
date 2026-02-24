import { useStore } from '@/store'
import { DEFAULT_DITHER } from '@/types'
import { CollapsibleSection } from './CollapsibleSection'
import { EffectsPanel } from './EffectsPanel'
import { FlyoverPanel } from './FlyoverPanel'
import { GlobalDitherControls } from './GlobalDitherControls'

export function RightSidebar() {
  const currentSceneIndex = useStore((s) => s.currentSceneIndex)
  const scene = useStore((s) => s.project.scenes[currentSceneIndex])
  const project = useStore((s) => s.project)
  const setProjectDither = useStore((s) => s.setProjectDither)

  return (
    <div className="p-3 space-y-0">
      <CollapsibleSection title="Dither (global)" defaultOpen={false}>
        <GlobalDitherControls
          dither={project.dither ?? DEFAULT_DITHER}
          onPatch={setProjectDither}
        />
      </CollapsibleSection>
      {!scene ? (
        <div className="flex flex-col items-center justify-center p-6 text-white/40 text-sm text-center">
          Select a scene in the timeline to edit camera effects
        </div>
      ) : (
        <>
          <CollapsibleSection title="Camera flyover" defaultOpen={true}>
            <FlyoverPanel />
          </CollapsibleSection>
          <CollapsibleSection title="Camera effects" defaultOpen={true}>
            <EffectsPanel />
          </CollapsibleSection>
        </>
      )}
    </div>
  )
}
