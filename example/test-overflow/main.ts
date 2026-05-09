import { World } from '../../src/index.js'

const world = new World()
const camera = world.createCamera()
world.camera = camera

// 부모 요소 (overflow: hidden)
const parent = world.createRectangle({
  style: { background: '#ff5555', width: 200, height: 200, overflow: 'hidden', borderWidth: 1, borderColor: '#ffffff' },
  transform: { position: { x: 0, y: 0, z: 0 } }
})

// 자식 요소 (부모 영역 밖으로 벗어남)
const child = world.createRectangle({
  style: { background: '#5555ff', width: 180, height: 180 },
  transform: { position: { x: 150, y: 0, z: 0 } }
})

parent.addChild(child)

world.on('update', () => {
  // 회전 애니메이션
  child.transform.rotation.z += 1
  parent.transform.rotation.z += 1
})
world.start()

console.log(world)
