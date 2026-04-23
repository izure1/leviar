import { LeviarObject } from '../LeviarObject.js'
import { BaseTransition } from './BaseTransition.js'
import type { EasingType } from '../types.js'

export class FadeTransition extends BaseTransition<LeviarObject> {
  constructor(target: LeviarObject) { super(target) }

  start(durationMs: number, easing: EasingType | undefined, type: 'in' | 'out'): this {
    if (this._anim) this._anim.stop()

    if (type === 'out') {
      // 현재 opacity에서 시작하여 0으로 (이미 보이는 객체에 걸어도 반짝임 없음)
      const fromOpacity = this.target.__fadeOpacity
      this.target.__dirtyTexture = true

      this._startTransition(durationMs, easing,
        (progress) => {
          this.target.__fadeOpacity = fromOpacity * (1 - progress)
          this.target.__dirtyTexture = true
        },
        () => {
          this.target.style.display = 'none'
          this.target.__fadeOpacity = 0
        }
      )
    } else {
      // display='block' 먼저 세팅하여 sort 캐시에 포함시킴
      this.target.style.display = 'block'
      // 현재 opacity에서 시작하여 1로 (이미 보이는 객체에 걸어도 반짝임 없음)
      const fromOpacity = this.target.__fadeOpacity
      this.target.__dirtyTexture = true

      this._startTransition(durationMs, easing,
        (progress) => {
          this.target.__fadeOpacity = fromOpacity + (1 - fromOpacity) * progress
          this.target.__dirtyTexture = true
        },
        () => {
          this.target.__fadeOpacity = 1
        }
      )
    }
    return this
  }
}
