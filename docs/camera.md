# Camera (카메라) 가이드

안녕하세요! **Camera**는 월드 안의 객체들을 **원근감 있게 비춰주는 렌즈**와 같습니다. 레비아 엔진은 "초점 거리(Focal Length)"를 기반으로 하는 2.5D 투영 시스템을 사용하여, 실제 세상처럼 물체와의 거리에 따라 크기와 위치가 자연스럽게 변화하도록 돕습니다.

---

## 📸 1. 카메라의 핵심 원리 (Focal Length)

레비아 엔진의 카메라는 `attribute.focalLength` 속성을 통해 원근감의 깊이를 결정합니다.

-  **focalLength(초점 거리)**: 기본값은 `100`입니다. 
-  **1:1 스케일 렌너링**: 카메라와 객체 사이의 실제 Z축 거리값(depth)이 `focalLength`와 정확히 일치할 때, 객체는 화면에 실제 스타일 크기(width, height) 그대로 1:1 비율로 그려집니다.
-  **원근 효과**: 객체가 카메라에 가까워질수록(depth < focalLength) 더 크게 보이고, 멀어질수록(depth > focalLength) 더 작게 보입니다.

---

## 🛠️ 2. 카메라 제어 메서드 (Methods)

화면상의 2D 좌표를 3D 월드 공간으로 변환하거나, 깊이에 따른 크기 비율을 계산하는 핵심 도구들입니다.

-  **canvasToWorld(x: number, y: number, targetZ?: number): { x: number, y: number, z: number }**
   마우스 클릭 등 캔버스의 x, y 좌표(좌측 상단 0,0 기준)를 실제 월드 좌표로 변환합니다.
   - `targetZ`: 투영하고자 하는 월드의 대상 심도입니다. 생략 시 카메라의 초점이 맺히는 심도(`cameraZ + focalLength`)로 자동 계산됩니다.
   - **반환값**: 계산된 `{ x, y, z }` 월드 좌표 객체를 반환합니다.

-  **canvasToLocal(x: number, y: number, targetZ?: number): { x: number, y: number, z: number }**
   캔버스 좌표를 카메라 기준의 **로컬 좌표계**로 변환합니다.
   - 💡 카메라에 딱 붙어서 따라다니는 UI 요소를 배치할 때, 결과값을 `camera.addChild()` 한 자식 객체의 위치값으로 직접 사용할 수 있습니다.

-  **calcDepthRatio(targetZ: number, value: number): number**
   특정한 Z축 깊이(`targetZ`)에서 특정 픽셀 크기(`value`)로 똑같이 보이게 하려면, 실제 객체의 원본 크기를 얼마로 설정해야 하는지 수학적으로 계산해 줍니다. 고정된 크기의 UI를 월드 공간에 배치할 때 매우 유용합니다.

---

## 📐 3. 좌표계와 변환 (Coordinate System)

레비아 엔진은 WebGL 표준 좌표계를 따르지만, 사용자의 편의를 위해 내부적으로 좌표를 보정합니다.

-  **좌표 원점**: 화면 중앙이 `(0, 0, 0)`입니다.
-  **Z축 방향**: 카메라가 바라보는 **앞쪽이 플러스(+)** 방향입니다. 숫자가 커질수록 카메라에서 멀어지며 물체는 작아집니다.
-  **기본 배치**: 카메라 생성 시 `transform.position.z`는 자동으로 `-(focalLength)`로 설정되어, 월드 중심(`(0,0,0)`)에 있는 물체들이 1:1 크기로 선명하게 보이도록 맞춰집니다.

---

## 💻 사용 예시

### 마우스 클릭 위치에 물체 생성하기
```typescript
const camera = world.createCamera({ attribute: { focalLength: 150 } });
world.camera = camera;

world.on('click', (obj, e) => {
  // 마우스로 찍은 화면 위치를 Z=0 인 월드 평면 좌표로 변환
  const worldPos = camera.canvasToWorld(e.clientX, e.clientY, 0);

  world.createRectangle({
    transform: { position: worldPos }
  });
});
```
