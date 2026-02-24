import { useCallback, useRef, useState } from 'react'
import type { FlyoverEasing } from '@/types'
import {
  applyFlyoverEasing,
  EASING_PRESETS,
  DEFAULT_CUBIC,
} from '@/easing'

const PAD = 12
const GRAPH_SIZE = 140

function svgX(x: number) {
  return PAD + x * (GRAPH_SIZE - 2 * PAD)
}
function svgY(y: number) {
  // SVG y down; we want curve 0,0 -> 1,1 with y up
  return PAD + (1 - y) * (GRAPH_SIZE - 2 * PAD)
}

interface CurveEditorProps {
  value: FlyoverEasing | undefined
  onChange: (easing: FlyoverEasing) => void
}

export function CurveEditor({ value, onChange }: CurveEditorProps) {
  const effective =
    value && value.type === 'cubic'
      ? value
      : { type: 'cubic' as const, ...DEFAULT_CUBIC }
  const [dragging, setDragging] = useState<'p1' | 'p2' | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const sampleCurvePath = useCallback((easing: FlyoverEasing): string => {
    const pts: string[] = []
    for (let i = 0; i <= 30; i++) {
      const t = i / 30
      const y = applyFlyoverEasing(t, easing)
      pts.push(`${svgX(t)},${svgY(y)}`)
    }
    return pts.length ? `M ${pts.join(' L ')}` : ''
  }, [])

  const pathD =
    value?.type === 'cubic'
      ? `M ${svgX(0)},${svgY(0)} C ${svgX(effective.x1)},${svgY(effective.y1)} ${svgX(effective.x2)},${svgY(effective.y2)} ${svgX(1)},${svgY(1)}`
      : sampleCurvePath(value ?? { type: 'preset', name: 'linear' })

  const handleGraphMouse = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current || dragging === null) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left - PAD) / (GRAPH_SIZE - 2 * PAD)
      const y = 1 - (e.clientY - rect.top - PAD) / (GRAPH_SIZE - 2 * PAD)
      const xClamped = Math.max(0, Math.min(1, x))
      const yClamped = Math.max(0, Math.min(1, y))
      const cubic =
        value?.type === 'cubic'
          ? { ...value }
          : { type: 'cubic' as const, ...DEFAULT_CUBIC }
      if (dragging === 'p1') {
        cubic.x1 = xClamped
        cubic.y1 = yClamped
      } else {
        cubic.x2 = xClamped
        cubic.y2 = yClamped
      }
      onChange(cubic)
    },
    [dragging, value, onChange]
  )

  const handleGraphMouseUp = useCallback(() => setDragging(null), [])
  const handleGraphMouseLeave = useCallback(() => setDragging(null), [])

  return (
    <div className="space-y-3">
      <div className="text-xs font-medium text-white/70">Easing curve</div>
      <div
        ref={containerRef}
        className="relative rounded-lg bg-black/30 border border-white/10 overflow-hidden"
        style={{ width: GRAPH_SIZE + 2 * PAD, height: GRAPH_SIZE + 2 * PAD }}
        onMouseMove={dragging ? handleGraphMouse : undefined}
        onMouseUp={handleGraphMouseUp}
        onMouseLeave={handleGraphMouseLeave}
      >
        <svg
          width={GRAPH_SIZE + 2 * PAD}
          height={GRAPH_SIZE + 2 * PAD}
          className="block"
        >
          <defs>
            <linearGradient id="curveGrad" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="rgb(34 197 94)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(34 197 94)" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          {/* Grid */}
          <line
            x1={svgX(0)}
            y1={svgY(0)}
            x2={svgX(1)}
            y2={svgY(0)}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
          <line
            x1={svgX(0)}
            y1={svgY(1)}
            x2={svgX(1)}
            y2={svgY(1)}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
          <line
            x1={svgX(0)}
            y1={svgY(0)}
            x2={svgX(0)}
            y2={svgY(1)}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
          <line
            x1={svgX(1)}
            y1={svgY(0)}
            x2={svgX(1)}
            y2={svgY(1)}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
          <line
            x1={svgX(0)}
            y1={svgY(0.5)}
            x2={svgX(1)}
            y2={svgY(0.5)}
            stroke="rgba(255,255,255,0.06)"
            strokeDasharray="2 2"
          />
          <line
            x1={svgX(0.5)}
            y1={svgY(0)}
            x2={svgX(0.5)}
            y2={svgY(1)}
            stroke="rgba(255,255,255,0.06)"
            strokeDasharray="2 2"
          />
          {/* Curve */}
          {value?.type === 'cubic' ? (
            <>
              <path
                d={`M ${svgX(0)},${svgY(0)} L ${svgX(effective.x1)},${svgY(effective.y1)} L ${svgX(effective.x2)},${svgY(effective.y2)} L ${svgX(1)},${svgY(1)}`}
                fill="none"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="1"
                strokeDasharray="3 2"
              />
              <path
                d={pathD}
                fill="url(#curveGrad)"
                stroke="rgb(34 197 94)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Handles */}
              <circle
                cx={svgX(effective.x1)}
                cy={svgY(effective.y1)}
                r={6}
                fill="rgb(34 197 94)"
                stroke="white"
                strokeWidth="1.5"
                className="cursor-grab active:cursor-grabbing"
                onMouseDown={() => setDragging('p1')}
              />
              <circle
                cx={svgX(effective.x2)}
                cy={svgY(effective.y2)}
                r={6}
                fill="rgb(59 130 246)"
                stroke="white"
                strokeWidth="1.5"
                className="cursor-grab active:cursor-grabbing"
                onMouseDown={() => setDragging('p2')}
              />
            </>
          ) : (
            <path
              d={pathD}
              fill="url(#curveGrad)"
              stroke="rgb(34 197 94)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
      </div>

      <div className="text-[10px] text-white/50 mb-1">Presets</div>
      <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
        {EASING_PRESETS.map((p) => {
          const isActive =
            value?.type === 'preset' &&
            p.easing.type === 'preset' &&
            value.name === p.easing.name
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p.easing)}
              className={`px-2 py-1 rounded text-xs transition-colors ${isActive
                  ? 'bg-white text-black'
                  : 'bg-white/10 hover:bg-white/20 text-white/90'
                }`}
            >
              {p.label}
            </button>
          )
        })}
        <button
          type="button"
          onClick={() =>
            onChange(
              value?.type === 'cubic'
                ? value
                : { type: 'cubic', ...DEFAULT_CUBIC }
            )
          }
          className={`px-2 py-1 rounded text-xs transition-colors ${value?.type === 'cubic'
              ? 'bg-white text-black'
              : 'bg-white/10 hover:bg-white/20 text-white/90'
            }`}
        >
          Custom (drag curve)
        </button>
      </div>
      {value?.type === 'cubic' && (
        <div className="grid grid-cols-4 gap-1 text-[10px]">
          {(['x1', 'y1', 'x2', 'y2'] as const).map((key) => (
            <label key={key} className="flex flex-col gap-0.5">
              <span className="text-white/50">{key}</span>
              <input
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={value[key]}
                onChange={(e) => {
                  const v = parseFloat(e.target.value)
                  if (!Number.isFinite(v)) return
                  const clamped = Math.max(0, Math.min(1, v))
                  onChange({ ...value, [key]: clamped })
                }}
                className="w-full px-1.5 py-0.5 rounded bg-black/30 border border-white/10 text-white"
              />
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
