import { useRef, useState, useEffect } from 'react'
import { X, ChevronUp, ChevronDown } from 'lucide-react'
import { useStore } from '@/store'
import { sectionHeadingClass, smallLabelClass } from '@/constants/ui'
import { EXAMPLE_CLIP_PATHS } from '@/constants/urls'
import { parseNum, clamp } from '@/utils/numbers'
import type { Pane, PlaneMedia, Scene, SceneText } from '@/types'
import { VideoThumbnail } from './VideoThumbnail'

function getMediaTypeFromFile(file: File): 'video' | 'image' {
  if (file.type.startsWith('video/')) return 'video'
  if (file.type.startsWith('image/')) return 'image'
  return 'image'
}

function isAcceptableFile(file: File): boolean {
  return (
    file.type.startsWith('video/') ||
    file.type.startsWith('image/')
  )
}

function fileToPlaneMedia(file: File): PlaneMedia {
  const url = URL.createObjectURL(file)
  const type = getMediaTypeFromFile(file)
  return type === 'video' ? { type: 'video', url } : { type: 'image', url }
}

function EmptyPaneDropZone({
  compact = false,
  onDrop,
}: {
  compact?: boolean
  onDrop: (media: PlaneMedia) => void
}) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    if (!e.dataTransfer?.types.includes('Files')) return
    const item = e.dataTransfer.items?.[0]
    if (item?.kind !== 'file') return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    const related = e.relatedTarget as Node | null
    if (e.currentTarget.contains(related)) return
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (!file || !isAcceptableFile(file)) return
    onDrop(fileToPlaneMedia(file))
  }

  const handleClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'video/*,image/*'
    input.onchange = () => {
      const file = input.files?.[0]
      if (file && isAcceptableFile(file)) onDrop(fileToPlaneMedia(file))
    }
    input.click()
  }

  if (compact) {
    return (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`rounded-lg border border-dashed p-3 text-center cursor-pointer transition-colors ${isDragOver
          ? 'border-white/30 bg-white/15 text-white/90'
          : 'border-white/20 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/60'
          }`}
      >
        <span className="text-xs">Drop here to add another layer</span>
      </div>
    )
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      className={`rounded-lg border border-dashed p-6 text-center cursor-pointer transition-colors ${isDragOver
        ? 'border-white/30 bg-white/15 text-white/90'
        : 'border-white/20 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/60'
        }`}
    >
      <span className="text-3xl opacity-60 block mb-2">▢</span>
      <p className="text-sm font-medium text-white/80 mb-1">Drag and drop to load your video or image</p>
      <p className="text-xs text-white/50">or click to choose a file</p>
    </div>
  )
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  format = (v: number) => String(v),
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  format?: (v: number) => string
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-white/50 uppercase tracking-wider">{label}</span>
        <span className="text-[10px] text-white/40 tabular-nums">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
    </div>
  )
}

