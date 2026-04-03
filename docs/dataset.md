# Dataset (데이터셋) 가이드

안녕하세요! **Dataset**은 개발자가 객체에 **나만의 커스텀 데이터**를 자유롭게 보관할 수 있는 스마트한 저장소입니다. 레비아 엔진은 이 값이 변할 때마다 이벤트를 방출하여, 데이터 흐름에 따라 화면을 자동으로 갱신하는 정교한 시스템을 지원합니다.

---

## 📦 1. 데이터 보관 (Storage)

모든 객체는 `dataset` 속성을 통해 데이터를 관리합니다.

| 속성 | 타입 | 설명 |
| :--- | :--- | :--- |
| `dataset` | `Record<string, any>` | 자유로운 키-값 쌍을 저장합니다. (문자열, 숫자, 불리언, 객체 등) |

-  **감지 시스템 (Proxy)**: `dataset`은 특수 객체(Proxy)로 감싸져 있어, 값을 대입하는 즉시 엔진이 이를 감지하고 이벤트를 처리합니다.

---

## 🔔 2. 데이터 변경 감지 (datamodified)

데이터가 변할 때마다 객체는 `datamodified` 이벤트를 발생시킵니다.

| 이벤트 명 | 인자(Arguments) | 설명 |
| :--- | :--- | :--- |
| `datamodified` | `key, value, prev` | 특정 키의 값이 변경되었을 때 발생합니다. |

---

## 🏃 3. 애니메이션 연계 (Animation)

`dataset` 내부의 수치 데이터는 `animate()` 메서드를 통해 **부동 소수점 단위로 부드럽게** 변화시킬 수 있습니다.

-  💡 **주요 활용 사례**: 체력바 수치 서서히 줄이기, 점수 텍스트 부드럽게 올리기, 스킬 쿨타임 계산 등.

---

## 💻 사용 예시

### 체력 수치에 따라 색상이 변하는 몬스터 만들기
```typescript
const monster = world.createImage({
  attribute: { name: 'monster_01' }, // 고유 식별을 위해 name 사용
  dataset: { hp: 100, maxHp: 100 } // 초기 데이터 설정
});

// 데이터가 변할 때 실시간 반응
monster.on('datamodified', (key, val, prev) => {
  if (key === 'hp') {
    console.log(`체력 변경: ${prev} -> ${val}`);
    
    // 체력이 30% 이하로 떨어지면 물체를 붉게 강조
    if (val <= monster.dataset.maxHp * 0.3) {
      monster.style.outlineColor = '#ff0000';
      monster.style.outlineWidth = 5;
    }
  }
});

// 체력을 서서히 깎는 애니메이션 실행
monster.animate({
  dataset: { hp: 10 } // 100에서 10까지 부드럽게 감소
}, 1000, 'easeOutCubic');
```

