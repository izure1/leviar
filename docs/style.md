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
| `margin` | `string` | 물리 충돌 영역의 추가 여백. CSS 단축 표기법 지원. |

---

## 📋 2. 색상 및 테두리 (Appearance)

| 속성 | 타입 | 설명 |
| :--- | :--- | :--- |
| `color` | `string` | 채우기 색상 (HEX, RGB 등 지원). |
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
| `gradient` | `string` | 그라디언트 정보 (예: `90deg, #ff0000 0%, #0000ff 100%`). |
| `gradientType` | `enum` | 그라디언트 유형 (`linear`, `circular`). |

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

