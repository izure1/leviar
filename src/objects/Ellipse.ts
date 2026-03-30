import { LveObject } from '../LveObject.js'
import type { LveObjectOptions } from '../types.js'

export class Ellipse extends LveObject {
  constructor(options?: LveObjectOptions) {
    super('ellipse', options)
  }
}
