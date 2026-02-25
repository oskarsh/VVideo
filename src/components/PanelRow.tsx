/**
 * Shared row with optional toggle: used in RightSidebar (effect rows) and EffectsPanel (scene effect rows).
 * Click row to open panel; click toggle to enable/disable (with stopPropagation).
 */
export function PanelRow({
  title,
  enabled,
  onToggleEnabled,
  onClick,
  showToggle = true,
  toggleDisabled = false,
  dataScreenshotOpen,
}: {
  title: string
  enabled: boolean
  onToggleEnabled?: (e: React.MouseEvent) => void
  onClick: () => void
  showToggle?: boolean
  toggleDisabled?: boolean
  /** SCREENSHOT_PROTOTYPE: selector for capture script to open this panel */
  dataScreenshotOpen?: string
}) {
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!toggleDisabled && onToggleEnabled) onToggleEnabled(e)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      className="flex cursor-pointer items-center gap-2 border-b border-white/10 py-2 last:border-b-0 hover:bg-white/5"
      {...(dataScreenshotOpen && { 'data-screenshot-open': dataScreenshotOpen })}
    >
      {showToggle && (
        <button
          type="button"
          onClick={handleToggle}
          className={`flex h-5 w-9 shrink-0 items-center rounded border transition-colors ${toggleDisabled ? 'cursor-default' : ''
            } ${enabled
              ? 'border-emerald-500/50 bg-emerald-500/30'
              : 'border-white/20 bg-white/5'
            }`}
          aria-label={enabled ? 'Turn off' : 'Turn on'}
          title={enabled ? 'Off' : 'On'}
          disabled={toggleDisabled}
        >
          <span
            className={`block h-3 w-3 rounded-full transition-all ${enabled ? 'translate-x-1 bg-emerald-400' : 'translate-x-0.5 bg-white/30'
              }`}
          />
        </button>
      )}
      <span className="flex-1 text-left text-xs font-semibold uppercase tracking-wider text-white/70">
        {title}
      </span>
    </div>
  )
}
