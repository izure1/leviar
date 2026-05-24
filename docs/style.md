# Style Guide

**Style** is the core specification that determines the **appearance and visual design** of an object. The leviar engine provides intuitive CSS-like attributes, helping developers freely compose the screen as if they were designing for the web.

---

## 📋 1. Basic Size and Display Control (Layout)

| Attribute | Type | Description |
| :--- | :--- | :--- |
| `width` / `height` | `number` | Width/height size (px). If one is omitted, ratio is maintained; if both omitted, original size. |
| `minWidth` / `minHeight` | `number` | Minimum width/height size (px). |
| `maxWidth` / `maxHeight` | `number` | Maximum width/height size (px). |
| `display` | `'block' \| 'none'` | Whether to render on screen. If `'none'`, it disappears from screen and is excluded from physics collisions. |
| `opacity` | `number` (0 ~ 1.0) | Opacity. (0: transparent, 1: opaque) |
| `zIndex` | `number` | Layer order. Higher number is drawn in front. (Default: 0) |
| `pointerEvents` | `boolean` | Whether to receive mouse interactions. If `false`, events pass through. |
| `cursor` | `CssCursor` | Cursor shape to display on hover. Supports standard CSS cursor values. |
| `margin` | `string` | Additional margin for physical collision area. Supports CSS shorthand notation. |
| `overflow` | `'hidden' \| 'visible'` | Display method when child objects exceed the parent's area. (Default: `'visible'`) |

---

## 📋 2. Color and Border (Appearance)

| Attribute | Type | Description |
| :--- | :--- | :--- |
| `background` | `string` | Background. One of: solid color (HEX, RGB), image (`url('key')`), or gradient (`linear-gradient(...)`, `radial-gradient(...)`). (Rectangle, Ellipse only) |
| `backgroundSize` | `'cover' \| 'contain' \| 'auto'` | How the background image fills the area. (Default: `'auto'`) |
| `color` | `string` | Fill color specifically for text. (Text only) |
| `blur` | `number` | Gaussian blur intensity. |
| `borderColor` | `string` | Border color. |
| `borderWidth` | `number` | Border thickness (inwards). |
| `outlineColor` | `string` | Outline color. |
| `outlineWidth` | `number` | Outline thickness (outwards). |
| `borderRadius` | `string \| number` | Corner rounding (supports 50%, "10 20", etc.). |

---

## 📋 3. Typography (Text only)

| Attribute | Type | Description |
| :--- | :--- | :--- |
| `fontSize` | `number` | Font size (px). |
| `fontFamily` | `string` | Font family name (Default: `sans-serif`). |
| `fontWeight` | `string` | Font weight (`normal`, `bold`, etc.). |
| `fontStyle` | `string` | Font style (`normal`, `italic`). |
| `lineHeight` | `number` | Line height multiplier (Default: `1.0`). |
| `letterSpacing` | `number` | Spacing between characters (px). |
| `textAlign` | `enum` | Text alignment (`left`, `center`, `right`). |

---

## 📋 4. Shadows and Gradients (FX)

| Attribute | Type | Description |
| :--- | :--- | :--- |
| `boxShadowColor` | `string` | Box shadow color. (For text, use `textShadowColor`) |
| `boxShadowBlur` | `number` | Shadow blur amount. |
| `boxShadowSpread` | `number` | Shadow spread size. |
| `boxShadowOffset` | `x, y: number` | Shadow offset distance (`boxShadowOffsetX`, `boxShadowOffsetY`). |

---

## 📋 5. Blend Mode

| Attribute | Type | Description |
| :--- | :--- | :--- |
| `blendMode` | `string` | Supports 16 standard blend modes (`multiply`, `screen`, `overlay`, etc.). |

---

## 💡 Key Attribute Detailed Specifications (Shorthand)

