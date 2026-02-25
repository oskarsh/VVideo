#!/usr/bin/env node
/**
 * Capture screenshots of the latest changelog release for docs.
 * Run: npm run capture-changelog (with dev server running on :5173)
 *
 * SCREENSHOT_PROTOTYPE: remove with ChangelogModal data attributes
 */
import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173'
const OUTPUT_DIR = 'docs/screenshots/changelog-2.0.0'

async function main() {
  const browser = await chromium.launch({
    args: ['--use-gl=egl', '--enable-gpu'],
    headless: process.env.HEADED ? false : true, // HEADED=1 for visible browser
  })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2, // sharper screenshots
  })
  const page = await context.newPage()

  // Skip Welcome modal; don't set changelog-seen so changelog auto-opens for new version
  await context.addInitScript(() => {
    localStorage.setItem('vvideo-welcome-seen', '1')
    localStorage.setItem('vvideo-changelog-seen', '1.0.0') // old version = changelog auto-shows
  })

  console.log('Navigating to', BASE_URL)
  await page.goto(BASE_URL, { waitUntil: 'load', timeout: 20000 })
  // Wait for React to mount (header appears when app is ready)
  // Changelog auto-opens when version is new (we cleared changelog-seen in init)
  await page.waitForSelector('[data-screenshot-changelog]', { timeout: 25000 })
  await new Promise((r) => setTimeout(r, 500)) // stabilize

  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  // Full page screenshot (changelog modal overlays the app)
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'modal.png') })
  console.log('  modal.png')

  // Screenshot each item (li elements in the changelog list)
  const items = await page.$$('ul[data-screenshot-changelog] li')
  console.log('  Items found:', items.length)

  for (let i = 0; i < items.length; i++) {
    const file = path.join(OUTPUT_DIR, `item-${i + 1}.png`)
    try {
      await items[i].screenshot({ path: file, timeout: 3000 })
      console.log('  ', file)
    } catch (e) {
      console.warn('  Skip item', i + 1, e.message)
    }
  }

  // Full release block
  const releaseBlock = await page.$('[data-screenshot-release]')
  if (releaseBlock) {
    try {
      await releaseBlock.screenshot({ path: path.join(OUTPUT_DIR, 'full-release.png'), timeout: 3000 })
      console.log('  full-release.png')
    } catch {
      // ignore
    }
  }

  await browser.close()
  console.log(`Done. ${items.length} items + full release → ${OUTPUT_DIR}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
