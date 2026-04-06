import { LeviaObject } from '../LeviaObject.js'
import type { LeviaObjectOptions } from '../types.js'

export interface RectangleOptions<
  D extends Record<string, any> = Record<string, any>
> extends LeviaObjectOptions<Record<string, any>, D> { }

export class Rectangle<
  D extends Record<string, any> = Record<string, any>
> extends LeviaObject<Record<string, any>, D> {
  constructor(options?: RectangleOptions<D>) {
    super('rectangle', options)
  }
}
