import { useEffect, useState } from 'react'
import {
  getPerfMetrics,
  startPerformanceMonitor,
  exportPerfReport,
} from '@/utils/performanceMonitor'

/**
 * On-screen FPS / frame-drop overlay with export. Visible when ?perf=1 is in the URL.
 */
export function PerformanceOverlay() {
  const [metrics, setMetrics] = useState(getPerfMetrics())

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('perf') !== '1') return

    const stop = startPerformanceMonitor()
    const interval = setInterval(() => {
      setMetrics(getPerfMetrics())
    }, 250)
    return () => {
      stop()
      clearInterval(interval)
    }
  }, [])

  const params = new URLSearchParams(window.location.search)
  if (params.get('perf') !== '1') return null

  const fpsColor = metrics.fps >= 55 ? 'text-emerald-400' : metrics.fps >= 30 ? 'text-amber-400' : 'text-red-400'
  const dropColor = metrics.droppedFramesTotal > 0 ? 'text-amber-400' : 'text-white/60'
  const components = Object.entries(metrics.components).sort(
    ([, a], [, b]) => (b.avgMsRolling ?? b.avgMs) - (a.avgMsRolling ?? a.avgMs)
  )

  return (
    <div
      className="fixed top-12 right-4 z-[100] font-mono text-xs bg-black/70 rounded border border-white/20 px-3 py-2 space-y-1 pointer-events-auto"
      aria-live="polite"
      aria-label="Performance metrics"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-white/50 uppercase tracking-wider">Perf (?perf=1)</span>
        <button
          type="button"
          onClick={exportPerfReport}
          className="text-[10px] px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white/80"
        >
          Export
        </button>
      </div>
      <div className={fpsColor}>
        FPS: <span className="tabular-nums font-semibold">{metrics.fps}</span>
      </div>
      <div className="text-white/60">
        Frame: <span className="tabular-nums">{metrics.frameTimeMs.toFixed(1)}ms</span>
      </div>
      <div className={dropColor}>
        Drops: <span className="tabular-nums">{metrics.droppedFramesTotal}</span>
      </div>
      {metrics.longTasksTotal > 0 && (
        <div className="text-amber-400">
          Long tasks: <span className="tabular-nums">{metrics.longTasksTotal}</span>
        </div>
      )}
      {components.length > 0 && (
        <div className="pt-1.5 mt-1.5 border-t border-white/10">
          <div className="text-[10px] text-white/50 uppercase tracking-wider mb-1" title="Rolling avg over last 100 renders">
            Components (avg ms)
          </div>
          {components.slice(0, 6).map(([id, c]) => (
            <div key={id} className="text-white/70 flex justify-between gap-3">
              <span className="truncate">{id}</span>
              <span className="tabular-nums shrink-0">
                {(c.avgMsRolling ?? c.avgMs).toFixed(2)}ms (×{c.renderCount})
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
