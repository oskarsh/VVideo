import { useRef, useEffect, useState, useCallback } from 'react'
import { useStore } from '@/store'

export interface TrimRange {
  start: number
  end: number
}

export function TrimEditorModal({
  title,
  videoUrl,
  initialTrim,
  sceneDuration,
  videoType,
  onApply,
  onClose,
}: {
  title: string
  videoUrl: string
  initialTrim: TrimRange | null
  sceneDuration: number
  videoType: 'background' | 'plane'
  onApply: (trim: TrimRange) => void
  onClose: () => void
}) {
  const setTrimScrub = useStore((s) => s.setTrimScrub)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [duration, setDuration] = useState<number>(0)
  const [trim, setTrim] = useState<TrimRange>(() =>
    initialTrim
      ? { start: initialTrim.start, end: initialTrim.end }
      : { start: 0, end: 0 }
  )
  const [playing, setPlaying] = useState(false)
  const [previewTime, setPreviewTime] = useState(0)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !videoUrl) return

    const onLoadedMetadata = () => {
      const d = video.duration
      setDuration(d)
      if (!initialTrim) {
        setTrim({ start: 0, end: d })
        setPreviewTime(0)
      } else {
        setPreviewTime(initialTrim.start)
      }
    }

    video.src = videoUrl
    video.muted = true
    video.playsInline = true
    video.crossOrigin = 'anonymous'

    video.addEventListener('loadedmetadata', onLoadedMetadata)
    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata)
      video.src = ''
    }
  }, [videoUrl, initialTrim])

  // Sync trim from initial when duration becomes known and seek video to start
  useEffect(() => {
    if (duration <= 0) return
    const start = initialTrim
      ? Math.min(initialTrim.start, duration)
      : 0
    const end = initialTrim
      ? Math.min(initialTrim.end, duration)
      : duration
    setTrim({ start, end })
    setTrimScrub({ video: videoType, time: start })
    const video = videoRef.current
    if (video) {
      video.currentTime = start
      setPreviewTime(start)
    }
  }, [duration, initialTrim, videoType, setTrimScrub])

  // Scrub main canvas: set on open, clear on close
  useEffect(() => {
    setTrimScrub({ video: videoType, time: trim.start })
    return () => setTrimScrub(null)
  }, [videoType, setTrimScrub])

  const clampTrim = useCallback(() => {
    setTrim((t) => ({
      start: Math.max(0, Math.min(t.start, duration)),
      end: Math.max(0, Math.min(t.end, duration)),
    }))
  }, [duration])

  const handleStartChange = (v: number) => {
    const newStart = Math.max(0, Math.min(v, duration))
    setTrim((t) => ({ ...t, start: Math.max(0, Math.min(v, t.end)) }))
    setTrimScrub({ video: videoType, time: newStart })
    const vEl = videoRef.current
    if (vEl) {
      vEl.currentTime = newStart
      setPreviewTime(newStart)
    }
  }
  const handleEndChange = (v: number) => {
    const newEnd = Math.max(0, Math.min(v, duration))
    setTrim((t) => ({ ...t, end: Math.max(t.start, Math.min(v, duration)) }))
    setTrimScrub({ video: videoType, time: newEnd })
    const vEl = videoRef.current
    if (vEl) {
      vEl.currentTime = newEnd
      setPreviewTime(newEnd)
    }
  }
  const handleEndSliderRelease = useCallback(() => {
    setTrimScrub({ video: videoType, time: trim.start })
    const vEl = videoRef.current
    if (vEl) {
      vEl.currentTime = trim.start
      setPreviewTime(trim.start)
    }
  }, [videoType, trim.start, setTrimScrub])

  const seekToStart = () => {
    const v = videoRef.current
    if (v) {
      v.currentTime = trim.start
      setPreviewTime(trim.start)
      setPlaying(false)
      v.pause()
    }
  }
  const seekToEnd = () => {
    const v = videoRef.current
    if (v) {
      v.currentTime = trim.end
      setPreviewTime(trim.end)
      setPlaying(false)
      v.pause()
    }
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onTimeUpdate = () => {
      setPreviewTime(video.currentTime)
      if (video.currentTime >= trim.end) {
        video.pause()
        video.currentTime = trim.start
      }
    }
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onEnded = () => {
      setPlaying(false)
      video.currentTime = trim.start
    }

    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('ended', onEnded)
    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate)
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('ended', onEnded)
    }
  }, [trim.start, trim.end])

  const handleApply = () => {
    const start = Math.max(0, Math.min(trim.start, duration))
    const end = Math.max(start, Math.min(trim.end, duration))
    onApply({ start, end })
    onClose()
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = (s % 60).toFixed(1)
    return m > 0 ? `${m}:${sec.padStart(4, '0')}` : `${sec}s`
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-zinc-900 rounded-xl border border-white/10 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-white/50 hover:text-white p-1"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="p-4 flex-1 min-h-0 flex flex-col gap-4">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              muted
              playsInline
              loop={false}
              onTimeUpdate={() => { }}
            />
            <div className="absolute bottom-2 left-2 right-2 flex justify-between text-xs text-white/80">
              <span>{formatTime(previewTime)}</span>
              <span>Trim: {formatTime(trim.start)} – {formatTime(trim.end)}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                const v = videoRef.current
                if (!v) return
                if (playing) {
                  v.pause()
                } else {
                  if (v.currentTime < trim.start || v.currentTime >= trim.end) {
                    v.currentTime = trim.start
                  }
                  v.play()
                }
              }}
              className="absolute bottom-2 right-2 w-12 h-12 rounded-full bg-white/90 flex items-center justify-center text-xl text-black hover:bg-white shadow-lg"
              title={playing ? 'Pause' : 'Play'}
            >
              {playing ? '❚❚' : '▶'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="text-xs text-white/70">
              Start (s)
              <input
                type="number"
                min={0}
                max={duration}
                step={0.1}
                value={trim.start.toFixed(1)}
                onChange={(e) => handleStartChange(parseFloat(e.target.value) || 0)}
                onBlur={clampTrim}
                className="block w-full mt-1 px-2 py-1.5 rounded bg-black/30 border border-white/10 text-white"
              />
            </label>
            <label className="text-xs text-white/70">
              End (s)
              <input
                type="number"
                min={0}
                max={duration}
                step={0.1}
                value={trim.end.toFixed(1)}
                onChange={(e) => handleEndChange(parseFloat(e.target.value) || duration)}
                onBlur={() => {
                  clampTrim()
                  handleEndSliderRelease()
                }}
                className="block w-full mt-1 px-2 py-1.5 rounded bg-black/30 border border-white/10 text-white"
              />
            </label>
          </div>

          <div className="space-y-2">
            <div className="text-xs text-white/50">Timeline</div>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs text-white/70">
                Start
                <input
                  type="range"
                  min={0}
                  max={duration || 1}
                  step={0.05}
                  value={trim.start}
                  onChange={(e) => handleStartChange(parseFloat(e.target.value))}
                  className="block w-full mt-1 h-2 accent-white"
                />
              </label>
              <label className="text-xs text-white/70">
                End
                <input
                  type="range"
                  min={0}
                  max={duration || 1}
                  step={0.05}
                  value={trim.end}
                  onChange={(e) => handleEndChange(parseFloat(e.target.value))}
                  onPointerUp={handleEndSliderRelease}
                  onMouseUp={handleEndSliderRelease}
                  className="block w-full mt-1 h-2 accent-amber-500"
                />
              </label>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={seekToStart}
              className="text-xs px-2 py-1.5 rounded bg-white/10 text-white/80 hover:bg-white/20"
            >
              Go to start
            </button>
            <button
              type="button"
              onClick={seekToEnd}
              className="text-xs px-2 py-1.5 rounded bg-white/10 text-white/80 hover:bg-white/20"
            >
              Go to end
            </button>
          </div>
        </div>

        <div className="px-4 py-3 border-t border-white/10 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded text-sm text-white/80 hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-3 py-1.5 rounded text-sm bg-white text-black hover:bg-white/90"
          >
            Apply trim
          </button>
        </div>
      </div>
    </div>
  )
}
