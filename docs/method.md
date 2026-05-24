# Method Guide

A **Method** is a **specific action** that an object can perform. The leviar engine provides powerful and intuitive methods that allow developers to control objects precisely through code.

---

## 📋 1. Object Common Methods

Core features that all objects (`LeviarObject`) can use in common.

### ✨ State and Visual Effects

#### `animate(target, duration, easing)`
Smoothly transitions object attributes to their target values.

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `target` | `AnimateTarget` | - | The attributes to change (`style`, `transform`, `dataset`) and their target values. `+=`, `-=` can be used. |
| `duration` | `number` | - | Animation duration (ms) |
| `easing` | `EasingType` | `'linear'` | Acceleration control function name |

- **Returns**: A controllable `Animation` object

#### `fadeIn(durationMs, easing)`
Makes the object gradually appear from 0 to 1 opacity.

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `durationMs` | `number` | - | Animation duration (ms) |
| `easing` | `EasingType` | - | Acceleration control function name |

- **How it works**: Immediately sets `style.display` to `'block'` and starts the opacity animation.
- **Returns**: A `FadeTransition` object

#### `fadeOut(durationMs, easing)`
Makes the object gradually disappear from 1 to 0 opacity.

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `durationMs` | `number` | - | Animation duration (ms) |
| `easing` | `EasingType` | - | Acceleration control function name |

- **How it works**: Changes `style.display` to `'none'` upon completion and excludes it from physics calculations.
- **Returns**: A `FadeTransition` object

#### `remove(options)`
Safely removes the object from the world and memory.

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `options.child` | `boolean` | `false` | If `true`, removes all child objects as well |
| `options.follower` | `boolean` | `false` | If `true`, removes objects following this object (`follow`) |

- **Returns**: `this` (Supports method chaining)

### 🏷️ Class and State Checks

#### `hasClass(classNames)` / `addClass(classNames)` / `removeClass(classNames)`
Manages the object's class list.

| Method | Parameter | Returns | Description |
| :--- | :--- | :--- | :--- |
| `hasClass` | `string` | `boolean` | Checks if a specific class is included (Supports space-separated multiple checks) |
| `addClass` | `string` | `this` | Adds a class (Ignores duplicates) |
| `removeClass` | `string` | `this` | Removes a class |

### ⛓️ Hierarchy

#### `addChild(child)` / `removeChild(child)` / `removeFromParent()`
Manages parent-child relationships between objects.

| Method | Parameter | Returns | Description |
| :--- | :--- | :--- | :--- |
| `addChild` | `LeviarObject` | `this` | Adds as a child. Inherits the parent's transform (`Matrix`). |
| `removeChild` | `LeviarObject` | `this` | Releases the specified child object. |
| `removeFromParent`| - | `this` | Becomes independent from the current parent. |

### 👣 Following

#### `follow(target, offset)`
Makes it follow another object in real-time at a certain distance.

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `target` | `LeviarObject` | - | The target object to follow |
| `offset` | `{x?, y?, z?}` | - | The distance offset from the target |

- **Returns**: `this`

#### `unfollow()` / `kick(follower)`
Releases the tracking relationship.

| Method | Parameter | Returns | Description |
| :--- | :--- | :--- | :--- |
| `unfollow` | - | `this` | Stops following the current target. |
| `kick` | `LeviarObject` | `this` | Disconnects from a specific object that is following this one. |

- **Getter**: `following` (The target I am following), `followers` (The list of objects following me)

### ⚖️ Physics Engine Control (Physics)
*These methods are only valid on objects where `attribute.physics` is set.*

| Method | Parameter | Description |
| :--- | :--- | :--- |
| `applyForce` | `force: {x?, y?}` | Applies force to the center of the object in a specific direction. |
| `setVelocity` | `velocity: {x?, y?}` | Ignores current velocity and instantly sets a new velocity. |
| `setAngularVelocity` | `angularVelocity: number` | Sets rotational velocity (radians/second). |
| `applyTorque` | `torque: number` | Applies a rotational force (torque). |

---

## 📋 2. Object Specific Methods

### 📸 Camera Only

| Method | Parameter | Returns | Description |
| :--- | :--- | :--- | :--- |
| `canvasToWorld` | `x, y, targetZ?` | `{x, y, z}` | Converts screen pixel coordinates to world coordinates. |
| `canvasToLocal` | `x, y, targetZ?` | `{x, y, z}` | Converts screen coordinates to the camera's local coordinate system. |
| `calcDepthRatio` | `targetZ, value` | `number` | Calculates the object size needed to appear at a specific pixel size at a specific depth. |

### 🎬 Playback Control (Video / Sprite / Particle)

| Method | Returns | Description |
| :--- | :--- | :--- |
| `play()` | `this` | Starts playback or unpauses. |
| `pause()` | `this` | Pauses playback. |
| `stop()` | `this` | Stops and resets playback (Video/Sprite goes to the beginning, Particle stops spawning). |

---

## 📋 3. World Methods

| Method | Parameter | Description |
| :--- | :--- | :--- |
| `create[Type]` | `options?` | Creates and registers new objects like `Image`, `Video`, `Rectangle`, etc. |
| `select` | `selector` | Complex search based on CSS selectors. (`.class`, `[attr-key=value]`, `[data-key=value]`) |
| `start()` / `stop()` | - | Starts/stops world rendering and physics simulation. |
