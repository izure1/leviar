import {
  Renderer as OGLRenderer,
  Camera,
  Transform,
  Geometry,
  Program,
  Mesh,
  Texture,
  Mat4,
  Vec3 as OglVec3
} from 'ogl'
import type { OGLRenderingContext } from 'ogl'

import { colorVertex, colorFragment, ellipseVertex, ellipseFragment } from './shaders/color.js'
import { textureVertex, textureFragment } from './shaders/texture.js'
import { instancedVertex, instancedFragment } from './shaders/instanced.js'
import { shadowVertex, shadowFragment } from './shaders/shadow.js'
import { alphaOutlineVertex, alphaOutlineFragment } from './shaders/alphaOutline.js'
import { alphaShadowVertex, alphaShadowFragment } from './shaders/alphaShadow.js'
import { gradientVertex, gradientFragment } from './shaders/gradient.js'
import { parseTextMarkup } from './utils/textMarkup.js'
import { parseBorderRadius, parseMargin } from './utils/styleUtils.js'
import { TEXTURE_THROTTLE_FRAMES, TEXTURE_DEBOUNCE_FRAMES } from './dirty.js'

import type { LeviarObject } from './LeviarObject.js'
import type { Sprite } from './objects/Sprite.js'
import type { LeviarImage } from './objects/LeviarImage.js'
import type { LeviarVideo } from './objects/LeviarVideo.js'
import type { Particle } from './objects/Particle.js'
import type { LoadedAssets } from './types.js'

const AXIS_X = new OglVec3(1, 0, 0)
const AXIS_Y = new OglVec3(0, 1, 0)
const AXIS_Z = new OglVec3(0, 0, 1)

// ─── 크기 제약 헬퍼 ──────────────────────────────────────────────────────────

function clampSize(value: number, min: number | undefined, max: number | undefined): number {
  let result = value
  if (min !== undefined) result = Math.max(result, min)
  if (max !== undefined) result = Math.min(result, max)
  return result
}

// ─── Quad 지오메트리 헬퍼 ────────────────────────────────────────────────────

function createQuadGeometry(gl: OGLRenderingContext) {
  return new Geometry(gl, {
    position: {
      size: 2,
      data: new Float32Array([
        -0.5, -0.5,
        0.5, -0.5,
        0.5, 0.5,
        -0.5, 0.5,
      ]),
    },
    uv: {
      size: 2,
      data: new Float32Array([
        0, 0,
        1, 0,
        1, 1,
        0, 1,
      ]),
    },
    index: {
      data: new Uint16Array([0, 1, 2, 0, 2, 3]),
    },
  })
}

// ─── 색상 파싱 헬퍼 ──────────────────────────────────────────────────────────

function parseCSSColor(color: string): [number, number, number, number] {
  // hex #rrggbb 또는 #rrggbbaa
  if (color.startsWith('#')) {
    const hex = color.slice(1)
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16) / 255
      const g = parseInt(hex[1] + hex[1], 16) / 255
      const b = parseInt(hex[2] + hex[2], 16) / 255
      return [r, g, b, 1]
    }
    if (hex.length >= 6) {
      const r = parseInt(hex.slice(0, 2), 16) / 255
      const g = parseInt(hex.slice(2, 4), 16) / 255
      const b = parseInt(hex.slice(4, 6), 16) / 255
      const a = hex.length >= 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1
      return [r, g, b, a]
    }
  }
  // rgb(r, g, b) 또는 rgba(r, g, b, a)
  const rgbMatch = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/)
  if (rgbMatch) {
    return [
      parseInt(rgbMatch[1]) / 255,
      parseInt(rgbMatch[2]) / 255,
      parseInt(rgbMatch[3]) / 255,
      rgbMatch[4] != null ? parseFloat(rgbMatch[4]) : 1,
    ]
  }
  // hsl(h, s%, l%) 또는 hsla(h, s%, l%, a)
  const hslMatch = color.match(/hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%(?:\s*,\s*([\d.]+))?\s*\)/)
  if (hslMatch) {
    const h = parseFloat(hslMatch[1]) / 360
    const s = parseFloat(hslMatch[2]) / 100
    const l = parseFloat(hslMatch[3]) / 100
    const a = hslMatch[4] != null ? parseFloat(hslMatch[4]) : 1
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }
    if (s === 0) return [l, l, l, a]
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    return [hue2rgb(p, q, h + 1 / 3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1 / 3), a]
  }
  return [1, 1, 1, 1]
}

// ─── 그라디언트 stops 파서 ────────────────────────────────────────────────────
// '45deg, rgb(255,255,255) 0%, rgb(255,0,0) 50%' → { direction: 45, stops: [...] }
interface GradientParsed {
  direction: number
  stops: { offset: number; color: string }[]
}

function parseGradientStops(gradient: string): GradientParsed {
  // 선택적 방향각 파싱: '45deg,' 또는 '-90deg,'
  let direction = 0
  const degMatch = gradient.match(/^\s*(-?[\d.]+)deg\s*,\s*/)
  const stopsStr = degMatch ? gradient.slice(degMatch[0].length) : gradient
  if (degMatch) direction = parseFloat(degMatch[1])

  const stops: { offset: number; color: string }[] = []
  const re = /((?:rgba?|hsla?)\([^)]+\)|#[0-9a-fA-F]+|[a-zA-Z]+)\s+(-?[\d.]+)%/g
  let m: RegExpExecArray | null
  while ((m = re.exec(stopsStr)) != null) {
    const rawOffset = parseFloat(m[2]) / 100
    const clampedOffset = Math.max(0, Math.min(1, rawOffset))
    stops.push({ offset: clampedOffset, color: m[1] })
  }
  return { direction, stops }
}

// ─── 텍스처 캐시 키 ──────────────────────────────────────────────────────────

// 텍스트 오브젝트의 Offscreen Canvas → Texture 캐시
interface TextTextureEntry {
  texture: Texture
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  lastText: string
  mesh: Mesh
}

const TEXT_RENDER_SCALE = 2


// ─── Renderer ────────────────────────────────────────────────────────────────

export class Renderer {
  private ogl: OGLRenderer
  private gl: OGLRenderingContext
  private camera: Camera
  private scene: Transform

  // 공용 지오메트리 (quad)
  private quadGeo!: Geometry

  // 프로그램 캐시
  private colorProgram!: Program
  private ellipseProgram!: Program
  private textureProgram!: Program
  private instancedProgram!: Program
  private shadowProgram!: Program
  private alphaOutlineProgram!: Program
  private alphaShadowProgram!: Program
  private gradientProgram!: Program

  // Placeholder 색상 Program (에러 표시)
  private placeholderProgram!: Program

  // 공유 메쉬 (매 프레임 객체 생성 방지)
  private colorMesh!: Mesh
  private ellipseMesh!: Mesh
  private textureMesh!: Mesh
  private placeholderMesh!: Mesh
  private shadowMesh!: Mesh
  private alphaOutlineMesh!: Mesh
  private alphaShadowMesh!: Mesh
  private gradientMesh!: Mesh

  // 상태 보존용 렌더 변수 (Model/View 매트릭스 계산용)
  private _modelMat = new Mat4()
  private _viewMat = new Mat4()
  private _tmpVec = new OglVec3()
  private _activeObj!: LeviarObject
  private _activeRenderW = 0
  private _activeRenderH = 0

  // 오브젝트별 Mesh 캐시
  private meshCache = new Map<string, Mesh>()

  // gradient 렌더링은 WebGL 셰이더로 전환되어 텍스처 캐시 없음

  // 텍스트 텍스처 캐시 (id → TextTextureEntry)
  private textCache = new Map<string, TextTextureEntry>()

  // 텍스트 내용 기반 공유 캐시 (contentKey → TextTextureEntry)
  // 동일한 텍스트·스타일을 가진 객체끼리 Canvas/Texture를 공유하여 flush 횟수 감소
  private textContentCache = new Map<string, TextTextureEntry>()

  // 공유 텍스처 참조 카운트 (contentKey → 참조 중인 객체 수)
  private textContentRefCount = new Map<string, number>()

  // 카메라 미지정 시 렌더링할 텍스트 오브젝트 모의 객체
  private _noCameraText: any

  public removeTextEntry(id: string) {
    const entry = this.textCache.get(id)
    if (!entry) return

    const contentKey = (entry as any)._contentKey as string | undefined
    if (contentKey) {
      const count = this.textContentRefCount.get(contentKey) || 0
      if (count <= 1) {
        this.textContentRefCount.delete(contentKey)
        this.textContentCache.delete(contentKey)
        // OGL Texture 및 WebGL 리소스 정리
        if (entry.texture && (entry.texture as any).delete) {
          ; (entry.texture as any).delete()
        }
      } else {
        this.textContentRefCount.set(contentKey, count - 1)
      }
    }
    this.textCache.delete(id)
  }

  // 에셋 텍스처 캐시 (src → Texture)
  private assetTextureCache = new Map<string, Texture>()

  // 비디오 텍스처 캐시 (src → Texture) — 매 프레임 업데이트 필요
  private videoTextureCache = new Map<string, Texture>()

  // --- Auto-Batching State ---
  private readonly _batchMaxSize = 1000
  private _batchMat0!: Float32Array
  private _batchMat1!: Float32Array
  private _batchMat2!: Float32Array
  private _batchMat3!: Float32Array
  private _batchOpacityFlip!: Float32Array
  private _batchUVParams!: Float32Array
  private _batchCount = 0
  private _batchTexture: Texture | null = null
  private _batchBlendMode: string = 'source-over'
  private _currentBlendMode: string = ''
  private _instancedGeo!: Geometry
  private _instancedMesh!: Mesh
  private _batchBorderRadius!: Float32Array

  // --- Z-Sort Cache (Dirty-Flag) ---
  /** 정렬 순서가 캐시된 객체 배열 (카메라 거리 기준 내림차순) */
  private _sortedObjects: LeviarObject[] = []
  /** true이면 다음 프레임에 재정렬 */
  private _sortDirty = true
  /** 마지막으로 정렬에 사용된 카메라 회전값 */
  private _lastCamRotX = 0
  private _lastCamRotY = 0
  private _lastCamRotZ = 0
  /** 마지막 정렬 시 객체 수 */
  private _lastObjCount = -1

  private _width: number = 0;
  private _height: number = 0;
  private _lastFocalLength: number = -1;
  private _debugCamZ: number = 0;
  private _canvas!: HTMLCanvasElement

  // ─── 디버그 상태 ─────────────────────────────────────────────────────────
  private _debugMode: boolean = false
  public debugHoveredIds: Set<string> = new Set()
  public debugClickedIds: Map<string, number> = new Map()
  public debugRipples: Array<{ x: number; y: number; time: number }> = []
  private _debugOverlayCanvas: HTMLCanvasElement | null = null
  private _debugOverlayCtx: CanvasRenderingContext2D | null = null
  private _fpsPrevTime = 0
  private _fpsFrameCount = 0
  private _fpsValue = 0

  get debugMode(): boolean { return this._debugMode }
  set debugMode(value: boolean) {
    this._debugMode = value
    if (value) {
      this._setupDebugOverlay()
    } else {
      this._teardownDebugOverlay()
      this.debugHoveredIds.clear()
      this.debugClickedIds.clear()
      this.debugRipples.length = 0
    }
  }

  constructor(canvas: HTMLCanvasElement) {
    this._canvas = canvas

    const N = this._batchMaxSize
    this._batchMat0 = new Float32Array(N * 4)
    this._batchMat1 = new Float32Array(N * 4)
    this._batchMat2 = new Float32Array(N * 4)
    this._batchMat3 = new Float32Array(N * 4)
    this._batchOpacityFlip = new Float32Array(N * 2)
    this._batchUVParams = new Float32Array(N * 4)
    this._batchBorderRadius = new Float32Array(N * 4)

    this.ogl = new OGLRenderer({
      canvas,
      width: canvas.width,
      height: canvas.height,
      alpha: true,
      antialias: true,
      premultipliedAlpha: true,
    })
    this.gl = this.ogl.gl

    this._width = canvas.width;
    this._height = canvas.height;

    // 초기 카메라 투영 (render에서 갱신됨)
    this.camera = new Camera(this.gl, {
      fov: 90,
      aspect: canvas.width / canvas.height,
      near: 0.1,
      far: 100000,
    })
    // OGL 기본 카메라: -Z 방향을 바라봄 (OpenGL 규칙)
    // 구 시스템과 일치: obj.z > cam.z = 앞에 있음
    // camera.position.z = 0, lookAt 없음 → 기본 -Z 바라봄
    this.camera.position.z = 0

    this.scene = new Transform()

    this.quadGeo = createQuadGeometry(this.gl)
    this._initPrograms()
  }

