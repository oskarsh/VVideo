import { useRef, useEffect, useState, Suspense, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import {
  EffectComposer,
  DepthOfField,
  Noise,
  ChromaticAberration,
  Glitch,
  Vignette,
  Scanline,
} from '@react-three/postprocessing'
import { GlitchMode } from 'postprocessing'
import * as THREE from 'three'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'
import { useStore } from '@/store'
import { setFlyoverEditCamera } from '@/flyoverCameraRef'
import { getFlyKeys, setFlyKey, isFlyKey } from '@/flyKeys'
import { applyFlyoverEasing } from '@/easing'
import { DitherEffect } from '@/effects/DitherEffect'
import { LensDistortion } from '@/effects/LensDistortionEffect'
import type {
  Scene as SceneType,
  SceneEffectZoom,
  SceneEffectGrain,
  SceneEffectDoF,
  SceneEffectHandheld,
  SceneEffectDither,
  SceneEffectChromaticAberration,
  SceneEffectLensDistortion,
  SceneEffectGlitch,
  SceneEffectVignette,
  SceneEffectScanline,
} from '@/types'
import { getPlaneMedia } from '@/types'
import { getHandheldOffsets } from '@/utils/smoothNoise'

const FOV_DEG = 50

function BackgroundVideo({
  url,
  trim,
  sceneLocalTime,
  sceneDuration,
  scrubTime,
  playbackMode,
  speed,
}: {
  url: string
  trim: { start: number; end: number } | null
  sceneLocalTime: number
  sceneDuration: number
  viewAspect: number
  scrubTime?: number | null
  playbackMode: 'normal' | 'fitScene'
  speed: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [texture, setTexture] = useState<THREE.VideoTexture | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const video = document.createElement('video')
    video.src = url
    video.crossOrigin = 'anonymous'
    video.loop = true
    video.muted = true
    video.volume = 0
    video.playsInline = true
    video.play().catch(() => { })
    videoRef.current = video
    const tex = new THREE.VideoTexture(video)
    tex.minFilter = THREE.LinearFilter
    tex.magFilter = THREE.LinearFilter
    setTexture(tex)
    return () => {
      video.pause()
      video.src = ''
      tex.dispose()
      setTexture(null)
      videoRef.current = null
    }
  }, [url])

  useFrame(() => {
    const video = videoRef.current
    if (!video || video.readyState < 2) return
    if (scrubTime != null) {
      video.currentTime = Math.max(0, Math.min(scrubTime, video.duration || 0))
      return
    }
    const dur = Math.max(0.001, video.duration || 1)
    if (playbackMode === 'fitScene' && sceneDuration > 0) {
      if (trim) {
        const span = Math.max(0.001, trim.end - trim.start)
        const t = Math.min(1, sceneLocalTime / sceneDuration)
        video.currentTime = trim.start + (t * span) % span
      } else {
        const t = Math.min(1, sceneLocalTime / sceneDuration)
        video.currentTime = (t * dur) % dur
      }
    } else {
      const effectiveTime = sceneLocalTime * Math.max(0.1, speed)
      if (trim) {
        const span = Math.max(0.001, trim.end - trim.start)
        video.currentTime = trim.start + (effectiveTime % span)
      } else {
        video.currentTime = effectiveTime % dur
      }
    }
  })

  if (!texture) return null
  // Sphere skybox: camera is inside a large sphere so the video is visible from any angle.
  // Radius must be larger than max camera distance (OrbitControls maxDistance=20, flyover can go further).
  const skyRadius = 200
  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <sphereGeometry args={[skyRadius, 32, 24]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  )
}

const BASE_PLANE_SIZE = 1.2

