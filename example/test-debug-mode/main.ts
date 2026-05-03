import { World } from '../../src/index.js'

const world = new World()
world.camera = world.createCamera()

// 1. 기본 사각형 (마진 없음, 클릭/호버 테스트용)
const rectBase = world.createRectangle({
  attribute: { id: 'rect-base' },
  style: {
    width: 150,
    height: 150,
    color: '#3498db',
    borderRadius: '16px',
  },
  transform: { position: { x: -200, y: 100, z: 50 } }
})

// 2. 마진이 있는 텍스트 (마진 시각화 확인용)
const textMargin = world.createText({
  attribute: { id: 'text-margin', text: 'Text with Margin' },
  style: {
    color: '#ffffff',
    fontSize: 20,
    margin: '30 50 10 20', // 상 우 하 좌
    borderRadius: '8px',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  transform: { position: { x: 150, y: 100, z: 50 } }
})

// 3. 회전 및 뎁스가 다른 중첩 객체 (Depth 색상, Transform 확인용)
const parentRect = world.createRectangle({
  attribute: { id: 'parent-rect' },
  style: {
    width: 200,
    height: 200,
    color: 'rgba(231, 76, 60, 0.5)',
    margin: '20px',
  },
  transform: {
    position: { x: 0, y: -150, z: 100 },
    rotation: { x: 0, y: 0, z: 45 }
  }
})

const childEllipse = world.createEllipse({
  attribute: { id: 'child-ellipse' },
  style: {
    width: 80,
    height: 80,
    color: '#f1c40f',
  },
  transform: {
    position: { x: 0, y: 50, z: 50 } // 부모보다 카메라에 가깝게
  }
})

parentRect.addChild(childEllipse)

// UI 버튼 연동
const toggleBtn = document.getElementById('toggle-btn')!
toggleBtn.addEventListener('click', () => {
  world.debugMode = !world.debugMode
  if (world.debugMode) {
    toggleBtn.textContent = 'Debug Mode: ON'
    toggleBtn.classList.add('active')
  } else {
    toggleBtn.textContent = 'Debug Mode: OFF'
    toggleBtn.classList.remove('active')
  }
})

world.start()
