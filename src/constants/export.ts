/** Framerate options for export. */
export const EXPORT_FRAMERATES = [24, 25, 30, 60] as const

/** Bitrate options for export (label + value in bps). */
export const EXPORT_BITRATES = [
  { label: '4 Mbps', value: 4_000_000 },
  { label: '8 Mbps', value: 8_000_000 },
  { label: '12 Mbps', value: 12_000_000 },
  { label: '16 Mbps', value: 16_000_000 },
  { label: '24 Mbps', value: 24_000_000 },
  { label: '32 Mbps', value: 32_000_000 },
] as const

/** Resolution options for export (label + height in px). */
export const EXPORT_RESOLUTIONS = [
  { label: '480p', value: 480 },
  { label: '720p', value: 720 },
  { label: '1080p', value: 1080 },
  { label: '2K', value: 1440 },
  { label: '4K', value: 2160 },
] as const

/** Resolutions at or above this use frame-by-frame export (smoother, may be slower). */
export const FRAME_BY_FRAME_RESOLUTION_THRESHOLD = 1440
