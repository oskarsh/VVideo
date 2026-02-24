import { useState, useCallback } from 'react'
import { useStore } from '@/store'
import { CollapsibleSection } from './CollapsibleSection'
import { ScenePanel } from './ScenePanel'
import { getPresets, savePreset, deletePreset, applyPreset, type Preset } from '@/lib/presets'

export function Sidebar() {
  const [presetsList, setPresetsList] = useState<Preset[]>(getPresets)

  const refreshPresets = useCallback(() => {
    setPresetsList(getPresets())
  }, [])

  return (
    <div className="p-3 space-y-0">
      <CollapsibleSection title="Presets" defaultOpen={true}>
        <PresetsPanel
          presets={presetsList}
          onApply={(preset) => {
            const project = useStore.getState().project
            useStore.getState().setProject(applyPreset(preset, project))
          }}
          onSaveAs={(name) => {
            const project = useStore.getState().project
            savePreset(name, project)
            refreshPresets()
          }}
          onDelete={(id) => {
            deletePreset(id)
            refreshPresets()
          }}
        />
      </CollapsibleSection>
      <CollapsibleSection title="Video & scene" defaultOpen={true}>
        <ScenePanel />
      </CollapsibleSection>
    </div>
  )
}

const PRESET_PLACEHOLDER = ''

function PresetsPanel({
  presets,
  onApply,
  onSaveAs,
  onDelete,
}: {
  presets: Preset[]
  onApply: (preset: Preset) => void
  onSaveAs: (name: string) => void
  onDelete: (id: string) => void
}) {
  const [selectedId, setSelectedId] = useState(PRESET_PLACEHOLDER)
  const [deleteId, setDeleteId] = useState(PRESET_PLACEHOLDER)

  const handleApplyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value
    if (id === PRESET_PLACEHOLDER) return
    const preset = presets.find((p) => p.id === id)
    if (preset) {
      onApply(preset)
      setSelectedId(PRESET_PLACEHOLDER)
    }
  }

  const handleSaveAs = () => {
    const name = window.prompt('Preset name')
    if (name != null && name.trim()) onSaveAs(name.trim())
  }

  const handleDelete = () => {
    if (deleteId === PRESET_PLACEHOLDER) return
    if (window.confirm('Delete this preset?')) onDelete(deleteId)
    setDeleteId(PRESET_PLACEHOLDER)
  }

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-xs font-medium text-white/60 uppercase tracking-wider mb-1.5 block">
          Apply preset
        </span>
        <select
          value={selectedId}
          onChange={handleApplyChange}
          className="w-full rounded-lg py-2 pl-3 pr-8 text-sm bg-white/10 border border-white/10 text-white/90 hover:bg-white/15 focus:outline-none focus:ring-1 focus:ring-white/30 appearance-none bg-no-repeat bg-[length:12px] bg-[right_0.5rem_center]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23fff' opacity='0.7'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")" }}
        >
          <option value={PRESET_PLACEHOLDER} className="bg-zinc-900 text-white/70">
            — Choose preset —
          </option>
          {presets.map((p) => (
            <option key={p.id} value={p.id} className="bg-zinc-900">
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        onClick={handleSaveAs}
        className="w-full rounded-lg py-2 text-sm font-medium bg-white/10 text-white/80 hover:bg-white/20 border border-white/10"
      >
        Save current as preset…
      </button>
      {presets.length > 0 && (
        <div className="flex gap-2 items-end">
          <label className="flex-1 min-w-0">
            <span className="text-xs text-white/50 block mb-1">Delete preset</span>
            <select
              value={deleteId}
              onChange={(e) => setDeleteId(e.target.value)}
              className="w-full rounded-lg py-1.5 pl-2 pr-6 text-sm bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 focus:outline-none appearance-none bg-no-repeat bg-[length:10px] bg-[right_0.35rem_center]"
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23fff' opacity='0.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")" }}
            >
              <option value={PRESET_PLACEHOLDER} className="bg-zinc-900">— Select —</option>
              {presets.map((p) => (
                <option key={p.id} value={p.id} className="bg-zinc-900">{p.name}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteId === PRESET_PLACEHOLDER}
            className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-white/70 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

