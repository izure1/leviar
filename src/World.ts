import { Loader } from './Loader.js'
import { Camera } from './objects/Camera.js'
import { Rectangle } from './objects/Rectangle.js'
import { Ellipse } from './objects/Ellipse.js'
import { Text } from './objects/Text.js'
import { LveObject } from './LveObject.js'
import { LveImage } from './objects/LveImage.js'
import { LveVideo } from './objects/LveVideo.js'
import { Sprite } from './objects/Sprite.js'
import { Particle } from './objects/Particle.js'
import { SpriteManager } from './SpriteManager.js'
import type { LveObjectOptions, LoadedAssets } from './types.js'
import type { RectangleOptions } from './objects/Rectangle.js'
import { Renderer } from './Renderer.js'

export class World {
  private renderer: Renderer
  private objects: Set<LveObject> = new Set()
  private rafId: number | null = null
  /** 모든 Loader에서 로드된 에셋의 통합 맵 */
  private _assets: LoadedAssets = {}

  constructor(canvas?: HTMLCanvasElement) {
    const canvasEl = canvas ?? this.createCanvas()
    this.renderer = new Renderer(canvasEl)
  }

  private createCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;'
    document.body.appendChild(canvas)

    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    })

    return canvas
  }

  /**
   * 스프라이트 애니메이션 클립을 관리하는 SpriteManager를 생성합니다.
   */
  createSpriteManager(): SpriteManager {
    return new SpriteManager()
  }

  /**
   * 에셋 로더를 생성합니다. 로드 완료 시 World 내부 에셋 맵에 자동으로 병합됩니다.
   */
  createLoader(): Loader {
    const loader = new Loader()
    loader.on('complete', ({ assets }) => {
      Object.assign(this._assets, assets)
    })
    return loader
  }

  createCamera(options?: LveObjectOptions): Camera {
    const cam = new Camera(options)
    this.objects.add(cam)
    return cam
  }

  createRectangle(options?: RectangleOptions): Rectangle {
    const rect = new Rectangle(options)
    this.objects.add(rect)
    return rect
  }

  createEllipse(options?: LveObjectOptions): Ellipse {
    const el = new Ellipse(options)
    this.objects.add(el)
    return el
  }

  createText(options?: LveObjectOptions): Text {
    const text = new Text(options)
    this.objects.add(text)
    return text
  }

  createImage(options?: LveObjectOptions): LveImage {
    const img = new LveImage(options)
    this.objects.add(img)
    return img
  }

  createVideo(options?: LveObjectOptions): LveVideo {
    const video = new LveVideo(options)
    this.objects.add(video)
    return video
  }

  createSprite(options?: LveObjectOptions): Sprite {
    const sprite = new Sprite(options)
    this.objects.add(sprite)
    return sprite
  }

  createParticle(options?: LveObjectOptions): Particle {
    const particle = new Particle(options)
    this.objects.add(particle)
    return particle
  }

  removeObject(obj: LveObject) {
    this.objects.delete(obj)
  }

  start() {
    if (this.rafId !== null) return

    const loop = (timestamp: number) => {
      this.renderer.render(this.objects, this._assets, timestamp)
      this.rafId = requestAnimationFrame(loop)
    }

    this.rafId = requestAnimationFrame(loop)
  }

  stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }
}
