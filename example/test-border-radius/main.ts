import { World } from '../../src/index.js'

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const world = new World(canvas)
const camera = world.createCamera()

world.camera = camera

// 1. 단일 픽셀 반경 측정
world.createRectangle({
  style: {
    width: 100,
    height: 100,
    color: '#ff4d4d',
    borderRadius: 20,
    boxShadowColor: 'rgba(255, 77, 77, 0.5)',
    boxShadowBlur: 10,
    boxShadowSpread: 5
  },
  transform: { position: { x: -200, y: 150, z: 0 } }
})

// 2. 4가지 값 단위 CSS 표기
world.createRectangle({
  style: {
    width: 120,
    height: 80,
    color: '#4dff4d',
    borderRadius: '10 20 40 10',
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  transform: { position: { x: 0, y: 150, z: 0 } }
})

// 3. 퍼센티지 및 복합 표기
world.createRectangle({
  style: {
    width: 100,
    height: 150,
    color: '#4d4dff',
    borderRadius: '50% 10',
    boxShadowColor: '#4d4dff',
    boxShadowBlur: 20
  },
  transform: { position: { x: 200, y: 150, z: 0 } }
})

// 4. 그라디언트 + 두꺼운 테두리 및 그림자 복합 검증
world.createRectangle({
  style: {
    width: 200,
    height: 100,
    gradient: '45deg, #ff00cc 0%, #333399 100%',
    borderRadius: '30',
    outlineColor: '#ffffff',
    outlineWidth: 5,
    borderWidth: 5,
    borderColor: '#00ffff',
    boxShadowColor: '#ff00cc',
    boxShadowBlur: 15,
    boxShadowSpread: 10
  },
  transform: { position: { x: 0, y: -100, z: 0 } }
})

world.start()
