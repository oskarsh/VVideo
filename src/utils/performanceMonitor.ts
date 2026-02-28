/**
 * Performance monitoring for development: FPS, frame drops, long tasks, component render times.
 * Enable with ?perf=1 in the URL.
 */

const TARGET_FRAME_MS = 1000 / 60 // ~16.67ms for 60fps
const FRAME_DROP_THRESHOLD_MS = TARGET_FRAME_MS * 1.5 // ~25ms
const LONG_TASK_MS = 50 // Tasks blocking main thread > 50ms
const SAMPLE_WINDOW_SIZE = 60 // Rolling FPS over last N frames
const LOG_THROTTLE_MS = 2000 // Min interval between frame-drop logs

export interface ComponentPerf {
  renderCount: number
  totalMs: number
  lastMs: number
  maxMs: number
  /** Cumulative average (lifetime). */
  avgMs: number
  /** Rolling average over last N renders — reflects recent performance. */
  avgMsRolling: number
}

export interface PerfMetrics {
  fps: number
  frameTimeMs: number
  droppedFrames: number
  droppedFramesTotal: number
  longTasks: number
  longTasksTotal: number
  components: Record<string, ComponentPerf>
}

let metrics: PerfMetrics = {
  fps: 60,
  frameTimeMs: 0,
  droppedFrames: 0,
  droppedFramesTotal: 0,
  longTasks: 0,
  longTasksTotal: 0,
  components: {},
}

let frameTimes: number[] = []
let lastFrameTime = 0
let rafId = 0
let longTaskObserver: PerformanceObserver | null = null
let lastLogTime = 0
let enabled = false
let autoLogIntervalId = 0

/** Session log: frame drops and long tasks with timestamps (for export). */
const sessionLog: Array<{ t: number; type: 'frame_drop' | 'long_task'; ms: number }> = []
const SESSION_LOG_MAX = 500
const AUTO_LOG_INTERVAL_MS = 60_000
const COMPONENT_ROLLING_SAMPLES = 100 // Rolling avg over last N renders

function tick(now: number) {
  if (!enabled) return

  const dt = lastFrameTime ? now - lastFrameTime : 0
  lastFrameTime = now

  if (dt > 0) {
    frameTimes.push(dt)
    if (frameTimes.length > SAMPLE_WINDOW_SIZE) frameTimes.shift()

    const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
    metrics.frameTimeMs = avgFrameTime
    metrics.fps = avgFrameTime > 0 ? Math.round(1000 / avgFrameTime) : 60

    if (dt > FRAME_DROP_THRESHOLD_MS) {
      metrics.droppedFrames++
      metrics.droppedFramesTotal++
      sessionLog.push({ t: now, type: 'frame_drop', ms: dt })
      if (sessionLog.length > SESSION_LOG_MAX) sessionLog.shift()

      // Throttled logging
      if (now - lastLogTime > LOG_THROTTLE_MS) {
        lastLogTime = now
        const dropsInWindow = frameTimes.filter((t) => t > FRAME_DROP_THRESHOLD_MS).length
        console.warn(
          `[Perf] Frame drop: ${dt.toFixed(1)}ms (target ~16.7ms). ` +
            `Dropped ${dropsInWindow}/${frameTimes.length} frames in last ${SAMPLE_WINDOW_SIZE}. ` +
            `Current FPS: ${metrics.fps}`
        )
      }
    }
  }

  rafId = requestAnimationFrame(tick)
}

