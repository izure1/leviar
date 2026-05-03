/**
 * WebGL Gradient Shader
 *
 * Canvas Texture 없이 GLSL uniform만으로 linear / circular gradient를 렌더링합니다.
 * 최대 8개 color stop 지원. SDF border-radius 및 ellipse 클리핑 내장.
 * GLSL ES 1.00 호환 (constant index only).
 */

export const gradientVertex = /* glsl */ `
  attribute vec2 position;
  attribute vec2 uv;
  uniform mat4 uModelMatrix;
  uniform mat4 uViewMatrix;
  uniform mat4 uProjectionMatrix;
  varying vec2 vUV;

  void main() {
    vUV = uv;
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(position, 0.0, 1.0);
  }
`

export const gradientFragment = /* glsl */ `
  precision highp float;

  #define PI 3.14159265358979323846

  uniform int   uStopCount;
  uniform vec4  uStopColors0;
  uniform vec4  uStopColors1;
  uniform vec4  uStopColors2;
  uniform vec4  uStopColors3;
  uniform vec4  uStopColors4;
  uniform vec4  uStopColors5;
  uniform vec4  uStopColors6;
  uniform vec4  uStopColors7;
  uniform float uStopOffset0;
  uniform float uStopOffset1;
  uniform float uStopOffset2;
  uniform float uStopOffset3;
  uniform float uStopOffset4;
  uniform float uStopOffset5;
  uniform float uStopOffset6;
  uniform float uStopOffset7;
  uniform float uDirection;
  uniform int   uType;

  uniform vec2  uSize;
  uniform vec4  uBorderRadius;
  uniform float uIsEllipse;
  uniform float uOpacity;

  varying vec2 vUV;

  float sdRoundedBox(vec2 p, vec2 b, vec4 r) {
    float rx = (p.x > 0.0)
      ? ((p.y > 0.0) ? r.y : r.z)
      : ((p.y > 0.0) ? r.x : r.w);
    vec2 q = abs(p) - b + rx;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - rx;
  }

  vec4 getColor(int i) {
    if (i == 0) return uStopColors0;
    if (i == 1) return uStopColors1;
    if (i == 2) return uStopColors2;
    if (i == 3) return uStopColors3;
    if (i == 4) return uStopColors4;
    if (i == 5) return uStopColors5;
    if (i == 6) return uStopColors6;
    return uStopColors7;
  }

  float getOffset(int i) {
    if (i == 0) return uStopOffset0;
    if (i == 1) return uStopOffset1;
    if (i == 2) return uStopOffset2;
    if (i == 3) return uStopOffset3;
    if (i == 4) return uStopOffset4;
    if (i == 5) return uStopOffset5;
    if (i == 6) return uStopOffset6;
    return uStopOffset7;
  }

  vec4 evalStops(float t) {
    if (t <= uStopOffset0) return uStopColors0;
    vec4 result = uStopColors0;
    for (int i = 0; i < 7; i++) {
      int next = i + 1;
      if (next >= uStopCount) break;
      float s0 = getOffset(i);
      float s1 = getOffset(next);
      if (t >= s0 && t <= s1) {
        float localT = (s1 > s0) ? (t - s0) / (s1 - s0) : 0.0;
        result = mix(getColor(i), getColor(next), localT);
        break;
      }
      result = getColor(next);
    }
    return result;
  }

  void main() {
    vec2 p = (vUV - 0.5) * uSize;

    if (uIsEllipse > 0.5) {
      vec2 pN = vUV * 2.0 - 1.0;
      if (dot(pN, pN) > 1.0) discard;
    } else {
      float d = sdRoundedBox(p, uSize * 0.5, uBorderRadius);
      if (d > 0.0) discard;
    }

    float t;
    if (uType == 1) {
      vec2 pNorm = vUV * 2.0 - 1.0;
      t = clamp(length(pNorm), 0.0, 1.0);
    } else {
      float rad = (uDirection - 90.0) * PI / 180.0;
      vec2 dir = vec2(cos(rad), -sin(rad));
      t = clamp(dot(vUV - 0.5, dir) + 0.5, 0.0, 1.0);
    }

    vec4 color = evalStops(t);
    float a = color.a * uOpacity;
    gl_FragColor = vec4(color.rgb * a, a);
  }
`
