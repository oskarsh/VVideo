import { useState, useEffect, useCallback } from 'react'
import { Modal } from '@/components/Modal'
import { useStore } from '@/store'
import {
  listSavedProjects,
  loadSavedProject,
  deleteSavedProject,
  getProjectBlobUrls,
  type PersistedProject,
} from '@/lib/storage/projectStorage'

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
  } catch {
    return iso
  }
}

function formatDuration(seconds: number): string {
  const s = Math.round(seconds)
  const m = Math.floor(s / 60)
  const rem = s % 60
  return m > 0 ? `${m}m ${rem}s` : `${rem}s`
}

export function ProjectsDashboard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [projects, setProjects] = useState<PersistedProject[]>([])
  const [loading, setLoading] = useState(false)
  const [openingId, setOpeningId] = useState<string | null>(null)
  const openProject = useStore((s) => s.openProject)
  const resetProject = useStore((s) => s.resetProject)
  const currentProject = useStore((s) => s.project)

  const refresh = useCallback(async () => {
    setLoading(true)
    const list = await listSavedProjects()
    setProjects(list)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (open) refresh()
  }, [open, refresh])

  const handleOpen = async (id: string) => {
    setOpeningId(id)
    const result = await loadSavedProject(id)
    setOpeningId(null)
    if (!result) return
    // Revoke old blob URLs from current project
    for (const url of getProjectBlobUrls(currentProject)) {
      URL.revokeObjectURL(url)
    }
    openProject(result.project)
    onClose()
  }

  const handleDelete = async (id: string) => {
    await deleteSavedProject(id)
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }

  const handleNew = () => {
    resetProject()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      contentClassName="bg-zinc-900 border border-white/15 rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-white/10 flex items-center justify-between shrink-0">
        <h2 className="text-lg font-semibold text-white">Projects</h2>
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

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-5">
        {loading ? (
          <p className="text-white/50 text-sm text-center py-8">Loading…</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {/* New project card */}
            <button
              type="button"
              onClick={handleNew}
              className="flex flex-col items-center justify-center gap-2 aspect-video rounded-lg border-2 border-dashed border-white/20 hover:border-white/40 hover:bg-white/5 transition-colors text-white/50 hover:text-white/80"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm font-medium">New project</span>
            </button>

            {/* Saved project cards */}
            {projects.map((p) => (
              <div
                key={p.id}
                className="group relative rounded-lg overflow-hidden border border-white/10 bg-zinc-800/50 hover:border-white/25 transition-colors"
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-zinc-800 relative">
                  {p.thumbnailDataUrl ? (
                    <img
                      src={p.thumbnailDataUrl}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14m0 0V10m0 4H5a2 2 0 01-2-2V8a2 2 0 012-2h10v8z" />
                      </svg>
                    </div>
                  )}

                  {/* Overlay buttons */}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleOpen(p.id)}
                      disabled={openingId === p.id}
                      className="px-3 py-1.5 rounded-md bg-white text-black text-xs font-semibold hover:bg-white/90 disabled:opacity-60 transition-colors"
                    >
                      {openingId === p.id ? 'Opening…' : 'Open'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id)}
                      className="px-3 py-1.5 rounded-md bg-red-600/80 text-white text-xs font-semibold hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Metadata */}
                <div className="px-3 py-2">
                  <p className="text-white text-sm font-medium truncate">{p.name || 'Untitled'}</p>
                  <p className="text-white/40 text-xs mt-0.5">
                    {p.sceneCount} scene{p.sceneCount !== 1 ? 's' : ''} · {formatDuration(p.totalDurationSeconds)}
                  </p>
                  <p className="text-white/30 text-xs mt-0.5 truncate">{formatDate(p.updatedAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && projects.length === 0 && (
          <p className="text-white/40 text-sm text-center py-4">
            No saved projects yet. Changes are saved automatically.
          </p>
        )}
      </div>
    </Modal>
  )
}