function PlaneVideo({
  url,
  trim,
  sceneLocalTime,
  sceneDuration,
  scrubTime,
  playbackMode,
  speed,
  extrusionDepth,
}: {
  url: string
  trim: { start: number; end: number } | null
  sceneLocalTime: number
  sceneDuration: number
  scrubTime?: number | null
  playbackMode: 'normal' | 'fitScene'
  speed: number
  extrusionDepth: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [texture, setTexture] = useState<THREE.VideoTexture | null>(null)
  const [videoAspect, setVideoAspect] = useState<number>(16 / 9)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const video = document.createElement('video')
    video.src = url
    video.crossOrigin = 'anonymous'
    video.loop = true
    video.muted = true
    video.volume = 0
    video.playsInline = true
    const onLoadedMetadata = () => {
      const w = video.videoWidth || 16
      const h = video.videoHeight || 9
      setVideoAspect(w / h)
    }
    video.addEventListener('loadedmetadata', onLoadedMetadata)
    video.play().catch(() => { })
    videoRef.current = video
    const tex = new THREE.VideoTexture(video)
    tex.minFilter = THREE.LinearFilter
    tex.magFilter = THREE.LinearFilter
    setTexture(tex)
    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata)
      video.pause()
      video.src = ''
      tex.dispose()
      setTexture(null)
      videoRef.current = null
    }
  }, [url])

  useFrame(() => {
    const video = videoRef.current
    if (!video || video.readyState < 2) return
    if (scrubTime != null) {
      video.currentTime = Math.max(0, Math.min(scrubTime, video.duration || 0))
      return
    }
    const dur = Math.max(0.001, video.duration || 1)
    if (playbackMode === 'fitScene' && sceneDuration > 0) {
      if (trim) {
        const span = Math.max(0.001, trim.end - trim.start)
        const t = Math.min(1, sceneLocalTime / sceneDuration)
        video.currentTime = trim.start + (t * span) % span
      } else {
        const t = Math.min(1, sceneLocalTime / sceneDuration)
        video.currentTime = (t * dur) % dur
      }
    } else {
      const effectiveTime = sceneLocalTime * Math.max(0.1, speed)
      if (trim) {
        const span = Math.max(0.001, trim.end - trim.start)
        video.currentTime = trim.start + (effectiveTime % span)
      } else {
        video.currentTime = effectiveTime % dur
      }
    }
  })

  if (!texture) return null
  const scaleX = videoAspect >= 1 ? BASE_PLANE_SIZE : BASE_PLANE_SIZE * videoAspect
  const scaleY = videoAspect >= 1 ? BASE_PLANE_SIZE / videoAspect : BASE_PLANE_SIZE
  const depth = Math.max(0, extrusionDepth)
  return (
    <mesh ref={meshRef} position={[0, 0, 0]} scale={[scaleX, scaleY, depth > 0 ? depth : 1]}>
      {depth > 0 ? (
        <boxGeometry args={[1, 1, 1]} />
      ) : (
        <planeGeometry args={[1, 1]} />
      )}
      <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
    </mesh>
  )
}

