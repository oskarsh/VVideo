import type { SceneText } from '@/types'

function ensureTextDefaults(t: SceneText): SceneText {
  return {
    ...t,
    fontFamily: t.fontFamily ?? 'IBM Plex Mono',
    fontWeight: t.fontWeight ?? 400,
    color: t.color ?? '#ffffff',
    fontSize: t.fontSize ?? 24,
    staticAlignX: t.staticAlignX ?? 'center',
    staticAlignY: t.staticAlignY ?? 'center',
    staticPadding: t.staticPadding ?? 24,
  }
}

export function StaticTextOverlay({
  width,
  height,
  texts,
}: {
  width: number
  height: number
  texts: SceneText[]
}) {
  const staticTexts = texts.filter((t) => t.mode === 'static').map(ensureTextDefaults)
  if (staticTexts.length === 0) return null

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ width, height }}
      aria-hidden
    >
      {staticTexts.map((t) => {
        const padding = t.staticPadding ?? 24
        const style: React.CSSProperties = {
          position: 'absolute',
          left: padding,
          right: padding,
          top: padding,
          bottom: padding,
          display: 'flex',
          justifyContent:
            t.staticAlignX === 'left' ? 'flex-start' : t.staticAlignX === 'right' ? 'flex-end' : 'center',
          alignItems:
            t.staticAlignY === 'top' ? 'flex-start' : t.staticAlignY === 'bottom' ? 'flex-end' : 'center',
          fontFamily: `"${t.fontFamily}", sans-serif`,
          fontWeight: t.fontWeight ?? 400,
          fontSize: t.fontSize ?? 24,
          color: t.color ?? '#ffffff',
          textAlign: t.staticAlignX === 'left' ? 'left' : t.staticAlignX === 'right' ? 'right' : 'center',
          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }
        return (
          <div key={t.id} style={style}>
            {(t.content || ' ').trim() || ' '}
          </div>
        )
      })}
    </div>
  )
}
