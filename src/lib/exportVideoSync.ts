/**
 * Frame-by-frame export: wait for all video elements to finish seeking before capture.
 * MediaRecorder timestamps frames by delivery time; video.currentTime seek is async.
 * Without this, the pane/plane/background video texture lags behind the camera.
 *
 * A generation counter prevents late-firing 'seeked' events from a previous frame
 * from resolving the current frame's promise (stale notification bug).
 * Each call to waitForVideoSeeked() bumps the generation. Callers must pass the
 * generation they captured when adding the 'seeked' listener; stale generations
 * are silently discarded by notifyVideoSeeked().
 */
let resolveCurrent: (() => void) | null = null
let expectedCount = 0
let receivedCount = 0
let activeGeneration = 0

const SEEK_TIMEOUT_MS = 100

export function waitForVideoSeeked(videoCount: number): { promise: Promise<void>; generation: number } {
  if (videoCount === 0) return { promise: Promise.resolve(), generation: activeGeneration }
  activeGeneration++
  const myGeneration = activeGeneration
  const promise = new Promise<void>((resolve) => {
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolveCurrent = null
      resolve()
    }
    resolveCurrent = finish
    expectedCount = videoCount
    receivedCount = 0
    const timer = setTimeout(finish, SEEK_TIMEOUT_MS)
  })
  return { promise, generation: myGeneration }
}

export function getCurrentGeneration(): number {
  return activeGeneration
}

export function notifyVideoSeeked(generation: number): void {
  if (generation !== activeGeneration || !resolveCurrent) return
  receivedCount++
  if (receivedCount >= expectedCount) {
    resolveCurrent()
    resolveCurrent = null
  }
}
