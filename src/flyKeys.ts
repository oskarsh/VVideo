/**
 * Key state for fly controls when in fly-around mode.
 * WASD = move (forward, left, back, right). Q/E = up/down. IJKL = rotate (vim: I up, K down, J left, L right).
 */
const keys = {
  w: false, a: false, s: false, d: false,
  q: false, e: false,
  i: false, j: false, k: false, l: false,
}
const KEY_MAP: Record<string, keyof typeof keys> = {
  KeyW: 'w', KeyA: 'a', KeyS: 's', KeyD: 'd', KeyQ: 'q', KeyE: 'e',
  KeyI: 'i', KeyJ: 'j', KeyK: 'k', KeyL: 'l',
  w: 'w', a: 'a', s: 's', d: 'd', q: 'q', e: 'e',
  i: 'i', j: 'j', k: 'k', l: 'l',
}

export function getFlyKeys(): Readonly<typeof keys> {
  return keys
}

export function setFlyKey(code: string, down: boolean): void {
  const k = KEY_MAP[code]
  if (k) keys[k] = down
}

export function isFlyKey(code: string): boolean {
  return code in KEY_MAP
}
