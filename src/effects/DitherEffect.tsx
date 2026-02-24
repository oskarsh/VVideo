import { Uniform } from 'three'
import { BlendFunction, Effect } from 'postprocessing'
import { wrapEffect } from '@react-three/postprocessing'

const DitherShader = {
  fragmentShader: /* glsl */ `
    uniform float levels;
    uniform int mode;
    uniform float intensity;
    uniform float thresholdBias;
    uniform float luminanceOnly;

    float luminance(vec3 c) {
      return dot(c, vec3(0.299, 0.587, 0.114));
    }

    // Bayer 2x2: (0,2,3,1)/4
    float bayer2(ivec2 p) {
      int i = (p.x & 1) + (p.y & 1) * 2;
      if (i == 0) return 0.0;
      if (i == 1) return 0.5;
      if (i == 2) return 0.75;
      return 0.25;
    }

    // Bayer 4x4
    float bayer4(ivec2 p) {
      int x = p.x & 3, y = p.y & 3;
      int i = x + y * 4;
      const float m[16] = float[16](
        0.0/16.0, 8.0/16.0, 2.0/16.0, 10.0/16.0,
        12.0/16.0, 4.0/16.0, 14.0/16.0, 6.0/16.0,
        3.0/16.0, 11.0/16.0, 1.0/16.0, 9.0/16.0,
        15.0/16.0, 7.0/16.0, 13.0/16.0, 5.0/16.0
      );
      return m[i];
    }

    // Bayer 8x8 recursive
    float bayer8(ivec2 p) {
      int x = p.x & 7, y = p.y & 7;
      int v0 = (x & 1) + (y & 1) * 2;
      v0 = (v0 == 0) ? 0 : (v0 == 1) ? 2 : (v0 == 2) ? 3 : 1;
      int v1 = ((x >> 1) & 1) + ((y >> 1) & 1) * 2;
      v1 = (v1 == 0) ? 0 : (v1 == 1) ? 2 : (v1 == 2) ? 3 : 1;
      int v2 = ((x >> 2) & 1) + ((y >> 2) & 1) * 2;
      v2 = (v2 == 0) ? 0 : (v2 == 1) ? 2 : (v2 == 2) ? 3 : 1;
      int v = v0 + v1 * 4 + v2 * 16;
      return float(v) / 64.0;
    }

    float random(vec2 uv) {
      return fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
      ivec2 px = ivec2(gl_FragCoord.xy);
      float threshold = 0.0;
      if (mode == 0) threshold = bayer2(px);
      else if (mode == 1) threshold = bayer4(px);
      else if (mode == 2) threshold = bayer8(px);
      else threshold = random(uv * resolution);
      threshold = clamp(threshold + thresholdBias, 0.0, 1.0);

      float L = max(levels, 2.0);
      vec3 c = inputColor.rgb;
      vec3 dithered = floor(c * L + threshold) / L;

      if (luminanceOnly > 0.5) {
        float lumIn = luminance(inputColor.rgb);
        float lumOut = luminance(dithered);
        float scale = lumIn < 0.0001 ? 1.0 : clamp(lumOut / lumIn, 0.0, 3.0);
        c = clamp(inputColor.rgb * scale, 0.0, 1.0);
      } else {
        c = dithered;
      }
      c = mix(inputColor.rgb, c, intensity);
      outputColor = vec4(c, inputColor.a);
    }
  `,
}

export class DitherEffectImpl extends Effect {
  constructor({
    blendFunction = BlendFunction.NORMAL,
    levels = 8,
    mode = 1,
    intensity = 1,
    thresholdBias = 0,
    luminanceOnly = false,
  }: {
    blendFunction?: BlendFunction
    levels?: number
    mode?: number
    intensity?: number
    thresholdBias?: number
    luminanceOnly?: boolean
  } = {}) {
    super('DitherEffect', DitherShader.fragmentShader, {
      blendFunction,
      uniforms: new Map([
        ['levels', new Uniform(levels)],
        ['mode', new Uniform(mode)],
        ['intensity', new Uniform(intensity)],
        ['thresholdBias', new Uniform(thresholdBias)],
        ['luminanceOnly', new Uniform(luminanceOnly ? 1 : 0)],
      ]),
    })
  }

  get levels(): number {
    return this.uniforms.get('levels')!.value
  }
  set levels(v: number) {
    this.uniforms.get('levels')!.value = v
  }

  get mode(): number {
    return this.uniforms.get('mode')!.value
  }
  set mode(v: number) {
    this.uniforms.get('mode')!.value = v
  }

  get intensity(): number {
    return this.uniforms.get('intensity')!.value
  }
  set intensity(v: number) {
    this.uniforms.get('intensity')!.value = v
  }

  get thresholdBias(): number {
    return this.uniforms.get('thresholdBias')!.value
  }
  set thresholdBias(v: number) {
    this.uniforms.get('thresholdBias')!.value = v
  }

  get luminanceOnly(): boolean {
    return Number(this.uniforms.get('luminanceOnly')!.value) > 0.5
  }
  set luminanceOnly(v: boolean) {
    this.uniforms.get('luminanceOnly')!.value = v ? 1 : 0
  }
}

export const DitherEffect = wrapEffect(DitherEffectImpl)
