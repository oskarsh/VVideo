# Screenshot workflow (prototype)

**Easy to remove:** grep for `SCREENSHOT_PROTOTYPE` in the codebase to find all related code.

## Automated capture

```bash
# Build and start preview (or use dev server on :5173)
npm run build && npm run preview

# In another terminal:
BASE_URL=http://localhost:4173 npm run capture-changelog
```

Output: `docs/screenshots/changelog-2.0.0/modal.png` (full page with changelog modal).

**Note:** Headless Chromium may render a black canvas (WebGL). For visible screenshots, run with a real browser:

```bash
HEADED=1 BASE_URL=http://localhost:4173 npm run capture-changelog
```

## Selectors for manual capture

Open the app, open the Changelog modal, then in DevTools console:

```js
document.querySelectorAll('[data-screenshot-item]')
document.querySelector('[data-screenshot-release]')
document.querySelector('[data-screenshot-changelog]')
```
