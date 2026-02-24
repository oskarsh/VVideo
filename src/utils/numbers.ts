/**
 * Parse a string to number; return default if NaN or empty.
 */
export function parseNum(value: string | number, fallback: number = 0): number {
  if (typeof value === 'number') return value
  const n = parseFloat(value)
  return Number.isNaN(n) ? fallback : n
}

/**
 * Clamp value between min and max (inclusive).
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