function PlaneImage({
  url,
  extrusionDepth,
}: {
  url: string
  extrusionDepth: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const textureRef = useRef<THREE.Texture | null>(null)
  const [texture, setTexture] = useState<THREE.Texture | null>(null)
  const [imageAspect, setImageAspect] = useState<number>(16 / 9)

  useEffect(() => {
    let cancelled = false
    const loader = new THREE.TextureLoader()
    loader.load(
      url,
      (tex) => {
        if (cancelled) {
          tex.dispose()
          return
        }
        tex.colorSpace = THREE.SRGBColorSpace
        tex.minFilter = THREE.LinearFilter
        tex.magFilter = THREE.LinearFilter
        textureRef.current = tex
        setTexture(tex)
        const img = tex.image as HTMLImageElement
        if (img?.naturalWidth && img.naturalHeight) {
          setImageAspect(img.naturalWidth / img.naturalHeight)
        }
      },
      undefined,
      () => {
        if (!cancelled) setTexture(null)
      }
    )
    return () => {
      cancelled = true
      textureRef.current?.dispose()
      textureRef.current = null
      setTexture(null)
    }
  }, [url])

  if (!texture) return null
  const scaleX = imageAspect >= 1 ? BASE_PLANE_SIZE : BASE_PLANE_SIZE * imageAspect
  const scaleY = imageAspect >= 1 ? BASE_PLANE_SIZE / imageAspect : BASE_PLANE_SIZE
  const depth = Math.max(0, extrusionDepth)
  return (
    <mesh ref={meshRef} position={[0, 0, 0]} scale={[scaleX, scaleY, depth > 0 ? depth : 1]}>
      {depth > 0 ? (
        <boxGeometry args={[1, 1, 1]} />
      ) : (
        <planeGeometry args={[1, 1]} />
      )}
      <meshBasicMaterial
        map={texture}
        side={THREE.DoubleSide}
        transparent
        alphaTest={0.01}
        depthWrite={true}
      />
    </mesh>
  )
}

function PlaneSVG({
  url,
  extrusionDepth,
  colorOverride,
}: {
  url: string
  extrusionDepth: number
  colorOverride?: string | null
}) {
  const groupRef = useRef<THREE.Group>(null)
  const [svgState, setSvgState] = useState<{
    meshes: Array<{
      geometry: THREE.BufferGeometry
      material: THREE.Material
      position: [number, number, number]
    }>
    scale: number
  } | null>(null)
  const meshesRef = useRef<typeof svgState>(null)

  useEffect(() => {
    let cancelled = false
    const loader = new SVGLoader()
    loader.load(
      url,
      (data) => {
        if (cancelled) return
        if (meshesRef.current?.meshes) {
          meshesRef.current.meshes.forEach(({ geometry, material }) => {
            geometry.dispose()
            material.dispose()
          })
          meshesRef.current = null
        }
        const paths: Array<{ shapes: THREE.Shape[]; color: THREE.Color }> = []
        for (const path of data.paths) {
          const shapes = path.toShapes(true)
          if (shapes.length > 0) {
            paths.push({ shapes, color: path.color.clone() })
          }
        }
        const svg = data.xml
        let viewBox = { minX: 0, minY: 0, width: 100, height: 100 }
        const vb = svg.getAttribute('viewBox')
        if (vb) {
          const parts = vb.split(/\s+/).map(Number)
          if (parts.length >= 4 && parts.every(Number.isFinite)) {
            viewBox = { minX: parts[0], minY: parts[1], width: parts[2], height: parts[3] }
          }
        } else if (svg.hasAttribute('width') && svg.hasAttribute('height')) {
          viewBox.width = parseFloat(svg.getAttribute('width')!) || 100
          viewBox.height = parseFloat(svg.getAttribute('height')!) || 100
        }
        const vbW = viewBox.width || 1
        const vbH = viewBox.height || 1
        const scale = (BASE_PLANE_SIZE * 0.8) / Math.max(vbW, vbH)
        const offsetX = -viewBox.minX - vbW / 2
        const offsetY = -viewBox.minY - vbH / 2
        const depth = Math.max(0, extrusionDepth)
        const overrideColor =
          colorOverride != null && colorOverride !== ''
            ? new THREE.Color(colorOverride)
            : null
        const built: Array<{
          geometry: THREE.BufferGeometry
          material: THREE.Material
          position: [number, number, number]
        }> = []
        for (const { shapes, color } of paths) {
          const geometry =
            depth > 0
              ? new THREE.ExtrudeGeometry(shapes, { depth: depth * 0.5, bevelEnabled: false })
              : new THREE.ShapeGeometry(shapes)
          const material = new THREE.MeshBasicMaterial({
            color: overrideColor ?? color,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 1,
            alphaTest: 0.01,
          })
          built.push({
            geometry,
            material,
            position: [offsetX, offsetY, depth > 0 ? -depth * 0.25 : 0],
          })
        }
        const state = { meshes: built, scale }
        meshesRef.current = state
        setSvgState(state)
      },
      undefined,
      () => {
        if (!cancelled) setSvgState(null)
      }
    )
    return () => {
      cancelled = true
      if (meshesRef.current?.meshes) {
        meshesRef.current.meshes.forEach(({ geometry, material }) => {
          geometry.dispose()
          material.dispose()
        })
        meshesRef.current = null
      }
    }
  }, [url, extrusionDepth, colorOverride])

  if (!svgState || svgState.meshes.length === 0) return null
  const { meshes, scale } = svgState
  return (
    <group ref={groupRef} position={[0, 0, 0]} scale={[scale, -scale, 1]}>
      {meshes.map(({ geometry, material, position }, i) => (
        <mesh key={i} geometry={geometry} material={material} position={position} />
      ))}
    </group>
  )
}

function CameraRig({
  sceneData,
  time,
  duration,
  disabled,
}: {
  sceneData: SceneType
  time: number
  duration: number
  disabled?: boolean
}) {
  const { camera } = useThree()
  const zoomEffect = sceneData.effects.find((e): e is SceneEffectZoom => e.type === 'zoom')
  const zoomStart = zoomEffect?.startScale ?? 1
  const zoomEnd = zoomEffect?.endScale ?? 1
  const t = duration > 0 ? Math.min(1, time / duration) : 0
  const zoom = zoomStart + (zoomEnd - zoomStart) * t
  const flyover = sceneData.flyover
  const flyEnabled = flyover?.enabled && flyover.start && flyover.end
  const easedT = applyFlyoverEasing(t, flyover?.easing)

  const handheldEffect = sceneData.effects.find(
    (e): e is SceneEffectHandheld => e.type === 'handheld'
  )
  const h = handheldEffect
  const intensity =
    (h?.intensityStart ?? (h as { intensity?: number })?.intensity ?? 0) +
    ((h?.intensityEnd ?? (h as { intensity?: number })?.intensity ?? 0) - (h?.intensityStart ?? (h as { intensity?: number })?.intensity ?? 0)) * t
  const rotationShake =
    (h?.rotationShakeStart ?? (h as { rotationShake?: number })?.rotationShake ?? 0) +
    ((h?.rotationShakeEnd ?? (h as { rotationShake?: number })?.rotationShake ?? 0) - (h?.rotationShakeStart ?? (h as { rotationShake?: number })?.rotationShake ?? 0)) * t
  const speed =
    (h?.speedStart ?? (h as { speed?: number })?.speed ?? 1) +
    ((h?.speedEnd ?? (h as { speed?: number })?.speed ?? 1) - (h?.speedStart ?? (h as { speed?: number })?.speed ?? 1)) * t
  const handheldOn =
    handheldEffect?.enabled &&
    Number.isFinite(intensity) &&
    Number.isFinite(rotationShake) &&
    Number.isFinite(speed)

  useFrame(() => {
    if (disabled) return
    let pos: [number, number, number]
    let rot: [number, number, number]
    let fov = FOV_DEG

    if (flyEnabled && flyover?.start?.position && flyover?.end?.position) {
      const s = flyover.start
      const e = flyover.end
      pos = [
        s.position[0] + (e.position[0] - s.position[0]) * easedT,
        s.position[1] + (e.position[1] - s.position[1]) * easedT,
        s.position[2] + (e.position[2] - s.position[2]) * easedT,
      ]
      rot = [
        s.rotation[0] + (e.rotation[0] - s.rotation[0]) * easedT,
        s.rotation[1] + (e.rotation[1] - s.rotation[1]) * easedT,
        s.rotation[2] + (e.rotation[2] - s.rotation[2]) * easedT,
      ]
      fov = (s.fov ?? FOV_DEG) + ((e.fov ?? FOV_DEG) - (s.fov ?? FOV_DEG)) * easedT
    } else {
      const s = flyover?.start ?? { position: [0, 0, 5], rotation: [0, 0, 0] }
      pos = s.position
      rot = s.rotation
    }
    if (!pos.every(Number.isFinite) || !rot.every(Number.isFinite)) return

    if (handheldOn && handheldEffect) {
      const offsets = getHandheldOffsets(time, intensity, rotationShake, speed)
      pos = [
        pos[0] + offsets.position[0],
        pos[1] + offsets.position[1],
        pos[2] + offsets.position[2],
      ]
      rot = [
        rot[0] + offsets.rotation[0],
        rot[1] + offsets.rotation[1],
        rot[2] + offsets.rotation[2],
      ]
    }

    camera.position.set(pos[0] * zoom, pos[1] * zoom, pos[2] * zoom)
    camera.rotation.set(rot[0], rot[1], rot[2])
    if ('fov' in camera) {
      camera.fov = Number.isFinite(fov) ? fov : FOV_DEG
      camera.updateProjectionMatrix()
    }
  })

  return null
}

const CAMERA_EPS = 1e-4
const FOV_EPS = 0.5

function FlyoverEditSync() {
  const { camera } = useThree()
  const scene = useStore((s) => s.project.scenes[s.currentSceneIndex])
  const setStoreCamera = useStore((s) => s.setFlyoverEditCamera)
  const jumpToStart = useStore((s) => s.flyoverJumpToStart)
  const setJumpToStart = useStore((s) => s.setFlyoverJumpToStart)
  const justEnabled = useRef(true)
  const lastStored = useRef<{ position: [number, number, number]; rotation: [number, number, number]; fov: number } | null>(null)

  useFrame(() => {
    if (!camera || !('fov' in camera)) return
    const start = scene?.flyover?.start
    if (jumpToStart && start?.position && start?.rotation) {
      const [x, y, z] = start.position
      const [rx, ry, rz] = start.rotation
      if (Number.isFinite(x + y + z + rx + ry + rz)) {
        camera.position.set(x, y, z)
        camera.rotation.set(rx, ry, rz)
        camera.fov = start.fov != null && Number.isFinite(start.fov) ? start.fov : 50
        camera.updateProjectionMatrix()
        const state = {
          position: [x, y, z] as [number, number, number],
          rotation: [rx, ry, rz] as [number, number, number],
          fov: camera.fov,
        }
        setFlyoverEditCamera(state)
        lastStored.current = state
        setStoreCamera(state)
      }
      setJumpToStart(false)
    }
    if (justEnabled.current && start?.position && start?.rotation) {
      try {
        const [x, y, z] = start.position
        const [rx, ry, rz] = start.rotation
        if (Number.isFinite(x + y + z + rx + ry + rz)) {
          camera.position.set(x, y, z)
          camera.rotation.set(rx, ry, rz)
          camera.fov = start.fov != null && Number.isFinite(start.fov) ? start.fov : 50
          camera.updateProjectionMatrix()
        }
      } finally {
        justEnabled.current = false
      }
    }
    const pos: [number, number, number] = [camera.position.x, camera.position.y, camera.position.z]
    const rot: [number, number, number] = [camera.rotation.x, camera.rotation.y, camera.rotation.z]
    const fov = camera.fov
    setFlyoverEditCamera({ position: pos, rotation: rot, fov })
    const prev = lastStored.current
    const changed =
      !prev ||
      Math.abs(pos[0] - prev.position[0]) > CAMERA_EPS ||
      Math.abs(pos[1] - prev.position[1]) > CAMERA_EPS ||
      Math.abs(pos[2] - prev.position[2]) > CAMERA_EPS ||
      Math.abs(rot[0] - prev.rotation[0]) > CAMERA_EPS ||
      Math.abs(rot[1] - prev.rotation[1]) > CAMERA_EPS ||
      Math.abs(rot[2] - prev.rotation[2]) > CAMERA_EPS ||
      Math.abs(fov - prev.fov) > FOV_EPS
    if (changed) {
      lastStored.current = { position: pos, rotation: rot, fov }
      setStoreCamera({ position: pos, rotation: rot, fov })
    }
  })
  return null
}

const FLY_SPEED = 2.5
const ROTATE_SPEED = 1.8 // radians per second (IJKL)
const _forward = new THREE.Vector3()
const _right = new THREE.Vector3()

function WASDFly() {
  const { camera } = useThree()

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isFlyKey(e.code)) return
      e.preventDefault()
      setFlyKey(e.code, true)
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (!isFlyKey(e.code)) return
      e.preventDefault()
      setFlyKey(e.code, false)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      setFlyKey('KeyW', false)
      setFlyKey('KeyA', false)
      setFlyKey('KeyS', false)
      setFlyKey('KeyD', false)
      setFlyKey('KeyQ', false)
      setFlyKey('KeyE', false)
      setFlyKey('KeyI', false)
      setFlyKey('KeyJ', false)
      setFlyKey('KeyK', false)
      setFlyKey('KeyL', false)
    }
  }, [])

  useFrame((_, delta) => {
    const k = getFlyKeys()
    const anyMove = k.w || k.a || k.s || k.d || k.q || k.e
    const anyRotate = k.i || k.j || k.k || k.l
    if (!anyMove && !anyRotate) return
    if (!camera || !('fov' in camera)) return
    const dt = Number.isFinite(delta) && delta > 0 && delta < 1 ? delta : 1 / 60

    // WASD + Q/E: move only (forward, left, back, right, down, up)
    if (anyMove) {
      const move = FLY_SPEED * dt
      camera.getWorldDirection(_forward)
      if (k.e) camera.position.y += move
      if (k.q) camera.position.y -= move
      const lenSq = _forward.x * _forward.x + _forward.z * _forward.z
      if (lenSq >= 1e-10) {
        _right.set(_forward.z, 0, -_forward.x).normalize()
        if (k.w) camera.position.addScaledVector(_forward, move)
        if (k.s) camera.position.addScaledVector(_forward, -move)
        if (k.d) camera.position.addScaledVector(_right, move)
        if (k.a) camera.position.addScaledVector(_right, -move)
      }
    }

    // IJKL (vim): full camera rotation (pitch and yaw)
    if (anyRotate) {
      const rot = ROTATE_SPEED * dt
      if (k.j) camera.rotation.y += rot   // yaw left
      if (k.l) camera.rotation.y -= rot   // yaw right
      if (k.i) camera.rotation.x -= rot   // pitch up
      if (k.k) camera.rotation.x += rot   // pitch down
    }
  })

  return null
}

