import { useEffect } from 'react'

/**
 * Shared modal shell: overlay, Escape to close, click backdrop to close.
 * Use for Welcome, About, Changelog, Export, TrimEditor, etc.
 */
export function Modal({
  open,
  onClose,
  children,
  className = '',
  contentClassName = 'bg-zinc-900 border border-white/15 rounded-xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col',
  zIndex = 'z-[100]',
}: {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
  contentClassName?: string
  zIndex?: string
}) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className={`fixed inset-0 ${zIndex} flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm ${className}`}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={contentClassName}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
