# Event Guide

An **Event** is like a traffic light that notifies you of **various occurrences** within the world. The leviar engine provides a rich set of events to detect object state changes or user interactions in real-time.

---

## 📋 1. Object Common Events (LeviarObject Events)

Common signals that occur in all objects (`LeviarObject`). You can subscribe using the format `obj.on('eventName', (arg1, arg2...) => { ... })`.

### 🖱️ Mouse Interactions (MouseEvents)

| Event Name | Arguments | Timing |
| :--- | :--- | :--- |
| `click` | `e: MouseEvent` | When the object is clicked |
| `dblclick` | `e: MouseEvent` | When the object is double-clicked |
| `mousedown` / `mouseup` | `e: MouseEvent` | When the mouse button is pressed or released |
| `mouseover` / `mouseout` | `e: MouseEvent` | When the mouse enters or leaves the object's area |
| `mousemove` | `e: MouseEvent` | When the mouse moves over the object |
| `contextmenu` | `e: MouseEvent` | When the object is right-clicked |

### ⚙️ State and Attribute Changes (Modified)

| Event Name | Arguments | Timing |
| :--- | :--- | :--- |
| `cssmodified` | `key, newValue, oldValue` | When a `style` attribute changes |
| `attrmodified` | `key, newValue, oldValue` | When a base `attribute` changes |
| `datamodified` | `key, newValue, oldValue` | When user data (`dataset`) changes |
| `positionmodified` | `axis, newValue, oldValue` | When position (x, y, z) changes |
| `rotationmodified` | `axis, newValue, oldValue` | When rotation (x, y, z) changes |
| `scalemodified` | `axis, newValue, oldValue` | When scale (x, y, z) changes |
| `pivotmodified` | `axis, newValue, oldValue` | When the transformation center (Pivot) changes |

### 🎬 Playback Related

| Event Name | Timing | Remarks |
| :--- | :--- | :--- |
| `play` | When playback starts or resumes | - |
| `pause` | When playback is paused | - |
| `ended` | When playback reaches the end | - |
| `repeat` | When one cycle completes during loop playback | - |

---

## 📋 2. Animation & Transition

| Event Name | Timing | Main Action |
| :--- | :--- | :--- |
| `start` | When the effect starts | Processes `display: block` during `fadeIn`, etc. |
| `update` | When numerical values change every frame | Delivers `state` progress information |
| `end` | When the effect finishes | Processes `display: none` during `fadeOut`, etc. |
| `pause` / `resume` | On pause / resume | - |
| `stop` | When forcibly stopped | When `anim.stop()` is called |

---

## 📋 3. World Events

| Event Name | Arguments | Timing |
| :--- | :--- | :--- |
| `update` | `timestamp: number` | The world's heartbeat (every frame) |
| `click` / `mousedown` / ...| `obj: LeviarObject, e: MouseEvent` | Mouse events across the entire world |

---

## 💡 Event Propagation Control (Bubbling)

The leviar engine's event system has a structure where events occurring on an object propagate to the world.

```typescript
const box = world.createRectangle({ attribute: { name: 'myBox' } });

box.on('click', (e) => {
  // To handle the event myself and prevent it from reaching world.on('click', ...):
  e.stopPropagation();
});
```
By stopping the propagation like this, you can prevent other parent objects or the global world handler from triggering at the same time as the clicked object.
