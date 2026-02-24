import { VVideoLogo } from '@/components/VVideoLogo'

export function AboutModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className="bg-zinc-900 border border-white/15 rounded-xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col"
        role="dialog"
        aria-labelledby="about-title"
        aria-modal="true"
      >
        <div className="px-5 pt-5 pb-3 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <VVideoLogo className="h-5 text-white" />
            <span id="about-title" className="text-lg font-semibold text-white">
              About
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto space-y-4">
          <section>
            <h2 className="text-xs font-medium text-white/60 uppercase tracking-wider mb-2">
              What is VVideo?
            </h2>
            <p className="text-white/90 text-sm leading-relaxed">
              VVideo is a web-based 3D video editor for social content. Compose scenes with a
              background and an optional panel video, add camera flyovers and effects, then export
              as WebM — all in the browser. Choose 16:9 or 9:16 for Reels, TikTok, and Shorts.
            </p>
          </section>
          <section>
            <h2 className="text-xs font-medium text-white/60 uppercase tracking-wider mb-2">
              Scenes & timeline
            </h2>
            <p className="text-white/90 text-sm leading-relaxed">
              Cut between multiple scenes; each has its own duration, background video, and
              optional video-on-plane. Scrub or click scenes in the timeline to switch. Space to
              play or pause.
            </p>
          </section>
          <section>
            <h2 className="text-xs font-medium text-white/60 uppercase tracking-wider mb-2">
              Camera & effects
            </h2>
            <p className="text-white/90 text-sm leading-relaxed">
              Define start and end camera position, rotation, and FOV per scene. Use the canvas
              buttons to set keyframes; adjust the motion curve (easing) in the right sidebar.
              Effects: zoom, grain, depth of field, handheld shake, dither, chromatic aberration,
              lens distortion, glitch, vignette, scanlines — keyframed per scene where applicable.
            </p>
          </section>
          <section>
            <h2 className="text-xs font-medium text-white/60 uppercase tracking-wider mb-2">
              Export
            </h2>
            <p className="text-white/90 text-sm leading-relaxed">
              Export renders a WebM in the browser (VP9 when supported). Choose resolution (480p,
              720p, 1080p), framerate, and bitrate. Full composite or panel-only with transparency.
              Audio is muted.
            </p>
          </section>
        </div>
        <div className="px-5 pb-5 pt-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-lg text-sm font-medium bg-white text-black hover:bg-gray-200 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
