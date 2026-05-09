import { World } from '../../src/index.js'

const world = new World()
const camera = world.createCamera({ transform: { position: { z: -100 } } })
world.camera = camera

// 테스트를 위한 이미지 에셋 (기존 에셋 재활용)
await world.loader.load({
  'sample_img': '../asset/image/girl_sd.png' // 적절한 이미지 키
})

const label = (text: string, x: number, y: number) => {
  world.createText({
    attribute: { text },
    style: { color: '#ffffff', fontSize: 16, textAlign: 'center', fontWeight: 'bold' },
    transform: { position: { x, y, z: 0 } }
  })
}

// ─── 1. Solid Color (단색 배경) ───────────────────────────
world.createRectangle({
  style: {
    width: 200,
    height: 150,
    background: '#ff5e5b', // HEX
    borderRadius: 12,
  },
  transform: { position: { x: -300, y: -200, z: 0 } }
})
label('Solid Color\n(#ff5e5b)', -300, -100)


// ─── 2. Linear Gradient (선형 그라디언트) ──────────────────────
world.createRectangle({
  style: {
    width: 200,
    height: 150,
    background: 'linear-gradient(45deg, #00cecb 0%, #ffed66 100%)',
    borderRadius: 12,
  },
  transform: { position: { x: 0, y: -200, z: 0 } }
})
label('Linear Gradient\n(45deg)', 0, -100)


// ─── 3. Radial Gradient (원형 그라디언트) ──────────────────────
world.createRectangle({
  style: {
    width: 200,
    height: 150,
    background: 'radial-gradient(#ffffff 0%, #c77dff 50%, #1a1a3e 100%)',
    borderRadius: 12,
  },
  transform: { position: { x: 300, y: -200, z: 0 } }
})
label('Radial Gradient', 300, -100)


// ─── 4. Image URL - Auto (원본/늘리기) ────────────────────────
world.createRectangle({
  style: {
    width: 200,
    height: 150,
    background: "url('sample_img')",
    backgroundSize: 'auto',
    borderRadius: 12,
  },
  transform: { position: { x: -300, y: 150, z: 0 } }
})
label("Image url(...)\nsize: 'auto'", -300, 250)


// ─── 5. Image URL - Cover (비율 유지 꽉 채우기) ──────────────────
world.createRectangle({
  style: {
    width: 200,
    height: 150,
    background: "url('sample_img')",
    backgroundSize: 'cover',
    borderRadius: 12,
  },
  transform: { position: { x: 0, y: 150, z: 0 } }
})
label("Image url(...)\nsize: 'cover'", 0, 250)


// ─── 6. Image URL - Contain (비율 유지 모두 보이기) ────────────────
world.createRectangle({
  style: {
    width: 200,
    height: 150,
    background: "url('sample_img')",
    backgroundSize: 'contain',
    borderRadius: 12,
    color: '#333333' // 빈 공간 배경색용 (추후 기능 논의)
  },
  transform: { position: { x: 300, y: 150, z: 0 } }
})
label("Image url(...)\nsize: 'contain'", 300, 250)


// 마우스 무브 패럴랙스
window.addEventListener('mousemove', (e) => {
  if (!world.camera) return
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  world.camera.transform.position.x = (e.clientX - cx) * 0.05
  world.camera.transform.position.y = (e.clientY - cy) * 0.05
})

world.start()
