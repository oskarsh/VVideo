import { useStore } from '@/store'
import { getPlaneMedia } from '@/types'
import { TrimEditorModal } from './TrimEditorModal'

/**
 * Single owner for the trim editor modal. Renders TrimEditorModal when
 * trimEditorOpen is 'background', 'plane', or { type: 'pane', paneId }. Panels open it via setTrimEditorOpen.
 */
export function TrimEditorSlot() {
  const trimEditorOpen = useStore((s) => s.trimEditorOpen)
  const currentSceneIndex = useStore((s) => s.currentSceneIndex)
  const project = useStore((s) => s.project)
  const setBackgroundTrim = useStore((s) => s.setBackgroundTrim)
  const setPlaneTrim = useStore((s) => s.setPlaneTrim)
  const setPaneTrim = useStore((s) => s.setPaneTrim)
  const setTrimEditorOpen = useStore((s) => s.setTrimEditorOpen)

  const scene = project.scenes[currentSceneIndex]
  const planeMedia = getPlaneMedia(project)
  const planeIsVideo = planeMedia?.type === 'video'
  const panes = project.panes ?? []

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

  if (typeof trimEditorOpen === 'object' && trimEditorOpen !== null && trimEditorOpen.type === 'pane') {
    const pane = panes.find((p) => p.id === trimEditorOpen.paneId)
    const paneMedia = pane?.media
    const paneIsVideo = paneMedia?.type === 'video'
    if (pane && paneIsVideo && paneMedia) {
      return (
        <TrimEditorModal
          title="Pane trim"
          videoUrl={paneMedia.url}
          initialTrim={scene.paneTrims?.[pane.id] ?? scene.planeTrim ?? null}
          sceneDuration={scene.durationSeconds}
          videoType="pane"
          paneId={pane.id}
          onApply={(trim) => setPaneTrim(currentSceneIndex, pane.id, trim, true)}
          onClose={() => setTrimEditorOpen(null)}
        />
      )
    }
  }

  return null
}
