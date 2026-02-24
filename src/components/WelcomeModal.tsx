import { useEffect, useState } from 'react'
import { VVideoLogo } from '@/components/VVideoLogo'

const WELCOME_STORAGE_KEY = 'vvideo-welcome-seen'

export function getWelcomeSeen(): boolean {
  try {
    return localStorage.getItem(WELCOME_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function setWelcomeSeen(): void {
  try {
    localStorage.setItem(WELCOME_STORAGE_KEY, '1')
  } catch {
    // ignore
  }
}

export function WelcomeModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  if (!open) return null

  const handleClose = () => {
    setWelcomeSeen()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className="bg-zinc-900 border border-white/15 rounded-xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col"
        role="dialog"
        aria-labelledby="welcome-title"
        aria-modal="true"
      >
        <div className="px-5 pt-5 pb-3 border-b border-white/10 flex items-center justify-between shrink-0">
          <div id="welcome-title" className="flex items-center gap-2">
            <VVideoLogo className="h-6 text-white" />
            <span className="text-lg font-semibold text-white">Welcome</span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto space-y-4">
          <p className="text-white/90 text-sm leading-relaxed">
            VVideo is a 3D video editor for social content. Add a background and an optional panel video, then add camera moves and effects. Export as WebM when you're done.
          </p>
          <div className="space-y-3">
            <div>
              <span className="text-xs font-medium text-white/60 uppercase tracking-wider">Left sidebar</span>
              <p className="text-sm text-white/80 mt-1">
                Aspect ratio, background & panel videos, trim, text, and scene duration. You can also drag a video onto the canvas to choose where it goes.
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-white/60 uppercase tracking-wider">Right sidebar</span>
              <p className="text-sm text-white/80 mt-1">
                Camera flyover (keyframes), and effects: zoom, grain, depth of field, handheld shake, dither. Select a scene in the timeline to edit its effects.
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-white/60 uppercase tracking-wider">Timeline & header</span>
              <p className="text-sm text-white/80 mt-1">
                Scrub or click scenes to switch. <kbd className="px-1.5 py-0.5 rounded bg-white/15 text-xs font-mono">Space</kbd> to play/pause. Use Export to render a WebM (full composite or panel-only with transparency).
              </p>
            </div>
          </div>
        </div>
        <div className="px-5 pb-5 pt-2 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="w-full py-2.5 rounded-lg text-sm font-medium bg-white text-black hover:bg-gray-200 transition-colors"
          >
            Get started
          </button>
        </div>
      </div>
    </div>
  )
}

/** Hook: show welcome modal on first visit only. */
export function useWelcome() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!getWelcomeSeen()) setShow(true)
  }, [])

  const close = () => setShow(false)

  return { show, close }
}
