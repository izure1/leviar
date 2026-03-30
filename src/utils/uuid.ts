/**
 * RFC4122 v4 UUID 생성기 (외부 의존성 없는 순수 구현)
 */
export function v4(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)

  // version 4
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  // variant bits
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0'))
  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-')
}
