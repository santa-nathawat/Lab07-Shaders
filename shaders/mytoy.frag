#version 450
#extension GL_GOOGLE_include_directive : require

#include <shadertoy.glsl>
#include <noise.glsl>

// "Tidal Observatory": a clouded planet, orbit tracks and three moving moons.
// Drag to move the entire system. Keys 1/2/3 show field/noise/orbit masks.
const uint CLOUD_OCTAVES = 4u;
const float PLANET_RADIUS = 0.42;
const float ORBIT_SPEED = 0.65;

float sdf_circle(vec2 p, float r) { return length(p) - r; }

float fill(float d) {
  float w = max(fwidth(d), 1e-5);
  return 1.0 - smoothstep(-w, w, d);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  // The wrapper already flipped Y; these coordinates point up.
  vec2 p = (2.0 * fragCoord - iResolution.xy) / iResolution.y;
  vec2 center = vec2(0.0);
  if (iMouse.z > 0.0)
    center = (2.0 * iMouse.xy - iResolution.xy) / iResolution.y;
  vec2 q = p - center;
  float planet = sdf_circle(q, PLANET_RADIUS);
  float planetMask = fill(planet);

  // This is the expensive term: one fBM call, capped at four octaves.
  float clouds = fbm(q * 4.0 + vec2(iTime * 0.12, -iTime * 0.08),
                     min(u.octaves, CLOUD_OCTAVES));
  float bands = 0.5 + 0.5 * sin(q.y * 24.0 + clouds * 9.0 + iTime * 0.4);
  vec3 surface = mix(vec3(0.035, 0.16, 0.24), vec3(0.25, 0.85, 0.74), bands);
  float z = sqrt(max(PLANET_RADIUS * PLANET_RADIUS - dot(q, q), 0.0));
  vec3 normal = normalize(vec3(q, z) + vec3(0.0, 0.0, 1e-5));
  float light = 0.18 + 0.82 * max(dot(normal, normalize(vec3(-0.6, 0.7, 1.0))), 0.0);

  vec3 col = vec3(0.006, 0.013, 0.035);
  float halo = exp(-9.0 * abs(planet));
  col += vec3(0.015, 0.17, 0.20) * halo;
  float orbitMask = 0.0;
  float moonMask = 0.0;
  float field = planet;
  for (int j = 0; j < 3; ++j) {
    float radius = 0.63 + float(j) * 0.19;
    float track = abs(sdf_circle(q, radius)) - 0.0015;
    orbitMask = max(orbitMask, fill(track));
    float angle = iTime * ORBIT_SPEED / (1.0 + float(j) * 0.45) + float(j) * 2.1;
    vec2 moonCenter = radius * vec2(cos(angle), sin(angle));
    float moon = sdf_circle(q - moonCenter, 0.035 + 0.012 * float(j));
    moonMask = max(moonMask, fill(moon));
    field = min(field, moon);
    col += vec3(0.35, 0.14, 0.035) * exp(-65.0 * abs(moon));
  }
  col += orbitMask * vec3(0.08, 0.18, 0.24);
  col = mix(col, surface * light, planetMask);
  col = mix(col, vec3(1.0, 0.72, 0.30), moonMask);

  if (iMode == 1u) col = vec3(clamp(field * 0.5 + 0.5, 0.0, 1.0));
  else if (iMode == 2u) col = vec3(clouds);
  else if (iMode == 3u) col = vec3(orbitMask, planetMask, moonMask);
  fragColor = vec4(col, 1.0);
}
