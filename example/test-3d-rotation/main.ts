import { World } from '../../src/index.js'

const world = new World()

await world.loader.load({
  'logo': '../asset/image/logo.png',
  'video': '../asset/video/sample.mp4',
  'sprite': '../asset/image/sprite.png',
})

world.spriteManager.create({
  name: 'play',
  src: 'sprite',
  frameWidth: 44,
  frameHeight: 40,
  frameRate: 10,
  loop: true,
  start: 0,
  end: 10,
})

world.videoManager.create({
  name: 'sample',
  src: 'video',
  loop: true,
  start: 0,
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
  transform: { position: { x: 0, y: 0, z: 0 }, pivot: { x: 0.5, y: 0.5 } }
})
img2.play('logo')

world.createText({
  attribute: { text: 'Click to Flip Y\n(Horizontal)' },
  style: { color: '#aaaaaa', fontSize: 16, textAlign: 'center', pointerEvents: false },
  transform: { position: { x: 0, y: -150, z: 0 } }
})

// 3. 비디오 객체 - X/Y 모두 뒤집기
const vid = world.createVideo({
  transform: { position: { x: 250, y: 0, z: 0 }, pivot: { x: 0.5, y: 0.5 } }
})
vid.play('sample')

world.createText({
  attribute: { text: 'Video (Flip X+Y)' },
  style: { color: '#aaaaaa', fontSize: 16, textAlign: 'center', pointerEvents: false },
  transform: { position: { x: 250, y: -150, z: 0 } }
})

// 4. 스프라이트 객체
const spr = world.createSprite({
  style: { width: 132, height: 120 },
  transform: { position: { x: -250, y: 250, z: 0 }, pivot: { x: 0.5, y: 0.5 } }
})
spr.play('play')

world.createText({
  attribute: { text: 'Sprite (Flip X)' },
  style: { color: '#aaaaaa', fontSize: 16, textAlign: 'center', pointerEvents: false },
  transform: { position: { x: -250, y: 150, z: 0 } }
})

// 5. 사각형 (Rectangle)
const rect = world.createRectangle({
  style: { width: 150, height: 150, color: '#fca311' },
  transform: { position: { x: 0, y: 250, z: 0 }, pivot: { x: 0.5, y: 0.5 } }
})

world.createText({
  attribute: { text: 'Rect (Flip Y)' },
  style: { color: '#aaaaaa', fontSize: 16, textAlign: 'center', pointerEvents: false },
  transform: { position: { x: 0, y: 150, z: 0 } }
})

// 6. 원형 (Ellipse)
const circle = world.createEllipse({
  style: { width: 150, height: 150, color: '#e63946' },
  transform: { position: { x: 250, y: 250, z: 0 }, pivot: { x: 0.5, y: 0.5 } }
})

world.createText({
  attribute: { text: 'Ellipse (Flip Y)' },
  style: { color: '#aaaaaa', fontSize: 16, textAlign: 'center', pointerEvents: false },
  transform: { position: { x: 250, y: 150, z: 0 } }
})

// 애니메이션 상호작용
let flipX = false
img1.on('click', () => {
  flipX = !flipX
  img1.animate({
    transform: { rotation: { x: flipX ? 360 : 0 } }
  }, 600, 'easeOutBack')
})

let flipY = false
img2.on('click', () => {
  flipY = !flipY
  img2.animate({
    transform: { rotation: { y: flipY ? 360 : 0 } }
  }, 600, 'easeOutBack')
})

let flipVid = false
vid.on('click', () => {
  flipVid = !flipVid
  vid.animate({
    transform: { rotation: { x: flipVid ? 360 : 0, y: flipVid ? 360 : 0 } }
  }, 600, 'easeOutBack')
})

let flipSpr = false
spr.on('click', () => {
  flipSpr = !flipSpr
  spr.animate({ transform: { rotation: { x: flipSpr ? 360 : 0 } } }, 600, 'easeOutBack')
})

let flipRect = false
rect.on('click', () => {
  flipRect = !flipRect
  rect.animate({ transform: { rotation: { y: flipRect ? 360 : 0 } } }, 600, 'easeOutBack')
})

let flipCircle = false
circle.on('click', () => {
  flipCircle = !flipCircle
  circle.animate({ transform: { rotation: { y: flipCircle ? 360 : 0 } } }, 600, 'easeOutBack')
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