export function PanesPanel() {
  const project = useStore((s) => s.project)
  const currentSceneIndex = useStore((s) => s.currentSceneIndex)
  const addPane = useStore((s) => s.addPane)
  const addPaneWithMedia = useStore((s) => s.addPaneWithMedia)
  const addSceneText = useStore((s) => s.addSceneText)
  const removePane = useStore((s) => s.removePane)
  const updatePane = useStore((s) => s.updatePane)
  const reorderPanes = useStore((s) => s.reorderPanes)
  const updateScene = useStore((s) => s.updateScene)
  const setPaneTrim = useStore((s) => s.setPaneTrim)
  const setTrimEditorOpen = useStore((s) => s.setTrimEditorOpen)
  const panes = project.panes ?? []
  const scene = project.scenes[currentSceneIndex]
  const texts: SceneText[] = scene?.texts ?? []
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    if (!menuOpen) return
    const onOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [menuOpen])

  const handleAddPane = () => {
    setMenuOpen(false)
    addPane()
  }

  const handleAddText = () => {
    setMenuOpen(false)
    addSceneText(currentSceneIndex)
  }

  const removeText = (id: string) => {
    if (!scene) return
    updateScene(currentSceneIndex, {
      texts: (scene.texts ?? []).filter((t) => t.id !== id),
    })
  }

  const handlePaneFile = (paneId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    const type = getMediaTypeFromFile(file)
    const media: PlaneMedia = type === 'video' ? { type: 'video', url } : { type: 'image', url }
    updatePane(paneId, { media })
    e.target.value = ''
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className={sectionHeadingClass}>
          Layers
        </h2>
        <div className="relative flex items-center gap-1" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="w-6 h-6 rounded flex items-center justify-center text-white/70 hover:bg-white/15 hover:text-white transition-colors"
            title="Add layer"
            aria-label="Add layer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute top-full right-0 mt-1 py-1 min-w-[100px] rounded-lg border border-white/15 bg-zinc-800 shadow-xl z-10">
              <button
                type="button"
                onClick={handleAddPane}
                className="w-full px-3 py-1.5 text-left text-xs text-white/90 hover:bg-white/10"
              >
                Pane
              </button>
              <button
                type="button"
                onClick={handleAddText}
                className="w-full px-3 py-1.5 text-left text-xs text-white/90 hover:bg-white/10"
              >
                Text
              </button>
            </div>
          )}
        </div>
      </div>
      <p className="text-xs text-white/50 mb-2">
        Multiple video/image layers. Z-order: lower index = behind. Enable animation to animate over the scene.
      </p>
      {panes.length === 0 && texts.length === 0 ? (
        <>
          <EmptyPaneDropZone onDrop={addPaneWithMedia} />
          <div className="mt-3">
            <span className={smallLabelClass}>Example clips</span>
            <div className="grid grid-cols-3 gap-1 mt-1">
              {EXAMPLE_CLIP_PATHS.map((path) => (
                <button
                  key={path}
                  type="button"
                  onClick={() => addPaneWithMedia({ type: 'video', url: path })}
                  className="w-14 rounded border border-white/10 overflow-hidden bg-black/30 flex shrink-0 focus:outline-none focus:ring-1 focus:ring-white/30 hover:border-white/20"
                >
                  <VideoThumbnail url={path} time={0} className="border-0 w-full h-full !aspect-video" />
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          {panes.map((pane, index) => (
            <PaneItem
              key={pane.id}
              pane={pane}
              index={index}
              scene={scene}
              onUpdate={(patch) => updatePane(pane.id, patch)}
              onRemove={() => removePane(pane.id)}
              onMoveUp={index > 0 ? () => reorderPanes(index, index - 1) : undefined}
              onMoveDown={index < panes.length - 1 ? () => reorderPanes(index, index + 1) : undefined}
              onSelectFile={() => fileInputRefs.current[pane.id]?.click()}
              fileInputRef={(el) => { fileInputRefs.current[pane.id] = el }}
              onFileChange={(e) => handlePaneFile(pane.id, e)}
              setPaneTrim={setPaneTrim}
              setTrimEditorOpen={setTrimEditorOpen}
              currentSceneIndex={currentSceneIndex}
            />
          ))}
          {texts.map((text, index) => (
            <TextLayerItem
              key={text.id}
              text={text}
              index={panes.length + index}
              onRemove={() => removeText(text.id)}
            />
          ))}
          <EmptyPaneDropZone compact onDrop={addPaneWithMedia} />
          <div className="mt-2">
            <span className={smallLabelClass}>Example clips</span>
            <div className="grid grid-cols-3 gap-1 mt-1">
              {EXAMPLE_CLIP_PATHS.map((path) => (
                <button
                  key={path}
                  type="button"
                  onClick={() => addPaneWithMedia({ type: 'video', url: path })}
                  className="w-14 rounded border border-white/10 overflow-hidden bg-black/30 flex shrink-0 focus:outline-none focus:ring-1 focus:ring-white/30 hover:border-white/20"
                >
                  <VideoThumbnail url={path} time={0} className="border-0 w-full h-full !aspect-video" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function TextLayerItem({
  text,
  index,
  onRemove,
}: {
  text: SceneText
  index: number
  onRemove: () => void
}) {
  const preview = (text.content || 'Text').trim().slice(0, 24)
  const modeLabel = text.mode === '3d' ? '3D' : 'Static'
  return (
    <div className="rounded-lg bg-white/5 border border-white/10 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-white/70">
          Text {index + 1}
          <span className="ml-1.5 text-white/50 font-normal">({modeLabel})</span>
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="p-1 rounded text-white/50 hover:text-red-400 hover:bg-white/10"
          title="Remove text"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="text-xs text-white/60 truncate mt-1" title={text.content || 'Text'}>
        {preview || 'Text'}
      </p>
    </div>
  )
}

function PaneItem({
  pane,
  index,
  scene,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  onSelectFile,
  fileInputRef,
  onFileChange,
  setPaneTrim,
  setTrimEditorOpen,
  currentSceneIndex,
}: {
  pane: Pane
  index: number
  scene: Scene
  onUpdate: (patch: Partial<Pane>) => void
  onRemove: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  onSelectFile: () => void
  fileInputRef: (el: HTMLInputElement | null) => void
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  setPaneTrim: (sceneIndex: number, paneId: string, trim: { start: number; end: number } | null, endClaimed?: boolean) => void
  setTrimEditorOpen: (v: 'background' | 'plane' | { type: 'pane'; paneId: string } | null) => void
  currentSceneIndex: number
}) {
  const anim = pane.animation
  const paneTrim = scene.paneTrims?.[pane.id] ?? null
  const isVideo = pane.media?.type === 'video'

  return (
    <div className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-white/70">Pane {index + 1}</span>
        <div className="flex items-center gap-0.5">
          {onMoveUp && (
            <button type="button" onClick={onMoveUp} className="p-1 rounded text-white/50 hover:bg-white/10" title="Move back"><ChevronUp className="w-4 h-4" /></button>
          )}
          {onMoveDown && (
            <button type="button" onClick={onMoveDown} className="p-1 rounded text-white/50 hover:bg-white/10" title="Move forward"><ChevronDown className="w-4 h-4" /></button>
          )}
          <button type="button" onClick={onRemove} className="p-1 rounded text-white/50 hover:text-red-400 hover:bg-white/10"><X className="w-4 h-4" /></button>
        </div>
      </div>
      <div>
        <span className="text-[10px] text-white/50 uppercase tracking-wider">Z-order</span>
        <span className="ml-2 text-xs text-white/60">{pane.zIndex}</span>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,image/*"
        onChange={onFileChange}
        className="hidden"
      />
      <div>
        <span className={smallLabelClass}>Media</span>
        <button
          type="button"
          onClick={onSelectFile}
          className="w-full rounded px-2 py-1.5 bg-white/10 border border-white/20 text-white text-xs hover:bg-white/15"
        >
          {pane.media?.url ? `${pane.media.type} (change)` : 'Select video or image'}
        </button>
      </div>
      {isVideo && (
        <div className="pl-2 border-l-2 border-white/10 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-white/50 uppercase tracking-wider">Trim</span>
            <button
              type="button"
              onClick={() => setTrimEditorOpen({ type: 'pane', paneId: pane.id })}
              className="text-xs px-2 py-1 rounded bg-white/10 text-white/80 hover:bg-white/20 shrink-0"
            >
              Edit
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1">
            <label className="text-[10px]">
              Start
              <input
                type="number"
                min={0}
                step={0.1}
                value={paneTrim?.start ?? ''}
                placeholder="0"
                onChange={(e) => {
                  const v = e.target.value === '' ? null : parseFloat(e.target.value)
                  if (v === null) {
                    setPaneTrim(currentSceneIndex, pane.id, null)
                    return
                  }
                  const prev = paneTrim
                  const end = prev?.end ?? v
                  setPaneTrim(currentSceneIndex, pane.id, { start: v, end: Math.max(v, end) })
                }}
                className="block w-full mt-0.5 px-1.5 py-1 rounded bg-black/30 border border-white/10 text-white text-xs"
              />
            </label>
            <label className="text-[10px]">
              End
              <input
                type="number"
                min={0}
                step={0.1}
                value={paneTrim?.end ?? ''}
                placeholder="full"
                onChange={(e) => {
                  const v = e.target.value === '' ? null : parseFloat(e.target.value)
                  if (v === null && !paneTrim?.start) {
                    setPaneTrim(currentSceneIndex, pane.id, null)
                    return
                  }
                  const start = paneTrim?.start ?? 0
                  if (v === null) setPaneTrim(currentSceneIndex, pane.id, null)
                  else setPaneTrim(currentSceneIndex, pane.id, { start, end: Math.max(start, v) }, true)
                }}
                className="block w-full mt-0.5 px-1.5 py-1 rounded bg-black/30 border border-white/10 text-white text-xs"
              />
            </label>
          </div>
        </div>
      )}
      <SliderRow
        label="Position Z"
        value={pane.position[2]}
        min={-2}
        max={4}
        step={0.05}
        format={(v) => v.toFixed(2)}
        onChange={(v) => onUpdate({ position: [pane.position[0], pane.position[1], v] })}
      />
      <div className="grid grid-cols-3 gap-1">
        <div>
          <span className="text-[10px] text-white/50 uppercase tracking-wider block mb-0.5">X</span>
          <input
            type="number"
            step={0.1}
            value={pane.position[0]}
            onChange={(e) => onUpdate({ position: [clamp(parseNum(e.target.value, 0), -2, 4), pane.position[1], pane.position[2]] })}
            className="w-full rounded px-1.5 py-1 bg-white/10 border border-white/20 text-white text-xs"
          />
        </div>
        <div>
          <span className="text-[10px] text-white/50 block mb-0.5">Y</span>
          <input
            type="number"
            step={0.1}
            value={pane.position[1]}
            onChange={(e) => onUpdate({ position: [pane.position[0], clamp(parseNum(e.target.value, 0), -2, 4), pane.position[2]] })}
            className="w-full rounded px-1.5 py-1 bg-white/10 border border-white/20 text-white text-xs"
          />
        </div>
        <div>
          <span className="text-[10px] text-white/50 block mb-0.5">Z</span>
          <input
            type="number"
            step={0.1}
            value={pane.position[2]}
            onChange={(e) => onUpdate({ position: [pane.position[0], pane.position[1], clamp(parseNum(e.target.value, 0), -2, 4)] })}
            className="w-full rounded px-1.5 py-1 bg-white/10 border border-white/20 text-white text-xs"
          />
        </div>
      </div>
      <SliderRow
        label="Scale"
        value={pane.scale}
        min={0.2}
        max={5}
        step={0.05}
        format={(v) => v.toFixed(2)}
        onChange={(v) => onUpdate({ scale: v })}
      />
      <SliderRow
        label="Extrusion"
        value={pane.extrusionDepth}
        min={0}
        max={0.5}
        step={0.01}
        format={(v) => v.toFixed(2)}
        onChange={(v) => onUpdate({ extrusionDepth: v })}
      />
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(anim)}
            onChange={(e) => {
              if (e.target.checked) {
                onUpdate({
                  animation: {
                    positionStart: [...pane.position],
                    positionEnd: [...pane.position],
                    scaleStart: pane.scale,
                    scaleEnd: pane.scale,
                    rotationStart: [...pane.rotation],
                    rotationEnd: [...pane.rotation],
                  },
                })
              } else {
                onUpdate({ animation: null })
              }
            }}
            className="rounded border-white/20"
          />
          <span className="text-xs text-white/70">Animate over scene</span>
        </label>
      </div>
      {anim && (
        <div className="pl-2 border-l-2 border-white/10 space-y-2">
          <span className="text-[10px] text-white/50 uppercase tracking-wider">Animation end</span>
          <SliderRow
            label="Pos Z end"
            value={anim.positionEnd[2]}
            min={-2}
            max={4}
            step={0.05}
            format={(v) => v.toFixed(2)}
            onChange={(v) =>
              onUpdate({
                animation: { ...anim, positionEnd: [anim.positionEnd[0], anim.positionEnd[1], v] },
              })
            }
          />
          <SliderRow
            label="Scale end"
            value={anim.scaleEnd}
            min={0.2}
            max={5}
            step={0.05}
            format={(v) => v.toFixed(2)}
            onChange={(v) =>
              onUpdate({ animation: { ...anim, scaleEnd: v } })
            }
          />
        </div>
      )}
    </div>
  )
}
