import { Uniform } from 'three'
import { BlendFunction, Effect } from 'postprocessing'
import { wrapEffect } from '@react-three/postprocessing'

const FisheyeShader = {
  fragmentShader: /* glsl */ `
    uniform float strength;
    uniform float aspectRatio;

    void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
      vec2 c = uv - 0.5;
      c.x *= aspectRatio;
      float r = length(c);
      float s = max(strength, 0.0001);
      float theta = atan(r * s) / s;
      vec2 warped = r > 0.0001 ? c * (theta / r) : c;
      warped.x /= aspectRatio;
      warped += 0.5;
      warped = clamp(warped, 0.0, 1.0);
      outputColor = texture2D(inputBuffer, warped);
    }
  `,
}

export class FisheyeEffectImpl extends Effect {
  constructor({
    blendFunction = BlendFunction.NORMAL,
    strength = 3.0,
    aspectRatio = 1.0,
  }: {
    blendFunction?: BlendFunction
    strength?: number
    aspectRatio?: number
  } = {}) {
    super('FisheyeEffect', FisheyeShader.fragmentShader, {
      blendFunction,
      uniforms: new Map([
        ['strength', new Uniform(strength)],
        ['aspectRatio', new Uniform(aspectRatio)],
      ]),
    })
  }

  get strength(): number { return this.uniforms.get('strength')!.value }
  set strength(v: number) { this.uniforms.get('strength')!.value = v }

  get aspectRatio(): number { return this.uniforms.get('aspectRatio')!.value }
  set aspectRatio(v: number) { this.uniforms.get('aspectRatio')!.value = v }
}

export const FisheyeEffect = wrapEffect(FisheyeEffectImpl)
