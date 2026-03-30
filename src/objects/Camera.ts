import { LveObject } from '../LveObject.js'
import type { LveObjectOptions } from '../types.js'

export class Camera extends LveObject {
  constructor(options?: LveObjectOptions) {
    super('camera', options)
  }
}
