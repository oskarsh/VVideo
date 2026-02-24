import type { BackgroundTexture } from '@/types'

const SIZE = 512

/** 2D value noise. Use wrap=true for tileable (periodic) output. */
function valueNoise2D(
  x: number,
  y: number,
  scale: number,
  seed: number,
  wrap = false
): number {
  const period = wrap ? Math.max(1, Math.floor(scale)) : 1e9
  const ix = Math.floor(x * scale)
  const iy = Math.floor(y * scale)
  const tx = x * scale - ix
  const ty = y * scale - iy
  const ixW = ((ix % period) + period) % period
  const iyW = ((iy % period) + period) % period
  const tx2 = tx * tx * (3 - 2 * tx)
  const ty2 = ty * ty * (3 - 2 * ty)
  const hash = (i: number, j: number) => {
    const ii = wrap ? ((i % period) + period) % period : i
    const jj = wrap ? ((j % period) + period) % period : j
    const h = (seed * 9301 + (ii * 73856093) ^ (jj * 19349663)) >>> 0
    return (h % 233280) / 233280
  }
  const v00 = hash(ixW, iyW)
  const v10 = hash(ixW + 1, iyW)
  const v01 = hash(ixW, iyW + 1)
  const v11 = hash(ixW + 1, iyW + 1)
  const top = v00 + tx2 * (v10 - v00)
  const bot = v01 + tx2 * (v11 - v01)
  return top + ty2 * (bot - top)
}

function parseHexColor(hex: string): [number, number, number] {
  const m = hex.replace(/^#/, '').match(/.{2}/g)
  if (!m) return [0.1, 0.1, 0.1]
  return [parseInt(m[0], 16) / 255, parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255]
}

function lerpRgb(
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ]
}

/** Whether this background type is animated in the shader (noise, dots). */
export function isBackgroundTextureAnimated(config: BackgroundTexture): boolean {
  return config.type === 'noise' || config.type === 'dots'
}

/**
 * Generate a data URL for a background texture.
 * Gradient and terrain are tileable (repeat/wrap). Noise and dots are single-frame previews.
 */
export function generateBackgroundTextureDataUrl(config: BackgroundTexture): string {
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  if (config.type === 'gradient') {
    const [c0, c1] = config.colors
    const angle = (config.angle ?? 90) * (Math.PI / 180)
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const x0 = 0.5 - cos * 0.5
    const y0 = 0.5 - sin * 0.5
    const x1 = 0.5 + cos * 0.5
    const y1 = 0.5 + sin * 0.5
    const gradient = ctx.createLinearGradient(
      x0 * SIZE,
      y0 * SIZE,
      x1 * SIZE,
      y1 * SIZE
    )
    gradient.addColorStop(0, c0)
    gradient.addColorStop(0.5, c1)
    gradient.addColorStop(1, c0)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, SIZE, SIZE)
  } else if (config.type === 'terrain') {
    const colors = config.colors.length >= 2 ? config.colors : ['#1a472a', '#2d5a27', '#8b7355', '#e8e0d5']
    const seed = config.seed ?? 12345
    const scale = Math.max(0.5, Math.min(32, config.scale ?? 4))
    const imageData = ctx.createImageData(SIZE, SIZE)
    const data = imageData.data
    const colorRgb = colors.map(parseHexColor)
    const wrap = true
    for (let py = 0; py < SIZE; py++) {
      for (let px = 0; px < SIZE; px++) {
        const nx = px / SIZE
        const ny = py / SIZE
        const n = valueNoise2D(nx, ny, scale, seed, wrap)
        const n2 = valueNoise2D(nx * 2 + 10, ny * 2, scale * 0.7, seed + 999, wrap)
        const height = n * 0.7 + n2 * 0.3
        const t = Math.max(0, Math.min(1, height))
        const band = t * (colorRgb.length - 1)
        const i = Math.min(Math.floor(band), colorRgb.length - 2)
        const localT = band - i
        const [r, g, b] = lerpRgb(colorRgb[i], colorRgb[i + 1], localT)
        const idx = (py * SIZE + px) * 4
        data[idx] = Math.round(r * 255)
        data[idx + 1] = Math.round(g * 255)
        data[idx + 2] = Math.round(b * 255)
        data[idx + 3] = 255
      }
    }
    ctx.putImageData(imageData, 0, 0)
  } else if (config.type === 'noise') {
    const [c0, c1] = config.colors
    const scale = Math.max(0.5, config.scale ?? 3)
    const seed = config.seed ?? 42
    const imageData = ctx.createImageData(SIZE, SIZE)
    const data = imageData.data
    const [r0, g0, b0] = parseHexColor(c0)
    const [r1, g1, b1] = parseHexColor(c1)
    const wrap = true
    for (let py = 0; py < SIZE; py++) {
      for (let px = 0; px < SIZE; px++) {
        const nx = px / SIZE
        const ny = py / SIZE
        const n = valueNoise2D(nx, ny, scale, seed, wrap)
        const [r, g, b] = lerpRgb([r0, g0, b0], [r1, g1, b1], n)
        const idx = (py * SIZE + px) * 4
        data[idx] = Math.round(r * 255)
        data[idx + 1] = Math.round(g * 255)
        data[idx + 2] = Math.round(b * 255)
        data[idx + 3] = 255
      }
    }
    ctx.putImageData(imageData, 0, 0)
  } else if (config.type === 'dots') {
    const bg = parseHexColor(config.backgroundColor)
    const dot = parseHexColor(config.dotColor)
    const spacing = Math.max(0.05, Math.min(0.5, config.spacing ?? 0.15))
    const size = Math.max(0.01, Math.min(0.4, config.size ?? 0.08))
    const invSpacing = 1 / spacing
    const imageData = ctx.createImageData(SIZE, SIZE)
    const data = imageData.data
    for (let py = 0; py < SIZE; py++) {
      for (let px = 0; px < SIZE; px++) {
        const u = (px / SIZE) * invSpacing
        const v = (py / SIZE) * invSpacing
        const fu = u - Math.floor(u) - 0.5
        const fv = v - Math.floor(v) - 0.5
        const dist = Math.sqrt(fu * fu + fv * fv) * spacing
        const t = Math.max(0, Math.min(1, (size - dist) / (size * 0.3)))
        const [r, g, b] = lerpRgb(bg, dot, t)
        const idx = (py * SIZE + px) * 4
        data[idx] = Math.round(r * 255)
        data[idx + 1] = Math.round(g * 255)
        data[idx + 2] = Math.round(b * 255)
        data[idx + 3] = 255
      }
    }
    ctx.putImageData(imageData, 0, 0)
  } else {
    const imageData = ctx.createImageData(SIZE, SIZE)
    const data = imageData.data
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 26
      data[i + 1] = 26
      data[i + 2] = 30
      data[i + 3] = 255
    }
    ctx.putImageData(imageData, 0, 0)
  }

  return canvas.toDataURL('image/png')
}
