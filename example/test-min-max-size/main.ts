import { World } from '../../src/index.js'

const world = new World()
const cam = world.createCamera({ transform: { position: { z: -100 } } })
world.camera = cam

const box = world.createRectangle({
  style: {
    width: 200,
    height: 200,
    minWidth: 100,
    maxWidth: 400,
    minHeight: 100,
    maxHeight: 400,
    color: '#13132a',
    borderRadius: 16,
    borderWidth: 4,
    borderColor: '#c77dff',
  },
  transform: { position: { x: 100, y: 0, z: 0 } }
})

const text = world.createText({
  attribute: { text: '' },
  style: { textAlign: 'center' },
  transform: { position: { z: 0 } }
})
box.addChild(text)

world.start()

// UI 로직
const inputW = document.getElementById('input-width') as HTMLInputElement
const inputMinW = document.getElementById('input-min') as HTMLInputElement
const inputMaxW = document.getElementById('input-max') as HTMLInputElement
const valW = document.getElementById('val-width')!
const valMinW = document.getElementById('val-min')!
const valMaxW = document.getElementById('val-max')!

const inputH = document.getElementById('input-height') as HTMLInputElement
const inputMinH = document.getElementById('input-minh') as HTMLInputElement
const inputMaxH = document.getElementById('input-maxh') as HTMLInputElement
const valH = document.getElementById('val-height')!
const valMinH = document.getElementById('val-minh')!
const valMaxH = document.getElementById('val-maxh')!

function updateSize() {
  const w = parseFloat(inputW.value)
  const minW = parseFloat(inputMinW.value)
  const maxW = parseFloat(inputMaxW.value)

  const h = parseFloat(inputH.value)
  const minH = parseFloat(inputMinH.value)
  const maxH = parseFloat(inputMaxH.value)

  valW.innerText = w.toString()
  valMinW.innerText = minW.toString()
  valMaxW.innerText = maxW.toString()

  valH.innerText = h.toString()
  valMinH.innerText = minH.toString()
  valMaxH.innerText = maxH.toString()

  box.style.width = w
  box.style.minWidth = minW
  box.style.maxWidth = maxW

  box.style.height = h
  box.style.minHeight = minH
  box.style.maxHeight = maxH

  const actualW = Math.max(minW, Math.min(w, maxW))
  const actualH = Math.max(minH, Math.min(h, maxH))

  text.attribute.text = `<style fontSize="18" color="#fff" lineHeight="1.5">W: <style color="#aaa">${w}</style> | H: <style color="#aaa">${h}</style>
Min W: <style color="#7ec8e3">${minW}</style> | Max W: <style color="#ff7eb3">${maxW}</style>
Min H: <style color="#7ec8e3">${minH}</style> | Max H: <style color="#ff7eb3">${maxH}</style>

<style fontSize="24" color="#c77dff" fontWeight="bold">Actual: ${actualW} x ${actualH}</style></style>`
}

inputW.addEventListener('input', updateSize)
inputMinW.addEventListener('input', updateSize)
inputMaxW.addEventListener('input', updateSize)
inputH.addEventListener('input', updateSize)
inputMinH.addEventListener('input', updateSize)
inputMaxH.addEventListener('input', updateSize)

updateSize()
