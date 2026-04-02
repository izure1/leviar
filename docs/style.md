# Style (스타일) 가이드

안녕하세요! **Style**은 객체의 **생김새와 시각적 디자인**을 결정하는 핵심 사양서입니다. 레비아 엔진은 CSS와 유사한 직관적인 속성들을 제공하여, 개발자가 웹 디자인하듯 자유롭게 화면을 구성할 수 있도록 돕습니다.

---

## 📋 1. 기본 크기 및 표시 제어 (Layout)
-  **width: number / height: number**
   객체의 가로와 세로 크기(px 단위)입니다. 한쪽만 입력하면 원본 비율에 맞춰 자동 계산되며, 둘 다 생략하면 원본 크기로 나타납니다.
-  **display: 'block' | 'none'**
   화면 출력 여부입니다. `'none'`이면 화면에서 사라지며, 물리 충돌 판정에서도 즉시 제외됩니다. (💡 `fadeIn/fadeOut` 메서드 사용 시 자동으로 전환됩니다.)
-  **opacity: number (0 ~ 1.0)**
   불투명도입니다. 0은 완전 투명, 1은 완전 불투명을 의미합니다.
-  **zIndex: number**
   레이어 순서입니다. 숫자가 높을수록 앞에 그려집니다. (기본값: 0)
-  **pointerEvents: boolean**
   마우스 인터랙션(클릭 등) 수신 여부입니다. `false`로 설정하면 이벤트가 통과되어 아래 객체가 클릭됩니다. (기본값: `true`)
-  **margin: string**
   물리 엔진이 인식하는 충돌 영역의 추가 여백입니다. "10 20"과 같은 CSS 단축 표기법을 지원합니다. (상세 내역 하단 참고)

---

## 📋 2. 색상 및 테두리 (Appearance)
-  **color: string**
   객체의 채우기 색상입니다. HEX(`#ff0000`), RGB(`rgb(255, 0, 0)`) 등을 지원합니다.
-  **blur: number**
   가우시안 블러 효과의 강도입니다. 수치가 높을수록 더 흐릿하게 보입니다.
-  **borderColor: string / borderWidth: number**
   테두리의 색상과 두께를 설정합니다. 기본적으로 객체 내부로 그려집니다.
-  **outlineColor: string / outlineWidth: number**
   테두리 바깥쪽 외곽선의 색상과 두께입니다.
-  **borderRadius: string | number**
   모서리를 둥글게 깎는 정도입니다. "10 20 10 20"이나 "50%" 같은 단축 표기법을 지원합니다.

---

## 📋 3. 타이포그래피 (Text 전용)
-  **fontSize: number**: 글자 크기(px)
-  **fontFamily: string**: 서체 이름 (기본값: `sans-serif`)
-  **fontWeight: string**: 글자 굵기 (`normal`, `bold`, `700` 등)
-  **fontStyle: string**: 글자 기울임 (`normal`, `italic`)
-  **lineHeight: number**: 줄 간격 배율 (기본값: `1.0`)
-  **letterSpacing: number**: 글자 사이의 간격(px)
-  **textAlign: 'left' | 'center' | 'right'**: 글자 정렬 방향

---

## 📋 4. 그림자 및 그라디언트 (FX)
-  **boxShadowColor / textShadowColor: string**: 그림자의 색상입니다.
-  **boxShadowBlur / textShadowBlur: number**: 그림자의 흐림 정도입니다.
-  **boxShadowSpread: number**: 그림자의 확장 크기입니다.
-  **boxShadowOffsetX / OffsetY: number**: 그림자가 물체로부터 떨어진 x, y 거리입니다.
-  **textShadowOffsetX / OffsetY: number**: 글자 그림자의 x, y 거리입니다.
-  **gradient: string**: 그라디언트 스탑 정보입니다. (예: `90deg, #ff0000 0%, #0000ff 100%`)
-  **gradientType: 'linear' | 'circular'**: 선형 또는 원형 그라디언트를 선택합니다.

---

## 📋 5. 합성 모드 (Blend Mode)
`blendMode: string` 속성에 아래 16가지 표준 합성법을 사용할 수 있습니다.
- `source-over`, `source-in`, `source-out`, `source-atop`, `destination-over`, `destination-in`, `destination-out`, `lighter`, `copy`, `xor`, `multiply`, `screen`, `lighten`, `darken`, `exclusion`, `difference`

---

## 💡 주요 속성 상세 명세 (Shorthand)

### Margin (여백) 적용 순서
숫자의 개수에 따라 적용되는 방향이 결정됩니다.
- `1개 (10)`: [상, 하, 좌, 우] 모두 10
- `2개 (10 20)`: [상, 하] 10, [좌, 우] 20
- `3개 (10 20 30)`: [상] 10, [좌, 우] 20, [하] 30
- `4개 (10 20 30 40)`: [상] 10, [우] 20, [하] 30, [좌] 40 (시계 방향)

### BorderRadius (둥글기)
- **비정형 모서리**: `'10 20 30 40'` 순서로 왼쪽 위, 오른쪽 위, 오른쪽 아래, 왼쪽 아래를 각각 다르게 깎습니다.
- **백분율(%)**: `'50%'`로 설정하면 가로와 세로 중 짧은 쪽을 기준으로 원형으로 깎습니다.
