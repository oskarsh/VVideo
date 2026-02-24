# VVideo

**A web-based 3D video editor for social content.**  
Compose scenes with background + panel videos, flyover cameras, and real-time effects — all in the browser. Default 9:16 for Reels, TikTok, and Shorts.

---

## ✨ Features

| Feature | Description |
|--------|-------------|
| **Scenes** | Cut between multiple scenes; each has duration, background video, and optional video-on-plane. |
| **3D flyover** | Define start/end camera position, rotation, and FOV per scene. Presets: Dolly in, Orbit right, Rise. |
| **Effects** | Zoom, grain, depth of field, handheld shake, dither, lens distortion — keyframed per scene. |
| **Text** | Add text layers with Google Fonts or custom uploads; simple fade in/out. |
| **Export** | In-browser WebM export (VP9 when supported). |

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
├── store.ts           # Zustand store (project, scenes, playback, export)
├── types.ts           # Scene, flyover, effects, text layers
├── components/        # EditorCanvas (R3F + postprocessing), Sidebar, Timeline, etc.
├── effects/           # Dither, lens distortion, and other post effects
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
