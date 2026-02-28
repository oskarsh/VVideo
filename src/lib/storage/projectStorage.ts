/**
 * High-level project persistence API.
 * Serializes blob: URLs → OPFS files (opfs: keys) for storage,
 * and deserializes back on load.
 */
import type { Project, Pane } from '@/types'
import { isOpfsSupported, saveMediaFile, loadMediaFile, deleteProjectMedia } from './opfs'
import { idbSave, idbLoad, idbLoadAll, idbDelete, type PersistedProject } from './indexeddb'
export type { PersistedProject }

// ---------------------------------------------------------------------------
// Helpers: collect / replace blob URLs in a Project
// ---------------------------------------------------------------------------

interface BlobEntry {
  key: string
  url: string
}

/** Collect all blob: URLs from a project with their OPFS key names. */
function collectBlobEntries(project: Project): BlobEntry[] {
  const entries: BlobEntry[] = []

  if (project.backgroundVideoUrl?.startsWith('blob:')) {
    entries.push({ key: 'background', url: project.backgroundVideoUrl })
  }
  if (project.planeVideoUrl?.startsWith('blob:')) {
    entries.push({ key: 'planeMedia', url: project.planeVideoUrl })
  }
  if (project.planeMedia?.url.startsWith('blob:')) {
    entries.push({ key: 'planeMedia', url: project.planeMedia.url })
  }
  for (const pane of project.panes ?? []) {
    if (pane.media.url.startsWith('blob:')) {
      entries.push({ key: `pane-${pane.id}`, url: pane.media.url })
    }
  }

  // Deduplicate by key (same blob for planeVideoUrl + planeMedia)
  const seen = new Set<string>()
  return entries.filter((e) => {
    if (seen.has(e.key)) return false
    seen.add(e.key)
    return true
  })
}

/** Replace blob: URLs in a project with opfs:{key} strings (for serialization). */
function serializeProject(project: Project, blobToKey: Map<string, string>): Project {
  const replace = (url: string | null | undefined): string | null | undefined => {
    if (!url) return url
    return blobToKey.get(url) ?? url
  }

  const panes: Pane[] | undefined = project.panes?.map((pane) => ({
    ...pane,
    media: { ...pane.media, url: replace(pane.media.url) as string },
  }))

  return {
    ...project,
    backgroundVideoUrl: replace(project.backgroundVideoUrl) as string | null,
    planeVideoUrl: replace(project.planeVideoUrl) as string | null | undefined,
    planeMedia: project.planeMedia
      ? { ...project.planeMedia, url: replace(project.planeMedia.url) as string }
      : project.planeMedia,
    panes,
  }
}

/** Replace opfs:{key} strings in a project with live blob: URLs. */
function deserializeProject(project: Project, keyToUrl: Map<string, string>): Project {
  const replace = (url: string | null | undefined): string | null | undefined => {
    if (!url) return url
    if (url.startsWith('opfs:')) return keyToUrl.get(url.slice(5)) ?? url
    return url
  }

  const panes: Pane[] | undefined = project.panes?.map((pane) => ({
    ...pane,
    media: { ...pane.media, url: replace(pane.media.url) as string },
  }))

  return {
    ...project,
    backgroundVideoUrl: replace(project.backgroundVideoUrl) as string | null,
    planeVideoUrl: replace(project.planeVideoUrl) as string | null | undefined,
    planeMedia: project.planeMedia
      ? { ...project.planeMedia, url: replace(project.planeMedia.url) as string }
      : project.planeMedia,
    panes,
  }
}

/** Collect all blob: URLs currently in a project (for cleanup on project switch). */
export function getProjectBlobUrls(project: Project): string[] {
  const urls: string[] = []
  if (project.backgroundVideoUrl?.startsWith('blob:')) urls.push(project.backgroundVideoUrl)
  if (project.planeVideoUrl?.startsWith('blob:')) urls.push(project.planeVideoUrl)
  if (project.planeMedia?.url.startsWith('blob:')) urls.push(project.planeMedia.url)
  for (const pane of project.panes ?? []) {
    if (pane.media.url.startsWith('blob:')) urls.push(pane.media.url)
  }
  return urls
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function saveCurrentProject(project: Project, canvas?: HTMLCanvasElement | null): Promise<void> {
  try {
    const entries = collectBlobEntries(project)
    const blobToKey = new Map<string, string>()

    if (isOpfsSupported()) {
      await Promise.all(
        entries.map(async ({ key, url }) => {
          try {
            const resp = await fetch(url)
            const blob = await resp.blob()
            await saveMediaFile(project.id, key, blob)
            blobToKey.set(url, `opfs:${key}`)
          } catch {
            // If fetch fails (e.g. revoked URL), skip this media
          }
        })
      )
    }

    const serialized = serializeProject(project, blobToKey)
    const totalDurationSeconds = project.scenes.reduce((s, sc) => s + sc.durationSeconds, 0)

    let thumbnailDataUrl: string | undefined
    try {
      if (canvas) thumbnailDataUrl = canvas.toDataURL('image/webp', 0.6)
    } catch {
      // cross-origin or tainted canvas — skip thumbnail
    }

    const record: PersistedProject = {
      id: project.id,
      name: project.name,
      updatedAt: new Date().toISOString(),
      thumbnailDataUrl,
      sceneCount: project.scenes.length,
      totalDurationSeconds,
      projectJson: JSON.stringify(serialized),
    }

    await idbSave(record)
  } catch (err) {
    console.warn('[projectStorage] save failed:', err)
  }
}

export async function loadSavedProject(id: string): Promise<{ project: Project; blobUrls: string[] } | null> {
  try {
    const record = await idbLoad(id)
    if (!record) return null

    const project: Project = JSON.parse(record.projectJson)

    // Find all opfs: keys in the project
    const opfsKeys = new Set<string>()
    const scanStr = (url: string | null | undefined) => {
      if (url?.startsWith('opfs:')) opfsKeys.add(url.slice(5))
    }
    scanStr(project.backgroundVideoUrl)
    scanStr(project.planeVideoUrl)
    scanStr(project.planeMedia?.url)
    for (const pane of project.panes ?? []) scanStr(pane.media.url)

    const keyToUrl = new Map<string, string>()
    const blobUrls: string[] = []

    if (isOpfsSupported()) {
      await Promise.all(
        Array.from(opfsKeys).map(async (key) => {
          const blob = await loadMediaFile(id, key)
          if (blob) {
            const url = URL.createObjectURL(blob)
            keyToUrl.set(key, url)
            blobUrls.push(url)
          }
        })
      )
    }

    const patched = deserializeProject(project, keyToUrl)
    return { project: patched, blobUrls }
  } catch (err) {
    console.warn('[projectStorage] load failed:', err)
    return null
  }
}

export async function listSavedProjects(): Promise<PersistedProject[]> {
  try {
    const all = await idbLoadAll()
    return all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  } catch {
    return []
  }
}

export async function deleteSavedProject(id: string): Promise<void> {
  await Promise.all([idbDelete(id), deleteProjectMedia(id)])
}
