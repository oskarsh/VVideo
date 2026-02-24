/**
 * Changelog for in-app "What's new" modal.
 * Newest release first. Keep summary short; use items for details.
 */

export type ChangelogRelease = {
  version: string
  date: string // YYYY-MM-DD
  summary: string
  items: string[]
}

export const CHANGELOG_STORAGE_KEY = 'vvideo-changelog-seen'

export const changelogReleases: ChangelogRelease[] = [
  {
    version: '1.5.0',
    date: '2026-02-24',
    summary: 'Panel images, SVG, and extrusion.',
    items: [
      'Panel can use video, image, or SVG (drop or choose file in sidebar)',
      'Images and SVG support transparency on the panel',
      'SVG is rendered as 3D shapes (no plane); vector paths are preserved',
      'New extrusion setting: make the panel thicker (works for video, image, and SVG)',
      'Extrusion slider in sidebar under Panel (0 = flat, increase for depth)',
    ],
  },
  {
    version: '1.4.0',
    date: '2026-02-24',
    summary: '2K and 4K export with smooth frame-by-frame rendering.',
    items: [
      'Export resolutions: added 2K (1440p) and 4K (2160p)',
      '2K and 4K use frame-by-frame export so the final video stays smooth (no dropped frames)',
      'Higher bitrate options (24 Mbps, 32 Mbps) for high-resolution exports',
      'Export may take longer than real-time for 2K/4K; quality is prioritised',
    ],
  },
  {
    version: '1.3.0',
    date: '2026-02-24',
    summary: 'Timeline automation curves for effect keyframes.',
    items: [
      'Toggle (📈) in timeline to show or hide effect automation curves',
      'Curves appear below the video track, synced to each scene',
      'One lane per automated parameter; multiple lanes when several effects are keyframed',
      'Drag the start and end points on each curve to tweak values quickly',
      'Smooth expand and fade when turning curves on',
    ],
  },
  {
    version: '1.2.0',
    date: '2026-02-24',
    summary: 'Camera flyover in the right sidebar.',
    items: [
      'Right sidebar: Camera flyover with Fly around toggle and motion curve (easing)',
      'Set start/end keyframes with canvas buttons; Jump to start to snap view',
    ],
  },
  {
    version: '1.1.0',
    date: '2025-02-24',
    summary: 'Changelog and smoother workflow.',
    items: [
      'In-app "What\'s new" popover when you open VVideo',
      'Changelog only shows again when there\'s a new release',
      'View changelog anytime from the header link',
    ],
  },
  {
    version: '1.0.0',
    date: '2025-02-24',
    summary: 'Initial release: 3D video editor for social content.',
    items: [
      'Scenes with background and optional panel video',
      '3D flyover camera (start/end keyframes; easing in right sidebar)',
      'Effects: zoom, grain, DoF, handheld, dither, chromatic aberration, lens distortion, glitch, vignette, scanlines',
      'In-browser WebM export',
    ],
  },
]

export function getLatestRelease(): ChangelogRelease {
  return changelogReleases[0]
}

export function getSeenVersion(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(CHANGELOG_STORAGE_KEY)
}

export function setSeenVersion(version: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CHANGELOG_STORAGE_KEY, version)
}
