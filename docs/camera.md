# Camera (카메라) 가이드

안녕하세요! **Camera**는 월드 안의 객체들을 **원근감 있게 비춰주는 렌즈**와 같습니다. 레비아 엔진은 "초점 거리(Focal Length)"를 기반으로 하는 2.5D 투영 시스템을 사용하여, 실제 세상처럼 물체와의 거리에 따라 크기와 위치가 자연스럽게 변화하도록 돕습니다.

---

## 📸 1. 카메라의 핵심 속성

카메라의 투영 방식과 원근감의 깊이를 결정하는 핵심 속성입니다.

| 속성 | 타입 | 기본값 | 설명 |
| :--- | :--- | :--- | :--- |
| `focalLength` | `number` | `100` | 원근감의 깊이를 결정합니다. 이 거리에서 객체는 1:1 스케일로 그려집니다. |

-  **원근 효과**: 객체가 카메라에 가까워 질수록(`depth < focalLength`) 더 크게 보이고, 멀어질수록(`depth > focalLength`) 더 작게 보입니다.

---

## 🛠️ 2. 카메라 제어 메서드 (Methods)

화면 좌표 변환 및 심도 계산을 위한 전용 도구들입니다.

| 메서드 | 파라미터 | 반환값 | 설명 |
| :--- | :--- | :--- | :--- |
| `canvasToWorld` | `x, y, targetZ?` | `{x, y, z}` | 캔버스(픽셀) 좌표를 월드 좌표로 변환합니다. |
| `canvasToLocal` | `x, y, targetZ?` | `{x, y, z}` | 캔버스 좌표를 카메라 기준 로컬 좌표계로 변환합니다. UI 배치에 유용합니다. |
| `calcDepthRatio` | `targetZ, value` | `number` | 특정 심도(`targetZ`)에서 특정 크기(`value`)로 보이기 위한 원본 크기를 계산합니다. |

---

## 📐 3. 좌표계와 변환 (Coordinate System)

| 항목 | 명세 |
| :--- | :--- |
| **좌표 원점** | 화면 중앙이 `(0, 0, 0)`입니다. |
| **Z축 방향** | 카메라가 바라보는 **앞쪽이 플러스(+)**입니다. 숫자가 커질수록 멀어집니다. |
| **기본 배치** | 카메라 생성 시 `z` 좌표는 자동으로 `-(focalLength)`로 설정됩니다. |

---

## 💻 사용 예시

### 마우스 클릭 위치에 물체 생성하기
```typescript
// 카메라 생성 (name 속성으로 식별자 지정)
const camera = world.createCamera({ 
  attribute: { name: 'mainCamera', focalLength: 150 } 
});
world.camera = camera;

world.on('click', (obj, e) => {
  // 마우스로 찍은 화면 위치를 Z=0 인 월드 평면 좌표로 변환
  const worldPos = camera.canvasToWorld(e.clientX, e.clientY, 0);

  world.createRectangle({
    attribute: { name: 'spawnedBox' },
    transform: { position: worldPos }
  });
});
```

