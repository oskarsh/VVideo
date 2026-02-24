/**
 * Changelog for in-app "What's new" modal.
 * Newest release first. Keep summary short; use items for details.
 */

export type ChangelogRelease = {
  version: string
  date: string // YYYY-MM-DD
  summary: string
  items: string[]
}

export const CHANGELOG_STORAGE_KEY = 'vvideo-changelog-seen'

export const changelogReleases: ChangelogRelease[] = [
  {
    version: '1.12.12',
    date: '2026-02-25',
    summary: 'Play with no keyframes keeps camera position.',
    items: [
      'When you press play and the scene has no camera keyframes yet, the camera stays where you left it instead of jumping to the default position.',
      'Scene plays as normal (timeline, video, effects); only the camera is left unchanged until you add keyframes.',
    ],
  },
  {
    version: '1.12.11',
    date: '2026-02-25',
    summary: 'Camera keyframes and automation UX improvements.',
    items: [
      'Scene camera: no start/end — add keyframes at any time; by default there are no keyframes',
      'Single "Add keyframe" button adds a keyframe at the current playhead; "Jump to first" moves camera to first keyframe',
      'Keyframe editor shows per-scene camera keyframes (amber markers) when set, alongside global effect keyframes',
      'Automation view: click a lane to expand it for detail; other lanes shrink; click again to collapse',
    ],
  },
  {
    version: '1.12.10',
    date: '2026-02-25',
    summary: 'Trippy psychedelic presets and effect combos.',
    items: [
      'New built-in presets: Psychedelic, Acid Trip, and Dream State',
      'Psychedelic: strong chromatic aberration, lens distortion, vignette, scanlines, posterized dither',
      'Acid Trip: max chromatic + barrel distortion, constant glitch, scrolling scanlines, handheld shake, dither',
      'Dream State: softer look with subtle chromatic, light lens warp, depth of field, and vignette',
      'Presets combine chromatic aberration, lens distortion, glitch, scanlines, vignette, grain, and handheld where it fits',
    ],
  },
  {
    version: '1.12.9',
    date: '2026-02-25',
    summary: 'ScenePanel JSX repaired; build and consistency fixes.',
    items: [
      'ScenePanel.tsx had corrupted JSX (broken tags/attributes); full component repaired and builds',
      'ScenePanel now uses sectionHeadingClass, smallLabelClass, parseNum, and clamp from shared utils',
      'Early return when no scene; aligns with CurrentScenePanel and style system',
    ],
  },
  {
    version: '1.12.8',
    date: '2026-02-24',
    summary: 'Trim editor: single owner in store and TrimEditorSlot.',
    items: [
      'Store has trimEditorOpen and setTrimEditorOpen; one TrimEditorSlot in App renders TrimEditorModal',
      'CurrentScenePanel and ScenePanel no longer own trim state or render the modal; they call setTrimEditorOpen to open',
      'Fixes duplicate trim state and modal rendering; ScenePanel JSX fixes for a clean build in that file',
    ],
  },
  {
    version: '1.12.7',
    date: '2026-02-24',
    summary: 'Export and Trim modals use shared Modal; ExportDialog moved to component.',
    items: [
      'ExportDialog moved from App.tsx to src/components/ExportDialog.tsx and wrapped in shared Modal (overlay, Escape, backdrop click)',
      'TrimEditorModal refactored to use shared Modal; optional open prop for consistency',
      'App.tsx no longer contains inline ExportDialog; modal unification complete for Export and Trim',
    ],
  },
  {
    version: '1.12.6',
    date: '2025-02-24',
    summary: 'Shared floating-panel hook and PanelRow for less duplication.',
    items: [
      'Extracted useFloatingPanels hook: EffectsPanel and RightSidebar now share one implementation for open panels, positions, and toggle/close',
      'New PanelRow component: same clickable row with optional on/off toggle used in both sidebars; removes duplicate SidebarRow and inline row markup',
    ],
  },
  {
    version: '1.12.5',
    date: '2026-02-24',
    summary: 'Subtler default effects and closer default camera.',
    items: [
      'Default grain reduced for a cleaner look',
      'Default depth of field softened (less blur, smaller bokeh)',
      'Default camera moved closer to the pane so the view fills the frame more',
    ],
  },
  {
    version: '1.12.4',
    date: '2026-02-24',
    summary: 'Simplified effect on/off and keyframe controls.',
    items: [
      'Single on/off per effect: only the right-sidebar toggle turns an effect on or off; removed duplicate "Enabled" checkboxes inside effect panels',
      'Per-scene effects: when the panel is open, sliders are always visible and editable (no need to check "Enabled" inside the panel)',
      'Global effects: turn effect on in the sidebar; sliders in the panel always show current state at playhead (from project or keyframes). Moving a slider creates or updates a keyframe as needed — no separate “add keyframe” step.',
      'Removed track-level "Enabled" checkbox from Global effects panel; use the sidebar toggle only',
    ],
  },
  {
    version: '1.12.3',
    date: '2026-02-24',
    summary: 'Animated and endless backgrounds with settings.',
    items: [
      'New background types: Noise (animated Perlin-like) and Dots (animated grid), plus Gradient and Terrain',
      'All generated backgrounds wrap and loop; Gradient and Terrain scroll with the timeline',
      'Speed control for every background type (video already had per-scene speed)',
      'Editable settings after adding: open "Settings" under the texture to change colors, scale, seed, speed, etc.',
    ],
  },
  {
    version: '1.12.2',
    date: '2026-02-24',
    summary: 'Style system enforced across the app.',
    items: [
      '"Use texture" and similar actions use secondary button style (no green); emerald reserved for toggle-on and one primary CTA per view',
      'Changelog bullets, "+ Add text", curve presets, trim handles, and drop zones use neutral styles',
      'Text/number inputs standardized to bg-black/30 and border-white/10; modal border and radius aligned to doc',
      'docs/STYLE-SYSTEM.md and .cursor/rules/style-system.mdc updated with "reserve emerald" and enforcement notes',
    ],
  },
  {
    version: '1.12.1',
    date: '2026-02-24',
    summary: 'Global style system documented for consistency.',
    items: [
      'New docs/STYLE-SYSTEM.md: single source of truth for colors, typography, spacing, and UI patterns',
      'Cursor rule .cursor/rules/style-system.mdc so agents follow the style system when changing UI',
      'Documents current standards and known inconsistencies to fix over time',
    ],
  },
  {
    version: '1.12.0',
    date: '2026-02-24',
    summary: 'Background slot: video or generated texture.',
    items: [
      'Left sidebar has a single fixed "Background" slot instead of a generic assets drop zone',
      'Load a video file for the background (as before) or generate a texture',
      'Generated textures: Gradient (two colors, angle) or Terrain (gradient-colored elevation bands with noise)',
      'Panes (layers) are added only via the Layers section; background is one per project',
    ],
  },
  {
    version: '1.11.0',
    date: '2026-02-24',
    summary: 'Preset system with Default and custom presets.',
    items: [
      'New Presets section in the left sidebar: apply Default or built-in presets (Clean, Cinematic, VHS, etc.)',
      'Save your current effects and look as a named preset; custom presets are stored in the browser',
      'Apply a preset keeps your videos and trims; only effects, dither, and global effect keyframes are loaded',
      'Custom presets can be deleted from the list; built-in presets are always available',
    ],
  },
  {
    version: '1.10.0',
    date: '2026-02-24',
    summary: 'Timeline click-to-seek and preview at playhead.',
    items: [
      'Click anywhere on the timeline (track or a scene clip) to move the playhead to that position',
      'Click on the time ruler to move the playhead as well',
      '3D preview shows all effects with their automation at the playhead position',
      'Background and plane video in the 3D pane show the actual frame at the playhead when scrubbing',
    ],
  },
  {
    version: '1.9.0',
    date: '2026-02-24',
    summary: 'Load example assets from the sidebar.',
    items: [
      'New "Load examples" button in the left sidebar (Assets): loads assets from public/example-assets',
      'First video in the list becomes the background (if none set); other files are added as panes',
      'Add your own files to public/example-assets and extend EXAMPLE_ASSETS in code to include them',
    ],
  },
  {
    version: '1.8.0',
    date: '2026-02-24',
    summary: 'Global camera controls (focal length / FOV).',
    items: [
      'New "Camera" track in Global effects: control field of view (FOV) from the project timeline',
      'FOV is keyframed like other global effects — add keyframes and values interpolate over time',
      'When the global camera track has keyframes, it overrides flyover start/end FOV (camera stays first-person)',
      'Useful for zoom-like looks (narrow FOV) or wide angles (high FOV) without per-scene flyover edits',
    ],
  },
  {
    version: '1.7.0',
    date: '2026-02-24',
    summary: 'Global post-processing effects with keyframes.',
    items: [
      'Grain, DoF, handheld, chromatic, lens, glitch, vignette, and scanlines can now be driven by global keyframes (like dither)',
      'Right sidebar: "Global effects (keyframes)" — enable a track per effect and add keyframes at the playhead',
      'Keyframes live on the project timeline; values interpolate between keyframes across scenes',
      'Timeline shows a row of keyframe markers when any global effect has keyframes; click to seek',
      'When a global track has keyframes, it overrides per-scene effect settings for that effect',
    ],
  },
  {
    version: '1.6.0',
    date: '2026-02-24',
    summary: 'Continuous background video across scenes.',
    items: [
      'New "Continuous background" option for the scene background video',
      'When enabled, the background keeps playing from a single timeline and does not reset when changing scenes',
      'Pane (panel) content still changes per scene; only the background runs continuously',
      'Per-scene background trim and playback mode are hidden when continuous is on',
    ],
  },
  {
    version: '1.5.0',
    date: '2026-02-24',
    summary: 'Panel images, SVG, and extrusion.',
    items: [
      'Panel can use video, image, or SVG (drop or choose file in sidebar)',
      'Images and SVG support transparency on the panel',
      'SVG is rendered as 3D shapes (no plane); vector paths are preserved',
      'New extrusion setting: make the panel thicker (works for video, image, and SVG)',
      'Extrusion slider in sidebar under Panel (0 = flat, increase for depth)',
    ],
  },
  {
    version: '1.4.0',
    date: '2026-02-24',
    summary: '2K and 4K export with smooth frame-by-frame rendering.',
    items: [
      'Export resolutions: added 2K (1440p) and 4K (2160p)',
      '2K and 4K use frame-by-frame export so the final video stays smooth (no dropped frames)',
      'Higher bitrate options (24 Mbps, 32 Mbps) for high-resolution exports',
      'Export may take longer than real-time for 2K/4K; quality is prioritised',
    ],
  },
  {
    version: '1.3.0',
    date: '2026-02-24',
    summary: 'Timeline automation curves for effect keyframes.',
    items: [
      'Toggle (📈) in timeline to show or hide effect automation curves',
      'Curves appear below the video track, synced to each scene',
      'One lane per automated parameter; multiple lanes when several effects are keyframed',
      'Drag the start and end points on each curve to tweak values quickly',
      'Smooth expand and fade when turning curves on',
    ],
  },
  {
    version: '1.2.0',
    date: '2026-02-24',
    summary: 'Camera flyover in the right sidebar.',
    items: [
      'Right sidebar: Camera flyover with Fly around toggle and motion curve (easing)',
      'Set start/end keyframes with canvas buttons; Jump to start to snap view',
    ],
  },
  {
    version: '1.1.0',
    date: '2025-02-24',
    summary: 'Changelog and smoother workflow.',
    items: [
      'In-app "What\'s new" popover when you open VVideo',
      'Changelog only shows again when there\'s a new release',
      'View changelog anytime from the header link',
    ],
  },
  {
    version: '1.0.0',
    date: '2025-02-24',
    summary: 'Initial release: 3D video editor for social content.',
    items: [
      'Scenes with background and optional panel video',
      '3D flyover camera (start/end keyframes; easing in right sidebar)',
      'Effects: zoom, grain, DoF, handheld, dither, chromatic aberration, lens distortion, glitch, vignette, scanlines',
      'In-browser WebM export',
    ],
  },
]

export function getLatestRelease(): ChangelogRelease {
  return changelogReleases[0]
}

export function getSeenVersion(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(CHANGELOG_STORAGE_KEY)
}

export function setSeenVersion(version: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CHANGELOG_STORAGE_KEY, version)
}
