import { World } from '../../src/index.js'

const world = new World()
const camera = world.createCamera()
world.camera = camera

// 1. 배경 레이어 그룹 생성 (Z: 100, zIndex: 1)
const backgroundLayer = world.createRectangle({
  attribute: { name: 'BackgroundLayer' },
  style: {
    transformStyle: 'flat', // Stacking Context 활성화
    zIndex: 1,
    display: 'block',
    pointerEvents: false
  },
  transform: {
    position: { x: 0, y: 0, z: 100 }
  }
})

// 배경 레이어 전용 바닥 (static)
const bgFloor = world.createRectangle({
  attribute: { name: 'bgFloor', physics: 'static', friction: 0.8 },
  style: {
    width: 900,
    height: 40,
    background: '#3d1221', // 어두운 적색 계열
    borderColor: '#ff3366',
    borderWidth: 2,
    borderRadius: 8,
  },
  transform: {
    position: { x: 0, y: -260, z: 0 }
  }
})
backgroundLayer.addChild(bgFloor)

// 2. 액터 레이어 그룹 생성 (Z: 100, zIndex: 2)
const actorLayer = world.createRectangle({
  attribute: { name: 'ActorLayer' },
  style: {
    transformStyle: 'flat', // Stacking Context 활성화
    zIndex: 2, // backgroundLayer보다 zIndex가 크므로 항상 위에 그려짐
    display: 'block',
    pointerEvents: false
  },
  transform: {
    position: { x: 0, y: 0, z: 100 }
  }
})

// 액터 레이어 전용 바닥 (static)
const actorFloor = world.createRectangle({
  attribute: { name: 'actorFloor', physics: 'static', friction: 0.8 },
  style: {
    width: 900,
    height: 40,
    background: '#123225', // 어두운 녹색 계열
    borderColor: '#00ffaa',
    borderWidth: 2,
    borderRadius: 8,
  },
  transform: {
    position: { x: 0, y: -290, z: 0 }
  }
})
actorLayer.addChild(actorFloor)

// 3. 레이어별 박스 스폰 함수
function spawnBoxes(x: number, y: number) {
  // --- 배경 레이어 박스 (Red/Orange) ---
  const bgBoxColor = `hsl(${20 + Math.random() * 30}, 90%, 60%)` // 적색/주황색 계열
  const bgBox = world.createRectangle({
    attribute: { name: 'BgBox', physics: 'dynamic', restitution: 0.6, friction: 0.2 },
    style: {
      width: 60,
      height: 60,
      background: bgBoxColor,
      boxShadowColor: bgBoxColor,
      boxShadowBlur: 15,
      borderRadius: 12,
      cursor: 'pointer',
    },
    transform: {
      position: { x, y, z: 0 },
      rotation: { z: Math.random() * 360 }
    }
  })
  backgroundLayer.addChild(bgBox)

  // 클릭 시 토크 가하기
  bgBox.on('click', (e) => {
    e.stopPropagation()
    bgBox.applyTorque((Math.random() - 0.5) * 80)
  })

  // --- 액터 레이어 박스 (Green/Teal) ---
  const actorBoxColor = `hsl(${140 + Math.random() * 30}, 95%, 50%)` // 녹색/청록색 계열
  const actorBox = world.createRectangle({
    attribute: { name: 'ActorBox', physics: 'dynamic', restitution: 0.5, friction: 0.2 },
    style: {
      width: 60,
      height: 60,
      background: actorBoxColor,
      boxShadowColor: actorBoxColor,
      boxShadowBlur: 20,
      borderRadius: 12,
      cursor: 'pointer',
    },
    transform: {
      position: { x, y, z: 0 },
      rotation: { z: Math.random() * 360 }
    }
  })
  actorLayer.addChild(actorBox)

  // 클릭 시 토크 가하기
  actorBox.on('click', (e) => {
    e.stopPropagation()
    actorBox.applyTorque((Math.random() - 0.5) * 80)
  })
}

// 4. 초기 박스 여러 개 미리 낙하
for (let i = 0; i < 5; i++) {
  spawnBoxes((Math.random() - 0.5) * 400, 100 + i * 80)
}

// 5. 화면 클릭 시 클릭 좌표에 박스 생성
world.on('click', (obj, e) => {
  if (obj) return
  // 클릭한 화면 좌표를 월드(focus Z=0) 좌표로 변환
  const { x, y } = camera.canvasToWorld(e.clientX, e.clientY)
  spawnBoxes(x, y)
})

// 6. 마우스 이동에 의한 카메라 시점 변환 (패럴랙스 입체 효과용)
window.addEventListener('mousemove', (e) => {
  if (!world.camera) return
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  world.camera.transform.position.x = (e.clientX - cx) * 0.15
  world.camera.transform.position.y = -(e.clientY - cy) * 0.15
})

// 7. 마우스 휠 줌인/아웃
window.addEventListener('wheel', (e) => {
  if (!world.camera) return
  world.camera.animate({
    transform: {
      position: {
        z: Math.min(
          Math.max(world.camera.transform.position.z + e.deltaY, -150),
          150
        )
      }
    }
  }, 100, 'easeOut')
}, { passive: true })

world.start()

console.log('Layer System Example Loaded:', world)
