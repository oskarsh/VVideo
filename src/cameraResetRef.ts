/** Module-level camera-reset callback, set from inside the R3F canvas context. */
let _resetFn: (() => void) | null = null

export function registerCameraReset(fn: () => void): void {
  _resetFn = fn
}

export function triggerCameraReset(): void {
  _resetFn?.()
}
