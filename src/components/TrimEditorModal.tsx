import { useRef, useEffect, useState, useCallback } from 'react'
import { X, Play, Pause } from 'lucide-react'
import { useStore } from '@/store'
import { Modal } from '@/components/Modal'

export interface TrimRange {
  start: number
  end: number
}

function useAudioWaveform(videoUrl: string | null, duration: number) {
  const [waveformData, setWaveformData] = useState<Float32Array | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!videoUrl || duration <= 0) {
      setWaveformData(null)
      setError(null)
      return
    }
    let cancelled = false
    setError(null)
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    fetch(videoUrl)
      .then((r) => r.arrayBuffer())
      .then((buf) => ctx.decodeAudioData(buf))
      .then((buffer) => {
        if (cancelled) return
        const ch = buffer.getChannelData(0)
        const samples = Math.min(ch.length, 4096)
        const step = Math.floor(ch.length / samples)
        const peaks = new Float32Array(samples)
        for (let i = 0; i < samples; i++) {
          let sum = 0
          const start = i * step
          const end = Math.min(start + step, ch.length)
          for (let j = start; j < end; j++) sum += Math.abs(ch[j])
          peaks[i] = end > start ? sum / (end - start) : 0
        }
        setWaveformData(peaks)
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message ?? 'No audio')
      })
    return () => {
      cancelled = true
      ctx.close()
    }
  }, [videoUrl, duration])

  return { waveformData, error }
}

function WaveformCanvas({
  waveformData,
  duration,
  trim,
  width,
  height,
  className,
}: {
  waveformData: Float32Array | null
  duration: number
  trim: TrimRange
  width: number
  height: number
  className?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || duration <= 0 || width < 1) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)
    const w = width
    const h = height
    ctx.fillStyle = 'rgba(255,255,255,0.06)'
    ctx.fillRect(0, 0, w, h)
    if (!waveformData || waveformData.length < 2) {
      ctx.fillStyle = 'rgba(255,255,255,0.2)'
      ctx.fillRect(0, h / 2 - 1, w, 2)
      return
    }
    const startPx = (trim.start / duration) * w
    const endPx = (trim.end / duration) * w
    const midY = h / 2
    const barWidth = Math.max(1, w / waveformData.length)
    for (let i = 0; i < waveformData.length; i++) {
      const x = (i / waveformData.length) * w
      const inRange = x >= startPx && x <= endPx
      ctx.fillStyle = inRange ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)'
      const amp = waveformData[i] * midY * 0.9
      ctx.fillRect(x, midY - amp, barWidth + 0.5, amp * 2)
    }
  }, [waveformData, duration, trim, width, height])

  return <canvas ref={canvasRef} width={width} height={height} className={className} style={{ width, height }} />
}