export function startPerformanceMonitor(): () => void {
  if (enabled) return () => {}

  enabled = true
  frameTimes = []
  lastFrameTime = 0
  lastLogTime = 0
  sessionLog.length = 0
  Object.keys(componentRollingSamples).forEach((k) => delete componentRollingSamples[k])
  metrics = {
    fps: 60,
    frameTimeMs: 0,
    droppedFrames: 0,
    droppedFramesTotal: 0,
    longTasks: 0,
    longTasksTotal: 0,
    components: {},
  }

  rafId = requestAnimationFrame(tick)

  // Long Task API (Chrome)
  if (typeof PerformanceObserver !== 'undefined') {
    try {
      longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          metrics.longTasks++
          metrics.longTasksTotal++
          const dur = entry.duration
          sessionLog.push({ t: entry.startTime, type: 'long_task', ms: dur })
          if (sessionLog.length > SESSION_LOG_MAX) sessionLog.shift()
          if (dur > LONG_TASK_MS && performance.now() - lastLogTime > LOG_THROTTLE_MS) {
            lastLogTime = performance.now()
            console.warn(
              `[Perf] Long task: ${dur.toFixed(1)}ms (blocks main thread > ${LONG_TASK_MS}ms)`
            )
          }
        }
      })
      longTaskObserver.observe({ type: 'longtask', buffered: true })
    } catch {
      // longtask may not be supported
    }
  }

  autoLogIntervalId = window.setInterval(() => {
    const m = getPerfMetrics()
    const comps = Object.entries(m.components)
      .map(([k, v]) => `${k}: ${(v.avgMsRolling ?? v.avgMs).toFixed(2)}ms`)
      .join(', ')
    console.info(
      `[Perf] ${m.fps} fps, ${m.frameTimeMs.toFixed(1)}ms/frame, ` +
        `drops: ${m.droppedFramesTotal}, long: ${m.longTasksTotal}` +
        (comps ? ` | ${comps}` : '')
    )
  }, AUTO_LOG_INTERVAL_MS)

  console.info('[Perf] Monitor started. Export via overlay button. Auto-log every 60s.')

  return () => {
    enabled = false
    if (rafId) cancelAnimationFrame(rafId)
    if (autoLogIntervalId) clearInterval(autoLogIntervalId)
    longTaskObserver?.disconnect()
    longTaskObserver = null
  }
}

export function getPerfMetrics(): PerfMetrics {
  return {
    ...metrics,
    components: { ...metrics.components },
  }
}

const componentRollingSamples: Record<string, number[]> = {}

export function recordComponentRender(id: string, actualDurationMs: number): void {
  if (!enabled || actualDurationMs <= 0) return
  const c = metrics.components[id] ?? {
    renderCount: 0,
    totalMs: 0,
    lastMs: 0,
    maxMs: 0,
    avgMs: 0,
    avgMsRolling: 0,
  }
  c.renderCount++
  c.totalMs += actualDurationMs
  c.lastMs = actualDurationMs
  c.maxMs = Math.max(c.maxMs, actualDurationMs)
  c.avgMs = c.totalMs / c.renderCount

  // Rolling average over last N renders — stays stable, reflects recent perf
  const samples = (componentRollingSamples[id] ??= [])
  samples.push(actualDurationMs)
  if (samples.length > COMPONENT_ROLLING_SAMPLES) samples.shift()
  c.avgMsRolling =
    samples.length > 0
      ? samples.reduce((a, b) => a + b, 0) / samples.length
      : actualDurationMs

  metrics.components[id] = c
}

export function isPerformanceMonitorEnabled(): boolean {
  return enabled
}

export interface PerfExportData {
  exportedAt: string
  duration: string
  metrics: PerfMetrics
  sessionLog: Array<{ t: number; type: 'frame_drop' | 'long_task'; ms: number }>
  url: string
}

/** Get snapshot for export (does not trigger download). */
export function getPerfExportData(): PerfExportData {
  return {
    exportedAt: new Date().toISOString(),
    duration: 'Session snapshot',
    metrics: getPerfMetrics(),
    sessionLog: [...sessionLog],
    url: window.location.href,
  }
}

/** Download performance report as JSON file. */
export function exportPerfReport(): void {
  const data = getPerfExportData()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `vvideo-perf-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`
  a.click()
  URL.revokeObjectURL(a.href)
}
