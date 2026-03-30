import { LveObject } from '../LveObject.js'
import type { LveObjectOptions } from '../types.js'

export interface RectangleOptions extends LveObjectOptions {
  style?: LveObjectOptions['style'] & {
    borderRadius?: number
  }
}

export class Rectangle extends LveObject {
  borderRadius: number

  constructor(options?: RectangleOptions) {
    super('rectangle', options)
    this.borderRadius = options?.style?.borderRadius ?? 0
  }
}