export function TrimEditorModal({
  open = true,
  title,
  videoUrl,
  initialTrim,
  sceneDuration: _sceneDuration,
  videoType,
  paneId,
  onApply,
  onClose,
}: {
  open?: boolean
  title: string
  videoUrl: string
  initialTrim: TrimRange | null
  sceneDuration: number
  videoType: 'background' | 'plane' | 'pane'
  paneId?: string
  onApply: (trim: TrimRange) => void
  onClose: () => void
}) {
  const setTrimScrub = useStore((s) => s.setTrimScrub)
  const scrubPayload = useCallback(
    (time: number) =>
      videoType === 'pane' && paneId != null
        ? { video: 'pane' as const, paneId, time }
        : videoType === 'background'
          ? { video: 'background' as const, time }
          : { video: 'plane' as const, time },
    [videoType, paneId]
  )
  const videoRef = useRef<HTMLVideoElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [duration, setDuration] = useState<number>(0)
  const [trim, setTrim] = useState<TrimRange>(() =>
    initialTrim ? { start: initialTrim.start, end: initialTrim.end } : { start: 0, end: 0 }
  )
  const [playing, setPlaying] = useState(false)
  const [previewTime, setPreviewTime] = useState(0)
  const [dragging, setDragging] = useState<'start' | 'end' | null>(null)
  const { waveformData } = useAudioWaveform(videoUrl, duration)

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
    video.volume = 0
    video.playsInline = true
    video.crossOrigin = 'anonymous'
    video.addEventListener('loadedmetadata', onLoadedMetadata)
    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata)
      video.src = ''
    }
  }, [videoUrl, initialTrim])

  useEffect(() => {
    if (duration <= 0) return
    const start = initialTrim ? Math.min(initialTrim.start, duration) : 0
    const end = initialTrim ? Math.min(initialTrim.end, duration) : duration
    setTrim({ start, end })
    setTrimScrub(scrubPayload(start))
    const video = videoRef.current
    if (video) {
      video.currentTime = start
      setPreviewTime(start)
    }
  }, [duration, initialTrim, scrubPayload, setTrimScrub])

  useEffect(() => {
    setTrimScrub(scrubPayload(trim.start))
    return () => setTrimScrub(null)
  }, [scrubPayload, trim.start, setTrimScrub])

  const scrubTo = useCallback(
    (t: number) => {
      const clamped = Math.max(0, Math.min(t, duration))
      setTrimScrub(scrubPayload(clamped))
      const v = videoRef.current
      if (v) {
        v.currentTime = clamped
        setPreviewTime(clamped)
      }
    },
    [duration, scrubPayload, setTrimScrub]
  )

  const handleStartChange = useCallback(
    (v: number) => {
      const newStart = Math.max(0, Math.min(v, duration))
      setTrim((t) => ({ ...t, start: Math.min(newStart, t.end - 0.05) }))
      scrubTo(newStart)
    },
    [duration, scrubTo]
  )

  const handleEndChange = useCallback(
    (v: number) => {
      const newEnd = Math.max(0, Math.min(v, duration))
      setTrim((t) => ({ ...t, end: Math.max(newEnd, t.start + 0.05) }))
      scrubTo(newEnd)
    },
    [duration, scrubTo]
  )

  const handleEndDragRelease = useCallback(() => {
    setTrimScrub(scrubPayload(trim.start))
    const v = videoRef.current
    if (v) {
      v.currentTime = trim.start
      setPreviewTime(trim.start)
    }
  }, [scrubPayload, trim.start, setTrimScrub])

  const pxToTime = useCallback(
    (px: number) => {
      const track = trackRef.current
      if (!track || duration <= 0) return 0
      const rect = track.getBoundingClientRect()
      const x = px - rect.left
      const t = (x / rect.width) * duration
      return Math.max(0, Math.min(t, duration))
    },
    [duration]
  )

  useEffect(() => {
    if (dragging === null) return
    const onMove = (e: PointerEvent) => {
      const t = pxToTime(e.clientX)
      if (dragging === 'start') handleStartChange(t)
      else handleEndChange(t)
    }
    const onUp = () => {
      if (dragging === 'end') handleEndDragRelease()
      setDragging(null)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [dragging, pxToTime, handleStartChange, handleEndChange, handleEndDragRelease])

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

  const waveformContainerRef = useRef<HTMLDivElement>(null)
  const [waveformWidth, setWaveformWidth] = useState(400)
  useEffect(() => {
    const el = waveformContainerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      setWaveformWidth(entries[0]?.contentRect.width ?? 400)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const startPercent = duration > 0 ? (trim.start / duration) * 100 : 0
  const endPercent = duration > 0 ? (trim.end / duration) * 100 : 100

  return (
    <Modal
      open={open}
      onClose={onClose}
      zIndex="z-50"
      className="bg-black/80 p-4"
      contentClassName="bg-zinc-900 rounded-xl border border-white/10 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
    >
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <button type="button" onClick={onClose} className="text-white/50 hover:text-white p-1" aria-label="Close">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 flex-1 min-h-0 flex flex-col gap-4">
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
          <video ref={videoRef} className="w-full h-full object-contain" muted playsInline loop={false} onTimeUpdate={() => { }} />
          <div className="absolute bottom-2 left-2 right-2 flex justify-between text-xs text-white/80">
            <span>{formatTime(previewTime)}</span>
            <span>Trim: {formatTime(trim.start)} – {formatTime(trim.end)}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              const v = videoRef.current
              if (!v) return
              if (playing) v.pause()
              else {
                if (v.currentTime < trim.start || v.currentTime >= trim.end) v.currentTime = trim.start
                v.play()
              }
            }}
            className="absolute bottom-2 right-2 w-12 h-12 rounded-full bg-white/90 flex items-center justify-center text-xl text-black hover:bg-white shadow-lg"
            title={playing ? 'Pause' : 'Play'}
          >
            {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
        </div>

        <div className="space-y-2">
          <div className="text-xs text-white/50">Drag handles to set in / out</div>
          <div className="relative">
            <div
              ref={trackRef}
              className="h-10 w-full rounded-lg bg-white/5 border border-white/10 select-none"
              role="slider"
              aria-valuemin={0}
              aria-valuemax={duration}
              aria-valuenow={previewTime}
            />
            <div className="absolute inset-0 h-10 pointer-events-none">
              <div
                className="absolute top-0 bottom-0 rounded bg-white/10 border border-white/20 pointer-events-none"
                style={{ left: `${startPercent}%`, right: `${100 - endPercent}%` }}
              />
            </div>
            <button
              type="button"
              className="absolute top-0 bottom-0 w-4 -ml-2 cursor-ew-resize rounded-l border-l-2 border-white/40 bg-white/10 hover:bg-white/20 touch-none z-10"
              style={{ left: `${startPercent}%` }}
              onPointerDown={(e) => {
                e.preventDefault()
                setDragging('start')
              }}
              aria-label="Trim start"
            />
            <button
              type="button"
              className="absolute top-0 bottom-0 w-4 -ml-2 cursor-ew-resize rounded-r border-r-2 border-white/40 bg-white/10 hover:bg-white/20 touch-none z-10"
              style={{ left: `${endPercent}%` }}
              onPointerDown={(e) => {
                e.preventDefault()
                setDragging('end')
              }}
              aria-label="Trim end"
            />
          </div>

          <div ref={waveformContainerRef} className="h-12 w-full rounded bg-black/30 overflow-hidden">
            <WaveformCanvas
              waveformData={waveformData}
              duration={duration}
              trim={trim}
              width={waveformWidth}
              height={48}
              className="w-full h-full block"
            />
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-white/10 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="px-3 py-1.5 rounded text-sm text-white/80 hover:bg-white/10">
          Cancel
        </button>
        <button type="button" onClick={handleApply} className="px-3 py-1.5 rounded text-sm bg-white text-black hover:bg-white/90">
          Apply trim
        </button>
      </div>
    </Modal>
  )
}
