import { useRef, useState, useCallback, useEffect } from 'react'

interface DraggableEffectWindowProps {
  id: string
  title: string
  children: React.ReactNode
  onClose: () => void
  defaultX?: number
  defaultY?: number
  /** Width in px. Default 280. Use larger for panels with keyframes or lots of controls. */
  width?: number
  /** Called when the user finishes dragging, so the parent can remember the position. */
  onPositionChange?: (x: number, y: number) => void
}

export function DraggableEffectWindow({
  id,
  title,
  children,
  onClose,
  defaultX = 320,
  defaultY = 80,
  width = 280,
  onPositionChange,
}: DraggableEffectWindowProps) {
  const [pos, setPos] = useState({ x: defaultX, y: defaultY })
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, left: 0, top: 0 })

  const handleTitleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('button')) return
      e.preventDefault()
      setIsDragging(true)
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        left: pos.x,
        top: pos.y,
      }
    },
    [pos]
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return
      setPos({
        x: dragStart.current.left + (e.clientX - dragStart.current.x),
        y: dragStart.current.top + (e.clientY - dragStart.current.y),
      })
    },
    [isDragging]
  )

  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return
      const finalX = dragStart.current.left + (e.clientX - dragStart.current.x)
      const finalY = dragStart.current.top + (e.clientY - dragStart.current.y)
      setPos({ x: finalX, y: finalY })
      onPositionChange?.(finalX, finalY)
      setIsDragging(false)
    },
    [isDragging, onPositionChange]
  )

  useEffect(() => {
    if (!isDragging) return
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  return (
    <div
      id={id}
      className="fixed z-[100] rounded-lg border border-white/20 bg-zinc-900/95 shadow-xl backdrop-blur"
      style={{ left: pos.x, top: pos.y, width }}
    >
      <div
        role="button"
        tabIndex={0}
        onMouseDown={handleTitleMouseDown}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') e.preventDefault()
        }}
        className="flex cursor-grab items-center justify-between border-b border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-white/80 active:cursor-grabbing"
      >
        <span className="select-none">{title}</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          className="rounded p-1 text-white/50 hover:bg-white/10 hover:text-white/90"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
      <div className="max-h-[70vh] overflow-y-auto p-2">{children}</div>
    </div>
  )
}
