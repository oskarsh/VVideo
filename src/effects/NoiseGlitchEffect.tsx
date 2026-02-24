import { Uniform } from 'three'
import { BlendFunction, Effect } from 'postprocessing'
import { wrapEffect } from '@react-three/postprocessing'

function randomFloat(low: number, high: number) {
  return low + Math.random() * (high - low)
}

const NoiseGlitchShader = {
  fragmentShader: /* glsl */ `
    uniform bool active;
    uniform float amount;
    uniform float time;

    float rand(vec2 co) {
      return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
      vec4 c = texture2D(inputBuffer, uv);
      if (active && amount > 0.001) {
        float n = rand(uv + time);
        vec3 noise = vec3(n, rand(uv + time + 1.0), rand(uv + time + 2.0));
        c.rgb = mix(c.rgb, noise, amount);
      }
      outputColor = c;
    }
  `,
}

export class NoiseGlitchEffectImpl extends Effect {
  private time = 0
  private breakPoint = { x: 1.5, y: 0.8 }
  private delay = { min: 1.5, max: 3.5 }
  private duration = { min: 0.6, max: 1 }

  constructor({
    blendFunction = BlendFunction.NORMAL,
    amount = 0.35,
    delayMin = 1.5,
    delayMax = 3.5,
    durationMin = 0.6,
    durationMax = 1,
  }: {
    blendFunction?: BlendFunction
    amount?: number
    delayMin?: number
    delayMax?: number
    durationMin?: number
    durationMax?: number
  } = {}) {
    super('NoiseGlitchEffect', NoiseGlitchShader.fragmentShader, {
      blendFunction,
      uniforms: new Map<string, Uniform<unknown>>([
        ['active', new Uniform(false)],
        ['amount', new Uniform(amount)],
        ['time', new Uniform(0)],
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

  update(_renderer: unknown, _inputBuffer: unknown, deltaTime: number) {
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

export const NoiseGlitchEffect = wrapEffect(NoiseGlitchEffectImpl)
