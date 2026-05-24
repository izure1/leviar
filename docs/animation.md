# Animation Guide

Hello! **Animation** is the core engine that connects all visual changes in the leviar engine **smoothly and vividly**. Beyond simply changing numerical values, it enables rich directing by integrating with the physics system and datasets.

---

## 🏃 1. Basic Usage (animate)

All objects can start an animation by calling the `animate()` method.

#### `animate(target, duration, easing)`

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `target` | `AnimateTarget` | - | The target values of the attributes (`style`, `transform`, `dataset`) you want to change. |
| `duration` | `number` | - | The duration of the animation in milliseconds (ms). |
| `easing` | `EasingType` | `'linear'` | The name of the animation acceleration control function. |

- **Returns**: Returns a dedicated `Animation` object that can be stopped or whose status can be checked.

> [!IMPORTANT]
> Generally, the `animate()` method can only be applied to numeric data types. However, for user convenience, as an exception, it can also be applied to string data types in *color (rgb, rgba, hex, hsl)* format and string data types in *gradient* format. In this case, colors are smoothly transitioned through the color interpolation function defined in `colorUtils.ts`.

### ➕ Relative Operators

It supports 4 operators that allow you to set the target value relative to the current value.

| Operator | Example | Description |
| :--- | :--- | :--- |
| `+=` | `'+=100'` | Add 100 to the current value |
| `-=` | `'-=50'` | Subtract 50 from the current value |
| `*=` | `'*=2'` | Multiply the current value by 2 |
| `/=` | `'/=2'` | Divide the current value by 2 |

---

## 📋 2. Animation Easing List (34 types)

The leviar engine provides 34 standard easing functions that allow precise control of numerical changes.

| Classification | Function List |
| :--- | :--- |
| **Linear** | `linear` |
| **Quad** | `easeInQuad`, `easeOutQuad`, `easeInOutQuad` |
| **Cubic** | `easeInCubic`, `easeOutCubic`, `easeInOutCubic` |
| **Quart** | `easeInQuart`, `easeOutQuart`, `easeInOutQuart` |
| **Quint** | `easeInQuint`, `easeOutQuint`, `easeInOutQuint` |
| **Sine** | `easeInSine`, `easeOutSine`, `easeInOutSine` |
| **Expo** | `easeInExpo`, `easeOutExpo`, `easeInOutExpo` |
| **Circ** | `easeInCirc`, `easeOutCirc`, `easeInOutCirc` |
| **Back** | `easeInBack`, `easeOutBack`, `easeInOutBack` |
| **Elastic** | `easeInElastic`, `easeOutElastic`, `easeInOutElastic` |
| **Bounce** | `easeInBounce`, `easeOutBounce`, `easeInOutBounce` |

---

## 🔔 3. Lifecycle Events

| Event Name | Timing | Arguments |
| :--- | :--- | :--- |
| `start` | When the animation starts | - |
| `update` | When numerical values change every frame | `state: { progress: number, [key: string]: any }` |
| `end` | On completion (reaching target) | - |
| `pause` | On pause | - |
| `resume` | On resume | - |
| `stop` | On forced stop (`anim.stop()`) | - |

---

## 💻 Usage Example

### Creating a rotating and fading box
```typescript
const box = world.createRectangle({
  style: { width: 100, height: 100, color: '#f1c40f' }
});

box.animate({
  style: { opacity: 0 },
  transform: { rotation: { z: '+=360' } }, // Rotate 360 degrees
  dataset: { score: 100 }               // User data can also increase smoothly
}, 2000, 'easeInOutBack').on('end', () => {
  // Delete the object when the animation ends
  box.remove();
}).on('update', (state) => {
  // Console output of progress per frame
  console.log(`Progress: ${Math.floor(state.progress * 100)}%`);
});
```
