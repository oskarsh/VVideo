import { Uniform } from 'three'
import { BlendFunction, Effect } from 'postprocessing'
import { wrapEffect } from '@react-three/postprocessing'

/**
 * GPU pixel-sort approximation.
 *
 * For each pixel whose luminance is >= threshold, the shader samples a window
 * of N pixels along the sort axis, ranks the current pixel by brightness among
 * those above the threshold, then maps that rank to a new UV position – creating
 * the characteristic pixel-sorting streaks without a multi-pass CPU sort.
 *
 * Uniforms:
 *   threshold  – luminance cutoff (0–1).  Pixels below this are left untouched.
 *   span       – half-width of the sort window in UV space (e.g. 0.15 = 15% of dimension).
 *   axis       – 0 = horizontal  |  1 = vertical
 */
const PixelSortShader = {
  fragmentShader: /* glsl */ `
    uniform float threshold;
    uniform float span;
    uniform float axis;

    float luma(vec3 c) {
      return dot(c, vec3(0.299, 0.587, 0.114));
    }

    void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
      float myLuma = luma(inputColor.rgb);

      // Pixels below threshold are not sorted
      if (myLuma < threshold) {
        outputColor = inputColor;
        return;
      }

      // Sort direction vector
      vec2 dir = axis < 0.5 ? vec2(1.0, 0.0) : vec2(0.0, 1.0);

      // Sample a window of pixels and rank the current one by brightness
      // N = 28 gives a good trade-off between quality and GPU cost
      const int N = 28;
      float rank  = 0.0;
      float count = 0.0;

      for (int i = 0; i < N; i++) {
        // Spread samples symmetrically around current UV
        float t = (float(i) / float(N - 1) - 0.5) * span * 2.0;
        vec2 sUv = clamp(uv + dir * t, 0.0, 1.0);
        float sLuma = luma(texture2D(inputBuffer, sUv).rgb);
        if (sLuma >= threshold) {
          count += 1.0;
          // Lower rank = darker (moves toward negative dir)
          if (sLuma < myLuma) rank += 1.0;
        }
      }

      if (count < 2.0) {
        outputColor = inputColor;
        return;
      }

      // Normalised rank: 0 = darkest-in-window, 1 = brightest-in-window
      float normRank = rank / (count - 1.0);
      // Map rank back to a UV offset: bright pixels pushed to +dir, dark to -dir
      float sortedT = (normRank - 0.5) * span * 2.0;
      vec2 sortedUv = clamp(uv + dir * sortedT, 0.0, 1.0);
      outputColor = texture2D(inputBuffer, sortedUv);
    }
  `,
}

export class PixelSortEffectImpl extends Effect {
  constructor({
    blendFunction = BlendFunction.NORMAL,
    threshold = 0.3,
    span = 0.15,
    axis = 0.0,
  }: {
    blendFunction?: BlendFunction
    threshold?: number
    span?: number
    /** 0 = horizontal, 1 = vertical */
    axis?: number
  } = {}) {
    super('PixelSortEffect', PixelSortShader.fragmentShader, {
      blendFunction,
      uniforms: new Map([
        ['threshold', new Uniform(threshold)],
        ['span', new Uniform(span)],
        ['axis', new Uniform(axis)],
      ]),
    })
  }

  get threshold(): number { return this.uniforms.get('threshold')!.value }
  set threshold(v: number) { this.uniforms.get('threshold')!.value = v }

  get span(): number { return this.uniforms.get('span')!.value }
  set span(v: number) { this.uniforms.get('span')!.value = v }

  get axis(): number { return this.uniforms.get('axis')!.value }
  set axis(v: number) { this.uniforms.get('axis')!.value = v }
}

export const PixelSortEffect = wrapEffect(PixelSortEffectImpl)
