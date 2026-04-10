import { World } from '../../src/index.js'

const world = new World()
const camera = world.createCamera()

world.camera = camera

// 1. 텍스트 색상 애니메이션 (RGB 형식 변경)
const text = world.createText({
  attribute: { text: 'Color Interpolation' },
  style: { color: 'rgb(255, 0, 0)', fontSize: 48, zIndex: 1 },
  transform: { position: { x: 0, y: -100, z: 0 } },
})

text.animate({
  style: { color: 'rgb(0, 255, 0)' },
}, 2000, 'easeInOut').on('end', () => {
  text.animate({
    style: { color: 'rgb(0, 0, 255)' },
  }, 2000, 'easeInOut')
})

// 2. 사각형 색상 애니메이션 (HEX, RGBA, HSL 혼합)
const box = world.createRectangle({
  style: { color: '#ff00ff', width: 200, height: 100 },
  transform: { position: { x: 0, y: 100, z: 0 } },
})

// #ff00ff -> rgba(255, 255, 0, 0.5) -> hsl(180, 100%, 50%)
box.animate({
  style: { color: 'rgba(255, 255, 0, 0.5)' },
  transform: { rotation: { z: 3.14 } }
}, 2000, 'easeInOut').on('end', () => {
  box.animate({
    style: { color: 'hsl(180, 100%, 50%)' },
    transform: { rotation: { z: 3.14 * 2 } }
  }, 2000, 'easeInOut')
})

// 3. 그림자 색상 애니메이션
const glowingText = world.createText({
  attribute: { text: 'Glowing Text' },
  style: { color: '#ffffff', fontSize: 36, textShadowBlur: 5, textShadowOffsetX: 5, textShadowOffsetY: 5, textShadowColor: 'rgba(255, 0, 0, 0)' },
  transform: { position: { x: 0, y: 250, z: 0 } },
})

glowingText.animate({
  style: { textShadowColor: 'rgba(255, 0, 0, 1)' }
}, 1000, 'easeInOut').on('end', () => {
  glowingText.animate({
    style: { textShadowColor: 'rgba(0, 255, 255, 1)' }
  }, 1000, 'easeInOut')
})

// 4. 그라디언트 애니메이션 (단색/다중색, 각도 보간)
const gradientBox = world.createRectangle({
  style: {
    width: 300,
    height: 100,
    gradient: '90deg, rgb(255, 0, 0) 0%, rgb(0, 0, 255) 100%',
    gradientType: 'linear',
  },
  transform: { position: { x: 0, y: 400, z: 0 } },
})

gradientBox.animate({
  style: {
    gradient: '270deg, rgb(0, 255, 0) 20%, rgb(255, 255, 0) 80%'
  }
}, 3000, 'easeInOut').on('end', () => {
  gradientBox.animate({
    style: {
      gradient: '90deg, rgb(255, 0, 0) 0%, rgb(0, 0, 255) 100%'
    }
  }, 3000, 'easeInOut')
})

world.start()
