import { useRef, useEffect, useState } from 'react'

/** Shows a single frame of a video (e.g. first frame or trim start) as a thumbnail. */
export function VideoThumbnail({
  url,
  time = 0,
  className = '',
}: {
  url: string
  time?: number
  className?: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !url) return

    setReady(false)
    setError(false)
    video.src = url
    video.muted = true
    video.playsInline = true
    video.crossOrigin = 'anonymous'

    const onLoadedMetadata = () => {
      const t = Math.max(0, Math.min(time, video.duration || 0))
      video.currentTime = t
    }

    const onSeeked = () => setReady(true)
    const onError = () => setError(true)

    video.addEventListener('loadedmetadata', onLoadedMetadata)
    video.addEventListener('seeked', onSeeked)
    video.addEventListener('error', onError)

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata)
      video.removeEventListener('seeked', onSeeked)
      video.removeEventListener('error', onError)
      video.src = ''
    }
  }, [url, time])

  return (
    <div
      className={`relative aspect-video w-full overflow-hidden rounded bg-black/40 ${className}`}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        muted
        playsInline
        preload="metadata"
      />
      {!ready && !error && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-white/50">
          …
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-red-400/80">
          Failed to load
        </div>
      )}
    </div>
  )
}
