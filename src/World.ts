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
import type { LveObjectOptions } from './types.js'
import type { RectangleOptions } from './objects/Rectangle.js'
import { Renderer } from './Renderer.js'

export class World {
  private renderer: Renderer
  private objects: Set<LveObject> = new Set()
  private rafId: number | null = null

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

  createLoader(): Loader {
    return new Loader()
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

  removeObject(obj: import('./LveObject.js').LveObject) {
    this.objects.delete(obj)
  }

  start() {
    if (this.rafId !== null) return

    const loop = () => {
      this.renderer.render(this.objects)
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
