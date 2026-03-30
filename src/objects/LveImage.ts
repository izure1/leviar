import { LveObject } from '../LveObject.js'
import type { LveObjectOptions } from '../types.js'

export class LveImage extends LveObject {
  constructor(options?: LveObjectOptions) {
    super('image', options)
  }
}
