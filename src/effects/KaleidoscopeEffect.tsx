import { Uniform } from 'three'
import { BlendFunction, Effect } from 'postprocessing'
import { wrapEffect } from '@react-three/postprocessing'

const KaleidoscopeShader = {
  fragmentShader: /* glsl */ `
    uniform float segments;
    uniform float rotation;
    uniform float aspectRatio;

    void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
      const float PI = 3.14159265358979;
      vec2 c = uv - 0.5;
      c.x *= aspectRatio;
      float r = length(c);
      float angle = atan(c.y, c.x) + rotation;
      float seg = max(segments, 2.0);
      float segAngle = PI / seg;
      angle = mod(angle, 2.0 * segAngle);
      if (angle > segAngle) angle = 2.0 * segAngle - angle;
      vec2 warped;
      warped.x = r * cos(angle) / aspectRatio + 0.5;
      warped.y = r * sin(angle) + 0.5;
      warped = clamp(warped, 0.0, 1.0);
      outputColor = texture2D(inputBuffer, warped);
    }
  `,
}

export class KaleidoscopeEffectImpl extends Effect {
  constructor({
    blendFunction = BlendFunction.NORMAL,
    segments = 6.0,
    rotation = 0.0,
    aspectRatio = 1.0,
  }: {
    blendFunction?: BlendFunction
    segments?: number
    rotation?: number
    aspectRatio?: number
  } = {}) {
    super('KaleidoscopeEffect', KaleidoscopeShader.fragmentShader, {
      blendFunction,
      uniforms: new Map([
        ['segments', new Uniform(segments)],
        ['rotation', new Uniform(rotation)],
        ['aspectRatio', new Uniform(aspectRatio)],
      ]),
    })
  }

  get segments(): number { return this.uniforms.get('segments')!.value }
  set segments(v: number) { this.uniforms.get('segments')!.value = v }

  get rotation(): number { return this.uniforms.get('rotation')!.value }
  set rotation(v: number) { this.uniforms.get('rotation')!.value = v }

  get aspectRatio(): number { return this.uniforms.get('aspectRatio')!.value }
  set aspectRatio(v: number) { this.uniforms.get('aspectRatio')!.value = v }
}

export const KaleidoscopeEffect = wrapEffect(KaleidoscopeEffectImpl)
