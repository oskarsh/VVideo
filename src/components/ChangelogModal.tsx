import { useState, useEffect } from 'react'
import {
  getLatestRelease,
  getSeenVersion,
  setSeenVersion,
  changelogReleases,
  type ChangelogRelease,
} from '@/changelog'
import { getWelcomeSeen } from '@/components/WelcomeModal'
import { Modal } from '@/components/Modal'
import { VVideoLogo } from '@/components/VVideoLogo'

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function ReleaseBlock({ release }: { release: ChangelogRelease }) {
  return (
    <div className="pb-6 last:pb-0">
      <div className="flex items-baseline gap-2 flex-wrap mb-1.5">
        <span className="text-sm font-semibold text-white font-mono">v{release.version}</span>
        <span className="text-xs text-white/40">{formatDate(release.date)}</span>
      </div>
      <p className="text-white/90 text-sm leading-relaxed mb-2">{release.summary}</p>
      <ul className="space-y-1.5">
        {release.items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm text-white/70">
            <span className="text-white/50 shrink-0">·</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ChangelogModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  return (
    <Modal open={open} onClose={onClose} contentClassName="bg-zinc-900 border border-white/10 rounded-lg shadow-2xl max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col">
      <div className="px-5 pt-5 pb-3 border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <VVideoLogo className="h-5 text-white" />
          <span id="changelog-title" className="text-lg font-semibold text-white">Changelog</span>
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
        {changelogReleases.map((release, index) => (
          <div
            key={release.version}
            className={index > 0 ? 'pt-4 mt-4 border-t border-white/10' : undefined}
          >
            <ReleaseBlock release={release} />
          </div>
        ))}
      </div>
      <div className="px-5 pb-5 pt-2 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-lg text-sm font-medium bg-white text-black hover:bg-gray-200 transition-colors"
        >
          Close
        </button>
      </div>
    </Modal>
  )
}

/** Hook for App: auto-show when new version, plus manual open from "Changelog" link. */
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

  return { show: autoShow || manualShow, open, close }
}
