import { Uniform } from 'three'
import { BlendFunction, Effect } from 'postprocessing'
import { wrapEffect } from '@react-three/postprocessing'

function randomFloat(low: number, high: number) {
  return low + Math.random() * (high - low)
}

const BlockGlitchShader = {
  fragmentShader: /* glsl */ `
    uniform bool active;
    uniform float amount;
    uniform float blockSize;
    uniform float time;
    uniform vec2 resolution;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
      vec2 uvOut = uv;
      if (active && amount > 0.001) {
        float blocksX = 1.0 / blockSize;
        float blocksY = blocksX * (resolution.y / resolution.x);
        vec2 block = floor(uv * vec2(blocksX, blocksY));
        float h = hash(block + time);
        float h2 = hash(block + time + 1.0);
        float dx = (h - 0.5) * amount;
        float dy = (h2 - 0.5) * amount;
        uvOut = uv + vec2(dx, dy);
      }
      outputColor = texture2D(inputBuffer, uvOut);
    }
  `,
}

export class BlockGlitchEffectImpl extends Effect {
  private time = 0
  private breakPoint = { x: 1.5, y: 0.8 }
  private delay = { min: 1.5, max: 3.5 }
  private duration = { min: 0.6, max: 1 }

  constructor({
    blendFunction = BlendFunction.NORMAL,
    amount = 0.04,
    blockSize = 0.05,
    delayMin = 1.5,
    delayMax = 3.5,
    durationMin = 0.6,
    durationMax = 1,
  }: {
    blendFunction?: BlendFunction
    amount?: number
    blockSize?: number
    delayMin?: number
    delayMax?: number
    durationMin?: number
    durationMax?: number
  } = {}) {
    super('BlockGlitchEffect', BlockGlitchShader.fragmentShader, {
      blendFunction,
      uniforms: new Map<string, Uniform<unknown>>([
        ['active', new Uniform(false)],
        ['amount', new Uniform(amount)],
        ['blockSize', new Uniform(blockSize)],
        ['time', new Uniform(0)],
        ['resolution', new Uniform({ x: 1, y: 1 })],
      ]),
    })
    this.delay = { min: delayMin, max: delayMax }
    this.duration = { min: durationMin, max: durationMax }
    this.breakPoint = {
      x: randomFloat(delayMin, delayMax),
      y: randomFloat(durationMin, durationMax),
    }
  }

  set amount(v: number) {
    this.uniforms.get('amount')!.value = v
  }
  set blockSize(v: number) {
    this.uniforms.get('blockSize')!.value = v
  }
  set delayMin(v: number) {
    this.delay.min = v
  }
  set delayMax(v: number) {
    this.delay.max = v
  }
  set durationMin(v: number) {
    this.duration.min = v
  }
  set durationMax(v: number) {
    this.duration.max = v
  }

  update(
    _renderer: unknown,
    inputBuffer: { width: number; height: number },
    deltaTime: number
  ) {
    this.uniforms.get('resolution')!.value = {
      x: inputBuffer.width,
      y: inputBuffer.height,
    }
    this.time += deltaTime
    const inGlitchWindow =
      this.time > this.breakPoint.x &&
      this.time < this.breakPoint.x + this.breakPoint.y
    if (this.time >= this.breakPoint.x + this.breakPoint.y) {
      this.breakPoint = {
        x: randomFloat(this.delay.min, this.delay.max),
        y: randomFloat(this.duration.min, this.duration.max),
      }
      this.time = 0
    }
    this.uniforms.get('active')!.value = inGlitchWindow
    if (inGlitchWindow) {
      this.uniforms.get('time')!.value = Math.random() * 1e4
    }
  }
}

export const BlockGlitchEffect = wrapEffect(BlockGlitchEffectImpl)
