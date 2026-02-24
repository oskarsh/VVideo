import { useRef, useEffect, useState, Suspense, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
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
import { getFlyoverKeyframes } from '@/lib/flyover'
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
  SceneText,
  Pane,
  BackgroundTexture,
} from '@/types'
import { getPlaneMedia, getPanesForRender } from '@/types'
import { getHandheldOffsets } from '@/utils/smoothNoise'
import { getGlobalEffectStateAtTime } from '@/lib/globalEffects'
import { generateBackgroundTextureDataUrl } from '@/lib/backgroundTexture'
import { createNoiseMaterial, createDotsMaterial } from '@/lib/backgroundShaders'

const FOV_DEG = 50

function BackgroundVideo({
  url,
  trim,
  sceneLocalTime,
  sceneDuration,
  scrubTime,
  playbackMode,
  speed,
  continuous: _continuous,
  globalTime: _globalTime,
}: {
  url: string
  trim: { start: number; end: number } | null
  sceneLocalTime: number
  sceneDuration: number
  viewAspect: number
  scrubTime?: number | null
  playbackMode: 'normal' | 'fitScene'
  speed: number
  /** When true, use globalTime and ignore trim/scene; video plays continuously across scenes. */
  continuous?: boolean
  globalTime?: number
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
    if (_continuous && _globalTime != null) {
      const effectiveTime = _globalTime * Math.max(0.1, speed)
      video.currentTime = effectiveTime % dur
      return
    }
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

function BackgroundTextureMesh({
  config,
  viewAspect,
  globalTime,
}: {
  config: BackgroundTexture
  viewAspect: number
  globalTime: number
}) {
  const dataUrl = useMemo(
    () => (config.type === 'gradient' || config.type === 'terrain' ? generateBackgroundTextureDataUrl(config) : ''),
    [config]
  )
  const [texture, setTexture] = useState<THREE.Texture | null>(null)
  const texRef = useRef<THREE.Texture | null>(null)
  const meshRef = useRef<THREE.Mesh>(null)

  const shaderMaterial = useMemo(() => {
    if (config.type === 'noise') return createNoiseMaterial(config, 0)
    if (config.type === 'dots') return createDotsMaterial(config, 0)
    return null
  }, [config])

  useEffect(() => {
    return () => {
      if (shaderMaterial) shaderMaterial.dispose()
    }
  }, [shaderMaterial])

  useEffect(() => {
    if (config.type !== 'gradient' && config.type !== 'terrain') return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      if (texRef.current) texRef.current.dispose()
      const tex = new THREE.Texture(img)
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping
      tex.repeat.set(3, 3)
      tex.needsUpdate = true
      tex.minFilter = THREE.LinearFilter
      tex.magFilter = THREE.LinearFilter
      texRef.current = tex
      setTexture(tex)
    }
    img.src = dataUrl
    return () => {
      if (texRef.current) {
        texRef.current.dispose()
        texRef.current = null
      }
      setTexture(null)
    }
  }, [dataUrl, config.type])

  useFrame(() => {
    if (config.type === 'noise' && shaderMaterial?.uniforms?.uTime) {
      const speed = (config.speed ?? 1) * 0.5
      shaderMaterial.uniforms.uTime.value = globalTime * speed
    } else if (config.type === 'dots' && shaderMaterial?.uniforms?.uTime) {
      const speed = config.speed ?? 1
      shaderMaterial.uniforms.uTime.value = globalTime * speed
    } else if ((config.type === 'gradient' || config.type === 'terrain') && texRef.current) {
      const speed = (config.speed ?? 1) * 0.15
      texRef.current.offset.y = (globalTime * speed) % 1
    }
  })

  if (config.type === 'noise' || config.type === 'dots') {
    if (!shaderMaterial) return null
    const scaleX = 10 * viewAspect
    const scaleY = 10
    return (
      <mesh ref={meshRef} position={[0, 0, -2]} scale={[scaleX, scaleY, 1]}>
        <planeGeometry args={[1, 1]} />
        <primitive object={shaderMaterial} attach="material" />
      </mesh>
    )
  }

  if (!texture) return null
  const scaleX = 10 * viewAspect
  const scaleY = 10
  return (
    <mesh position={[0, 0, -2]} scale={[scaleX, scaleY, 1]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
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
  const [fallbackTexture, setFallbackTexture] = useState<THREE.Texture | null>(null)
  const [fallbackAspect, setFallbackAspect] = useState(1)
  const fallbackTexRef = useRef<THREE.Texture | null>(null)

  useEffect(() => {
    let cancelled = false
    const loader = new SVGLoader()
    const useTextureFallback = () => {
      if (cancelled) return
      const texLoader = new THREE.TextureLoader()
      texLoader.load(
        url,
        (tex) => {
          if (cancelled) {
            tex.dispose()
            return
          }
          tex.colorSpace = THREE.SRGBColorSpace
          tex.minFilter = THREE.LinearFilter
          tex.magFilter = THREE.LinearFilter
          fallbackTexRef.current?.dispose()
          fallbackTexRef.current = tex
          setFallbackTexture(tex)
          const img = tex.image as HTMLImageElement
          if (img?.naturalWidth && img.naturalHeight) {
            setFallbackAspect(img.naturalWidth / img.naturalHeight)
          }
        },
        undefined,
        () => {
          if (!cancelled) setFallbackTexture(null)
        }
      )
    }

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
        fallbackTexRef.current?.dispose()
        fallbackTexRef.current = null
        setFallbackTexture(null)

        const paths: Array<{ shapes: THREE.Shape[]; color: THREE.Color }> = []
        for (const path of data.paths) {
          const shapes = path.toShapes(true)
          if (shapes.length > 0) {
            paths.push({ shapes, color: path.color.clone() })
          }
        }
        if (paths.length === 0) {
          setSvgState(null)
          useTextureFallback()
          return
        }
        const svg = data.xml.documentElement
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
        if (!cancelled) {
          setSvgState(null)
          useTextureFallback()
        }
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
      fallbackTexRef.current?.dispose()
      fallbackTexRef.current = null
      setFallbackTexture(null)
    }
  }, [url, extrusionDepth, colorOverride])

  if (fallbackTexture) {
    const scaleX = fallbackAspect >= 1 ? BASE_PLANE_SIZE : BASE_PLANE_SIZE * fallbackAspect
    const scaleY = fallbackAspect >= 1 ? BASE_PLANE_SIZE / fallbackAspect : BASE_PLANE_SIZE
    const depth = Math.max(0, extrusionDepth)
    return (
      <mesh position={[0, 0, 0]} scale={[scaleX, scaleY, depth > 0 ? depth : 1]}>
        {depth > 0 ? (
          <boxGeometry args={[1, 1, 1]} />
        ) : (
          <planeGeometry args={[1, 1]} />
        )}
        <meshBasicMaterial
          map={fallbackTexture}
          side={THREE.DoubleSide}
          transparent
          alphaTest={0.01}
          depthWrite={true}
        />
      </mesh>
    )
  }

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

const TEXT_CANVAS_PX = 64

function TextPlane3D({ text }: { text: SceneText }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null)
  const [aspect, setAspect] = useState(2)
  const texRef = useRef<THREE.CanvasTexture | null>(null)

  useEffect(() => {
    let cancelled = false
    const fontFamily = text.fontFamily || 'IBM Plex Mono'
    const fontWeight = text.fontWeight ?? 400
    const fontSpec = `${typeof fontWeight === 'number' ? fontWeight : 400} ${TEXT_CANVAS_PX}px "${fontFamily}"`
    document.fonts.load(fontSpec).then(() => {
      if (cancelled) return
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const content = (text.content || ' ').trim() || ' '
      ctx.font = fontSpec
      const metrics = ctx.measureText(content)
      const padding = 8
      const w = Math.max(64, Math.ceil(metrics.width) + padding * 2)
      const h = Math.ceil(TEXT_CANVAS_PX * 1.2 + padding * 2)
      canvas.width = w
      canvas.height = h
      ctx.font = fontSpec
      ctx.textBaseline = 'middle'
      ctx.fillStyle = text.color || '#ffffff'
      ctx.fillText(content, padding, h / 2)
      const tex = new THREE.CanvasTexture(canvas)
      tex.minFilter = THREE.LinearFilter
      tex.magFilter = THREE.LinearFilter
      tex.needsUpdate = true
      texRef.current = tex
      setTexture(tex)
      setAspect(w / h)
    })
    return () => {
      cancelled = true
      texRef.current?.dispose()
      texRef.current = null
      setTexture(null)
    }
  }, [text.content, text.fontFamily, text.fontWeight, text.color])

  if (!texture) return null
  const worldH = (text.fontSize ?? 0.15) * (text.scale ?? 1)
  const worldW = worldH * aspect
  return (
    <mesh
      ref={meshRef}
      position={text.position}
      rotation={text.rotation}
      scale={[worldW, worldH, 1]}
    >
      <planeGeometry args={[1, 1]} />
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

function lerpPos(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

function SinglePane({
  pane,
  scene,
  sceneLocalTime,
  sceneDuration,
  scrubTime,
}: {
  pane: Pane
  scene: SceneType
  sceneLocalTime: number
  sceneDuration: number
  scrubTime: number | null
}) {
  const anim = pane.animation
  const t = sceneDuration > 0 ? Math.min(1, Math.max(0, sceneLocalTime / sceneDuration)) : 0
  const position: [number, number, number] = anim
    ? lerpPos(anim.positionStart, anim.positionEnd, t)
    : pane.position
  const scale = anim ? anim.scaleStart + (anim.scaleEnd - anim.scaleStart) * t : pane.scale
  const rotation: [number, number, number] = anim
    ? (lerpPos(anim.rotationStart, anim.rotationEnd, t) as [number, number, number])
    : pane.rotation

  const trim = scene.paneTrims?.[pane.id] ?? scene.planeTrim ?? null
  const { media, extrusionDepth, planeSvgColor } = pane

  if (!media.url) return null

  return (
    <group position={position} scale={[scale, scale, scale]} rotation={rotation}>
      {media.type === 'video' && (
        <PlaneVideo
          url={media.url}
          trim={trim}
          sceneLocalTime={sceneLocalTime}
          sceneDuration={sceneDuration}
          scrubTime={scrubTime}
          playbackMode={scene.planeVideoPlaybackMode ?? 'normal'}
          speed={scene.planeVideoSpeed ?? 1}
          extrusionDepth={extrusionDepth}
        />
      )}
      {media.type === 'image' && (
        <PlaneImage url={media.url} extrusionDepth={extrusionDepth} />
      )}
      {media.type === 'svg' && (
        <PlaneSVG
          url={media.url}
          extrusionDepth={extrusionDepth}
          colorOverride={planeSvgColor}
        />
      )}
    </group>
  )
}

function CameraRig({
  sceneData,
  time,
  duration,
  disabled,
  handheldOverride,
  fovOverride,
  /** When true, handheld shake uses real elapsed time so it animates in preview when paused. */
  handheldLivePreview,
}: {
  sceneData: SceneType
  time: number
  duration: number
  disabled?: boolean
  /** When set, use these values instead of scene handheld effect (e.g. from global effect keyframes). */
  handheldOverride?: { intensity: number; rotationShake: number; speed: number; enabled: boolean }
  /** When set (from global camera effect), override camera FOV. */
  fovOverride?: number
  /** When true, handheld shake uses real elapsed time so it animates in preview when paused. */
  handheldLivePreview?: boolean
}) {
  const { camera } = useThree()
  const handheldElapsedRef = useRef(0)
  const zoomEffect = sceneData.effects.find((e): e is SceneEffectZoom => e.type === 'zoom')
  const zoomStart = zoomEffect?.startScale ?? 1
  const zoomEnd = zoomEffect?.endScale ?? 1
  const t = duration > 0 ? Math.min(1, time / duration) : 0
  const zoom = zoomStart + (zoomEnd - zoomStart) * t
  const flyover = sceneData.flyover
  const keyframes = getFlyoverKeyframes(sceneData)

  const handheldEffect = sceneData.effects.find(
    (e): e is SceneEffectHandheld => e.type === 'handheld'
  )
  const h = handheldEffect
  const intensity = handheldOverride
    ? handheldOverride.intensity
    : (h?.intensityStart ?? (h as { intensity?: number })?.intensity ?? 0) +
    ((h?.intensityEnd ?? (h as { intensity?: number })?.intensity ?? 0) - (h?.intensityStart ?? (h as { intensity?: number })?.intensity ?? 0)) * t
  const rotationShake = handheldOverride
    ? handheldOverride.rotationShake
    : (h?.rotationShakeStart ?? (h as { rotationShake?: number })?.rotationShake ?? 0) +
    ((h?.rotationShakeEnd ?? (h as { rotationShake?: number })?.rotationShake ?? 0) - (h?.rotationShakeStart ?? (h as { rotationShake?: number })?.rotationShake ?? 0)) * t
  const speed = handheldOverride
    ? handheldOverride.speed
    : (h?.speedStart ?? (h as { speed?: number })?.speed ?? 1) +
    ((h?.speedEnd ?? (h as { speed?: number })?.speed ?? 1) - (h?.speedStart ?? (h as { speed?: number })?.speed ?? 1)) * t
  const handheldOn = handheldOverride
    ? handheldOverride.enabled && Number.isFinite(intensity) && Number.isFinite(rotationShake) && Number.isFinite(speed)
    : Boolean(
      handheldEffect?.enabled &&
      Number.isFinite(intensity) &&
      Number.isFinite(rotationShake) &&
      Number.isFinite(speed)
    )

  useFrame((_state, delta) => {
    if (disabled) return
    // When there are no flyover keyframes, leave the camera where it is (do not reset to default).
    if (keyframes.length === 0) return
    let pos: [number, number, number]
    let rot: [number, number, number]
    let fov = FOV_DEG

    if (keyframes.length === 1) {
      const k = keyframes[0]
      pos = [...k.position]
      rot = [...k.rotation]
      fov = k.fov ?? FOV_DEG
    } else {
      // Find segment containing t (normalized 0..1)
      let i = 0
      for (; i < keyframes.length - 1 && keyframes[i + 1].time <= t; i++) { }
      const k0 = keyframes[i]
      const k1 = keyframes[Math.min(i + 1, keyframes.length - 1)]
      const segDuration = k1.time - k0.time
      const segmentU = segDuration > 1e-9 ? (t - k0.time) / segDuration : 1
      const easedU = applyFlyoverEasing(Math.max(0, Math.min(1, segmentU)), flyover?.easing)
      pos = [
        k0.position[0] + (k1.position[0] - k0.position[0]) * easedU,
        k0.position[1] + (k1.position[1] - k0.position[1]) * easedU,
        k0.position[2] + (k1.position[2] - k0.position[2]) * easedU,
      ]
      rot = [
        k0.rotation[0] + (k1.rotation[0] - k0.rotation[0]) * easedU,
        k0.rotation[1] + (k1.rotation[1] - k0.rotation[1]) * easedU,
        k0.rotation[2] + (k1.rotation[2] - k0.rotation[2]) * easedU,
      ]
      fov = (k0.fov ?? FOV_DEG) + ((k1.fov ?? FOV_DEG) - (k0.fov ?? FOV_DEG)) * easedU
    }
    if (!pos.every(Number.isFinite) || !rot.every(Number.isFinite)) return

    let handheldTime = time
    if (handheldOn && handheldLivePreview) {
      handheldElapsedRef.current += delta
      handheldTime = handheldElapsedRef.current
    } else if (!handheldOn) {
      handheldElapsedRef.current = 0
    }

    if (handheldOn) {
      const offsets = getHandheldOffsets(handheldTime, intensity, rotationShake, speed)
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
      const finalFov = fovOverride != null && Number.isFinite(fovOverride) ? fovOverride : (Number.isFinite(fov) ? fov : FOV_DEG)
      camera.fov = finalFov
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
    const keyframes = getFlyoverKeyframes(scene)
    const firstKf = keyframes[0]
    if (jumpToStart && firstKf?.position && firstKf?.rotation) {
      const [x, y, z] = firstKf.position
      const [rx, ry, rz] = firstKf.rotation
      if (Number.isFinite(x + y + z + rx + ry + rz)) {
        camera.position.set(x, y, z)
        camera.rotation.set(rx, ry, rz)
        camera.fov = firstKf.fov != null && Number.isFinite(firstKf.fov) ? firstKf.fov : 50
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
    if (justEnabled.current && firstKf?.position && firstKf?.rotation) {
      try {
        const [x, y, z] = firstKf.position
        const [rx, ry, rz] = firstKf.rotation
        if (Number.isFinite(x + y + z + rx + ry + rz)) {
          camera.position.set(x, y, z)
          camera.rotation.set(rx, ry, rz)
          camera.fov = firstKf.fov != null && Number.isFinite(firstKf.fov) ? firstKf.fov : 50
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

/** OrbitControls always does lookAt(target) each frame, so it overwrites camera rotation/position.
 * After WASDFly moves/rotates the camera, we sync the orbit target so the next update() doesn't undo it. */
function OrbitKeyboardSync({ controlsRef }: { controlsRef: React.RefObject<OrbitControlsImpl | null> }) {
  const { camera } = useThree()
  const prevPosition = useRef(new THREE.Vector3())
  const prevQuaternion = useRef(new THREE.Quaternion())
  const hasPrevious = useRef(false)
  const _dir = useRef(new THREE.Vector3())
  const _delta = useRef(new THREE.Vector3())

  useFrame((_, __) => {
    const controls = controlsRef?.current
    if (!controls?.target || !camera || !('fov' in camera)) return
    const k = getFlyKeys()
    const anyKey = k.w || k.a || k.s || k.d || k.q || k.e || k.i || k.j || k.k || k.l
    if (!anyKey) {
      hasPrevious.current = false
      return
    }
    const pos = camera.position
    const quat = camera.quaternion
    const target = controls.target

    if (!hasPrevious.current) {
      prevPosition.current.copy(pos)
      prevQuaternion.current.copy(quat)
      hasPrevious.current = true
      // Sync target so next frame OrbitControls.update() doesn't overwrite rotation/position
      const dist = pos.distanceTo(target)
      camera.getWorldDirection(_dir.current)
      target.copy(pos).add(_dir.current.multiplyScalar(dist))
      return
    }

    const prevPos = prevPosition.current
    const prevQuat = prevQuaternion.current
    const posDelta = _delta.current
    const dir = _dir.current

    // Position changed (WASD/QE): move target by the same delta so view doesn't orbit
    posDelta.subVectors(pos, prevPos)
    if (posDelta.lengthSq() > 1e-12) {
      target.add(posDelta)
    }

    // Rotation changed (IJKL): put target in front of camera at same distance so lookAt matches
    const quatDelta = prevQuat.angleTo(quat)
    if (quatDelta > 1e-6) {
      const dist = pos.distanceTo(target)
      camera.getWorldDirection(dir)
      target.copy(pos).add(dir.multiplyScalar(dist))
    }

    prevPosition.current.copy(pos)
    prevQuaternion.current.copy(quat)
  }, 1)

  return null
}

function WASDFly() {
  const { camera } = useThree()

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        setFlyKey(e.code, true)
        return
      }
      if (!isFlyKey(e.code)) return
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable) return
      e.preventDefault()
      setFlyKey(e.code, true)
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        setFlyKey(e.code, false)
        return
      }
      if (!isFlyKey(e.code)) return
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable) return
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
      setFlyKey('ShiftLeft', false)
      setFlyKey('ShiftRight', false)
    }
  }, [])

  useFrame((_, delta) => {
    const k = getFlyKeys()
    const anyMove = k.w || k.a || k.s || k.d || k.q || k.e
    const anyRotate = k.i || k.j || k.k || k.l
    if (!anyMove && !anyRotate) return
    if (!camera || !('fov' in camera)) return
    const dt = Number.isFinite(delta) && delta > 0 && delta < 1 ? delta : 1 / 60
    const slow = (k.shiftLeft || k.shiftRight) ? 0.22 : 1 // Shift = smooth precise slow control

    // WASD + Q/E: first-person style: forward/back and strafe left/right relative to camera look direction.
    if (anyMove) {
      const move = FLY_SPEED * dt * slow
      camera.getWorldDirection(_forward)
      // Camera's local X in world space = strafe right (so A/D follow current rotation)
      const m = camera.matrix.elements
      _right.set(m[0], m[1], m[2])
      if (k.e) camera.position.y += move
      if (k.q) camera.position.y -= move
      if (k.w) camera.position.addScaledVector(_forward, move)
      if (k.s) camera.position.addScaledVector(_forward, -move)
      if (k.d) camera.position.addScaledVector(_right, move)
      if (k.a) camera.position.addScaledVector(_right, -move)
    }

    // IJKL: camera rotation — J look left, L look right, I look up, K look down
    if (anyRotate) {
      const rot = ROTATE_SPEED * dt * slow
      if (k.j) camera.rotation.y += rot   // look left
      if (k.l) camera.rotation.y -= rot   // look right
      if (k.i) camera.rotation.x += rot   // look down
      if (k.k) camera.rotation.x -= rot   // look up
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

function useFormFocus(): boolean {
  const [focused, setFocused] = useState(false)
  useEffect(() => {
    const check = () => {
      const el = document.activeElement
      if (!el || !(el instanceof HTMLElement)) {
        setFocused(false)
        return
      }
      const tag = el.tagName.toLowerCase()
      const isForm =
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        el.isContentEditable === true
      setFocused(isForm)
    }
    check()
    document.addEventListener('focusin', check)
    document.addEventListener('focusout', check)
    return () => {
      document.removeEventListener('focusin', check)
      document.removeEventListener('focusout', check)
    }
  }, [])
  return focused
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
  const orbitControlsRef = useRef<OrbitControlsImpl | null>(null)
  const scene = project.scenes[currentSceneIndex]
  if (!scene) return null

  const hideBackground = isExporting && exportRenderMode === 'plane-only'
  const sceneStartTime = project.scenes
    .slice(0, currentSceneIndex)
    .reduce((acc, s) => acc + s.durationSeconds, 0)
  const sceneLocalTime = currentTime - sceneStartTime
  const sceneDuration = scene.durationSeconds

  const formFocused = useFormFocus()
  // When playing, always run the flyover animation; only use edit controls when paused and not typing in a form
  const editControlsActive = flyoverEditMode && !isPlaying && !formFocused

  const { size } = useThree()
  const lerp = (s: number, e: number) =>
    s + (e - s) * (sceneDuration > 0 ? Math.min(1, sceneLocalTime / sceneDuration) : 0)

  const globalGrain = getGlobalEffectStateAtTime(project, 'grain', currentTime)
  const globalDof = getGlobalEffectStateAtTime(project, 'dof', currentTime)
  const globalHandheld = getGlobalEffectStateAtTime(project, 'handheld', currentTime)
  const globalChromatic = getGlobalEffectStateAtTime(project, 'chromaticAberration', currentTime)
  const globalLens = getGlobalEffectStateAtTime(project, 'lensDistortion', currentTime)
  const globalGlitch = getGlobalEffectStateAtTime(project, 'glitch', currentTime)
  const globalVignette = getGlobalEffectStateAtTime(project, 'vignette', currentTime)
  const globalScanline = getGlobalEffectStateAtTime(project, 'scanline', currentTime)
  const globalDither = getGlobalEffectStateAtTime(project, 'dither', currentTime)
  const globalCamera = getGlobalEffectStateAtTime(project, 'camera', currentTime)

  const grainEffect = scene.effects.find((e): e is SceneEffectGrain => e.type === 'grain')
  const grainStart = grainEffect?.startOpacity ?? (grainEffect as { opacity?: number })?.opacity ?? 0.1
  const grainEnd = grainEffect?.endOpacity ?? (grainEffect as { opacity?: number })?.opacity ?? 0.1
  const grainEnabled = globalGrain != null ? (globalGrain.enabled !== false) : true
  const grainOpacity =
    globalGrain != null
      ? grainEnabled
        ? (globalGrain.startOpacity as number)
        : 0
      : grainEffect
        ? grainStart + (grainEnd - grainStart) * (sceneDuration > 0 ? Math.min(1, sceneLocalTime / sceneDuration) : 0)
        : 0

  const dofEffect = scene.effects.find((e): e is SceneEffectDoF => e.type === 'dof')
  const d = dofEffect
  const dofEnabled = globalDof != null ? (globalDof.enabled as boolean) : (dofEffect?.enabled ?? true)
  const dofFocusDistance =
    globalDof != null
      ? (globalDof.focusDistanceStart as number)
      : lerp(
        d?.focusDistanceStart ?? (d as { focusDistance?: number })?.focusDistance ?? 0.015,
        d?.focusDistanceEnd ?? (d as { focusDistance?: number })?.focusDistance ?? 0.015
      )
  const dofFocalLength =
    globalDof != null
      ? (globalDof.focalLengthStart as number)
      : lerp(
        d?.focalLengthStart ?? (d as { focalLength?: number })?.focalLength ?? 0.02,
        d?.focalLengthEnd ?? (d as { focalLength?: number })?.focalLength ?? 0.02
      )
  const dofFocusRange =
    globalDof != null
      ? (globalDof.focusRangeStart as number)
      : lerp(
        d?.focusRangeStart ?? (d as { focusRange?: number })?.focusRange ?? 0.5,
        d?.focusRangeEnd ?? (d as { focusRange?: number })?.focusRange ?? 0.5
      )
  const dofBokehScale =
    globalDof != null
      ? (globalDof.bokehScaleStart as number)
      : lerp(
        d?.bokehScaleStart ?? (d as { bokehScale?: number })?.bokehScale ?? 6,
        d?.bokehScaleEnd ?? (d as { bokehScale?: number })?.bokehScale ?? 6
      )

  const ditherEffect =
    (globalDither != null && typeof (globalDither as unknown as SceneEffectDither).preset === 'string'
      ? (globalDither as unknown as SceneEffectDither)
      : null) ??
    project.dither ??
    scene.effects.find((e): e is SceneEffectDither => e.type === 'dither')
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
  const chromaticEnabled =
    globalChromatic != null ? (globalChromatic.enabled as boolean) : (chromaticEffect?.enabled ?? false)
  const chromaticOffsetVal =
    globalChromatic != null
      ? (globalChromatic.offsetStart as number)
      : chromaticEffect == null
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
  const lensEnabled = globalLens != null ? (globalLens.enabled as boolean) : (lensEffect?.enabled ?? false)
  const lensDistortionVal =
    globalLens != null
      ? (globalLens.distortionStart as number)
      : lensEffect == null
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
  const glitchEnabled = globalGlitch != null ? (globalGlitch.enabled as boolean) : (glitchEffect?.enabled ?? false)
  const glitchMode =
    (globalGlitch != null ? globalGlitch.mode : glitchEffect?.mode) === 'constantMild'
      ? GlitchMode.CONSTANT_MILD
      : GlitchMode.SPORADIC
  const glitchDelay = useMemo(
    () =>
      new THREE.Vector2(
        Number(globalGlitch?.delayMin ?? glitchEffect?.delayMin ?? 1.5),
        Number(globalGlitch?.delayMax ?? glitchEffect?.delayMax ?? 3.5)
      ),
    [globalGlitch?.delayMin, globalGlitch?.delayMax, glitchEffect?.delayMin, glitchEffect?.delayMax]
  )
  const glitchDuration = useMemo(
    () =>
      new THREE.Vector2(
        Number(globalGlitch?.durationMin ?? glitchEffect?.durationMin ?? 0.6),
        Number(globalGlitch?.durationMax ?? glitchEffect?.durationMax ?? 1)
      ),
    [globalGlitch?.durationMin, globalGlitch?.durationMax, glitchEffect?.durationMin, glitchEffect?.durationMax]
  )
  const glitchChromaticOffset = useMemo(
    () =>
      (globalGlitch?.monochrome ?? glitchEffect?.monochrome)
        ? new THREE.Vector2(0, 0)
        : new THREE.Vector2(0.02, 0.02),
    [globalGlitch?.monochrome, glitchEffect?.monochrome]
  )

  const vignetteEffect = scene.effects.find(
    (e): e is SceneEffectVignette => e.type === 'vignette'
  )
  const vignetteEnabled =
    globalVignette != null ? (globalVignette.enabled as boolean) : (vignetteEffect?.enabled ?? false)

  const scanlineEffect = scene.effects.find(
    (e): e is SceneEffectScanline => e.type === 'scanline'
  )
  const scanlineEnabled =
    globalScanline != null ? (globalScanline.enabled as boolean) : (scanlineEffect?.enabled ?? false)

  return (
    <>
      <CameraRig
        sceneData={scene}
        time={sceneLocalTime}
        duration={sceneDuration}
        disabled={editControlsActive}
        handheldLivePreview={!isPlaying && !isExporting}
        fovOverride={globalCamera != null && (globalCamera.enabled !== false) ? (globalCamera.fov as number) : undefined}
        handheldOverride={
          globalHandheld != null
            ? {
              intensity: globalHandheld.intensityStart as number,
              rotationShake: globalHandheld.rotationShakeStart as number,
              speed: globalHandheld.speedStart as number,
              enabled: globalHandheld.enabled as boolean,
            }
            : undefined
        }
      />
      <OrbitControls
        ref={orbitControlsRef}
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
          <OrbitKeyboardSync controlsRef={orbitControlsRef} />
        </>
      )}
      {!hideBackground &&
        (project.backgroundVideoUrl ? (
          <BackgroundVideo
            url={project.backgroundVideoUrl}
            trim={project.backgroundVideoContinuous ? null : scene.backgroundTrim}
            sceneLocalTime={sceneLocalTime}
            sceneDuration={sceneDuration}
            viewAspect={project.aspectRatio[0] / project.aspectRatio[1]}
            scrubTime={trimScrub?.video === 'background' ? trimScrub.time : null}
            playbackMode={scene.backgroundVideoPlaybackMode ?? 'normal'}
            speed={scene.backgroundVideoSpeed ?? 1}
            continuous={project.backgroundVideoContinuous ?? false}
            globalTime={currentTime}
          />
        ) : project.backgroundTexture ? (
          <BackgroundTextureMesh
            config={project.backgroundTexture}
            viewAspect={project.aspectRatio[0] / project.aspectRatio[1]}
            globalTime={currentTime}
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
        const panes = getPanesForRender(project)
        if (panes.length > 0) {
          const scrubTime = trimScrub?.video === 'plane' ? trimScrub.time : null
          return panes.map((pane) => (
            <SinglePane
              key={pane.id}
              pane={pane}
              scene={scene}
              sceneLocalTime={sceneLocalTime}
              sceneDuration={sceneDuration}
              scrubTime={scrubTime}
            />
          ))
        }
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
      {(scene.texts ?? []).filter((t) => t.mode === '3d').map((t) => (
        <TextPlane3D key={t.id} text={t} />
      ))}
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
          offset={
            globalVignette != null
              ? (globalVignette.offset as number)
              : (vignetteEffect?.offset ?? 0.5)
          }
          darkness={
            globalVignette != null
              ? (globalVignette.darkness as number)
              : (vignetteEffect?.darkness ?? 0.5)
          }
          opacity={vignetteEnabled ? 1 : 0}
        />
        <Scanline
          density={
            globalScanline != null
              ? (globalScanline.density as number)
              : (scanlineEffect?.density ?? 1.5)
          }
          scrollSpeed={
            globalScanline != null
              ? (globalScanline.scrollSpeed as number)
              : (scanlineEffect?.scrollSpeed ?? 0)
          }
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
        camera={{ position: [0, 0, 3.5], fov: FOV_DEG }}
        onCreated={({ camera }) => {
          camera.position.set(0, 0, 3.5)
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
