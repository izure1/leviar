import { LveObject } from '../LveObject.js'
import type { LveObjectOptions } from '../types.js'

export class Sprite extends LveObject {
  constructor(options?: LveObjectOptions) {
    super('sprite', options)
  }
}
