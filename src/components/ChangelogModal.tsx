import { useEffect, useState } from 'react'
import {
  getLatestRelease,
  getSeenVersion,
  setSeenVersion,
  type ChangelogRelease,
} from '@/changelog'
import { getWelcomeSeen } from '@/components/WelcomeModal'
import { VVideoLogo } from '@/components/VVideoLogo'

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function ChangelogModal({
  open,
  onClose,
  release,
}: {
  open: boolean
  onClose: () => void
  release: ChangelogRelease
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className="bg-zinc-900 border border-white/15 rounded-xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col"
        role="dialog"
        aria-labelledby="changelog-title"
        aria-modal="true"
      >
        <div className="px-5 pt-5 pb-3 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <VVideoLogo className="h-5 text-white" />
            <span className="text-lg font-semibold text-white">What's new</span>
            <span className="text-sm text-white/50 font-mono">v{release.version}</span>
            <span className="text-xs text-white/40">{formatDate(release.date)}</span>
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
        <div className="px-5 py-4 overflow-y-auto">
          <p id="changelog-title" className="text-white/90 text-sm leading-relaxed mb-4">
            {release.summary}
          </p>
          <ul className="space-y-2">
            {release.items.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-white/75">
                <span className="text-emerald-400/90 shrink-0">·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
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

/** Hook for App: auto-show when new version, plus manual open from "What's new" link. */
export function useChangelog() {
  const [autoShow, setAutoShow] = useState(false)
  const [manualShow, setManualShow] = useState(false)
  const release = getLatestRelease()

  useEffect(() => {
    // Only auto-show changelog after user has seen the welcome (first-time users see welcome only)
    if (getWelcomeSeen() && getSeenVersion() !== release.version) setAutoShow(true)
  }, [release.version])

  const open = () => setManualShow(true)
  const close = () => {
    setSeenVersion(release.version)
    setAutoShow(false)
    setManualShow(false)
  }

  return { show: autoShow || manualShow, open, close, release }
}
