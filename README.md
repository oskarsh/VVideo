# VVideo

**A web-based 3D video editor for social content.**
Compose scenes with background + panel videos, flyover cameras, timeline automation, and real-time effects — all in the browser. Choose 16:9 or 9:16 aspect for Reels, TikTok, and Shorts.

---

## Features

| Feature | Description |
|--------|-------------|
| **Scenes** | Cut between multiple scenes; each has a duration, background video/texture, and optional video-on-plane layers. Duplicate, reorder, or clear scenes. |
| **Multi-layer panes** | Add multiple video or image layers (panes) with individual Z-order, position, scale, rotation, extrusion depth, and per-scene trim. |
| **3D flyover camera** | Add camera keyframes at any playhead position; fly with orbit controls; set easing curve between keyframes. Keyframes are draggable on the timeline. |
| **Global timeline automation** | Keyframe grain, DoF, handheld, chromatic, lens distortion, glitch, vignette, scanlines, dither, and camera FOV on the project timeline. Values interpolate across scenes. |
| **Presets** | Apply built-in presets (Default, Clean, Cinematic, VHS/Retro, Glitch, High Contrast, Psychedelic, Acid Trip, Dream State) or save and reuse your own. |
| **Text layers** | Add 3D or static text overlays per scene: choose font, size, color, position, alignment. |
| **Effects** | Zoom, grain, depth of field, handheld shake, dither (8 modes), chromatic aberration, lens distortion, glitch (5 algorithms), vignette, scanlines — per-scene or globally keyframed. |
| **Background** | Video file, or generated texture: Gradient, Terrain, Noise, or Dots. Continuous background mode plays the video uninterrupted across scenes. |
| **Example assets** | Click-to-use background videos and panel clips built into the sidebar. |
| **Floating transport bar** | Play, Loop, Jump to scene start/next, Set camera keyframe at playhead, live camera coordinates display. |
| **Export** | In-browser WebM (VP9 when supported). Resolutions: 480p, 720p, 1080p, 2K, 4K. Per-scene export (one file per scene). Full composite or panel-only (transparent). Frame-by-frame rendering for 2K/4K. |
| **Screenshot** | Capture the current canvas frame as PNG at any resolution. |
| **Undo / Redo** | Full history for all project edits (Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z). |

---

## Quick start

```bash
npm install
npm run dev
```

Open **http://localhost:5173**. Drop a background video (and optionally a clip for the 3D plane), add scenes, tweak flyover and effects, then export.

---

## Project structure

```
src/
├── App.tsx            # Root layout, export logic, keyboard shortcuts
├── store.ts           # Zustand store (project, scenes, playback, export, undo history)
├── types.ts           # Scene, Project, Pane, effects, and utility functions
├── changelog.ts       # In-app changelog data
├── components/        # EditorCanvas (R3F + postprocessing), Sidebar, Timeline, panels, modals
├── context/           # LayoutContext (preview ref, panel positions)
├── hooks/             # Shared hooks (useFloatingPanels, etc.)
├── constants/         # Export options, UI class strings, asset URLs
├── effects/           # Dither, lens distortion shaders
├── lib/               # Presets, flyover, globalEffects utilities
└── utils/             # Number helpers, smooth noise
```

---

## Tech stack

- **React 18** · **TypeScript** · **Vite**
- **React Three Fiber** · **Drei** · **@react-three/postprocessing**
- **Zustand** · **Tailwind CSS** · **Lucide React**

---

## Deploy

The app runs fully in the browser; export is in-browser WebM.

### GitHub Pages

1. Create a repo on GitHub (e.g. `VVideo`), then push your code (default branch `main`).
2. In the repo: **Settings → Pages → Build and deployment**
   - **Source**: GitHub Actions.
3. On every push to `main`, the workflow builds and deploys.
   Your site will be at **`https://oskarsh.github.io/<repo-name>/`** (e.g. `https://oskarsh.github.io/VVideo/`).

### Other hosts

1. **Build:** `npm run build`
2. Deploy the **`dist/`** folder to any static host (Vercel, Netlify, Cloudflare Pages, etc.).

---

## License

Private — Sinuslabs Tools.
