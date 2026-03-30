import { LveObject } from '../LveObject.js'
import type { LveObjectOptions } from '../types.js'

export class LveVideo extends LveObject {
  constructor(options?: LveObjectOptions) {
    super('video', options)
  }
}