  get width() { return this.ogl.width }
  get height() { return this.ogl.height }

  /**
   * Z-Sort 캐시를 무효화합니다.
   * 객체의 position.z 또는 zIndex가 변경될 때 World에서 호출합니다.
   */
  markSortDirty() {
    this._sortDirty = true
  }

  setSize(w: number, h: number) {
    this.ogl.setSize(w, h)
    this._width = w
    this._height = h
    this._lastFocalLength = -1
    if (this._debugOverlayCanvas) {
      this._debugOverlayCanvas.width = w
      this._debugOverlayCanvas.height = h
    }
  }

  // ─── 프로그램 초기화 ─────────────────────────────────────────────────────

  private _initPrograms() {
    const gl = this.gl

    this.colorProgram = new Program(gl, {
      vertex: colorVertex,
      fragment: colorFragment,
      uniforms: {
        uColor: { value: [1, 1, 1, 1] },
        uOpacity: { value: 1 },
        uRadius: { value: 0 },
        uBorderRadius: { value: [0, 0, 0, 0] },
        uSize: { value: [1, 1] },
        uIsBorder: { value: 0 },
        uInnerSize: { value: [0, 0] },
        uInnerBorderRadius: { value: [0, 0, 0, 0] },
        uModelMatrix: { value: new Float32Array(16) },
        uViewMatrix: { value: new Float32Array(16) },
        uProjectionMatrix: { value: new Float32Array(16) },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
    })

    this.ellipseProgram = new Program(gl, {
      vertex: ellipseVertex,
      fragment: ellipseFragment,
      uniforms: {
        uColor: { value: [1, 1, 1, 1] },
        uOpacity: { value: 1 },
        uSize: { value: [1, 1] },
        uIsBorder: { value: 0 },
        uInnerSize: { value: [0, 0] },
        uModelMatrix: { value: new Float32Array(16) },
        uViewMatrix: { value: new Float32Array(16) },
        uProjectionMatrix: { value: new Float32Array(16) },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
    })

    this.textureProgram = new Program(gl, {
      vertex: textureVertex,
      fragment: textureFragment,
      uniforms: {
        uTexture: { value: null },
        uOpacity: { value: 1 },
        uFlipY: { value: 0 },
        uUVOffset: { value: [0, 0] },
        uUVScale: { value: [1, 1] },
        uModelMatrix: { value: new Float32Array(16) },
        uViewMatrix: { value: new Float32Array(16) },
        uProjectionMatrix: { value: new Float32Array(16) },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
    })

    this.instancedProgram = new Program(gl, {
      vertex: instancedVertex,
      fragment: instancedFragment,
      uniforms: {
        uTexture: { value: null },
        uViewMatrix: { value: new Float32Array(16) },
        uProjectionMatrix: { value: new Float32Array(16) },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
    })

    this._instancedGeo = new Geometry(gl, {
      position: { size: 2, data: new Float32Array([-0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5]) },
      uv: { size: 2, data: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]) },
      index: { data: new Uint16Array([0, 1, 2, 0, 2, 3]) },
      instanceMat0: { instanced: 1, size: 4, data: this._batchMat0 },
      instanceMat1: { instanced: 1, size: 4, data: this._batchMat1 },
      instanceMat2: { instanced: 1, size: 4, data: this._batchMat2 },
      instanceMat3: { instanced: 1, size: 4, data: this._batchMat3 },
      instanceOpacityFlip: { instanced: 1, size: 2, data: this._batchOpacityFlip },
      instanceUVParams: { instanced: 1, size: 4, data: this._batchUVParams },
      instanceBorderRadius: { instanced: 1, size: 4, data: this._batchBorderRadius },
    });
    this._instancedMesh = new Mesh(gl, { geometry: this._instancedGeo, program: this.instancedProgram });

    // placeholder: 분홍 반투명
    this.placeholderProgram = new Program(gl, {
      vertex: colorVertex,
      fragment: colorFragment,
      uniforms: {
        uColor: { value: [1, 0.2, 0.4, 0.5] },
        uOpacity: { value: 1 },
        uRadius: { value: 0 },
        uSize: { value: [1, 1] },
        uBorderRadius: { value: [0, 0, 0, 0] },
        uIsBorder: { value: 0 },
        uInnerSize: { value: [0, 0] },
        uInnerBorderRadius: { value: [0, 0, 0, 0] },
        uModelMatrix: { value: new Float32Array(16) },
        uViewMatrix: { value: new Float32Array(16) },
        uProjectionMatrix: { value: new Float32Array(16) },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
    })

    this.shadowProgram = new Program(gl, {
      vertex: shadowVertex,
      fragment: shadowFragment,
      uniforms: {
        uColor: { value: [0, 0, 0, 0.5] },
        uOpacity: { value: 1 },
        uSize: { value: [1, 1] },
        uBoxSize: { value: [1, 1] },
        uOffset: { value: [0, 0] },
        uBlur: { value: 0 },
        uSpread: { value: 0 },
        uIsEllipse: { value: 0 },
        uBorderRadius: { value: [0, 0, 0, 0] },
        uModelMatrix: { value: new Float32Array(16) },
        uViewMatrix: { value: new Float32Array(16) },
        uProjectionMatrix: { value: new Float32Array(16) },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
    })

    // ─── 알파 외곽선 (border + outline) ─────────────────────────────────
    this.alphaOutlineProgram = new Program(gl, {
      vertex: alphaOutlineVertex,
      fragment: alphaOutlineFragment,
      uniforms: {
        uTexture: { value: null },
        uOpacity: { value: 1 },
        uAlphaThreshold: { value: 0.05 },
        uImageOffset: { value: [0, 0] },
        uImageScale: { value: [1, 1] },
        uTexelStep: { value: [0, 0] },
        uBorderWidth: { value: 0 },
        uBorderColor: { value: [1, 0, 0, 1] },
        uOutlineWidth: { value: 0 },
        uOutlineColor: { value: [0, 0, 1, 1] },
        uUVOffset: { value: [0, 0] },
        uUVScale: { value: [1, 1] },
        uModelMatrix: { value: new Float32Array(16) },
        uViewMatrix: { value: new Float32Array(16) },
        uProjectionMatrix: { value: new Float32Array(16) },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
    })

    // ─── 알파 그림자 (boxShadow) ─────────────────────────────────────────
    this.alphaShadowProgram = new Program(gl, {
      vertex: alphaShadowVertex,
      fragment: alphaShadowFragment,
      uniforms: {
        uTexture: { value: null },
        uColor: { value: [0, 0, 0, 0.5] },
        uOpacity: { value: 1 },
        uQuadSize: { value: [1, 1] },
        uImageSize: { value: [1, 1] },
        uOffset: { value: [0, 0] },
        uBlur: { value: 0 },
        uSpread: { value: 0 },
        uAlphaThreshold: { value: 0.05 },
        uUVOffset: { value: [0, 0] },
        uUVScale: { value: [1, 1] },
        uModelMatrix: { value: new Float32Array(16) },
        uViewMatrix: { value: new Float32Array(16) },
        uProjectionMatrix: { value: new Float32Array(16) },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
    })

    // ─── 공유 메쉬 초기화 ──────────────────────────────────────────────
    this.colorMesh = new Mesh(gl, { geometry: this.quadGeo, program: this.colorProgram })
    this.ellipseMesh = new Mesh(gl, { geometry: this.quadGeo, program: this.ellipseProgram })
    this.textureMesh = new Mesh(gl, { geometry: this.quadGeo, program: this.textureProgram })
    this.placeholderMesh = new Mesh(gl, { geometry: this.quadGeo, program: this.placeholderProgram })
    this.shadowMesh = new Mesh(gl, { geometry: this.quadGeo, program: this.shadowProgram })
    this.alphaOutlineMesh = new Mesh(gl, { geometry: this.quadGeo, program: this.alphaOutlineProgram })
    this.alphaShadowMesh = new Mesh(gl, { geometry: this.quadGeo, program: this.alphaShadowProgram })

    // ─── gradient 셰이더 (Canvas 텍스처 없이 GLSL uniform으로 직접 렌더링) ───
    this.gradientProgram = new Program(gl, {
      vertex: gradientVertex,
      fragment: gradientFragment,
      uniforms: {
        uStopCount: { value: 0 },
        uStopColors0: { value: [0, 0, 0, 1] },
        uStopColors1: { value: [0, 0, 0, 1] },
        uStopColors2: { value: [0, 0, 0, 1] },
        uStopColors3: { value: [0, 0, 0, 1] },
        uStopColors4: { value: [0, 0, 0, 1] },
        uStopColors5: { value: [0, 0, 0, 1] },
        uStopColors6: { value: [0, 0, 0, 1] },
        uStopColors7: { value: [0, 0, 0, 1] },
        uStopOffset0: { value: 0 },
        uStopOffset1: { value: 1 },
        uStopOffset2: { value: 1 },
        uStopOffset3: { value: 1 },
        uStopOffset4: { value: 1 },
        uStopOffset5: { value: 1 },
        uStopOffset6: { value: 1 },
        uStopOffset7: { value: 1 },
        uDirection: { value: 0 },
        uType: { value: 0 },
        uSize: { value: [1, 1] },
        uBorderRadius: { value: [0, 0, 0, 0] },
        uIsEllipse: { value: 0 },
        uOpacity: { value: 1 },
        uModelMatrix: { value: new Float32Array(16) },
        uViewMatrix: { value: new Float32Array(16) },
        uProjectionMatrix: { value: new Float32Array(16) },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
    })
    this.gradientMesh = new Mesh(gl, { geometry: this.quadGeo, program: this.gradientProgram })
  }

  // ─── 디버그 overlay 헬퍼 ──────────────────────────────────────────────────

  private _setupDebugOverlay() {
    if (this._debugOverlayCanvas) return
    const overlay = document.createElement('canvas')
    overlay.width = this._width
    overlay.height = this._height
    overlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;object-fit:contain;'
    const parent = this._canvas.parentElement
    if (parent) {
      if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative'
      parent.appendChild(overlay)
    } else {
      this._canvas.insertAdjacentElement('afterend', overlay)
    }
    this._debugOverlayCanvas = overlay
    this._debugOverlayCtx = overlay.getContext('2d')
  }

  private _teardownDebugOverlay() {
    this._debugOverlayCanvas?.remove()
    this._debugOverlayCanvas = null
    this._debugOverlayCtx = null
  }

  private _renderDebugOverlay(timestamp: number) {
    if (!this._debugMode || !this._debugOverlayCtx || !this._debugOverlayCanvas) return
    const ctx = this._debugOverlayCtx
    const cw = this._debugOverlayCanvas.width
    const ch = this._debugOverlayCanvas.height
    ctx.clearRect(0, 0, cw, ch)

    // FPS 업데이트
    this._fpsFrameCount++
    if (timestamp - this._fpsPrevTime >= 1000) {
      this._fpsValue = this._fpsFrameCount
      this._fpsFrameCount = 0
      this._fpsPrevTime = timestamp
    }
    ctx.save()
    ctx.font = 'bold 14px monospace'
    ctx.fillStyle = '#00ff88'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'top'
    ctx.fillText(`FPS: ${this._fpsValue}`, cw - 10, 10)
    ctx.restore()

    // 클릭 Ripple
    const RIPPLE_DURATION = 600
    this.debugRipples = this.debugRipples.filter(r => {
      const elapsed = timestamp - r.time
      return elapsed >= 0 && elapsed < RIPPLE_DURATION
    })
    for (const r of this.debugRipples) {
      const t = (timestamp - r.time) / RIPPLE_DURATION
      const alpha = (1 - t) * 0.9
      ctx.save()
      ctx.beginPath()
      ctx.arc(r.x, r.y, Math.max(0, t) * 50, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(255, 220, 0, ${alpha})`
      ctx.lineWidth = 2.5 * (1 - t * 0.5)
      ctx.stroke()
      ctx.restore()
    }
  }

  // ─── 공개 렌더 메서드 ────────────────────────────────────────────────────

  render(objects: Set<LeviarObject>, assets: LoadedAssets = {}, timestamp: number = 0, activeCamera: LeviarObject | null = null) {
    if (!activeCamera) {
      // 검은 화면 (알림 목적)
      this.gl.clearColor(0, 0, 0, 1)
      this.gl.clear(this.gl.COLOR_BUFFER_BIT)
      this.gl.enable(this.gl.BLEND)

      this._currentBlendMode = '';
      this._setBlendMode('source-over');

      // 경고 텍스트 렌더링
      if (!this._noCameraText) {
        this._noCameraText = {
          attribute: { id: '__no_camera_warning__', type: 'text', text: '<style fontSize="36" fontWeight="900">No Camera</style>\nAdd Camera and set to world camera' },
          style: { color: '#ff5555', fontSize: 24, textAlign: 'center', lineHeight: 1.5, opacity: 1 },
          transform: {
            position: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1 },
            rotation: { x: 0, y: 0, z: 0 },
            pivot: { x: 0.5, y: 0.5 }
          },
          __worldMatrix: new Mat4().translate(new OglVec3(0, 0, -100)),
          _fadeOpacity: 1,
          _dirtyTexture: true,
          _textureThrottleCount: 0,
          _textureIdleCount: 0
        }
      }
      this._activeObj = this._noCameraText as LeviarObject
      this._activeRenderW = 200
      this._activeRenderH = 50

      const dummyCam = {
        transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 } }
      } as any
      this._buildViewMatrix(dummyCam)

      const fov = 2 * Math.atan(this._height / 2 / 100)
      this.camera.perspective({
        fov: fov * 180 / Math.PI,
        aspect: this._width / this._height,
        near: 0.1,
        far: 100000,
      })
      this._drawText(this._noCameraText as LeviarObject, 0, 0, 1, timestamp)
      this._flushBatch()
      this._renderDebugOverlay(timestamp)
      return
    }

    const focalLength = (activeCamera.attribute as any).focalLength ?? 100;
    if (this._lastFocalLength !== focalLength) {
      const fov = 2 * Math.atan(this._height / 2 / focalLength)
      this.camera.perspective({
        fov: fov * 180 / Math.PI,
        aspect: this._width / this._height,
        near: 0.1,
        far: 100000,
      })
      this._lastFocalLength = focalLength
    }

    const camRotX = activeCamera.transform.rotation.x || 0
    const camRotY = activeCamera.transform.rotation.y || 0
    const camRotZ = activeCamera.transform.rotation.z || 0
    const camZ = activeCamera.transform.position.z
    this._debugCamZ = camZ

    // ─── View Matrix 빌드 (1회/프레임) ─────────────────────────
    this._buildViewMatrix(activeCamera)

    // ─── Z-Sort: Dirty-Flag 기반 캐시 ────────────────────
    // 카메라 이동만으로는 객체 간 dz 차이가 바뀌지 않으므로(cam 위치 항 소거됨)
    // 카메라 회전 or 객체 수 변화 or 외부 markSortDirty() 시에만 재정렬합니다.
    const rotChanged = camRotX !== this._lastCamRotX
      || camRotY !== this._lastCamRotY
      || camRotZ !== this._lastCamRotZ
    const countChanged = objects.size !== this._lastObjCount

    if (this._sortDirty || rotChanged || countChanged) {
      this._lastCamRotX = camRotX
      this._lastCamRotY = camRotY
      this._lastCamRotZ = camRotZ
      this._lastObjCount = objects.size
      this._sortDirty = false

      // 직접 Z 좌표 기준 정렬 및 카메라 자식 별도 판별 처리
      const worldObjects: LeviarObject[] = []
      const uiObjects: LeviarObject[] = []

      for (const o of objects) {
        if (
          o.attribute.type === 'camera' ||
          o.__worldDisplay === 'none'
        ) {
          continue
        }

        let isUI = false
        if (activeCamera) {
          let curr = o.parent
          while (curr) {
            if (curr.attribute.id === activeCamera.attribute.id) {
              isUI = true
              break
            }
            curr = curr.parent
          }
        }

        if (isUI) {
          uiObjects.push(o)
        } else {
          worldObjects.push(o)
        }
      }

      const worldSortLogic = (a: LeviarObject, b: LeviarObject) => {
        // 계층 구조 지원 _worldMatrix의 변환된 Z좌표 기준 정렬 (-1로 원상 복구)
        const mA = a.__worldMatrix as unknown as Float32Array
        const mB = b.__worldMatrix as unknown as Float32Array
        const zdiff = (-mB[14]) - (-mA[14])
        return zdiff !== 0 ? zdiff : a.style.zIndex - b.style.zIndex
      }

      const uiSortLogic = (a: LeviarObject, b: LeviarObject) => {
        // UI 객체들은 거리에 상관없이 zIndex를 가장 우선 순위로 정렬합니다.
        const zIndexDiff = a.style.zIndex - b.style.zIndex
        if (zIndexDiff !== 0) return zIndexDiff
        const mA = a.__worldMatrix as unknown as Float32Array
        const mB = b.__worldMatrix as unknown as Float32Array
        return (-mB[14]) - (-mA[14])
      }

      worldObjects.sort(worldSortLogic)
      uiObjects.sort(uiSortLogic)

      this._sortedObjects = [...worldObjects, ...uiObjects]
    }

    // 화면 클리어
    this.gl.clearColor(0, 0, 0, 0)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT)
    this.gl.enable(this.gl.BLEND)

    // 블렌드상태 초기화
    this._currentBlendMode = '';
    this._setBlendMode('source-over');

    // 캐시된 순서로 렌더링
    // obj.z > camZ 인 것만 (카메라 앞에 있는 것)
    for (let i = 0, len = this._sortedObjects.length; i < len; i++) {
      const obj = this._sortedObjects[i]
      const mArr = obj.__worldMatrix as unknown as Float32Array
      if (-mArr[14] <= camZ) continue
      this._drawObject(obj, assets, timestamp)
    }
    this._flushBatch()
    this._renderDebugOverlay(timestamp)
  }

  // ─── 내부 오브젝트 렌더 ──────────────────────────────────────────────────

  private _drawObject(
    obj: LeviarObject,
    assets: LoadedAssets,
    timestamp: number,
  ) {
    const { style, transform } = obj

    const rawW = obj.__renderedSize?.w ?? style.width ?? 0
    const rawH = obj.__renderedSize?.h ?? style.height ?? 0
    const baseW = clampSize(rawW, style.minWidth, style.maxWidth)
    const baseH = clampSize(rawH, style.minHeight, style.maxHeight)

    // 변환(Scale 등)은 이미 _worldMatrix 내부에 계층적으로 완전 곱해져 있으므로
    // 기본 메시 구성은 스케일 1 수준인 base값만 던져주어 중복 연산을 배제합니다.
    const w = baseW
    const h = baseH

    // 현재 렌더링 상태 저장 (Model Matrix 계산용)
    this._activeObj = obj
    this._activeRenderW = w
    this._activeRenderH = h

    // _worldMatrix 기반 계산이므로, 더 이상 지역 x,y 속성이 개별 필요치 않습니다.
    const px = 0
    const py = 0

    const type = obj.attribute.type

    switch (type) {
      case 'rectangle':
        this._drawRectangle(obj, px, py, w, h)
        break
      case 'ellipse':
        this._drawEllipse(obj, px, py, w, h)
        break
      case 'text':
        this._drawText(obj, px, py, 1, timestamp)
        break
      case 'image':
        this._drawAsset(obj as LeviarImage, px, py, w, h, 1, assets)
        break
      case 'video':
        this._drawVideo(obj as LeviarVideo, px, py, w, h, 1, assets)
        break
      case 'sprite':
        this._drawSprite(obj as Sprite, px, py, w, h, 1, assets, timestamp)
        break
      case 'particle':
        this._drawParticle(obj as Particle, px, py, w, h, 1, assets, timestamp)
        break
      default:
        break
    }

    // ─── 디버그 오버레이 (스타일 영향 없이 별도 렌더) ───────────────
    if (this.debugMode && w > 0 && h > 0) {
      this._activeObj = obj
      this._activeRenderW = w
      this._activeRenderH = h
      this._drawDebugOverlay(obj, w, h, timestamp)
    }
  }

  // ─── 디버그 오버레이 ─────────────────────────────────────────────────────

  /**
   * 디버그 모드에서 각 오브젝트의 실제 렌더 경계와 margin을 시각화합니다.
   * 기존 style을 일절 덮어쓰지 않고, 프레임 맨 마지막에 별도 레이어로 그립니다.
   *
   * - outline: 기본(#00ff88, 초록), hover(#ffee00, 노랑), depth가 깊을수록 파랑 계열로 변화
   * - margin: 반투명 주황색(#ff9800, 30%)
   * - click: 클릭 직후 0.5초 동안 반투명 오렌지 fill로 fade-out
   */
  private _drawDebugOverlay(obj: LeviarObject, w: number, h: number, timestamp: number) {
    this._flushBatch()
    this._setBlendMode('source-over')

    const mArr = obj.__worldMatrix as unknown as Float32Array
    const objDepth = Math.max(-mArr[14] - this._debugCamZ, 0.1)
    const focalLength = Math.max(this._lastFocalLength, 1)
    const ow = objDepth / focalLength  // 1px fixed
    const outerW = w + ow * 2
    const outerH = h + ow * 2

    // 1. Outline 색상: hover=노란, 기본=depth 기반(초록→파랑)
    const isHovered = this.debugHoveredIds.has(obj.attribute.id)
    let outlineColor: [number, number, number, number]
    if (isHovered) {
      outlineColor = [1, 0.93, 0, 1]  // #ffee00
    } else {
      // depth 1~2000 → 초록(0,255,136) ~ 파랑(0,85,255)
      const t = Math.min((objDepth - 1) / 2000, 1)
      outlineColor = [0, (1 - t) * 1 + t * 0.33, (1 - t) * 0.53 + t * 1, 1]
    }

    const prog = this.colorProgram
    prog.uniforms['uColor'].value = outlineColor
    prog.uniforms['uOpacity'].value = 1
    prog.uniforms['uSize'].value = [outerW, outerH]
    prog.uniforms['uBorderRadius'].value = [0, 0, 0, 0]
    prog.uniforms['uIsBorder'].value = 1
    prog.uniforms['uInnerSize'].value = [w, h]
    prog.uniforms['uInnerBorderRadius'].value = [0, 0, 0, 0]
    prog.uniforms['uModelMatrix'].value = this._makeModelMatrix(0, 0, outerW, outerH, 0, w, h)
    prog.uniforms['uProjectionMatrix'].value = this._projMatrix()
    this.colorMesh.draw({ camera: this.camera })

    // 2. Click hit-area: 0.5초 fade-out 오렌지 fill
    const clickedTime = this.debugClickedIds.get(obj.attribute.id)
    if (clickedTime !== undefined) {
      const elapsed = timestamp - clickedTime
      const CLICK_DURATION = 500
      if (elapsed < CLICK_DURATION) {
        const alpha = (1 - elapsed / CLICK_DURATION) * 0.4
        prog.uniforms['uColor'].value = [1, 0.55, 0, alpha]
        prog.uniforms['uOpacity'].value = 1
        prog.uniforms['uSize'].value = [w, h]
        prog.uniforms['uIsBorder'].value = 0
        prog.uniforms['uInnerSize'].value = [0, 0]
        prog.uniforms['uModelMatrix'].value = this._makeModelMatrix(0, 0, w, h)
        prog.uniforms['uProjectionMatrix'].value = this._projMatrix()
        this.colorMesh.draw({ camera: this.camera })
      } else {
        this.debugClickedIds.delete(obj.attribute.id)
      }
    }

    // 3. Margin: style.margin 범위를 반투명 주황색으로 표시
    const margin = parseMargin(obj.style.margin)
    const hasMargin = margin.top > 0 || margin.right > 0 || margin.bottom > 0 || margin.left > 0
    if (!hasMargin) return

    prog.uniforms['uColor'].value = parseCSSColor('rgba(255, 152, 0, 0.3)')
    prog.uniforms['uOpacity'].value = 1
    prog.uniforms['uIsBorder'].value = 0
    prog.uniforms['uBorderRadius'].value = [0, 0, 0, 0]
    prog.uniforms['uInnerSize'].value = [0, 0]
    prog.uniforms['uInnerBorderRadius'].value = [0, 0, 0, 0]

    const drawMarginStrip = (mw: number, mh: number, offsetX: number, offsetY: number) => {
      const pivot = this._activeObj.transform.pivot
      this._modelMat.copy(this._activeObj.__worldMatrix)
      this._tmpVec[0] = (0.5 - pivot.x) * w
      this._tmpVec[1] = -(0.5 - pivot.y) * h
      this._tmpVec[2] = 0
      this._modelMat.translate(this._tmpVec)
      this._tmpVec[0] = offsetX; this._tmpVec[1] = offsetY; this._tmpVec[2] = 0
      this._modelMat.translate(this._tmpVec)
      this._tmpVec[0] = mw; this._tmpVec[1] = mh; this._tmpVec[2] = 1
      this._modelMat.scale(this._tmpVec)
      prog.uniforms['uSize'].value = [mw, mh]
      prog.uniforms['uModelMatrix'].value = this._modelMat as unknown as Float32Array
      prog.uniforms['uProjectionMatrix'].value = this._projMatrix()
      this.colorMesh.draw({ camera: this.camera })
    }

    if (margin.top > 0) drawMarginStrip(w + margin.left + margin.right, margin.top, (-margin.left + margin.right) / 2, (h + margin.top) / 2)
    if (margin.bottom > 0) drawMarginStrip(w + margin.left + margin.right, margin.bottom, (-margin.left + margin.right) / 2, -(h + margin.bottom) / 2)
    if (margin.left > 0) drawMarginStrip(margin.left, h, -(w + margin.left) / 2, 0)
    if (margin.right > 0) drawMarginStrip(margin.right, h, (w + margin.right) / 2, 0)
  }

  // ─── 모델 행렬 헬퍼 ─────────────────────────────────────────────────────

  /**
   * 객체의 고유 TRS(Translation, Rotation, Scale, Pivot)만으로 Model Matrix를 생성합니다.
   * 카메라 정보는 View Matrix에서 처리됩니다.
   */
  private _makeModelMatrix(x: number, y: number, w: number, h: number, zOffset: number = 0, baseW?: number, baseH?: number, rotationRad: number = 0): Float32Array {
    const obj = this._activeObj
    const pivot = obj.transform.pivot

    const pw = baseW ?? w
    const ph = baseH ?? h

    // 1. 객체의 _worldMatrix를 기반으로 시작합니다. (계층 회전, 이동, 크기 완벽 포함)
    this._modelMat.copy(obj.__worldMatrix)

    // 2. 파티클 등 로컬단에서 발생하는 개별 위치 및 렌더 뎁스 추가
    if (x !== 0 || y !== 0 || zOffset !== 0) {
      this._tmpVec[0] = x; this._tmpVec[1] = y; this._tmpVec[2] = -zOffset;
      this._modelMat.translate(this._tmpVec)
    }

    // 3. 자식의 렌더 피벗 오프셋 처리. 모델 매트릭스에 이미 적용된 스케일보다 앞서서 로컬 좌표계 크기에 맞춘 위치 조작.
    this._tmpVec[0] = (0.5 - pivot.x) * pw
    this._tmpVec[1] = -(0.5 - pivot.y) * ph
    this._tmpVec[2] = 0
    this._modelMat.translate(this._tmpVec)

    // 4. 파티클 인스턴스 개별 Z축 회전 (스케일 적용 전에 수행하여 피벗 기준 올바른 회전 보장)
    if (rotationRad !== 0) {
      this._modelMat.rotate(rotationRad, AXIS_Z)
    }

    // 5. 메시 사이즈 확보를 위한 기본 쿼드 스케일링
    this._tmpVec[0] = w; this._tmpVec[1] = h; this._tmpVec[2] = 1
    this._modelMat.scale(this._tmpVec)

    return this._modelMat as unknown as Float32Array
  }

  /**
   * View Matrix를 직접 계산하여 모든 Program에 업로드합니다.
   * OGL camera.viewMatrix에 의존하지 않고 _viewMat에 직접 구성합니다.
   *
   * 좌표계: obj.z > cam.z = 카메라 앞 (구 시스템과 동일)
   * 모델 z = -obj.z 이므로, 카메라 역변환 z = +camZ
   */
  private _buildViewMatrix(cam: LeviarObject) {
    const pos = cam.transform.position
    const rot = cam.transform.rotation

    this._viewMat.identity()

    // 1. 카메라 회전 역변환
    if (rot.y) this._viewMat.rotate(-rot.y * Math.PI / 180, AXIS_Y)
    if (rot.x) this._viewMat.rotate(-rot.x * Math.PI / 180, AXIS_X)
    if (rot.z) this._viewMat.rotate(-rot.z * Math.PI / 180, AXIS_Z)

    // 2. 카메라 위치 역변환
    // 카메라 world z = -camZ (네게이트된 공간), 역변환 z = +camZ
    this._tmpVec[0] = -pos.x
    this._tmpVec[1] = -pos.y
    this._tmpVec[2] = pos.z
    this._viewMat.translate(this._tmpVec)

    const vm = this._viewMat as unknown as Float32Array
    this.colorProgram.uniforms['uViewMatrix'].value = vm
    this.ellipseProgram.uniforms['uViewMatrix'].value = vm
    this.textureProgram.uniforms['uViewMatrix'].value = vm
    this.instancedProgram.uniforms['uViewMatrix'].value = vm
    this.placeholderProgram.uniforms['uViewMatrix'].value = vm
    this.shadowProgram.uniforms['uViewMatrix'].value = vm
    this.alphaOutlineProgram.uniforms['uViewMatrix'].value = vm
    this.alphaShadowProgram.uniforms['uViewMatrix'].value = vm
  }

  /** ogl 카메라의 projectionMatrix를 Float32Array로 반환 */
  private _projMatrix(): Float32Array {
    return this.camera.projectionMatrix as unknown as Float32Array
  }

  private _setBlendMode(mode: string = 'source-over') {
    if (this._currentBlendMode === mode) return;
    this._currentBlendMode = mode;

    const gl = this.gl;
    let eq: number = gl.FUNC_ADD;
    let src: number = gl.ONE;
    let dst: number = gl.ONE_MINUS_SRC_ALPHA;
    let srcA: number = gl.ONE;
    let dstA: number = gl.ONE_MINUS_SRC_ALPHA;

    switch (mode) {
      case 'source-over':
        src = gl.ONE; dst = gl.ONE_MINUS_SRC_ALPHA;
        srcA = gl.ONE; dstA = gl.ONE_MINUS_SRC_ALPHA;
        break;
      case 'source-in':
        src = gl.DST_ALPHA; dst = gl.ZERO;
        srcA = gl.DST_ALPHA; dstA = gl.ZERO;
        break;
      case 'source-out':
        src = gl.ONE_MINUS_DST_ALPHA; dst = gl.ZERO;
        srcA = gl.ONE_MINUS_DST_ALPHA; dstA = gl.ZERO;
        break;
      case 'source-atop':
        src = gl.DST_ALPHA; dst = gl.ONE_MINUS_SRC_ALPHA;
        srcA = gl.DST_ALPHA; dstA = gl.ONE_MINUS_SRC_ALPHA;
        break;
      case 'destination-over':
        src = gl.ONE_MINUS_DST_ALPHA; dst = gl.ONE;
        srcA = gl.ONE_MINUS_DST_ALPHA; dstA = gl.ONE;
        break;
      case 'destination-in':
        src = gl.ZERO; dst = gl.SRC_ALPHA;
        srcA = gl.ZERO; dstA = gl.SRC_ALPHA;
        break;
      case 'destination-out':
        src = gl.ZERO; dst = gl.ONE_MINUS_SRC_ALPHA;
        srcA = gl.ZERO; dstA = gl.ONE_MINUS_SRC_ALPHA;
        break;
      case 'lighter':
        src = gl.ONE; dst = gl.ONE;
        srcA = gl.ONE; dstA = gl.ONE;
        break;
      case 'copy':
        src = gl.ONE; dst = gl.ZERO;
        srcA = gl.ONE; dstA = gl.ZERO;
        break;
      case 'xor':
        src = gl.ONE_MINUS_DST_ALPHA; dst = gl.ONE_MINUS_SRC_ALPHA;
        srcA = gl.ONE_MINUS_DST_ALPHA; dstA = gl.ONE_MINUS_SRC_ALPHA;
        break;
      case 'multiply':
        src = gl.DST_COLOR; dst = gl.ONE_MINUS_SRC_ALPHA;
        srcA = gl.DST_COLOR; dstA = gl.ONE_MINUS_SRC_ALPHA;
        break;
      case 'screen':
        src = gl.ONE; dst = gl.ONE_MINUS_SRC_COLOR;
        srcA = gl.ONE; dstA = gl.ONE_MINUS_SRC_COLOR;
        break;
      case 'lighten': {
        const ext = gl.getExtension('EXT_blend_minmax');
        eq = (gl as any).MAX ?? (ext ? (ext as any).MAX_EXT : gl.FUNC_ADD) ?? gl.FUNC_ADD;
        src = gl.ONE; dst = gl.ONE;
        srcA = gl.ONE; dstA = gl.ONE;
        break;
      }
      case 'darken': {
        const ext = gl.getExtension('EXT_blend_minmax');
        eq = (gl as any).MIN ?? (ext ? (ext as any).MIN_EXT : gl.FUNC_ADD) ?? gl.FUNC_ADD;
        src = gl.ONE; dst = gl.ONE;
        srcA = gl.ONE; dstA = gl.ONE;
        break;
      }
      case 'difference':
      case 'exclusion':
        src = gl.ONE_MINUS_DST_COLOR; dst = gl.ONE_MINUS_SRC_COLOR;
        srcA = gl.ONE_MINUS_DST_COLOR; dstA = gl.ONE_MINUS_SRC_COLOR;
        break;
      default:
        break;
    }

    gl.blendEquation(eq);
    gl.blendFuncSeparate(src, dst, srcA, dstA);
  }

  // ─── Program uniform 드로우 헬퍼 ─────────────────────────────────────────

  private _flushBatch() {
    if (this._batchCount === 0 || !this._batchTexture) return;

    this.instancedProgram.uniforms['uTexture'].value = this._batchTexture;
    this.instancedProgram.uniforms['uProjectionMatrix'].value = this._projMatrix();

    this._setBlendMode(this._batchBlendMode);

    const gl = this.gl
    const geo = this._instancedGeo;
    geo.instancedCount = this._batchCount;

    // OGL의 needsUpdate는 attr.data 전체(최대 1000개분)를 bufferSubData로 업로드합니다.
    // bufferSubData의 srcOffset, length 인자로 실제 batchCount 범위만 GPU에 전송합니다.
    const n = this._batchCount
    const uploadSubData = (attr: any, data: Float32Array, stride: number) => {
      // attr.buffer는 OGL의 addAttribute 시점에 이미 생성·등록되어 있음
      gl.bindBuffer(gl.ARRAY_BUFFER, attr.buffer)
        // OGL의 state 캐시와 동기화 (직접 bindBuffer 호출을 OGL이 인지하도록)
        ; (gl as any).renderer.state.boundBuffer = attr.buffer
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, data, 0, n * stride)
    }

    uploadSubData(geo.attributes.instanceMat0, this._batchMat0, 4)
    uploadSubData(geo.attributes.instanceMat1, this._batchMat1, 4)
    uploadSubData(geo.attributes.instanceMat2, this._batchMat2, 4)
    uploadSubData(geo.attributes.instanceMat3, this._batchMat3, 4)
    uploadSubData(geo.attributes.instanceOpacityFlip, this._batchOpacityFlip, 2)
    uploadSubData(geo.attributes.instanceUVParams, this._batchUVParams, 4)
    uploadSubData(geo.attributes.instanceBorderRadius, this._batchBorderRadius, 4)

    this._instancedMesh.draw({ camera: this.camera });

    this._batchCount = 0;
    this._batchTexture = null;
  }

  private _drawColorMesh(
    program: Program,
    x: number, y: number, w: number, h: number,
    color: string, opacity: number,
    baseW?: number, baseH?: number,
    borderRadius: [number, number, number, number] | null = null,
    isBorder: boolean = false,
    innerW?: number, innerH?: number,
    innerBorderRadius: [number, number, number, number] | null = null
  ) {
    this._flushBatch();
    this._setBlendMode(this._activeObj?.style?.blendMode ?? 'source-over');
    const [r, g, b, a] = parseCSSColor(color)
    program.uniforms['uColor'].value = [r, g, b, a]
    program.uniforms['uOpacity'].value = opacity
    if (program.uniforms['uSize']) program.uniforms['uSize'].value = [w, h]
    if (program.uniforms['uBorderRadius'] && borderRadius) {
      program.uniforms['uBorderRadius'].value = [borderRadius[1], borderRadius[2], borderRadius[0], borderRadius[3]]
    }
    if (program.uniforms['uIsBorder']) program.uniforms['uIsBorder'].value = isBorder ? 1 : 0;
    if (program.uniforms['uInnerSize']) program.uniforms['uInnerSize'].value = [innerW ?? 0, innerH ?? 0];
    if (program.uniforms['uInnerBorderRadius'] && innerBorderRadius) {
      program.uniforms['uInnerBorderRadius'].value = [innerBorderRadius[1], innerBorderRadius[2], innerBorderRadius[0], innerBorderRadius[3]]
    } else if (program.uniforms['uInnerBorderRadius']) {
      program.uniforms['uInnerBorderRadius'].value = [0, 0, 0, 0]
    }
    program.uniforms['uModelMatrix'].value = this._makeModelMatrix(x, y, w, h, 0, baseW, baseH)
    program.uniforms['uProjectionMatrix'].value = this._projMatrix()

    this.colorMesh.draw({ camera: this.camera })
  }

  private _drawTextureMesh(
    texture: Texture,
    x: number, y: number, w: number, h: number,
    opacity: number,
    flipY = false,
    uvOffset: [number, number] = [0, 0],
    uvScale: [number, number] = [1, 1],
    zOffset: number = 0,
    borderRadius: [number, number, number, number] | null = null,
    rotationRad: number = 0
  ) {
    const blendMode = this._activeObj?.style?.blendMode ?? 'source-over';

    if (this._batchTexture !== texture || this._batchBlendMode !== blendMode || this._batchCount >= this._batchMaxSize) {
      this._flushBatch();
    }

    this._batchTexture = texture;
    this._batchBlendMode = blendMode;

    const m = this._makeModelMatrix(x, y, w, h, zOffset, undefined, undefined, rotationRad);
    const idx = this._batchCount;
    const idx4 = idx * 4;
    const idx2 = idx * 2;

    this._batchMat0[idx4] = m[0]; this._batchMat0[idx4 + 1] = m[1]; this._batchMat0[idx4 + 2] = m[2]; this._batchMat0[idx4 + 3] = m[3];
    this._batchMat1[idx4] = m[4]; this._batchMat1[idx4 + 1] = m[5]; this._batchMat1[idx4 + 2] = m[6]; this._batchMat1[idx4 + 3] = m[7];
    this._batchMat2[idx4] = m[8]; this._batchMat2[idx4 + 1] = m[9]; this._batchMat2[idx4 + 2] = m[10]; this._batchMat2[idx4 + 3] = m[11];
    this._batchMat3[idx4] = m[12]; this._batchMat3[idx4 + 1] = m[13]; this._batchMat3[idx4 + 2] = m[14]; this._batchMat3[idx4 + 3] = m[15];

    this._batchOpacityFlip[idx2] = opacity;
    this._batchOpacityFlip[idx2 + 1] = flipY ? 1 : 0;

    this._batchUVParams[idx4] = uvOffset[0];
    this._batchUVParams[idx4 + 1] = uvOffset[1];
    this._batchUVParams[idx4 + 2] = uvScale[0];
    this._batchUVParams[idx4 + 3] = uvScale[1];

    if (borderRadius) {
      this._batchBorderRadius[idx4] = borderRadius[1];     // TR
      this._batchBorderRadius[idx4 + 1] = borderRadius[2]; // BR
      this._batchBorderRadius[idx4 + 2] = borderRadius[0]; // TL
      this._batchBorderRadius[idx4 + 3] = borderRadius[3]; // BL
    } else {
      this._batchBorderRadius[idx4] = 0;
      this._batchBorderRadius[idx4 + 1] = 0;
      this._batchBorderRadius[idx4 + 2] = 0;
      this._batchBorderRadius[idx4 + 3] = 0;
    }

    this._batchCount++;
  }

  // ─── Box Shadow ─────────────────────────────────────────────────────────

  private _drawShadow(
    obj: LeviarObject,
    x: number, y: number, w: number, h: number,
    baseW?: number, baseH?: number,
    isEllipse: boolean = false,
    borderRadius: [number, number, number, number] | null = null
  ) {
    const { style } = obj
    if (!style.boxShadowColor) return

    const blur = style.boxShadowBlur ?? 0
    const spread = style.boxShadowSpread ?? 0
    const offsetX = style.boxShadowOffsetX ?? 0
    const offsetY = style.boxShadowOffsetY ?? 0

    // Quad size should generously contain the blur, spread and offset (double offset to keep quad centered on original object)
    const quadW = w + (blur * 2 + Math.abs(spread)) * 1.5 + Math.abs(offsetX) * 2
    const quadH = h + (blur * 2 + Math.abs(spread)) * 1.5 + Math.abs(offsetY) * 2

    this._flushBatch()
    this._setBlendMode(this._activeObj?.style?.blendMode ?? 'source-over')

    const [r, g, b, a] = parseCSSColor(style.boxShadowColor)
    this.shadowProgram.uniforms['uColor'].value = [r, g, b, a]
    this.shadowProgram.uniforms['uOpacity'].value = obj.__worldOpacity
    this.shadowProgram.uniforms['uSize'].value = [quadW, quadH]
    this.shadowProgram.uniforms['uBoxSize'].value = [w, h]
    this.shadowProgram.uniforms['uOffset'].value = [offsetX, offsetY]
    if (this.shadowProgram.uniforms['uBorderRadius'] && borderRadius && !isEllipse) {
      this.shadowProgram.uniforms['uBorderRadius'].value = [borderRadius[1], borderRadius[2], borderRadius[0], borderRadius[3]]
    } else if (this.shadowProgram.uniforms['uBorderRadius']) {
      this.shadowProgram.uniforms['uBorderRadius'].value = [0, 0, 0, 0]
    }
    this.shadowProgram.uniforms['uBlur'].value = blur
    this.shadowProgram.uniforms['uSpread'].value = spread
    this.shadowProgram.uniforms['uIsEllipse'].value = isEllipse ? 1 : 0

    this.shadowProgram.uniforms['uModelMatrix'].value = this._makeModelMatrix(x, y, quadW, quadH, 0, baseW ?? w, baseH ?? h)
    this.shadowProgram.uniforms['uProjectionMatrix'].value = this._projMatrix()

    this.shadowMesh.draw({ camera: this.camera })
  }

  // ─── Alpha Shadow (image/sprite 전용) ──────────────────────────────────

  /**
   * 이미지 알파채널 경계를 기준으로 그림자를 렌더링합니다.
   * 이미지 불투명 영역 위에서는 그림자가 hidden 처리됩니다.
   */
  private _drawAlphaShadow(
    obj: LeviarObject,
    x: number, y: number,
    drawW: number, drawH: number,
    texture: Texture,
    uvOffset: [number, number] = [0, 0],
    uvScale: [number, number] = [1, 1]
  ) {
    const { style } = obj
    if (!style.boxShadowColor) return

    const blur = style.boxShadowBlur ?? 0
    const spread = style.boxShadowSpread ?? 0
    const offsetX = style.boxShadowOffsetX ?? 0
    const offsetY = style.boxShadowOffsetY ?? 0

    const quadW = drawW + (blur * 2 + Math.abs(spread)) * 1.5 + Math.abs(offsetX) * 2
    const quadH = drawH + (blur * 2 + Math.abs(spread)) * 1.5 + Math.abs(offsetY) * 2

    this._flushBatch()
    this._setBlendMode(obj.style.blendMode ?? 'source-over')

    const [r, g, b, a] = parseCSSColor(style.boxShadowColor)
    const prog = this.alphaShadowProgram
    prog.uniforms['uTexture'].value = texture
    prog.uniforms['uColor'].value = [r, g, b, a]
    prog.uniforms['uOpacity'].value = obj.__worldOpacity
    prog.uniforms['uQuadSize'].value = [quadW, quadH]
    prog.uniforms['uImageSize'].value = [drawW, drawH]
    prog.uniforms['uOffset'].value = [offsetX, offsetY]
    prog.uniforms['uBlur'].value = blur
    prog.uniforms['uSpread'].value = spread
    prog.uniforms['uAlphaThreshold'].value = 0.05
    prog.uniforms['uUVOffset'].value = uvOffset
    prog.uniforms['uUVScale'].value = uvScale
    prog.uniforms['uModelMatrix'].value = this._makeModelMatrix(x, y, quadW, quadH, 0, drawW, drawH)
    prog.uniforms['uProjectionMatrix'].value = this._projMatrix()

    this.alphaShadowMesh.draw({ camera: this.camera })
  }

  // ─── Alpha Outline (image/sprite 전용) ─────────────────────────────────

  /**
   * 이미지 알파채널 경계를 기준으로 border + outline을 렌더링합니다.
   * 이미지 불투명 픽셀은 discard하여 texture 패스와 중복되지 않습니다.
   */
  private _drawAlphaImageBorders(
    obj: LeviarObject,
    x: number, y: number,
    drawW: number, drawH: number,
    texture: Texture,
    opacity: number,
    uvOffset: [number, number] = [0, 0],
    uvScale: [number, number] = [1, 1]
  ) {
    const { style } = obj
    const borderWidth = (style.borderColor && (style.borderWidth ?? 0) > 0) ? style.borderWidth! : 0
    const outlineWidth = (style.outlineColor && (style.outlineWidth ?? 0) > 0) ? style.outlineWidth! : 0
    if (borderWidth <= 0 && outlineWidth <= 0) return

    const pad = borderWidth + outlineWidth
    const expandedW = drawW + pad * 2
    const expandedH = drawH + pad * 2

    this._flushBatch()
    this._setBlendMode(obj.style.blendMode ?? 'source-over')

    const prog = this.alphaOutlineProgram
    prog.uniforms['uTexture'].value = texture
    prog.uniforms['uOpacity'].value = opacity
    prog.uniforms['uAlphaThreshold'].value = 0.05
    prog.uniforms['uImageOffset'].value = [pad / expandedW, pad / expandedH]
    prog.uniforms['uImageScale'].value = [drawW / expandedW, drawH / expandedH]
    prog.uniforms['uTexelStep'].value = [1.0 / drawW, 1.0 / drawH]
    prog.uniforms['uBorderWidth'].value = borderWidth
    prog.uniforms['uBorderColor'].value = parseCSSColor(style.borderColor ?? 'rgba(0,0,0,0)')
    prog.uniforms['uOutlineWidth'].value = outlineWidth
    prog.uniforms['uOutlineColor'].value = parseCSSColor(style.outlineColor ?? 'rgba(0,0,0,0)')
    prog.uniforms['uUVOffset'].value = uvOffset
    prog.uniforms['uUVScale'].value = uvScale
    prog.uniforms['uModelMatrix'].value = this._makeModelMatrix(x, y, expandedW, expandedH, 0, drawW, drawH)
    prog.uniforms['uProjectionMatrix'].value = this._projMatrix()

    this.alphaOutlineMesh.draw({ camera: this.camera })
  }

  private _drawRectBorders(obj: LeviarObject, x: number, y: number, w: number, h: number, targetOpacity: number) {
    const { style } = obj
    // outline 먼저 (border 바깥)
    if (style.outlineColor && (style.outlineWidth ?? 0) > 0) {
      const bw = (style.borderWidth ?? 0)
      const ow = style.outlineWidth!
      const outerW = w + bw * 2 + ow * 2
      const outerH = h + bw * 2 + ow * 2
      const innerW = w + bw * 2
      const innerH = h + bw * 2
      const rOut = parseBorderRadius(style.borderRadius, w, h, bw + ow)
      const rIn = parseBorderRadius(style.borderRadius, w, h, bw)
      this._drawColorMesh(this.colorProgram, x, y, outerW, outerH, style.outlineColor, targetOpacity, w, h, rOut, true, innerW, innerH, rIn)
    }

    // 테두리 (border)
    if (style.borderColor && (style.borderWidth ?? 0) > 0) {
      const bw = style.borderWidth!
      const outerW = w + bw * 2
      const outerH = h + bw * 2
      const rBorder = parseBorderRadius(style.borderRadius, w, h, bw)
      const rInner = parseBorderRadius(style.borderRadius, w, h, 0)
      this._drawColorMesh(this.colorProgram, x, y, outerW, outerH, style.borderColor, targetOpacity, w, h, rBorder, true, w, h, rInner)
    }
  }

  // ─── Rectangle ──────────────────────────────────────────────────────────

  private _drawRectangle(obj: LeviarObject, x: number, y: number, w: number, h: number) {
    const { style } = obj
    if (!style.color && !style.gradient && !style.borderColor && !style.outlineColor) return

    const targetOpacity = obj.__worldOpacity
    const baseRadius = parseBorderRadius(style.borderRadius, w, h, 0)

    this._drawShadow(obj, x, y, w, h, undefined, undefined, false, baseRadius)

    this._drawRectBorders(obj, x, y, w, h, targetOpacity)

    // 본체 color
    if (style.color) {
      this._drawColorMesh(this.colorProgram, x, y, w, h, style.color, targetOpacity, w, h, baseRadius)
    }

    // 그라디언트 레이어 (WebGL 셰이더, 텍스처 생성 없음)
    if (style.gradient && w > 0 && h > 0) {
      this._drawGradient(style.gradient, style.gradientType ?? 'linear', x, y, w, h, targetOpacity, false, baseRadius)
    }
  }

  // ─── Ellipse ────────────────────────────────────────────────────────────

  private _drawEllipse(obj: LeviarObject, x: number, y: number, w: number, h: number) {
    this._flushBatch();
    this._setBlendMode(this._activeObj?.style?.blendMode ?? 'source-over');
    const { style } = obj
    if (!style.color && !style.gradient && !style.borderColor && !style.outlineColor) return

    this._drawShadow(obj, x, y, w, h, undefined, undefined, true)

    const drawEllipse = (ew: number, eh: number, color: string, isBorder: boolean = false, innerEW: number = 0, innerEH: number = 0) => {
      const [r, g, b, a] = parseCSSColor(color)
      this.ellipseProgram.uniforms['uColor'].value = [r, g, b, a]
      this.ellipseProgram.uniforms['uOpacity'].value = obj.__worldOpacity
      if (this.ellipseProgram.uniforms['uSize']) this.ellipseProgram.uniforms['uSize'].value = [ew, eh];
      if (this.ellipseProgram.uniforms['uIsBorder']) this.ellipseProgram.uniforms['uIsBorder'].value = isBorder ? 1 : 0;
      if (this.ellipseProgram.uniforms['uInnerSize']) this.ellipseProgram.uniforms['uInnerSize'].value = [innerEW, innerEH];
      this.ellipseProgram.uniforms['uModelMatrix'].value = this._makeModelMatrix(x, y, ew, eh, 0, w, h)
      this.ellipseProgram.uniforms['uProjectionMatrix'].value = this._projMatrix()
      this.ellipseMesh.draw({ camera: this.camera })
    }

    // outline 먼저 (border 바깥)
    if (style.outlineColor && (style.outlineWidth ?? 0) > 0) {
      const bw = (style.borderWidth ?? 0)
      const ow = style.outlineWidth!
      const outerW = w + bw * 2 + ow * 2
      const outerH = h + bw * 2 + ow * 2
      const innerW = w + bw * 2
      const innerH = h + bw * 2
      drawEllipse(outerW, outerH, style.outlineColor, true, innerW, innerH)
    }

    // 테두리 (border)
    if (style.borderColor && (style.borderWidth ?? 0) > 0) {
      const bw = style.borderWidth!
      const outerW = w + bw * 2
      const outerH = h + bw * 2
      drawEllipse(outerW, outerH, style.borderColor, true, w, h)
    }

    // 본체 color
    if (style.color) {
      drawEllipse(w, h, style.color, false)
    }

    // 그라디언트 레이어 — WebGL 셰이더, ellipse SDF 클리핑
    if (style.gradient && w > 0 && h > 0) {
      this._drawGradient(style.gradient, style.gradientType ?? 'linear', x, y, w, h, obj.__worldOpacity, true, null)
    }
  }

  // ─── Text (Offscreen Canvas → Texture) ──────────────────────────────────

  private _drawText(obj: LeviarObject, x: number, y: number, perspectiveScale: number, _timestamp: number) {
    const { style, attribute } = obj
    const id = obj.attribute.id
    const rawText = attribute.text ?? ''

    // 2x supersampling: z 애니메이션 중 canvas 재생성 없이 화질 확보
    const baseFontSize = (style.fontSize ?? 16)
    // width → 고정 폭(wrap + canvas), maxWidth → wrap 경계(canvas는 자연 폭 이하)
    const maxW = style.width != null
      ? style.width * TEXT_RENDER_SCALE
      : style.maxWidth != null
        ? style.maxWidth * TEXT_RENDER_SCALE
        : null
    // height → 고정 높이(클리핑), maxHeight → 상한 클리핑
    const maxH = style.height != null
      ? style.height * TEXT_RENDER_SCALE
      : style.maxHeight != null
        ? style.maxHeight * TEXT_RENDER_SCALE
        : null

    // content 기반 캐시 키 — 렌더링 결과가 동일한 조건들을 조합
    const contentKey = `${rawText}|${baseFontSize}|${style.fontFamily ?? ''}|${style.fontWeight ?? ''}|${style.fontStyle ?? ''}|${style.color ?? ''}|${style.borderColor ?? ''}|${style.borderWidth ?? 0}|${style.textAlign ?? ''}|${style.lineHeight ?? 1}|${style.letterSpacing ?? 0}|${maxW ?? ''}|${maxH ?? ''}|${style.minWidth ?? ''}|${style.minHeight ?? ''}|${style.textShadowColor ?? ''}|${style.textShadowBlur ?? 0}|${style.textShadowOffsetX ?? 0}|${style.textShadowOffsetY ?? 0}`

    let entry = this.textCache.get(id)

    // 스로틄: 마지막 렌더 이후 프레임 카운터 증가
    obj.__textureThrottleCount++
    // 디바운스: dirty 상태일 때만 idle 카운터 증가
    if (obj.__dirtyTexture) obj.__textureIdleCount++

    const needRender = !entry
      || (obj.__dirtyTexture && (
        obj.__textureIdleCount >= TEXTURE_DEBOUNCE_FRAMES    // 디바운스: K프레임 동안 변경 없음 → 마무리
        || obj.__textureThrottleCount >= TEXTURE_THROTTLE_FRAMES // 스로틀링: N프레임 초과 → 강제 업데이트
      ))

    if (!entry) {
      // content 캐시 히트: 동일 내용의 기존 entry 공유
      const shared = this.textContentCache.get(contentKey)
      if (shared) {
        entry = shared
        this.textCache.set(id, entry)
        const refCount = this.textContentRefCount.get(contentKey) || 0
        this.textContentRefCount.set(contentKey, refCount + 1)
        obj.__dirtyTexture = false
        obj.__textureIdleCount = 0
        obj.__textureThrottleCount = 0
      } else {
        // 새 Canvas/Texture 생성
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        const texture = new Texture(this.gl, { image: canvas, generateMipmaps: false, premultiplyAlpha: true })
        const mesh = new Mesh(this.gl, { geometry: this.quadGeo, program: this.textureProgram })
        entry = { texture, canvas, ctx, lastText: '', mesh }
          ; (entry as any)._contentKey = contentKey
        this.textCache.set(id, entry)
        this.textContentCache.set(contentKey, entry)
        this.textContentRefCount.set(contentKey, 1)
      }
    }

    if (needRender) {
      // 스타일이 변경된 경우 기존 contentKey로의 공유를 무효화하고 새 entry 생성
      const prevContentKey = (entry as any)._contentKey as string | undefined
      if (prevContentKey && prevContentKey !== contentKey) {
        // 이전 캐시 참조 해제
        const prevCount = this.textContentRefCount.get(prevContentKey) || 0
        if (prevCount <= 1) {
          this.textContentRefCount.delete(prevContentKey)
          this.textContentCache.delete(prevContentKey)
          if (entry.texture && (entry.texture as any).delete) {
            ; (entry.texture as any).delete()
          }
        } else {
          this.textContentRefCount.set(prevContentKey, prevCount - 1)
        }

        // 이 entry를 다른 객체도 공유 중일 수 있으므로(ref count > 1) 항상 새 entry를 만들어 교체
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        const texture = new Texture(this.gl, { image: canvas, generateMipmaps: false, premultiplyAlpha: true })
        const mesh = new Mesh(this.gl, { geometry: this.quadGeo, program: this.textureProgram })
        entry = { texture, canvas, ctx, lastText: '', mesh }
        this.textCache.set(id, entry)
      }

      ; (entry as any)._contentKey = contentKey
      this._renderTextToCanvas(entry, rawText, style, baseFontSize, maxW, maxH, (obj as any).__transitionProgress ?? 1)

      // content 캐시 신규 등록 또는 업데이트
      this.textContentCache.set(contentKey, entry)
      if (prevContentKey !== contentKey) {
        // 새로 생성되었거나 키가 바뀐 경우 ref count 증가
        const refCount = this.textContentRefCount.get(contentKey) || 0
        this.textContentRefCount.set(contentKey, refCount + 1)
      }
      obj.__dirtyTexture = false
      obj.__textureIdleCount = 0
      obj.__textureThrottleCount = 0  // 렌더 후 양쪽 리셋
    }

    const cw = entry.canvas.width
    const ch = entry.canvas.height
    if (cw === 0 || ch === 0) return

    // 실제 월드 크기 기록 (TEXT_RENDER_SCALE 역산)
    // scale은 _worldMatrix에 이미 포함되어 있으므로 여기서 곱하지 않음
    obj.__renderedSize = {
      w: cw / TEXT_RENDER_SCALE,
      h: ch / TEXT_RENDER_SCALE,
    }

    // canvas는 TEXT_RENDER_SCALE 기준, 표시는 perspectiveScale 기준으로 보정
    const displayScale = perspectiveScale / TEXT_RENDER_SCALE
    this._drawShadow(obj, x, y, cw * displayScale, ch * displayScale)
    this._drawTextureMesh(entry.texture, x, y, cw * displayScale, ch * displayScale, obj.__worldOpacity, false)
  }

  private _renderTextToCanvas(
    entry: TextTextureEntry,
    rawText: string,
    style: LeviarObject['style'],
    baseFontSize: number,
    maxW: number | null,
    maxH: number | null,
    transitionProgress: number = 1,
  ) {
    const { canvas, ctx } = entry
    const fontFamily = style.fontFamily ?? 'sans-serif'
    const baseFontWeight = style.fontWeight ?? 'normal'
    const baseFontStyle = style.fontStyle ?? 'normal'
    const baseColor = style.color ?? '#000000'
    const lineHeightMul = style.lineHeight ?? 1
    const textAlign = style.textAlign ?? 'left'

    const spans = parseTextMarkup(rawText, {
      fontSize: baseFontSize,
      fontWeight: baseFontWeight,
      fontStyle: baseFontStyle,
      color: baseColor,
      borderColor: style.borderColor,
      borderWidth: style.borderWidth,
      letterSpacing: style.letterSpacing,
      lineHeight: style.lineHeight,
      textShadowColor: style.textShadowColor,
      textShadowBlur: style.textShadowBlur,
      textShadowOffsetX: style.textShadowOffsetX,
      textShadowOffsetY: style.textShadowOffsetY,
    })

    // shadow 기본 설정
    const shadowColor = style.textShadowColor
    const shadowBlur = (style.textShadowBlur ?? 0) * TEXT_RENDER_SCALE
    const shadowOffsetX = (style.textShadowOffsetX ?? 0) * TEXT_RENDER_SCALE
    const shadowOffsetY = (style.textShadowOffsetY ?? 0) * TEXT_RENDER_SCALE

    // ── 논리 줄 → word-wrap 렌더 줄 계산 ─────────────────────────────
    interface RenderToken { text: string; span: ReturnType<typeof parseTextMarkup>[number] }
    interface RenderLine { tokens: RenderToken[]; lineH: number }

    const spaceRe = /(\S+|\s+)/g
    const renderLines: RenderLine[] = []
    const logicalLines: RenderToken[][] = [[]]

    for (const span of spans) {
      const parts = span.text.split('\n')
      parts.forEach((p, i) => {
        if (i > 0) logicalLines.push([])
        if (p) logicalLines[logicalLines.length - 1].push({ text: p, span })
      })
    }

    // sizes-only canvas for measuring
    canvas.width = 2
    canvas.height = 2

    for (const logLine of logicalLines) {
      let curLine: RenderToken[] = []
      let curW = 0
      let curH = baseFontSize * TEXT_RENDER_SCALE * lineHeightMul

      const flushLine = () => {
        if (curLine.length > 0 || renderLines.length === 0) {
          renderLines.push({ tokens: curLine, lineH: curH })
        }
        curLine = []
        curW = 0
        curH = baseFontSize * TEXT_RENDER_SCALE * lineHeightMul
      }

      if (logLine.length === 0) {
        renderLines.push({ tokens: [], lineH: baseFontSize * TEXT_RENDER_SCALE * lineHeightMul })
        continue
      }

      for (const token of logLine) {
        const fs = (token.span.style.fontSize ?? baseFontSize) * TEXT_RENDER_SCALE
        const fw = token.span.style.fontWeight ?? baseFontWeight
        const fi = token.span.style.fontStyle ?? baseFontStyle
        const ls = (token.span.style.letterSpacing ?? style.letterSpacing ?? 0) * TEXT_RENDER_SCALE
        const lh = token.span.style.lineHeight ?? lineHeightMul
        curH = Math.max(curH, fs * lh)
        ctx.font = `${fi} ${fw} ${fs}px ${fontFamily}`
        ctx.letterSpacing = `${ls}px`

        if (maxW === null) {
          curLine.push(token)
        } else {
          const words = token.text.match(spaceRe) ?? [token.text]
          for (const word of words) {
            const wordW = ctx.measureText(word).width
            if (curW > 0 && curW + wordW > maxW) flushLine()
            curLine.push({ text: word, span: token.span })
            curW += wordW
          }
        }
      }
      flushLine()
    }

    const measuredWidths = renderLines.map(rl => {
      let w = 0
      for (const tok of rl.tokens) {
        const fs = (tok.span.style.fontSize ?? baseFontSize) * TEXT_RENDER_SCALE
        const fw = tok.span.style.fontWeight ?? baseFontWeight
        const fi = tok.span.style.fontStyle ?? baseFontStyle
        const ls = (tok.span.style.letterSpacing ?? style.letterSpacing ?? 0) * TEXT_RENDER_SCALE
        ctx.font = `${fi} ${fw} ${fs}px ${fontFamily}`
        ctx.letterSpacing = `${ls}px`
        w += ctx.measureText(tok.text).width
      }
      return w
    })

    // 자연 폭: maxW(=width or maxWidth)가 있으면 그걸 상한으로, 없으면 실측 최대 폭
    const naturalW = maxW ?? Math.max(...measuredWidths, 0)
    // minWidth 적용: 텍스트가 짧아도 캔버스 폭 최소 보장 (wrap에는 영향 없음)
    const containerW = style.minWidth != null
      ? Math.max(naturalW, style.minWidth * TEXT_RENDER_SCALE)
      : naturalW

    const totalH = renderLines.reduce((s, r) => s + r.lineH, 0)
    // minHeight 적용: 줄이 적어도 캔버스 높이 최소 보장
    const clampedH = style.minHeight != null
      ? Math.max(maxH ?? totalH, style.minHeight * TEXT_RENDER_SCALE)
      : (maxH ?? totalH)

    let maxBorderWidth = 0
    let maxShadowBlur = shadowBlur
    let maxShadowOffsetX = Math.abs(shadowOffsetX)
    let maxShadowOffsetY = Math.abs(shadowOffsetY)

    for (const span of spans) {
      if (span.style.borderColor) {
        maxBorderWidth = Math.max(maxBorderWidth, (span.style.borderWidth ?? 1) * TEXT_RENDER_SCALE)
      }
      if (span.style.textShadowColor) {
        maxShadowBlur = Math.max(maxShadowBlur, (span.style.textShadowBlur ?? style.textShadowBlur ?? 0) * TEXT_RENDER_SCALE)
        maxShadowOffsetX = Math.max(maxShadowOffsetX, Math.abs((span.style.textShadowOffsetX ?? style.textShadowOffsetX ?? 0) * TEXT_RENDER_SCALE))
        maxShadowOffsetY = Math.max(maxShadowOffsetY, Math.abs((span.style.textShadowOffsetY ?? style.textShadowOffsetY ?? 0) * TEXT_RENDER_SCALE))
      }
    }

    const canvasW = Math.ceil(containerW) + maxShadowBlur * 2 + maxShadowOffsetX + maxBorderWidth * 2
    const canvasH = Math.ceil(clampedH) + maxShadowBlur * 2 + maxShadowOffsetY + maxBorderWidth * 2

    canvas.width = canvasW
    canvas.height = canvasH
    ctx.clearRect(0, 0, canvasW, canvasH)

    const originX = maxShadowBlur + Math.max(0, style.textShadowOffsetX ? maxShadowOffsetX / 2 : 0) + maxBorderWidth
    const originY = maxShadowBlur + Math.max(0, style.textShadowOffsetY ? maxShadowOffsetY / 2 : 0) + maxBorderWidth

    let curY = originY
    for (let li = 0; li < renderLines.length; li++) {
      const rl = renderLines[li]
      const lineW = measuredWidths[li]
      let lineStartX: number
      if (textAlign === 'center') lineStartX = originX + (containerW - lineW) / 2
      else if (textAlign === 'right') lineStartX = originX + containerW - lineW
      else lineStartX = originX

      let penX = lineStartX
      const baseline = curY + rl.lineH * 0.8

      for (const tok of rl.tokens) {
        const fs = (tok.span.style.fontSize ?? baseFontSize) * TEXT_RENDER_SCALE
        const fw = tok.span.style.fontWeight ?? baseFontWeight
        const fi = tok.span.style.fontStyle ?? baseFontStyle
        const fc = tok.span.style.color ?? baseColor
        const bc = tok.span.style.borderColor
        const bw = (tok.span.style.borderWidth ?? 1) * TEXT_RENDER_SCALE
        const ls = (tok.span.style.letterSpacing ?? style.letterSpacing ?? 0) * TEXT_RENDER_SCALE

        const tsc = tok.span.style.textShadowColor ?? shadowColor
        const tsb = (tok.span.style.textShadowBlur ?? style.textShadowBlur ?? 0) * TEXT_RENDER_SCALE
        const tsx = (tok.span.style.textShadowOffsetX ?? style.textShadowOffsetX ?? 0) * TEXT_RENDER_SCALE
        const tsy = (tok.span.style.textShadowOffsetY ?? style.textShadowOffsetY ?? 0) * TEXT_RENDER_SCALE

        ctx.font = `${fi} ${fw} ${fs}px ${fontFamily}`
        ctx.letterSpacing = `${ls}px`

        if (tsc) {
          ctx.shadowColor = tsc
          ctx.shadowBlur = tsb
          ctx.shadowOffsetX = tsx
          ctx.shadowOffsetY = tsy
        } else {
          ctx.shadowColor = 'transparent'
        }

        if (bc) {
          ctx.lineJoin = 'round'
          ctx.miterLimit = 2
          ctx.strokeStyle = bc
          ctx.lineWidth = bw * 2
          ctx.strokeText(tok.text, penX, baseline)
        }

        ctx.fillStyle = fc
        ctx.fillText(tok.text, penX, baseline)
        penX += ctx.measureText(tok.text).width
      }
      curY += rl.lineH
    }

    if (transitionProgress < 1) {
      ctx.globalCompositeOperation = 'destination-out'
      const totalLines = renderLines.length
      let lineTopY = 0

      for (let li = 0; li < renderLines.length; li++) {
        const rl = renderLines[li]
        // 마지막 줄이면 남은 캔버스 높이까지 모두 포괄
        const lineBottomY = (li === totalLines - 1) ? canvasH : lineTopY + rl.lineH

        // 이 줄의 로컬 진행도 (0 ~ 1)
        const lineProgress = Math.min(1, Math.max(0, transitionProgress * totalLines - li))

        if (lineProgress === 0) {
          // 시작도 안 함: 이 줄 영역을 완전히 지움
          ctx.fillStyle = 'rgba(0,0,0,1)'
          ctx.fillRect(0, lineTopY, canvasW, lineBottomY - lineTopY)
        } else if (lineProgress < 1) {
          // 절반쯤 진행 중: 진행도에 따라 우측 영역을 부드럽게 지우기 (그라데이션)
          const gradLineW = canvasW * 0.3
          const revealX = (canvasW + gradLineW) * lineProgress - gradLineW

          const grad = ctx.createLinearGradient(revealX, 0, revealX + gradLineW, 0)
          grad.addColorStop(0, 'rgba(0,0,0,0)') // 왼쪽(이미 드러난 부분)은 지우지 않음
          grad.addColorStop(1, 'rgba(0,0,0,1)') // 오른쪽(아직 안 드러난 부분)은 완전히 지움

          ctx.fillStyle = grad
          ctx.fillRect(0, lineTopY, canvasW, lineBottomY - lineTopY)
        }

        lineTopY += rl.lineH
      }

      ctx.globalCompositeOperation = 'source-over'
    }

    // Texture 업데이트
    entry.texture.image = canvas
    entry.texture.needsUpdate = true
  }

  // ─── Image ──────────────────────────────────────────────────────────────

  private _drawAsset(obj: LeviarImage, x: number, y: number, w: number, h: number, perspectiveScale: number, assets: LoadedAssets) {
    const src = obj.attribute?.src
    const oldSrc = obj.__transitionOldSrc
    const progress = obj.__transitionProgress ?? 0

    const drawAssetInner = (assetSrc: string, drawOpacity: number) => {
      const asset = assets[assetSrc]
      if (!asset || !(asset instanceof HTMLImageElement)) {
        if (!oldSrc || assetSrc === src) {
          this._drawPlaceholder(x, y, w || 60, h || 60)
        }
        return
      }

      let drawW: number, drawH: number;
      const reqW = obj.style.width
      const reqH = obj.style.height
      const natW = asset.naturalWidth
      const natH = asset.naturalHeight

      if (reqW && !reqH) {
        drawW = reqW;
        drawH = reqW * (natH / natW);
      } else if (!reqW && reqH) {
        drawH = reqH;
        drawW = reqH * (natW / natH);
      } else {
        drawW = reqW || natW;
        drawH = reqH || natH;
      }

      // min/max clamping (비율 유지)
      const clampedW = clampSize(drawW, obj.style.minWidth, obj.style.maxWidth)
      const clampedH = clampSize(drawH, obj.style.minHeight, obj.style.maxHeight)

      if (clampedW !== drawW || clampedH !== drawH) {
        // 둘 다 클램핑 대상이면 더 많이 줄여야 하는 축을 기준으로 비율 축소
        const ratioW = clampedW / drawW
        const ratioH = clampedH / drawH
        const minRatio = Math.min(ratioW, ratioH)
        drawW *= minRatio
        drawH *= minRatio
      }

      drawW *= perspectiveScale
      drawH *= perspectiveScale

      obj.__renderedSize = {
        w: drawW / perspectiveScale,
        h: drawH / perspectiveScale,
      }

      const baseRadius = parseBorderRadius(obj.style.borderRadius, drawW, drawH, 0)
      const texture = this._getOrCreateAssetTexture(assetSrc, asset)

      // 알파채널 경계 기반 shadow → outline → 이미지 본체 순서로 렌더링
      this._drawAlphaShadow(obj, x, y, drawW, drawH, texture)
      this._drawAlphaImageBorders(obj, x, y, drawW, drawH, texture, obj.__worldOpacity)
      this._drawTextureMesh(texture, x, y, drawW, drawH, drawOpacity, false, [0, 0], [1, 1], 0, baseRadius)
    }

    // 트랜지션 중이면 이전 이미지와 새 이미지를 모두 그린다
    if (oldSrc) {
      drawAssetInner(oldSrc, obj.__worldOpacity * (1 - progress))
      if (src) {
        drawAssetInner(src, obj.__worldOpacity * progress)
      }
    } else if (src) {
      drawAssetInner(src, obj.__worldOpacity)
    } else {
      this._drawPlaceholder(x, y, w || 60, h || 60)
    }
  }

  // ─── Video ──────────────────────────────────────────────────────────────

  private _drawVideo(obj: LeviarVideo, x: number, y: number, w: number, h: number, perspectiveScale: number, assets: LoadedAssets) {
    const src = obj.__src
    const asset = src ? assets[src] : undefined
    if (!asset || !(asset instanceof HTMLVideoElement)) {
      this._drawPlaceholder(x, y, w || 60, h || 60)
      return
    }

    // 객체에서 속성(currentTime 등)을 조작하기 위해 엘리먼트 참조 주입
    obj.__videoElement = asset

    const clip = obj.__clip

    if (obj.__playing) {
      if (clip) {
        asset.loop = clip.loop
        if (obj.__needsSeekToStart && clip.start != null) {
          asset.currentTime = clip.start / 1000
          obj.__needsSeekToStart = false
        }
      }
      if (asset.paused) asset.play().catch(() => { })
    } else {
      if (!asset.paused) asset.pause()
    }

    // 사용자 명시적 seek — clip.start보다 뒤에 적용하여 항상 우선
    if (obj.__pendingSeek != null) {
      asset.currentTime = obj.__pendingSeek
      obj.__pendingSeek = null
    }

    if (clip && clip.end != null && asset.currentTime >= clip.end / 1000) {
      if (clip.loop) {
        asset.currentTime = (clip.start ?? 0) / 1000
        obj.__onRepeat()
      } else {
        asset.pause()
        obj.__onEnded()
      }
    }

    // style.width/height 미지정 시 videoSize에 perspectiveScale 적용
    let drawW: number, drawH: number;
    const reqW = obj.style.width
    const reqH = obj.style.height
    const natW = asset.videoWidth
    const natH = asset.videoHeight

    if (reqW && !reqH) {
      drawW = reqW;
      drawH = reqW * (natH / natW);
    } else if (!reqW && reqH) {
      drawH = reqH;
      drawW = reqH * (natW / natH);
    } else {
      drawW = reqW || natW;
      drawH = reqH || natH;
    }

    const clampedW = clampSize(drawW, obj.style.minWidth, obj.style.maxWidth)
    const clampedH = clampSize(drawH, obj.style.minHeight, obj.style.maxHeight)

    if (clampedW !== drawW || clampedH !== drawH) {
      const ratioW = clampedW / drawW
      const ratioH = clampedH / drawH
      const minRatio = Math.min(ratioW, ratioH)
      drawW *= minRatio
      drawH *= minRatio
    }

    drawW *= perspectiveScale
    drawH *= perspectiveScale

    obj.__renderedSize = {
      w: drawW / perspectiveScale,
      h: drawH / perspectiveScale,
    }

    const baseRadius = parseBorderRadius(obj.style.borderRadius, drawW, drawH, 0)
    this._drawShadow(obj, x, y, drawW, drawH, drawW, drawH, false, baseRadius)
    this._drawRectBorders(obj, x, y, drawW, drawH, obj.__worldOpacity)

    // 비디오 텍스처는 매 프레임 업데이트
    let tex = this.videoTextureCache.get(src!)
    if (!tex) {
      tex = new Texture(this.gl, { image: asset, generateMipmaps: false, premultiplyAlpha: true })
      this.videoTextureCache.set(src!, tex)
    }
    tex.image = asset
    tex.needsUpdate = true

    this._drawTextureMesh(tex, x, y, drawW, drawH, obj.__worldOpacity, false, [0, 0], [1, 1], 0, baseRadius)
  }

  // ─── Sprite ─────────────────────────────────────────────────────────────

  private _drawSprite(sprite: Sprite, x: number, y: number, w: number, h: number, perspectiveScale: number, assets: LoadedAssets, timestamp: number) {
    sprite.__tick(timestamp)

    const clip = sprite.__clip
    const src = clip?.src
    if (!src) return

    const asset = assets[src]
    if (!asset || !(asset instanceof HTMLImageElement)) {
      this._drawPlaceholder(x, y, w || 60, h || 60)
      return
    }

    const texture = this._getOrCreateAssetTexture(src, asset)

    if (!clip) {
      let drawW: number, drawH: number;
      const reqW = sprite.style.width
      const reqH = sprite.style.height
      const natW = asset.naturalWidth
      const natH = asset.naturalHeight

      if (reqW && !reqH) {
        drawW = reqW;
        drawH = reqW * (natH / natW);
      } else if (!reqW && reqH) {
        drawH = reqH;
        drawW = reqH * (natW / natH);
      } else {
        drawW = reqW || natW;
        drawH = reqH || natH;
      }

      const clampedW = clampSize(drawW, sprite.style.minWidth, sprite.style.maxWidth)
      const clampedH = clampSize(drawH, sprite.style.minHeight, sprite.style.maxHeight)

      if (clampedW !== drawW || clampedH !== drawH) {
        const ratioW = clampedW / drawW
        const ratioH = clampedH / drawH
        const minRatio = Math.min(ratioW, ratioH)
        drawW *= minRatio
        drawH *= minRatio
      }

      drawW *= perspectiveScale
      drawH *= perspectiveScale

      sprite.__renderedSize = {
        w: drawW / perspectiveScale,
        h: drawH / perspectiveScale,
      }
      const baseRadius = parseBorderRadius(sprite.style.borderRadius, drawW, drawH, 0)
      this._drawAlphaShadow(sprite, x, y, drawW, drawH, texture)
      this._drawAlphaImageBorders(sprite, x, y, drawW, drawH, texture, sprite.__worldOpacity)
      this._drawTextureMesh(texture, x, y, drawW, drawH, sprite.__worldOpacity, false, [0, 0], [1, 1], 0, baseRadius)
      return
    }

    const { frameWidth, frameHeight } = clip
    const sheetCols = Math.floor(asset.naturalWidth / frameWidth)
    const frameIdx = sprite.__currentFrame
    const col = frameIdx % sheetCols
    const row = Math.floor(frameIdx / sheetCols)
    const uvScaleX = frameWidth / asset.naturalWidth
    const uvScaleY = frameHeight / asset.naturalHeight
    const uvOffsetX = col * uvScaleX
    const uvOffsetY = 1.0 - (row + 1) * uvScaleY

    let drawW: number, drawH: number;
    const reqW = sprite.style.width
    const reqH = sprite.style.height

    if (reqW && !reqH) {
      drawW = reqW;
      drawH = reqW * (frameHeight / frameWidth);
    } else if (!reqW && reqH) {
      drawH = reqH;
      drawW = reqH * (frameWidth / frameHeight);
    } else {
      drawW = reqW || frameWidth;
      drawH = reqH || frameHeight;
    }

    const clampedW = clampSize(drawW, sprite.style.minWidth, sprite.style.maxWidth)
    const clampedH = clampSize(drawH, sprite.style.minHeight, sprite.style.maxHeight)

    if (clampedW !== drawW || clampedH !== drawH) {
      const ratioW = clampedW / drawW
      const ratioH = clampedH / drawH
      const minRatio = Math.min(ratioW, ratioH)
      drawW *= minRatio
      drawH *= minRatio
    }

    drawW *= perspectiveScale
    drawH *= perspectiveScale

    sprite.__renderedSize = {
      w: drawW / perspectiveScale,
      h: drawH / perspectiveScale,
    }
    const baseRadius = parseBorderRadius(sprite.style.borderRadius, drawW, drawH, 0)
    this._drawAlphaShadow(sprite, x, y, drawW, drawH, texture, [uvOffsetX, uvOffsetY], [uvScaleX, uvScaleY])
    this._drawAlphaImageBorders(sprite, x, y, drawW, drawH, texture, sprite.__worldOpacity, [uvOffsetX, uvOffsetY], [uvScaleX, uvScaleY])

    this._drawTextureMesh(
      texture,
      x, y, drawW, drawH,
      sprite.__worldOpacity,
      false,
      [uvOffsetX, uvOffsetY],
      [uvScaleX, uvScaleY],
      0,
      baseRadius
    )
  }

  // ─── Particle (Instanced) ────────────────────────────────────────────────

  private _drawParticle(
    obj: Particle,
    emX: number, emY: number,
    w: number, h: number,
    perspectiveScale: number,
    assets: LoadedAssets,
    timestamp: number,
  ) {
    obj.__tick(timestamp)

    const clip = obj.__clip
    if (!clip) return

    const asset = assets[clip.src]
    if (!asset || !(asset instanceof HTMLImageElement)) {
      this._drawPlaceholder(emX, emY, w || 30, h || 30)
      return
    }

    const instances = obj.__instances
    if (instances.length === 0) return

    const natW = asset.naturalWidth
    const natH = asset.naturalHeight
    // w/h는 이미 perspectiveScale이 반영된 픽셀 크기
    let baseW: number, baseH: number;
    if (w && !h) {
      baseW = w;
      baseH = w * (natH / natW);
    } else if (!w && h) {
      baseW = h * (natW / natH);
      baseH = h;
    } else {
      baseW = w || natW;
      baseH = h || natH;
    }

    const texture = this._getOrCreateAssetTexture(clip.src, asset)

    // 블렌드 모드 설정은 _drawTextureMesh 배칭에서 자동으로 처리됨
    for (const inst of instances) {
      const age = timestamp - inst.born
      const t = Math.min(age / inst.lifespan, 1)

      let scale = 1
      if (inst.sizes.length > 0) {
        if (inst.sizes.length === 1) {
          scale = inst.sizes[0]
        } else {
          const segments = inst.sizes.length - 1
          const segmentIndex = Math.min(Math.floor(t * segments), segments - 1)
          const maxSegT = 1 / segments
          const localT = (t - segmentIndex * maxSegT) / maxSegT
          scale = inst.sizes[segmentIndex] + (inst.sizes[segmentIndex + 1] - inst.sizes[segmentIndex]) * localT
        }
      }

      let opacity = 1
      if (inst.opacities.length > 0) {
        if (inst.opacities.length === 1) {
          opacity = inst.opacities[0]
        } else {
          const segments = inst.opacities.length - 1
          const segmentIndex = Math.min(Math.floor(t * segments), segments - 1)
          const maxSegT = 1 / segments
          const localT = (t - segmentIndex * maxSegT) / maxSegT
          opacity = inst.opacities[segmentIndex] + (inst.opacities[segmentIndex + 1] - inst.opacities[segmentIndex]) * localT
        }
      }
      if (opacity <= 0 || scale <= 0) continue

      // 에미터 위치 + 인스턴스 상대 오프셋
      const ix = emX + inst.x * perspectiveScale
      const iy = emY + inst.y * perspectiveScale

      const iw = baseW * scale
      const ih = baseH * scale

      this._drawTextureMesh(
        texture,
        ix, iy, iw, ih,
        obj.__worldOpacity * opacity,
        false, [0, 0], [1, 1],
        inst.z || 0,
        null,
        inst.angle || 0
      )
    }

  }

  // ─── Gradient (WebGL Shader) ────────────────────────────────────────────────

  /**
   * WebGL 셰이더로 gradient를 직접 렌더링합니다.
   * Canvas 텍스처 생성·캐싱 없이 uniform만 설정하여 즉시 draw합니다.
   * 애니메이션 시 매 프레임 Canvas/Texture 재생성이 없어 GPU 메모리 누수가 없습니다.
   */
  private _drawGradient(
    gradient: string,
    type: 'linear' | 'circular',
    x: number,
    y: number,
    w: number,
    h: number,
    opacity: number,
    isEllipse: boolean,
    borderRadius: [number, number, number, number] | null
  ) {
    const { direction, stops } = parseGradientStops(gradient)
    if (stops.length === 0) return

    this._flushBatch()
    this._setBlendMode(this._activeObj?.style?.blendMode ?? 'source-over')

    const MAX_STOPS = 8
    const count = Math.min(stops.length, MAX_STOPS)

    type ColorName = 'uStopColors0' | 'uStopColors1' | 'uStopColors2' | 'uStopColors3' | 'uStopColors4' | 'uStopColors5' | 'uStopColors6' | 'uStopColors7'
    type OffsetName = 'uStopOffset0' | 'uStopOffset1' | 'uStopOffset2' | 'uStopOffset3' | 'uStopOffset4' | 'uStopOffset5' | 'uStopOffset6' | 'uStopOffset7'

    const colorNames: ColorName[] = ['uStopColors0', 'uStopColors1', 'uStopColors2', 'uStopColors3', 'uStopColors4', 'uStopColors5', 'uStopColors6', 'uStopColors7']
    const offsetNames: OffsetName[] = ['uStopOffset0', 'uStopOffset1', 'uStopOffset2', 'uStopOffset3', 'uStopOffset4', 'uStopOffset5', 'uStopOffset6', 'uStopOffset7']

    const prog = this.gradientProgram
    prog.uniforms['uStopCount'].value = count

    for (let i = 0; i < MAX_STOPS; i++) {
      const src = i < count ? stops[i] : stops[count - 1]
      const [r, g, b, a] = parseCSSColor(src.color)
      prog.uniforms[colorNames[i]].value = [r, g, b, a]
      prog.uniforms[offsetNames[i]].value = i < count ? src.offset : 1.0
    }

    prog.uniforms['uDirection'].value = direction
    prog.uniforms['uType'].value = type === 'circular' ? 1 : 0
    prog.uniforms['uSize'].value = [w, h]
    prog.uniforms['uBorderRadius'].value = borderRadius ?? [0, 0, 0, 0]
    prog.uniforms['uIsEllipse'].value = isEllipse ? 1 : 0
    prog.uniforms['uOpacity'].value = opacity
    prog.uniforms['uModelMatrix'].value = this._makeModelMatrix(x, y, w, h)
    prog.uniforms['uViewMatrix'].value = this._viewMat
    prog.uniforms['uProjectionMatrix'].value = this._projMatrix()

    this.gradientMesh.draw({ camera: this.camera })
  }

  // ─── Placeholder ────────────────────────────────────────────────────────

  private _drawPlaceholder(x: number, y: number, w: number, h: number) {
    this._flushBatch();
    this._setBlendMode(this._activeObj?.style?.blendMode ?? 'source-over');
    this.placeholderProgram.uniforms['uModelMatrix'].value = this._makeModelMatrix(x, y, w, h)
    this.placeholderProgram.uniforms['uProjectionMatrix'].value = this._projMatrix()
    this.placeholderMesh.draw({ camera: this.camera })
  }

  // ─── Texture 캐시 ────────────────────────────────────────────────────────

  private _getOrCreateAssetTexture(src: string, asset: HTMLImageElement): Texture {
    let tex = this.assetTextureCache.get(src)
    if (!tex) {
      tex = new Texture(this.gl, { image: asset, generateMipmaps: false, premultiplyAlpha: true })
      this.assetTextureCache.set(src, tex)
    }
    return tex
  }
}
