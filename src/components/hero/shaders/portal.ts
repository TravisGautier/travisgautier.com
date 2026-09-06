import { noise } from './noise';

export const portalVert = /* glsl */ `
varying vec2 vUv;
void main(){
  vUv=uv;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
}
`;

// Gold face — "The Work". Colours are the venture accent and intentionally
// stay outside the site palette (see docs/design-system.md § Hero scene).
export const portalGoldFrag = /* glsl */ `
precision highp float;
uniform float uTime;
uniform vec2 uMouse;
uniform float uHover;
varying vec2 vUv;
${noise}
void main(){
  vec2 uv=vUv; vec2 c=uv-0.5;
  float f1=snoise(vec2(uv.x*3.0,uv.y*2.0-uTime*0.4))*0.6;
  float f2=snoise(vec2(uv.x*5.0+1.0,uv.y*3.0-uTime*0.55))*0.35;
  float f3=snoise(vec2(uv.x*1.5,uv.y*1.2-uTime*0.25+3.0))*0.4;
  vec2 mOff=c-uMouse*0.25;float mD=length(mOff);
  float mE=smoothstep(0.5,0.0,mD)*uHover*0.35;
  float n=f1+f2+f3+mE;
  vec3 deep=vec3(0.12,0.08,0.02);vec3 mid=vec3(0.65,0.45,0.12);
  vec3 bright=vec3(0.92,0.78,0.42);vec3 hot=vec3(1.0,0.95,0.75);
  vec3 col=mix(deep,mid,smoothstep(-0.4,0.2,n));
  col=mix(col,bright,smoothstep(0.1,0.6,n));
  col+=hot*smoothstep(0.55,0.9,n)*0.45;
  float eX=smoothstep(0.0,0.06,uv.x)*smoothstep(1.0,0.94,uv.x);
  float eY=smoothstep(0.0,0.06,uv.y)*smoothstep(1.0,0.94,uv.y);
  float edge=eX*eY;
  col+=vec3(0.78,0.55,0.15)*(1.0-edge)*0.5;
  float pulse=0.75+0.25*sin(uTime*0.6);
  float alpha=edge*(0.55+0.35*abs(n))*pulse+uHover*0.15*edge;
  gl_FragColor=vec4(col,alpha);
}
`;

// Purple face — "The Library".
export const portalPurpleFrag = /* glsl */ `
precision highp float;
uniform float uTime;
uniform vec2 uMouse;
uniform float uHover;
varying vec2 vUv;
${noise}
void main(){
  vec2 uv=vUv; vec2 c=uv-0.5;
  float f1=snoise(vec2(uv.x*2.5+uTime*0.18,uv.y*3.0-uTime*0.35));
  float f2=snoise(vec2(uv.x*4.0-uTime*0.22,uv.y*2.5+uTime*0.4))*0.5;
  float f3=snoise(vec2(uv.x*1.3+5.0,uv.y*1.8+uTime*0.2))*0.4;
  vec2 mOff=c-uMouse*0.25;float mD=length(mOff);
  float mE=smoothstep(0.5,0.0,mD)*uHover*0.35;
  float n=(f1+f2+f3)*0.55+mE;
  vec3 deep=vec3(0.06,0.02,0.14);vec3 mid=vec3(0.38,0.18,0.65);
  vec3 bright=vec3(0.62,0.42,0.95);vec3 hot=vec3(0.82,0.68,1.0);
  vec3 col=mix(deep,mid,smoothstep(-0.4,0.2,n));
  col=mix(col,bright,smoothstep(0.15,0.6,n));
  col+=hot*smoothstep(0.5,0.85,n)*0.45;
  float eX=smoothstep(0.0,0.06,uv.x)*smoothstep(1.0,0.94,uv.x);
  float eY=smoothstep(0.0,0.06,uv.y)*smoothstep(1.0,0.94,uv.y);
  float edge=eX*eY;
  col+=vec3(0.35,0.15,0.6)*(1.0-edge)*0.5;
  float pulse=0.75+0.25*sin(uTime*0.5+1.5);
  float alpha=edge*(0.55+0.35*abs(n))*pulse+uHover*0.15*edge;
  gl_FragColor=vec4(col,alpha);
}
`;
