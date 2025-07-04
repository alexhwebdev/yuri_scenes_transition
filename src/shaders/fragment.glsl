uniform float time;
uniform float progress;
uniform sampler2D uTexture1;
uniform sampler2D uTexture2;
uniform vec4 resolution;
varying vec2 vUv;
varying vec3 vPosition;
float PI = 3.14;

void main()
{
  vec4 t = texture2D(uTexture1, vUv);
  vec4 t1 = texture2D(uTexture2, vUv);
  float sweep = step(vUv.y, progress);
  vec4 finalTexture = mix(t, t1, sweep);
  // gl_FragColor = t * sweep;
  gl_FragColor = finalTexture;
}