# Style (스타일) 가이드

**Style**은 객체의 **생김새와 시각적 디자인**을 결정하는 핵심 사양서입니다. 레비아 엔진은 CSS와 유사한 직관적인 속성들을 제공하여, 개발자가 웹 디자인하듯 자유롭게 화면을 구성할 수 있도록 돕습니다.

---

## 📋 1. 기본 크기 및 표시 제어 (Layout)

| 속성 | 타입 | 설명 |
| :--- | :--- | :--- |
| `width` / `height` | `number` | 가로/세로 크기(px). 한쪽 생략 시 비율 유지, 둘 다 생략 시 원본 크기. |
| `minWidth` / `minHeight` | `number` | 최소 가로/세로 크기(px). |
| `maxWidth` / `maxHeight` | `number` | 최대 가로/세로 크기(px). |
| `display` | `'block' \| 'none'` | 화면 출력 여부. `'none'` 시 화면에서 사라지고 물리 충돌에서도 제외됨. |
| `opacity` | `number` (0 ~ 1.0) | 불투명도. (0: 투명, 1: 불투명) |
| `zIndex` | `number` | 레이어 순서. 높을수록 앞에 그려짐. (기본값: 0) |
| `pointerEvents` | `boolean` | 마우스 인터랙션 수신 여부. `false` 시 이벤트를 통과시킴. |
| `cursor` | `CssCursor` | 마우스 오버 시 표시할 커서 형태. CSS 표준 cursor 값 지원. |
| `margin` | `string` | 물리 충돌 영역의 추가 여백. CSS 단축 표기법 지원. |

---

## 📋 2. 색상 및 테두리 (Appearance)

| 속성 | 타입 | 설명 |
| :--- | :--- | :--- |
| `background` | `string` | 배경. 단색 (HEX, RGB), 이미지(`url('key')`), 그라디언트(`linear-gradient(...)`, `radial-gradient(...)`) 중 1가지 형태. (Rectangle, Ellipse 전용) |
| `backgroundSize` | `'cover' \| 'contain' \| 'auto'` | 배경 이미지를 채우는 방식. (기본값: `'auto'`) |
| `color` | `string` | 텍스트 전용 채우기 색상. (Text 전용) |
| `blur` | `number` | 가우시안 블러 강도. |
| `borderColor` | `string` | 테두리 색상. |
| `borderWidth` | `number` | 테두리 두께 (내부 방향). |
| `outlineColor` | `string` | 외곽선 색상. |
| `outlineWidth` | `number` | 외곽선 두께 (외부 방향). |
| `borderRadius` | `string \| number` | 모서리 둥글기 (50%, "10 20" 등 지원). |

---

## 📋 3. 타이포그래피 (Text 전용)

| 속성 | 타입 | 설명 |
| :--- | :--- | :--- |
| `fontSize` | `number` | 글자 크기 (px). |
| `fontFamily` | `string` | 서체 이름 (기본값: `sans-serif`). |
| `fontWeight` | `string` | 글자 굵기 (`normal`, `bold` 등). |
| `fontStyle` | `string` | 글자 기울임 (`normal`, `italic`). |
| `lineHeight` | `number` | 줄 간격 배율 (기본값: `1.0`). |
| `letterSpacing` | `number` | 글자 사이의 간격 (px). |
| `textAlign` | `enum` | 글자 정렬 (`left`, `center`, `right`). |

---

## 📋 4. 그림자 및 그라디언트 (FX)

| 속성 | 타입 | 설명 |
| :--- | :--- | :--- |
| `boxShadowColor` | `string` | 박스 그림자 색상. (글자는 `textShadowColor`) |
| `boxShadowBlur` | `number` | 그림자 흐림 정도. |
| `boxShadowSpread` | `number` | 그림자 확장 크기. |
| `boxShadowOffset` | `x, y: number` | 그림자 거리 (`boxShadowOffsetX`, `boxShadowOffsetY`). |
| `boxShadowOffset` | `x, y: number` | 그림자 거리 (`boxShadowOffsetX`, `boxShadowOffsetY`). |

