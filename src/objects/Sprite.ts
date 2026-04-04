import { LveObject } from '../LveObject.js'
import type { LveObjectOptions } from '../types.js'
import type { SpriteClip, SpriteManager } from '../SpriteManager.js'

export interface SpriteAttribute {
  currentTime?: number
  playbackRate?: number
  src?: string
}

const DELEGATED_GETTERS: Record<string, (self: Sprite) => any> = {
  src: (self) => self['_clipName'] ?? undefined,
  currentTime: (self) => self._clip ? Math.max(0, self._currentFrame - self._clip.start) : 0,
  playbackRate: (self) => self._playbackRate ?? (self._clip ? self._clip.frameRate : 0),
}

const DELEGATED_SETTERS: Record<string, (self: Sprite, value: any) => void> = {
  src: (self, value: string) => {
    const anySelf = self as any
    if (!anySelf._manager) {
      console.warn('[Sprite] __setManager()를 먼저 호출하십시오.')
      return
    }
    const clip = anySelf._manager.get(value)
    if (!clip) {
      console.warn(`[Sprite] 클립 '${value}'을 찾을 수 없습니다.`)
      return
    }
    anySelf._clipName = value
    self._clip = clip
    self._currentFrame = clip.start
    self._lastFrameTime = 0
    self._playing = false
    self._paused = false
  },
  currentTime: (self, value: number) => {
    if (!self._clip) return
    self._currentFrame = self._clip.start + Math.floor(value)
    if (self._currentFrame >= self._clip.end) self._currentFrame = self._clip.end - 1
    if (self._currentFrame < self._clip.start) self._currentFrame = self._clip.start
  },
  playbackRate: (self, value: number) => {
    self._playbackRate = value
  },
}

export class Sprite<
  D extends Record<string, any> = Record<string, any>
> extends LveObject<SpriteAttribute, D> {
  /** 연결된 SpriteManager */
  private _manager: SpriteManager | null = null

  /** 현재 재생 중인 클립 이름 */
  private _clipName: string | null = null

  /** 현재 클립 정보 (Renderer에서 직접 참조) */
  _clip: SpriteClip | null = null
  /** 생성자 시점에 _manager가 없어서 보류된 src 값 */
  private _pendingSrc: string | null = null

  /** 커스텀 재생 속도 (fps). undefined면 clip의 frameRate 사용 */
  _playbackRate?: number

  /** 현재 프레임 인덱스 (clip.start 기준 절대 인덱스) */
  _currentFrame: number = 0

  /** 마지막 프레임 변경 시각 (rAF timestamp) */
  _lastFrameTime: number = 0

  /** 재생 중 여부 */
  _playing: boolean = false

  /** 일시정지 여부 */
  _paused: boolean = false

  constructor(options?: LveObjectOptions<SpriteAttribute, D>) {
    super('sprite', options, Object.keys(DELEGATED_GETTERS))
    // src setter는 _manager에 의존하므로 생성자 시점에 처리할 수 없습니다.
    // __setManager() 호출 시 자동으로 적용됩니다.
    this._pendingSrc = (options?.attribute as any)?.src ?? null
  }

  /**
   * SpriteManager를 연결합니다.
   */
  __setManager(manager: SpriteManager): this {
    this._manager = manager
    if (this._pendingSrc) {
      this.attribute.src = this._pendingSrc
      this._pendingSrc = null
    }
    return this
  }

  /**
   * 애니메이션 클립을 재생합니다.
   */
  play(): this {
    if (!this._clip) {
      console.warn('[Sprite] src 속성을 먼저 설정하십시오.')
      return this
    }
    if (this._playing && !this._paused) return this

    this._playing = true
    this._paused = false
    this._lastFrameTime = 0
    this.emit('play')
    return this
  }

  /** 재생을 일시정지합니다. */
  pause(): this {
    if (!this._playing || this._paused) return this
    this._paused = true
    this.emit('pause')
    return this
  }

  /** 애니메이션을 정지하고 처음으로 되돌립니다. */
  stop(): this {
    this._playing = false
    this._paused = false
    if (this._clip) {
      this._currentFrame = this._clip.start
      this._lastFrameTime = 0
    }
    return this
  }

  /**
   * Renderer에서 매 프레임 호출하여 현재 프레임 인덱스를 업데이트합니다.
   */
  __tick(timestamp: number) {
    if (!this._playing || this._paused || !this._clip) return

    const { frameRate, start, end, loop } = this._clip
    const targetFps = this._playbackRate !== undefined ? this._playbackRate : frameRate
    const interval = 1000 / targetFps

    if (this._lastFrameTime === 0) {
      this._lastFrameTime = timestamp
      return
    }

    if (timestamp - this._lastFrameTime >= interval) {
      this._currentFrame++
      this._lastFrameTime = timestamp

      if (this._currentFrame >= end) {
        if (loop) {
          this._currentFrame = start
          this.emit('repeat')
        } else {
          this._currentFrame = end - 1
          this._playing = false
          this.emit('ended')
        }
      }
    }
  }

  protected _getDelegatedAttribute(key: string): any {
    const handler = DELEGATED_GETTERS[key]
    if (handler) return handler(this)
    return super._getDelegatedAttribute(key)
  }

  protected _setDelegatedAttribute(key: string, value: any): void {
    const handler = DELEGATED_SETTERS[key]
    if (handler) {
      handler(this, value)
    } else {
      super._setDelegatedAttribute(key, value)
    }
  }
}
