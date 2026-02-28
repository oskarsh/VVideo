import { Uniform } from 'three'
import { BlendFunction, Effect } from 'postprocessing'
import { wrapEffect } from '@react-three/postprocessing'

const SwirlShader = {
  fragmentShader: /* glsl */ `
    uniform float strength;
    uniform float radius;
    uniform float aspectRatio;
    uniform vec2 center;

    void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
      vec2 c = uv - center;
      c.x *= aspectRatio;
      float dist = length(c);
      float t = max(0.0, 1.0 - dist / max(radius, 0.0001));
      float angle = strength * t * t;
      float s = sin(angle);
      float co = cos(angle);
      c = vec2(c.x * co - c.y * s, c.x * s + c.y * co);
      c.x /= aspectRatio;
      vec2 warped = c + center;
      warped = clamp(warped, 0.0, 1.0);
      outputColor = texture2D(inputBuffer, warped);
    }
  `,
}

export class SwirlEffectImpl extends Effect {
  constructor({
    blendFunction = BlendFunction.NORMAL,
    strength = 2.0,
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
    super('SwirlEffect', SwirlShader.fragmentShader, {
      blendFunction,
      uniforms: new Map<string, Uniform<unknown>>([
        ['strength', new Uniform(strength)],
        ['radius', new Uniform(radius)],
        ['aspectRatio', new Uniform(aspectRatio)],
        ['center', new Uniform({ x: centerX, y: centerY })],
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

export const SwirlEffect = wrapEffect(SwirlEffectImpl)
