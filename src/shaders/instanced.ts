/**
 * 파티클 및 텍스처 Instanced 렌더링 쉐이더
 * Renderer.ts에서 자동 배칭(Auto-Batching)에 사용됩니다.
 */
export const instancedVertex = /* glsl */ `
  attribute vec2 position;
  attribute vec2 uv;

  // instanced attributes (4x4 Model Matrix split into 4 vec4s)
  attribute vec4 instanceMat0;
  attribute vec4 instanceMat1;
  attribute vec4 instanceMat2;
  attribute vec4 instanceMat3;
  
  // x: opacity, y: flipY
  attribute vec2 instanceOpacityFlip;
  
  // x: uvOffsetX, y: uvOffsetY, z: uvScaleX, w: uvScaleY
  attribute vec4 instanceUVParams;

  uniform mat4 uProjectionMatrix;

  varying vec2 vUV;
  varying float vOpacity;

  void main() {
    float flipY = instanceOpacityFlip.y;
    vec2 finalUV = uv;
    if (flipY > 0.0) {
      finalUV.y = 1.0 - finalUV.y;
    }
    
    // UV Offset & Scale
    vUV = finalUV * instanceUVParams.zw + instanceUVParams.xy;
    vOpacity = instanceOpacityFlip.x;
    
    mat4 modelMat = mat4(
      instanceMat0,
      instanceMat1,
      instanceMat2,
      instanceMat3
    );

    vec4 worldPos = modelMat * vec4(position, 0.0, 1.0);
    gl_Position = uProjectionMatrix * worldPos;
  }
`

export const instancedFragment = /* glsl */ `
  precision highp float;
  uniform sampler2D uTexture;
  varying vec2 vUV;
  varying float vOpacity;

  void main() {
    vec4 color = texture2D(uTexture, vUV);
    gl_FragColor = vec4(color.rgb, color.a * vOpacity);
  }
`
