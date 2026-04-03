# Animation (애니메이션) 가이드

안녕하세요! **Animation**은 레비아 엔진의 모든 시각적 변화를 **부드럽고 생동감 있게** 연결해 주는 핵심 엔진입니다. 단순히 수치를 바꾸는 것을 넘어, 물리 시스템 및 데이터셋과 연동하여 풍부한 연출을 가능하게 합니다.

---

## 🏃 1. 기본 사용법 (animate)

모든 객체는 `animate()` 메서드를 호출하여 애니메이션을 시작할 수 있습니다.

#### `animate(target, duration, easing)`

| 파라미터 | 타입 | 기본값 | 설명 |
| :--- | :--- | :--- | :--- |
| `target` | `AnimateTarget` | - | 변경하려는 속성(`style`, `transform`, `dataset`)의 목표값들입니다. |
| `duration` | `number` | - | 애니메이션이 지속될 시간(ms)입니다. |
| `easing` | `EasingType` | `'linear'` | 애니메이션 가속도 조절 함수 이름입니다. |

- **반환값**: 중단하거나 상태를 확인할 수 있는 전용 `Animation` 객체를 반환합니다.

### ➕ 상대 연산자 (Relative Operators)
목표값을 현재 값 기준으로 상대적으로 설정할 수 있는 4가지 연산자를 지원합니다.

| 연산자 | 예시 | 설명 |
| :--- | :--- | :--- |
| `+=` | `'+=100'` | 현재 값에 100을 더함 |
| `-=` | `'-=50'` | 현재 값에서 50을 뺌 |
| `*=` | `'*=2'` | 현재 값의 2배로 만듦 |
| `/=` | `'/=2'` | 현재 값의 절반으로 줄임 |

---

## 📋 2. 애니메이션 이징(Easing) 목록 (34종)

레비아 엔진은 수치의 변화를 정교하게 제어할 수 있는 34가지 표준 이징 함수를 제공합니다.

| 분류 | 함수 목록 |
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

## 🔔 3. 생명주기 이벤트 (Events)

| 이벤트 명 | 시점 | 인자(Arguments) |
| :--- | :--- | :--- |
| `start` | 애니메이션 시작 시 | - |
| `update` | 매 프레임 수치 변화 시 | `state: { progress: number, [key: string]: any }` |
| `end` | 종료(목표치 도달) 시 | - |
| `pause` | 일시 정지 시 | - |
| `resume` | 다시 시작 시 | - |
| `stop` | 강제 중단(`anim.stop()`) 시 | - |

---

## 💻 사용 예시

### 회전하며 서서히 사라지는 상자 만들기
```typescript
const box = world.createRectangle({
  style: { width: 100, height: 100, color: '#f1c40f' }
});

const anim = box.animate({
  style: { opacity: 0 },
  transform: { rotation: { z: '+=360' } }, // 360도 회전
  dataset: { score: 100 }               // 유저 데이터도 부드럽게 증가 가능
}, 2000, 'easeInOutBack');

// 애니메이션이 끝나면 객체 삭제
anim.on('end', () => {
  box.remove();
});

// 매 프레임 진행률 콘솔 출력
anim.on('update', (state) => {
  console.log(`진행도: ${Math.floor(state.progress * 100)}%`);
});
```

