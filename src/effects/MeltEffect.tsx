import { Uniform } from 'three'
import { BlendFunction, Effect } from 'postprocessing'
import { wrapEffect } from '@react-three/postprocessing'

const MeltShader = {
  fragmentShader: /* glsl */ `
    uniform float strength;
    uniform float frequency;
    uniform float time;

    void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
      float drip = sin(uv.x * frequency + time) * 0.5 + 0.5;
      float dy = drip * strength * (1.0 - uv.y);
      vec2 warped = vec2(uv.x, uv.y + dy);
      warped = clamp(warped, 0.0, 1.0);
      outputColor = texture2D(inputBuffer, warped);
    }
  `,
}

export class MeltEffectImpl extends Effect {
  private _speed = 1.0
  private _time = 0.0

  constructor({
    blendFunction = BlendFunction.NORMAL,
    strength = 0.1,
    frequency = 5.0,
    speed = 1.0,
  }: {
    blendFunction?: BlendFunction
    strength?: number
    frequency?: number
    speed?: number
  } = {}) {
    super('MeltEffect', MeltShader.fragmentShader, {
      blendFunction,
      uniforms: new Map([
        ['strength', new Uniform(strength)],
        ['frequency', new Uniform(frequency)],
        ['time', new Uniform(0)],
      ]),
    })
    this._speed = speed
  }

  get strength(): number { return this.uniforms.get('strength')!.value }
  set strength(v: number) { this.uniforms.get('strength')!.value = v }

  get frequency(): number { return this.uniforms.get('frequency')!.value }
  set frequency(v: number) { this.uniforms.get('frequency')!.value = v }

  get speed(): number { return this._speed }
  set speed(v: number) { this._speed = v }

  update(_renderer: unknown, _inputBuffer: unknown, deltaTime: number) {
    this._time += deltaTime * this._speed
    this.uniforms.get('time')!.value = this._time
  }
}

export const MeltEffect = wrapEffect(MeltEffectImpl)