### Margin Application Order
- `1 value (10)`: Applied to all [Top, Bottom, Left, Right]
- `2 values (10 20)`: [Top, Bottom] 10, [Left, Right] 20
- `3 values (10 20 30)`: [Top] 10, [Left, Right] 20, [Bottom] 30
- `4 values (10 20 30 40)`: [Top] 10, [Right] 20, [Bottom] 30, [Left] 40 (Clockwise)

### BorderRadius
- **Irregular corners**: Applied in order [Top-left, Top-right, Bottom-right, Bottom-left] like `'10 20 30 40'`.
- **Percentage (%)**: Applying `'50%'` makes it circular.

### Background
The `style.background` attribute can be used for three purposes. It only works on `Rectangle` and `Ellipse` objects.
1. **Solid Color Fill**: Color codes like `rgb(255, 0, 0)`, `#ff0000`, `hsl(...)`
2. **Image Texture**: Specify an image key loaded from the asset manager using the `url('assetKey')` format.
   - When using textures, you can configure image ratio handling with the `backgroundSize` (`'cover'`, `'contain'`, `'auto'`) attribute.
3. **Gradient**: Use CSS syntax `linear-gradient(...)` or `radial-gradient(...)`.

> **Note**: To change text color, you must use `style.color`.

---

## 💡 Cursor (Mouse Cursor)

By assigning `style.cursor`, the canvas cursor shape changes when hovering over that object.
If unspecified, it follows standard browser behavior.

```typescript
const btn = world.createRectangle({
  style: { cursor: 'pointer' }
})
```

### Supported Values (`CssCursor`)

| Value | Description |
| :--- | :--- |
| `auto` | Browser automatically decides |
| `default` | Default arrow |
| `none` | Hide cursor |
| `pointer` | Pointing hand (links/buttons) |
| `grab` / `grabbing` | Grabbable / Grabbing |
| `move` | Movable |
| `text` | Text selection |
| `crosshair` | Crosshair |
| `wait` | Waiting (spinner) |
| `progress` | In progress (arrow + spinner) |
| `not-allowed` | Not allowed |
| `no-drop` | Drop not allowed |
| `copy` | Copy |
| `alias` | Alias/Shortcut |
| `context-menu` | Context menu |
| `help` | Help |
| `cell` | Table cell selection |
| `vertical-text` | Vertical text |
| `all-scroll` | Scroll in all directions |
| `col-resize` / `row-resize` | Column/Row resize |
| `n/e/s/w-resize` | One-direction resize |
| `ne/nw/se/sw-resize` | Diagonal resize |
| `ew/ns-resize` | Left-right/Up-down resize |
| `nesw/nwse-resize` | Bidirectional diagonal resize |
| `zoom-in` / `zoom-out` | Zoom in / Zoom out |

> **Priority**: The `cursor` value of the frontmost object based on the z-axis is applied.
> Objects with `pointerEvents: false` are excluded from hit-tests, so cursor changes won't apply.

---

## 💡 Overflow (Clipping Area)

You can use the `style.overflow` attribute to control how rendering is handled when a child object goes outside its parent object's area (Bounding Box).
It's primarily used when implementing UI panel masks or scroll areas. Internally, it uses WebGL's Scissor Test, so it clips cleanly without performance degradation.

```typescript
const container = world.createRectangle({
  style: { 
    width: 200, 
    height: 200, 
    overflow: 'hidden', // Hides children outside the area
    background: '#333'
  }
})

const child = world.createRectangle({
  style: { 
    width: 400, 
    height: 400, 
    background: 'red' 
  }
})

// The child is larger than the parent, but due to overflow: 'hidden', it only renders up to the 200x200 area
container.addChild(child)
```

### Supported Values

| Value | Description |
| :--- | :--- |
| `visible` | **(Default)** The child object renders as is, even if it exceeds the parent area. |
| `hidden` | Clips (cuts off) all pixels of child objects that extend beyond the parent element's boundary. |

> **Note**: Even if rotation is applied to the parent object, the child object is properly clipped according to the rotated parent's boundaries.
