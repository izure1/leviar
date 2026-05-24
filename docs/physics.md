# Physics Guide

Hello! **Physics** is the essence of the engine that grants **realistic weight and momentum** to objects in the world. The leviar engine is based on `Matter.js` and is optimized to naturally handle collisions and interactions between objects, especially in a 2.5D environment.

---

## ⚖️ 1. Physics Modes

Every object determines its physics specifications through the `attribute.physics` attribute.

| Mode | Description | Main Use Cases |
| :--- | :--- | :--- |
| `'dynamic'` | Moves freely, affected by both gravity and collisions. | Characters, falling obstacles, etc. |
| `'static'` | Fixed and doesn't move, but acts as a collider. | Walls, floors, fixed obstacles, etc. |
| `null` | Unaffected by the physics system entirely and passes through objects. | Backgrounds, UI, particles, etc. |

---

## 📏 2. Collision Margin and Z-Isolation

| Feature | Description |
| :--- | :--- |
| **Style.margin** | Physical margin (px) from the object's outline. Can create colliders wider or narrower than the image. |
| **Z-Isolation** | Automatic layer separation so that only objects at the same `z` coordinate collide with each other. |

---

## 🛠️ 3. Physics Control Methods

| Method | Parameter | Description |
| :--- | :--- | :--- |
| `applyForce` | `force: {x?, y?}` | Applies force to the center of the object in a specific direction. Acceleration is determined by mass. |
| `setVelocity` | `velocity: {x?, y?}` | Ignores current velocity and instantly sets a new velocity. |
| `setAngularVelocity` | `angularVelocity` | Sets rotational velocity instantly (radians/step). |
| `applyTorque` | `torque` | Applies rotational force (torque). |

---

## ⚙️ 4. Detailed Physics Attributes

| Attribute | Type / Default | Description |
| :--- | :--- | :--- |
| `density` | `number` (0.001) | Density. Even with the same size, a higher value makes it act heavier. |
| `friction` | `number` (0 ~ 1) | Friction between surfaces. |
| `frictionAir` | `number` (0.01) | Air resistance. Higher value means velocity decreases faster. |
| `restitution` | `number` (0 ~ 1) | Bounciness (Coefficient of restitution). Closer to 1 bounces like a bouncy ball. |
| `fixedRotation` | `boolean` (false) | If `true`, the object stays upright and won't rotate even when colliding. |
| `gravityScale` | `number` (1.0) | Individual gravity multiplier. 0 means zero gravity, negative means it shoots upwards. |

---

## 💻 Usage Example

### Creating a box falling from the sky
```typescript
// Set gravity
world.gravity = { x: 0, y: -1 };

const box = world.createRectangle({
  attribute: {
    physics: 'dynamic',
    restitution: 0.5,
    gravityScale: 1.2,
  },
  style: {
    width: 60,
    height: 60,
    margin: '5'
  }
});

// Bounce up when clicked
box.on('click', () => {
  box.setVelocity({ y: -15 }).applyTorque(5); // Method chaining
});
```
