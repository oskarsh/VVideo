import { Modal } from '@/components/Modal'
import { EXPORT_RESOLUTIONS } from '@/constants/export'

const SCREENSHOT_SCALE_OPTIONS = [
  { label: 'Preview (1×)', value: 480 },
  ...EXPORT_RESOLUTIONS.filter((r) => r.value > 480).map((r) => ({
    label: r.label,
    value: r.value,
  })),
]

export function ScreenshotDialog({
  open,
  onClose,
  scale,
  setScale,
  onCapture,
  isCapturing,
}: {
  open: boolean
  onClose: () => void
  scale: number
  setScale: (v: number) => void
  onCapture: () => void
  isCapturing: boolean
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      contentClassName="w-full max-w-sm rounded-xl border border-white/10 bg-zinc-900 p-5 shadow-xl"
    >
      <h2 className="text-lg font-semibold text-white mb-4">Screenshot</h2>
      <p className="text-sm text-white/60 mb-4">
        Capture the current frame from the canvas. Choose output resolution.
      </p>
      <div>
        <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-1.5">
          Scale / resolution
        </label>
        <div className="flex flex-wrap gap-2">
          {SCREENSHOT_SCALE_OPTIONS.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              onClick={() => setScale(value)}
              className={`px-2 py-2 rounded text-sm font-medium ${scale === value
                  ? 'bg-white text-black'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-white/80 bg-white/10 hover:bg-white/20"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onCapture}
          disabled={isCapturing}
          className="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-emerald-600/80 text-white hover:bg-emerald-500/90 disabled:opacity-50"
        >
          {isCapturing ? 'Capturing…' : 'Capture PNG'}
        </button>
      </div>
    </Modal>
  )
}
