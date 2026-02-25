#!/usr/bin/env node
/**
 * Capture one screenshot per changelog release for visual components.
 * Run: BASE_URL=http://localhost:4173 npm run capture-changelog
 *
 * SCREENSHOT_PROTOTYPE: remove with ChangelogModal data attributes
 *
 * Last 5 releases analysis (visual only):
 * - 2.0.8: Timeline keyframe selection → timeline with keyframes
 * - 2.0.7: Handheld shake behavior → skip (not visual)
 * - 2.0.6: Removed Animate over scene → skip (removal)
 * - 2.0.5: Fix camera drift → skip (bug fix)
 * - 2.0.4: Depth of field focus → DoF panel
 */
import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173'
const OUTPUT_BASE = 'public/screenshots'

/** Version → { selector, setup: async (page) => void } */
const SCREENSHOT_TARGETS = {
  '2.0.8': {
    selector: '[data-screenshot-target="timeline-keyframes"]',
    fallbackSelector: '[data-screenshot-target="timeline"]',
    async setup(page) {
      await page.goto(`${BASE_URL}?screenshot=2.0.8`, { waitUntil: 'load', timeout: 30000 })
      await page.waitForSelector('[data-screenshot-target="timeline"]', { timeout: 25000, state: 'attached' })
      await new Promise((r) => setTimeout(r, 500))
      const kfLane = await page.$('[data-screenshot-target="timeline-keyframes"]')
      if (kfLane) {
        await kfLane.click()
        await new Promise((r) => setTimeout(r, 400))
      }
    },
  },
  '2.0.4': {
    selector: '[data-screenshot-target="dof-panel"]',
    async setup(page) {
      await page.goto(BASE_URL, { waitUntil: 'load', timeout: 30000 })
      await page.waitForSelector('[data-screenshot-open="dof"]', { timeout: 25000, state: 'attached' })
      await page.click('[data-screenshot-open="dof"]')
      await page.waitForSelector('[data-screenshot-target="dof-panel"]', { timeout: 5000 })
      await new Promise((r) => setTimeout(r, 200))
    },
  },
}

async function main() {
  const browser = await chromium.launch({
    headless: false, // headed by default so WebGL renders correctly
  })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 1100 },
    deviceScaleFactor: 2,
  })

  await context.addInitScript(() => {
    localStorage.setItem('vvideo-welcome-seen', '1')
    localStorage.setItem('vvideo-changelog-seen', '2.0.8') // prevent changelog auto-open
  })

  const page = await context.newPage()

  for (const [version, config] of Object.entries(SCREENSHOT_TARGETS)) {
    const outDir = path.join(OUTPUT_BASE, `changelog-${version}`)
    fs.mkdirSync(outDir, { recursive: true })
    const outPath = path.join(outDir, 'screenshot.png')

    try {
      await config.setup(page)
      const el = await page.$(config.selector) ?? await page.$(config.fallbackSelector || config.selector)
      if (el) {
        await el.screenshot({ path: outPath, timeout: 5000 })
        console.log(`  ${version} → ${outPath}`)
      } else {
        console.warn(`  ${version} → selector not found, skipping`)
        if (process.env.DEBUG) {
          await page.screenshot({ path: path.join(outDir, '_debug.png') })
          const html = await page.content()
          fs.writeFileSync(path.join(outDir, '_debug.html'), html.slice(0, 5000))
        }
      }
    } catch (err) {
      console.warn(`  ${version} → error:`, err.message)
      if (process.env.DEBUG) {
        try {
          await page.screenshot({ path: path.join(outDir, '_error.png') })
        } catch {}
      }
    }
  }

  await browser.close()
  console.log(`Done. Screenshots in ${OUTPUT_BASE}/`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
