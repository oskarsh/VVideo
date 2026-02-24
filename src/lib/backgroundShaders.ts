import * as THREE from 'three'
import type { BackgroundTexture } from '@/types'

/** Fragment shader for animated noise background. Uses 3D value noise with time as z. */
const noiseFragment = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  uniform vec3 uColor0;
  uniform vec3 uColor1;
  uniform float uScale;
  uniform float uSeed;

  float hash(vec3 p) {
    vec3 q = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
                  dot(p, vec3(269.5, 183.3, 246.1)),
                  dot(p, vec3(113.5, 271.9, 124.6)));
    return fract(sin(q.x + uSeed) * 43758.5453);
  }

  float valueNoise3D(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float n = mix(
      mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
          mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
          mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.y);
    return n;
  }

  void main() {
    vec2 uv = vUv;
    float n = valueNoise3D(vec3(uv * uScale, uTime * 0.5));
    vec3 color = mix(uColor0, uColor1, n);
    gl_FragColor = vec4(color, 1.0);
  }
`

const noiseVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

/** Fragment shader for animated dots background. Grid of circles with scrolling offset. */
const dotsFragment = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  uniform vec3 uBgColor;
  uniform vec3 uDotColor;
  uniform float uSpacing;
  uniform float uSize;
  uniform float uSpeed;

  void main() {
    vec2 uv = vUv;
    float t = uTime * uSpeed;
    uv += vec2(t * 0.2, t * 0.15);
    vec2 id = floor(uv / uSpacing);
    vec2 gv = fract(uv / uSpacing) - 0.5;
    float dist = length(gv);
    float d = smoothstep(uSize, uSize * 0.7, dist);
    vec3 color = mix(uBgColor, uDotColor, d);
    gl_FragColor = vec4(color, 1.0);
  }
`

const dotsVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

function hexToVec3(hex: string): THREE.Vector3 {
  const m = hex.replace(/^#/, '').match(/.{2}/g)
  if (!m) return new THREE.Vector3(0.1, 0.1, 0.1)
  return new THREE.Vector3(
    parseInt(m[0], 16) / 255,
    parseInt(m[1], 16) / 255,
    parseInt(m[2], 16) / 255
  )
}

export function createNoiseMaterial(config: Extract<BackgroundTexture, { type: 'noise' }>, time: number): THREE.ShaderMaterial {
  const speed = (config.speed ?? 1) * 0.5
  const scale = Math.max(0.5, config.scale ?? 3)
  const seed = (config.seed ?? 42) / 1000
  return new THREE.ShaderMaterial({
    vertexShader: noiseVertex,
    fragmentShader: noiseFragment,
    uniforms: {
      uTime: { value: time * speed },
      uColor0: { value: hexToVec3(config.colors[0]) },
      uColor1: { value: hexToVec3(config.colors[1]) },
      uScale: { value: scale },
      uSeed: { value: seed },
    },
    side: THREE.DoubleSide,
    depthWrite: false,
  })
}

export function createDotsMaterial(config: Extract<BackgroundTexture, { type: 'dots' }>, time: number): THREE.ShaderMaterial {
  const speed = config.speed ?? 1
  const spacing = Math.max(0.05, Math.min(0.5, config.spacing ?? 0.15))
  const size = Math.max(0.01, Math.min(0.4, config.size ?? 0.08))
  return new THREE.ShaderMaterial({
    vertexShader: dotsVertex,
    fragmentShader: dotsFragment,
    uniforms: {
      uTime: { value: time },
      uBgColor: { value: hexToVec3(config.backgroundColor) },
      uDotColor: { value: hexToVec3(config.dotColor) },
      uSpacing: { value: spacing },
      uSize: { value: size },
      uSpeed: { value: speed },
    },
    side: THREE.DoubleSide,
    depthWrite: false,
  })
}
