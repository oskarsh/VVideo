import { useState, useCallback, useMemo } from 'react'
import { usePreviewBounds, useContentBounds, getFloatingPanelPositions } from '@/context/LayoutContext'

export interface UseFloatingPanelsOptions {
  panelWidth?: number
  panelHeight?: number
}

/**
 * Shared state and layout for floating effect panels (EffectsPanel + RightSidebar).
 * Pass the full ordered list of panel keys (e.g. all effect keys for current scene);
 * hook returns openPanels, positionByKey for open panels in that order, plus toggle/close/position.
 */
export function useFloatingPanels(
  allPanelKeys: string[],
  options?: UseFloatingPanelsOptions
) {
  const [openPanels, setOpenPanels] = useState<Set<string>>(new Set())
  const [panelPositions, setPanelPositions] = useState<Record<string, { x: number; y: number }>>({})

  const setPanelPosition = useCallback((key: string, x: number, y: number) => {
    setPanelPositions((prev) => ({ ...prev, [key]: { x, y } }))
  }, [])

  const togglePanel = useCallback((key: string) => {
    setOpenPanels((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const closePanel = useCallback((key: string) => {
    setOpenPanels((prev) => {
      const next = new Set(prev)
      next.delete(key)
      return next
    })
  }, [])

  const previewBounds = usePreviewBounds()
  const contentBounds = useContentBounds()
  const panelWidth = options?.panelWidth
  const panelHeight = options?.panelHeight

  const openOrder = useMemo(
    () => allPanelKeys.filter((k) => openPanels.has(k)),
    [allPanelKeys, openPanels]
  )

  const positions = useMemo(
    () =>
      getFloatingPanelPositions(openOrder.length, previewBounds, contentBounds, {
        panelWidth,
        panelHeight,
      }),
    [openOrder.length, previewBounds, contentBounds, panelWidth, panelHeight]
  )

  const positionByKey = useMemo(() => {
    const map: Record<string, { x: number; y: number }> = {}
    openOrder.forEach((key, i) => {
      map[key] = positions[i]
    })
    return map
  }, [openOrder, positions])

  return {
    openPanels,
    panelPositions,
    togglePanel,
    closePanel,
    setPanelPosition,
    positionByKey,
  }
}