function ExportClearAlpha() {
  const { gl } = useThree()
  useEffect(() => {
    gl.setClearColor(0x000000, 0)
    return () => {
      gl.setClearColor(0x000000, 1)
    }
  }, [gl])
  return null
}

function SceneContent() {
  const project = useStore((s) => s.project)
  const currentSceneIndex = useStore((s) => s.currentSceneIndex)
  const currentTime = useStore((s) => s.currentTime)
  const flyoverEditMode = useStore((s) => s.flyoverEditMode)
  const isPlaying = useStore((s) => s.isPlaying)
  const isExporting = useStore((s) => s.isExporting)
  const exportRenderMode = useStore((s) => s.exportRenderMode)
  const trimScrub = useStore((s) => s.trimScrub)
  const scene = project.scenes[currentSceneIndex]
  if (!scene) return null

  const hideBackground = isExporting && exportRenderMode === 'plane-only'
  const sceneStartTime = project.scenes
    .slice(0, currentSceneIndex)
    .reduce((acc, s) => acc + s.durationSeconds, 0)
  const sceneLocalTime = currentTime - sceneStartTime
  const sceneDuration = scene.durationSeconds

  // When playing, always run the flyover animation; only use edit controls when paused
  const editControlsActive = flyoverEditMode && !isPlaying

  const { size } = useThree()
  const grainEffect = scene.effects.find((e): e is SceneEffectGrain => e.type === 'grain')
  const grainStart = grainEffect?.startOpacity ?? (grainEffect as { opacity?: number })?.opacity ?? 0.1
  const grainEnd = grainEffect?.endOpacity ?? (grainEffect as { opacity?: number })?.opacity ?? 0.1
  const grainOpacity = grainEffect
    ? grainStart + (grainEnd - grainStart) * (sceneDuration > 0 ? Math.min(1, sceneLocalTime / sceneDuration) : 0)
    : 0
  const dofEffect = scene.effects.find((e): e is SceneEffectDoF => e.type === 'dof')
  const dofEnabled = dofEffect?.enabled ?? true
  const d = dofEffect
  const lerp = (s: number, e: number) => s + (e - s) * (sceneDuration > 0 ? Math.min(1, sceneLocalTime / sceneDuration) : 0)
  const dofFocusDistance = lerp(
    d?.focusDistanceStart ?? (d as { focusDistance?: number })?.focusDistance ?? 0.015,
    d?.focusDistanceEnd ?? (d as { focusDistance?: number })?.focusDistance ?? 0.015
  )
  const dofFocalLength = lerp(
    d?.focalLengthStart ?? (d as { focalLength?: number })?.focalLength ?? 0.02,
    d?.focalLengthEnd ?? (d as { focalLength?: number })?.focalLength ?? 0.02
  )
  const dofFocusRange = lerp(
    d?.focusRangeStart ?? (d as { focusRange?: number })?.focusRange ?? 0.5,
    d?.focusRangeEnd ?? (d as { focusRange?: number })?.focusRange ?? 0.5
  )
  const dofBokehScale = lerp(
    d?.bokehScaleStart ?? (d as { bokehScale?: number })?.bokehScale ?? 6,
    d?.bokehScaleEnd ?? (d as { bokehScale?: number })?.bokehScale ?? 6
  )

  const ditherEffect = project.dither ?? scene.effects.find((e): e is SceneEffectDither => e.type === 'dither')
  const ditherEnabled = ditherEffect?.enabled ?? false
  const ditherPreset = ditherEffect?.preset ?? 'medium'
  const ditherMode = ditherEffect?.mode ?? 'bayer4'
  const ditherLevels =
    ditherPreset === 'custom'
      ? (ditherEffect?.levels ?? 8)
      : ditherPreset === 'subtle'
        ? 16
        : ditherPreset === 'medium'
          ? 8
          : 4
  const ditherModeIndex = { bayer2: 0, bayer4: 1, bayer8: 2, random: 3 }[ditherMode]
  const ditherIntensity = ditherEffect?.intensity ?? 1
  const ditherLuminanceOnly = ditherEffect?.luminanceOnly ?? false
  const ditherThresholdBias = ditherEffect?.thresholdBias ?? 0

  const chromaticEffect = scene.effects.find(
    (e): e is SceneEffectChromaticAberration => e.type === 'chromaticAberration'
  )
  const chromaticEnabled = chromaticEffect?.enabled ?? false
  const chromaticOffsetVal =
    chromaticEffect == null
      ? 0.005
      : lerp(
          chromaticEffect.offsetStart ?? (chromaticEffect as { offset?: number }).offset ?? 0.005,
          chromaticEffect.offsetEnd ?? (chromaticEffect as { offset?: number }).offset ?? 0.005
        )
  const chromaticOffset = useMemo(
    () => new THREE.Vector2(chromaticOffsetVal, chromaticOffsetVal * 0.5),
    [chromaticOffsetVal]
  )

  const lensEffect = scene.effects.find(
    (e): e is SceneEffectLensDistortion => e.type === 'lensDistortion'
  )
  const lensEnabled = lensEffect?.enabled ?? false
  const lensDistortionVal =
    lensEffect == null
      ? 0
      : lerp(
          lensEffect.distortionStart ?? (lensEffect as { distortion?: number }).distortion ?? 0,
          lensEffect.distortionEnd ?? (lensEffect as { distortion?: number }).distortion ?? 0
        )
  const lensDistortionVec = useMemo(
    () => new THREE.Vector2(lensDistortionVal, 0),
    [lensDistortionVal]
  )
  const lensPrincipalPoint = useMemo(() => new THREE.Vector2(0, 0), [])
  const lensFocalLength = useMemo(() => new THREE.Vector2(1, 1), [])

  const glitchEffect = scene.effects.find((e): e is SceneEffectGlitch => e.type === 'glitch')
  const glitchEnabled = glitchEffect?.enabled ?? false
  const glitchMode =
    glitchEffect?.mode === 'constantMild' ? GlitchMode.CONSTANT_MILD : GlitchMode.SPORADIC
  const glitchDelay = useMemo(
    () => new THREE.Vector2(glitchEffect?.delayMin ?? 1.5, glitchEffect?.delayMax ?? 3.5),
    [glitchEffect?.delayMin, glitchEffect?.delayMax]
  )
  const glitchDuration = useMemo(
    () => new THREE.Vector2(glitchEffect?.durationMin ?? 0.6, glitchEffect?.durationMax ?? 1),
    [glitchEffect?.durationMin, glitchEffect?.durationMax]
  )
  const glitchChromaticOffset = useMemo(
    () =>
      glitchEffect?.monochrome
        ? new THREE.Vector2(0, 0)
        : new THREE.Vector2(0.02, 0.02),
    [glitchEffect?.monochrome]
  )

  const vignetteEffect = scene.effects.find(
    (e): e is SceneEffectVignette => e.type === 'vignette'
  )
  const vignetteEnabled = vignetteEffect?.enabled ?? false

  const scanlineEffect = scene.effects.find(
    (e): e is SceneEffectScanline => e.type === 'scanline'
  )
  const scanlineEnabled = scanlineEffect?.enabled ?? false

  return (
    <>
      <CameraRig
        sceneData={scene}
        time={sceneLocalTime}
        duration={sceneDuration}
        disabled={editControlsActive}
      />
      <OrbitControls
        enabled={editControlsActive}
        enablePan={editControlsActive}
        enableZoom={editControlsActive}
        enableRotate={editControlsActive}
        minDistance={0.05}
        maxDistance={20}
        target={[0, 0, 0]}
      />
      {editControlsActive && (
        <>
          <FlyoverEditSync />
          <WASDFly />
        </>
      )}
      {!hideBackground &&
        (project.backgroundVideoUrl ? (
          <BackgroundVideo
            url={project.backgroundVideoUrl}
            trim={scene.backgroundTrim}
            sceneLocalTime={sceneLocalTime}
            sceneDuration={sceneDuration}
            viewAspect={project.aspectRatio[0] / project.aspectRatio[1]}
            scrubTime={trimScrub?.video === 'background' ? trimScrub.time : null}
            playbackMode={scene.backgroundVideoPlaybackMode ?? 'normal'}
            speed={scene.backgroundVideoSpeed ?? 1}
          />
        ) : (
          <mesh
            position={[0, 0, -2]}
            scale={[10 * (project.aspectRatio[0] / project.aspectRatio[1]), 10, 1]}
          >
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial color="#1a1a1a" side={THREE.DoubleSide} />
          </mesh>
        ))}
      {(() => {
        const planeMedia = getPlaneMedia(project)
        const extrusion = project.planeExtrusionDepth ?? 0
        if (!planeMedia) return null
        if (planeMedia.type === 'video') {
          return (
            <PlaneVideo
              url={planeMedia.url}
              trim={scene.planeTrim}
              sceneLocalTime={sceneLocalTime}
              sceneDuration={sceneDuration}
              scrubTime={trimScrub?.video === 'plane' ? trimScrub.time : null}
              playbackMode={scene.planeVideoPlaybackMode ?? 'normal'}
              speed={scene.planeVideoSpeed ?? 1}
              extrusionDepth={extrusion}
            />
          )
        }
        if (planeMedia.type === 'image') {
          return <PlaneImage url={planeMedia.url} extrusionDepth={extrusion} />
        }
        if (planeMedia.type === 'svg') {
          return (
            <PlaneSVG
              url={planeMedia.url}
              extrusionDepth={extrusion}
              colorOverride={project.planeSvgColor}
            />
          )
        }
        return null
      })()}
      <EffectComposer>
        {dofEnabled ? (
          <DepthOfField
            focusDistance={dofFocusDistance}
            focalLength={dofFocalLength}
            focusRange={dofFocusRange}
            bokehScale={dofBokehScale}
            height={size.height}
          />
        ) : (
          <></>
        )}
        <Noise opacity={grainOpacity} />
        <ChromaticAberration
          offset={chromaticOffset}
          radialModulation={chromaticEffect?.radialModulation ?? true}
          modulationOffset={0.15}
          opacity={chromaticEnabled ? 1 : 0}
        />
        <LensDistortion
          distortion={lensDistortionVec}
          principalPoint={lensPrincipalPoint}
          focalLength={lensFocalLength}
          opacity={lensEnabled ? 1 : 0}
        />
        <Glitch
          active={glitchEnabled}
          mode={glitchMode}
          ratio={glitchEffect?.ratio ?? 0.85}
          columns={glitchEffect?.columns ?? 0.05}
          delay={glitchDelay}
          duration={glitchDuration}
          chromaticAberrationOffset={glitchChromaticOffset}
        />
        <DitherEffect
          levels={ditherLevels}
          mode={ditherModeIndex}
          intensity={ditherIntensity}
          thresholdBias={ditherThresholdBias}
          luminanceOnly={ditherLuminanceOnly}
          opacity={ditherEnabled ? 1 : 0}
        />
        <Vignette
          offset={vignetteEffect?.offset ?? 0.5}
          darkness={vignetteEffect?.darkness ?? 0.5}
          opacity={vignetteEnabled ? 1 : 0}
        />
        <Scanline
          density={scanlineEffect?.density ?? 1.5}
          scrollSpeed={scanlineEffect?.scrollSpeed ?? 0}
          opacity={scanlineEnabled ? 1 : 0}
        />
      </EffectComposer>
    </>
  )
}

export function EditorCanvas() {
  const [w, h] = useStore((s) => s.project.aspectRatio)
  const isExporting = useStore((s) => s.isExporting)
  const exportRenderMode = useStore((s) => s.exportRenderMode)
  const exportHeight = useStore((s) => s.exportHeight)
  const aspect = w / h
  const height = isExporting ? exportHeight : 480
  const width = Math.round(height * aspect)
  const useAlpha = isExporting && exportRenderMode === 'plane-only'

  return (
    <div
      className="rounded-lg overflow-hidden bg-black"
      style={{ width, height }}
    >
      <Canvas
        key={useAlpha ? 'plane-only' : 'full'}
        gl={{ preserveDrawingBuffer: true, alpha: useAlpha }}
        camera={{ position: [0, 0, 5], fov: FOV_DEG }}
        onCreated={({ camera }) => {
          camera.position.set(0, 0, 5)
        }}
      >
        <Suspense fallback={null}>
          {useAlpha && <ExportClearAlpha />}
          <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  )
}
