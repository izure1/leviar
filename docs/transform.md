# Transform Guide

**Transform** is the most important physical placement information that determines **where, in what direction, and at what size** an object will be placed in the world. The leviar engine supports a "Parent-Child" hierarchy structure, helping you manage complex 3D transformations intuitively.

---

## 📍 1. Transform Components

Every object has the following data under the `transform` attribute.

| Attribute | Type / Unit | Default | Description |
| :--- | :--- | :--- | :--- |
| `position` | `{x, y, z}` (px) | `0, 0, 0` | The center position of the object. The Z-axis represents distance from the camera. |
| `rotation` | `{x, y, z}` (degrees) | `0, 0, 0` | The rotation angle of the object for each axis. Application order: Z -> Y -> X. |
| `scale` | `{x, y, z}` (multiplier) | `1, 1, 1` | The size multiplier of the object. |
| `pivot` | `{x, y}` (0~1.0) | `0.5, 0.5` | The reference point for transformations (0,0: Top-left, 1,1: Bottom-right). |

---

## ⛓️ 2. Hierarchy and Inheritance

The leviar engine simplifies complex movements through parent-child relationships between objects.

| Method | Parameter | Description |
| :--- | :--- | :--- |
| `addChild` | `child: LeviarObject` | Registers a child and inherits all transform information from the parent. |
| **Matrix World** | - | Automatically calculates final coordinates by multiplying the parent's and its own local transforms. |

---

## 👣 3. Following System

Aside from child relationships, it provides a unique system for tracking while maintaining independence.

| Method | Parameter | Description |
| :--- | :--- | :--- |
| `follow` | `target, offset?` | Replicates only the target's **position** in real-time. Unaffected by rotation/scale changes. |

---

## 💻 Usage Example

### Creating a Planet and Satellite (Using Hierarchy)
```typescript
const planet = world.createCircle({ style: { width: 100, color: '#e67e22' } });
const satellite = world.createCircle({ style: { width: 30, color: '#95a5a6' } });

// When registered as a child, it moves along with the parent (planet).
planet.addChild(satellite);

// Place the satellite slightly apart to the side.
satellite.transform.position.x = 150;

// Rotating the planet makes the satellite orbit around it!
planet.animate({
  transform: { rotation: { z: '+=360' } }
}, 5000, 'linear');
```
