/**
 * BoxShadow SDF 쉐이더
 * Rectangle(0.0)과 Ellipse(1.0) 모두를 지원합니다.
 */
export const shadowVertex = /* glsl */ `
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

export const shadowFragment = /* glsl */ `
  precision highp float;
  uniform vec4 uColor;
  uniform float uOpacity;
  uniform vec2 uSize;      // Quad size (includes blur padding)
  uniform vec2 uBoxSize;   // Actual object size (w, h)
  uniform float uBlur;
  uniform float uSpread;
  uniform float uIsEllipse;
  uniform vec4 uBorderRadius; // [TR, BR, TL, BL]
  varying vec2 vUV;

  float sdRoundedBox(vec2 p, vec2 b, vec4 r) {
    r.xy = (p.x > 0.0) ? r.xy : r.zw;
    r.x  = (p.y > 0.0) ? r.x  : r.y;
    vec2 q = abs(p) - b + r.x;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r.x;
  }

  void main() {
    // p is pixel mapped: center is (0,0)
    vec2 p = (vUV - 0.5) * uSize;
    float d = 0.0;
    
    // Size of the hard object
    vec2 radius = uBoxSize * 0.5;

    if (uIsEllipse > 0.5) {
      if (radius.x <= 0.0 || radius.y <= 0.0) {
         discard;
      }
      vec2 scaledP = p / radius; // Distance to ellipse scaled boundary
      d = (length(scaledP) - 1.0) * min(radius.x, radius.y);
    } else {
      d = sdRoundedBox(p, radius, uBorderRadius);
    }

    // Apply shadow spread
    d -= uSpread;

    float alpha = 1.0;
    if (uBlur > 0.0) {
      // CSS box-shadow expands outward by roughly the blur radius.
      // -uBlur to +uBlur gives a softer, thicker falloff matching standard web drop shadows.
      alpha = 1.0 - smoothstep(-uBlur, uBlur, d);
    } else {
      alpha = step(d, 0.0);
    }

    if (alpha <= 0.0) discard;

    gl_FragColor = vec4(uColor.rgb, uColor.a * uOpacity * alpha);
  }
`
