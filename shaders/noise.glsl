#ifndef NOISE_GLSL_INCLUDED
#define NOISE_GLSL_INCLUDED

uint pcg(uint v) {
  v = v * 747796405u + 2891336453u;
  uint w = ((v >> ((v >> 28u) + 4u)) ^ v) * 277803737u;
  return (w >> 22u) ^ w;
}

float hash(uvec2 p) { return float(pcg(p.x ^ pcg(p.y))) / 4294967296.0; }

float value_noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  uvec2 cell = uvec2(ivec2(i) + 1000);
  vec2 weight = f * f * (3.0 - 2.0 * f);
  float a = hash(cell);
  float b = hash(cell + uvec2(1, 0));
  float c = hash(cell + uvec2(0, 1));
  float d = hash(cell + uvec2(1, 1));
  return mix(mix(a, b, weight.x), mix(c, d, weight.x), weight.y);
}

float fbm(vec2 p, uint octaves) {
  float sum = 0.0;
  float amplitude = 0.5;
  for (uint octave = 0u; octave < octaves; ++octave) {
    sum += amplitude * value_noise(p);
    p *= 2.0;
    amplitude *= 0.5;
  }
  return sum;
}

#endif
