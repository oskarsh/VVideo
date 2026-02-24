import { createContext, useContext, useState, useCallback, useRef } from 'react'

export interface PreviewBounds {
  left: number
  top: number
  width: number
  height: number
  right: number
  bottom: number
}

const LayoutContext = createContext<{
  previewBounds: PreviewBounds | null
  contentBounds: PreviewBounds | null
  setPreviewRef: (el: HTMLElement | null) => void
  setContentRef: (el: HTMLElement | null) => void
}>({
  previewBounds: null,
  contentBounds: null,
  setPreviewRef: () => { },
  setContentRef: () => { },
})

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [previewBounds, setPreviewBounds] = useState<PreviewBounds | null>(null)
  const [contentBounds, setContentBoundsState] = useState<PreviewBounds | null>(null)
  const rafRef = useRef<number>(0)
  const observerRef = useRef<ResizeObserver | null>(null)
  const contentObserverRef = useRef<ResizeObserver | null>(null)

  const setPreviewRef = useCallback((el: HTMLElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }
    cancelAnimationFrame(rafRef.current)
    if (!el) {
      setPreviewBounds(null)
      return
    }
    const update = () => {
      const rect = el.getBoundingClientRect()
      setPreviewBounds({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        right: rect.right,
        bottom: rect.bottom,
      })
    }
    update()
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(update)
    })
    observer.observe(el)
    observerRef.current = observer
  }, [])

  const setContentRef = useCallback((el: HTMLElement | null) => {
    if (contentObserverRef.current) {
      contentObserverRef.current.disconnect()
      contentObserverRef.current = null
    }
    if (!el) {
      setContentBoundsState(null)
      return
    }
    const update = () => {
      const rect = el.getBoundingClientRect()
      setContentBoundsState({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        right: rect.right,
        bottom: rect.bottom,
      })
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    contentObserverRef.current = observer
  }, [])

  return (
    <LayoutContext.Provider value={{ previewBounds, contentBounds, setPreviewRef, setContentRef }}>
      {children}
    </LayoutContext.Provider>
  )
}

export function useLayout() {
  return useContext(LayoutContext)
}

export function usePreviewBounds() {
  const { previewBounds } = useLayout()
  return previewBounds
}

export function useContentBounds() {
  const { contentBounds } = useLayout()
  return contentBounds
}

const PANEL_MARGIN = 16
const PANEL_VERTICAL_GAP = 24
const DEFAULT_PANEL_WIDTH = 280
const DEFAULT_PANEL_HEIGHT = 400

/** Cascade offset: each panel is this many px right and down from the previous (top-left of content). */
const CASCADE_OFFSET_X = 24

/** Safe left margin when content bounds unknown (avoid overlapping left sidebar). */
const FALLBACK_CONTENT_LEFT = 300

/**
 * Compute positions for N floating panels: spawn in the top-left of the main content area,
 * with each panel offset slightly (cascade down and right) so they don't stack exactly on top of each other.
 */
export function getFloatingPanelPositions(
  count: number,
  _preview: PreviewBounds | null,
  content: PreviewBounds | null,
  options: { panelWidth?: number; panelHeight?: number } = {}
): { x: number; y: number }[] {
  const width = options.panelWidth ?? DEFAULT_PANEL_WIDTH
  const height = options.panelHeight ?? DEFAULT_PANEL_HEIGHT

  const contentLeft = content ? content.left : FALLBACK_CONTENT_LEFT
  const contentRight =
    content && typeof window !== 'undefined'
      ? Math.min(content.right, window.innerWidth)
      : typeof window !== 'undefined'
        ? window.innerWidth - PANEL_MARGIN
        : 1200 - PANEL_MARGIN
  const contentTop = content ? content.top : 60
  const contentBottom =
    content && typeof window !== 'undefined'
      ? content.bottom
      : typeof window !== 'undefined'
        ? window.innerHeight - PANEL_MARGIN
        : 600

  const minX = contentLeft + PANEL_MARGIN
  const maxX = contentRight - width - PANEL_MARGIN
  const minY = contentTop + PANEL_MARGIN
  const maxY = contentBottom - height - PANEL_MARGIN

  if (count === 0) return []

  // Base position: top-left of main content area
  const baseX = minX
  const baseY = minY

  return Array.from({ length: count }, (_, i) => ({
    x: Math.min(baseX + i * CASCADE_OFFSET_X, maxX),
    y: Math.min(baseY + i * PANEL_VERTICAL_GAP, maxY),
  }))
}
