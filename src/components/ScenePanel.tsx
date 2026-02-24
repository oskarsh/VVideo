import { useStore } from '@/store'
import { VideoThumbnail } from './VideoThumbnail'
import { getPlaneMedia } from '@/types'
import { sectionHeadingClass, smallLabelClass } from '@/constants/ui'
import { parseNum, clamp } from '@/utils/numbers'

function getPlaneMediaTypeFromFile(file: File): 'video' | 'image' {
  if (file.type.startsWith('video/')) return 'video'
  if (file.type.startsWith('image/')) return 'image'
  return 'image'
  }

export function ScenePanel() {
  const project = useStore((s) => s.project)
  const currentSceneIndex = useStore((s) => s.currentSceneIndex)
  const clearScene = useStore((s) => s.clearScene)
  const setTrimEditorOpen = useStore((s) => s.setTrimEditorOpen)
  const setProjectBackgroundVideo = useStore((s) => s.setProjectBackgroundVideo)
  const setProjectBackgroundVideoContinuous = useStore((s) => s.setProjectBackgroundVideoContinuous)
  const setProjectPlaneMedia = useStore((s) => s.setProjectPlaneMedia)
  const setProjectPlaneExtrusionDepth = useStore((s) => s.setProjectPlaneExtrusionDepth)
  const setBackgroundTrim = useStore((s) => s.setBackgroundTrim)
  const setPlaneTrim = useStore((s) => s.setPlaneTrim)
  const setProjectAspectRatio = useStore((s) => s.setProjectAspectRatio)
  const updateScene = useStore((s) => s.updateScene)

  const scene = project.scenes[currentSceneIndex]
  const aspectRatio = project.aspectRatio
  const is16x9 = aspectRatio[0] === 16 && aspectRatio[1] === 9
  const is9x16 = aspectRatio[0] === 9 && aspectRatio[1] === 16
  const planeMedia = getPlaneMedia(project)
  const planeIsVideo = planeMedia?.type === 'video'

  const handleFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'background' | 'plane'
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    if (type === 'background') {
      setProjectBackgroundVideo(url)
      setBackgroundTrim(currentSceneIndex, null)
    } else {
      const mediaType = getPlaneMediaTypeFromFile(file)
      setProjectPlaneMedia(
        mediaType === 'video'
          ? { type: 'video', url }
          : { type: 'image', url }
      )
      if (mediaType === 'video') setPlaneTrim(currentSceneIndex, null)
    }
    e.target.value = ''
  }

    const handleClearScene = () => {
      if (window.confirm('Clear this scene? Resets trim, text, and effects for this scene.')) {
        clearScene(currentSceneIndex)
      }
    }

    if (!scene) return null

    return (
      <section className="space-y-4">
        <div>
          <span className={`${smallLabelClass}`}>Aspect ratio</span>
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={() => setProjectAspectRatio([16, 9])}
              className={`flex-1 px-3 py-2 rounded text-sm font-medium ${is16x9 ? 'bg-white text-black' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}
            >
              16×9
            </button>
            <button
              type="button"
              onClick={() => setProjectAspectRatio([9, 16])}
              className={`flex-1 px-3 py-2 rounded text-sm font-medium ${is9x16 ? 'bg-white text-black' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}
            >
              9×16
            </button>
          </div>
        </div>

        <div>
          <h2 className={`${sectionHeadingClass} mb-2`}>Videos</h2>
          <div className="space-y-3">
            <div>
              <span className={`${smallLabelClass}`}>Background</span>
              {project.backgroundVideoUrl ? (
                <div className="space-y-1.5">
                  <VideoThumbnail
                    url={project.backgroundVideoUrl}
                    time={scene?.backgroundTrim?.start ?? 0}
                    className="border border-white/10"
                  />
                  <label className="flex items-center gap-2 text-xs text-white/80 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={project.backgroundVideoContinuous ?? false}
                      onChange={(e) => setProjectBackgroundVideoContinuous(e.target.checked)}
                      className="rounded border-white/30"
                    />
                    Continuous background
                  </label>
                  <p className="text-xs text-white/50">
                    {project.backgroundVideoContinuous
                      ? 'Background keeps playing across scenes; pane changes per scene.'
                      : 'Background trim and playback are per scene.'}
                  </p>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleFile(e, 'background')}
                    className="block w-full text-sm text-white/80 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-white/10 file:text-white"
                  />
                </div>
              ) : (
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleFile(e, 'background')}
                  className="block w-full text-sm text-white/80 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-white/10 file:text-white"
                />
              )}
            </div>

            <div>
              <span className={`${smallLabelClass}`}>Panel</span>
              {planeMedia ? (
                <div className="space-y-1.5">
                  {planeMedia.type === 'video' ? (
                    <VideoThumbnail
                      url={planeMedia.url}
                      time={scene?.planeTrim?.start ?? 0}
                      className="border border-white/10"
                    />
                  ) : (
                    <div className="relative aspect-video w-full overflow-hidden rounded bg-black/40 border border-white/10">
                      <img
                        src={planeMedia.url}
                        alt=""
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="video/*,image/*"
                    onChange={(e) => handleFile(e, 'plane')}
                    className="block w-full text-sm text-white/80 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-white/10 file:text-white"
                  />
                  <label className="block text-xs text-white/60">
                    Extrusion
                    <input
                      type="range"
                      min={0}
                      max={0.3}
                      step={0.01}
                      value={project.planeExtrusionDepth ?? 0}
                      onChange={(e) =>
                        setProjectPlaneExtrusionDepth(parseFloat(e.target.value))
                      }
                      className="block w-full mt-0.5"
                    />
                    <span className="text-white/50">
                      {(project.planeExtrusionDepth ?? 0).toFixed(2)}
                    </span>
                  </label>
                </div>
              ) : (
                <>
                  <input
                    type="file"
                    accept="video/*,image/*"
                    onChange={(e) => handleFile(e, 'plane')}
                    className="block w-full text-sm text-white/80 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-white/10 file:text-white"
                  />
                  <p className="text-xs text-white/40 mt-1">Video or image</p>
                </>
              )}
            </div>
          </div>
        </div>

        {!project.backgroundVideoUrl && !planeMedia && (
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={handleClearScene}
              className="flex-1 px-2 py-1.5 rounded text-sm bg-white/10 text-white/80 hover:bg-red-500/20 hover:text-red-400"
              title="Clear all content in this scene"
            >
              Clear scene
            </button>
          </div>
        )}

        {project.backgroundVideoUrl && (
          <div className="pl-2 border-l-2 border-white/10 space-y-2">
            {!(project.backgroundVideoContinuous ?? false) && (
              <>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-white/50">Background trim</span>
                  <button
                    type="button"
                    onClick={() => setTrimEditorOpen('background')}
                    className="text-xs px-2 py-1 rounded bg-white/10 text-white/80 hover:bg-white/20 shrink-0"
                  >
                    Edit
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs text-white/50">Playback</span>
                  <button
                    type="button"
                    onClick={() => updateScene(currentSceneIndex, { backgroundVideoPlaybackMode: 'normal' })}
                    className={`text-xs px-2 py-1 rounded ${(scene.backgroundVideoPlaybackMode ?? 'normal') === 'normal' ? 'bg-white text-black' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}
                  >
                    Normal
                  </button>
                  <button
                    type="button"
                    onClick={() => updateScene(currentSceneIndex, { backgroundVideoPlaybackMode: 'fitScene' })}
                    className={`text-xs px-2 py-1 rounded ${(scene.backgroundVideoPlaybackMode ?? 'normal') === 'fitScene' ? 'bg-white text-black' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}
                  >
                    Fit to scene
                  </button>
                </div>
                <label className="block text-xs">
                  Speed
                  <input
                    type="number"
                    min={0.1}
                    max={4}
                    step={0.1}
                    value={scene.backgroundVideoSpeed ?? 1}
                    onChange={(e) =>
                      updateScene(currentSceneIndex, {
                        backgroundVideoSpeed: clamp(parseNum(e.target.value, 1), 0.1, 4),
                      })
                    }
                    className="block w-full mt-0.5 px-1.5 py-1 rounded bg-black/30 border border-white/10"
                  />
                </label>
                <div className="grid grid-cols-2 gap-2">
                <label className="text-xs">
                  Trim start (s)
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
                          const end = scene.backgroundTrimEndClaimed
                            ? (prev?.end ?? v)
                            : v
                          setBackgroundTrim(currentSceneIndex, { start: v, end: Math.max(v, end) })
                        }}
                        className="block w-full mt-0.5 px-1.5 py-1 rounded bg-black/30 border border-white/10"
                      />
                    </label>
                    <label className="text-xs">
                      Trim end (s)
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
                        className="block w-full mt-0.5 px-1.5 py-1 rounded bg-black/30 border border-white/10"
                      />
                    </label>
                  </div>
                  {scene.backgroundTrim && (
                    <button
                      type="button"
                      onClick={() => setBackgroundTrim(currentSceneIndex, null)}
                      className="text-xs text-white/50 hover:text-white"
                    >
                      Full video
                    </button>
                  )}
                </>
            )}

              </div>
            )}

            {planeMedia && planeIsVideo && (
              <div className="pl-2 border-l-2 border-white/10 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-white/50">Panel trim</span>
                  <button
                    type="button"
                    onClick={() => setTrimEditorOpen('plane')}
                    className="text-xs px-2 py-1 rounded bg-white/10 text-white/80 hover:bg-white/20 shrink-0"
                  >
                    Edit
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs text-white/50">Playback</span>
                  <button
                    type="button"
                    onClick={() => updateScene(currentSceneIndex, { planeVideoPlaybackMode: 'normal' })}
                    className={`text-xs px-2 py-1 rounded ${(scene.planeVideoPlaybackMode ?? 'normal') === 'normal' ? 'bg-white text-black' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}
                  >
                    Normal
                  </button>
                  <button
                    type="button"
                    onClick={() => updateScene(currentSceneIndex, { planeVideoPlaybackMode: 'fitScene' })}
                    className={`text-xs px-2 py-1 rounded ${(scene.planeVideoPlaybackMode ?? 'normal') === 'fitScene' ? 'bg-white text-black' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}
                  >
                    Fit to scene
                  </button>
                </div>
                <label className="block text-xs">
                  Speed
                  <input
                    type="number"
                    min={0.1}
                    max={4}
                    step={0.1}
                    value={scene.planeVideoSpeed ?? 1}
                    onChange={(e) =>
                      updateScene(currentSceneIndex, {
                        planeVideoSpeed: clamp(parseNum(e.target.value, 1), 0.1, 4),
                      })
                    }
                    className="block w-full mt-0.5 px-1.5 py-1 rounded bg-black/30 border border-white/10"
                  />
                </label>
                <div className="grid grid-cols-2 gap-2">
                <label className="text-xs">
                  Trim start (s)
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
                      const end = scene.planeTrimEndClaimed
                        ? (prev?.end ?? v)
                        : v
                      setPlaneTrim(currentSceneIndex, { start: v, end: Math.max(v, end) })
                    }}
                    className="block w-full mt-0.5 px-1.5 py-1 rounded bg-black/30 border border-white/10"
                  />
                </label>
                <label className="text-xs">
                  Trim end (s)
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
                  className="block w-full mt-0.5 px-1.5 py-1 rounded bg-black/30 border border-white/10"
                />
              </label>
            </div>
            {scene.planeTrim && (
              <button
                type="button"
                onClick={() => setPlaneTrim(currentSceneIndex, null)}
                className="text-xs text-white/50 hover:text-white"
              >
                Full video
              </button>
            )}
          </div>
        )}

        <div>
          <label className="block">
            <span className="text-xs text-white/60 block mb-1">Duration (s)</span>
            <input
              type="number"
              min={0.5}
              step={0.5}
              value={scene.durationSeconds ?? 5}
              onChange={(e) =>
                updateScene(currentSceneIndex, {
                  durationSeconds: Math.max(0.5, parseNum(e.target.value, 5)),
                })
              }
              className="w-full px-2 py-1.5 rounded bg-white/5 border border-white/10 text-sm"
            />
          </label>
        </div>
      </section>
    )
  }
