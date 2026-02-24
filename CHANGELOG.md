# Changelog

## 1.5.0 — 2026-02-24

**Panel images, SVG, and extrusion.**

- Panel can use video, image, or SVG (drop or choose file in sidebar)
- Images and SVG support transparency on the panel
- SVG is rendered as 3D shapes (no plane); vector paths are preserved
- New extrusion setting: make the panel thicker (works for video, image, and SVG)
- Extrusion slider in sidebar under Panel (0 = flat, increase for depth)

---

## 1.4.0 — 2026-02-24

**2K and 4K export with smooth frame-by-frame rendering.**

- Export resolutions: added 2K (1440p) and 4K (2160p)
- 2K and 4K use frame-by-frame export so the final video stays smooth (no dropped frames)
- Higher bitrate options (24 Mbps, 32 Mbps) for high-resolution exports
- Export may take longer than real-time for 2K/4K; quality is prioritised

---

## 1.3.0 — 2026-02-24

**Timeline automation curves for effect keyframes.**

- Toggle (📈) in timeline to show or hide effect automation curves
- Curves appear below the video track, synced to each scene
- One lane per automated parameter; multiple lanes when several effects are keyframed
- Drag the start and end points on each curve to tweak values quickly
- Smooth expand and fade when turning curves on

---

## 1.2.0 — 2026-02-24

**Camera flyover in the right sidebar.**

- Right sidebar: Camera flyover section with Fly around toggle and motion curve (easing)
- Set start/end keyframes with canvas buttons; Jump to start to snap view to start keyframe

---

## 1.1.0 — 2025-02-24

**Changelog and smoother workflow.**

- In-app "What's new" popover when you open VVideo
- Changelog only shows again when there's a new release
- View changelog anytime from the header link

---

## 1.0.0 — 2025-02-24

**Initial release: 3D video editor for social content.**

- Scenes with background and optional panel video
- 3D flyover camera (set start/end keyframes; easing in right sidebar)
- Effects: zoom, grain, DoF, handheld, dither, chromatic aberration, lens distortion, glitch, vignette, scanlines
- In-browser WebM export
