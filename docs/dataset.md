# Dataset Guide

**Dataset** is a smart storage where developers can freely store their **own custom data** on objects. The leviar engine emits events whenever these values change, supporting an elaborate system that automatically updates the screen according to the data flow.

---

## 📦 1. Data Storage

All objects manage data through the `dataset` attribute.

| Attribute | Type | Description |
| :--- | :--- | :--- |
| `dataset` | `Record<string, any>` | Stores free key-value pairs. (strings, numbers, booleans, objects, etc.) |

-  **Detection System (Proxy)**: The `dataset` is wrapped in a special object (Proxy), so the engine immediately detects any value assignment and processes events.

---

## 🔔 2. Data Change Detection (datamodified)

Whenever data changes, the object triggers a `datamodified` event.

| Event Name | Arguments | Description |
| :--- | :--- | :--- |
| `datamodified` | `key, value, prev` | Occurs when the value of a specific key changes. |

---

## 🏃 3. Animation Integration

Numeric data within the `dataset` can be **smoothly changed in floating-point units** through the `animate()` method.

-  💡 **Main Use Cases**: Gradually decreasing a health bar value, smoothly increasing score text, calculating skill cooldowns, etc.

---

## 💻 Usage Example

### Creating a monster that changes color based on health
```typescript
const monster = world.createImage({
  attribute: { name: 'monster_01' }, // Using name for unique identification
  dataset: { hp: 100, maxHp: 100 } // Setting initial data
});

// Reacting in real-time when data changes
monster.on('datamodified', (key, val, prev) => {
  if (key === 'hp') {
    console.log(`HP changed: ${prev} -> ${val}`);
    
    // Highlight the object in red if health drops below 30%
    if (val <= monster.dataset.maxHp * 0.3) {
      monster.style.outlineColor = '#ff0000';
      monster.style.outlineWidth = 5;
    }
  }
});

// Execute an animation to gradually decrease health
monster.animate({
  dataset: { hp: 10 } // Smoothly decreases from 100 to 10
}, 1000, 'easeOutCubic');
```
