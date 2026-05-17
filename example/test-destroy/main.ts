import { World } from '../../src/index.js'

let world: World | null = new World({ disableContextMenu: true })
const camera = world.createCamera()
world.camera = camera

// 에셋 매니저 및 비디오 테스트
world.loader.load({
  'sample_video': '../asset/video/sample.mp4'
}).then(() => {
  if (!world) return

  world.videoManager.create({
    name: 'test_clip',
    src: 'sample_video',
    loop: true
  })

  // 재생 중인 비디오 객체 생성
  const video = world.createVideo({
    attribute: { src: 'test_clip' },
    style: { width: 640, height: 360, background: '#111', borderRadius: 16 },
    transform: { position: { x: 0, y: 0, z: 0 } }
  })
  video.play()

  // 물리 객체 생성
  for (let i = 0; i < 50; i++) {
    world.createRectangle({
      attribute: { physics: 'dynamic', density: 0.05, restitution: 0.8 },
      style: { width: 20, height: 20, background: `hsl(${Math.random() * 360}, 80%, 60%)`, borderRadius: 4 },
      transform: { position: { x: (Math.random() - 0.5) * 400, y: (Math.random() - 0.5) * 400, z: 10 } }
    })
  }

  // 바닥 생성
  world.createRectangle({
    attribute: { physics: 'static' },
    style: { width: 800, height: 40, background: '#555' },
    transform: { position: { x: 0, y: -250, z: 10 } }
  })
})

// 클릭 시 월드 파괴
world.on('click', () => {
  if (!world) return

  console.log('[Test] Destroying World...')
  world.destroy()
  
  // 참조 해제
  world = null

  // UI 업데이트
  const ui = document.getElementById('ui')
  if (ui) {
    ui.innerHTML = '<b>World Destroyed!</b><br/>All objects, videos, WebGL contexts, and Physics bodies should be cleaned up.<br/>Check console for any errors or check memory profile.'
    ui.style.color = '#ff5555'
  }
})

world.start()
