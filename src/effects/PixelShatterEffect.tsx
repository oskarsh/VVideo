import { Uniform } from 'three'
import { BlendFunction, Effect } from 'postprocessing'
import { wrapEffect } from '@react-three/postprocessing'

const PixelShatterShader = {
  fragmentShader: /* glsl */ `
    uniform float scale;
    uniform float strength;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
      vec2 cell = floor(uv * scale);
      float dx = (hash(cell) - 0.5) * 2.0 * strength;
      float dy = (hash(cell + vec2(7.3, 4.1)) - 0.5) * 2.0 * strength;
      vec2 warped = uv + vec2(dx, dy);
      warped = clamp(warped, 0.0, 1.0);
      outputColor = texture2D(inputBuffer, warped);
    }
  `,
}

export class PixelShatterEffectImpl extends Effect {
  constructor({
    blendFunction = BlendFunction.NORMAL,
    scale = 20.0,
    strength = 0.05,
  }: {
    blendFunction?: BlendFunction
    scale?: number
    strength?: number
  } = {}) {
    super('PixelShatterEffect', PixelShatterShader.fragmentShader, {
      blendFunction,
      uniforms: new Map([
        ['scale', new Uniform(scale)],
        ['strength', new Uniform(strength)],
      ]),
    })
  }

  get scale(): number { return this.uniforms.get('scale')!.value }
  set scale(v: number) { this.uniforms.get('scale')!.value = v }

  get strength(): number { return this.uniforms.get('strength')!.value }
  set strength(v: number) { this.uniforms.get('strength')!.value = v }
}

export const PixelShatterEffect = wrapEffect(PixelShatterEffectImpl)
