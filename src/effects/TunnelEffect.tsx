import { Uniform } from 'three'
import { BlendFunction, Effect } from 'postprocessing'
import { wrapEffect } from '@react-three/postprocessing'

const TunnelShader = {
  fragmentShader: /* glsl */ `
    uniform float strength;
    uniform vec2 center;
    uniform float aspectRatio;

    void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
      vec2 c = uv - center;
      c.x *= aspectRatio;
      float r = length(c);
      float zoom = 1.0 + strength * (1.0 - r);
      zoom = max(zoom, 0.0001);
      vec2 warped = r > 0.0001 ? c / zoom : c;
      warped.x /= aspectRatio;
      warped += center;
      warped = clamp(warped, 0.0, 1.0);
      outputColor = texture2D(inputBuffer, warped);
    }
  `,
}

export class TunnelEffectImpl extends Effect {
  constructor({
    blendFunction = BlendFunction.NORMAL,
    strength = 0.3,
    centerX = 0.5,
    centerY = 0.5,
    aspectRatio = 1.0,
  }: {
    blendFunction?: BlendFunction
    strength?: number
    centerX?: number
    centerY?: number
    aspectRatio?: number
  } = {}) {
    super('TunnelEffect', TunnelShader.fragmentShader, {
      blendFunction,
      uniforms: new Map<string, Uniform<unknown>>([
        ['strength', new Uniform(strength)],
        ['center', new Uniform({ x: centerX, y: centerY })],
        ['aspectRatio', new Uniform(aspectRatio)],
      ]),
    })
  }

  get strength(): number { return this.uniforms.get('strength')!.value }
  set strength(v: number) { this.uniforms.get('strength')!.value = v }

  get aspectRatio(): number { return this.uniforms.get('aspectRatio')!.value }
  set aspectRatio(v: number) { this.uniforms.get('aspectRatio')!.value = v }

  get centerX(): number { return this.uniforms.get('center')!.value.x }
  set centerX(v: number) { this.uniforms.get('center')!.value.x = v }

  get centerY(): number { return this.uniforms.get('center')!.value.y }
  set centerY(v: number) { this.uniforms.get('center')!.value.y = v }
}

export const TunnelEffect = wrapEffect(TunnelEffectImpl)
