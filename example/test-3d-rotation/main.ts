import { World } from '../../src/index.js'

const world = new World()

await world.loader.load({
  'logo': '../asset/image/logo.png',
})

// 타이틀 텍스트
world.createText({
  attribute: { text: '3D Rotation (Card Flip) Test' },
  style: { color: '#ffffff', fontSize: 24, textAlign: 'center' },
  transform: { position: { x: 0, y: 200, z: 0 } },
})

// 1. X축 롤링 (위아래로 뒤집기)
const img1 = world.createImage({
  transform: { position: { x: -250, y: 0, z: 0 }, pivot: { x: 0.5, y: 0.5 } }
})
img1.play('logo')

world.createText({
  attribute: { text: 'Click to Flip X\n(Vertical)' },
  style: { color: '#aaaaaa', fontSize: 16, textAlign: 'center', pointerEvents: false },
  transform: { position: { x: -250, y: -150, z: 0 } }
})

// 2. Y축 롤링 (좌우로 뒤집기)
const img2 = world.createImage({
  transform: { position: { x: 250, y: 0, z: 0 }, pivot: { x: 0.5, y: 0.5 } }
})
img2.play('logo')

world.createText({
  attribute: { text: 'Click to Flip Y\n(Horizontal)' },
  style: { color: '#aaaaaa', fontSize: 16, textAlign: 'center', pointerEvents: false },
  transform: { position: { x: 250, y: -150, z: 0 } }
})

// 애니메이션 상호작용
let flipX = false
img1.on('click', () => {
  flipX = !flipX
  const animation = img1.animate({
    transform: { rotation: { x: flipX ? 360 : 0 } }
  }, 600, 'easeOutBack')
  animation.on('complete', () => {
    img1.transform.rotation.x = 0
    console.log('animation complete')
  })
})

let flipY = false
img2.on('click', () => {
  flipY = !flipY
  const animation = img2.animate({
    transform: { rotation: { y: flipY ? 360 : 0 } }
  }, 600, 'easeOutBack')
  animation.on('complete', () => {
    img2.transform.rotation.y = 0
    console.log('animation complete')
  })
})

// 마우스 움직임에 따른 카메라 기울임 (3D 입체감 확인용)
const camera = world.createCamera()
world.camera = camera
window.addEventListener('mousemove', (e) => {
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  camera.transform.position.x = (e.clientX - cx) * 0.1
  camera.transform.position.y = -(e.clientY - cy) * 0.1
})

// 마우스 휠에 따른 카메라 Z축 회전
window.addEventListener('wheel', (e) => {
  camera.transform.rotation.z += e.deltaY * 0.05
}, { passive: true })

world.start()
