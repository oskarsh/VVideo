# Screenshot workflow (prototype)

**Easy to remove:** grep for `SCREENSHOT_PROTOTYPE` in the codebase to find all related code.

## Selectors for changelog (latest release only)

Open the app, open the Changelog modal, then in DevTools console or a capture script:

```js
// All 10 items of the latest release (2.0.0)
document.querySelectorAll('[data-screenshot-item]')

// Specific item (1–10)
document.querySelector('[data-screenshot-item="1"]')

// The whole latest release block
document.querySelector('[data-screenshot-release]')

// The list container
document.querySelector('[data-screenshot-changelog]')
```

## Puppeteer example

```js
const items = await page.$$('[data-screenshot-item]')
for (let i = 0; i < items.length; i++) {
  await items[i].screenshot({ path: `changelog-item-${i + 1}.png` })
}
```
