/**
 * Public asset URLs. Uses import.meta.env.BASE_URL so paths work on
 * GitHub Pages (e.g. /VVideo/example-assets/...) and locally (/example-assets/...).
 */
const base = import.meta.env.BASE_URL

/** Example background videos in public/example-assets/Background/. */
export const EXAMPLE_BACKGROUND_PATHS = [
  `${base}example-assets/Background/dots.webm`,
  `${base}example-assets/Background/liquid.webm`,
  `${base}example-assets/Background/triangle.webm`,
  `${base}example-assets/Background/tunnel-square.webm`,
]

/** Example clip videos in public/example-assets/clips/. */
export const EXAMPLE_CLIP_PATHS = [
  `${base}example-assets/clips/RAUSCH-screen.webm`,
  `${base}example-assets/clips/ko.webm`,
  `${base}example-assets/clips/reach.webm`,
]
