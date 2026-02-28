/** OPFS (Origin Private File System) primitives for storing media blobs per project. */

export function isOpfsSupported(): boolean {
  return typeof navigator !== 'undefined' && 'storage' in navigator && 'getDirectory' in navigator.storage
}

async function getProjectDir(projectId: string): Promise<FileSystemDirectoryHandle> {
  const root = await navigator.storage.getDirectory()
  return root.getDirectoryHandle(`media-${projectId}`, { create: true })
}

export async function saveMediaFile(projectId: string, key: string, blob: Blob): Promise<void> {
  const dir = await getProjectDir(projectId)
  const fileHandle = await dir.getFileHandle(key, { create: true })
  const writable = await fileHandle.createWritable()
  await writable.write(blob)
  await writable.close()
}

export async function loadMediaFile(projectId: string, key: string): Promise<Blob | null> {
  try {
    const dir = await getProjectDir(projectId)
    const fileHandle = await dir.getFileHandle(key)
    return await fileHandle.getFile()
  } catch {
    return null
  }
}

export async function deleteProjectMedia(projectId: string): Promise<void> {
  try {
    const root = await navigator.storage.getDirectory()
    await root.removeEntry(`media-${projectId}`, { recursive: true })
  } catch {
    // directory may not exist
  }
}
