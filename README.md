# VVideo

**A web-based 3D video editor for social content.**  
Compose scenes with background + panel videos, flyover cameras, and real-time effects — all in the browser. Choose 16:9 or 9:16 aspect for Reels, TikTok, and Shorts.

---

## ✨ Features

| Feature | Description |
|--------|-------------|
| **Scenes** | Cut between multiple scenes; each has duration, background video, and optional video-on-plane. |
| **3D flyover** | Define start/end camera position, rotation, and FOV per scene. Fly with orbit + WASD/QE/IJKL; set keyframes with canvas buttons; motion curve (easing) in the right sidebar. |
| **Effects** | Zoom, grain, depth of field, handheld shake, dither, chromatic aberration, lens distortion, glitch, vignette, scanlines — keyframed per scene where applicable. |
| **Undo / redo** | Full history for project edits (Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z). |
| **Export** | In-browser WebM (VP9 when supported). Choose resolution (480p, 720p, 1080p), framerate, bitrate; full composite or panel-only (transparent). Audio is muted. |

---

## 🚀 Quick start

```bash
npm install
npm run dev
```

Open **http://localhost:5173**. Drop a background video (and optionally a clip for the 3D plane), add scenes, tweak flyover and effects, then export.

---

## 📁 Project structure

```
src/
├── store.ts           # Zustand store (project, scenes, playback, export, undo history)
├── types.ts           # Scene, flyover, effects
├── components/        # EditorCanvas (R3F + postprocessing), Sidebar, Timeline, etc.
├── effects/           # Dither, lens distortion
├── lib/               # Presets and utilities
└── utils/             # Helpers (e.g. smooth noise)
```

---

## 🛠 Tech stack

- **React 18** · **TypeScript** · **Vite**
- **React Three Fiber** · **Drei** · **@react-three/postprocessing**
- **Zustand** · **Tailwind CSS**

---

## 🌐 Deploy

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
