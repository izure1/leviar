# Physics (물리) 가이드

안녕하세요! **Physics**는 월드 안의 객체들에게 **현실적인 무게감과 운동성**을 부여하는 엔진의 정수입니다. 레비아 엔진은 `Matter.js`를 기반으로 하며, 특히 2.5D 환경에서도 객체들 사이의 충돌과 상호작용이 자연스럽게 일어나도록 최적화되어 있습니다.

---

## ⚖️ 1. 물리 객체 설정 (Physics Modes)

모든 객체는 `attribute.physics` 속성을 통해 물리 사양을 결정합니다.

-  **'dynamic': (동적 객체)**
   중력의 영향을 받으며, 다른 물체와 충돌하면 튕겨 나가거나 밀려납니다. 캐릭터, 떨어지는 블록 등에 사용하세요.
-  **'static': (정적 객체)**
   자리에 고정되어 움직이지 않습니다. 하지만 동적 객체가 부딪히면 튕겨 나가게 만드는 벽, 바닥, 장애물 역할을 수행합니다.
-  **null: (비물리 객체)**
   물리 시스템의 영향을 전혀 받지 않으며, 다른 물체를 통과합니다. 배경이나 UI 등에 사용하세요.

---

## 📏 2. 충돌 범위와 여백 (Margin & Z-Isolation)

레비아 엔진은 렌더링되는 이미지 크기보다 더 넓거나 좁은 물리 충돌 범위를 설정할 수 있는 독특한 기능을 제공합니다.

-  **Style.margin**: 객체의 외곽선으로부터의 물리적 여백(px)입니다.
   - 예: `margin: '10'`으로 설정하면 객체 주변에 10픽셀의 투명한 충돌 막이 형성되어, 실제 이미지가 닿기 전에 먼저 충돌이 일어납니다.
-  **Z-Axis Isolation**: 객체의 `transform.position.z` 값에 따라 충돌 레이어가 자동으로 분리됩니다.
   - 💡 같은 Z축에 있는 객체들끼리만 부딪히고, 멀리 떨어져 있는 객체들은 서로 통과합니다. 이는 복잡한 2.5D 월드에서 충돌 관리를 매우 직관적으로 만들어 줍니다.

---

## 🛠️ 3. 물리 제어 메서드 (Methods)

동적 객체를 직접 움직이거나 힘을 가하는 메서드들입니다.

-  **applyForce(force: { x?: number, y?: number }): this**
   객체의 중심에 특정 방향으로 힘을 가합니다. 질량(`density` × 면적)에 따라 가속도가 결정됩니다.
-  **setVelocity(velocity: { x?: number, y?: number }): this**
   현재 속도를 무시하고 즉시 새로운 속도로 설정합니다. 인자를 생략하면 현재 속도를 유지합니다. (단위: px/step)
-  **setAngularVelocity(angularVelocity: number): this**
   회전 속도를 즉시 설정합니다. (단위: 라디안/step)
-  **applyTorque(torque: number): this**
   회전하는 힘(토크)을 가합니다. 양수면 시계 방향, 음수면 반시계 방향으로 회전시키려 시도합니다.

---

## ⚙️ 4. 세부 물리 속성 (Physics Attributes)

-  **density: number**: 밀도입니다. (기본값: `0.001`) 객체의 크기가 같아도 이 값이 크면 더 무겁게 동작합니다.
-  **friction: number (0 ~ 1)**: 면 사이의 마찰력입니다.
-  **frictionAir: number**: 공기 저항입니다. (기본값: `0.01`) 높을수록 공중에 떠 있을 때 속도가 빨리 줄어듭니다.
-  **restitution: number (0 ~ 1)**: 반발 계수입니다. 1에 가까울수록 탱탱공처럼 강력하게 튕깁니다.
-  **fixedRotation: boolean**: `true`로 설정하면 충돌 시에도 객체가 빙글빙글 돌지 않고 수직을 유지합니다.
-  **gravityScale: number**: 개별 중력 배율입니다. 0이면 공중에 떠 오르고, 음수면 하늘로 솟구칩니다.

---

## 💻 사용 예시

### 하늘에서 떨어지는 상자 만들기
```typescript
const box = world.createRectangle({
  attribute: {
    id: 'fallingBox',
    physics: 'dynamic', // 동적 물리 적용
    restitution: 0.5,   // 살짝 튕기게
    gravityScale: 1.2   // 남들보다 조금 더 빠르게
  },
  style: {
    width: 60, height: 60,
    margin: '5'         // 이미지보다 5px 더 넓은 충돌 범위
  }
})

// 클릭 시 위로 튀어 오르게 하기
box.on('click', () => {
  box.setVelocity({ y: -15 }).applyTorque(5) // 메서드 체이닝 활용
})
```
