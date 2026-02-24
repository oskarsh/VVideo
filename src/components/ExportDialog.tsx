import { Modal } from '@/components/Modal'
import {
  EXPORT_FRAMERATES,
  EXPORT_BITRATES,
  EXPORT_RESOLUTIONS,
  FRAME_BY_FRAME_RESOLUTION_THRESHOLD,
} from '@/constants/export'

export function ExportDialog({
  open,
  framerate,
  setFramerate,
  bitrate,
  setBitrate,
  resolution,
  setResolution,
  frameByFrame,
  setFrameByFrame,
  content,
  setContent,
  hasPlaneMedia,
  onClose,
  onExport,
}: {
  open: boolean
  framerate: number
  setFramerate: (n: number) => void
  bitrate: number
  setBitrate: (n: number) => void
  resolution: number
  setResolution: (n: number) => void
  frameByFrame: boolean
  setFrameByFrame: (v: boolean) => void
  content: 'full' | 'plane-only'
  setContent: (c: 'full' | 'plane-only') => void
  hasPlaneMedia: boolean
  onClose: () => void
  onExport: () => void
}) {
  const useFrameByFrameForRes = resolution >= FRAME_BY_FRAME_RESOLUTION_THRESHOLD

  return (
    <Modal
      open={open}
      onClose={onClose}
      contentClassName="w-full max-w-sm rounded-xl border border-white/10 bg-zinc-900 p-5 shadow-xl"
    >
      <h2 className="text-lg font-semibold text-white mb-4">Export options</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-1.5">
            Resolution
          </label>
          <div className="flex gap-2">
            {EXPORT_RESOLUTIONS.map(({ label, value }) => (
              <button
                key={value}
                type="button"
                onClick={() => setResolution(value)}
                className={`flex-1 px-2 py-2 rounded text-sm font-medium ${resolution === value ? 'bg-white text-black' : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
          {useFrameByFrameForRes && (
            <p className="text-xs text-white/50 mt-1.5">
              2K/4K always use frame-by-frame for a smooth result.
            </p>
          )}
        </div>
        <div>
          <label className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10">
            <input
              type="checkbox"
              checked={frameByFrame || useFrameByFrameForRes}
              onChange={(e) => setFrameByFrame(e.target.checked)}
              disabled={useFrameByFrameForRes}
              className="rounded text-white"
            />
            <div>
              <span className="text-sm font-medium text-white">Smooth export (frame-by-frame)</span>
              <p className="text-xs text-white/50 mt-0.5">
                {useFrameByFrameForRes
                  ? 'Always on for 2K/4K.'
                  : 'No dropped frames; export may take longer than real-time.'}
              </p>
            </div>
          </label>
        </div>
        <div>
          <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-1.5">
            Framerate
          </label>
          <div className="flex gap-2">
            {EXPORT_FRAMERATES.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFramerate(f)}
                className={`flex-1 px-2 py-2 rounded text-sm font-medium ${framerate === f ? 'bg-white text-black' : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
              >
                {f} fps
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-1.5">
            Bitrate
          </label>
          <select
            value={bitrate}
            onChange={(e) => setBitrate(Number(e.target.value))}
            className="w-full px-3 py-2 rounded bg-white/10 border border-white/10 text-white text-sm"
          >
            {EXPORT_BITRATES.map(({ label, value }) => (
              <option key={value} value={value} className="bg-zinc-900">
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-1.5">
            Export content
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10">
              <input
                type="radio"
                name="export-content"
                checked={content === 'full'}
                onChange={() => setContent('full')}
                className="text-white"
              />
              <div>
                <span className="text-sm font-medium text-white">Full composite</span>
                <p className="text-xs text-white/50 mt-0.5">
                  Background + panel video, camera, effects (WebM)
                </p>
              </div>
            </label>
            <label
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${hasPlaneMedia
                ? 'bg-white/5 border-white/10 hover:bg-white/10'
                : 'border-white/5 bg-white/5 opacity-60 cursor-not-allowed'
                }`}
            >
              <input
                type="radio"
                name="export-content"
                checked={content === 'plane-only'}
                onChange={() => hasPlaneMedia && setContent('plane-only')}
                disabled={!hasPlaneMedia}
                className="text-white"
              />
              <div>
                <span className="text-sm font-medium text-white">Panel only (transparent)</span>
                <p className="text-xs text-white/50 mt-0.5">
                  {hasPlaneMedia
                    ? 'Panel + effects, transparent background (WebM with alpha)'
                    : 'Add a panel video, image or SVG in the sidebar to use this'}
                </p>
              </div>
            </label>
          </div>
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
          onClick={onExport}
          className="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-white text-black hover:bg-gray-200"
        >
          Start export
        </button>
      </div>
    </Modal>
  )
}
