# Attribute Guide

**Attribute** is a dataset that defines an object's **identification information and physical characteristics**. The leviar engine manages the basic specifications of all objects through these attributes.

---

## 📋 1. Identification and Classification (Identity)
The most basic information used to distinguish and select objects.

| Attribute | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | A unique identifier for the object managed internally by the system. A UUID is automatically assigned upon creation, and **users cannot directly specify or modify it.** |
| `type` | `string` | Indicates the type of object. (`image`, `video`, `rectangle`, `ellipse`, `text`, `sprite`, `particle`, `camera`) |
| `name` | `string` | The name of the object defined by the user. **It can be duplicated with other objects' names**, and can be freely used for logical classification or grouping. If you want to uniquely identify a specific object, assign and manage a unique name yourself. (Searchable via `[attr-name="hero"]` format) |
| `className` | `string` | A list of classes assigned to the object. Multiple classes can be added separated by spaces, and are used for styling or group selection. (Searchable via `.active` format) |

---

## 📋 2. Physical Properties (Physics)
Physical specifications applied to dynamic (`dynamic`) or static (`static`) objects where the `physics` attribute is set.

| Attribute | Type | Description |
| :--- | :--- | :--- |
| `physics` | `'dynamic' \| 'static' \| null` | Determines whether to apply the physics system. `dynamic` is affected by collisions and gravity, while `static` is a fixed object. |
| `density` | `number` | The density of the object. Multiplied by the area to determine its `mass`. |
| `friction` | `number` (0 ~ 1) | The coefficient of friction when in contact with other objects. (0: slippery, 1: stiff) |
| `frictionAir` | `number` | The air resistance coefficient. Determines how much velocity decreases every frame. |
| `restitution` | `number` (0 ~ 1) | The coefficient of restitution (bounciness). (0: does not bounce, 1: perfectly elastic collision) |
| `fixedRotation` | `boolean` | If set to `true`, the object will not rotate and will stay upright even if a collision occurs. |
| `gravityScale` | `number` | A multiplier for gravity applied only to this object. (0: zero gravity) |

---

## 📋 3. Collision Filter
A bitmask system that determines whether objects will collide with each other or not.

| Attribute | Type | Description |
| :--- | :--- | :--- |
| `collisionGroup` | `number` | A special collision group number. If it is the same negative number, they do not collide with each other, and if it is the same positive number, they collide unconditionally. |
| `collisionMask` | `number` | A 32-bit integer that determines the category of objects this object will collide with. |
| `collisionCategory` | `number` | A 32-bit integer representing the category this object belongs to. |

---

## 📋 4. Special Attributes
Data that exists only on specific object types.

| Attribute | Type | Applied To | Description |
| :--- | :--- | :--- | :--- |
| `focalLength` | `number` | Camera | The focal length of the camera. (Default: `100`) It serves as the basis for perspective calculations. |
| `src` | `string` | Image, Video, Sprite, Particle | The path or key value of the source resource to use. Upon change, playback position is initialized and paused for Video/Sprite. |
| `volume` | `number` (0 ~ 1) | Video | The volume level of the video. |
| `playbackRate` | `number` | Video, Sprite | The playback speed multiplier. `1.0` is normal speed. |
| `currentTime` | `number` | Video, Sprite | The current playback position (in seconds or frames). Changing the value instantly moves to that position. |