---

## 📋 5. 합성 모드 (Blend Mode)

| 속성 | 타입 | 설명 |
| :--- | :--- | :--- |
| `blendMode` | `string` | 16가지 표준 합성법 지원 (`multiply`, `screen`, `overlay` 등). |

---

## 💡 주요 속성 상세 명세 (Shorthand)

### Margin (여백) 적용 순서
- `1개 (10)`: [상, 하, 좌, 우] 모두 적용
- `2개 (10 20)`: [상, 하] 10, [좌, 우] 20
- `3개 (10 20 30)`: [상] 10, [좌, 우] 20, [하] 30
- `4개 (10 20 30 40)`: [상] 10, [우] 20, [하] 30, [좌] 40 (시계 방향)

### BorderRadius (둥글기)
- **비정형 모서리**: `'10 20 30 40'` 순서로 [좌상, 우상, 우하, 좌하] 적용.
- **백분율(%)**: `'50%'`로 설정하면 원형으로 적용.

### Background (배경)
`style.background` 속성은 세 가지 용도로 사용할 수 있습니다. `Rectangle` 및 `Ellipse` 객체에서만 동작합니다.
1. **단색 채우기**: `rgb(255, 0, 0)`, `#ff0000`, `hsl(...)` 등의 색상 코드
2. **이미지 텍스처**: `url('assetKey')` 형식으로 애셋 매니저에서 불러온 이미지 키를 지정.
   - 텍스처 사용 시 `backgroundSize`(`'cover'`, `'contain'`, `'auto'`) 속성으로 이미지 비율 처리를 설정할 수 있습니다.
3. **그라디언트**: CSS 문법인 `linear-gradient(...)` 또는 `radial-gradient(...)` 사용.

> **주의**: 텍스트의 색상을 바꿀 때는 `style.color`를 사용해야 합니다.

---

## 💡 Cursor (마우스 커서)

`style.cursor`를 지정하면, 해당 객체 위에 마우스가 올라갔을 때 캔버스 커서 모양이 변경됩니다.
미지정 시 브라우저 기본 동작을 따릅니다.

```typescript
const btn = world.createRectangle({
  style: { cursor: 'pointer' }
})
```

### 지원 값 (`CssCursor`)

| 값 | 설명 |
| :--- | :--- |
| `auto` | 브라우저 자동 판단 |
| `default` | 기본 화살표 |
| `none` | 커서 숨김 |
| `pointer` | 손가락 (링크/버튼) |
| `grab` / `grabbing` | 드래그 가능 / 드래그 중 |
| `move` | 이동 가능 |
| `text` | 텍스트 선택 |
| `crosshair` | 십자선 |
| `wait` | 대기 중 (스피너) |
| `progress` | 처리 중 (화살표 + 스피너) |
| `not-allowed` | 금지 |
| `no-drop` | 드롭 불가 |
| `copy` | 복사 |
| `alias` | 바로가기 |
| `context-menu` | 컨텍스트 메뉴 |
| `help` | 도움말 |
| `cell` | 표 셀 선택 |
| `vertical-text` | 세로 텍스트 |
| `all-scroll` | 전방향 스크롤 |
| `col-resize` / `row-resize` | 열/행 크기 조절 |
| `n/e/s/w-resize` | 단방향 크기 조절 |
| `ne/nw/se/sw-resize` | 대각 크기 조절 |
| `ew/ns-resize` | 좌우/상하 크기 조절 |
| `nesw/nwse-resize` | 대각 양방향 크기 조절 |
| `zoom-in` / `zoom-out` | 확대 / 축소 |

> **우선순위**: z축 기준 가장 앞에 위치한 객체의 `cursor` 값이 적용됩니다.
> `pointerEvents: false`인 객체는 hit-test에서 제외되므로 cursor도 적용되지 않습니다.


