# Screenshot workflow (prototype)

**Easy to remove:** grep for `SCREENSHOT_PROTOTYPE` in the codebase to find all related code.

## Overview

One screenshot per changelog release for **visual** components only. Screenshots appear in the "What's new" (Changelog) modal next to each release that has one. Non-visual items (bug fixes, behavior changes, removals) are skipped.

## Automated capture

```bash
# Build and start preview (or use dev server on :5173)
npm run build && npm run preview

# In another terminal:
BASE_URL=http://localhost:4173 npm run capture-changelog
```

Output: `public/screenshots/changelog-{version}/screenshot.png` (e.g. 2.0.8, 2.0.4).

The script runs with a visible browser by default so WebGL renders correctly (no black screenshots).

## Last 5 releases (visual mapping)

| Version | Summary | Visual? | Target |
|---------|---------|--------|--------|
| 2.0.8 | Timeline keyframe selection | ✓ | Timeline keyframe lane |
| 2.0.7 | Handheld shake during playback | ✗ | — |
| 2.0.6 | Remove Animate over scene | ✗ | — |
| 2.0.5 | Fix camera drift | ✗ | — |
| 2.0.4 | Depth of field focus/range | ✓ | DoF panel |

## Adding a new screenshot target

1. Add `screenshotPath` to the release in `src/changelog.ts`.
2. Add a target in `scripts/capture-changelog-screenshots.mjs`:
   - `selector`: `[data-screenshot-target="..."]` on the component
   - `setup`: navigate, click to open panels, etc.
3. Add `data-screenshot-target` or `data-screenshot-open` to the relevant component.

## Selectors for manual capture

Open the app, then in DevTools console:

```js
document.querySelector('[data-screenshot-target="timeline"]')
document.querySelector('[data-screenshot-target="timeline-keyframes"]')
document.querySelector('[data-screenshot-open="dof"]')
document.querySelector('[data-screenshot-target="dof-panel"]')
```
