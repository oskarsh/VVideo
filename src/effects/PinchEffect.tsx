import { Uniform } from 'three'
import { BlendFunction, Effect } from 'postprocessing'
import { wrapEffect } from '@react-three/postprocessing'

const PinchShader = {
  fragmentShader: /* glsl */ `
    uniform float strength;
    uniform float radius;
    uniform vec2 center;
    uniform float aspectRatio;

    void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
      vec2 c = uv - center;
      c.x *= aspectRatio;
      float dist = length(c);
      float falloff = 1.0 - smoothstep(0.0, radius, dist);
      float scale = 1.0 + strength * falloff;
      c /= max(scale, 0.0001);
      c.x /= aspectRatio;
      vec2 warped = c + center;
      warped = clamp(warped, 0.0, 1.0);
      outputColor = texture2D(inputBuffer, warped);
    }
  `,
}

export class PinchEffectImpl extends Effect {
  constructor({
    blendFunction = BlendFunction.NORMAL,
    strength = 0.5,
    radius = 0.5,
    centerX = 0.5,
    centerY = 0.5,
    aspectRatio = 1.0,
  }: {
    blendFunction?: BlendFunction
    strength?: number
    radius?: number
    centerX?: number
    centerY?: number
    aspectRatio?: number
  } = {}) {
    super('PinchEffect', PinchShader.fragmentShader, {
      blendFunction,
      uniforms: new Map<string, Uniform<unknown>>([
        ['strength', new Uniform(strength)],
        ['radius', new Uniform(radius)],
        ['center', new Uniform({ x: centerX, y: centerY })],
        ['aspectRatio', new Uniform(aspectRatio)],
      ]),
    })
  }

  get strength(): number { return this.uniforms.get('strength')!.value }
  set strength(v: number) { this.uniforms.get('strength')!.value = v }

  get radius(): number { return this.uniforms.get('radius')!.value }
  set radius(v: number) { this.uniforms.get('radius')!.value = v }

  get aspectRatio(): number { return this.uniforms.get('aspectRatio')!.value }
  set aspectRatio(v: number) { this.uniforms.get('aspectRatio')!.value = v }

  get centerX(): number { return this.uniforms.get('center')!.value.x }
  set centerX(v: number) { this.uniforms.get('center')!.value.x = v }

  get centerY(): number { return this.uniforms.get('center')!.value.y }
  set centerY(v: number) { this.uniforms.get('center')!.value.y = v }
}

export const PinchEffect = wrapEffect(PinchEffectImpl)
