/**
 * Current camera state when in flyover edit mode.
 * Canvas writes every frame; Sidebar reads on "Set start/Set end" click.
 */
export interface FlyoverEditCameraState {
  position: [number, number, number]
  rotation: [number, number, number]
  fov: number
}

let current: FlyoverEditCameraState | null = null

export function setFlyoverEditCamera(state: FlyoverEditCameraState | null): void {
  current = state
}

export function getFlyoverEditCamera(): FlyoverEditCameraState | null {
  return current
}
