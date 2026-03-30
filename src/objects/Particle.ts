import { LveObject } from '../LveObject.js'
import type { LveObjectOptions } from '../types.js'

export class Particle extends LveObject {
  constructor(options?: LveObjectOptions) {
    super('particle', options)
  }
}
