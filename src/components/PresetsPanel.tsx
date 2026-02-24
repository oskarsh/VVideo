import { useState, useCallback } from 'react'
import { useStore } from '@/store'
import { CollapsibleSection } from './CollapsibleSection'
import {
  getPresets,
  applyPreset,
  savePreset,
  deletePreset,
  isBuiltInPreset,
  type Preset,
} from '@/lib/presets'

export function PresetsPanel() {
  const project = useStore((s) => s.project)
  const setProject = useStore((s) => s.setProject)
  const [presets, setPresets] = useState<Preset[]>(() => getPresets())
  const [saveName, setSaveName] = useState('')
  const [saving, setSaving] = useState(false)

  const refreshPresets = useCallback(() => {
    setPresets(getPresets())
  }, [])

  const handleApply = useCallback(
    (preset: Preset) => {
      setProject(applyPreset(preset, project))
    },
    [project, setProject]
  )

  const handleSaveCurrent = useCallback(() => {
    const name = saveName.trim() || 'My preset'
    setSaving(true)
    try {
      savePreset(name, project)
      setSaveName('')
      refreshPresets()
    } finally {
      setSaving(false)
    }
  }, [project, saveName, refreshPresets])

  const handleDelete = useCallback(
    (id: string) => {
      if (isBuiltInPreset(id)) return
      deletePreset(id)
      refreshPresets()
    },
    [refreshPresets]
  )

  return (
    <CollapsibleSection title="Presets" defaultOpen={true}>
      <div className="space-y-3">
        <p className="text-xs text-white/50">
          Apply a preset to load its effects and look. Your videos and trims are kept.
        </p>

        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-2.5 py-2 group"
            >
              <button
                type="button"
                onClick={() => handleApply(preset)}
                className="flex-1 min-w-0 text-left text-sm font-medium text-white/90 hover:text-white truncate"
                title={`Apply "${preset.name}"`}
              >
                {preset.name}
              </button>
              {!isBuiltInPreset(preset.id) && (
                <button
                  type="button"
                  onClick={() => handleDelete(preset.id)}
                  className="shrink-0 p-1 rounded text-white/40 hover:text-red-400 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete preset"
                  aria-label={`Delete ${preset.name}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-white/10 space-y-2">
          <span className="text-[11px] text-white/50 block">Save current as preset</span>
          <div className="flex gap-2">
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveCurrent()}
              placeholder="Preset name"
              className="flex-1 min-w-0 px-2.5 py-1.5 rounded bg-black/30 border border-white/10 text-sm text-white placeholder-white/40 focus:border-white/30 outline-none"
              aria-label="Preset name"
            />
            <button
              type="button"
              onClick={handleSaveCurrent}
              disabled={saving}
              className="shrink-0 px-3 py-1.5 rounded text-sm font-medium bg-white/15 text-white hover:bg-white/25 disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  )
}
