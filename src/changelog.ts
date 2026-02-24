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
      '3D flyover camera with presets (Dolly, Orbit, Rise)',
      'Effects: zoom, grain, DoF, handheld, dither, lens distortion',
      'Text layers with Google Fonts',
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
