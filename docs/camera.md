# Camera Guide

Hello! **Camera** is like a **lens that projects objects in the world with perspective**. The leviar engine uses a 2.5D projection system based on "Focal Length", which helps the size and position of objects change naturally according to their distance, just like in the real world.

---

## 📸 1. Core Attributes of Camera

These are the core attributes that determine the projection method and the depth of perspective.

| Attribute | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `focalLength` | `number` | `100` | Determines the depth of perspective. Objects at this distance are drawn at a 1:1 scale. |

-  **Perspective Effect**: As an object gets closer to the camera (`depth < focalLength`), it appears larger, and as it gets further away (`depth > focalLength`), it appears smaller.

---

## 🛠️ 2. Camera Control Methods

These are dedicated tools for screen coordinate transformation and depth calculation.

| Method | Parameters | Returns | Description |
| :--- | :--- | :--- | :--- |
| `canvasToWorld` | `x, y, targetZ?` | `{x, y, z}` | Converts canvas (pixel) coordinates to world coordinates. |
| `canvasToLocal` | `x, y, targetZ?` | `{x, y, z}` | Converts canvas coordinates to the camera's local coordinate system. Useful for UI placement. |
| `calcDepthRatio` | `targetZ, value` | `number` | Calculates the original size required to appear as a specific size (`value`) at a specific depth (`targetZ`). |

---

## 📐 3. Coordinate System and Transformation

| Item | Specification |
| :--- | :--- |
| **Coordinate Origin** | The center of the screen is `(0, 0, 0)`. |
| **Z-axis Direction** | **Forward** direction the camera faces is positive (+). The larger the number, the farther it is. |
| **Default Placement** | Upon camera creation, the `z` coordinate is automatically set to `-(focalLength)`. |

---

## 💻 Usage Example

### Creating an object at the mouse click location
```typescript
// Create camera (specify identifier with name attribute)
const camera = world.createCamera({ 
  attribute: { name: 'mainCamera', focalLength: 150 } 
});
world.camera = camera;

world.on('click', (obj, e) => {
  // Convert clicked screen position to world plane coordinates at Z=0
  const worldPos = camera.canvasToWorld(e.clientX, e.clientY, 0);

  world.createRectangle({
    attribute: { name: 'spawnedBox' },
    transform: { position: worldPos }
  });
});
```
