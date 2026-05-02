/**
 * CSS 스타일 문자열을 파싱하는 유틸리티 함수들
 */

/**
 * CSS margin 문자열 또는 숫자를 {top, right, bottom, left} 형태로 변환합니다.
 * CSS 단축 표기(1~4값) 및 단위 없는 숫자 표기를 모두 지원합니다.
 * @param value margin 속성값 (예: '10', '10 20', '10px 20px', '10 20 30 40')
 * @returns { top, right, bottom, left } 픽셀 기반 마진 값
 */
export function parseMargin(value: string | number | undefined): { top: number; right: number; bottom: number; left: number } {
  const zero = { top: 0, right: 0, bottom: 0, left: 0 }
  if (value == null) return zero

  if (typeof value === 'number') {
    return { top: value, right: value, bottom: value, left: value }
  }

  const tokens = value.trim().split(/\s+/).map(t => parseFloat(t) || 0)

  if (tokens.length === 0) return zero
  if (tokens.length === 1) return { top: tokens[0], right: tokens[0], bottom: tokens[0], left: tokens[0] }
  if (tokens.length === 2) return { top: tokens[0], right: tokens[1], bottom: tokens[0], left: tokens[1] }
  if (tokens.length === 3) return { top: tokens[0], right: tokens[1], bottom: tokens[2], left: tokens[1] }
  return { top: tokens[0], right: tokens[1], bottom: tokens[2], left: tokens[3] }
}

/**
 * CSS borderRadius 문자열 또는 숫자를 4개의 픽셀 반경(Top-Left, Top-Right, Bottom-Right, Bottom-Left)으로 변환합니다.
 * 백분율(%) 사용 시 너비와 높이 중 짧은 분절을 기준으로 원형 비율을 산출합니다.
 * @param value borderRadius 속성값
 * @param w 객체의 렌더링된 너비
 * @param h 객체의 렌더링된 높이
 * @param bw 보더 두께 (옵션) - 외부 테두리 곡선 평행을 위해 반경에 가산
 * @returns 4개의 픽셀 기반 모서리 반경 배열 [TL, TR, BR, BL]
 */
export function parseBorderRadius(
  value: string | number | undefined,
  w: number,
  h: number,
  bw: number = 0
): [number, number, number, number] {
  if (value == null) return [0, 0, 0, 0]

  let tl = 0, tr = 0, br = 0, bl = 0

  if (typeof value === 'number') {
    tl = tr = br = bl = value
  } else {
    const tokens = value.trim().split(/\s+/)
    if (tokens.length === 0) return [0, 0, 0, 0]

    const parseToken = (t: string) => {
      if (t.endsWith('%')) {
        const p = parseFloat(t) / 100
        return Math.min(w, h) * p
      }
      return parseFloat(t) || 0
    }

    const t0 = parseToken(tokens[0])
    const t1 = tokens.length > 1 ? parseToken(tokens[1]) : t0
    const t2 = tokens.length > 2 ? parseToken(tokens[2]) : t0
    const t3 = tokens.length > 3 ? parseToken(tokens[3]) : t1

    tl = t0
    tr = t1
    br = t2
    bl = t3
  }

  const expand = (r: number) => r === 0 ? 0 : Math.max(0, r + bw)

  return [expand(tl), expand(tr), expand(br), expand(bl)]
}
