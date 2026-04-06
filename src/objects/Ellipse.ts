import { LeviaObject } from '../LeviaObject.js'
import type { LeviaObjectOptions } from '../types.js'

export class Ellipse<
  D extends Record<string, any> = Record<string, any>
> extends LeviaObject<Record<string, any>, D> {
  constructor(options?: LeviaObjectOptions<Record<string, any>, D>) {
    super('ellipse', options)
  }
}
