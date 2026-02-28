import { Uniform } from 'three'
import { BlendFunction, Effect } from 'postprocessing'
import { wrapEffect } from '@react-three/postprocessing'

const RadialChromaticShader = {
  fragmentShader: /* glsl */ `
    uniform float strength;
    uniform float exponent;

    void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
      vec2 c = uv - 0.5;
      float r = length(c);
      float offset = strength * pow(r, max(exponent, 0.1));
      vec2 dir = c / max(r, 0.0001);
      float red   = texture2D(inputBuffer, clamp(uv + dir * offset, 0.0, 1.0)).r;
      float green = texture2D(inputBuffer, uv).g;
      float blue  = texture2D(inputBuffer, clamp(uv - dir * offset, 0.0, 1.0)).b;
      outputColor = vec4(red, green, blue, inputColor.a);
    }
  `,
}

export class RadialChromaticEffectImpl extends Effect {
  constructor({
    blendFunction = BlendFunction.NORMAL,
    strength = 0.05,
    exponent = 2.0,
  }: {
    blendFunction?: BlendFunction
    strength?: number
    exponent?: number
  } = {}) {
    super('RadialChromaticEffect', RadialChromaticShader.fragmentShader, {
      blendFunction,
      uniforms: new Map([
        ['strength', new Uniform(strength)],
        ['exponent', new Uniform(exponent)],
      ]),
    })
  }

  get strength(): number { return this.uniforms.get('strength')!.value }
  set strength(v: number) { this.uniforms.get('strength')!.value = v }

  get exponent(): number { return this.uniforms.get('exponent')!.value }
  set exponent(v: number) { this.uniforms.get('exponent')!.value = v }
}

export const RadialChromaticEffect = wrapEffect(RadialChromaticEffectImpl)
