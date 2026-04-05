import { World } from '../../src'
const world = new World()

const cam = world.createCamera({ transform: { position: { z: 150 } } })
world.camera = cam

const child = world.createRectangle({
  style: { width: 400, height: 400, color: '#0000ffff' },
  transform: { position: { z: 100, x: -100 } },
  attribute: { name: 'child' }
})
cam.addChild(child)

const worldObj = world.createRectangle({
  style: { width: 400, height: 400, color: '#ff0000ff' },
  transform: { position: { z: 200, x: 100 } },
  attribute: { name: 'worldObj' }
})

world.start()
