import { Profiler, type ProfilerOnRenderCallback } from 'react'
import { recordComponentRender } from '@/utils/performanceMonitor'

/**
 * Wraps children in React.Profiler and reports render times to the performance monitor.
 * Only useful when ?perf=1 is enabled.
 */
export function ProfiledSection({
  id,
  children,
}: {
  id: string
  children: React.ReactNode
}) {
  const onRender: ProfilerOnRenderCallback = (
    _id,
    _phase,
    actualDuration,
    _baseDuration,
    _startTime,
    _commitTime
  ) => {
    recordComponentRender(id, actualDuration)
  }

  return (
    <Profiler id={id} onRender={onRender}>
      {children}
    </Profiler>
  )
}
