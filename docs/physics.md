# Physics (물리) 가이드

안녕하세요! **Physics**는 월드 안의 객체들에게 **현실적인 무게감과 운동성**을 부여하는 엔진의 정수입니다. 레비아 엔진은 `Matter.js`를 기반으로 하며, 특히 2.5D 환경에서도 객체들 사이의 충돌과 상호작용이 자연스럽게 일어나도록 최적화되어 있습니다.

---

## ⚖️ 1. 물리 객체 설정 (Physics Modes)

모든 객체는 `attribute.physics` 속성을 통해 물리 사양을 결정합니다.

| 모드 | 설명 | 주요 활용 사례 |
| :--- | :--- | :--- |
| `'dynamic'` | 중력과 충돌의 영향을 모두 받으며 자유롭게 움직임. | 캐릭터, 떨어지는 장애물 등 |
| `'static'` | 고정되어 움직이지 않지만 충돌체 역할은 수행함. | 벽, 바닥, 고정 장애물 등 |
| `null` | 물리 시스템의 영향을 전혀 받지 않고 물체를 통과함. | 배경, UI, 파티클 등 |

---

## 📏 2. 충돌 범위와 여백 (Margin & Z-Isolation)

| 기능 | 설명 |
| :--- | :--- |
| **Style.margin** | 객체 외곽선으로부터의 물리적 여백(px). 이미지보다 더 넓거나 좁은 충돌체 생성 가능. |
| **Z-Isolation** | 같은 `z` 좌표에 있는 객체들끼리만 부딪히도록 자동 레이어 분리. |

---

## 🛠️ 3. 물리 제어 메서드 (Methods)

| 메서드 | 파라미터 | 설명 |
| :--- | :--- | :--- |
| `applyForce` | `force: {x?, y?}` | 객체 중심에 특정 방향으로 힘을 가함. 질량에 따라 가속도 결정. |
| `setVelocity` | `velocity: {x?, y?}` | 현재 속도를 무시하고 즉시 새로운 속도로 설정. |
| `setAngularVelocity` | `angularVelocity` | 회전 속도를 즉시 설정 (라디안/step). |
| `applyTorque` | `torque` | 회전하는 힘(토크)을 가함. |

---

## ⚙️ 4. 세부 물리 속성 (Physics Attributes)

| 속성 | 타입 / 기본값 | 설명 |
| :--- | :--- | :--- |
| `density` | `number` (0.001) | 밀도. 크기가 같아도 이 값이 크면 더 무겁게 동작함. |
| `friction` | `number` (0 ~ 1) | 면 사이의 마찰력. |
| `frictionAir` | `number` (0.01) | 공기 저항. 높을수록 속도가 빨리 줄어듦. |
| `restitution` | `number` (0 ~ 1) | 반발 계수. 1에 가까울수록 탱탱공처럼 튕김. |
| `fixedRotation` | `boolean` (false) | `true` 시 충돌해도 객체가 회전하지 않고 수직 유지. |
| `gravityScale` | `number` (1.0) | 개별 중력 배율. 0이면 무중력, 음수면 하늘로 솟구침. |

---

## 💻 사용 예시

### 하늘에서 떨어지는 상자 만들기
```typescript
const box = world.createRectangle({
  attribute: {
    name: 'fallingBox', // 고유 식별을 위해 name 사용
    physics: 'dynamic', 
    restitution: 0.5,   
    gravityScale: 1.2   
  },
  style: {
    width: 60, height: 60,
    margin: '5'         
  }
});

// 클릭 시 위로 튀어 오르게 하기
box.on('click', () => {
  box.setVelocity({ y: -15 }).applyTorque(5); // 메서드 체이닝
});
```

