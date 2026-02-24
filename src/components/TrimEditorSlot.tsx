import { useStore } from '@/store'
import { getPlaneMedia } from '@/types'
import { TrimEditorModal } from './TrimEditorModal'

/**
 * Single owner for the trim editor modal. Renders TrimEditorModal when
 * trimEditorOpen is 'background' or 'plane'. Panels open it via setTrimEditorOpen.
 */
export function TrimEditorSlot() {
  const trimEditorOpen = useStore((s) => s.trimEditorOpen)
  const currentSceneIndex = useStore((s) => s.currentSceneIndex)
  const project = useStore((s) => s.project)
  const setBackgroundTrim = useStore((s) => s.setBackgroundTrim)
  const setPlaneTrim = useStore((s) => s.setPlaneTrim)
  const setTrimEditorOpen = useStore((s) => s.setTrimEditorOpen)

  const scene = project.scenes[currentSceneIndex]
  const planeMedia = getPlaneMedia(project)
  const planeIsVideo = planeMedia?.type === 'video'

  if (!trimEditorOpen || !scene) return null

  if (trimEditorOpen === 'background' && project.backgroundVideoUrl) {
    return (
      <TrimEditorModal
        title="Background trim"
        videoUrl={project.backgroundVideoUrl}
        initialTrim={scene.backgroundTrim}
        sceneDuration={scene.durationSeconds}
        videoType="background"
        onApply={(trim) => setBackgroundTrim(currentSceneIndex, trim, true)}
        onClose={() => setTrimEditorOpen(null)}
      />
    )
  }

  if (trimEditorOpen === 'plane' && planeIsVideo && planeMedia) {
    return (
      <TrimEditorModal
        title="Panel trim"
        videoUrl={planeMedia.url}
        initialTrim={scene.planeTrim}
        sceneDuration={scene.durationSeconds}
        videoType="plane"
        onApply={(trim) => setPlaneTrim(currentSceneIndex, trim, true)}
        onClose={() => setTrimEditorOpen(null)}
      />
    )
  }

  return null
}
