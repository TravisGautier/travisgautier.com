import { noise } from './noise';

export const skyVert = /* glsl */ `
varying vec3 vPos;
varying vec2 vUv;
void main(){
  vPos=position;
  vUv=uv;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
}
`;

// Sky dome. Warm marble/parchment daylight at uHold=0 ("The Work" side),
// dusky mauve at uHold=1 ("The Library" side). No sky-blue anywhere.
export const skyFrag = /* glsl */ `
precision highp float;
uniform float uHold;
uniform float uTime;
uniform float uSkyCloudNoise;
varying vec3 vPos;
varying vec2 vUv;
${noise}
void main(){
  float h = normalize(vPos).y;
  vec3 zenith = vec3(0.86, 0.80, 0.68); vec3 horizon = vec3(0.97, 0.95, 0.91); vec3 sunHorizon = vec3(0.96, 0.88, 0.72);
  vec3 zenithP = vec3(0.52, 0.44, 0.62); vec3 horizonP = vec3(0.86, 0.80, 0.86); vec3 sunHorizonP = vec3(0.80, 0.66, 0.82);
  vec3 z = mix(zenith, zenithP, uHold); vec3 hr = mix(horizon, horizonP, uHold); vec3 sh = mix(sunHorizon, sunHorizonP, uHold);
  vec3 col = mix(sh, hr, smoothstep(-0.05, 0.15, h)); col = mix(col, z, smoothstep(0.15, 0.65, h));
  vec3 sunDir = normalize(vec3(0.6, 0.45, -0.5));
  float sunDot = max(dot(normalize(vPos), sunDir), 0.0);
  float sunGlow = pow(sunDot, 48.0) * 2.0; float sunHalo = pow(sunDot, 6.0) * 0.35;
  vec3 sunCol = mix(vec3(1.0, 0.95, 0.80), vec3(0.85, 0.70, 0.95), uHold);
  col += sunCol * (sunGlow + sunHalo);
  float cloudH = smoothstep(0.08, 0.45, h) * smoothstep(0.8, 0.4, h);
  vec2 cloudUV = vPos.xz * 0.008;
  float c1 = snoise(cloudUV + uTime * 0.005) * 0.5 + 0.5;
  float c2 = snoise(cloudUV * 2.3 - uTime * 0.008) * 0.5 + 0.5;
  float cloud = uSkyCloudNoise * smoothstep(0.38, 0.72, c1 * c2) * cloudH * 0.35;
  col = mix(col, vec3(1.0, 0.98, 0.96), cloud);
  gl_FragColor = vec4(col, 1.0);
}
`;
