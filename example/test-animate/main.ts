import { World, Animation } from '../../src/index.js'

const world = new World()
const camera = world.createCamera()

world.camera = camera

// 1. LeviarObject.animate() 테스트
const text = world.createText({
  attribute: { text: 'Move and Fade' },
  style: { color: '#7ec8e3', zIndex: 1, fontSize: 36, opacity: 0.2, textShadowBlur: 10, textShadowColor: 'red', textShadowOffsetX: 10, textShadowOffsetY: 10 },
  transform: { position: { x: 0, y: 0, z: -100 } },
})

text.animate({
  style: { opacity: 1, fontSize: 48 },
  position: { z: 0 },
}, 2000, 'easeInOut')

// 2. 복합 대입 연산자 테스트
const box = world.createRectangle({
  style: { color: '#c77dff', width: 50, height: 50 },
  transform: { position: { x: -100, y: 50, z: 0 }, rotation: { x: 0, y: 0, z: 0 } },
})

box.animate({
  style: { width: '+=150', height: '*=2' },
  transform: { rotation: { z: '+=3.14' }, position: { x: '+=250' } },
}, 1500, 'easeOutElastic')

// 3. 순수 Animation 객체 테스트
world.createText({
  attribute: { text: 'Pure Animation Log' },
  style: { color: '#f4a261', fontSize: 24 },
  transform: { position: { x: -200, y: 200, z: 0 } },
})

const pureAnim = new Animation({
  val: 100,
})

const readout = world.createText({
  attribute: { text: '0' },
  style: { color: '#ffffff', fontSize: 32 },
  transform: { position: { x: 0, y: 200, z: 0 } },
})

pureAnim.start((state) => {
  readout.attribute.text = Math.round(state.val).toString()
}, 3000, 'easeInOutQuart')

// setTimeout(() => {
//   pureAnim.pause()
//   setTimeout(() => pureAnim.resume(), 1000)
// }, 1000)

// 4. 재귀적인 속성 (Dataset) 테스트
const dataItem = world.createText({
  attribute: { text: 'Dataset Animation' },
  dataset: {
    nested: {
      a: 0,
      b: 100
    }
  },
  style: { color: '#2ec4b6', fontSize: 20 },
  transform: { position: { x: 0, y: 300, z: 0 } },
})

dataItem.animate({
  dataset: {
    nested: {
      a: 500,
      b: 0
    }
  }
}, 2000, 'linear')

// 매 프레임 dataset 값을 텍스트로 표시
setInterval(() => {
  dataItem.attribute.text = `Data: a=${Math.round((dataItem.dataset.nested as any).a)}, b=${Math.round((dataItem.dataset.nested as any).b)}`
}, 100)

// 5. 텍스트 색상 애니메이션 (RGB 형식 변경)
const colorText = world.createText({
  attribute: { text: 'Color Interpolation' },
  style: { color: 'rgb(255, 0, 0)', fontSize: 48, zIndex: 1 },
  transform: { position: { x: 300, y: -100, z: 0 } },
})

colorText.animate({
  style: { color: 'rgb(0, 255, 0)' },
}, 2000, 'easeInOut').on('end', () => {
  colorText.animate({
    style: { color: 'rgb(0, 0, 255)' },
  }, 2000, 'easeInOut')
})

// 6. 사각형 색상 애니메이션 (HEX, RGBA, HSL 혼합)
const colorBox = world.createRectangle({
  style: { color: '#ff00ff', width: 200, height: 100 },
  transform: { position: { x: 300, y: 100, z: 0 } },
})

colorBox.animate({
  style: { color: 'rgba(255, 255, 0, 0.5)' },
  transform: { rotation: { z: 3.14 } }
}, 2000, 'easeInOut').on('end', () => {
  colorBox.animate({
    style: { color: 'hsl(180, 100%, 50%)' },
    transform: { rotation: { z: 3.14 * 2 } }
  }, 2000, 'easeInOut')
})

// 7. 그림자 색상 애니메이션
const glowingText = world.createText({
  attribute: { text: 'Glowing Text' },
  style: { color: '#ffffff', fontSize: 36, textShadowBlur: 5, textShadowOffsetX: 5, textShadowOffsetY: 5, textShadowColor: 'rgba(255, 0, 0, 0)' },
  transform: { position: { x: 300, y: 250, z: 0 } },
})

glowingText.animate({
  style: { textShadowColor: 'rgba(255, 0, 0, 1)' }
}, 1000, 'easeInOut').on('end', () => {
  glowingText.animate({
    style: { textShadowColor: 'rgba(0, 255, 255, 1)' }
  }, 1000, 'easeInOut')
})

// 8. 그라디언트 애니메이션 (단색/다중색, 각도 보간)
const gradientBox = world.createRectangle({
  style: {
    width: 300,
    height: 100,
    gradient: '90deg, rgb(255, 0, 0) 0%, rgb(0, 0, 255) 100%',
    gradientType: 'linear',
  },
  transform: { position: { x: 300, y: 400, z: 0 } },
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
