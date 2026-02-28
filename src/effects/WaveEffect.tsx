import { Uniform } from 'three'
import { BlendFunction, Effect } from 'postprocessing'
import { wrapEffect } from '@react-three/postprocessing'

const WaveShader = {
  fragmentShader: /* glsl */ `
    uniform float amplitudeX;
    uniform float amplitudeY;
    uniform float frequencyX;
    uniform float frequencyY;
    uniform float time;

    void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
      vec2 warped = uv;
      warped.x += sin(uv.y * frequencyY + time) * amplitudeX;
      warped.y += sin(uv.x * frequencyX + time * 0.7) * amplitudeY;
      warped = clamp(warped, 0.0, 1.0);
      outputColor = texture2D(inputBuffer, warped);
    }
  `,
}

export class WaveEffectImpl extends Effect {
  private _speed = 1.0
  private _time = 0.0

  constructor({
    blendFunction = BlendFunction.NORMAL,
    amplitudeX = 0.02,
    amplitudeY = 0.02,
    frequencyX = 5.0,
    frequencyY = 5.0,
    speed = 1.0,
  }: {
    blendFunction?: BlendFunction
    amplitudeX?: number
    amplitudeY?: number
    frequencyX?: number
    frequencyY?: number
    speed?: number
  } = {}) {
    super('WaveEffect', WaveShader.fragmentShader, {
      blendFunction,
      uniforms: new Map([
        ['amplitudeX', new Uniform(amplitudeX)],
        ['amplitudeY', new Uniform(amplitudeY)],
        ['frequencyX', new Uniform(frequencyX)],
        ['frequencyY', new Uniform(frequencyY)],
        ['time', new Uniform(0)],
      ]),
    })
    this._speed = speed
  }

  get amplitudeX(): number { return this.uniforms.get('amplitudeX')!.value }
  set amplitudeX(v: number) { this.uniforms.get('amplitudeX')!.value = v }

  get amplitudeY(): number { return this.uniforms.get('amplitudeY')!.value }
  set amplitudeY(v: number) { this.uniforms.get('amplitudeY')!.value = v }

  get frequencyX(): number { return this.uniforms.get('frequencyX')!.value }
  set frequencyX(v: number) { this.uniforms.get('frequencyX')!.value = v }

  get frequencyY(): number { return this.uniforms.get('frequencyY')!.value }
  set frequencyY(v: number) { this.uniforms.get('frequencyY')!.value = v }

  get speed(): number { return this._speed }
  set speed(v: number) { this._speed = v }

  update(_renderer: unknown, _inputBuffer: unknown, deltaTime: number) {
    this._time += deltaTime * this._speed
    this.uniforms.get('time')!.value = this._time
  }
}

export const WaveEffect = wrapEffect(WaveEffectImpl)
