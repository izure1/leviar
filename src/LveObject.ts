import { v4 as uuidv4 } from './utils/uuid.js'
import type {
  Attribute,
  Dataset,
  DatasetValue,
  LveObjectOptions,
  Style,
  Transform,
  Vec3,
} from './types.js'

function makeVec3(partial?: Partial<Vec3>): Vec3 {
  return {
    x: partial?.x ?? 0,
    y: partial?.y ?? 0,
    z: partial?.z ?? 0,
  }
}

function makeStyle(partial?: Partial<Style>): Style {
  return {
    color: partial?.color,
    opacity: partial?.opacity ?? 1,
    width: partial?.width,
    height: partial?.height,
    blur: partial?.blur,
    borderColor: partial?.borderColor,
    borderWidth: partial?.borderWidth,
    fontSize: partial?.fontSize,
    fontFamily: partial?.fontFamily,
    fontWeight: partial?.fontWeight,
    fontStyle: partial?.fontStyle ?? 'normal',
    textAlign: partial?.textAlign ?? 'left',
    lineHeight: partial?.lineHeight ?? 1,
    display: partial?.display ?? 'block',
    pointerEvents: partial?.pointerEvents ?? true,
    margin: partial?.margin,
    shadowColor: partial?.shadowColor,
    shadowBlur: partial?.shadowBlur,
    shadowOffsetX: partial?.shadowOffsetX,
    shadowOffsetY: partial?.shadowOffsetY,
    zIndex: partial?.zIndex ?? 0,
    blendMode: partial?.blendMode,
  }
}

export abstract class LveObject {
  readonly attribute: Attribute
  readonly dataset: Dataset
  readonly style: Style
  readonly transform: Transform

  constructor(type: string, options?: LveObjectOptions) {
    this.attribute = {
      type,
      id: uuidv4(),
      name: options?.attribute?.name ?? '',
      className: options?.attribute?.className ?? '',
      src: options?.attribute?.src,
      text: options?.attribute?.text,
      loop: options?.attribute?.loop ?? false,
      physics: options?.attribute?.physics ?? null,
      density: options?.attribute?.density,
      friction: options?.attribute?.friction,
      restitution: options?.attribute?.restitution,
      fixedRotation: options?.attribute?.fixedRotation,
      gravityScale: options?.attribute?.gravityScale,
    }

    this.dataset = Object.assign({}, options?.dataset)

    this.style = makeStyle(options?.style)

    this.transform = {
      position: makeVec3(options?.transform?.position),
      rotation: makeVec3(options?.transform?.rotation),
      scale: {
        x: options?.transform?.scale?.x ?? 1,
        y: options?.transform?.scale?.y ?? 1,
        z: options?.transform?.scale?.z ?? 1,
      },
    }
  }

  setDataset(key: string, value: DatasetValue) {
    this.dataset[key] = value
  }

  getDataset(key: string): DatasetValue | undefined {
    return this.dataset[key]
  }
}
