import { World } from '../../src/index.js'

async function init() {
  const world = new World()
  const camera = world.createCamera()
  world.camera = camera

  // 배경 생성 구별용 텍스쳐나 작은 박스들 배치
  world.createRectangle({
    attribute: { name: 'bg' },
    style: { width: 2000, height: 2000, color: '#34495e' },
    transform: { position: { z: -100 } }
  })

  for (let i = 0; i < 50; i++) {
    world.createEllipse({
      attribute: { name: `star-${i}` },
      style: {
        width: 10 + Math.random() * 20,
        height: 10 + Math.random() * 20,
        color: '#f1c40f',
      },
      transform: {
        position: {
          x: (Math.random() - 0.5) * 1000,
          y: (Math.random() - 0.5) * 1000,
          z: -10 + Math.random() * 20
        }
      }
    })
  }

  // 1. 투명 사각형 (외곽선 + 보더 + 그림자)
  world.createRectangle({
    attribute: { name: 'rect' },
    style: {
      width: 200, height: 200,
      color: 'rgba(0, 0, 0, 0)',
      borderRadius: 20,
      borderWidth: 10,
      borderColor: 'rgba(231, 76, 60, 1)',
      outlineWidth: 5,
      outlineColor: 'rgba(46, 204, 113, 1)',
      boxShadowColor: 'black',
      boxShadowBlur: 20,
      boxShadowSpread: 10,
      boxShadowOffsetX: 30,
      boxShadowOffsetY: 30,
    },
    transform: {
      position: { x: -200, y: 0, z: 0 }
    }
  })

  // 2. 투명 원형 (외곽선 + 보더 + 그림자)
  world.createEllipse({
    attribute: { name: 'ellipse' },
    style: {
      width: 200, height: 200,
      color: 'rgba(0, 0, 0, 0)',
      borderWidth: 10,
      borderColor: 'rgba(52, 152, 219, 1)',
      outlineWidth: 5,
      outlineColor: 'rgba(155, 89, 182, 1)',
      boxShadowColor: 'rgba(0, 0, 0, 0.8)',
      boxShadowBlur: 15,
      boxShadowOffsetX: -20,
      boxShadowOffsetY: 20,
    },
    transform: {
      position: { x: 200, y: 0, z: 0 }
    }
  })

  // 3. 반투명 배경 도형 (어떻게 합쳐지는지 확인)
  world.createRectangle({
    attribute: { name: 'semi' },
    style: {
      width: 150,
      height: 150,
      color: 'rgba(241, 196, 15, 0.5)',
      borderRadius: '50%',
      borderWidth: 15,
      borderColor: 'rgba(230, 126, 34, 1)',
      boxShadowColor: 'black',
      boxShadowBlur: 50,
    },
    transform: {
      position: { x: 0, y: 200, z: 0 }
    }
  })

  world.start()
  // @ts-ignore
  window.world = world;
}

init()
