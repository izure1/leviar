import { World } from '../../src/index.js'

const world = new World()
const camera = world.createCamera({
  transform: { position: { z: -100 } }
})
world.camera = camera

// ── 레이블 헬퍼 ──────────────────────────────────────────────────────────────
const label = (text: string, x: number, y: number) => world.createText({
  attribute: { text, className: 'label' },
  style: { color: '#aabbcc', fontSize: 14, textAlign: 'center' },
  transform: { position: { x, y, z: 0 } }
})

const shapes: any[] = []

// ── 1. Rectangle - linear (0deg 생략, 위→아래) ────────────────────────────────
shapes.push(world.createRectangle({
  style: {
    width: 160,
    height: 100,
    background: 'linear-gradient(rgb(100, 180, 255) 0%, rgb(30, 60, 180) 100%)',
  },
  transform: { position: { x: -260, y: -120, z: 0 } }
}))
label('linear (0deg\n생략)', -260, -50)

// ── 2. Rectangle - linear (90deg, 좌→우) ─────────────────────────────────────
shapes.push(world.createRectangle({
  style: {
    width: 160,
    height: 100,
    background: 'linear-gradient(90deg, rgb(255, 100, 100) 0%, rgb(255, 200, 50) 100%)',
  },
  transform: { position: { x: -80, y: -120, z: 0 } }
}))
label('linear 90deg', -80, -50)

// ── 3. Rectangle - linear (45deg, 대각선) ────────────────────────────────────
shapes.push(world.createRectangle({
  style: {
    width: 160,
    height: 100,
    background: 'linear-gradient(45deg, rgb(0, 220, 130) 0%, rgb(0, 80, 200) 100%)',
  },
  transform: { position: { x: 100, y: -120, z: 0 } }
}))
label('linear 45deg', 100, -50)

// ── 4. Rectangle - radial ─────────────────────────────────────────────────────
shapes.push(world.createRectangle({
  style: {
    width: 160,
    height: 100,
    background: 'radial-gradient(rgb(255, 255, 100) 0%, rgb(200, 50, 0) 100%)',
  },
  transform: { position: { x: 280, y: -120, z: 0 } }
}))
label('radial', 280, -50)

// ── 5. Ellipse - linear ──────────────────────────────────────────────────────
shapes.push(world.createEllipse({
  style: {
    width: 160,
    height: 100,
    background: 'linear-gradient(rgb(220, 100, 255) 0%, rgb(60, 20, 180) 100%)',
  },
  transform: { position: { x: -260, y: 80, z: 0 } }
}))
label('ellipse linear', -260, 150)

// ── 6. Ellipse - radial ───────────────────────────────────────────────────────
shapes.push(world.createEllipse({
  style: {
    width: 100,
    height: 100,
    background: 'radial-gradient(rgb(255, 255, 255) 0%, rgb(20, 200, 100) 50%, rgba(0, 50, 130, 0) 100%)',
  },
  transform: { position: { x: -80, y: 80, z: 0 } }
}))
label('ellipse radial', -80, 150)

// ── 7. 단색 배경 ──────────────────────────────────────────────────────────────
shapes.push(world.createRectangle({
  style: {
    width: 160,
    height: 100,
    background: 'rgb(40, 40, 80)',
  },
  transform: { position: { x: 100, y: 80, z: 0 } }
}))
label('color', 100, 150)

// ── 8. 다중 stops ────────────────────────────────────────────────────────────
shapes.push(world.createRectangle({
  style: {
    width: 160,
    height: 100,
    background: 'linear-gradient(90deg, rgb(255,0,0) 0%, rgb(255,165,0) 25%, rgb(255,255,0) 50%, rgb(0,200,100) 75%, rgb(100,100,255) 100%)',
  },
  transform: { position: { x: 280, y: 80, z: 0 } }
}))
label('multi-stop\nrainbow', 280, 150)

world.on('update', (time) => {
  const scale = 1 + Math.sin(time * 0.002) * 0.2
  shapes.forEach((obj) => {
    if (obj) {
      obj.transform.rotation.z += 0.5
      obj.transform.scale.x = scale
      obj.transform.scale.y = scale
    }
  })
})

world.start()
