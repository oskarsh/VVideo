import { useRef } from 'react'
import { useStore } from '@/store'
import { sectionHeadingClass, smallLabelClass } from '@/constants/ui'
import { EXAMPLE_BACKGROUND_PATHS } from '@/constants/urls'
import { VideoThumbnail } from './VideoThumbnail'

export function AssetsPanel() {
  const project = useStore((s) => s.project)
  const currentSceneIndex = useStore((s) => s.currentSceneIndex)
  const setProjectBackgroundVideo = useStore((s) => s.setProjectBackgroundVideo)
  const setBackgroundTrim = useStore((s) => s.setBackgroundTrim)
  const setProjectAspectRatio = useStore((s) => s.setProjectAspectRatio)
  const setProjectBackgroundVideoContinuous = useStore((s) => s.setProjectBackgroundVideoContinuous)
  const scene = project.scenes[currentSceneIndex]
  const hasVideo = Boolean(project.backgroundVideoUrl)
  const aspectRatio = project.aspectRatio
  const is16x9 = aspectRatio[0] === 16 && aspectRatio[1] === 9
  const is9x16 = aspectRatio[0] === 9 && aspectRatio[1] === 16
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <section className="space-y-4">
      <h2 className={sectionHeadingClass}>Background</h2>

      {/* Empty: choose video */}
      {!hasVideo && (
        <div className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-3">
          <div>
            <span className={smallLabelClass}>Load video</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file?.type.startsWith('video/')) {
                  const url = URL.createObjectURL(file)
                  setProjectBackgroundVideo(url)
                  setBackgroundTrim(currentSceneIndex, null)
                }
                e.target.value = ''
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded px-2 py-1.5 bg-white/10 border border-white/20 text-white text-xs hover:bg-white/15"
            >
              Choose video file…
            </button>
          </div>
        </div>
      )}

      {/* Video set */}
      {hasVideo && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2">
          <div className="rounded border border-white/10 overflow-hidden bg-black/30">
            <VideoThumbnail
              url={project.backgroundVideoUrl!}
              time={scene?.backgroundTrim?.start ?? 0}
              className="border-0"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-white/70 cursor-pointer">
            <input
              type="checkbox"
              checked={project.backgroundVideoContinuous ?? false}
              onChange={(e) => setProjectBackgroundVideoContinuous(e.target.checked)}
              className="rounded border-white/30"
            />
            Continuous (across scenes)
          </label>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 rounded px-2 py-1 bg-white/10 text-white/80 text-xs hover:bg-white/20"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => setProjectBackgroundVideo(null)}
              className="rounded px-2 py-1 bg-white/10 text-white/80 text-xs hover:bg-red-500/20 hover:text-red-300"
            >
              Clear
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file?.type.startsWith('video/')) {
                const url = URL.createObjectURL(file)
                setProjectBackgroundVideo(url)
                setBackgroundTrim(currentSceneIndex, null)
              }
              e.target.value = ''
            }}
          />
        </div>
      )}

      <div>
        <span className={smallLabelClass}>Example backgrounds</span>
        <div className="grid grid-cols-4 gap-1 mt-1">
          {EXAMPLE_BACKGROUND_PATHS.map((path) => {
            const isSelected = project.backgroundVideoUrl === path
            return (
              <button
                key={path}
                type="button"
                onClick={() => {
                  setProjectBackgroundVideo(path)
                  setBackgroundTrim(currentSceneIndex, null)
                }}
                className={`w-14 rounded border overflow-hidden bg-black/30 flex shrink-0 focus:outline-none focus:ring-1 focus:ring-white/30 ${isSelected ? 'border-white ring-1 ring-white' : 'border-white/10 hover:border-white/20'
                  }`}
              >
                <VideoThumbnail url={path} time={0} className="border-0 w-full h-full !aspect-video" />
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <span className={smallLabelClass}>Aspect ratio</span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setProjectAspectRatio([16, 9])}
            className={`flex-1 px-2 py-1.5 rounded text-xs font-medium ${is16x9 ? 'bg-white text-black' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}
          >
            16×9
          </button>
          <button
            type="button"
            onClick={() => setProjectAspectRatio([9, 16])}
            className={`flex-1 px-2 py-1.5 rounded text-xs font-medium ${is9x16 ? 'bg-white text-black' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}
          >
            9×16
          </button>
        </div>
      </div>
    </section>
  )
}
