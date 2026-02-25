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
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 720, height: 900 } })

  console.log('Navigating to', BASE_URL)
  await page.goto(BASE_URL, { waitUntil: 'networkidle' })

  // Click Changelog to open modal
  const changelogBtn = page.getByRole('button', { name: 'Changelog' })
  await changelogBtn.click()

  // Wait for modal with screenshot markers
  await page.waitForSelector('[data-screenshot-changelog]', { timeout: 5000 })

  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  // Screenshot each item
  const items = await page.$$('[data-screenshot-item]')
  for (let i = 0; i < items.length; i++) {
    const file = path.join(OUTPUT_DIR, `item-${i + 1}.png`)
    await items[i].screenshot({ path: file })
    console.log('  ', file)
  }

  // Full release block
  const releaseBlock = await page.$('[data-screenshot-release]')
  if (releaseBlock) {
    const fullPath = path.join(OUTPUT_DIR, 'full-release.png')
    await releaseBlock.screenshot({ path: fullPath })
    console.log('  ', fullPath)
  }

  await browser.close()
  console.log(`Done. ${items.length} items + full release → ${OUTPUT_DIR}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
