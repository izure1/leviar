import { World } from '../../src/index.js'

// ── World 초기화 ─────────────────────────────────────────────────────────────

const world = new World()
const camera = world.createCamera()
world.camera = camera

// 사이드바(300px) 영역만큼 카메라 중심을 오른쪽으로 오프셋
camera.transform.position.x = 150

await world.loader.load({
  girl: '../asset/image/girl_sd.png',
})

// ── 캐릭터 이미지 생성 ─────────────────────────────────────────────────────────

const img = world.createImage({
  style: { width: 500 },
  transform: { position: { x: 0, y: 0, z: 2000 }, pivot: { x: 0.5, y: 0.5 } },
})
img.attribute.src = 'girl'

// ── DOM 유틸리티 ──────────────────────────────────────────────────────────────

function el<T extends HTMLElement = HTMLElement>(id: string): T {
  return document.getElementById(id) as T
}

// ── 실시간 성능 제어 및 렌더 스타일 동기화 ────────────────────────────────────

function updateImageState() {
  const scaleRange = el<HTMLInputElement>('scale-range')
  const sizeRange = el<HTMLInputElement>('size-range')
  const cbShadow = el<HTMLInputElement>('cb-shadow')
  const cbOutline = el<HTMLInputElement>('cb-outline')
  const shadowBlurRange = el<HTMLInputElement>('shadow-blur')

  const scaleVal = parseFloat(scaleRange.value)
  const sizeVal = parseInt(sizeRange.value, 10)
  const shadowOn = cbShadow.checked
  const outlineOn = cbOutline.checked
  const shadowBlur = parseInt(shadowBlurRange.value, 10)

  // 1. Transform Scale 반영
  img.transform.scale.x = scaleVal
  img.transform.scale.y = scaleVal

  // 2. Style Dimensions (width) 반영 (정비율 유지를 위해 높이는 넓이에 비례하도록 라이브러리 내부 처리)
  img.style.width = sizeVal

  // 3. 알파 셰이더 부하 기능 (Shadow / Outline) 적용 및 비활성화
  img.style.boxShadowColor = shadowOn ? 'rgba(120, 0, 220, 0.8)' : undefined
  img.style.boxShadowBlur = shadowOn ? shadowBlur : undefined
  img.style.boxShadowOffsetX = shadowOn ? 0 : undefined
  img.style.boxShadowOffsetY = shadowOn ? 0 : undefined
  img.style.boxShadowSpread = shadowOn ? 0 : undefined

  img.style.outlineColor = outlineOn ? 'rgba(0, 240, 200, 0.8)' : undefined
  img.style.outlineWidth = outlineOn ? 4 : undefined
  img.style.borderColor = outlineOn ? 'rgba(255, 80, 80, 0.8)' : undefined
  img.style.borderWidth = outlineOn ? 4 : undefined
}

// ── 슬라이더 및 체크박스 이벤트 바인딩 ────────────────────────────────────────

const bindSlider = (rangeId: string, valId: string, suffix = '') => {
  const input = el<HTMLInputElement>(rangeId)
  const valEl = el(valId)
  valEl.textContent = input.value + suffix

  input.addEventListener('input', () => {
    valEl.textContent = input.value + suffix
    updateImageState()
  })
}

bindSlider('scale-range', 'scale-val')
bindSlider('size-range', 'size-val', 'px')
bindSlider('shadow-blur', 'shadow-blur-val')

const shadowRow = el('shadow-blur-row')
const shadowCb = el<HTMLInputElement>('cb-shadow')

shadowCb.addEventListener('change', () => {
  const shadowOn = shadowCb.checked
  shadowRow.style.opacity = shadowOn ? '1' : '0.4'
  shadowRow.style.pointerEvents = shadowOn ? 'auto' : 'none'
  updateImageState()
})

el('cb-outline').addEventListener('change', updateImageState)

// ── 리셋 기능 ─────────────────────────────────────────────────────────────────

el('reset-btn').addEventListener('click', () => {
  el<HTMLInputElement>('scale-range').value = '1'
  el<HTMLInputElement>('size-range').value = '500'
  el<HTMLInputElement>('cb-shadow').checked = true
  el<HTMLInputElement>('cb-outline').checked = true
  el<HTMLInputElement>('shadow-blur').value = '20'

  el('scale-val').textContent = '1.0'
  el('size-val').textContent = '500px'
  el('shadow-blur-val').textContent = '20'
  
  shadowRow.style.opacity = '1'
  shadowRow.style.pointerEvents = 'auto'

  updateImageState()
})

// ── 실시간 FPS 카운터 구현 ────────────────────────────────────────────────────

let lastTime = performance.now()
let frameCount = 0
let fps = 60
const fpsVal = el('fps-val')

world.on('update', (timestamp) => {
  frameCount++
  const elapsed = timestamp - lastTime
  if (elapsed >= 500) {
    fps = Math.round((frameCount * 1000) / elapsed)
    frameCount = 0
    lastTime = timestamp

    if (fpsVal) {
      fpsVal.textContent = String(fps)
      if (fps >= 50) {
        fpsVal.style.color = '#00ffcc' // 녹색 계열 (최상)
      } else if (fps >= 30) {
        fpsVal.style.color = '#ffcc00' // 노란색 (보통)
      } else {
        fpsVal.style.color = '#ff3333' // 빨간색 (부하 심함)
      }
    }
  }
})

// ── 엔진 시작 ─────────────────────────────────────────────────────────────────

updateImageState()
world.start()
