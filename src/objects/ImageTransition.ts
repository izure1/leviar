import { LeviaImage } from './LeviaImage.js'
import { BaseTransition } from './BaseTransition.js'

export class ImageTransition extends BaseTransition<LeviaImage> {
  constructor(target: LeviaImage) { super(target) }

  start(newSrc: string, durationMs: number): this {
    if (this._anim) this._anim.stop()

    if (!this.target.attribute?.src || durationMs <= 0 || this.target.attribute.src === newSrc) {
      this.target.attribute.src = newSrc
      this.target._transitionOldSrc = null
      this.target._transitionProgress = 0
      return this
    }
    this.target._transitionOldSrc = this.target.attribute.src
    this.target._transitionProgress = 0
    this.target.attribute.src = newSrc

    this._startTransition(durationMs, 'linear',
      (progress) => {
        this.target._transitionProgress = progress
      },
      () => {
        this.target._transitionOldSrc = null
        this.target._transitionProgress = 0
      }
    )
    return this
  }
}
