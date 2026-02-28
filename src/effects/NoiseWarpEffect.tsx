import { Uniform } from 'three'
import { BlendFunction, Effect } from 'postprocessing'
import { wrapEffect } from '@react-three/postprocessing'

const NoiseWarpShader = {
  fragmentShader: /* glsl */ `
    uniform float strength;
    uniform float scale;
    uniform float time;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    float valueNoise(vec2 uv) {
      vec2 i = floor(uv);
      vec2 f = fract(uv);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
      float nx = valueNoise(uv * scale + time * 0.1);
      float ny = valueNoise(uv * scale + vec2(5.2, 1.3) + time * 0.1);
      vec2 warped = uv + vec2((nx - 0.5) * 2.0 * strength, (ny - 0.5) * 2.0 * strength);
      warped = clamp(warped, 0.0, 1.0);
      outputColor = texture2D(inputBuffer, warped);
    }
  `,
}

export class NoiseWarpEffectImpl extends Effect {
  private _speed = 1.0
  private _time = 0.0

  constructor({
    blendFunction = BlendFunction.NORMAL,
    strength = 0.05,
    scale = 5.0,
    speed = 1.0,
  }: {
    blendFunction?: BlendFunction
    strength?: number
    scale?: number
    speed?: number
  } = {}) {
    super('NoiseWarpEffect', NoiseWarpShader.fragmentShader, {
      blendFunction,
      uniforms: new Map([
        ['strength', new Uniform(strength)],
        ['scale', new Uniform(scale)],
        ['time', new Uniform(0)],
      ]),
    })
    this._speed = speed
  }

  get strength(): number { return this.uniforms.get('strength')!.value }
  set strength(v: number) { this.uniforms.get('strength')!.value = v }

  get scale(): number { return this.uniforms.get('scale')!.value }
  set scale(v: number) { this.uniforms.get('scale')!.value = v }

  get speed(): number { return this._speed }
  set speed(v: number) { this._speed = v }

  update(_renderer: unknown, _inputBuffer: unknown, deltaTime: number) {
    this._time += deltaTime * this._speed
    this.uniforms.get('time')!.value = this._time
  }
}

export const NoiseWarpEffect = wrapEffect(NoiseWarpEffectImpl)
