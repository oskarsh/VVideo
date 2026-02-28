import { useState, useEffect } from 'react'
import { Modal } from '@/components/Modal'
import { VVideoLogo } from '@/components/VVideoLogo'

const WELCOME_STORAGE_KEY = 'vvideo-welcome-seen'

export function getWelcomeSeen(): boolean {
  try {
    return localStorage.getItem(WELCOME_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function setWelcomeSeen(): void {
  try {
    localStorage.setItem(WELCOME_STORAGE_KEY, '1')
  } catch {
    // ignore
  }
}

// ─── Key button ───────────────────────────────────────────────────────────────

function Key({ label }: { label: string }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[2.25rem] h-9 px-2 rounded-md bg-white/10 border border-white/20 text-white text-sm font-mono font-medium select-none shadow-sm">
      {label}
    </kbd>
  )
}

// ─── Step 1: Camera controls ──────────────────────────────────────────────────

function StepCamera() {
  return (
    <div className="space-y-4">
      <p className="text-white/80 text-sm leading-relaxed">
        When in camera edit mode (Flyover panel → Edit), use the keyboard to freely fly through your 3D scene and set keyframes for your camera path.
      </p>

      <div className="grid grid-cols-2 gap-5">
        {/* WASD + QE */}
        <div className="space-y-3">
          <span className="text-xs font-medium text-white/50 uppercase tracking-wider">Move</span>
          <div className="space-y-1.5">
            <div className="flex justify-center">
              <Key label="W" />
            </div>
            <div className="flex justify-center gap-1.5">
              <Key label="A" />
              <Key label="S" />
              <Key label="D" />
            </div>
            <div className="flex justify-center gap-1.5 mt-1">
              <Key label="Q" />
              <Key label="E" />
            </div>
          </div>
          <div className="text-xs text-white/50 text-center space-y-0.5 leading-relaxed">
            <div>W / S — forward · back</div>
            <div>A / D — strafe left · right</div>
            <div>Q / E — up · down</div>
          </div>
        </div>

        {/* IJKL */}
        <div className="space-y-3">
          <span className="text-xs font-medium text-white/50 uppercase tracking-wider">Rotate</span>
          <div className="space-y-1.5">
            <div className="flex justify-center">
              <Key label="I" />
            </div>
            <div className="flex justify-center gap-1.5">
              <Key label="J" />
              <Key label="K" />
              <Key label="L" />
            </div>
          </div>
          <div className="text-xs text-white/50 text-center space-y-0.5 leading-relaxed">
            <div>J / L — pan left · right</div>
            <div>I / K — tilt camera</div>
          </div>
        </div>
      </div>

      {/* Shift tip */}
      <div className="flex items-center gap-3 rounded-lg bg-white/5 border border-white/10 px-3 py-2.5">
        <Key label="⇧" />
        <p className="text-xs text-white/60">Hold Shift for slow, precise movement</p>
      </div>

      {/* Mouse tip */}
      <p className="text-xs text-white/40 leading-relaxed">
        You can also drag to orbit the camera with the mouse, and scroll to zoom. Set a keyframe in the Flyover panel to record each camera position.
      </p>
    </div>
  )
}

// ─── Step 2: Clips & Scenes ───────────────────────────────────────────────────

function StepClips() {
  return (
    <div className="space-y-4">
      <p className="text-white/80 text-sm leading-relaxed">
        Your project is split into <strong className="text-white font-medium">scenes</strong>. Each scene is an independent clip with its own camera path, effects, and duration.
      </p>

      {/* Mini timeline mockup */}
      <div className="rounded-xl overflow-hidden border border-white/10 bg-zinc-800 text-xs select-none">
        {/* Transport bar */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-zinc-900/50">
          <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center shrink-0">
            <svg className="w-2.5 h-2.5 text-white/70 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <div className="flex-1 h-1 bg-white/10 rounded-full relative">
            <div className="absolute left-0 top-0 h-full w-1/4 bg-white/50 rounded-full" />
            <div className="absolute top-1/2 -translate-y-1/2 left-1/4 w-2 h-2 bg-white rounded-full -ml-1 shadow" />
          </div>
          <span className="text-white/40 font-mono tabular-nums">0:04 / 0:15</span>
        </div>

        {/* Scene strips */}
        <div className="flex h-11 gap-0.5 p-1.5">
          <div className="flex-none w-1/4 rounded bg-indigo-500/25 border border-indigo-400/30 flex flex-col items-center justify-center gap-0.5 text-white/60">
            <span className="font-medium">Scene 1</span>
            <span className="text-white/30" style={{ fontSize: '10px' }}>4s</span>
          </div>
          <div className="flex-none w-5/12 rounded bg-indigo-500/55 border border-indigo-400/55 flex flex-col items-center justify-center gap-0.5 text-white/90">
            <span className="font-medium">Scene 2</span>
            <span className="text-white/50" style={{ fontSize: '10px' }}>6s</span>
          </div>
          <div className="flex-1 rounded bg-indigo-500/25 border border-indigo-400/30 flex flex-col items-center justify-center gap-0.5 text-white/60">
            <span className="font-medium">Scene 3</span>
            <span className="text-white/30" style={{ fontSize: '10px' }}>5s</span>
          </div>
          {/* Highlighted + button */}
          <div className="flex-none w-8 rounded border-2 border-white/70 bg-white/10 flex items-center justify-center text-white shadow-[0_0_8px_2px_rgba(255,255,255,0.18)] ring-1 ring-white/20">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs text-white/60 font-medium">1</div>
          <p className="text-sm text-white/80">Add scenes with the <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/70 text-xs font-mono">+</span> button in the timeline or the Scenes panel on the left.</p>
        </div>
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs text-white/60 font-medium">2</div>
          <p className="text-sm text-white/80">Click a scene to select it. Each scene gets its own background video, panel clip, camera keyframes, and effects.</p>
        </div>
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs text-white/60 font-medium">3</div>
          <p className="text-sm text-white/80">All scenes stitch together into a single export, or you can export each scene as a separate file.</p>
        </div>
      </div>

      <p className="text-xs text-white/40 leading-relaxed">
        Tip: drag a video directly onto the canvas to set it as the background or panel clip without opening the sidebar.
      </p>
    </div>
  )
}

// ─── Step 3: Effects ──────────────────────────────────────────────────────────

const EFFECTS: { name: string; desc: string }[] = [
  { name: 'Camera',               desc: 'Animate FOV / zoom over time' },
  { name: 'Grain',                desc: 'Film grain overlay' },
  { name: 'Dither',               desc: 'Pixel-level color quantization' },
  { name: 'Depth of field',       desc: 'Focus blur falloff' },
  { name: 'Handheld camera',      desc: 'Organic camera shake' },
  { name: 'Chromatic aberration', desc: 'RGB color fringing' },
  { name: 'Lens distortion',      desc: 'Barrel / pincushion warp' },
  { name: 'Glitch',               desc: 'Digital artifact glitching' },
  { name: 'Vignette',             desc: 'Darkened edge falloff' },
  { name: 'Scanlines',            desc: 'CRT scanline overlay' },
  { name: 'Camera Distortion',    desc: 'Per-lens geometric warp' },
  { name: 'Bezier',               desc: 'Smooth curved camera paths' },
]

function StepEffects() {
  return (
    <div className="space-y-4">
      <p className="text-white/80 text-sm leading-relaxed">
        Each scene can have its own post-processing effects applied on top of the camera view. Find them in the right sidebar under <strong className="text-white font-medium">Effects</strong>.
      </p>

      <div className="grid grid-cols-2 gap-1.5">
        {EFFECTS.map((effect) => (
          <div
            key={effect.name}
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/8 transition-colors"
          >
            <div className="text-sm font-medium text-white/90 leading-none">{effect.name}</div>
            <div className="text-xs text-white/45 mt-0.5">{effect.desc}</div>
          </div>
        ))}
      </div>

      <p className="text-xs text-white/40 leading-relaxed">
        Global effects (applied across all scenes) and camera lens distortion have their own separate panels below Effects.
      </p>
    </div>
  )
}

// ─── Step 4: Export ───────────────────────────────────────────────────────────

function StepExport() {
  return (
    <div className="space-y-4">
      <p className="text-white/80 text-sm leading-relaxed">
        Click <strong className="text-white font-medium">Export</strong> in the header when you're ready. Choose your resolution, format, and what to include.
      </p>

      {/* Mini export dialog mockup */}
      <div className="rounded-xl border border-white/10 bg-zinc-800 p-3.5 space-y-3 text-xs select-none">
        {/* Resolution */}
        <div>
          <div className="text-white/45 uppercase tracking-wider mb-1.5" style={{ fontSize: '10px', letterSpacing: '0.08em' }}>Resolution</div>
          <div className="flex gap-1.5">
            <div className="px-2.5 py-1.5 rounded bg-white text-black font-medium">1080p</div>
            <div className="px-2.5 py-1.5 rounded bg-white/10 text-white/60">2K</div>
            <div className="px-2.5 py-1.5 rounded bg-white/10 text-white/60">4K</div>
          </div>
        </div>

        {/* Framerate + Format row */}
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="text-white/45 uppercase tracking-wider mb-1.5" style={{ fontSize: '10px', letterSpacing: '0.08em' }}>Framerate</div>
            <div className="flex gap-1.5">
              <div className="px-2 py-1.5 rounded bg-white text-black font-medium">30 fps</div>
              <div className="px-2 py-1.5 rounded bg-white/10 text-white/60">60 fps</div>
            </div>
          </div>
          <div className="flex-1">
            <div className="text-white/45 uppercase tracking-wider mb-1.5" style={{ fontSize: '10px', letterSpacing: '0.08em' }}>Format</div>
            <div className="flex gap-1.5">
              <div className="px-2.5 py-1.5 rounded bg-white text-black font-medium">WebM</div>
              <div className="px-2.5 py-1.5 rounded bg-white/10 text-white/60">MP4</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div>
          <div className="text-white/45 uppercase tracking-wider mb-1.5" style={{ fontSize: '10px', letterSpacing: '0.08em' }}>Export content</div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 px-2.5 py-2 rounded bg-white/10 border border-white/20">
              <div className="w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>
              <div>
                <div className="text-white/90 font-medium leading-none">Full composite</div>
                <div className="text-white/40 mt-0.5">Background + panel + camera + effects</div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-2 rounded bg-white/5 border border-white/10">
              <div className="w-3.5 h-3.5 rounded-full border-2 border-white/25 shrink-0" />
              <div>
                <div className="text-white/50 font-medium leading-none">Panel only (transparent)</div>
                <div className="text-white/30 mt-0.5">WebM with alpha channel</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <div className="mt-0.5 w-1 h-1 rounded-full bg-white/30 shrink-0 mt-1.5" />
          <p className="text-xs text-white/60"><strong className="text-white/80">Smooth export</strong> renders frame-by-frame for no dropped frames — takes longer but gives a perfect result. Always on for 2K / 4K.</p>
        </div>
        <div className="flex items-start gap-2">
          <div className="mt-0.5 w-1 h-1 rounded-full bg-white/30 shrink-0 mt-1.5" />
          <p className="text-xs text-white/60"><strong className="text-white/80">Panel only</strong> exports your panel clip with effects on a transparent background — great for overlays in DaVinci or Premiere.</p>
        </div>
        <div className="flex items-start gap-2">
          <div className="mt-0.5 w-1 h-1 rounded-full bg-white/30 shrink-0 mt-1.5" />
          <p className="text-xs text-white/60">With multiple scenes, you can export them all as one file or <strong className="text-white/80">one file per scene</strong>.</p>
        </div>
      </div>
    </div>
  )
}

// ─── Step config ──────────────────────────────────────────────────────────────

const STEPS = [
  { title: 'Camera Controls', component: StepCamera },
  { title: 'Clips & Scenes',  component: StepClips },
  { title: 'Effects',         component: StepEffects },
  { title: 'Export',          component: StepExport },
]

// ─── Main wizard modal ────────────────────────────────────────────────────────

export function WelcomeModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [step, setStep] = useState(0)
  const total = STEPS.length
  const isLast = step === total - 1
  const StepComponent = STEPS[step].component

  // Reset to first step each time the modal opens
  useEffect(() => {
    if (open) setStep(0)
  }, [open])

  const handleClose = () => {
    setWelcomeSeen()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      contentClassName="bg-zinc-900 border border-white/15 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-white/10 flex items-center gap-3 shrink-0">
        <VVideoLogo className="h-5 text-white shrink-0" />
        <span className="text-sm font-medium text-white/70 flex-1 truncate">{STEPS[step].title}</span>

        {/* Step indicator dots */}
        <div className="flex items-center gap-1.5 shrink-0">
          {STEPS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setStep(i)}
              aria-label={`Go to step ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                i === step ? 'w-4 bg-white' : 'w-1.5 bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Step content */}
      <div className="px-5 py-4 overflow-y-auto flex-1 min-h-[320px]">
        <StepComponent />
      </div>

      {/* Footer nav */}
      <div className="px-5 pb-5 pt-3 border-t border-white/10 flex gap-2 shrink-0">
        <button
          type="button"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
          className="px-4 py-2.5 rounded-lg text-sm font-medium bg-white/10 text-white/80 hover:bg-white/20 transition-colors disabled:opacity-30 disabled:pointer-events-none"
        >
          Back
        </button>
        <button
          type="button"
          onClick={isLast ? handleClose : () => setStep((s) => s + 1)}
          className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-white text-black hover:bg-gray-100 transition-colors"
        >
          {isLast ? 'Get started' : 'Next'}
        </button>
      </div>
    </Modal>
  )
}

/** Hook: show tutorial on first visit only; exposes open() to re-show manually. */
export function useWelcome() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!getWelcomeSeen()) setShow(true)
  }, [])

  const open = () => setShow(true)
  const close = () => setShow(false)

  return { show, open, close }
}
