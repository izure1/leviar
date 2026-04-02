import { LveObject } from '../LveObject.js'
import type { LveObjectOptions } from '../types.js'

export interface RectangleOptions extends LveObjectOptions { }

export class Rectangle extends LveObject {
  constructor(options?: RectangleOptions) {
    super('rectangle', options)
  }
}
