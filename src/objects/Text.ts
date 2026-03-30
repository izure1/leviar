import { LveObject } from '../LveObject.js'
import type { LveObjectOptions } from '../types.js'

export class Text extends LveObject {
  constructor(options?: LveObjectOptions) {
    super('text', options)
  }
}
