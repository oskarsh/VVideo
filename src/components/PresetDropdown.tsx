import { useState, useCallback, useRef, useEffect } from 'react'
import { useStore } from '@/store'
import {
  getPresets,
  applyPresetKeepKeyframes,
  savePreset,
  deletePreset,
  isBuiltInPreset,
  getSelectedPresetId,
  setSelectedPresetId,
  DEFAULT_PRESET_ID,
  type Preset,
} from '@/lib/presets'

export function PresetDropdown() {
  const project = useStore((s) => s.project)
  const setProject = useStore((s) => s.setProject)
  const [open, setOpen] = useState(false)
  const [presets, setPresets] = useState<Preset[]>(() => getPresets())
  const [selectedId, setSelectedId] = useState<string>(() => getSelectedPresetId())
  const [savePrompt, setSavePrompt] = useState(false)
  const [saveName, setSaveName] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const refreshPresets = useCallback(() => {
    setPresets(getPresets())
  }, [])

  useEffect(() => {
    if (open) {
      refreshPresets()
      setSelectedId(getSelectedPresetId())
    }
  }, [open, refreshPresets])

  const handleSelect = useCallback(
    (preset: Preset, e?: React.MouseEvent) => {
      e?.stopPropagation()
      setProject(applyPresetKeepKeyframes(preset, project))
      setSelectedId(preset.id)
      setSelectedPresetId(preset.id)
      setOpen(false)
    },
    [project, setProject]
  )

  const handleSave = useCallback(() => {
    const name = saveName.trim() || 'My preset'
    const added = savePreset(name, project)
    setSelectedId(added.id)
    setSelectedPresetId(added.id)
    setSaveName('')
    setSavePrompt(false)
    refreshPresets()
  }, [project, saveName, refreshPresets])

  const handleDelete = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation()
      if (isBuiltInPreset(id)) return
      deletePreset(id)
      if (selectedId === id) {
        setSelectedId(DEFAULT_PRESET_ID)
        setSelectedPresetId(DEFAULT_PRESET_ID)
      }
      refreshPresets()
    },
    [selectedId, refreshPresets]
  )

  useEffect(() => {
    if (!open && !savePrompt) return
    const onOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSavePrompt(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [open, savePrompt])

  const selectedPreset = presets.find((p) => p.id === selectedId) ?? presets.find((p) => p.id === DEFAULT_PRESET_ID)
  const displayName = selectedPreset?.name ?? 'Default'

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Preset: ${displayName}`}
      >
        <span className="max-w-[120px] truncate">{displayName}</span>
        <svg
          className={`w-4 h-4 text-white/50 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-1 min-w-[200px] max-h-[70vh] overflow-y-auto rounded-lg border border-white/10 bg-zinc-900 shadow-xl z-50 py-1"
          role="listbox"
        >
          {presets.map((preset) => (
            <div
              key={preset.id}
              className="flex items-center group"
              role="option"
              aria-selected={preset.id === selectedId}
            >
              <button
                type="button"
                onClick={(e) => handleSelect(preset, e)}
                className={`flex-1 min-w-0 text-left px-3 py-2 text-sm truncate ${preset.id === selectedId ? 'text-white bg-white/10' : 'text-white/80 hover:bg-white/5 hover:text-white'}`}
              >
                {preset.name}
              </button>
              {!isBuiltInPreset(preset.id) && (
                <button
                  type="button"
                  onClick={(e) => handleDelete(preset.id, e)}
                  className="shrink-0 p-2 text-white/40 hover:text-red-400 hover:bg-white/10"
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
          <div className="border-t border-white/10 mt-1 pt-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                setSavePrompt(true)
              }}
              className="w-full text-left px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white"
            >
              Save current as preset…
            </button>
          </div>
        </div>
      )}

      {savePrompt && (
        <div className="absolute left-0 top-full mt-1 min-w-[220px] rounded-lg border border-white/10 bg-zinc-900 shadow-xl z-50 p-3">
          <label className="block text-xs text-white/60 mb-2">Preset name</label>
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
              if (e.key === 'Escape') setSavePrompt(false)
            }}
            placeholder="My preset"
            className="w-full px-2.5 py-1.5 rounded bg-black/30 border border-white/10 text-sm text-white placeholder-white/40 focus:border-white/30 outline-none mb-2"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSavePrompt(false)}
              className="flex-1 px-2.5 py-1.5 rounded text-sm text-white/80 bg-white/10 hover:bg-white/15"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 px-2.5 py-1.5 rounded text-sm font-medium bg-white text-black hover:bg-gray-200"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
