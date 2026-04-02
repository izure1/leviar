# Event (이벤트) 가이드

안녕하세요! **Event**는 월드 안에서 일어나는 **다양한 사건**들을 알려주는 신호등입니다. 레비아 엔진은 객체의 상태 변화나 사용자 상호작용을 실시간으로 감지할 수 있도록 풍부한 이벤트를 제공합니다.

---

## 📋 1. 객체 공용 이벤트 (LveObject Events)

모든 객체(`LveObject`)에서 발생하는 공통적인 신호들입니다. `obj.on('이벤트명', (arg1, arg2...) => { ... })` 형식을 통해 구독할 수 있습니다.

### 🖱️ 마우스 상호작용 (MouseEvents)
사용자가 객체와 마우스로 상호작용할 때 발생하며, 브라우저 표준 `MouseEvent` 객체를 인자로 전달합니다.
-  **click(e: MouseEvent)**: 객체를 클릭했을 때 발생합니다.
-  **dblclick(e: MouseEvent)**: 객체를 더블 클릭했을 때 발생합니다.
-  **mousedown(e: MouseEvent) / mouseup(e: MouseEvent)**: 마우스 버튼을 누르거나 뗄 때 발생합니다.
-  **mouseover(e: MouseEvent) / mouseout(e: MouseEvent)**: 마우스 커서가 객체 영역으로 진입하거나 벗어날 때 발생합니다.
-  **mousemove(e: MouseEvent)**: 마우스 커서가 객체 위에서 움직일 때 발생합니다.
-  **contextmenu(e: MouseEvent)**: 객체 위에서 우측 클릭을 했을 때 발생합니다.

### ⚙️ 상태 및 속성 변경 (Modified)
객체의 내부 데이터가 변할 때 발생하며, `(key: string, newValue: any, oldValue: any)` 순서로 인자를 전달합니다.
-  **cssmodified**: 스타일(`style`) 속성이 변경되었을 때 발생합니다.
-  **attrmodified**: 기본 속성(`attribute`)이 변경되었을 때 발생합니다.
-  **datamodified**: 보관소(`dataset`) 내부의 사용자 데이터가 변경되었을 때 발생합니다.
-  **positionmodified / rotationmodified / scalemodified**: 위치(x, y, z), 회전(x, y, z), 크기(x, y, z)가 변경되었을 때 각각 발생합니다.
-  **pivotmodified**: 변환 중심점(Pivot) 좌표가 변경되었을 때 발생합니다.

### 🎬 재생 관련 (Playback)
비디오, 스프라이트, 파티클 등 재생 기능이 있는 객체에서 발생합니다. 별도의 인자는 전달하지 않습니다.
-  **play**: 재생이 시작되거나 재개되었을 때 발생합니다.
-  **pause**: 재생이 일시정지되었을 때 발생합니다.
-  **ended**: 재생이 완전히 도달하여 종료되었을 때 발생합니다.
-  **repeat**: 루프(반복) 재생 시 한 사이클이 끝날 때마다 발생합니다.

---

## 📋 2. 애니메이션 및 트랜지션 (Animation & Transition)

`obj.animate()`나 `fadeIn()`, `fadeOut()` 효과가 진행되는 동안 발생하는 신호입니다.

-  **start**: 효과가 공식적으로 시작될 때 발생합니다.
   - 💡 `fadeIn()`은 이 시점에 `display: block`으로 전환됩니다.
-  **update(state: Record<string, any>)**: 진행되는 동안 매 프레임마다 발생합니다. `state` 객체에는 현재 시점의 애니메이션 진행 정보가 담겨 있습니다.
-  **end**: 목표치에 무사히 도달하여 효과가 끝났을 때 발생합니다.
   - 💡 `fadeOut()`은 이 시점에 `display: none`으로 전환됩니다.
-  **pause / resume**: 애니메이션이 일시 중지되거나 다시 재개될 때 발생합니다.
-  **stop**: `anim.stop()` 메서드로 인해 애니메이션이 강제 종료되었을 때 발생합니다.

---

## 📋 3. 월드 이벤트 (World Events)

`world` 객체 자체가 관리하는 전체적인 생명주기와 이벤트입니다.

-  **update(timestamp: number)**: 월드의 심장이 뛸 때마다(매 프레임) 발생합니다. 인자로 현재의 고해상도 시간(ms)을 전달합니다.
-  **click / mousedown / ... (obj: LveObject | undefined, e: MouseEvent)**
   월드 전체에서 일어나는 마우스 이벤트입니다.
   - 첫 번째 인자(`obj`): 클릭된 위치에 객체가 있다면 해당 객체 인스턴스를, 없다면 `undefined`를 반환합니다.
   - 두 번째 인자(`e`): 브라우저 표준 `MouseEvent` 객체입니다.

---

## 💡 이벤트 전파 제어 (Bubbling)

레비아 엔진의 이벤트 시스템은 객체에서 발생한 이벤트가 월드로 전파되는 구조를 가집니다.
```typescript
box.on('click', (e) => {
  // 나만 이벤트를 처리하고, world.on('click', ...) 까지 가지 않게 막으려면:
  e.stopPropagation() 
})
```
이렇게 전파를 막으면 이미 클릭된 객체 상위의 다른 객체나 월드 전체 핸들러가 동시에 작동하는 것을 방지할 수 있습니다.
